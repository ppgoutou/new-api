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
  getOfficialVideoPricing,
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
  /**
   * The configured official price per second, or the price before the group
   * discount when none is configured; null when the configured official price
   * leaves this option out.
   */
  officialPrice: string | null
}

export type SeedanceModelPricing = {
  rows: SeedancePriceRow[]
  /** Output seconds the model accepts, when its plugin declares them. */
  durationRange?: readonly [number, number]
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
    // The admin-configured official price is display-only, so group ratios
    // never apply to it. Without one, the price before the group ratio stands
    // in for it.
    const official = getOfficialVideoPricing(model)
    const officialSecondPrices = videoPricing.rows.map((row) =>
      official
        ? official.rows.find((entry) => entry.option === row.option)
            ?.secondPrice
        : row.secondPrice
    )
    // The smallest discount across options, so the headline holds for every
    // resolution. No comparable option leaves -Infinity, which shows none.
    const discountRatio = official
      ? Math.max(
          ...videoPricing.rows.flatMap((row, index) => {
            const officialSecondPrice = officialSecondPrices[index]
            return officialSecondPrice
              ? [(row.secondPrice * ratio) / officialSecondPrice]
              : []
          })
        )
      : ratio
    byModel.set(homeModel.name, {
      rows: videoPricing.rows.map((row, index) => {
        const officialSecondPrice = officialSecondPrices[index]
        return {
          option: row.option,
          price: formatTaskUsageUnitPrice(row.secondPrice, options(ratio)),
          officialPrice:
            officialSecondPrice === undefined
              ? null
              : formatTaskUsageUnitPrice(officialSecondPrice, options(1)),
        }
      }),
      lowestPrice: formatTaskUsageUnitPrice(
        cheapest.secondPrice,
        options(ratio)
      ),
      discount: getPriceDiscount(discountRatio),
      durationRange: videoPricing.durationRange,
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
