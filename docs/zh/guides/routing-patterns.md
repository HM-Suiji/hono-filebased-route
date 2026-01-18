# 路由模式

路由由 routes 目录下的文件路径推导。

| 文件路径 | 路由路径 | 说明 |
| --- | --- | --- |
| `src/routes/index.ts` | `/` | 根索引 |
| `src/routes/about.ts` | `/about` | 静态路由 |
| `src/routes/users/index.ts` | `/users` | 嵌套索引 |
| `src/routes/users/[id].ts` | `/users/:id` | 动态参数 |
| `src/routes/articles/[...slug].ts` | `/articles/*` | 通配符 |

## 嵌套路由

```
src/routes/api/users/index.ts  -> /api/users
src/routes/api/users/[id].ts   -> /api/users/:id
```

## Index 规则

- `index.ts` 对应 `/`
- `folder/index.ts` 对应 `/folder`
