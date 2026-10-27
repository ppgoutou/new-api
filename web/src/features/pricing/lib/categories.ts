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
import { FILTER_ALL } from '../constants'
import type { PricingCategory, PricingModel } from '../types'

/** Filter value and section id for models outside every category. */
export const UNCATEGORIZED_CATEGORY = '__uncategorized'

export type PricingCategorySection = {
  /** Category id, or UNCATEGORIZED_CATEGORY for the trailing section. */
  id: string
  name: string
  description?: string
  models: PricingModel[]
}

function categorizedModelNames(categories: PricingCategory[]): Set<string> {
  return new Set(categories.flatMap((category) => category.models))
}

/**
 * Splits already filtered models into the administrator's categories, in the
 * configured category and model order, followed by one section for the
 * remaining models in their current order. Empty sections are dropped. With no
 * categories configured the page keeps its flat list, so this returns [].
 */
export function groupModelsByCategory(
  models: PricingModel[],
  categories: PricingCategory[]
): PricingCategorySection[] {
  if (categories.length === 0) return []
  const byName = new Map(models.map((model) => [model.model_name, model]))
  const sections: PricingCategorySection[] = []
  for (const category of categories) {
    const members = category.models.flatMap((name) => {
      const model = byName.get(name)
      return model ? [model] : []
    })
    if (members.length > 0) {
      sections.push({
        id: category.id,
        name: category.name,
        description: category.description,
        models: members,
      })
    }
  }
  const categorized = categorizedModelNames(categories)
  const rest = models.filter((model) => !categorized.has(model.model_name))
  if (rest.length > 0) {
    sections.push({ id: UNCATEGORIZED_CATEGORY, name: '', models: rest })
  }
  return sections
}

/** Keeps the models of one category, or of none for UNCATEGORIZED_CATEGORY. */
export function filterByCategory(
  models: PricingModel[],
  categoryId: string,
  categories: PricingCategory[]
): PricingModel[] {
  if (categoryId === FILTER_ALL) return models
  if (categoryId === UNCATEGORIZED_CATEGORY) {
    const categorized = categorizedModelNames(categories)
    return models.filter((model) => !categorized.has(model.model_name))
  }
  const category = categories.find((item) => item.id === categoryId)
  if (!category) return models
  const members = new Set(category.models)
  return models.filter((model) => members.has(model.model_name))
}
