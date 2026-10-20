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
import { usePricingData } from '@/features/pricing/hooks/use-pricing-data'
import {
  formatTaskUsageUnitPrice,
  type DynamicPriceOptions,
} from '@/features/pricing/lib/dynamic-price'
import { getDisplayGroupRatio } from '@/features/pricing/lib/model-helpers'
import {
  getVideoPricing,
  VIDEO_PRICE_FRACTION_DIGITS,
} from '@/features/pricing/lib/video-pricing'
import { useSystemConfigStore } from '@/stores/system-config-store'

import {
  getPriceDiscount,
  HOME_VIDEO_MODELS,
  type PriceDiscount,
} from '../lib/video-home'

export type SeedancePriceRow = {
  option: string
  /** Price per second for the viewer's best group. */
  price: string
  /** Price per second before the group discount. */
  officialPrice: string
}

export type SeedanceModelPricing = {
  rows: SeedancePriceRow[]
  lowestPrice: string
  discount: PriceDiscount | null
}

/**
 * Live per-second prices of the home page Seedance models, read from the
 * public pricing API. Models the viewer cannot see are left out, so callers
 * fall back to price-free copy.
 */
export function useSeedancePricing() {
  const pricing = usePricingData()
  // Prices are formatted in the site currency; re-render when it changes.
  useSystemConfigStore((state) => state.config.currency)

  const byModel = new Map<string, SeedanceModelPricing>()
  for (const homeModel of HOME_VIDEO_MODELS) {
    const model = pricing.models.find(
      (candidate) => candidate.model_name === homeModel.name
    )
    const videoPricing = model ? getVideoPricing(model) : null
    if (!model || !videoPricing) continue

    const ratio = getDisplayGroupRatio(model)
    const options = (groupRatio: number): DynamicPriceOptions => ({
      tokenUnit: 'M',
      showRechargePrice: false,
      priceRate: pricing.priceRate,
      usdExchangeRate: pricing.usdExchangeRate,
      groupRatioMultiplier: groupRatio,
      fractionDigits: VIDEO_PRICE_FRACTION_DIGITS,
    })
    const cheapest = videoPricing.rows.reduce((low, row) =>
      row.secondPrice < low.secondPrice ? row : low
    )
    byModel.set(homeModel.name, {
      rows: videoPricing.rows.map((row) => ({
        option: row.option,
        price: formatTaskUsageUnitPrice(row.secondPrice, options(ratio)),
        officialPrice: formatTaskUsageUnitPrice(row.secondPrice, options(1)),
      })),
      lowestPrice: formatTaskUsageUnitPrice(
        cheapest.secondPrice,
        options(ratio)
      ),
      discount: getPriceDiscount(ratio),
    })
  }

  const discounts = [...byModel.values()].flatMap((entry) =>
    entry.discount ? [entry.discount] : []
  )
  const bestDiscount = discounts.reduce<PriceDiscount | null>(
    (best, discount) =>
      !best || discount.percentOff > best.percentOff ? discount : best,
    null
  )
  return { byModel, bestDiscount }
}
