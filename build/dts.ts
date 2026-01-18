import fs from 'fs'
import { generateDtsBundle } from 'dts-bundle-generator'
import { BuildOptions } from './types'

export async function generateDts(opts: BuildOptions) {
  const dts = generateDtsBundle(
    [
      {
        filePath: opts.entry,
        output: { noBanner: true },
      },
    ],
    {
      preferredConfigPath: '../../tsconfig.build.json',
    }
  )

  fs.mkdirSync(opts.outDir, { recursive: true })
  fs.writeFileSync(`${opts.outDir}/index.d.ts`, dts.join('\n'), 'utf8')
}
