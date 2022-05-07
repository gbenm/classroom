import { mkdirSync, readFileSync } from "fs"
import { parse } from "csv-parse/sync"

import { ConfigGenerator, Config, Student } from "tools/types"
import * as utils from "./cli-config/utils"
import { chainSteps, fromCurrentDir, reposDir } from "tools"
import { InitialStep } from "./evaluation-process/steps/initial"
import { BufferStep } from "./evaluation-process/steps/buffer"
import { ShowProgress } from "./evaluation-process/steps/show-process"
import { CloneProcessStep } from "./evaluation-process/steps/clone"
import { GradeProcessStep } from "./evaluation-process/steps/grade"
import { WriteProcessStep } from "./evaluation-process/steps/write"
import { Process } from "./process/process"
import { FinalStep } from "./evaluation-process/steps/final"
import { Logger } from "./evaluation-process/steps/logger"
import chalk from "chalk"

const getStudents = (config: Config): Student[] => {
  const csv = readFileSync(fromCurrentDir(config.classroomFile))
  const students = parse(csv, {
    columns: true,
    skip_empty_lines: true
  })

  return students
}

const showCloneProgressFn = (progres: number, total: number): string => {
  return chalk`{yellow.bold Clone Progress:} {yellow ${progres}/${total}}`
}

const showGradeProgressFn = (progres: number, total: number): string => {
  return chalk`{blue.bold Grade Progress:} {yellow ${progres}/${total}}`
}


const showCompletedProgressFn = (progres: number, total: number): string => {
  return chalk`{green.bold Completed Progress:} {yellow ${progres}/${total}}`
}

const prepare = (config: Config): InitialStep => {
  mkdirSync(fromCurrentDir(reposDir), { recursive: true })

  const students = config.filter ?
    getStudents(config).filter(config.filter) :
    getStudents(config)

  let bufferSize: number

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
  const cloneBuffer = new BufferStep(config, bufferSize)
  const showCloneProgress = new ShowProgress(config, students.length, showCloneProgressFn)
  const cloneStep = new CloneProcessStep(config)
  const gradeStep = new GradeProcessStep(config, gradeLauncher)
  const showGradeProgress = showCloneProgress.clone(showGradeProgressFn)
  const gradeBuffer = cloneBuffer.clone()
  const writeStep = new WriteProcessStep(config)
  const showCompletedProgress = showCloneProgress.clone(showCompletedProgressFn)
  const finalBuffer = new BufferStep(config, students.length)
  const finalStep = new FinalStep(config, [ gradeLauncher ])
  const logger = new Logger(config)

  chainSteps([
    initialStep,
    cloneStep,
    logger,
    showCloneProgress,
    cloneBuffer,
    gradeStep,
    logger.clone(),
    showGradeProgress,
    gradeBuffer,
    writeStep,
    logger.clone(),
    showCompletedProgress,
    finalBuffer,
    finalStep
  ])

  return initialStep
}

export default function ({ config: generate }: { config: ConfigGenerator }): void {
  const config = generate(utils)

  const initialStep = prepare(config)

  initialStep.start()
}
