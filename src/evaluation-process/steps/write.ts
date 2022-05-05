import { ProcessInformation, StudentProcessStep } from "../step"

export class WriteProcessStep extends StudentProcessStep {
  protected execute(info: ProcessInformation): Promise<ProcessInformation> {
    info.step = "write"

    if (info.exitCode) {
      return Promise.resolve(info)
    }

    return Promise.resolve(info)
  }
}
