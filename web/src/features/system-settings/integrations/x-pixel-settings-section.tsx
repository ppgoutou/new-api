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
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import * as z from 'zod'

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

import { SettingsForm } from '../components/settings-form-layout'
import { SettingsPageFormActions } from '../components/settings-page-context'
import { SettingsSection } from '../components/settings-section'
import { useResetForm } from '../hooks/use-reset-form'
import { useUpdateOption } from '../hooks/use-update-option'

/** Event IDs copied from X Events Manager, e.g. tw-rhw6r-rhw8g. */
const X_EVENT_ID_PATTERN = /^tw-[a-z0-9]+-[a-z0-9]+$/

const createXPixelSchema = (t: (key: string) => string) => {
  const eventId = z
    .string()
    .refine(
      (value) => value.trim() === '' || X_EVENT_ID_PATTERN.test(value.trim()),
      t('Use an event ID like tw-rhw6r-xxxxx')
    )
  return z.object({
    XPixelToken: z.string(),
    XPixelSignupEventId: eventId,
    XPixelPurchaseEventId: eventId,
  })
}

type XPixelFormValues = z.infer<ReturnType<typeof createXPixelSchema>>

type XPixelSettingsSectionProps = {
  defaultValues: XPixelFormValues
}

const EVENT_FIELDS = [
  { name: 'XPixelSignupEventId', label: 'Sign-up event ID' },
  { name: 'XPixelPurchaseEventId', label: 'Top-up event ID' },
] as const

/**
 * Settings for reporting sign-ups and top-ups to the X Conversion API. Empty
 * values fall back to the X_PIXEL_* environment variables on the server.
 */
export function XPixelSettingsSection(props: XPixelSettingsSectionProps) {
  const { t } = useTranslation()
  const updateOption = useUpdateOption()

  const form = useForm<XPixelFormValues>({
    resolver: zodResolver(createXPixelSchema(t)),
    defaultValues: props.defaultValues,
  })

  useResetForm(form, props.defaultValues)

  const onSubmit = async (values: XPixelFormValues) => {
    const updates: Array<{ key: string; value: string }> = []
    // The saved token is never sent to the browser, so a blank field keeps it.
    const token = values.XPixelToken.trim()
    if (token) {
      updates.push({ key: 'XPixelToken', value: token })
    }
    for (const field of EVENT_FIELDS) {
      const value = values[field.name].trim()
      if (value !== props.defaultValues[field.name].trim()) {
        updates.push({ key: field.name, value })
      }
    }

    for (const update of updates) {
      await updateOption.mutateAsync(update)
    }
    if (token) {
      form.setValue('XPixelToken', '')
    }
  }

  return (
    <SettingsSection title={t('X conversion tracking')}>
      <p className='text-muted-foreground text-sm'>
        {t(
          'Reports sign-ups and top-ups to the X Conversion API from the server. Fields left empty use the X_PIXEL_* environment variables.'
        )}
      </p>
      <Form {...form}>
        <SettingsForm onSubmit={form.handleSubmit(onSubmit)} autoComplete='off'>
          <SettingsPageFormActions
            onSave={form.handleSubmit(onSubmit)}
            isSaving={updateOption.isPending}
          />
          <FormField
            control={form.control}
            name='XPixelToken'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Access token')}</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    placeholder={t('Enter new token to update')}
                    autoComplete='new-password'
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  {t(
                    'Generated in X Ads Manager under Manual setup. The saved token is never shown; leave blank to keep it.'
                  )}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          {EVENT_FIELDS.map((eventField) => (
            <FormField
              key={eventField.name}
              control={form.control}
              name={eventField.name}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t(eventField.label)}</FormLabel>
                  <FormControl>
                    <Input placeholder='tw-rhw6r-xxxxx' {...field} />
                  </FormControl>
                  <FormDescription>
                    {t(
                      'Copied from X Events Manager. Leave empty to not send it.'
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </SettingsForm>
      </Form>
    </SettingsSection>
  )
}
