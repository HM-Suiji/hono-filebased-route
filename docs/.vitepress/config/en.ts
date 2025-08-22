import { enNav } from '../navbar'
import { enSidebar } from '../sidebar'
import dayjs from 'dayjs'
import type { DefaultTheme, LocaleSpecificConfig } from 'vitepress'

export const enConfig: LocaleSpecificConfig<DefaultTheme.Config> = {
	themeConfig: {
		nav: enNav,
		sidebar: enSidebar,
		footer: {
			message: 'Released under the MIT License.',
			copyright: `Copyright © ${dayjs().format('YYYY')} HM Suiji`,
		},
		outline: {
			level: [1, 6],
		},
	},
}
