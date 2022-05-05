import { Config } from "../../cli-config"
import { Process } from "../../process/process"
import { ProcessInformation, StudentProcessStep } from "../step"

export class FinalStep extends StudentProcessStep {
  public constructor(config: Config, private launchers: Process[]) {
    super(config)
  }

  protected execute(info: ProcessInformation): Promise<ProcessInformation> {
    this.launchers.forEach((launcher) => launcher.exit())
    return Promise.resolve(info)
  }
}
