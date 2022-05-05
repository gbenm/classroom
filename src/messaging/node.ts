import { parser } from "stream-json"
import { chain } from "stream-chain"
import { streamValues } from "stream-json/streamers/StreamValues"

import { Message } from "./message"
import { Readable, Writable } from "stream"

export abstract class Node {
  public constructor(input: Readable, private output: Writable) {
    const messageReader = chain([
      input,
      parser({
        jsonStreaming: true
      }),
      streamValues(),
      data => data.value
    ])

    messageReader.on("data", this.handleMessage.bind(this))
  }

  public sendMessage(message: Message): void {
    this.output.write(JSON.stringify(message))
  }

  protected abstract handleMessage(message: Message): void
}
