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
import { render, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  DEFAULT_CURRENCY_CONFIG,
  useSystemConfigStore,
} from '@/stores/system-config-store'

import { VideoPricingTables } from '../components/video-pricing-tables'
import { getVideoPricing } from '../lib/video-pricing'
import type { PricingModel } from '../types'

const MODEL: PricingModel = {
  id: 1,
  model_name: 'seedance-2.0',
  quota_type: 0,
  model_ratio: 1,
  completion_ratio: 1,
  enable_groups: ['default'],
  billing_mode: 'tiered_expr',
  billing_expr:
    'u("resolution") == "480p" ? tier("480p", u("reference_video_tokens") * 28 / 1000000 + u("seconds") * 0.56) : ' +
    'tier("720p", u("reference_video_tokens") * 28 / 1000000 + u("seconds") * 1)',
  billing_usage_schema: {
    seconds: { type: 'number', unit: 'second' },
    reference_video_tokens: { type: 'number', unit: 'token' },
    resolution: { enum: ['480p', '720p'] },
  },
}

function renderTables(groups: string[]) {
  const pricing = getVideoPricing(MODEL)
  if (!pricing) throw new Error('expected video pricing')
  return render(
    <VideoPricingTables
      model={MODEL}
      pricing={pricing}
      groups={groups}
      groupRatio={{ default: 0.65 }}
      priceRate={1}
      usdExchangeRate={1}
      showRechargePrice={false}
    />
  )
}

function tableRows(title: string): string[][] {
  const section = screen.getByText(title).closest('section') as HTMLElement
  return within(section)
    .getAllByRole('row')
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent ?? '')
    )
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

describe('video pricing tables', () => {
  it('shows the base price per resolution with reference token rates and the available durations', () => {
    renderTables(['default'])

    expect(tableRows('Base Price')).toEqual([
      ['480p', '$0.56', '$28 / 1M tokens10,044 tokens per second', '4～15'],
      ['720p', '$1', '$28 / 1M tokens21,600 tokens per second', '4～15'],
    ])
  })

  it('applies the group ratio to every price in the group table', () => {
    renderTables(['default'])

    expect(tableRows('Pricing by Group')).toEqual([
      [
        'default',
        '480p',
        '$0.36',
        '$18.2 / 1M tokens10,044 tokens per second',
        '4～15',
      ],
      [
        'default',
        '720p',
        '$0.65',
        '$18.2 / 1M tokens21,600 tokens per second',
        '4～15',
      ],
    ])
  })

  it('works through a 5s reference with a 15s 720p output at the group price', () => {
    renderTables(['default'])

    expect(screen.getByText(/^Example \(default\)/)).toHaveTextContent(
      'Example (default): 5s reference video, 15s 720p output. Reference seconds = max(5, ⌈15 × 2/3⌉) = 10s; tokens = (15 + 10) × 21,600 = 540,000; cost = 540,000 × $18.2 / 1M tokens = $9.83'
    )
  })

  it('shows only the base table when the model is in no available group', () => {
    renderTables([])

    expect(screen.getByText('Base Price')).toBeVisible()
    expect(screen.queryByText('Pricing by Group')).not.toBeInTheDocument()
    expect(screen.queryByText(/^Example/)).not.toBeInTheDocument()
  })
})
