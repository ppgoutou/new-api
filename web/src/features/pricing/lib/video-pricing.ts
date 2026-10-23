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
import type { BillingUsageSchema, PricingModel } from '../types'
import { splitBillingExprAndRequestRules } from './billing-expr'
import { getTaskEnumFields, getTaskNumberFields } from './task-expr'
import { getTaskPricingDisplayTiers } from './task-matrix-display'

/**
 * Reference video tokens per output second, by output resolution:
 * width x height x 24 / 1024.
 */
export const VIDEO_TOKENS_PER_SECOND: Readonly<Record<string, number>> = {
  '480p': 10044,
  '720p': 21600,
  '1080p': 48600,
  '4k': 194400,
}

/** Video prices are shown rounded to two decimal places. */
export const VIDEO_PRICE_FRACTION_DIGITS = 2

/** Output durations, in seconds, that each upstream video model accepts. */
export const VIDEO_DURATION_RANGES: Readonly<
  Record<string, readonly [number, number]>
> = {
  'seedance-2.0': [4, 15],
  'seedance-2.5': [4, 30],
  'sd-2.0-线路1': [4, 15],
  'sd-2.0-线路1-fast': [4, 15],
  'sd-2.5-线路1（2.5）': [4, 30],
  'seedance2.0-720p-P': [5, 15],
  'seedance2.5-720p-P': [5, 30],
  'seedance-2.0-official': [4, 15],
  'seedance-2.5-official-relay': [4, 30],
}

export type VideoPricingRow = {
  option: string
  /** USD per output second, before group and recharge adjustments. */
  secondPrice: number
  /** USD per million reference-order tokens, when reference orders are priced. */
  referencePricePerMillion?: number
  tokensPerSecond?: number
}

export type VideoPricing = {
  optionField: string
  hasReferencePricing: boolean
  durationRange?: readonly [number, number]
  rows: VideoPricingRow[]
}

type VideoSchemaFields = {
  secondsField: string
  referenceField?: string
  optionField: string
}

function getVideoSchemaFields(
  schema: BillingUsageSchema | null | undefined
): VideoSchemaFields | null {
  const numberFields = getTaskNumberFields(schema)
  const enumFields = getTaskEnumFields(schema)
  if (enumFields.length !== 1) return null
  const seconds = numberFields.filter((entry) => entry[1].unit === 'second')
  const tokens = numberFields.filter((entry) => entry[1].unit === 'token')
  if (seconds.length !== 1 || tokens.length > 1) return null
  if (seconds.length + tokens.length !== numberFields.length) return null
  return {
    secondsField: seconds[0][0],
    referenceField: tokens[0]?.[0],
    optionField: enumFields[0][0],
  }
}

/**
 * A video schema meters output seconds (optionally plus reference-order
 * tokens) and selects the price by exactly one enum, such as resolution.
 */
export function isVideoPricingSchema(
  schema: BillingUsageSchema | null | undefined
): boolean {
  return getVideoSchemaFields(schema) !== null
}

/**
 * Per-option prices of a video model in schema enum order. Returns null unless
 * every option has its own plain unit prices, so per-request charges, request
 * rules and partial matrices keep the generic pricing display.
 */
export function getVideoPricing(model: PricingModel): VideoPricing | null {
  if (model.billing_mode !== 'tiered_expr' || !model.billing_expr) return null
  return videoPricingFromExpr(model, model.billing_expr)
}

/**
 * The vendor's published price in the same per-option layout as the charged
 * price. It is display-only: group ratios never apply to it.
 */
export function getOfficialVideoPricing(
  model: PricingModel
): VideoPricing | null {
  if (!model.official_price_expr?.trim()) return null
  return videoPricingFromExpr(model, model.official_price_expr)
}

function videoPricingFromExpr(
  model: PricingModel,
  expression: string
): VideoPricing | null {
  const schema = model.billing_usage_schema
  const fields = getVideoSchemaFields(schema)
  if (!schema || !fields) return null
  const split = splitBillingExprAndRequestRules(expression)
  if (split.requestRuleExpr?.trim()) return null

  const pricedFields = [fields.secondsField, fields.referenceField]
  const options = schema[fields.optionField]?.enum ?? []
  const rowsByOption = new Map<string, VideoPricingRow>()
  for (const tier of getTaskPricingDisplayTiers(split.billingExpr, schema)) {
    // A model with a single option, such as a 720p-only line, has one
    // unconditional tier that prices that option.
    const option =
      tier.conditions.length === 0 && options.length === 1
        ? options[0]
        : tier.conditions[0]?.value
    if (
      option === undefined ||
      tier.conditions.length > 1 ||
      (tier.conditions.length === 1 &&
        tier.conditions[0].field !== fields.optionField) ||
      tier.constant !== 0 ||
      rowsByOption.has(option) ||
      Object.keys(tier.unitPrices).some(
        (field) => !pricedFields.includes(field)
      )
    ) {
      return null
    }
    const referencePricePerMillion = fields.referenceField
      ? tier.unitPrices[fields.referenceField]
      : undefined
    rowsByOption.set(option, {
      option,
      secondPrice: tier.unitPrices[fields.secondsField] ?? 0,
      referencePricePerMillion,
      tokensPerSecond: VIDEO_TOKENS_PER_SECOND[option],
    })
  }

  const rows = options.flatMap((option) => {
    const row = rowsByOption.get(option)
    return row ? [row] : []
  })
  if (rows.length === 0 || rows.length !== rowsByOption.size) return null

  return {
    optionField: fields.optionField,
    hasReferencePricing: rows.some(
      (row) => row.referencePricePerMillion !== undefined
    ),
    durationRange: model.model_name
      ? VIDEO_DURATION_RANGES[model.model_name]
      : undefined,
    rows,
  }
}

export type ReferenceOrderExample = {
  option: string
  referenceSeconds: number
  outputSeconds: number
  billedReferenceSeconds: number
  tokensPerSecond: number
  tokens: number
  /** USD per million tokens, before group and recharge adjustments. */
  pricePerMillion: number
  /** USD for the whole order, before group and recharge adjustments. */
  cost: number
}

/**
 * Worked reference-order example: references shorter than 2/3 of the output
 * count as 2/3 of it, rounded up to a whole second. Prefers the requested
 * option and falls back to the first row that has a reference price.
 */
export function getReferenceOrderExample(
  pricing: VideoPricing,
  referenceSeconds: number,
  outputSeconds: number,
  preferredOption: string
): ReferenceOrderExample | null {
  const priced = pricing.rows.filter(
    (row) =>
      row.referencePricePerMillion !== undefined &&
      row.tokensPerSecond !== undefined
  )
  const row =
    priced.find((candidate) => candidate.option === preferredOption) ??
    priced[0]
  if (
    !row ||
    row.referencePricePerMillion === undefined ||
    !row.tokensPerSecond
  ) {
    return null
  }
  const billedReferenceSeconds = Math.max(
    referenceSeconds,
    Math.ceil((outputSeconds * 2) / 3)
  )
  const tokens = (outputSeconds + billedReferenceSeconds) * row.tokensPerSecond
  return {
    option: row.option,
    referenceSeconds,
    outputSeconds,
    billedReferenceSeconds,
    tokensPerSecond: row.tokensPerSecond,
    tokens,
    pricePerMillion: row.referencePricePerMillion,
    cost: (tokens * row.referencePricePerMillion) / 1_000_000,
  }
}
