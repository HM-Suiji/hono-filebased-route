import { bundleRuntime } from './bundle'
import { generateDts } from './dts'
import { BuildOptions } from './types'

export async function buildPackage(opts: BuildOptions) {
  await bundleRuntime(opts)
  await generateDts(opts)
}
