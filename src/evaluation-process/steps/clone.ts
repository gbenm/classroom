import { spawn } from "child_process"
import { Config, Student } from "../../cli-config"
import { buildCommand, reposDir } from "../../utils"
import { ProcessInformation, StudentProcessStep } from "../step"

export class CloneProcessStep extends StudentProcessStep {
  protected execute(info: ProcessInformation): Promise<ProcessInformation> {
    return cloneRepo(this.config, info.student)
  }
}

const cloneRepo = (config: Config, student: Student) => {
  const command = buildCommand({
    student,
    getCloneDirectory: config.clone.getCloneDirectory
  }, config.clone.cmd)

  const process = spawn(command, {
    cwd: reposDir,
    shell: config.clone.showOutput,
    stdio: "inherit"
  })

  return new Promise<ProcessInformation>((resolve) => {
    process.on("exit", (code) => {
      resolve({ student, exitCode: code, step: "clone" })
    })
  })
}
