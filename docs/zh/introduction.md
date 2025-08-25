# 介绍

欢迎使用 hono-filebased-route，这是一个基于 [Hono](https://hono.dev/) Web 框架构建的强大文件路由系统。

## 什么是 hono-filebased-route？

hono-filebased-route 为 Hono 应用程序带来了文件路由的简洁性和约定。受 Next.js 和 Nuxt.js 等框架启发，它允许你通过简单地在特定目录结构中组织文件来创建 API 路由。

## 核心特性

### 🚀 **自动路由生成**

无需手动定义路由。只需在路由目录中创建文件，它们就会自动成为可访问的端点。

### 📁 **直观的文件结构**

你的文件系统就是你的路由系统。目录结构直接映射到你的 URL 结构。

### 🔄 **动态路由**

支持使用方括号表示法（`[id].ts`）的动态参数和通配符路由（`[...slug].ts`）。

### 🛡️ **TypeScript 优先**

从头开始使用 TypeScript 构建，提供出色的类型安全和开发体验。

### ⚡ **Bun 优化**

针对 Bun 运行时优化，同时保持与 Node.js 的兼容性。

### 🔧 **灵活配置**

通过各种配置选项自定义路由行为。

## 工作原理

魔法通过一个简单的过程实现：

1. **文件扫描**：系统扫描你的路由目录
2. **路径转换**：文件路径转换为 URL 模式
3. **路由注册**：路由自动注册到你的 Hono 应用
4. **HTTP 方法映射**：导出的函数（`GET`、`POST` 等）成为路由处理器

```mermaid
graph LR
    A[文件系统] --> B[路由扫描器]
    B --> C[路径转换器]
    C --> D[路由生成器]
    D --> E[Hono 应用]

    F[routes/users/[id].ts] --> G[/users/:id]
    H[routes/blog/[...slug].ts] --> I[/blog/*]
```

## 路由模式

### 静态路由

```
routes/about.ts → /about
routes/contact.ts → /contact
```

### 动态路由

```
routes/users/[id].ts → /users/:id
routes/posts/[slug].ts → /posts/:slug
```

### 嵌套路由

```
routes/api/users/index.ts → /api/users
routes/api/users/[id].ts → /api/users/:id
```

### 通配符路由

```
routes/blog/[...slug].ts → /blog/*
routes/docs/[...path].ts → /docs/*
```

## 为什么选择 hono-filebased-route？

### **开发体验**

- **直观**：如果你使用过 Next.js 或类似框架，你会感到宾至如归
- **更少样板代码**：无需手动定义和维护路由配置
- **有序组织**：API 端点的自然组织方式

### **性能**

- **快速路由**：基于 Hono 的高性能路由引擎构建
- **最小开销**：轻量级抽象，不会影响速度
- **Bun 兼容**：利用 Bun 的卓越性能

### **灵活性**

- **框架无关**：适用于任何 Hono 应用程序
- **渐进式采用**：可以逐步集成到现有项目中
- **可定制**：各种配置选项以满足你的需求

## 与其他解决方案的比较

| 特性       | hono-filebased-route | 手动路由   | Express Router |
| ---------- | -------------------- | ---------- | -------------- |
| 设置复杂度 | ⭐⭐⭐⭐⭐           | ⭐⭐       | ⭐⭐⭐         |
| 类型安全   | ⭐⭐⭐⭐⭐           | ⭐⭐⭐     | ⭐⭐           |
| 性能       | ⭐⭐⭐⭐⭐           | ⭐⭐⭐⭐⭐ | ⭐⭐⭐         |
| 开发体验   | ⭐⭐⭐⭐⭐           | ⭐⭐       | ⭐⭐⭐         |
| 文件组织   | ⭐⭐⭐⭐⭐           | ⭐⭐       | ⭐⭐⭐         |

## 使用场景

hono-filebased-route 非常适合：

- **API 开发**：构建具有清晰组织的 RESTful API
- **微服务**：创建专注、结构良好的服务端点
- **快速原型**：快速构建用于测试的 API 端点
- **全栈应用**：Web 和移动应用的后端 API
- **无服务器函数**：组织无服务器函数端点

## 开始使用

准备开始了吗？查看我们的[快速开始指南](/zh/quick-started)在几分钟内启动并运行，或探索[安装指南](/zh/guides/installation)获取更详细的设置说明。

## 社区和支持

- **GitHub**：[仓库](https://github.com/HM-Suiji/hono-filebased-route)
- **问题**：报告错误和请求功能
- **讨论**：社区讨论和问题
- **文档**：这个综合指南

让我们一起构建令人惊叹的东西！🚀
