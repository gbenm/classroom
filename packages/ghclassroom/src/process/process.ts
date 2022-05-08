import { ChildProcess, spawn } from "child_process"
import { createHash } from "crypto"
import { join } from "path"
import { Command, Config, Student } from "../cli-config"
import { Message, EmitterFn, MessagingNode } from "../messaging"
import { buildCommand, reposDir } from "tools"

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

    const dir = this.instanceByConnection ?
      join(reposDir, this.config.clone.getCloneDirectory(student)) :
      undefined

    const process = spawn(command, {
      shell: true,
      stdio: "pipe",
      cwd: dir
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

    process.setMaxListeners(Infinity)

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

export class ProcessConnection extends MessagingNode {
  public get exitCode(): number | null {
    return this.process.exitCode
  }

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
    this.close()
  }
}
