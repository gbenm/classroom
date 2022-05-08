// @ts-check

/** @type {import("./csvw.types").CSVWConfig} */
export const config = {
  source: "csvs/",
  mappings: [
    { tag: ["grade"], column: "Nota" },
    { tag: ["comment"], column: "Cometar/Editar razón:" }
  ],
  seekConfig: {
    tag: ["student", "roster_identifier"],
    column: "Carnet",
    seek: (target, itemId) => target === itemId,
  }
}
