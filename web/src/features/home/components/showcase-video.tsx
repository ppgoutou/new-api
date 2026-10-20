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
import { PlayCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import { getHomeMediaUrl } from '../lib/video-home'

interface ShowcaseVideoProps {
  /** Media file name without extension. */
  name: string
  /** Accessible description of the clip. */
  label: string
  /** Load eagerly (the hero clip); other clips load when scrolled into view. */
  eager?: boolean
  className?: string
}

/**
 * Muted looping clip that plays only while on screen. With reduced motion it
 * stays paused and shows controls; without a media host it renders a
 * placeholder.
 */
export function ShowcaseVideo(props: ShowcaseVideoProps) {
  const { t } = useTranslation()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [failed, setFailed] = useState(false)
  const [reducedMotion] = useState(
    () =>
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
  const src = getHomeMediaUrl(`${props.name}.mp4`)

  useEffect(() => {
    const video = videoRef.current
    if (
      !video ||
      reducedMotion ||
      typeof IntersectionObserver === 'undefined'
    ) {
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().catch(() => undefined)
        } else {
          video.pause()
        }
      },
      { threshold: 0.25 }
    )
    observer.observe(video)
    return () => observer.disconnect()
  }, [src, reducedMotion])

  if (!src || failed) {
    return (
      <div
        role='img'
        aria-label={t('Video preview: {{label}}', { label: props.label })}
        className={cn(
          'flex size-full items-center justify-center bg-slate-900 text-slate-400',
          props.className
        )}
      >
        <PlayCircle className='size-10' strokeWidth={1.25} aria-hidden />
      </div>
    )
  }

  return (
    <video
      ref={videoRef}
      src={src}
      poster={getHomeMediaUrl(`${props.name}.jpg`)}
      muted
      loop
      playsInline
      controls={reducedMotion}
      preload={props.eager ? 'auto' : 'none'}
      aria-label={props.label}
      onError={() => setFailed(true)}
      className={cn('size-full bg-slate-900 object-cover', props.className)}
    />
  )
}
