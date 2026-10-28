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
import { useSearch } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import { Main } from '@/components/layout'

import { Composer } from './components/composer'
import { WorksList } from './components/works-list'
import { STUDIO_WORKS_QUERY_KEY } from './constants'

/** Video creation page: a prompt canvas over the user's latest works. */
export function VideoStudio() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const search = useSearch({ from: '/_authenticated/video-studio/' })

  return (
    <Main>
      <div className='mx-auto flex w-full max-w-5xl flex-col gap-10 px-3 py-8 sm:px-4 md:py-12'>
        <section className='flex flex-col gap-5'>
          <h1 className='text-center text-2xl font-bold tracking-tight md:text-3xl'>
            {t('Create a video, bring your ideas to life')}
          </h1>
          <Composer
            initialModel={search.model}
            onSubmitted={() =>
              queryClient.invalidateQueries({
                queryKey: STUDIO_WORKS_QUERY_KEY,
              })
            }
          />
        </section>
        <section className='flex flex-col gap-4'>
          <h2 className='text-lg font-semibold'>{t('My videos')}</h2>
          <WorksList />
        </section>
      </div>
    </Main>
  )
}
