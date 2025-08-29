export const METHODS = ['GET', 'POST'] as const
export type Method = (typeof METHODS)[number]

export type ExportedMethods = {
  [key in Method]: boolean
}
