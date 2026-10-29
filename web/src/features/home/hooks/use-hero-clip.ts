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
import { useTranslation } from 'react-i18next'

import { getHomeMediaUrl, HERO_VIDEO } from '../lib/video-home'
import { useHomeShowcase } from './use-home-showcase'

/** The home hero clip: an admin-uploaded hero replaces the built-in clip and its copy as a whole. */
export function useHeroClip() {
  const { t } = useTranslation()
  const configured = useHomeShowcase().hero
  if (configured.video) return configured
  return {
    title: t(HERO_VIDEO.title),
    prompt: t(HERO_VIDEO.prompt),
    spec: HERO_VIDEO.spec,
    video: getHomeMediaUrl(`${HERO_VIDEO.name}.mp4`),
    poster: getHomeMediaUrl(`${HERO_VIDEO.name}.jpg`),
  }
}
