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
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

import {
  SHOWCASE_CATEGORY_LABELS,
  SHOWCASE_VIDEOS,
  type ShowcaseCategory,
} from '../../lib/video-home'
import { ShowcaseVideo } from '../showcase-video'

type CategoryFilter = ShowcaseCategory | 'all'

interface ShowcaseProps {
  isAuthenticated?: boolean
}

export function Showcase(props: ShowcaseProps) {
  const { t } = useTranslation()
  const [category, setCategory] = useState<CategoryFilter>('all')
  const startTarget = props.isAuthenticated ? '/dashboard' : '/sign-up'
  const filters: { value: CategoryFilter; label: string }[] = [
    { value: 'all', label: t('All') },
    ...(Object.keys(SHOWCASE_CATEGORY_LABELS) as ShowcaseCategory[]).map(
      (value) => ({ value, label: t(SHOWCASE_CATEGORY_LABELS[value]) })
    ),
  ]
  const videos = SHOWCASE_VIDEOS.filter(
    (video) => category === 'all' || video.category === category
  )

  return (
    <section
      id='showcase'
      className='relative z-10 scroll-mt-20 px-6 py-20 md:py-28'
    >
      <div className='mx-auto max-w-6xl'>
        <div className='flex flex-wrap items-end justify-between gap-6'>
          <div className='max-w-xl'>
            <p className='mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400'>
              {t('Showcase')}
            </p>
            <h2 className='text-3xl font-bold tracking-tight md:text-4xl'>
              {t('Prompt → video')}
            </h2>
            <p className='text-muted-foreground mt-3'>
              {t(
                "Every clip here was generated through this site's Seedance channel. Copy a prompt to create the same effect."
              )}
            </p>
          </div>
          <ToggleGroup
            value={[category]}
            onValueChange={(value) => {
              const next = value.find((item) => item !== category)
              if (next) setCategory(next as CategoryFilter)
            }}
            aria-label={t('Filter by category')}
            variant='outline'
            spacing={2}
            className='flex-wrap'
          >
            {filters.map((filter) => (
              <ToggleGroupItem
                key={filter.value}
                value={filter.value}
                className='rounded-full px-4'
              >
                {filter.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <ul className='mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
          {videos.map((video) => {
            const prompt = t(video.prompt)
            return (
              <li
                key={video.name}
                className='bg-card border-border/60 flex flex-col overflow-hidden rounded-2xl border'
              >
                <div className='relative aspect-video'>
                  <ShowcaseVideo name={video.name} label={t(video.title)} />
                  <span className='absolute right-2.5 bottom-2.5 rounded-md bg-slate-950/70 px-2 py-0.5 font-mono text-[11px] text-slate-100'>
                    {video.spec}
                  </span>
                </div>
                <div className='flex flex-1 flex-col gap-3 p-5'>
                  <div className='flex items-center justify-between gap-3'>
                    <h3 className='font-semibold'>{t(video.title)}</h3>
                    <Badge variant='secondary'>
                      {t(SHOWCASE_CATEGORY_LABELS[video.category])}
                    </Badge>
                  </div>
                  <p className='text-muted-foreground line-clamp-3 text-sm leading-relaxed'>
                    {prompt}
                  </p>
                  <div className='mt-auto flex flex-wrap items-center gap-2 pt-1'>
                    <CopyButton
                      value={prompt}
                      variant='outline'
                      size='sm'
                      aria-label={t('Copy prompt: {{title}}', {
                        title: t(video.title),
                      })}
                    >
                      {t('Copy prompt')}
                    </CopyButton>
                    <Link
                      to={startTarget}
                      className='px-2 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400'
                    >
                      {t('Generate with it')} →
                    </Link>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
