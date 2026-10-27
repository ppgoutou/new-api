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
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { getSupportQqChatUrl } from '@/features/home/lib/video-home'

import { LandingContacts } from '../components/landing-contacts'

describe('LandingContacts', () => {
  it('links the Telegram card to the support account in a new tab', () => {
    render(<LandingContacts />)

    const telegram = screen.getByRole('link', { name: /@APIFinder_Support/ })
    expect(telegram).toHaveAttribute('href', 'https://t.me/APIFinder_Support')
    expect(telegram).toHaveAttribute('target', '_blank')
  })

  it('links the QQ card to a chat with the support QQ number', () => {
    render(<LandingContacts />)

    expect(screen.getByRole('link', { name: /3895235714/ })).toHaveAttribute(
      'href',
      getSupportQqChatUrl(navigator.userAgent)
    )
  })
})

describe('getSupportQqChatUrl', () => {
  it('opens the desktop QQ client for a desktop browser', () => {
    expect(
      getSupportQqChatUrl(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      )
    ).toBe('tencent://message/?uin=3895235714&Site=api-finder&Menu=yes')
  })

  it.each([
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    'Mozilla/5.0 (Linux; Android 14; Pixel 8)',
  ])('opens mobile QQ for %s', (userAgent) => {
    expect(getSupportQqChatUrl(userAgent)).toBe(
      'mqqwpa://im/chat?chat_type=wpa&uin=3895235714&version=1&src_type=web'
    )
  })
})
