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
import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { Dialog } from '@/components/dialog'
import { MultiSelect } from '@/components/multi-select'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { PricingCategory } from '@/features/pricing/types'

import {
  PRICING_CATEGORY_DESCRIPTION_MAX,
  PRICING_CATEGORY_NAME_MAX,
  pricingCategoryFormSchema,
  type PricingCategoryFormValues,
} from '../../lib/pricing-categories'

export function PricingCategoryDialog(props: {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: PricingCategory | null
  /** Models enabled on channels, offered for selection. */
  enabledModels: string[]
  /** Models held by other categories, which this one cannot take. */
  takenModels: Map<string, string>
  isSaving: boolean
  onSubmit: (values: PricingCategoryFormValues) => void
}) {
  const { t } = useTranslation()
  const form = useForm<PricingCategoryFormValues>({
    resolver: zodResolver(pricingCategoryFormSchema),
    defaultValues: { name: '', description: '', models: [] },
  })

  useEffect(() => {
    if (!props.open) return
    form.reset({
      name: props.category?.name ?? '',
      description: props.category?.description ?? '',
      models: props.category?.models ?? [],
    })
  }, [props.open, props.category, form])

  // Saved models that are no longer enabled stay listed so they can be removed.
  const options = useMemo(() => {
    const names = new Set([
      ...props.enabledModels,
      ...(props.category?.models ?? []),
    ])
    return [...names]
      .filter((name) => !props.takenModels.has(name))
      .sort((a, b) => a.localeCompare(b))
      .map((name) => ({
        label: name,
        value: name,
        hint: props.enabledModels.includes(name)
          ? undefined
          : t('Not enabled on any channel'),
      }))
  }, [props.enabledModels, props.category, props.takenModels, t])

  return (
    <Dialog
      open={props.open}
      onOpenChange={(open) => {
        if (!props.isSaving) props.onOpenChange(open)
      }}
      title={props.category ? t('Edit category') : t('Add category')}
      description={t(
        'Each model can belong to one category. Models already used by another category are not listed.'
      )}
      footer={
        <>
          <Button
            type='button'
            variant='outline'
            onClick={() => props.onOpenChange(false)}
            disabled={props.isSaving}
          >
            {t('Cancel')}
          </Button>
          <Button
            type='submit'
            form='pricing-category-form'
            disabled={props.isSaving}
          >
            {props.isSaving ? t('Saving...') : t('Save')}
          </Button>
        </>
      }
    >
      <Form {...form}>
        <form
          id='pricing-category-form'
          className='space-y-4'
          onSubmit={form.handleSubmit(props.onSubmit)}
        >
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Category name')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    maxLength={PRICING_CATEGORY_NAME_MAX}
                    placeholder='Seedance 2.0'
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='description'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Description')}</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={3}
                    maxLength={PRICING_CATEGORY_DESCRIPTION_MAX}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='models'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Models')}</FormLabel>
                <FormControl>
                  <MultiSelect
                    options={options}
                    selected={field.value}
                    onChange={field.onChange}
                    placeholder={t('Select models')}
                  />
                </FormControl>
                <FormDescription>
                  {t(
                    'Models are shown on the pricing page in the order they are selected.'
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </Dialog>
  )
}
