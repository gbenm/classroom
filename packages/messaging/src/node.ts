import { parser } from "stream-json"
import { chain } from "stream-chain"
import { streamValues } from "stream-json/streamers/StreamValues"

import { Message } from "./message"
import { EventEmitter, Readable, Writable } from "stream"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type EmitterFn = (message: Message) => boolean

export class MessagingNode extends EventEmitter {
  public readonly close: () => void
  private get handler() {
    return this.handleMessage.bind(this, this.emit.bind(this, "message"))
  }

  public constructor(input: Readable, private output: Writable) {
    super()
    const messageReader = chain([
      input,
      parser({
        jsonStreaming: true
      }),
      streamValues(),
      data => data.value
    ])

    messageReader.on("data", this.handler)

    this.close = () => {
      messageReader.destroy()
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(eventName: "message", listener: (message: Message) => void): this {
    super.on(eventName, listener)
    return this
  }

  public sendMessage(message: Message): void {
    this.output.write(JSON.stringify(message).concat("\n"))
  }

  protected handleMessage(emit: EmitterFn, message: Message): void {
    emit(message)
  }
}
