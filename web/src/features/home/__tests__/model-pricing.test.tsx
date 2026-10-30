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

function secondModel(
  name: string,
  prices: Record<string, number>,
  limits?: PricingModel['model_limits']
): PricingModel {
  const options = Object.keys(prices)
  const expr = options
    .map((option, index) =>
      index === options.length - 1
        ? `tier("${option}", u("seconds") * ${prices[option]})`
        : `u("resolution") == "${option}" ? tier("${option}", u("seconds") * ${prices[option]}) : `
    )
    .join('')
  return {
    id: 1,
    model_name: name,
    quota_type: 0,
    model_ratio: 1,
    completion_ratio: 1,
    enable_groups: ['half'],
    billing_mode: 'tiered_expr',
    billing_expr: expr,
    billing_usage_schema: {
      seconds: { type: 'number', unit: 'second' },
      resolution: { enum: options },
    },
    model_limits: limits,
  }
}

const TOKEN_MINI: PricingModel = {
  id: 2,
  model_name: 'A-seedance-2.0-mini-P',
  quota_type: 0,
  model_ratio: 1,
  completion_ratio: 1,
  enable_groups: ['half'],
  billing_mode: 'tiered_expr',
  // 480p is 10044 tokens per second: $0.10 and $0.06 per second.
  billing_expr:
    'u("resolution") == "480p" ? tier("480p", u("tokens") * 9.95619275189 / 1000000) : ' +
    'tier("720p", u("tokens") * 2.77777777778 / 1000000)',
  billing_usage_schema: {
    tokens: { type: 'number', unit: 'token' },
    resolution: { enum: ['480p', '720p'] },
  },
}

const PER_VIDEO: PricingModel = {
  id: 3,
  model_name: 'D-sd2.5',
  quota_type: 0,
  model_ratio: 1,
  completion_ratio: 1,
  enable_groups: ['half'],
  billing_mode: 'tiered_expr',
  billing_expr:
    'u("resolution") == "480p" ? tier("480p", u("videos") * 2) : ' +
    'tier("720p", u("videos") * 3)',
  billing_usage_schema: {
    videos: { type: 'number', unit: 'count' },
    resolution: { enum: ['480p', '720p'] },
  },
}

function mockPricingApi(
  models: PricingModel[],
  categories: { name: string; models: string[] }[]
) {
  vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
    if (url === '/api/pricing') {
      return {
        data: {
          success: true,
          data: models,
          vendors: [],
          categories: categories.map((category, index) => ({
            id: `cat-${index}`,
            ...category,
          })),
          group_ratio: { half: 0.5 },
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

async function seriesRows(name: string): Promise<(string | null)[][]> {
  const card = (await screen.findByRole('heading', { level: 3, name })).closest(
    'article'
  ) as HTMLElement
  return within(card)
    .getAllByRole('row')
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent)
    )
}

beforeEach(() => {
  useSystemConfigStore.getState().setConfig({
    currency: { ...DEFAULT_CURRENCY_CONFIG, quotaDisplayType: 'USD' },
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  useSystemConfigStore
    .getState()
    .setConfig({ currency: { ...DEFAULT_CURRENCY_CONFIG } })
})

describe('home model pricing', () => {
  it('shows the cheapest model per resolution across every category of a series', async () => {
    mockPricingApi(
      [
        secondModel(
          'E-seedance-2.0',
          { '480p': 0.2, '720p': 0.4, '4k': 1 },
          { minDuration: 4, maxDuration: 15, ratios: ['16:9', '9:16'] }
        ),
        secondModel(
          'G-seedance-2.0-fast',
          { '480p': 0.1, '720p': 0.5 },
          { minDuration: 5, maxDuration: 12, ratios: ['16:9', '1:1'] }
        ),
      ],
      [
        { name: 'Seedance 2.0', models: ['E-seedance-2.0'] },
        { name: 'Seedance 2.0 fast', models: ['G-seedance-2.0-fast'] },
      ]
    )
    renderPricing()

    expect(await seriesRows('Seedance 2.0')).toEqual([
      ['480p', '$0.05', 'G-seedance-2.0-fast'],
      ['720p', '$0.2', 'E-seedance-2.0'],
      ['4K', '$0.5', 'E-seedance-2.0'],
    ])
    const card = screen
      .getByRole('heading', { level: 3, name: 'Seedance 2.0' })
      .closest('article') as HTMLElement
    expect(within(card).getByText('480p–4K')).toBeVisible()
    expect(within(card).getByText('4–15 seconds')).toBeVisible()
    expect(within(card).getByText('3 ratios')).toBeVisible()
  })

  it('keeps the exact price when a token-billed model displays the same price', async () => {
    mockPricingApi(
      [
        secondModel('E-seedance-2.0-mini', { '480p': 0.1, '720p': 0.2 }),
        TOKEN_MINI,
      ],
      [
        { name: 'Seedance 2.0 Mini', models: ['E-seedance-2.0-mini'] },
        { name: 'Seedance 2.0 -NSFW', models: ['A-seedance-2.0-mini-P'] },
      ]
    )
    renderPricing()

    expect(await seriesRows('Seedance 2.0')).toEqual([
      ['480p', '$0.05', 'E-seedance-2.0-mini'],
      ['720p', '≈$0.03', 'A-seedance-2.0-mini-P'],
    ])
  })

  it('shows the cheapest per-video price below the per-second table', async () => {
    mockPricingApi(
      [secondModel('G-seedance-2.5', { '480p': 0.2 }), PER_VIDEO],
      [{ name: 'Seedance 2.5', models: ['G-seedance-2.5', 'D-sd2.5'] }]
    )
    renderPricing()

    expect(await seriesRows('Seedance 2.5')).toEqual([
      ['480p', '$0.1', 'G-seedance-2.5'],
    ])
    const card = screen
      .getByRole('heading', { level: 3, name: 'Seedance 2.5' })
      .closest('article') as HTMLElement
    expect(within(card).getByText(/Per video/)).toHaveTextContent(
      'Per video $1 / video · D-sd2.5'
    )
  })

  it('links to the model square when no series has a priced model', async () => {
    mockPricingApi(
      [secondModel('other', { '480p': 1 })],
      [{ name: 'Seedream', models: ['other'] }]
    )
    renderPricing()

    expect(
      await screen.findByRole('link', {
        name: /See prices in the model square/,
      })
    ).toHaveAttribute('href', '/pricing')
    expect(screen.queryByRole('table')).toBeNull()
  })
})
