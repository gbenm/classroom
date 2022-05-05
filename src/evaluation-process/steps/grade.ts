import { Config } from "../../cli-config"
import { Process } from "../../process/process"
import { ProcessInformation, StudentProcessStep } from "../step"

export class GradeProcessStep extends StudentProcessStep {
  constructor(config: Config, private process: Process) {
    super(config)
  }

  protected async execute(info: ProcessInformation): Promise<ProcessInformation> {
    const connection = await this.process.connect(info.student)

    connection.sendMessage({
      type: "request",
      tag: "399202",
      student: info.student
    })

    return info
  }
}
