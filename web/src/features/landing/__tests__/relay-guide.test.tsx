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
import { render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { RelayGuide } from '../components/relay-guide'

const statusMock = vi.hoisted(() => ({
  status: null as Record<string, unknown> | null,
}))

vi.mock('@/hooks/use-status', () => ({
  useStatus: () => ({ status: statusMock.status }),
}))

vi.mock('@tanstack/react-router', () => ({
  Link: (props: { to: string; className?: string; children: ReactNode }) => (
    <a href={props.to} className={props.className}>
      {props.children}
    </a>
  ),
}))

beforeEach(() => {
  statusMock.status = null
})

function stepLinks(): (string | null)[] {
  return screen
    .getAllByRole('listitem')
    .map((step) => step.querySelector('a')?.getAttribute('href') ?? null)
}

describe('RelayGuide', () => {
  it('walks a guest from sign-up through wallet to video creation and keys', () => {
    render(<RelayGuide />)

    expect(stepLinks()).toEqual([
      '/sign-up',
      '/wallet',
      '/video-studio',
      '/keys',
    ])
  })

  it('sends a signed-in visitor to the dashboard instead of sign-up', () => {
    render(<RelayGuide isAuthenticated />)

    expect(stepLinks()[0]).toBe('/dashboard')
  })

  it('shows the configured server address as the API base URL without a double slash', () => {
    statusMock.status = { server_address: 'https://api-finder.com/' }
    render(<RelayGuide />)

    expect(screen.getByText('https://api-finder.com/v1')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Copy API base URL' })
    ).toBeInTheDocument()
  })

  it('falls back to the page origin when no server address is configured', () => {
    render(<RelayGuide />)

    expect(screen.getByText(`${window.location.origin}/v1`)).toBeInTheDocument()
  })
})
