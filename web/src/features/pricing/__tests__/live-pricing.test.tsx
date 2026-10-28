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
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'

import { usePricingData } from '../hooks/use-pricing-data'

function pricingResponse(names: string[]) {
  return {
    data: {
      success: true,
      data: names.map((name, index) => ({
        id: index + 1,
        model_name: name,
        quota_type: 0,
        model_ratio: 1,
        completion_ratio: 1,
        enable_groups: ['default'],
      })),
      vendors: [],
      group_ratio: {},
      usable_group: {},
      supported_endpoint: {},
      auto_groups: [],
      categories: [],
    },
  }
}

describe('usePricingData live mode', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each([
    [true, ['seedance-2.0', 'seedance-2.5']],
    [false, ['seedance-2.0']],
  ])(
    'with live=%s shows models enabled since the last mount: %j',
    async (live, expected) => {
      let pricingCalls = 0
      vi.spyOn(api, 'get').mockImplementation(async (url: string) => {
        if (url !== '/api/pricing') return { data: { success: true } }
        pricingCalls += 1
        return pricingCalls === 1
          ? pricingResponse(['seedance-2.0'])
          : pricingResponse(['seedance-2.0', 'seedance-2.5'])
      })
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      })
      const wrapper = (props: { children: ReactNode }) => (
        <QueryClientProvider client={queryClient}>
          {props.children}
        </QueryClientProvider>
      )
      const first = renderHook(() => usePricingData(true, live), { wrapper })
      await waitFor(() => expect(first.result.current.models).toHaveLength(1))
      first.unmount()

      const second = renderHook(() => usePricingData(true, live), { wrapper })

      await waitFor(() => expect(pricingCalls).toBe(expected.length))
      await waitFor(() =>
        expect(second.result.current.models.map((m) => m.model_name)).toEqual(
          expected
        )
      )
    }
  )
})
