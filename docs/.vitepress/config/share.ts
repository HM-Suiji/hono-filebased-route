import { defineConfig } from 'vitepress'
import timeline from 'vitepress-markdown-timeline'
import tailwindcss from '@tailwindcss/vite'

export const sharedConfig = defineConfig({
	rewrites: {
		'en/:rest*': ':rest*',
	},
	metaChunk: true,
	lang: 'en',
	title: 'Hono Filebased Route',
	description: 'A core utility for file-based routing in Hono applications.',
	head: [
		['link', { rel: 'shortcut icon', href: `logo.svg` }],
		['link', { rel: 'icon', href: `logo.svg`, type: 'image/svg+xml' }],
		['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
		[
			'link',
			{ rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
		],
		[
			'link',
			{
				href: 'https://fonts.googleapis.com/css2?family=Roboto&display=swap',
				rel: 'stylesheet',
			},
		],
		[
			'meta',
			{
				name: 'viewport',
				content:
					'width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no,shrink-to-fit=no',
			},
		],
		['meta', { name: 'keywords', content: 'xxx,xxx' }],
	],
	appearance: true,
	lastUpdated: true,
	vite: {
		build: {
			chunkSizeWarningLimit: 1600,
		},
		plugins: [tailwindcss()],
		server: {
			port: 3000,
		},
	},
	markdown: {
		math: true,
		lineNumbers: true,
		image: {
			lazyLoading: true,
		},
		config: (md) => {
			md.use(timeline)
		},
	},
	themeConfig: {
		search: {
			provider: 'local',
			options: {
				locales: {
					root: {
						translations: {
							button: {
								buttonText: 'Search',
								buttonAriaLabel: 'Search',
							},
							modal: {
								displayDetails: 'Display detailed list',
								resetButtonTitle: 'Reset search',
								backButtonTitle: 'Close search',
								noResultsText: 'No results for',
								footer: {
									selectText: 'to select',
									selectKeyAriaLabel: 'enter',
									navigateText: 'to navigate',
									navigateUpKeyAriaLabel: 'up arrow',
									navigateDownKeyAriaLabel: 'down arrow',
									closeText: 'to close',
									closeKeyAriaLabel: 'escape',
								},
							},
						},
					},
				},
			},
		},
		logo: '/logo.svg',
		socialLinks: [
			{
				icon: 'npm',
				link: 'https://www.npmjs.com/package/@hono-filebased-route/core',
			},
			{
				icon: 'github',
				link: 'https://github.com/HM-Suiji/hono-filebased-route',
			},
		],
	},
})
