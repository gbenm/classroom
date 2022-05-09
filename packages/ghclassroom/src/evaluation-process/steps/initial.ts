import { Config, Student } from "../../cli-config"
import { ProcessInformation, StudentProcessStep } from "clroom-tools/types"

export class InitialStep extends StudentProcessStep {
  public constructor(config: Config, private students: Student[]) {
    super(config, true)
  }

  public start(): void {
    this.students.forEach(student => this.execute({ student, step: "initial" }))
  }

  protected execute(info: ProcessInformation): Promise<ProcessInformation> {
    this.next(info)
    return Promise.resolve(info)
  }
}
