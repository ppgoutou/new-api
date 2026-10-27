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
import { ArrowRight, Bolt, CreditCard, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { LanguageSwitcher } from '@/components/language-switcher'
import { Button } from '@/components/ui/button'
import { ShowcaseVideo } from '@/features/home/components/showcase-video'
import { useHomeShowcase } from '@/features/home/hooks/use-home-showcase'
import { useSeedancePricing } from '@/features/home/hooks/use-seedance-pricing'
import { getHomeMediaUrl, HERO_VIDEO } from '@/features/home/lib/video-home'
import { useSystemConfig } from '@/hooks/use-system-config'
import { cn } from '@/lib/utils'

const GRADIENT_TEXT =
  'bg-gradient-to-r from-blue-400 via-cyan-400 to-violet-400 bg-clip-text text-transparent'

export function LandingHero() {
  const { t } = useTranslation()
  const { systemName, logo } = useSystemConfig()
  const { byModel, bestDiscount } = useSeedancePricing()
  const configured = useHomeShowcase().hero
  // Same clip as the home page hero: the admin-uploaded one, else the built-in.
  const hero = configured.video
    ? configured
    : {
        title: t(HERO_VIDEO.title),
        prompt: t(HERO_VIDEO.prompt),
        spec: HERO_VIDEO.spec,
        video: getHomeMediaUrl(`${HERO_VIDEO.name}.mp4`),
        poster: getHomeMediaUrl(`${HERO_VIDEO.name}.jpg`),
      }
  // seedance-2.0 is the cheaper model, so its lowest price is the entry price.
  const entryPrice = byModel.get('seedance-2.0')?.lowestPrice

  const points = [
    {
      icon: Sparkles,
      text: t('Text-to-video · Image-to-video · Reference video'),
    },
    { icon: Bolt, text: t('Pay as you go, no subscription or minimum spend') },
    { icon: CreditCard, text: t('Top up by card or code, use instantly') },
  ]
  const stats = [
    { value: '4K', label: t('Max resolution') },
    { value: t('{{seconds}}s', { seconds: 30 }), label: t('Max clip length') },
    entryPrice
      ? { value: entryPrice, label: t('Per second, from') }
      : { value: t('Per second'), label: t('Billed by generated seconds') },
    { value: '2.0 / 2.5', label: t('Seedance models') },
  ]

  return (
    <section className='mx-auto flex max-w-6xl flex-col px-4 pb-10 md:px-6 2xl:max-w-7xl'>
      <header className='flex h-16 items-center justify-between gap-3'>
        <span className='flex min-w-0 items-center gap-2.5 font-semibold text-white'>
          <img
            src={logo || '/logo.png'}
            alt=''
            className='size-7 shrink-0 rounded-md'
          />
          <span className='truncate'>{systemName || 'API-Finder'}</span>
        </span>
        <div className='flex items-center gap-2'>
          <LanguageSwitcher />
          <Button
            className='group rounded-lg border-0 bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.45)] hover:from-blue-500 hover:to-violet-500'
            render={<Link to='/' />}
          >
            {t('Go to website')}
            <ArrowRight
              className='ml-1 size-3.5 transition-transform duration-200 group-hover:translate-x-0.5'
              aria-hidden
            />
          </Button>
        </div>
      </header>

      <div className='grid grid-cols-[minmax(0,1fr)] items-center gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-12 lg:py-12 2xl:py-16'>
        <div className='landing-animate-fade-up opacity-0'>
          <p className='inline-flex items-center gap-2 rounded-full border border-blue-400/35 bg-blue-600/10 px-3 py-1 font-mono text-xs tracking-wide text-blue-300'>
            <span
              className='size-1.5 animate-pulse rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]'
              aria-hidden
            />
            {t('Seedance video API · online')}
          </p>
          {/* Three lines from lg up: the lead line never wraps there. */}
          <h1 className='mt-5 text-[clamp(2.125rem,3.4vw,3.25rem)] leading-[1.12] font-bold tracking-tight text-white 2xl:text-[3.5rem]'>
            <span className='lg:whitespace-nowrap'>
              {t('Cinematic AI video,')}
            </span>
            <br />
            <span className={GRADIENT_TEXT}>
              {bestDiscount
                ? t('{{percentOff}}% below official price', bestDiscount)
                : t('billed per second')}
            </span>
          </h1>
          <p className='mt-5 max-w-xl text-base leading-relaxed text-slate-400 2xl:text-lg'>
            {t(
              'API-Finder gives you access to ByteDance Seedance video models. Create in the browser or call an OpenAI-compatible API, billed per generated second.'
            )}
          </p>
          <ul className='mt-6 flex flex-col gap-2.5 text-sm text-slate-300'>
            {points.map((point) => (
              <li key={point.text} className='flex items-center gap-2.5'>
                <point.icon className='size-4 text-cyan-400' aria-hidden />
                {point.text}
              </li>
            ))}
          </ul>
        </div>

        <figure
          className='landing-animate-fade-up rounded-2xl bg-gradient-to-br from-blue-400/80 via-cyan-400/25 to-violet-400/80 p-px opacity-0 shadow-[0_0_60px_rgba(59,130,246,0.25)]'
          style={{ animationDelay: '120ms' }}
        >
          <div className='relative aspect-video overflow-hidden rounded-[15px] bg-slate-950'>
            <ShowcaseVideo
              key={hero.video}
              src={hero.video}
              poster={hero.poster}
              label={hero.title || t('Video preview')}
              eager
            />
            {hero.spec && (
              <span className='absolute top-3 left-3 rounded-md border border-slate-400/20 bg-slate-950/70 px-2 py-0.5 font-mono text-xs text-slate-100'>
                {hero.spec}
              </span>
            )}
            <span className='absolute top-3 right-3 rounded-md bg-slate-950/70 px-2 py-0.5 font-mono text-xs text-cyan-400'>
              ● {t('Generated')}
            </span>
            {hero.prompt && (
              <figcaption className='absolute inset-x-3 bottom-3 truncate rounded-lg border border-slate-400/15 bg-slate-950/85 px-3 py-2 font-mono text-xs text-slate-200 backdrop-blur-sm'>
                <span className='text-violet-400'>prompt&gt;</span>{' '}
                {hero.prompt}
              </figcaption>
            )}
          </div>
        </figure>
      </div>

      <dl className='grid grid-cols-2 gap-3 md:grid-cols-4'>
        {stats.map((stat) => (
          <div
            key={stat.label}
            className='flex flex-col-reverse rounded-xl border border-slate-400/15 bg-slate-900/60 px-4 py-3 backdrop-blur-sm'
          >
            <dt className='mt-1 text-xs text-slate-500'>{stat.label}</dt>
            <dd
              className={cn('font-mono text-2xl font-semibold', GRADIENT_TEXT)}
            >
              {stat.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
