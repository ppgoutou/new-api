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
import { render, screen, within } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { api } from '@/lib/api'

import { AuthLayout } from '../auth-layout'

vi.mock('@tanstack/react-router', () => ({
  Link: (props: { to: string; className?: string; children: ReactNode }) => (
    <a href={props.to} className={props.className}>
      {props.children}
    </a>
  ),
}))

vi.mock('@/hooks/use-system-config', () => ({
  useSystemConfig: () => ({
    systemName: 'API-Finder',
    logo: '/logo.png',
    loading: false,
  }),
}))

function renderLayout() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return render(
    <QueryClientProvider client={client}>
      <AuthLayout>
        <form aria-label='Sign in form' />
      </AuthLayout>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.spyOn(api, 'get').mockResolvedValue({ data: { success: true, data: '' } })
})

describe('auth layout', () => {
  it('shows the sign-in form next to the product showcase', () => {
    renderLayout()

    expect(screen.getByRole('form', { name: 'Sign in form' })).toBeInTheDocument()
    const showcase = screen.getByRole('complementary')
    expect(
      within(showcase).getByRole('heading', { name: /cinematic video/ })
    ).toBeInTheDocument()
    expect(within(showcase).getAllByRole('listitem')).toHaveLength(4)
  })

  it('plays the built-in hero clip when the admin has set none', () => {
    renderLayout()

    expect(
      within(screen.getByRole('complementary')).getByLabelText(/Supercar in the rain/)
    ).toBeInTheDocument()
  })

  it('links the brand back to the home page on both layouts', () => {
    renderLayout()

    const homeLinks = screen
      .getAllByRole('link')
      .filter((link) => link.getAttribute('href') === '/')
    expect(homeLinks).toHaveLength(2)
  })
})
