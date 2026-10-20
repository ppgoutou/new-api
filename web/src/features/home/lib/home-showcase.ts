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

/**
 * Home page video settings stored in the `HomeShowcase` option as JSON.
 * Media fields hold an uploaded file URL (`/home-media/<name>`) or an https
 * link; an empty video leaves the built-in default for that slot.
 */
export type HomeShowcaseItem = {
  title: string
  category: string
  prompt: string
  spec: string
  video: string
  poster: string
  /** Input image; used by the image-to-video slot only. */
  image: string
}

export type HomeShowcaseSettings = {
  hero: HomeShowcaseItem
  imageToVideo: HomeShowcaseItem
  showcase: HomeShowcaseItem[]
}

export const HOME_SHOWCASE_OPTION_KEY = 'HomeShowcase'
export const HOME_SHOWCASE_MAX_ITEMS = 30
export const HOME_MEDIA_URL_PREFIX = '/home-media/'

export const EMPTY_SHOWCASE_ITEM: HomeShowcaseItem = {
  title: '',
  category: '',
  prompt: '',
  spec: '',
  video: '',
  poster: '',
  image: '',
}

export const EMPTY_HOME_SHOWCASE: HomeShowcaseSettings = {
  hero: EMPTY_SHOWCASE_ITEM,
  imageToVideo: EMPTY_SHOWCASE_ITEM,
  showcase: [],
}

function readItem(value: unknown): HomeShowcaseItem {
  const source =
    value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const text = (key: keyof HomeShowcaseItem) =>
    typeof source[key] === 'string' ? (source[key] as string) : ''
  return {
    title: text('title'),
    category: text('category'),
    prompt: text('prompt'),
    spec: text('spec'),
    video: text('video'),
    poster: text('poster'),
    image: text('image'),
  }
}

/** Parses the stored option; unreadable or empty values give empty settings. */
export function parseHomeShowcase(
  raw: string | undefined
): HomeShowcaseSettings {
  if (!raw?.trim()) return EMPTY_HOME_SHOWCASE
  let data: unknown
  try {
    data = JSON.parse(raw)
  } catch {
    return EMPTY_HOME_SHOWCASE
  }
  if (!data || typeof data !== 'object') return EMPTY_HOME_SHOWCASE
  const record = data as Record<string, unknown>
  return {
    hero: readItem(record.hero),
    imageToVideo: readItem(record.image_to_video),
    showcase: Array.isArray(record.showcase)
      ? record.showcase.map(readItem)
      : [],
  }
}

function hasContent(item: HomeShowcaseItem): boolean {
  return Object.values(item).some((value) => value.trim() !== '')
}

/**
 * Serializes settings for the option. Blank showcase rows are dropped, and
 * settings with nothing filled in become '' so the built-in page returns.
 */
export function serializeHomeShowcase(settings: HomeShowcaseSettings): string {
  const showcase = settings.showcase.filter(hasContent)
  if (
    !hasContent(settings.hero) &&
    !hasContent(settings.imageToVideo) &&
    showcase.length === 0
  ) {
    return ''
  }
  return JSON.stringify({
    hero: settings.hero,
    image_to_video: settings.imageToVideo,
    showcase,
  })
}

/** Uploaded files referenced by the settings, as `/home-media/...` URLs. */
export function collectUploadedMedia(settings: HomeShowcaseSettings): string[] {
  const items = [settings.hero, settings.imageToVideo, ...settings.showcase]
  return items
    .flatMap((item) => [item.video, item.poster, item.image])
    .filter((url) => url.startsWith(HOME_MEDIA_URL_PREFIX))
}
