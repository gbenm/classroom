import chalk from "chalk"
import { prompt } from "inquirer"
import { JsonLog, LogEntry } from "../evaluation-process/steps/logger"

type FilterQuery = {
  filters: Filter[],
  values: {
    [key in Filter]?: string
  }
}

enum Filter {
  step = "step",
  status = "status",
  github_username = "github_username",
  roster_identifier = "roster_identifier",
}

function isStudentFilter(filter: Filter): boolean {
  return filter === Filter.github_username || filter === Filter.roster_identifier
}

function showActions(): Promise<{ action: string }> {
  return prompt([
    {
      name: "action",
      message: "Qué desea hacer?",
      type: "rawlist",
      choices: [
        { name: "Buscar", value: "search" },
        { name: "Agregar filtros", value: "addFilters" },
        { name: "Salir", value: "exit" },
      ]
    }
  ])
}

async function showFilters(currentChoices: FilterQuery): Promise<FilterQuery> {
  const choices = {
    step: { name: "Paso", value: Filter.step },
    status: { name: "Estado", value: Filter.status },
    github_username: { name: "Github username", value: Filter.github_username },
    roster_identifier: { name: "Carnet", value: Filter.roster_identifier },
  }

  currentChoices.filters.forEach(filterKey => choices[filterKey]["checked"] = true)

  const { filters } = await prompt([
    {
      name: "filters",
      type: "checkbox",
      choices: Object.values(choices)
    }
  ])

  const values = await prompt(filters.map((filterKey) => {
    switch (filterKey) {
      case Filter.step:
        return {
          type: "list",
          name: Filter.step,
          message: "Paso",
          choices: ["clone", "grade", "write"],
          default: currentChoices.values[Filter.step],
        }
      case Filter.status:
        return {
          type: "list",
          name: Filter.status,
          message: "Estado",
          choices: ["success", "failed"],
          default: currentChoices.values[Filter.status],
        }
      case Filter.github_username:
        return {
          type: "input",
          name: Filter.github_username,
          message: "Github username",
          default: currentChoices.values[Filter.github_username],
        }
      case Filter.roster_identifier:
        return {
          type: "input",
          name: Filter.roster_identifier,
          message: "Carnet",
          default: currentChoices.values[Filter.roster_identifier],
        }
    }
  }))

  return {
    filters,
    values
  }
}

async function search(logFile: string, { filters, values }: FilterQuery): Promise<JsonLog> {
  const jsonLog: JsonLog = {
    ...(await import(logFile))
  }

  jsonLog.log = jsonLog.log.filter((entry: LogEntry) => {
    if (filters.length === 0) {
      return true
    }

    return filters.map((name) => {
      if (isStudentFilter(name)) {
        return (entry.student[name] as string).toLowerCase().includes(values[name]?.toLowerCase() ?? "")
      }

      return entry[name] === values[name]
    }).reduce((a,b) => a && b)
  })

  return jsonLog
}

async function showSearchResults({ create_at, log }: JsonLog): Promise<void> {
  console.log(chalk`{yellow.bold Fecha de creación del Log:}`, new Date(create_at).toLocaleString(), "\n")

  for (const entry of log) {
    console.log(entry)
    const { next } = await prompt([{
      type: "confirm",
      message: "Ver el siguiente?",
      name: "next",
    }])

    if (!next) {
      break
    }
  }
}

export async function init(logFile: string): Promise<undefined> {
  let exit = false
  let filterQuery: FilterQuery = {
    filters: [],
    values: {}
  }
  do {
    const { action } = await showActions()

    switch (action) {
      case "search":
        await showSearchResults(await search(logFile, filterQuery))
        break
      case "addFilters":
        filterQuery = await showFilters(filterQuery)
        break
      case "exit":
        exit = true
        break
    }
  } while (!exit)

  return undefined
}
