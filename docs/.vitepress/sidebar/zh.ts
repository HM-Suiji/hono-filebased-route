import { DefaultTheme } from 'vitepress'

export const zhSidebar: DefaultTheme.Sidebar = {
	'/zh/': [
		{
			text: '使用指南',
			collapsed: false,
			items: [
				{ text: '简介', link: `/zh/guide/` },
				{ text: '快速开始', link: `/zh/quick-started/` },
				{ text: '参考', link: `/zh/reference/` },
			],
		},
		{
			text: 'API',
			collapsed: false,
			items: [
				{ text: '简介', link: `/zh/abc/` },
				{ text: '快速开始', link: `/zh/bca/` },
			],
		},
	],
}
