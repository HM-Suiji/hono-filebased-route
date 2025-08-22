import { defineConfig } from 'vitepress'
import { sharedConfig } from './config/share'
import { zhConfig } from './config/zh'
import { enConfig } from './config/en'

// https://vitepress.dev/reference/site-config
export default defineConfig({
	...sharedConfig,
	locales: {
		root: {
			label: 'English',
			lang: 'en',
			...enConfig,
		},
		zh: {
			label: '简体中文',
			lang: 'zh-CN',
			link: '/zh/',
			...zhConfig,
		},
	},
	cleanUrls: true,
})
