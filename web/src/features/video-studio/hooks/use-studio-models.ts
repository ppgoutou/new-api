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
import { useMemo } from 'react'

import { usePricingData } from '@/features/pricing/hooks/use-pricing-data'

import type { StudioImageModel, StudioModel } from '../constants'
import { inPlazaOrder, studioModelsFromPricing } from '../lib/draft'
import { studioImageModelsFromPricing } from '../lib/image-draft'

/**
 * Video models offered on the canvas, empty while prices are loading, in the
 * model plaza's category order. Kept live so the menu follows the models
 * currently available to the user.
 */
export function useStudioModels(): StudioModel[] {
  const pricing = usePricingData(true, true)
  return useMemo(
    () =>
      inPlazaOrder(pricing.models, pricing.categories, studioModelsFromPricing),
    [pricing.models, pricing.categories]
  )
}

/** Image generation models, in the same order and kept live the same way. */
export function useStudioImageModels(): StudioImageModel[] {
  const pricing = usePricingData(true, true)
  return useMemo(
    () =>
      inPlazaOrder(
        pricing.models,
        pricing.categories,
        studioImageModelsFromPricing
      ),
    [pricing.models, pricing.categories]
  )
}
