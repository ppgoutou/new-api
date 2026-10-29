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
import { ArrowRight, Clapperboard, KeyRound, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { buttonVariants } from '@/components/ui/button'
import { TitledCard } from '@/components/ui/titled-card'
import { WorksList } from '@/features/video-studio/components/works-list'
import { cn } from '@/lib/utils'

const RECENT_WORKS_LIMIT = 6

/** The overview's first card: start a video, top up, get a key, and the six latest works. */
export function CreationPanel() {
  const { t } = useTranslation()

  return (
    <TitledCard
      title={t('Video Creation')}
      icon={<Clapperboard className='h-4 w-4' />}
      iconClassName='bg-brand rounded-full text-white'
      disableHoverEffect
      action={
        <div className='flex flex-wrap gap-2'>
          <Link
            to='/video-studio'
            className={cn(
              buttonVariants(),
              'bg-brand hover:bg-brand-hover h-11 px-5 text-white'
            )}
          >
            <Clapperboard data-icon='inline-start' aria-hidden />
            {t('Open Video Creation')}
          </Link>
          <Link
            to='/wallet'
            className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-4')}
          >
            <Wallet data-icon='inline-start' aria-hidden />
            {t('Recharge')}
          </Link>
          <Link
            to='/keys'
            className={cn(buttonVariants({ variant: 'outline' }), 'h-11 px-4')}
          >
            <KeyRound data-icon='inline-start' aria-hidden />
            {t('Create API Key')}
          </Link>
        </div>
      }
    >
      <div className='flex flex-col gap-3'>
        <div className='flex items-center justify-between gap-3'>
          <h3 className='text-sm font-semibold'>{t('Recent works')}</h3>
          <Link
            to='/video-studio'
            className='text-brand dark:text-brand-on-dark inline-flex items-center gap-1 text-sm font-medium hover:underline'
          >
            {t('View all')}
            <ArrowRight className='size-3.5' aria-hidden />
          </Link>
        </div>
        <WorksList limit={RECENT_WORKS_LIMIT} compact />
      </div>
    </TitledCard>
  )
}
