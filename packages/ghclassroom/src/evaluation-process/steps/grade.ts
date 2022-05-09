import { Config } from "../../cli-config"
import { Process } from "../../process/process"
import { fromCurrentDir } from "clroom-tools"
import { ProcessInformation, StudentProcessStep } from "clroom-tools/types"
import { MessageType } from "../../messaging"

export class GradeProcessStep extends StudentProcessStep {
  constructor(config: Config, private process: Process) {
    super(config)
  }

  protected execute(info: ProcessInformation): Promise<ProcessInformation> {
    info.step = "grade"

    if (info.exitCode) {
      return Promise.resolve(info)
    }

    return new Promise((resolve) => this.process.connect(info.student)
      .then((connection) => {
        if (connection.exitCode) {
          info.exitCode = connection.exitCode
          resolve(info)
          return
        }

        connection.sendMessage({
          type: MessageType.request,
          tag: connection.tag,
          student: info.student,
          path: fromCurrentDir(this.config.clone.getCloneDirectory(info.student))
        })

        connection.on("message", (message) => {
          if (message.type === MessageType.error) {
            info.exitCode = -1
            info.comment = message.comment as string
            connection.disconnect()
            resolve(info)
            return
          }

          if (message.type === MessageType.response) {
            info.grade = message.grade as number
            info.comment = message.comment as string
            connection.disconnect()
            resolve(info)
            return
          }

          info.exitCode = -1
          connection.disconnect()
          resolve(info)
        })
      })
    )
  }
}
