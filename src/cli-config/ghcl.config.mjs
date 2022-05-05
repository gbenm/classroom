/// @ts-check

/** @type {import("./ghcl.types").ConfigGenerator} */
export const config = ({ createSSHUrlGit, cloneDirectory, getCloneDirectory }) => {

  /** @type {import("./ghcl.types").CommandArgFn} */
  const repoUrl = ({ student }) => createSSHUrlGit("USERNAME", student.student_repository_name)

  return {
    classroomFile: "classroom.csv",
    clone: {
      showOutput: true,
      getCloneDirectory,
      cmd: [
        { bin: "git", args: ["clone", repoUrl, cloneDirectory] },
      ]
    },
    filter: ({ roster_identifier, student_repository_name }) => roster_identifier && student_repository_name.includes("2022"),
    parallel: 4,
    executeBy: "student",
  }
}
