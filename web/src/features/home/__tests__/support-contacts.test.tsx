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
import i18next from 'i18next'
import { afterEach, describe, expect, it } from 'vitest'

import { SupportContacts } from '../components/support-contacts'

afterEach(async () => {
  await i18next.changeLanguage('en')
})

function contactOrder(): string[] {
  return screen
    .getAllByRole('listitem')
    .map((item) => (item.textContent?.includes('QQ') ? 'qq' : 'telegram'))
}

describe('SupportContacts', () => {
  it('lists Telegram first for non-Chinese interfaces', () => {
    render(<SupportContacts />)

    expect(contactOrder()).toEqual(['telegram', 'qq'])
    expect(
      screen.getByRole('link', { name: '@APIFinder_Support' })
    ).toHaveAttribute('href', 'https://t.me/APIFinder_Support')
  })

  it.each(['zhCN', 'zhTW'])('lists QQ first for %s', async (language) => {
    await i18next.changeLanguage(language)
    render(<SupportContacts />)

    expect(contactOrder()).toEqual(['qq', 'telegram'])
    expect(screen.getByText('3895235714')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Copy QQ number' })
    ).toBeInTheDocument()
  })
})
