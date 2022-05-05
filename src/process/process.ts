import { ChildProcess, spawn } from "child_process"
import { createHash } from "crypto"
import { Readable, Writable } from "stream"
import { Command, Config, Student } from "../cli-config"
import { Message } from "../messaging/message"
import { EmitterFn, Node } from "../messaging/node"
import { buildCommand } from "../utils"

let tagId = 0

export class Process {
  private process?: ChildProcess

  constructor (
    private config: Config,
    private cmd: Command[],
    private instanceByConnection: boolean,
  ) { }

  private launch(student: Student): ChildProcess {
    const command = buildCommand({
      student,
      getCloneDirectory: this.config.clone.getCloneDirectory
    }, this.cmd)

    const process = spawn(command, {
      shell: true,
      stdio: "pipe",
      cwd: ".."
    })

    return process
  }

  private getIntance(student: Student): ChildProcess {
    if (!this.instanceByConnection) {
      if (!this.process) {
        this.process = this.launch(student)
      }

      return this.process
    }

    return this.launch(student)
  }

  async connect(student: Student): Promise<ProcessConnection> {
    const process = this.getIntance(student)

    const cypher = createHash("md5")

    return new ProcessConnection(
      cypher.update(`${tagId++}`).digest("hex"),
      process,
      this.instanceByConnection
    )
  }

  async exit(): Promise<void> {
    this.process?.kill()
  }
}

export class ProcessConnection extends Node {

  constructor(
    public readonly tag: string,
    private process: ChildProcess,
    private instanceByConnection: boolean,
  ) {
    if (!process.stdout || !process.stdin) {
      throw new Error("process not ready")
    }

    super(process.stdout, process.stdin)
  }

  protected handleMessage(emit: EmitterFn, message: Message): void {
    if (this.tag === message.tag) {
      emit(message)
    }
  }

  async disconnect(): Promise<void> {
    if (this.instanceByConnection) {
      this.process.kill()
    }
  }
}
