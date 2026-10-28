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
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { ErrorState } from '@/components/error-state'
import { LoadingState } from '@/components/loading-state'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { TitledCard } from '@/components/ui/titled-card'
import {
  createServerError,
  requireServerSuccess,
} from '@/lib/server-error-message'

import {
  createModel,
  getModel,
  previewUpstreamDiff,
  updateModel,
} from '../../api'
import { modelsQueryKeys } from '../../lib'
import {
  modelFormSchema,
  transformFormDataToModelPayload,
  transformModelToFormDefaults,
  type ModelFormValues,
} from '../../lib/model-form'
import { joinDescriptions, officialMetadataValues } from '../../lib/onboarding'
import type { Model, OnboardingModel, SyncLocale, Vendor } from '../../types'
import { ModelMetadataFields } from '../model-metadata-fields'

const OFFICIAL_LOCALES: SyncLocale[] = ['zh', 'en']

function newModelDefaults(name: string): ModelFormValues {
  return transformModelToFormDefaults({
    model_name: name,
    status: 1,
    sync_official: 1,
    name_rule: 0,
  } as Model)
}

export function OnboardingMetadataCard(props: {
  item: OnboardingModel
  vendors: Vendor[]
  tags: string[]
  onDirtyChange: (dirty: boolean) => void
  onSaved: () => Promise<void>
}) {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const metadataId = props.item.metadata_id
  const form = useForm({
    resolver: zodResolver(modelFormSchema),
    defaultValues: newModelDefaults(props.item.model_name),
  })
  const detail = useQuery({
    queryKey: modelsQueryKeys.detail(metadataId),
    queryFn: async () => {
      const response = await getModel(metadataId)
      if (!response.success || !response.data) {
        throw createServerError(response, t('Failed to load model'))
      }
      return response.data
    },
    enabled: metadataId > 0,
  })

  useEffect(() => {
    if (metadataId > 0 && detail.data) {
      form.reset(transformModelToFormDefaults(detail.data))
    }
  }, [metadataId, detail.data, form])

  const dirty = form.formState.isDirty
  const { onDirtyChange } = props
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange])

  const official = useMutation({
    mutationFn: async () => {
      const previews = await Promise.all(
        OFFICIAL_LOCALES.map((locale) =>
          queryClient.fetchQuery({
            queryKey: [...modelsQueryKeys.all, 'official-metadata', locale],
            queryFn: async () =>
              requireServerSuccess(await previewUpstreamDiff({ locale })).data,
            staleTime: 10 * 60 * 1000,
          })
        )
      )
      const found = previews.map((preview, index) => ({
        locale: OFFICIAL_LOCALES[index],
        upstream: preview?.candidates.find(
          (candidate) => candidate.model_name === props.item.model_name
        )?.upstream,
      }))
      const primary = found.find((entry) => entry.upstream)?.upstream
      if (!primary) return null
      return officialMetadataValues(
        primary,
        joinDescriptions(
          found.map((entry) => ({
            locale: entry.locale,
            text: entry.upstream?.description ?? '',
          }))
        ),
        props.vendors
      )
    },
    onSuccess: (values) => {
      if (!values) {
        toast.info(t('This model is not in the official metadata catalog'))
        return
      }
      const options = { shouldDirty: true }
      if (values.description) {
        form.setValue('description', values.description, options)
      }
      if (values.icon) form.setValue('icon', values.icon, options)
      if (values.tags.length > 0) form.setValue('tags', values.tags, options)
      if (values.vendorId) form.setValue('vendor_id', values.vendorId, options)
      toast.success(t('Filled from official metadata. Review and save.'))
    },
  })

  const save = useMutation({
    mutationFn: async (values: ModelFormValues) => {
      const payload = transformFormDataToModelPayload(values)
      const response =
        metadataId > 0
          ? await updateModel({ ...payload, id: metadataId })
          : await createModel(payload)
      if (!response.success) {
        throw createServerError(response, t('Operation failed'))
      }
    },
    onSuccess: async () => {
      form.reset(form.getValues())
      await props.onSaved()
      toast.success(t('Model metadata saved'))
    },
  })

  let body = (
    <Form {...form}>
      <form
        className='space-y-4'
        onSubmit={form.handleSubmit((values) => save.mutate(values))}
      >
        {props.item.metadata_rule && metadataId === 0 && (
          <Alert>
            <AlertDescription>
              {t(
                'Covered by the metadata rule "{{rule}}". Saving here creates a separate record for this model.',
                { rule: props.item.metadata_rule }
              )}
            </AlertDescription>
          </Alert>
        )}
        <ModelMetadataFields
          form={form}
          vendors={props.vendors}
          iconKey={props.item.model_name}
          tagSuggestions={props.tags}
          descriptionRows={5}
          showVendorAndTags={false}
        />
        <div className='flex justify-end'>
          <Button type='submit' disabled={save.isPending || !dirty}>
            {save.isPending ? t('Saving...') : t('Save metadata')}
          </Button>
        </div>
      </form>
    </Form>
  )
  if (metadataId > 0 && detail.isError) {
    body = (
      <ErrorState
        description={detail.error.message}
        onRetry={() => void detail.refetch()}
      />
    )
  } else if (metadataId > 0 && detail.isPending) {
    body = <LoadingState />
  }

  return (
    <TitledCard
      title={t('Description and icon')}
      description={t(
        'Prefill from the official catalog, then polish the copy before saving.'
      )}
      action={
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={official.isPending}
          onClick={() => official.mutate()}
        >
          <Sparkles aria-hidden className='size-4' />
          {official.isPending ? t('Loading...') : t('Fill from official')}
        </Button>
      }
    >
      {body}
    </TitledCard>
  )
}
