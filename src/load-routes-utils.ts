import { Context } from 'hono'
import path from 'path'

/**
 * 遍历指定目录并获取所有文件路径（使用 Bun.Glob）
 * @param dir 要遍历的目录
 * @returns 目录内所有文件绝对路径的数组
 */
export async function getFiles(dir: string): Promise<string[]> {
	const absoluteDir = path.resolve(dir)
	const pattern = path.join(absoluteDir, '**', '*.{ts,js}')

	const glob = new Bun.Glob(pattern)
	const files: string[] = []

	for await (const file of glob.scan()) {
		files.push(file)
	}
	return files
}

/**
 * 将文件路径转换为 Hono 路由路径
 * @param filePath 文件的绝对路径
 * @param baseDir 路由文件的根目录的绝对路径
 * @returns 转换后的 Hono 路由路径
 */
export function getRoutePath(filePath: string, baseDir: string): string {
	let routeName = path.relative(baseDir, filePath).replace(/\.(ts|js)$/, '')

	routeName = routeName
		.replace(/\[\.\.\.(\w+)\]/g, '*') // 捕获所有：[...slug] => *
		.replace(/\[(\w+)\]/g, ':$1') // 动态参数：[id] => :id

	if (routeName === 'index') {
		return '/'
	} else if (routeName.endsWith('/index')) {
		return `/${routeName.slice(0, -6)}`
	}

	return `/${routeName}`
}
