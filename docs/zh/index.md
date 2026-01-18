---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
lang: zh-CN

hero:
  name: 'Hono Filebased Route'
  text: '为 Hono 提供文件路由'
  tagline: 从文件系统生成或注册路由。
  image:
    src: /logo.svg
    alt: Hono Filebased Route
  actions:
    - theme: brand
      text: 快速开始
      link: /zh/quick-started
    - theme: alt
      text: Github
      link: https://github.com/HM-Suiji/hono-filebased-route

features:
  - title: 📁 文件到路由映射
    details: 将 src/routes 路径映射为 Hono 路由，支持 index、参数与通配符
  - title: 🧩 三种接入方式
    details: 预生成文件、运行时注册，或 Vite 插件开发期更新
  - title: ⚙️ 小而清晰的 API
    details: 只关注路由扫描与注册
---
