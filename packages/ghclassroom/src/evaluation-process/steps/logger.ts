import chalk from "chalk"
import { mkdirSync, writeFileSync } from "fs"
import { join } from "path"
import { Config, Student } from "../../cli-config"
import { ProcessInformation, StudentProcessStep } from "tools/types"

export type JsonLog = {
  create_at: string,
  timestamp: number,
  log: LogEntry[]
}

export type LogEntry = {
  step: string,
  status: string,
  student: Student,
  grade?: number,
  comment?: string,
  [key: string]: unknown
}

export class Logger extends StudentProcessStep {
  static jsonLog: LogEntry[] = []

  constructor(config: Config) {
    super(config, true)
  }

  static write(): void {
    const currentDate = new Date()
    const name = `${currentDate.toISOString()}-ghcl.log.json`

    if (this.jsonLog.length) {
      mkdirSync("logs", { recursive: true })
      writeFileSync(join("logs", name), JSON.stringify({
        create_at: currentDate.toISOString(),
        timestamp: currentDate.getTime(),
        log: this.jsonLog,
      } as JsonLog, null, 2))
      this.jsonLog = []
    }
  }

  private log(entry: LogEntry): void {
    Logger.jsonLog.push(entry)
  }

  clone(): Logger {
    return new Logger(this.config)
  }

  protected execute(info: ProcessInformation): Promise<ProcessInformation> {
    if (info.exitCode) {
      console.log(chalk`{red ${info.step} failed}`)
    }

    const entry: LogEntry = {
      ...info,
      status: info.exitCode ? "failed" : "success",
    }

    delete entry["exitCode"]

    this.log(entry)
    this.next(info)

    return Promise.resolve(info)
  }
}
