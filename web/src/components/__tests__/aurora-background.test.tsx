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
import { render } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'

import { AuroraBackground } from '../aurora-background'

const gradient = { addColorStop: vi.fn() }
const context = {
  createRadialGradient: vi.fn(() => gradient),
  fillRect: vi.fn(),
  fillStyle: '',
}

function matchMediaWith(matches: Record<string, boolean>) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: matches[query] ?? false,
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }) as unknown as MediaQueryList
  )
}

beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    context as unknown as CanvasRenderingContext2D
  )
})

afterEach(() => {
  vi.restoreAllMocks()
})

it('paints one still frame and ignores the pointer when reduced motion is requested', () => {
  matchMediaWith({
    '(prefers-reduced-motion: reduce)': true,
    '(pointer: fine)': true,
  })
  const raf = vi.spyOn(window, 'requestAnimationFrame')
  const listen = vi.spyOn(window, 'addEventListener')

  const view = render(<AuroraBackground />)

  expect(context.fillRect).toHaveBeenCalled()
  expect(raf).not.toHaveBeenCalled()
  expect(listen).not.toHaveBeenCalledWith(
    'pointermove',
    expect.anything(),
    expect.anything()
  )
  const canvas = view.container.querySelector('canvas')
  expect(canvas).toHaveAttribute('aria-hidden', 'true')
  expect(canvas).toHaveClass('pointer-events-none')
})

it('stays still on touch-only devices', () => {
  matchMediaWith({ '(pointer: fine)': false })
  const raf = vi.spyOn(window, 'requestAnimationFrame')

  render(<AuroraBackground />)

  expect(raf).not.toHaveBeenCalled()
})

it('animates and follows the pointer on a mouse device without reduced motion', () => {
  matchMediaWith({ '(pointer: fine)': true })
  const raf = vi
    .spyOn(window, 'requestAnimationFrame')
    .mockImplementation(() => 1)
  const listen = vi.spyOn(window, 'addEventListener')

  const view = render(<AuroraBackground />)

  expect(raf).toHaveBeenCalledOnce()
  expect(listen).toHaveBeenCalledWith('pointermove', expect.any(Function), {
    passive: true,
  })
  const cancel = vi.spyOn(window, 'cancelAnimationFrame')
  view.unmount()
  expect(cancel).toHaveBeenCalledWith(1)
})
