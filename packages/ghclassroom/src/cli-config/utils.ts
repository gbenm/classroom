import { CommandContext, Student } from "clroom-tools/types"

export const createPATUrlGit = (pat: string, username: string, repo: string) => `https://${pat}@github.com/${username}/${repo}`
export const createSSHUrlGit = (username: string, repo: string) => `git@github.com:${username}/${repo}.git`

export const studentRepoUrl = ({ student }: CommandContext): string => student.student_repository_url
export const cloneDirectory = ({ student, getCloneDirectory }: CommandContext): string => getCloneDirectory(student)
export const getCloneDirectory = (student: Student): string => `${student.roster_identifier}`
