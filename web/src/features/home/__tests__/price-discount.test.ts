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

import { getPriceDiscount } from '../lib/video-home'

describe('home price discount', () => {
  it.each([
    [0.75, { percentOff: 25, zhe: '7.5' }],
    [0.65, { percentOff: 35, zhe: '6.5' }],
    [0.7, { percentOff: 30, zhe: '7' }],
  ])('describes a %s group ratio as a discount', (ratio, expected) => {
    expect(getPriceDiscount(ratio)).toEqual(expected)
  })

  it.each([1, 1.2, 0, -0.5, Number.NaN])(
    'reports no discount for a %s group ratio',
    (ratio) => {
      expect(getPriceDiscount(ratio)).toBeNull()
    }
  )
})
