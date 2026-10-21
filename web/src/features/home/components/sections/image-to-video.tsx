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
import { ArrowRight, ImageIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import { useHomeShowcase } from '../../hooks/use-home-showcase'
import {
  getHomeMediaUrl,
  IMAGE_TO_VIDEO_INPUT_IMAGE,
  IMAGE_TO_VIDEO_OUTPUT,
} from '../../lib/video-home'
import { PlayableClip } from '../playable-clip'

export function ImageToVideo() {
  const { t } = useTranslation()
  const configured = useHomeShowcase().imageToVideo
  // An admin-uploaded output clip replaces the built-in pair as a whole.
  const pair = configured.video
    ? configured
    : {
        image: getHomeMediaUrl(IMAGE_TO_VIDEO_INPUT_IMAGE),
        video: getHomeMediaUrl(`${IMAGE_TO_VIDEO_OUTPUT}.mp4`),
        poster: getHomeMediaUrl(`${IMAGE_TO_VIDEO_OUTPUT}.jpg`),
      }
  const inputImage = pair.image
  const modes = [
    {
      title: t('Text to video'),
      desc: t('Describe the scene in words and get a video.'),
    },
    {
      title: t('Image to video (first frame)'),
      desc: t(
        'Upload an image as the first frame to keep the scene and characters consistent.'
      ),
      highlighted: true,
    },
    {
      title: t('Reference video'),
      desc: t('Provide a reference clip to mimic its motion and camera work.'),
    },
  ]

  return (
    <section className='bg-muted/30 border-border/40 relative z-10 border-y px-6 py-20 md:py-28'>
      <div className='mx-auto flex max-w-6xl flex-wrap items-center gap-12'>
        <div className='min-w-0 flex-[1_1_22rem]'>
          <p className='mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400'>
            {t('Three ways to generate')}
          </p>
          <h2 className='text-3xl font-bold tracking-tight md:text-4xl'>
            {t('Bring a single image to life')}
          </h2>
          <p className='text-muted-foreground mt-3'>
            {t(
              'Switch the generation mode with one parameter on the same API.'
            )}
          </p>
          <ol className='mt-7 flex flex-col gap-3'>
            {modes.map((mode, index) => (
              <li
                key={mode.title}
                className={cn(
                  'bg-card flex gap-4 rounded-xl border p-4',
                  mode.highlighted ? 'border-blue-500/50' : 'border-border/60'
                )}
              >
                <span
                  className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold',
                    mode.highlighted
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-500/10 text-blue-700 dark:text-blue-300'
                  )}
                  aria-hidden
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className='font-semibold'>{mode.title}</h3>
                  <p className='text-muted-foreground mt-0.5 text-sm'>
                    {mode.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className='flex min-w-0 flex-[1.3_1_30rem] flex-wrap items-center gap-4'>
          <figure className='min-w-0 flex-[1_1_12rem]'>
            <div className='border-border/60 aspect-video overflow-hidden rounded-xl border bg-slate-900'>
              {inputImage ? (
                <img
                  src={inputImage}
                  alt={t('Input: an image')}
                  loading='lazy'
                  className='size-full object-cover'
                />
              ) : (
                <div
                  role='img'
                  aria-label={t('Input: an image')}
                  className='flex size-full items-center justify-center text-slate-400'
                >
                  <ImageIcon
                    className='size-8'
                    strokeWidth={1.25}
                    aria-hidden
                  />
                </div>
              )}
            </div>
            <figcaption className='text-muted-foreground mt-2 text-center text-sm'>
              {t('Input: an image')}
            </figcaption>
          </figure>
          <ArrowRight
            className='size-6 shrink-0 text-blue-600 dark:text-blue-400'
            aria-hidden
          />
          <figure className='min-w-0 flex-[1.4_1_16rem]'>
            <div className='aspect-video overflow-hidden rounded-xl border border-blue-500/50 bg-slate-900'>
              <PlayableClip
                key={pair.video}
                src={pair.video}
                poster={pair.poster}
                title={t('Output: a video that starts from it')}
              />
            </div>
            <figcaption className='text-muted-foreground mt-2 text-center text-sm'>
              {t('Output: a video that starts from it')}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  )
}
