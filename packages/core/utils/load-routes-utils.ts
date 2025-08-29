import path from 'path'
import fg from 'fast-glob'
import { readFileSync } from 'fs'
import { ExportedMethods, Method, METHODS } from '../types'
import {
  createSourceFile,
  ScriptTarget,
  isVariableStatement,
  isFunctionDeclaration,
  SyntaxKind,
  isIdentifier,
} from 'typescript'

/**
 * 遍历指定目录并获取所有文件路径
 * @param dir 要遍历的目录
 * @returns 目录内所有文件绝对路径的数组
 */
export async function getFiles(dir: string): Promise<string[]> {
  const absoluteDir = path.resolve(dir)
  const pattern = path.join(absoluteDir, '**', '*.{ts,js}').replace(/\\/g, '/')

  const files = await fg(pattern, {
    absolute: true,
    onlyFiles: true,
  })

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

/**
 * 从文件中提取导出的 HTTP 方法
 * @param filePath 文件的绝对路径
 * @returns 导出的 HTTP 方法对象
 */
export function getExportedHttpMethods(filePath: string): ExportedMethods {
  const fileContent = readFileSync(filePath, 'utf8')
  const sourceFile = createSourceFile(filePath, fileContent, ScriptTarget.ESNext, true)
  const methods: ExportedMethods = {} as ExportedMethods
  sourceFile.forEachChild(node => {
    // 寻找 export const GET = ... 或 export function POST() { ... } 形式
    if (isVariableStatement(node) && node.modifiers && node.modifiers.some(m => m.kind === SyntaxKind.ExportKeyword)) {
      for (const declaration of node.declarationList.declarations) {
        if (isIdentifier(declaration.name) && METHODS.includes(declaration.name.text as Method)) {
          methods[declaration.name.text as Method] = true
        }
      }
    } else if (
      isFunctionDeclaration(node) &&
      node.modifiers &&
      node.modifiers.some(m => m.kind === SyntaxKind.ExportKeyword)
    ) {
      if (node.name && METHODS.includes(node.name.text as Method)) {
        methods[node.name.text as Method] = true
      }
    }
  })
  return methods
}
