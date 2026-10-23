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
import { afterEach, describe, expect, it } from 'vitest'

import { rememberXClickId, X_CLICK_ID_COOKIE } from '@/lib/x-click-id'

function savedClickId(): string | undefined {
  const entry = document.cookie
    .split('; ')
    .find((item) => item.startsWith(`${X_CLICK_ID_COOKIE}=`))
  return entry ? decodeURIComponent(entry.split('=')[1]) : undefined
}

afterEach(() => {
  document.cookie = `${X_CLICK_ID_COOKIE}=; Max-Age=0; Path=/`
})

describe('rememberXClickId', () => {
  it('saves the twclid parameter of an X ad landing', () => {
    rememberXClickId('?utm_source=x&twclid=2-abc%2Bdef')
    expect(savedClickId()).toBe('2-abc+def')
  })

  it('keeps the saved click ID on a visit without twclid', () => {
    rememberXClickId('?twclid=first-click')
    rememberXClickId('?ref=home')
    expect(savedClickId()).toBe('first-click')
  })

  it.each(['?twclid=', '?twclid=%20%20', `?twclid=${'x'.repeat(256)}`])(
    'ignores an empty or oversized twclid (%#)',
    (search) => {
      rememberXClickId(search)
      expect(savedClickId()).toBeUndefined()
    }
  )
})
