import { build } from 'esbuild'
import path from 'path'
import { BuildOptions } from './types'

export async function bundleRuntime(opts: BuildOptions) {
  const { entry, outDir, format = 'esm', external = [] } = opts

  await build({
    entryPoints: [path.resolve(entry)],
    outfile: path.join(outDir, 'index.js'),
    bundle: true,
    format,
    platform: 'node',
    target: 'es2022',
    sourcemap: true,
    external,
  })
}
