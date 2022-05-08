// @ts-check

/** @type {import("./csvw.types").CSVWConfig} */
export const config = {
  source: "csvs/",
  headerRowNumber: 1,
  enconding: "utf-8",
  mappings: [
    { tag: ["grade"], column: "Nota" },
    { tag: ["comment"], column: "Cometar/Editar razón:" }
  ],
  seekConfig: {
    tag: ["student", "roster_identifier"],
    column: "Carnet",
    transform: (id) => [`${id}`]
  }
}
