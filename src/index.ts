#!/usr/bin/env node

import init from "./core"
import { ConfigGenerator } from "./cli-config"
import { copyFileSync } from "fs"
import { join } from "path"

const currentDir = process.cwd()
const configFile = "ghcl.config.mjs"

if (process.argv[2] === "init") {
  const typesFile = join(__dirname, "cli-config", "ghcl.types.d.ts")
  const configTemplateFile = join(__dirname, "cli-config", "ghcl.config.mjs")

  copyFileSync(typesFile, join(currentDir, "ghcl.types.ts"))
  copyFileSync(configTemplateFile, join(currentDir, configFile))

  process.exit()
}

const filename = join(currentDir, configFile)
const config = Function(`return import("${filename}")`)() as Promise<{ config: ConfigGenerator }>

config.then(init)
