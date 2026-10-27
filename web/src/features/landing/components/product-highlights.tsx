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
import {
  Clapperboard,
  Code2,
  Film,
  ImagePlay,
  Type,
  Wallet,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'

export function ProductHighlights() {
  const { t } = useTranslation()

  const items = [
    {
      title: t('Text to video'),
      desc: t(
        'Describe a scene in one sentence and get a clip with camera moves and lighting.'
      ),
      icon: Type,
    },
    {
      title: t('Image to video'),
      desc: t(
        'Upload a first frame and bring products, characters or artwork to life.'
      ),
      icon: ImagePlay,
    },
    {
      title: t('Reference video'),
      desc: t(
        'Follow the motion and style of a reference clip for consistent results.'
      ),
      icon: Film,
    },
    {
      title: t('Up to 4K and 30 seconds'),
      desc: t(
        'seedance-2.0 renders up to 4K; seedance-2.5 makes clips up to 30 seconds.'
      ),
      icon: Clapperboard,
    },
    {
      title: t('Pay per second'),
      desc: t(
        'No subscription or minimum spend: pay only for the seconds you generate.'
      ),
      icon: Wallet,
    },
    {
      title: t('Online studio or API'),
      desc: t(
        'Create in the browser, or call the OpenAI-compatible API from your own app.'
      ),
      icon: Code2,
    },
  ]

  return (
    <section
      id='product'
      className='bg-muted/30 border-border/40 relative z-10 scroll-mt-20 border-y px-6 py-20 md:py-28'
    >
      <div className='mx-auto max-w-6xl'>
        <p className='mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400'>
          {t('Product')}
        </p>
        <h2 className='text-3xl font-bold tracking-tight md:text-4xl'>
          {t('Everything you need to make AI video')}
        </h2>
        <p className='text-muted-foreground mt-3 max-w-2xl'>
          {t(
            'Seedance is a video generation model family from ByteDance. We serve it through our relay station, so one account covers online creation and API calls.'
          )}
        </p>
        <ul className='mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
          {items.map((item, index) => (
            <AnimateInView
              key={item.title}
              as='li'
              delay={index * 60}
              className='bg-card border-border/60 flex flex-col gap-3 rounded-2xl border p-6'
            >
              <span className='flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400'>
                <item.icon className='size-5' strokeWidth={1.75} aria-hidden />
              </span>
              <h3 className='text-base font-semibold'>{item.title}</h3>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                {item.desc}
              </p>
            </AnimateInView>
          ))}
        </ul>
      </div>
    </section>
  )
}
