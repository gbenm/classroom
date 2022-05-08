import { Config } from "../../cli-config"
import { Process } from "../../process/process"
import { ProcessInformation, StudentProcessStep } from "tools/types"
import { Logger } from "./logger"

export class FinalStep extends StudentProcessStep {
  public constructor(config: Config, private launchers: Process[]) {
    super(config)
  }

  protected execute(info: ProcessInformation): Promise<ProcessInformation> {
    this.launchers.forEach(launcher => launcher.exit())
    Logger.write()
    return Promise.resolve(info)
  }
}
