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
import { describe, expect, test } from 'vitest'

import {
  getReferenceOrderExample,
  getVideoPricing,
  isVideoPricingSchema,
} from '../lib/video-pricing'
import type { BillingUsageSchema, PricingModel } from '../types'

const VIDEO_SCHEMA: BillingUsageSchema = {
  seconds: { type: 'number', unit: 'second' },
  reference_video_tokens: { type: 'number', unit: 'token' },
  resolution: { enum: ['480p', '720p', '1080p'] },
}

function videoModel(
  billingExpr: string,
  overrides: Partial<PricingModel> = {}
): PricingModel {
  return {
    id: 1,
    model_name: 'seedance-2.5',
    quota_type: 0,
    model_ratio: 1,
    completion_ratio: 1,
    enable_groups: ['default'],
    billing_mode: 'tiered_expr',
    billing_expr: billingExpr,
    billing_usage_schema: VIDEO_SCHEMA,
    ...overrides,
  }
}

const SEEDANCE_25_EXPR =
  'u("resolution") == "480p" ? tier("480p", u("reference_video_tokens") * 40 / 1000000 + u("seconds") * 0.6) : ' +
  'u("resolution") == "720p" ? tier("720p", u("reference_video_tokens") * 42 / 1000000 + u("seconds") * 1.5) : ' +
  'tier("1080p", u("reference_video_tokens") * 46 / 1000000 + u("seconds") * 3.7)'

describe('video pricing', () => {
  test('lists per-second and per-million reference prices per resolution in schema order', () => {
    const pricing = getVideoPricing(videoModel(SEEDANCE_25_EXPR))

    expect(pricing?.rows).toEqual([
      {
        option: '480p',
        secondPrice: 0.6,
        referencePricePerMillion: 40,
        tokensPerSecond: 10044,
      },
      {
        option: '720p',
        secondPrice: 1.5,
        referencePricePerMillion: 42,
        tokensPerSecond: 21600,
      },
      {
        option: '1080p',
        secondPrice: 3.7,
        referencePricePerMillion: 46,
        tokensPerSecond: 48600,
      },
    ])
    expect(pricing?.hasReferencePricing).toBe(true)
    expect(pricing?.durationRange).toEqual([4, 30])
  })

  test('omits the duration range for models without a known range', () => {
    const pricing = getVideoPricing(
      videoModel(SEEDANCE_25_EXPR, { model_name: 'unknown-video' })
    )

    expect(pricing?.durationRange).toBeUndefined()
  })

  test('keeps the generic display when an option adds a per-request charge', () => {
    const pricing = getVideoPricing(
      videoModel(
        'u("resolution") == "480p" ? tier("480p", u("seconds") * 0.6 + 0.1) : tier("720p", u("seconds") * 1.5)'
      )
    )

    expect(pricing).toBeNull()
  })

  test('keeps the generic display when request rules adjust the price', () => {
    const pricing = getVideoPricing(
      videoModel(
        `(${SEEDANCE_25_EXPR}) * (header("x-priority") == "high" ? 2 : 1)`
      )
    )

    expect(pricing).toBeNull()
  })

  test('recognizes only one-enum schemas metered in seconds with an optional token field', () => {
    expect(isVideoPricingSchema(VIDEO_SCHEMA)).toBe(true)
    expect(
      isVideoPricingSchema({
        seconds: { type: 'number', unit: 'second' },
        resolution: { enum: ['480p'] },
      })
    ).toBe(true)
    expect(
      isVideoPricingSchema({
        seconds: { type: 'number', unit: 'second' },
        resolution: { enum: ['480p'] },
        mode: { enum: ['std', 'pro'] },
      })
    ).toBe(false)
    expect(
      isVideoPricingSchema({
        tokens: { type: 'number', unit: 'token' },
        resolution: { enum: ['480p'] },
      })
    ).toBe(false)
  })

  test('bills a short reference video as 2/3 of the output, rounded up', () => {
    const pricing = getVideoPricing(videoModel(SEEDANCE_25_EXPR))
    expect(pricing).not.toBeNull()

    const example = getReferenceOrderExample(pricing!, 5, 15, '720p')

    expect(example).toMatchObject({
      option: '720p',
      billedReferenceSeconds: 10,
      tokens: 540000,
      pricePerMillion: 42,
    })
    expect(example?.cost).toBeCloseTo(22.68)
  })

  test('bills a long reference video by its own length', () => {
    const pricing = getVideoPricing(videoModel(SEEDANCE_25_EXPR))

    const example = getReferenceOrderExample(pricing!, 12, 15, '720p')

    expect(example?.billedReferenceSeconds).toBe(12)
    expect(example?.tokens).toBe(27 * 21600)
  })
})
