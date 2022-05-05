import { Config } from "../../cli-config"
import { Process } from "../../process/process"
import { fromCurrentDir } from "../../utils"
import { ProcessInformation, StudentProcessStep } from "../step"

export class GradeProcessStep extends StudentProcessStep {
  constructor(config: Config, private process: Process) {
    super(config)
  }

  protected execute(info: ProcessInformation): Promise<ProcessInformation> {
    return new Promise((resolve) => this.process.connect(info.student)
      .then((connection) => {
        connection.sendMessage({
          type: "request",
          tag: connection.tag,
          student: info.student,
          path: fromCurrentDir(this.config.clone.getCloneDirectory(info.student))
        })

        connection.on("message", (message) => {
          console.log("from grade", message)

          connection.disconnect()
          resolve(info)
        })
      })
    )
  }
}
