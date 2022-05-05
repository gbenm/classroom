import { Config } from "../../cli-config"
import { StudentProcessStep, ProcessInformation } from "../step"

export class BufferStep extends StudentProcessStep {
  private buffer: ProcessInformation[] = []

  public get isFull(): boolean {
    return this.buffer.length >= this.size
  }

  public constructor(config: Config, public readonly size: number) {
    super(config, true)
  }

  public clone(): BufferStep {
    return new BufferStep(this.config, this.size)
  }

  protected async execute(info: ProcessInformation): Promise<ProcessInformation> {
    this.buffer.push(info)

    if (this.isFull) {
      this.flush()
    }

    return info
  }

  public flush(): void {
    this.buffer.forEach(info => this.next(info))
    this.buffer = []
  }
}
