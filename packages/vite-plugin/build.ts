import dts from 'bun-plugin-dts'

await Bun.build({
	minify: true,
	target: 'node',
	outdir: './dist',
	plugins: [dts()],
	entrypoints: ['./index.ts'],
})
