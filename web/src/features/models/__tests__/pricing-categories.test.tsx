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
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'

import { PricingCategoriesSection } from '../components/pricing-categories-section'

const stored = [
  {
    id: 'sd20',
    name: 'Seedance 2.0',
    description: 'Seedance 2.0 lines',
    models: ['sd-2.0-line-1'],
  },
  { id: 'sd25', name: 'Seedance 2.5', description: '', models: ['G2-V'] },
]

function mockApi() {
  vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
    if (url === '/api/option/') {
      return {
        data: {
          success: true,
          data: [{ key: 'PricingCategories', value: JSON.stringify(stored) }],
        },
      }
    }
    if (url === '/api/channel/models_enabled') {
      return {
        data: {
          success: true,
          data: ['sd-2.0-line-1', 'seedance-2.0', 'G2-V'],
        },
      }
    }
    throw new Error(`unexpected GET ${url}`)
  })
  return vi.spyOn(api, 'put').mockResolvedValue({ data: { success: true } })
}

function renderSection() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <PricingCategoriesSection />
    </QueryClientProvider>
  )
}

function savedCategories(put: ReturnType<typeof mockApi>) {
  const request = put.mock.calls.at(-1)?.[1] as { key: string; value: string }
  expect(request.key).toBe('PricingCategories')
  return JSON.parse(request.value) as typeof stored
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('pricing categories management', () => {
  it('offers only models free of other categories and saves the edited category', async () => {
    const user = userEvent.setup()
    const put = mockApi()
    renderSection()

    const item = (
      await screen.findByRole('heading', { name: 'Seedance 2.0' })
    ).closest('li') as HTMLElement
    await user.click(within(item).getByRole('button', { name: 'Edit' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('combobox'))

    expect(
      await screen.findByRole('option', { name: /seedance-2\.0/ })
    ).toBeVisible()
    expect(screen.queryByRole('option', { name: /G2-V/ })).toBeNull()

    await user.click(screen.getByRole('option', { name: /seedance-2\.0/ }))
    await user.keyboard('{Escape}')
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(put).toHaveBeenCalledOnce())
    expect(savedCategories(put)).toEqual([
      { ...stored[0], models: ['sd-2.0-line-1', 'seedance-2.0'] },
      stored[1],
    ])
  })

  it('saves the new order when a category moves down', async () => {
    const user = userEvent.setup()
    const put = mockApi()
    renderSection()

    const item = (
      await screen.findByRole('heading', { name: 'Seedance 2.0' })
    ).closest('li') as HTMLElement
    expect(within(item).getByRole('button', { name: 'Move up' })).toBeDisabled()
    await user.click(within(item).getByRole('button', { name: 'Move down' }))

    await waitFor(() => expect(put).toHaveBeenCalledOnce())
    expect(savedCategories(put).map((category) => category.id)).toEqual([
      'sd25',
      'sd20',
    ])
  })

  it('saves the reordered models with the badges picked for them', async () => {
    const user = userEvent.setup()
    const put = mockApi()
    renderSection()

    const item = (
      await screen.findByRole('heading', { name: 'Seedance 2.0' })
    ).closest('li') as HTMLElement
    await user.click(within(item).getByRole('button', { name: 'Edit' }))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('combobox'))
    await user.click(
      await screen.findByRole('option', { name: /seedance-2\.0/ })
    )
    await user.keyboard('{Escape}')

    await user.click(
      within(dialog).getByRole('button', { name: 'Move seedance-2.0 up' })
    )
    const badges = within(dialog).getByRole('group', {
      name: 'Badges for seedance-2.0',
    })
    await user.click(within(badges).getByRole('button', { name: 'HOT' }))
    await user.click(
      within(badges).getByRole('button', { name: 'Recommended' })
    )
    await user.click(within(dialog).getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(put).toHaveBeenCalledOnce())
    expect(savedCategories(put)[0]).toEqual({
      ...stored[0],
      models: ['seedance-2.0', 'sd-2.0-line-1'],
      badges: { 'seedance-2.0': ['recommended', 'hot'] },
    })
  })
})
