import { join } from "path"
import { Command, CommandContext, StudentProcessStep } from "./types"

export const reposDir = "repos"

export const fromCurrentDir = (path: string) => {
  const currentDir = process.cwd()
  return join(currentDir, path)
}

export const buildCommand = (context: CommandContext, commands: Command[]) => {
  return commands.map((cmd) => {
    if (typeof cmd === "string") {
      return cmd
    }

    return `${cmd.bin} ${cmd.args.map((arg) => {
      if (typeof arg === "function") {
        return arg(context)
      }
      return arg
    }).join(" ")}`
  }).join("\n")
}

export const chainSteps = (steps: StudentProcessStep[]) => {
  steps.forEach((step, i) => {
    const next = steps[i + 1]
    if (next) {
      step.setNext(next)
    }
  })

  return steps[0]
}
