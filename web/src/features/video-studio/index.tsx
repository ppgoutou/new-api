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
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Main } from '@/components/layout'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { Composer } from './components/composer'
import { ImageComposer } from './components/image-composer'
import { ImageWorksList } from './components/image-works-list'
import { WorksList } from './components/works-list'
import { STUDIO_WORKS_QUERY_KEY } from './constants'
import type { StudioKind } from './types'

/** Creation page: a prompt canvas for videos or images over the latest works. */
export function VideoStudio() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const search = useSearch({ from: '/_authenticated/video-studio/' })
  const navigate = useNavigate({ from: '/video-studio/' })
  const kind: StudioKind = search.kind ?? 'video'

  return (
    <Main>
      <div className='mx-auto flex w-full max-w-5xl flex-col gap-10 px-3 py-8 sm:px-4 md:py-12'>
        <section className='flex flex-col items-center gap-5'>
          <h1 className='text-center text-2xl font-bold tracking-tight md:text-3xl'>
            {kind === 'image'
              ? t('Create an image, bring your ideas to life')
              : t('Create a video, bring your ideas to life')}
          </h1>
          <Tabs
            value={kind}
            onValueChange={(value) =>
              navigate({ search: { kind: value as StudioKind }, replace: true })
            }
          >
            <TabsList>
              <TabsTrigger value='video'>{t('Video')}</TabsTrigger>
              <TabsTrigger value='image'>{t('Image')}</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className='w-full'>
            {kind === 'image' ? (
              <ImageComposer initialModel={search.model} />
            ) : (
              <Composer
                initialModel={search.model}
                onSubmitted={() =>
                  queryClient.invalidateQueries({
                    queryKey: STUDIO_WORKS_QUERY_KEY,
                  })
                }
              />
            )}
          </div>
        </section>
        <section className='flex flex-col gap-4'>
          <h2 className='text-lg font-semibold'>
            {kind === 'image' ? t('My images') : t('My videos')}
          </h2>
          {kind === 'image' ? <ImageWorksList /> : <WorksList />}
        </section>
      </div>
    </Main>
  )
}
