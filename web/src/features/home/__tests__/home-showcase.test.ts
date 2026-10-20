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
  collectUploadedMedia,
  EMPTY_HOME_SHOWCASE,
  EMPTY_SHOWCASE_ITEM,
  parseHomeShowcase,
  serializeHomeShowcase,
} from '../lib/home-showcase'

const VIDEO = '/home-media/0123456789abcdef0123456789abcdef.mp4'

describe('home showcase settings', () => {
  it.each(['', '   ', '{not json', '42', 'null'])(
    'reads %j as empty settings',
    (raw) => {
      expect(parseHomeShowcase(raw)).toEqual(EMPTY_HOME_SHOWCASE)
    }
  )

  it('keeps only known text fields when reading stored settings', () => {
    const settings = parseHomeShowcase(
      JSON.stringify({
        hero: { title: 'Hero', video: VIDEO, extra: 'x', spec: 3 },
        showcase: [{ title: 'Clip', category: 'Ads' }, 'not an item'],
      })
    )

    expect(settings.hero).toEqual({
      ...EMPTY_SHOWCASE_ITEM,
      title: 'Hero',
      video: VIDEO,
    })
    expect(settings.imageToVideo).toEqual(EMPTY_SHOWCASE_ITEM)
    expect(settings.showcase).toEqual([
      { ...EMPTY_SHOWCASE_ITEM, title: 'Clip', category: 'Ads' },
      EMPTY_SHOWCASE_ITEM,
    ])
  })

  it('drops blank clips and stores nothing when every slot is empty', () => {
    expect(
      serializeHomeShowcase({
        ...EMPTY_HOME_SHOWCASE,
        showcase: [EMPTY_SHOWCASE_ITEM, { ...EMPTY_SHOWCASE_ITEM, title: ' ' }],
      })
    ).toBe('')
  })

  it('round-trips filled settings through the stored JSON', () => {
    const settings = {
      ...EMPTY_HOME_SHOWCASE,
      showcase: [
        { ...EMPTY_SHOWCASE_ITEM, title: 'Clip', video: VIDEO },
        EMPTY_SHOWCASE_ITEM,
      ],
    }

    expect(parseHomeShowcase(serializeHomeShowcase(settings))).toEqual({
      ...settings,
      showcase: [settings.showcase[0]],
    })
  })

  it('lists only uploaded files among the media links', () => {
    expect(
      collectUploadedMedia({
        hero: {
          ...EMPTY_SHOWCASE_ITEM,
          video: VIDEO,
          poster: 'https://x.test/p.jpg',
        },
        imageToVideo: EMPTY_SHOWCASE_ITEM,
        showcase: [],
      })
    ).toEqual([VIDEO])
  })
})
