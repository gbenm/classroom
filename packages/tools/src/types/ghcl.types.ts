export type ConfigGenerator = (utils: Utils) => Config

export type ExecutionMode = "step" | "student"
export type FilterFunction = (student: Student) => boolean
export type PathGeneratorFunction = (student: Student) => string
export type Command = string | CommandDescriptor
export type CommandArgFn = (context: CommandContext) => string
export type CommandArg = string | CommandArgFn

export interface Student {
  assignment_name: string
  assignment_url: string
  starter_code_url: string
  github_username: string
  roster_identifier: string
  student_repository_name: string
  student_repository_url: string
  submission_timestamp: string
  points_awarded: string
  points_available: string
}

export interface CommandContext {
  student: Student
  getCloneDirectory: PathGeneratorFunction
}

export interface CommandDescriptor {
  bin: string,
  args: CommandArg[]
}

export interface CloneConfig {
  cmd: Command[]
  getCloneDirectory: PathGeneratorFunction
  showOutput: boolean
}

export interface GraderConfig {
  cmd: Command[]
  byStudent: boolean
}

export interface WriterConfig {
  cmd: Command[]
}

export interface Config {
  classroomFile: string
  executeBy: ExecutionMode
  clone: CloneConfig
  filter?: FilterFunction
  parallel: number
  grader?: GraderConfig
  writer?: WriterConfig
}

export interface Utils {
  studentRepoUrl: CommandArgFn
  createPATUrlGit: (pat: string, username: string, repo: string) => string
  createSSHUrlGit: (username: string, repo: string) => string
  cloneDirectory: CommandArgFn
  getCloneDirectory: PathGeneratorFunction
}

export interface CSVWConfig {
  source: string
  headerRowNumber: number
  enconding?: BufferEncoding
  mappings: { tag: string[], column: string }[]
  seekConfig: {
    tag: string[]
    column: string
    transform: (target: unknown) => string[]
  }
}
