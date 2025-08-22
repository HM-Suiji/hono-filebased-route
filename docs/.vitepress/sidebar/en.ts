import { DefaultTheme } from 'vitepress'

export const enSidebar: DefaultTheme.Sidebar = {
	'/': [
		{
			text: 'Guide',
			collapsed: false,
			items: [
				{ text: 'guide', link: `/guide/` },
				{ text: 'quick started', link: `/quick-started/` },
				{ text: 'reference', link: `/reference/` },
			],
		},
		{
			text: 'API',
			collapsed: false,
			items: [
				{ text: 'guide', link: `/abc/` },
				{ text: 'quick started', link: `/bca/` },
			],
		},
	],
}
