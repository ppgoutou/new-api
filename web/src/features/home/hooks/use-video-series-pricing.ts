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
import { formatTaskUsageUnitPrice } from '@/features/pricing/lib/dynamic-price'
import { getDisplayGroupRatio } from '@/features/pricing/lib/model-helpers'
import {
  getModelDurationRange,
  getPerVideoPricing,
  getTokenVideoPricing,
  getVideoPricing,
  VIDEO_PRICE_FRACTION_DIGITS,
  VIDEO_TOKENS_PER_SECOND,
} from '@/features/pricing/lib/video-pricing'
import { useSystemConfigStore } from '@/stores/system-config-store'

import { HOME_VIDEO_SERIES } from '../lib/video-home'

export type SeriesPriceRow = {
  option: string
  /** Formatted lowest price per second, or per video for the per-video row. */
  price: string
  /** Model that offers the price. */
  modelName: string
  /** The price is converted from video tokens, so it is an estimate. */
  approximate: boolean
}

export type VideoSeriesPricing = {
  name: string
  variants: readonly string[]
  isNew: boolean
  /** Lowest per-second price for each resolution, in resolution order. */
  rows: SeriesPriceRow[]
  /** Cheapest of the per-second rows, for the card headline. */
  lowest: SeriesPriceRow | null
  /** Cheapest option among models billed per video. */
  perVideo: SeriesPriceRow | null
  durationRange?: readonly [number, number]
  aspectRatioCount: number
}

type PriceCandidate = SeriesPriceRow & { value: number }

const toRow = (candidate: PriceCandidate): SeriesPriceRow => ({
  option: candidate.option,
  price: candidate.price,
  modelName: candidate.modelName,
  approximate: candidate.approximate,
})

const RESOLUTION_ORDER = Object.keys(VIDEO_TOKENS_PER_SECOND)

/**
 * A lower price wins, except that an exact price keeps its place against an
 * estimate that displays the same, so token-billed models only show when
 * they are visibly cheaper.
 */
function isBetterPrice(
  candidate: PriceCandidate,
  best: PriceCandidate | undefined
): boolean {
  if (!best) return true
  if (candidate.price === best.price) {
    return best.approximate && !candidate.approximate
  }
  return candidate.value < best.value
}

/**
 * Live lowest prices of the home page model series, read from the public
 * pricing API. Each resolution shows the cheapest model across every category
 * of the series; series with no priced model the viewer can see or buy are
 * left out.
 */
export function useVideoSeriesPricing(): VideoSeriesPricing[] {
  const pricing = usePricingData()
  // Prices are formatted in the site currency; re-render when it changes.
  useSystemConfigStore((state) => state.config.currency)

  const formatPrice = (value: number) =>
    formatTaskUsageUnitPrice(value, {
      tokenUnit: 'M',
      showRechargePrice: false,
      priceRate: pricing.priceRate,
      usdExchangeRate: pricing.usdExchangeRate,
      fractionDigits: VIDEO_PRICE_FRACTION_DIGITS,
    })

  return HOME_VIDEO_SERIES.flatMap((series) => {
    const prefix = series.categoryPrefix.toLowerCase()
    const modelNames = new Set(
      pricing.categories
        .filter((category) => category.name.toLowerCase().startsWith(prefix))
        .flatMap((category) => category.models)
    )
    // An unavailable model can't be bought, so it never sets a series price.
    const models = pricing.models.filter(
      (model) => modelNames.has(model.model_name) && !model.unavailable
    )

    const bestByOption = new Map<string, PriceCandidate>()
    let perVideo: PriceCandidate | undefined
    let minDuration = Infinity
    let maxDuration = 0
    const aspectRatios = new Set<string>()
    for (const model of models) {
      const ratio = getDisplayGroupRatio(model)
      const exact = getVideoPricing(model)
      const secondPricing = exact ?? getTokenVideoPricing(model)
      for (const row of secondPricing?.rows ?? []) {
        const value = row.secondPrice * ratio
        const candidate: PriceCandidate = {
          option: row.option,
          price: formatPrice(value),
          modelName: model.model_name,
          approximate: !exact,
          value,
        }
        if (isBetterPrice(candidate, bestByOption.get(row.option))) {
          bestByOption.set(row.option, candidate)
        }
      }
      for (const row of getPerVideoPricing(model)?.rows ?? []) {
        const value = (row.videoPrice ?? 0) * ratio
        const candidate: PriceCandidate = {
          option: row.option,
          price: formatPrice(value),
          modelName: model.model_name,
          approximate: false,
          value,
        }
        if (isBetterPrice(candidate, perVideo)) perVideo = candidate
      }
      const range = getModelDurationRange(model)
      if (range) {
        minDuration = Math.min(minDuration, range[0])
        maxDuration = Math.max(maxDuration, range[1])
      }
      for (const aspectRatio of model.model_limits?.ratios ?? []) {
        aspectRatios.add(aspectRatio)
      }
    }
    if (bestByOption.size === 0 && !perVideo) return []

    const rank = (option: string) => {
      const index = RESOLUTION_ORDER.indexOf(option.toLowerCase())
      return index === -1 ? RESOLUTION_ORDER.length : index
    }
    const ranked = [...bestByOption.values()].sort(
      (a, b) => rank(a.option) - rank(b.option)
    )
    const lowest = ranked.reduce<PriceCandidate | undefined>(
      (low, row) => (!low || row.value < low.value ? row : low),
      undefined
    )
    return [
      {
        name: series.name,
        variants: series.variants,
        isNew: series.isNew,
        rows: ranked.map(toRow),
        lowest: lowest ? toRow(lowest) : null,
        perVideo: perVideo ? toRow(perVideo) : null,
        durationRange:
          maxDuration > 0 ? ([minDuration, maxDuration] as const) : undefined,
        aspectRatioCount: aspectRatios.size,
      },
    ]
  })
}
