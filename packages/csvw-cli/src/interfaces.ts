export interface CSVCache {
  file: string
  header: string
  content: {
    [key: string]: unknown
  }[]
}

export interface CSVDirectoryCache {
  files: {
    [file: string]: CSVCache
  },
  index: {
    [rowId: string]: {
      file: string
      index: number
    }
  }
}
