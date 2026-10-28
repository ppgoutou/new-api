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

import { OnboardingSection } from '../components/onboarding/onboarding-section'

const alpha = { id: 1, name: 'alpha', type: 1, group: 'default,vip', status: 1 }
const beta = { id: 2, name: 'beta', type: 1, group: 'default', status: 1 }

const overview = {
  items: [
    {
      model_name: 'gpt-new',
      pending_channels: [alpha, beta],
      channels: [],
      metadata_id: 0,
    },
    {
      model_name: 'gpt-done',
      pending_channels: [],
      channels: [alpha],
      metadata_id: 3,
    },
  ],
  tags: ['chat'],
}

const categories = [
  { id: 'chat', name: 'Chat', description: '', models: ['gpt-done'] },
]

function mockApi() {
  vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
    if (url === '/api/models/onboarding') {
      return { data: { success: true, data: overview } }
    }
    if (url === '/api/option/') {
      return {
        data: {
          success: true,
          data: [
            { key: 'PricingCategories', value: JSON.stringify(categories) },
          ],
        },
      }
    }
    if (url === '/api/vendors/') {
      return {
        data: {
          success: true,
          data: { items: [], total: 0, page: 1, page_size: 1000 },
        },
      }
    }
    throw new Error(`unexpected GET ${url}`)
  })
  const post = vi
    .spyOn(api, 'post')
    .mockResolvedValue({ data: { success: true } })
  const put = vi
    .spyOn(api, 'put')
    .mockResolvedValue({ data: { success: true } })
  return { post, put }
}

function renderSection() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <OnboardingSection />
    </QueryClientProvider>
  )
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('model onboarding workbench', () => {
  it('lists unfinished models under To do and every model under All', async () => {
    const user = userEvent.setup()
    mockApi()
    renderSection()

    expect(await screen.findByRole('button', { name: /gpt-new/ })).toBeVisible()
    expect(screen.queryByRole('button', { name: /gpt-done/ })).toBeNull()

    await user.click(screen.getByRole('tab', { name: /All/ }))

    expect(screen.getByRole('button', { name: /gpt-done/ })).toBeVisible()
  })

  it('adds the selected model only to the checked upstream channels', async () => {
    const user = userEvent.setup()
    const { post } = mockApi()
    renderSection()

    await user.click(await screen.findByRole('button', { name: /gpt-new/ }))
    const channels = screen
      .getByRole('heading', { name: 'Offered by upstream' })
      .closest('section') as HTMLElement
    await user.click(within(channels).getAllByRole('checkbox')[1])
    await user.click(
      within(channels).getByRole('button', {
        name: 'Add to selected channels',
      })
    )

    await waitFor(() => expect(post).toHaveBeenCalledOnce())
    expect(post).toHaveBeenCalledWith('/api/channel/upstream_updates/apply', {
      id: 1,
      add_models: ['gpt-new'],
    })
  })

  it('creates metadata for a model that has none', async () => {
    const user = userEvent.setup()
    const { post } = mockApi()
    post.mockResolvedValue({ data: { success: true, data: { id: 9 } } })
    renderSection()

    await user.click(await screen.findByRole('button', { name: /gpt-new/ }))
    const save = screen.getByRole('button', { name: 'Save metadata' })
    expect(save).toBeDisabled()

    await user.type(screen.getByLabelText('Description'), 'Fast model')
    await user.click(screen.getByRole('button', { name: 'chat' }))
    await user.click(save)

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        '/api/models/',
        expect.objectContaining({
          model_name: 'gpt-new',
          description: 'Fast model',
          tags: 'chat',
          name_rule: 0,
        }),
        expect.anything()
      )
    )
  })
})
