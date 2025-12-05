export const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] as const
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
  typescript: boolean
}
