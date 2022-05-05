import { ProcessInformation, StudentProcessStep } from "../step"

export class WriteProcessStep extends StudentProcessStep {
  protected execute(info: ProcessInformation): Promise<ProcessInformation> {
    return Promise.resolve(info)
  }
}
