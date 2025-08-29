export const METHODS = ['GET', 'POST'] as const
export type Method = (typeof METHODS)[number]

export type ExportedMethods = {
  [key in Method]: boolean
}

export type Config = {
  dir: string
  output: string
  write: boolean
  verbose: boolean
  externals: string[]
}
