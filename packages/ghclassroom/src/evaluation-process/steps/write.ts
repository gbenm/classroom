import chalk from "chalk"
import { MessageType } from "clroom-messaging"
import { Config, ProcessInformation, StudentProcessStep } from "clroom-tools/types"
import { Process } from "../../process/process"

export class WriteProcessStep extends StudentProcessStep {
  constructor(config: Config, private process: Process) {
    super(config)
  }

  protected execute(info: ProcessInformation): Promise<ProcessInformation> {
    info.step = "write"

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
          grade: info.grade,
          comment: info.comment
        })

        connection.on("message", (message) => {
          if (message.type === MessageType.error) {
            info.exitCode = -1
            info.writeStatus = message.status
            info.missings = message.missings
            connection.disconnect()
            resolve(info)
            return
          }

          if (message.type === MessageType.response) {
            console.log(chalk`{gray Writer message:} ${message.status}`)
            info.writeStatus = message.status
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
