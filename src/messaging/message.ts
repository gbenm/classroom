import { Student } from "../cli-config"

export type MessageType = "grade" | "error" | "exec"

export interface Message {
  tag: string
  type: string
  student?: Student
  comment?: string
  grade?: number
  path?: string
}
