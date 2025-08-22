import { defineConfig } from 'vitepress'
import tailwindcss from '@tailwindcss/vite'

// https://vitepress.dev/reference/site-config
export default defineConfig({
	title: 'Hono Filebased Route',
	description: 'A core utility for file-based routing in Hono applications.',
	themeConfig: {
		// https://vitepress.dev/reference/default-theme-config
		nav: [
			{ text: 'Home', link: '/' },
			{ text: 'Examples', link: '/markdown-examples' },
		],

		sidebar: [
			{
				text: 'Examples',
				items: [
					{ text: 'Markdown Examples', link: '/markdown-examples' },
					{ text: 'Runtime API Examples', link: '/api-examples' },
				],
			},
		],

		socialLinks: [
			{
				icon: 'github',
				link: 'https://github.com/HM-Suiji/hono-filebased-route',
			},
		],
	},
	vite: {
		plugins: [tailwindcss()],
	},
})
