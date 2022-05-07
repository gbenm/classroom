export enum MessageType {
  response = "response",
  request = "request",
  error = "error"
}

export interface Message {
  tag: string
  type: MessageType
  [key: string]: unknown
}
