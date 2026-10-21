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
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'

import { HomePlaybackProvider } from '../components/home-playback'
import { Showcase } from '../components/sections/showcase'
import { VideoHero } from '../components/sections/video-hero'

vi.mock('@tanstack/react-router', () => ({
  Link: (props: { to: string; className?: string; children: ReactNode }) => (
    <a href={props.to} className={props.className}>
      {props.children}
    </a>
  ),
}))

const CLIP = '/home-media/0123456789abcdef0123456789abcdef.mp4'
const HERO = '/home-media/fedcba9876543210fedcba9876543210.mp4'

function mockApi(showcase: object) {
  vi.spyOn(api, 'get').mockImplementation(async (url: string) =>
    url === '/api/home_showcase'
      ? { data: { success: true, data: JSON.stringify(showcase) } }
      : { data: { success: true, data: [] } }
  )
}

function renderHome(children: ReactNode) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <HomePlaybackProvider>{children}</HomePlaybackProvider>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  // jsdom does not implement media playback.
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(
    () => undefined
  )
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined)
})

describe('home video playback', () => {
  it('opens a clip with sound and controls and pauses the previews behind it', async () => {
    const user = userEvent.setup()
    mockApi({
      showcase: [{ title: 'City chase', category: 'Action', video: CLIP }],
    })
    renderHome(<Showcase />)

    await user.click(
      await screen.findByRole('button', { name: 'Play City chase with sound' })
    )

    const dialog = await screen.findByRole('dialog', { name: 'City chase' })
    const player = within(dialog).getByLabelText('City chase')
    expect(player).toHaveAttribute('controls')
    expect((player as HTMLVideoElement).muted).toBe(false)
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled()

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
  })

  it('turns the hero sound on and off from its sound button', async () => {
    const user = userEvent.setup()
    mockApi({ hero: { title: 'Hero clip', video: HERO } })
    renderHome(<VideoHero />)

    const soundOn = await screen.findByRole('button', { name: 'Play sound' })
    const hero = screen.getByLabelText('Hero clip') as HTMLVideoElement
    expect(hero.muted).toBe(true)

    await user.click(soundOn)
    expect(hero.muted).toBe(false)

    await user.click(screen.getByRole('button', { name: 'Mute' }))
    expect(hero.muted).toBe(true)
  })
})
