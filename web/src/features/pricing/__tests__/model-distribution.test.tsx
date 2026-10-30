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
import { describe, expect, it } from 'vitest'

import { ModelDistribution } from '../components/model-distribution'
import { UNCATEGORIZED_CATEGORY } from '../lib/categories'
import type { PricingModel } from '../types'

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

describe('model distribution', () => {
  it('lists each category name without a count when sections exist', () => {
    render(
      <ModelDistribution
        sections={[
          {
            id: 'sd20',
            name: 'Seedance 2.0',
            models: ['A-seedance-2.0-P', 'C-seedance-2.0'].map(model),
          },
          {
            id: UNCATEGORIZED_CATEGORY,
            name: '',
            models: [model('wan-3.0')],
          },
        ]}
      />
    )

    const items = within(
      screen.getByRole('list', { name: 'Model distribution' })
    ).getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual([
      'Seedance 2.0',
      'Other models',
    ])
  })

  it('renders nothing when no category is configured', () => {
    const { container } = render(<ModelDistribution sections={[]} />)

    expect(container).toBeEmptyDOMElement()
  })
})
