import { Student } from "../cli-config"

export interface LoggerQuery {
  status?: string
  step?: string
  student?: Partial<Student>
}
