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
import { describe, expect, it } from 'vitest'

import {
  filterByCategory,
  groupModelsByCategory,
  modelBadgesByName,
  UNCATEGORIZED_CATEGORY,
} from '../lib/categories'
import type { PricingCategory, PricingModel } from '../types'

function model(name: string): PricingModel {
  return {
    id: name.length,
    model_name: name,
    quota_type: 0,
    model_ratio: 1,
    completion_ratio: 1,
    enable_groups: ['user'],
  }
}

const models = ['seedance-2.0', 'sd-2.0-线路1', 'seedance-2.5', 'wan3.0'].map(
  model
)
const categories: PricingCategory[] = [
  { id: 'sd25', name: 'Seedance 2.5', models: ['seedance-2.5'] },
  {
    id: 'sd20',
    name: 'Seedance 2.0',
    description: 'Seedance 2.0 lines',
    models: ['sd-2.0-线路1', 'removed-model', 'seedance-2.0'],
  },
  { id: 'empty', name: 'Empty', models: ['removed-model'] },
]

const names = (items: PricingModel[]) => items.map((item) => item.model_name)

describe('pricing categories', () => {
  it('returns no sections when no category is configured', () => {
    expect(groupModelsByCategory(models, [])).toEqual([])
  })

  it('orders sections and their models as configured and ends with the uncategorized models', () => {
    const sections = groupModelsByCategory(models, categories)

    expect(sections.map((section) => section.id)).toEqual([
      'sd25',
      'sd20',
      UNCATEGORIZED_CATEGORY,
    ])
    expect(names(sections[1].models)).toEqual(['sd-2.0-线路1', 'seedance-2.0'])
    expect(sections[1].description).toBe('Seedance 2.0 lines')
    expect(names(sections[2].models)).toEqual(['wan3.0'])
  })

  it('drops a section whose models are all filtered out', () => {
    const sections = groupModelsByCategory([model('wan3.0')], categories)

    expect(sections.map((section) => section.id)).toEqual([
      UNCATEGORIZED_CATEGORY,
    ])
  })

  it('omits the uncategorized section when every model has a category', () => {
    const sections = groupModelsByCategory(models.slice(0, 3), categories)

    expect(sections.map((section) => section.id)).toEqual(['sd25', 'sd20'])
  })

  it('filters to one category, to the uncategorized models, or keeps all for an unknown id', () => {
    expect(names(filterByCategory(models, 'sd20', categories))).toEqual([
      'seedance-2.0',
      'sd-2.0-线路1',
    ])
    expect(
      names(filterByCategory(models, UNCATEGORIZED_CATEGORY, categories))
    ).toEqual(['wan3.0'])
    expect(filterByCategory(models, 'deleted', categories)).toHaveLength(4)
  })

  it('collects card badges across categories in the fixed badge order and skips empty or unknown ones', () => {
    const badged = modelBadgesByName([
      {
        id: 'a',
        name: 'A',
        models: ['seedance-2.0', 'wan3.0'],
        badges: { 'seedance-2.0': ['new', 'recommended'], 'wan3.0': [] },
      },
      {
        id: 'b',
        name: 'B',
        models: ['seedance-2.5'],
        badges: {
          'seedance-2.5': ['free' as never, 'hot'],
        },
      },
    ])

    expect([...badged]).toEqual([
      ['seedance-2.0', ['recommended', 'new']],
      ['seedance-2.5', ['hot']],
    ])
  })
})
