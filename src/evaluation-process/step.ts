import { Config, Student } from "../cli-config"

export interface ProcessInformation {
  student: Student
  step: string
  exitCode?: number | null
  grade?: number
  comment?: string
}

export abstract class StudentProcessStep {
  protected nextStep: StudentProcessStep | null = null
  protected queue: ProcessInformation[] = []
  protected inProgressCount = 0

  constructor(protected config: Config, protected withoutQueue = false) { }

  public setNext(step: StudentProcessStep): void {
    this.nextStep = step
  }

  private enqueue(info: ProcessInformation): void {
    if (this.withoutQueue) {
      this.execute(info)
      return
    }

    this.queue.push(info)

    if (this.inProgressCount < this.config.parallel) {
      this.inProgressCount++
      this.dequeueAndExecute()
    }
  }

  private dequeueAndExecute(): void {
    const item = this.queue.shift()

    if (item) {
      this.execute(item).then((info) => {
        this.next(info)
        this.dequeueAndExecute()
      })
    } else {
      this.inProgressCount--
    }
  }

  protected next(info: ProcessInformation): void {
    if (this.nextStep) {
      this.nextStep.enqueue(info)
    }
  }

  protected abstract execute(info: ProcessInformation): Promise<ProcessInformation>
}
