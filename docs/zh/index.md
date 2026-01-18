---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
lang: zh-CN

hero:
  name: 'Hono Filebased Route'
  text: 'File-based routing for Hono.'
  tagline: Generate or register routes from your filesystem.
  image:
    src: /logo.svg
    alt: Hono Filebased Route
  actions:
    - theme: brand
      text: Quick Start
      link: /zh/quick-started
    - theme: alt
      text: Github
      link: https://github.com/HM-Suiji/hono-filebased-route

features:
  - title: 📁 File-to-Route Mapping
    details: Map src/routes file paths to Hono routes, including index, params, and catch-all
  - title: 🧩 Three Integration Modes
    details: Core generator, runtime registration, or Vite plugin for dev-time updates
  - title: ⚙️ Minimal API Surface
    details: A small set of helpers focused on route discovery and registration
---
