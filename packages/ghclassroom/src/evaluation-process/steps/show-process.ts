import { Config } from "../../cli-config"
import { ProcessInformation, StudentProcessStep } from "clroom-tools/types"

export type ProgressMessageFn = (progress: number, total: number) => string

export class ShowProgress extends StudentProcessStep {
  private counter = 0

  constructor(
    config: Config,
    private readonly total: number,
    private progressMessage: ProgressMessageFn
  ) {
    super(config, true)
  }

  public clone(progressMessage?: ProgressMessageFn): ShowProgress {
    return new ShowProgress(this.config, this.total, progressMessage ?? this.progressMessage)
  }

  protected execute(info: ProcessInformation): Promise<ProcessInformation> {
    console.log(this.progressMessage(++this.counter, this.total))
    this.next(info)
    return Promise.resolve(info)
  }
}
