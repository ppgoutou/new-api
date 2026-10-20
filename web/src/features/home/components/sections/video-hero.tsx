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
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

import { useHomeShowcase } from '../../hooks/use-home-showcase'
import { useSeedancePricing } from '../../hooks/use-seedance-pricing'
import { getHomeMediaUrl, HERO_VIDEO } from '../../lib/video-home'
import { ShowcaseVideo } from '../showcase-video'

interface VideoHeroProps {
  isAuthenticated?: boolean
}

export function VideoHero(props: VideoHeroProps) {
  const { t } = useTranslation()
  const { bestDiscount } = useSeedancePricing()
  const configured = useHomeShowcase().hero
  // An admin-uploaded hero replaces the built-in clip and its copy as a whole.
  const hero = configured.video
    ? configured
    : {
        title: t(HERO_VIDEO.title),
        prompt: t(HERO_VIDEO.prompt),
        spec: HERO_VIDEO.spec,
        video: getHomeMediaUrl(`${HERO_VIDEO.name}.mp4`),
        poster: getHomeMediaUrl(`${HERO_VIDEO.name}.jpg`),
      }
  const startTarget = props.isAuthenticated ? '/dashboard' : '/sign-up'

  const facts = [
    t('Up to 4K resolution'),
    t('4–30 seconds per clip'),
    t('OpenAI-compatible video API'),
    t('Top up by card, use instantly'),
  ]

  return (
    <section className='relative z-10 px-6 pt-24 pb-16 md:pt-32 md:pb-24'>
      <div className='mx-auto flex max-w-6xl flex-col items-center gap-6 text-center'>
        <p className='landing-animate-fade-up inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/5 px-3.5 py-1.5 text-xs font-medium text-blue-700 opacity-0 dark:border-blue-400/20 dark:bg-blue-400/5 dark:text-blue-300'>
          <span className='size-1.5 rounded-full bg-cyan-500' aria-hidden />
          {t('Seedance 2.5 is live · up to 30 seconds per clip')}
        </p>
        <h1
          className='landing-animate-fade-up max-w-4xl text-[clamp(2.25rem,6vw,4.25rem)] leading-[1.1] font-bold tracking-tight opacity-0'
          style={{ animationDelay: '60ms' }}
        >
          {t('Turn one sentence into')}{' '}
          <span className='text-blue-600 dark:text-blue-400'>
            {t('cinematic video')}
          </span>
        </h1>
        <p
          className='landing-animate-fade-up text-muted-foreground max-w-2xl text-base leading-relaxed opacity-0 md:text-lg'
          style={{ animationDelay: '120ms' }}
        >
          {t(
            'Call ByteDance Seedance video models through one API: text-to-video, image-to-video and reference video, billed per second.'
          )}
          {bestDiscount && (
            <>
              {' '}
              <strong className='text-foreground font-semibold'>
                {t('{{percentOff}}% off official prices', bestDiscount)}
              </strong>
            </>
          )}
        </p>
        <div
          className='landing-animate-fade-up flex flex-wrap justify-center gap-3 opacity-0'
          style={{ animationDelay: '180ms' }}
        >
          <Button
            className='group h-12 rounded-xl px-6 text-base font-semibold'
            render={<Link to={startTarget} />}
          >
            {props.isAuthenticated
              ? t('Go to Dashboard')
              : t('Sign up free and start creating')}
            <ArrowRight
              className='ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5'
              aria-hidden
            />
          </Button>
          <Button
            variant='outline'
            className='h-12 rounded-xl px-6 text-base'
            render={<a href='#pricing' />}
          >
            {t('View Pricing')}
          </Button>
        </div>
        <ul className='text-muted-foreground flex flex-wrap justify-center gap-x-7 gap-y-2 text-sm'>
          {facts.map((fact) => (
            <li key={fact}>{fact}</li>
          ))}
        </ul>
      </div>

      <figure
        className='landing-animate-fade-up border-border/60 relative mx-auto mt-12 max-w-5xl overflow-hidden rounded-2xl border bg-slate-950 opacity-0 shadow-2xl shadow-blue-950/20'
        style={{ animationDelay: '240ms' }}
      >
        <div className='relative aspect-video'>
          <ShowcaseVideo
            key={hero.video}
            src={hero.video}
            poster={hero.poster}
            label={hero.title || t('Video preview')}
            eager
          />
          {hero.spec && (
            <span className='absolute top-3 left-3 rounded-md bg-slate-950/70 px-2.5 py-1 font-mono text-xs text-slate-100'>
              {hero.spec}
            </span>
          )}
        </div>
        {/* Below the clip on phones; overlaid on its bottom edge from sm up. */}
        {hero.prompt && (
          <figcaption className='flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 text-left sm:absolute sm:inset-x-3 sm:bottom-3 sm:rounded-xl sm:bg-slate-950/80 sm:backdrop-blur-sm'>
            <span className='rounded-md bg-blue-500/20 px-2 py-0.5 text-xs font-semibold text-blue-200'>
              {t('Prompt used')}
            </span>
            <span className='min-w-0 flex-[1_1_18rem] truncate text-sm text-slate-100'>
              {hero.prompt}
            </span>
            <Link
              to={startTarget}
              className='text-sm font-semibold text-white hover:text-blue-200'
            >
              {t('Try this prompt')} →
            </Link>
          </figcaption>
        )}
      </figure>
    </section>
  )
}
