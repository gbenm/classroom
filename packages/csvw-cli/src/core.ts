import { Message, MessageType, MessagingNode } from "messaging"
import { CSVWConfig } from "tools/types"
import { parse, Options } from "csv-parse/sync"
import { stringify } from "csv-stringify/sync"
import { readdirSync, readFileSync, writeFileSync } from "fs"
import { CSVCache, CSVDirectoryCache } from "./interfaces"
import { getValueFrom } from "tools"
import { join } from "path"

const okMessage = ({ tag }: Message) => ({
  type: MessageType.response,
  tag,
  status: "ok"
})

const errorMessage = ({ tag, status = "error", missings }: Message) => ({
  type: MessageType.error,
  tag,
  status,
  missings
})

function loadCSV(config: CSVWConfig, file: string, onRecordFn: Options["onRecord"]): CSVCache {
  const csvContent = readFileSync(join(config.source, file)).toString().split("\n")
  const start = config.headerRowNumber - 1
  const header = csvContent.slice(0, start+1).join("\n")
  const body = csvContent.slice(start).join("\n")

  const content = parse(body, {
    relax_column_count: true,
    columns: true,
    trim: true,
    onRecord: (record, context) => {
      onRecordFn?.(record, context)
      return record
    },
    encoding: config.enconding
  })

  return {
    file,
    header,
    content
  }
}

function loadCSVs(config: CSVWConfig): CSVDirectoryCache {
  const csvs: CSVDirectoryCache = {
    files: {},
    index: {}
  }

  const files = readdirSync(config.source, {
    withFileTypes: true
  })
    .filter(file => file.isFile() && file.name.endsWith(".csv"))
    .map(file => file.name)

  files.forEach((file) => {
    const csv = loadCSV(config, file, (record, context) => {
      csvs.index[record[config.seekConfig.column]] = {
        file,
        index: context.lines - 2
      }
    })
    csvs.files[file] = csv
  })

  return csvs
}

function lookupCache(csvs: CSVDirectoryCache, id: string): { [key: string]: unknown } | undefined {
  const info = csvs.index[id]

  if (!info) return

  return csvs.files[info.file].content[info.index]
}

function updateData(config: CSVWConfig, csvs: CSVDirectoryCache, message: Message): Message | undefined {
  const targets = config.seekConfig.transform(getValueFrom(message, config.seekConfig.tag))
  const missings = targets.map((id) => {
    const row = lookupCache(csvs, id)

    if (!row) return id

    config.mappings.forEach(({ tag, column }) => {
      (row as { [key: string]: unknown })[column] = getValueFrom(message, tag)
    })
  }).filter(result => !!result)

  return missings.length === 0 ? undefined : {
    ...message,
    status: "not found",
    missings
  }
}

function writeBack(config: CSVWConfig, csvs: CSVDirectoryCache): void {
  Object.values(csvs.files).forEach((cache) => {
    const file = join(config.source, cache.file)
    writeFileSync(file, cache.header.concat("\n").concat(stringify(cache.content)))
  })
}

export default function ({ config }: { config: CSVWConfig }) {
  const inout = new MessagingNode(process.stdin, process.stdout)

  const csvs = loadCSVs(config)

  function onExit () {
    writeBack(config, csvs)
    process.exit()
  }

  process.on("SIGTERM", onExit)
  process.on("SIGINT", onExit)

  inout.on("message", (message) => {
    if (message.type !== MessageType.request) {
      inout.sendMessage(errorMessage({ 
        type: MessageType.error,
        tag: message.tag,
        comment: "This program only accepts requests"
     }))
      return
    }

    const missing = updateData(config, csvs, message)

    if (!missing) {
      inout.sendMessage(okMessage(message))
    } else {
      inout.sendMessage(errorMessage(missing))
    }

  })
}
