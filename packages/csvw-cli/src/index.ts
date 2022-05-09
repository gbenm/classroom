import init from "./core"
import { copyFileSync } from "fs"
import { dirname, join } from "path"
import { identity } from "clroom-tools"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { CSVWConfig } from "clroom-tools/src/types"

let lock = false
const currentDir = process.cwd()
const configFile = "csvw.config.mjs"

function createConfigFile() {
  lock = true
  const typesFile = join(dirname(require.resolve("tools")), "types", "ghcl.types.d.ts")
  const configTemplateFile = join(__dirname, "cli-config", configFile)

  copyFileSync(typesFile, join(currentDir, "csvw.types.ts"))
  copyFileSync(configTemplateFile, join(currentDir, configFile))

  process.exit()
}

function run() {
  const filename = join(currentDir, configFile)
  const config = Function(`return import("${filename}")`)() as Promise<{ config: CSVWConfig }>
  config.then(init)
}

export function start() {
  yargs(hideBin(process.argv))
  .command("init", "Crea los archivos de configuración en el directorio actual", identity, createConfigFile)
  .command("run", "Ejecuta el proceso de evaluación (default)", identity, run)
  .parse()

  if (!lock) {
    // run by default
    run()
  }
}
