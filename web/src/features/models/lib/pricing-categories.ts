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
import { z } from 'zod'

import type { PricingCategory } from '@/features/pricing/types'

export const PRICING_CATEGORIES_OPTION_KEY = 'PricingCategories'
export const PRICING_CATEGORY_NAME_MAX = 40
export const PRICING_CATEGORY_DESCRIPTION_MAX = 300

export const pricingCategoryFormSchema = z.object({
  name: z.string().trim().min(1).max(PRICING_CATEGORY_NAME_MAX),
  description: z.string().max(PRICING_CATEGORY_DESCRIPTION_MAX),
  models: z.array(z.string()),
})

export type PricingCategoryFormValues = z.infer<
  typeof pricingCategoryFormSchema
>

/** Reads the stored option; an empty or malformed value means no categories. */
export function parsePricingCategories(
  value: string | undefined
): PricingCategory[] {
  if (!value?.trim()) return []
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item): PricingCategory[] => {
      if (!item || typeof item !== 'object') return []
      const record = item as Record<string, unknown>
      if (typeof record.id !== 'string' || typeof record.name !== 'string') {
        return []
      }
      return [
        {
          id: record.id,
          name: record.name,
          description:
            typeof record.description === 'string' ? record.description : '',
          models: Array.isArray(record.models)
            ? record.models.filter(
                (model): model is string => typeof model === 'string'
              )
            : [],
        },
      ]
    })
  } catch {
    return []
  }
}

export function newPricingCategoryId(existing: PricingCategory[]): string {
  const taken = new Set(existing.map((category) => category.id))
  let id = ''
  do {
    id = `cat-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  } while (taken.has(id))
  return id
}

/** Maps each model to the name of the category that already holds it. */
export function pricingCategoryOwners(
  categories: PricingCategory[],
  exceptId?: string
): Map<string, string> {
  const owners = new Map<string, string>()
  for (const category of categories) {
    if (category.id === exceptId) continue
    for (const model of category.models) owners.set(model, category.name)
  }
  return owners
}

/** Returns a copy with the category at index moved one step up or down. */
export function movePricingCategory(
  categories: PricingCategory[],
  index: number,
  direction: -1 | 1
): PricingCategory[] {
  const target = index + direction
  if (target < 0 || target >= categories.length) return categories
  const next = [...categories]
  const [moved] = next.splice(index, 1)
  next.splice(target, 0, moved)
  return next
}
