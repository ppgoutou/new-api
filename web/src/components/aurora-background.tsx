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
import { useEffect, useRef } from 'react'

/** Canvas pixels per CSS pixel; the glows are soft, so a coarse buffer looks the same and costs far less. */
const RENDER_SCALE = 0.25
/** How quickly the pointer glow catches up with the pointer, per frame. */
const POINTER_EASING = 0.06

interface AuroraColors {
  base: string
  glows: string[]
  pointer: string
  strength: number
}

function readColors(): AuroraColors {
  const style = getComputedStyle(document.documentElement)
  const read = (name: string) => style.getPropertyValue(name).trim()
  return {
    base: read('--aurora-base'),
    glows: [
      read('--aurora-glow-1'),
      read('--aurora-glow-2'),
      read('--aurora-glow-3'),
    ],
    pointer: read('--aurora-pointer'),
    strength: Number(read('--aurora-strength')) || 0.25,
  }
}

/**
 * Site-wide backdrop: soft color glows that drift slowly, plus one that
 * follows the pointer. It sits behind all content and never takes input.
 * Reduced-motion and touch-only devices get a still frame instead.
 */
export function AuroraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return

    const animate =
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
      window.matchMedia('(pointer: fine)').matches
    let colors = readColors()
    let width = 0
    let height = 0
    let time = 0
    let frame = 0
    const pointer = { x: -1, y: -1, glowX: -1, glowY: -1, active: false }

    const resize = () => {
      width = Math.max(1, Math.round(window.innerWidth * RENDER_SCALE))
      height = Math.max(1, Math.round(window.innerHeight * RENDER_SCALE))
      canvas.width = width
      canvas.height = height
    }

    const glow = (x: number, y: number, rgb: string, radius: number) => {
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius)
      gradient.addColorStop(0, `rgb(${rgb} / ${colors.strength})`)
      gradient.addColorStop(1, `rgb(${rgb} / 0)`)
      context.fillStyle = gradient
      context.fillRect(0, 0, width, height)
    }

    const draw = () => {
      const radius = Math.max(width, height) * 0.45
      context.fillStyle = colors.base
      context.fillRect(0, 0, width, height)
      glow(
        width * 0.2 + Math.sin(time) * width * 0.08,
        height * 0.25 + Math.cos(time * 0.8) * height * 0.1,
        colors.glows[0],
        radius
      )
      glow(
        width * 0.8 + Math.cos(time * 0.7) * width * 0.08,
        height * 0.7 + Math.sin(time) * height * 0.1,
        colors.glows[1],
        radius
      )
      glow(
        width * 0.6 + Math.sin(time * 1.3) * width * 0.06,
        height * 0.15 + Math.cos(time) * height * 0.08,
        colors.glows[2],
        radius * 0.8
      )
      if (pointer.active) {
        glow(
          pointer.glowX * RENDER_SCALE,
          pointer.glowY * RENDER_SCALE,
          colors.pointer,
          radius * 0.6
        )
      }
    }

    const tick = () => {
      time += 0.004
      if (pointer.active) {
        pointer.glowX += (pointer.x - pointer.glowX) * POINTER_EASING
        pointer.glowY += (pointer.y - pointer.glowY) * POINTER_EASING
      }
      draw()
      frame = requestAnimationFrame(tick)
    }

    const onPointerMove = (event: PointerEvent) => {
      if (!pointer.active) {
        pointer.glowX = event.clientX
        pointer.glowY = event.clientY
      }
      pointer.x = event.clientX
      pointer.y = event.clientY
      pointer.active = true
    }
    const onPointerLeave = () => {
      pointer.active = false
    }
    const onResize = () => {
      resize()
      if (!animate) draw()
    }
    const onVisibility = () => {
      cancelAnimationFrame(frame)
      if (animate && !document.hidden) frame = requestAnimationFrame(tick)
    }
    // Light/dark switches toggle a class on <html>; pick up the new colors.
    const themeObserver = new MutationObserver(() => {
      colors = readColors()
      if (!animate) draw()
    })

    resize()
    draw()
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style', 'data-theme-preset'],
    })
    window.addEventListener('resize', onResize)
    if (animate) {
      window.addEventListener('pointermove', onPointerMove, { passive: true })
      document.documentElement.addEventListener('pointerleave', onPointerLeave)
      document.addEventListener('visibilitychange', onVisibility)
      frame = requestAnimationFrame(tick)
    }

    return () => {
      cancelAnimationFrame(frame)
      themeObserver.disconnect()
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener(
        'pointerleave',
        onPointerLeave
      )
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden='true'
      data-slot='aurora-background'
      className='pointer-events-none fixed inset-0 -z-10 h-full w-full'
    />
  )
}
