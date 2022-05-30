#!/usr/bin/env node

import init from "./core"
import { init as loggerInit } from "./logger-command/core"
import { ConfigGenerator } from "./cli-config"
import { copyFileSync, readdirSync } from "fs"
import { dirname, join } from "path"
import yargs from "yargs"
import { hideBin } from "yargs/helpers"
import { prompt } from "inquirer"
import { fromCurrentDir, identity } from "clroom-tools"

let lock = false

const currentDir = process.cwd()
const configFile = "ghcl.config.mjs"

const run = () => {
  const filename = join(currentDir, configFile)
  const config = Function(`return import("${filename}")`)() as Promise<{ config: ConfigGenerator }>

  config.then(init)
}

export function start() {
  yargs(hideBin(process.argv))
  .command("init", "Crea los archivos de configuración en el directorio actual", identity, () => {
    lock = true
    const typesFile = join(dirname(require.resolve("clroom-tools")), "types", "ghcl.types.d.ts")
    const configTemplateFile = join(__dirname, "cli-config", "ghcl.config.mjs")

    copyFileSync(typesFile, join(currentDir, "ghcl.types.ts"))
    copyFileSync(configTemplateFile, join(currentDir, configFile))

    process.exit()
  })
  .command("logs", "Utilidad para buscar en los logs", identity, async () => {
    lock = true

    const files = readdirSync("logs", {
      withFileTypes: true
    }).filter(file => file.isFile()).map((file) => {
      return {
        value: fromCurrentDir(join("logs", file.name)),
        date: (file.name.match(/(.*)-ghcl\.log\.json/) ?? [])[1]
      }
    })
    .map(({ value, date }) => ({
      value,
      date: new Date(date)
    }))
    .sort(({ date: date1 }, { date: date2 }) => date2.getTime() - date1.getTime())
    .map(({date, value}) => ({
      value,
      name: date.toLocaleString(Intl.DateTimeFormat().resolvedOptions().locale)
    }))

    prompt([
      {
        type: "list",
        name: "logFile",
        choices: files,
        loop: false,
        message: "En qué log desea buscar?",
      }
    ]).then(({ logFile }) => {
      loggerInit(logFile).then(process.exit)
    })
  })
  .command("run", "Ejecuta el proceso de evaluación (default)", identity, run)
  .parse()

  if (!lock) {
    // run by default
    run()
  }
}
