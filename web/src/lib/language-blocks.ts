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
  'Switch languages to edit each version. Visitors see the version for their interface language, falling back to English; text under All languages shows in every language.'

/** Languages the admin editor offers, in tab order; Chinese comes first. */
export const LANGUAGE_BLOCK_LOCALES = [
  'zh',
  'zh-TW',
  'en',
  'ja',
  'fr',
  'ru',
  'vi',
] as const

/** Admin lists and cards preview language blocks in Chinese. */
export const ADMIN_PREVIEW_LANGUAGE = 'zh'

/** Opens a language block, e.g. `<!-- lang:en -->` or `<!-- lang:zh-TW -->`. */
const LANGUAGE_MARKER =
  /<!--\s*lang:\s*([A-Za-z]{2,3}(?:[-_][A-Za-z0-9]+)*)\s*-->/g

/** Admin-written content split into its shared text and per-language blocks. */
export type LanguageBlocks = {
  /** Text before the first marker; shown in every language. */
  shared: string
  blocks: Array<{ locale: string; text: string }>
}

/** Splits content at its `<!-- lang:xx -->` markers; unmarked content is all shared. */
export function parseLanguageBlocks(content: string): LanguageBlocks {
  const markers = [...content.matchAll(LANGUAGE_MARKER)]
  if (markers.length === 0) return { shared: content, blocks: [] }

  return {
    shared: content.slice(0, markers[0].index).trim(),
    blocks: markers.map((marker, index) => ({
      locale: marker[1],
      text: content
        .slice(
          marker.index + marker[0].length,
          markers[index + 1]?.index ?? content.length
        )
        .trim(),
    })),
  }
}

/**
 * Writes shared text and language blocks back as one string, editor languages
 * first. Empty blocks are dropped; with none left the shared text is returned
 * as-is, so plain content stays plain.
 */
export function joinLanguageBlocks(value: LanguageBlocks): string {
  const blocks = value.blocks.filter((block) => block.text.trim())
  if (blocks.length === 0) return value.shared

  const rank = (locale: string) => {
    const index = LANGUAGE_BLOCK_LOCALES.findIndex(
      (known) => known.toLowerCase() === locale.toLowerCase()
    )
    return index === -1 ? LANGUAGE_BLOCK_LOCALES.length : index
  }
  const ordered = [...blocks].sort(
    (left, right) => rank(left.locale) - rank(right.locale)
  )
  return [
    value.shared.trim(),
    ...ordered.map(
      (block) => `<!-- lang:${block.locale} -->\n${block.text.trim()}`
    ),
  ]
    .filter(Boolean)
    .join('\n')
}

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
  const parsed = parseLanguageBlocks(content)
  if (parsed.blocks.length === 0) return content

  const blocks: Record<string, string> = {}
  parsed.blocks.forEach((block) => {
    blocks[block.locale] = block.text
  })
  const block = resolveLocalizedText(blocks, language)
  return [parsed.shared, block].filter(Boolean).join('\n')
}
