import { join } from "path"
import { Command, CommandContext } from "./cli-config"

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
