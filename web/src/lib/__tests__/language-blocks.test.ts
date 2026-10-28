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
import { describe, expect, it } from 'vitest'

import {
  joinLanguageBlocks,
  parseLanguageBlocks,
  selectLanguageBlock,
} from '@/lib/language-blocks'

const BILINGUAL = `<style>.about { color: red }</style>
<!-- lang:en -->
<h2>About us</h2>
<!-- lang:zh -->
<h2>关于我们</h2>`

describe('selectLanguageBlock', () => {
  it('returns content without language markers unchanged', () => {
    const content = '<p>© 2026 API-Finder</p>\n<!-- a normal comment -->'
    expect(selectLanguageBlock(content, 'zhCN')).toBe(content)
  })

  it.each(['zhCN', 'zhTW'])(
    'keeps the shared prefix and the Chinese block for %s',
    (language) => {
      expect(selectLanguageBlock(BILINGUAL, language)).toBe(
        '<style>.about { color: red }</style>\n<h2>关于我们</h2>'
      )
    }
  )

  it.each(['en', 'fr', 'ru', 'ja', 'vi', 'xx'])(
    'falls back to the English block for %s',
    (language) => {
      expect(selectLanguageBlock(BILINGUAL, language)).toBe(
        '<style>.about { color: red }</style>\n<h2>About us</h2>'
      )
    }
  )

  it('prefers a traditional Chinese block for zhTW', () => {
    const content =
      '<!-- lang:en -->Hello<!-- lang:zh -->你好<!-- lang:zh-TW -->妳好'
    expect(selectLanguageBlock(content, 'zhTW')).toBe('妳好')
    expect(selectLanguageBlock(content, 'zhCN')).toBe('你好')
  })

  it('uses the first block when neither the language nor English exists', () => {
    expect(selectLanguageBlock('<!-- lang:zh -->只有中文', 'fr')).toBe(
      '只有中文'
    )
  })

  it('treats an empty block as missing', () => {
    expect(
      selectLanguageBlock('<!-- lang:en -->Hello<!-- lang:zh -->  ', 'zhCN')
    ).toBe('Hello')
  })
})

describe('parseLanguageBlocks and joinLanguageBlocks', () => {
  it('splits the shared prefix from each language block', () => {
    expect(parseLanguageBlocks(BILINGUAL)).toEqual({
      shared: '<style>.about { color: red }</style>',
      blocks: [
        { locale: 'en', text: '<h2>About us</h2>' },
        { locale: 'zh', text: '<h2>关于我们</h2>' },
      ],
    })
  })

  it('treats unmarked content as shared text', () => {
    expect(parseLanguageBlocks('Plain text')).toEqual({
      shared: 'Plain text',
      blocks: [],
    })
  })

  it('writes Chinese first and drops empty blocks', () => {
    expect(
      joinLanguageBlocks({
        shared: '',
        blocks: [
          { locale: 'en', text: 'Hello' },
          { locale: 'ja', text: '  ' },
          { locale: 'zh', text: '你好' },
        ],
      })
    ).toBe('<!-- lang:zh -->\n你好\n<!-- lang:en -->\nHello')
  })

  it('returns plain shared text when no block has content', () => {
    expect(
      joinLanguageBlocks({
        shared: 'Plain text',
        blocks: [{ locale: 'en', text: '' }],
      })
    ).toBe('Plain text')
  })

  it('round-trips content that selectLanguageBlock reads the same way', () => {
    const joined = joinLanguageBlocks(parseLanguageBlocks(BILINGUAL))
    expect(selectLanguageBlock(joined, 'en')).toBe(
      selectLanguageBlock(BILINGUAL, 'en')
    )
    expect(selectLanguageBlock(joined, 'zhCN')).toBe(
      selectLanguageBlock(BILINGUAL, 'zhCN')
    )
  })
})
