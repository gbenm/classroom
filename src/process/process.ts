import { ChildProcess, spawn } from "child_process"
import { chdir } from "process"
import { Readable, Writable } from "stream"
import { Command, Config, Student } from "../cli-config"
import { Message } from "../messaging/message"
import { Node } from "../messaging/node"
import { buildCommand } from "../utils"

export class Process {
  private process?: ChildProcess

  constructor (
    private config: Config,
    private cmd: Command[],
    private instanceByConnection: boolean,
  ) { }

  async connect(student: Student): Promise<ProcessConnection> {
    const command = buildCommand({
      student,
      getCloneDirectory: this.config.clone.getCloneDirectory
    }, this.cmd)

    if (!this.process) {
      this.process = spawn(command, {
        shell: true,
        stdio: "pipe",
        cwd: ".."
      })
    }

    if (!this.process.stdout || !this.process.stdin) {
      throw new Error("process not ready")
    }

    return new ProcessConnection(
      Date.now().toString(),
      this.process.stdout,
      this.process.stdin,
    )
  }
}

export class ProcessConnection extends Node {

  constructor(tag: string, input: Readable, output: Writable) {
    super(input, output)
  }

  protected handleMessage(message: Message): void {
    console.log(message)
  }
}
