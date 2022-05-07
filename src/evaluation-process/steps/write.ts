import { ProcessInformation, StudentProcessStep } from "../step"

export class WriteProcessStep extends StudentProcessStep {
  protected execute(info: ProcessInformation): Promise<ProcessInformation> {
    info.step = "write"

    if (info.exitCode) {
      return Promise.resolve(info)
    }

    console.log("write", info)

    return Promise.resolve(info)
  }
}
