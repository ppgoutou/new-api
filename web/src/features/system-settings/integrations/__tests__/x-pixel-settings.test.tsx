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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, expect, test, vi } from 'vitest'

import { api } from '@/lib/api'

import { SettingsPageProvider } from '../../components/settings-page-context'
import { XPixelSettingsSection } from '../x-pixel-settings-section'

function Fixture() {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  return (
    <>
      <div ref={setContainer} />
      <SettingsPageProvider actionsContainer={container}>
        <XPixelSettingsSection
          defaultValues={{
            XPixelToken: '',
            XPixelSignupEventId: 'tw-rhw6r-rhw8g',
            XPixelPurchaseEventId: '',
          }}
        />
      </SettingsPageProvider>
    </>
  )
}

function renderSettings() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <Fixture />
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.spyOn(api, 'get').mockResolvedValue({
    data: { success: true, data: null },
  })
  vi.spyOn(api, 'put').mockResolvedValue({ data: { success: true } })
})

test('saving a new token and event ID sends only those options and clears the token field', async () => {
  const user = userEvent.setup()
  renderSettings()

  const token = screen.getByLabelText('Access token')
  await user.type(token, ' secret-token ')
  await user.type(screen.getByLabelText('Top-up event ID'), 'tw-rhw6r-rhw8j')
  await user.click(screen.getByRole('button', { name: 'Save Changes' }))

  await waitFor(() => expect(api.put).toHaveBeenCalledTimes(2))
  expect(api.put).toHaveBeenCalledWith('/api/option/', {
    key: 'XPixelToken',
    value: 'secret-token',
  })
  expect(api.put).toHaveBeenCalledWith('/api/option/', {
    key: 'XPixelPurchaseEventId',
    value: 'tw-rhw6r-rhw8j',
  })
  await waitFor(() => expect(token).toHaveValue(''))
})

test('a blank token field keeps the saved token', async () => {
  const user = userEvent.setup()
  renderSettings()

  await user.clear(screen.getByLabelText('Sign-up event ID'))
  await user.click(screen.getByRole('button', { name: 'Save Changes' }))

  await waitFor(() => expect(api.put).toHaveBeenCalledTimes(1))
  expect(api.put).toHaveBeenCalledWith('/api/option/', {
    key: 'XPixelSignupEventId',
    value: '',
  })
})

test('an event ID in the wrong format is rejected without saving', async () => {
  const user = userEvent.setup()
  renderSettings()

  await user.type(screen.getByLabelText('Top-up event ID'), 'rhw8j')
  await user.click(screen.getByRole('button', { name: 'Save Changes' }))

  expect(
    await screen.findByText('Use an event ID like tw-rhw6r-xxxxx')
  ).toBeVisible()
  expect(api.put).not.toHaveBeenCalled()
})
