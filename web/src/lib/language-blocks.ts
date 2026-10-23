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
import { resolveLocalizedText } from '@/lib/localized-text'

/** i18n key: how admins write language blocks, shown under content fields. */
export const LANGUAGE_BLOCKS_HINT =
  'To add other languages, start each version with a line such as <!-- lang:en --> or <!-- lang:zh -->. Text before the first such line shows in every language.'

/** Opens a language block, e.g. `<!-- lang:en -->` or `<!-- lang:zh-TW -->`. */
const LANGUAGE_MARKER =
  /<!--\s*lang:\s*([A-Za-z]{2,3}(?:[-_][A-Za-z0-9]+)*)\s*-->/g

/**
 * Picks the interface language's version of admin-written content (footer,
 * notice, about page, legal documents, model descriptions).
 *
 * Content may hold one block per language, each opened by a
 * `<!-- lang:xx -->` line. Text before the first marker, such as a `<style>`
 * block, is kept for every language. The block falls back from the exact
 * language to its base (`zh` for `zhCN` / `zhTW`), then English, then the
 * first block. Content without markers is returned unchanged.
 */
export function selectLanguageBlock(content: string, language: string): string {
  const markers = [...content.matchAll(LANGUAGE_MARKER)]
  if (markers.length === 0) return content

  const blocks: Record<string, string> = {}
  markers.forEach((marker, index) => {
    const start = marker.index + marker[0].length
    const end = markers[index + 1]?.index ?? content.length
    blocks[marker[1]] = content.slice(start, end).trim()
  })
  const shared = content.slice(0, markers[0].index).trim()
  const block = resolveLocalizedText(blocks, language)
  return [shared, block].filter(Boolean).join('\n')
}
