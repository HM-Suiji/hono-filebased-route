export interface BuildOptions {
  name: string
  entry: string
  outDir: string
  format?: 'esm' | 'cjs'
  external?: string[]
}
