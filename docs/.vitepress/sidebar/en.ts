import { DefaultTheme } from 'vitepress'

export const enSidebar: DefaultTheme.Sidebar = {
	'/': [
		{
			text: 'Guide',
			collapsed: false,
			items: [
				{ text: 'Introduction', link: `/introduction` },
				{ text: 'Installation', link: `/guides/installation` },
				{ text: 'Quick Start', link: `/quick-started` },
				{ text: 'Routing Patterns', link: '/guides/routing-patterns' },
				{ text: 'Dynamic Routes', link: '/guides/dynamic-routes' },
				{ text: 'Performance Guide', link: '/guides/performance' },
				{ text: 'Basic Usage', link: '/guides/basic-usage' },
				{ text: 'Advanced Features', link: '/guides/advanced-features' },
				{ text: 'Deploy', link: '/guides/deploy' },
				{ text: 'Troubleshooting', link: '/guides/troubleshooting' },
			],
		},
		{
			text: 'Reference',
			collapsed: false,
			items: [
				{ text: 'API Reference', link: `/reference/api` },
				{ text: 'Configuration', link: `/reference/configuration` },
				{ text: 'Type', link: `/reference/types` },
			],
		},
	],
}
