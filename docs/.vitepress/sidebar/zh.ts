import { DefaultTheme } from 'vitepress'

export const zhSidebar: DefaultTheme.Sidebar = {
	'/zh/': [
		{
			text: '使用指南',
			collapsed: false,
			items: [
				{ text: '介绍', link: `/zh/introduction` },
				{ text: '安装', link: `/zh/guides/installation` },
				{ text: '快速开始', link: `/zh/quick-started` },
				{ text: '路由模式', link: '/zh/guides/routing-patterns' },
				{ text: '动态路由', link: '/zh/guides/dynamic-routes' },
				{ text: '性能指南', link: '/zh/guides/performance' },
				{ text: '基础用法', link: '/zh/guides/basic-usage' },
				{ text: '高级功能', link: '/zh/guides/advanced-features' },
				{ text: '部署', link: '/zh/guides/deploy' },
				{ text: '故障排除', link: '/zh/guides/troubleshooting' },
			],
		},
		{
			text: '参考',
			collapsed: false,
			items: [
				{ text: 'API 参考', link: `/zh/reference/api` },
				{ text: '配置参考', link: `/zh/reference/configuration` },
				{ text: '类型定义', link: `/zh/reference/types` },
			],
		},
	],
}
