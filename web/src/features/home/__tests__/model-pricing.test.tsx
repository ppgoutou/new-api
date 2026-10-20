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
import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PricingModel } from '@/features/pricing/types'
import { api } from '@/lib/api'
import {
  DEFAULT_CURRENCY_CONFIG,
  useSystemConfigStore,
} from '@/stores/system-config-store'

import { ModelPricing } from '../components/sections/model-pricing'

vi.mock('@tanstack/react-router', () => ({
  Link: (props: { to: string; className?: string; children: ReactNode }) => (
    <a href={props.to} className={props.className}>
      {props.children}
    </a>
  ),
}))

const SEEDANCE_20: PricingModel = {
  id: 1,
  model_name: 'seedance-2.0',
  quota_type: 0,
  model_ratio: 1,
  completion_ratio: 1,
  enable_groups: ['75'],
  billing_mode: 'tiered_expr',
  billing_expr:
    'u("resolution") == "480p" ? tier("480p", u("seconds") * 0.56) : ' +
    'tier("720p", u("seconds") * 1)',
  billing_usage_schema: {
    seconds: { type: 'number', unit: 'second' },
    resolution: { enum: ['480p', '720p'] },
  },
}

function mockPricingApi(models: PricingModel[]) {
  vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
    if (url === '/api/pricing') {
      return {
        data: {
          success: true,
          data: models,
          vendors: [],
          group_ratio: { '75': 0.75 },
          usable_group: {},
          supported_endpoint: {},
          auto_groups: [],
        },
      }
    }
    return { data: { success: true, data: {} } }
  })
}

function renderPricing() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <ModelPricing />
    </QueryClientProvider>
  )
}

function modelCard(name: string): HTMLElement {
  return screen
    .getByRole('heading', { level: 3, name })
    .closest('article') as HTMLElement
}

beforeEach(() => {
  useSystemConfigStore.getState().setConfig({
    currency: { ...DEFAULT_CURRENCY_CONFIG, quotaDisplayType: 'USD' },
  })
})

afterEach(() => {
  useSystemConfigStore
    .getState()
    .setConfig({ currency: { ...DEFAULT_CURRENCY_CONFIG } })
})

describe('home model pricing', () => {
  it('lists official and discounted prices per resolution from the pricing API', async () => {
    mockPricingApi([SEEDANCE_20])
    renderPricing()

    const card = modelCard('seedance-2.0')
    const rows = (await within(card).findAllByRole('row')).slice(1).map((row) =>
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent)
    )
    expect(rows).toEqual([
      ['480p', '$0.56 / s', '$0.42 / s'],
      ['720p', '$1 / s', '$0.75 / s'],
    ])
    expect(
      within(card).getByText('$0.42 / s', { selector: 'span' })
    ).toBeVisible()
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Billed per second, 25% off official prices',
      })
    ).toBeVisible()
  })

  it('links to the model square for a model the pricing API does not return', async () => {
    mockPricingApi([SEEDANCE_20])
    renderPricing()

    await within(modelCard('seedance-2.0')).findAllByRole('row')
    const card = modelCard('seedance-2.5')
    expect(within(card).queryByRole('table')).toBeNull()
    expect(
      within(card).getByRole('link', { name: /See prices in the model square/ })
    ).toHaveAttribute('href', '/pricing')
  })

  it('keeps price-free copy when the pricing API returns no Seedance models', async () => {
    mockPricingApi([])
    renderPricing()

    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: 'Billed per generated second',
      })
    ).toBeVisible()
    expect(screen.queryByRole('table')).toBeNull()
  })
})
