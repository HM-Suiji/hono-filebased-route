import { DefaultTheme } from 'vitepress'

// 中文导航
export const zhNav: DefaultTheme.NavItem[] = [
	{ text: '首页', link: '/zh/', activeMatch: '/zh/' },
	{
		text: '快速开始',
		link: '/zh/quick-started/',
		activeMatch: '/zh/quick-started/',
	},
	{ text: '参考', link: '/zh/reference/', activeMatch: '/zh/reference/' },
]
