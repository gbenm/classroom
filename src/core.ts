import { mkdirSync, readFileSync } from "fs"
import { parse } from "csv-parse/sync"

import { ConfigGenerator, Config, Student } from "./cli-config/ghcl.types"
import * as utils from "./cli-config/utils"
import { fromCurrentDir } from "./utils"
import { InitialStep } from "./evaluation-process/steps/initial"
import { BufferStep } from "./evaluation-process/steps/buffer"
import { ShowProgress } from "./evaluation-process/steps/show-process"
import { CloneProcessStep } from "./evaluation-process/steps/clone"
import { GradeProcessStep } from "./evaluation-process/steps/grade"
import { WriteProcessStep } from "./evaluation-process/steps/write"
import { Process } from "./process/process"
import { FinalStep } from "./evaluation-process/steps/final"

const getStudents = (config: Config): Student[] => {
  const csv = readFileSync(fromCurrentDir(config.classroomFile))
  const students = parse(csv, {
    columns: true,
    skip_empty_lines: true
  })

  return students
}

const showCloneProgress = (progres: number, total: number): string => {
  return `\x1b[33m\x1b[1mClone Progress:\x1b[0m \x1b[33m${progres}/${total}\x1b[0m`
}

const showGradeProgress = (progres: number, total: number): string => {
  return `\x1b[36m\x1b[1mGrade Progress:\x1b[0m \x1b[33m${progres}/${total}\x1b[0m`
}


const showCompletedProgress = (progres: number, total: number): string => {
  return `\x1b[32m\x1b[1mCompleted Progress:\x1b[0m \x1b[33m${progres}/${total}\x1b[0m`
}

const prepare = (config: Config): InitialStep => {
  const reposDir = "repos"
  mkdirSync(fromCurrentDir(reposDir), { recursive: true })

  const students = config.filter ?
    getStudents(config).filter(config.filter) :
    getStudents(config)

  process.chdir(reposDir)

  let bufferSize

  switch(config.executeBy) {
    case "step":
      bufferSize = students.length
      break
    case "student":
      bufferSize = 1
      break
    default:
      throw new Error(`Unknown execution mode: ${config.executeBy}`)
  }

  const gradeLauncher = new Process(config, config.grader?.cmd ?? [], config.grader?.byStudent ?? false)

  const initialStep = new InitialStep(config, students)
  const buffer = new BufferStep(config, bufferSize)
  const showProgress = new ShowProgress(config, students.length, showCloneProgress)
  const cloneStep = new CloneProcessStep(config)
  const gradeStep = new GradeProcessStep(config, gradeLauncher)
  const showGradeProcess = showProgress.clone(showGradeProgress)
  const gradeBuffer = buffer.clone()
  const writeStep = new WriteProcessStep(config)
  const showCompletedProcess = showProgress.clone(showCompletedProgress)
  const finalBuffer = new BufferStep(config, students.length)
  const finalStep = new FinalStep(config, [ gradeLauncher ])

  initialStep.setNext(cloneStep)
  cloneStep.setNext(showProgress)
  showProgress.setNext(buffer)
  buffer.setNext(gradeStep)
  gradeStep.setNext(showGradeProcess)
  showGradeProcess.setNext(gradeBuffer)
  gradeBuffer.setNext(writeStep)
  writeStep.setNext(showCompletedProcess)
  showCompletedProcess.setNext(finalBuffer)
  finalBuffer.setNext(finalStep)

  return initialStep
}

export default function ({ config: generate }: { config: ConfigGenerator }): void {
  const config = generate(utils)

  const initialStep = prepare(config)

  initialStep.start()
}
