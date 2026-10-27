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
import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { PricingModel } from '@/features/pricing/types'
import { api } from '@/lib/api'
import {
  DEFAULT_CURRENCY_CONFIG,
  useSystemConfigStore,
} from '@/stores/system-config-store'

import { LandingPricing } from '../components/landing-pricing'

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

const SEEDANCE_25: PricingModel = {
  ...SEEDANCE_20,
  id: 2,
  model_name: 'seedance-2.5',
  billing_expr: 'tier("480p", u("seconds") * 2)',
  billing_usage_schema: {
    seconds: { type: 'number', unit: 'second' },
    resolution: { enum: ['480p'] },
  },
}

function renderPricing(models: PricingModel[]) {
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
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <LandingPricing />
    </QueryClientProvider>
  )
}

async function tableRows(): Promise<string[][]> {
  const rows = await screen.findAllByRole('row')
  return rows.map((row) =>
    [...row.querySelectorAll('th, td')].map((cell) => cell.textContent ?? '')
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

describe('LandingPricing', () => {
  it('puts both models side by side per resolution with official prices struck through', async () => {
    renderPricing([SEEDANCE_20, SEEDANCE_25])

    expect(await tableRows()).toEqual([
      ['Resolution', 'seedance-2.0', 'seedance-2.5New'],
      ['480p', '$0.42$0.56', '$1.5$2'],
      ['720p', '$0.75$1', '—'],
    ])
  })

  it('leaves out a model the pricing API does not list', async () => {
    renderPricing([SEEDANCE_20])

    expect((await tableRows())[0]).toEqual(['Resolution', 'seedance-2.0'])
  })

  it('shows per-second billing copy instead of a table when no model is listed', async () => {
    renderPricing([])

    expect(
      await screen.findByText('Billed by generated seconds')
    ).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
