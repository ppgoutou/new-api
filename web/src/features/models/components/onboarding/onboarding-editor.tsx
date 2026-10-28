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
import { useMutation } from '@tanstack/react-query'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { GroupBadge } from '@/components/group-badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Combobox } from '@/components/ui/combobox'
import { TitledCard } from '@/components/ui/titled-card'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useCanEditModelPricing } from '@/features/model-pricing/api'
import { ModelPricingPanel } from '@/features/model-pricing/model-pricing-panel'
import {
  modelBadgeLabel,
  PRICING_MODEL_BADGES,
} from '@/features/pricing/lib/categories'
import type {
  PricingCategory,
  PricingModelBadge,
} from '@/features/pricing/types'
import { createServerError } from '@/lib/server-error-message'
import { cn } from '@/lib/utils'

import { applyChannelUpstreamModels } from '../../api'
import { assignModelCategory, channelGroups } from '../../lib/onboarding'
import { PRESSED_BADGE_CLASSES } from '../../lib/pricing-categories'
import type { OnboardingChannel, OnboardingModel, Vendor } from '../../types'
import { OnboardingMetadataCard } from './onboarding-metadata-card'

const NO_CATEGORY = '__none__'

export function OnboardingEditor(props: {
  item: OnboardingModel
  vendors: Vendor[]
  tags: string[]
  categories: PricingCategory[]
  onSaveCategories: (next: PricingCategory[]) => Promise<void>
  onChanged: () => Promise<void>
  onDirtyChange: (dirty: boolean) => void
}) {
  const { t } = useTranslation()
  const canEditPricing = useCanEditModelPricing()
  const [metadataDirty, setMetadataDirty] = useState(false)
  const [pricingDirty, setPricingDirty] = useState(false)
  const { onDirtyChange } = props
  const dirty = metadataDirty || pricingDirty
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange])

  return (
    <div className='space-y-4 pb-4 lg:min-h-0 lg:overflow-auto'>
      <div>
        <h2 className='font-mono text-lg font-semibold break-all'>
          {props.item.model_name}
        </h2>
        <p className='text-muted-foreground text-sm'>
          {t(
            'Each card saves on its own. Work top to bottom to put the model on sale.'
          )}
        </p>
      </div>
      <OnboardingChannelsCard item={props.item} onChanged={props.onChanged} />
      <OnboardingMetadataCard
        item={props.item}
        vendors={props.vendors}
        tags={props.tags}
        onDirtyChange={setMetadataDirty}
        onSaved={props.onChanged}
      />
      <OnboardingCategoryCard
        modelName={props.item.model_name}
        categories={props.categories}
        onSave={props.onSaveCategories}
      />
      <TitledCard
        title={t('Pricing')}
        description={t('Users can only call a model after it has a price.')}
        contentClassName='flex min-h-[320px] flex-col p-0'
      >
        {canEditPricing ? (
          <ModelPricingPanel
            modelName={props.item.model_name}
            onDirtyChange={setPricingDirty}
          />
        ) : (
          <p className='text-muted-foreground p-4 text-sm'>
            {t('Only super administrators can edit pricing.')}
          </p>
        )}
      </TitledCard>
    </div>
  )
}

function OnboardingChannelsCard(props: {
  item: OnboardingModel
  onChanged: () => Promise<void>
}) {
  const { t } = useTranslation()
  const pending = props.item.pending_channels
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(pending.map((channel) => channel.id))
  )
  const chosen = pending.filter((channel) => selected.has(channel.id))

  const apply = useMutation({
    mutationFn: async (mode: 'add' | 'ignore') => {
      const name = props.item.model_name
      for (const channel of chosen) {
        const response = await applyChannelUpstreamModels(
          mode === 'add'
            ? { id: channel.id, add_models: [name] }
            : { id: channel.id, ignore_models: [name] }
        )
        if (!response.success) {
          throw createServerError(
            response,
            t('Failed to update channel {{name}}', { name: channel.name })
          )
        }
      }
      return mode
    },
    onSettled: () => props.onChanged(),
    onSuccess: (mode) =>
      toast.success(
        mode === 'add'
          ? t('Added to {{count}} channels', { count: chosen.length })
          : t('Ignored on {{count}} channels', { count: chosen.length })
      ),
  })

  return (
    <TitledCard
      title={t('Channels and groups')}
      description={t(
        'Groups come from the channels serving the model. Change a channel to change its groups.'
      )}
    >
      <div className='space-y-4'>
        <section className='space-y-2'>
          <h3 className='text-sm font-medium'>{t('Serving now')}</h3>
          {props.item.channels.length === 0 ? (
            <p className='text-muted-foreground text-sm'>
              {t('No channel serves this model yet.')}
            </p>
          ) : (
            <ChannelRows channels={props.item.channels} />
          )}
        </section>
        {pending.length > 0 && (
          <section className='space-y-2'>
            <h3 className='text-sm font-medium'>{t('Offered by upstream')}</h3>
            <ul className='space-y-2'>
              {pending.map((channel) => (
                <li key={channel.id}>
                  <label className='flex items-start gap-2'>
                    <Checkbox
                      className='mt-0.5'
                      checked={selected.has(channel.id)}
                      onCheckedChange={(value) => {
                        const next = new Set(selected)
                        if (value) next.add(channel.id)
                        else next.delete(channel.id)
                        setSelected(next)
                      }}
                    />
                    <ChannelLabel channel={channel} />
                  </label>
                </li>
              ))}
            </ul>
            <div className='flex flex-wrap justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                disabled={apply.isPending || chosen.length === 0}
                onClick={() => apply.mutate('ignore')}
              >
                {t('Ignore')}
              </Button>
              <Button
                type='button'
                size='sm'
                disabled={apply.isPending || chosen.length === 0}
                onClick={() => apply.mutate('add')}
              >
                {t('Add to selected channels')}
              </Button>
            </div>
          </section>
        )}
      </div>
    </TitledCard>
  )
}

function ChannelRows(props: { channels: OnboardingChannel[] }) {
  return (
    <ul className='space-y-2'>
      {props.channels.map((channel) => (
        <li key={channel.id}>
          <ChannelLabel channel={channel} />
        </li>
      ))}
    </ul>
  )
}

function ChannelLabel(props: { channel: OnboardingChannel }) {
  return (
    <span className='flex min-w-0 flex-wrap items-center gap-1.5 text-sm'>
      <span className='truncate'>{props.channel.name}</span>
      <span className='text-muted-foreground text-xs'>#{props.channel.id}</span>
      {channelGroups([props.channel]).map((group) => (
        <GroupBadge key={group} group={group} size='sm' />
      ))}
    </span>
  )
}

function OnboardingCategoryCard(props: {
  modelName: string
  categories: PricingCategory[]
  onSave: (next: PricingCategory[]) => Promise<void>
}) {
  const { t } = useTranslation()
  const owner = props.categories.find((category) =>
    category.models.includes(props.modelName)
  )
  const [categoryId, setCategoryId] = useState(owner?.id ?? NO_CATEGORY)
  const [badges, setBadges] = useState<PricingModelBadge[]>(
    owner?.badges?.[props.modelName] ?? []
  )
  const save = useMutation({
    mutationFn: () =>
      props.onSave(
        assignModelCategory(
          props.categories,
          props.modelName,
          categoryId === NO_CATEGORY ? null : categoryId,
          categoryId === NO_CATEGORY ? [] : badges
        )
      ),
  })

  return (
    <TitledCard
      title={t('Category and badges')}
      description={t('Where the model shows on the pricing page.')}
    >
      {props.categories.length === 0 ? (
        <p className='text-muted-foreground text-sm'>
          {t('No categories yet. Create one in the Categories tab.')}
        </p>
      ) : (
        <div className='space-y-3'>
          <Combobox
            options={[
              { value: NO_CATEGORY, label: t('No category') },
              ...props.categories.map((category) => ({
                value: category.id,
                label: category.name,
              })),
            ]}
            value={categoryId}
            onValueChange={(value) => setCategoryId(value ?? NO_CATEGORY)}
            aria-label={t('Category')}
            className='w-full'
          />
          <ToggleGroup
            multiple
            variant='outline'
            size='sm'
            spacing={1}
            aria-label={t('Badges for {{name}}', { name: props.modelName })}
            disabled={categoryId === NO_CATEGORY}
            value={badges}
            onValueChange={(value) =>
              setBadges(
                PRICING_MODEL_BADGES.filter((badge) => value.includes(badge))
              )
            }
          >
            {PRICING_MODEL_BADGES.map((badge) => (
              <ToggleGroupItem
                key={badge}
                value={badge}
                className={cn(
                  'h-7 px-2 text-xs font-semibold',
                  PRESSED_BADGE_CLASSES[badge]
                )}
              >
                <Check
                  aria-hidden
                  className='hidden size-3 group-aria-pressed/toggle:block'
                />
                {modelBadgeLabel(badge, t)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <div className='flex justify-end'>
            <Button
              type='button'
              size='sm'
              disabled={save.isPending}
              onClick={() => save.mutate()}
            >
              {save.isPending ? t('Saving...') : t('Save category')}
            </Button>
          </div>
        </div>
      )}
    </TitledCard>
  )
}
