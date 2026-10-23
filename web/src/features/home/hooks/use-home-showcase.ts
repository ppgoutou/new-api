/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { getHomeShowcase } from '../api'
import { localizeShowcaseItem, parseHomeShowcase } from '../lib/home-showcase'

export const HOME_SHOWCASE_QUERY_KEY = ['home-showcase'] as const

/**
 * Home page video settings from the admin, in the interface language. While
 * loading or on failure the settings are empty, so every slot shows its
 * built-in default.
 */
export function useHomeShowcase() {
  const { i18n } = useTranslation()
  const language = i18n.resolvedLanguage || i18n.language
  const { data } = useQuery({
    queryKey: HOME_SHOWCASE_QUERY_KEY,
    queryFn: getHomeShowcase,
    staleTime: 60 * 1000,
    meta: { errorToast: false },
  })
  const settings = parseHomeShowcase(data?.success ? data.data : '')
  return {
    hero: localizeShowcaseItem(settings.hero, language),
    imageToVideo: localizeShowcaseItem(settings.imageToVideo, language),
    showcase: settings.showcase.map((item) =>
      localizeShowcaseItem(item, language)
    ),
  }
}
