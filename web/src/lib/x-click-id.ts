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
 * Cookie that carries the X ad click ID (`twclid`) to the server, which
 * reports sign-ups and top-ups from that visit to the X Conversion API.
 * Must match `xClickIdCookie` in controller/x_conversion.go.
 */
export const X_CLICK_ID_COOKIE = 'twclid'

/** How long a click stays attributable: 30 days, in seconds. */
const X_CLICK_ID_MAX_AGE = 30 * 24 * 60 * 60

/**
 * Saves the `twclid` URL parameter of a landing from an X ad in a first-party
 * cookie. Visits without the parameter keep any saved click ID.
 */
export function rememberXClickId(search: string): void {
  const clickId = new URLSearchParams(search).get('twclid')?.trim()
  if (!clickId || clickId.length > 255) return
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${X_CLICK_ID_COOKIE}=${encodeURIComponent(clickId)}; Max-Age=${X_CLICK_ID_MAX_AGE}; Path=/; SameSite=Lax${secure}`
}
