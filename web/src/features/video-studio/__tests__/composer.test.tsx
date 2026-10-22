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
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createVideoTask, uploadVideoAsset } from '../api'
import { Composer } from '../components/composer'

vi.mock('../api', () => ({
  uploadVideoAsset: vi.fn(),
  createVideoTask: vi.fn(),
}))

vi.mock('../hooks/use-studio-price', () => ({
  useStudioPrice: () => '¥0.75',
}))

const uploadMock = vi.mocked(uploadVideoAsset)
const createMock = vi.mocked(createVideoTask)

beforeEach(() => {
  vi.stubGlobal(
    'URL',
    Object.assign(URL, {
      createObjectURL: vi.fn(() => 'blob:preview'),
      revokeObjectURL: vi.fn(),
    })
  )
  uploadMock.mockResolvedValue({
    success: true,
    data: {
      url: 'https://site.example/video-assets/cat.png',
      content_type: 'image/png',
      size: 4,
      expires_at: 0,
    },
  })
  createMock.mockResolvedValue('task_1')
  window.localStorage.clear()
})

afterEach(() => {
  vi.clearAllMocks()
  vi.unstubAllGlobals()
})

async function uploadImage(user: ReturnType<typeof userEvent.setup>) {
  const file = new File(['png!'], 'cat.png', { type: 'image/png' })
  await user.upload(screen.getByLabelText('References'), file)
  await screen.findByText('@图片1')
}

describe('Composer', () => {
  it('inserts the token of an uploaded reference when @ is typed', async () => {
    const user = userEvent.setup()
    render(<Composer onSubmitted={vi.fn()} />)
    await uploadImage(user)

    const prompt = screen.getByRole('textbox', { name: 'Video prompt' })
    await user.type(prompt, 'the cat in @')
    expect(screen.getByRole('option', { name: /@图片1/ })).toBeInTheDocument()
    await user.keyboard('{Enter}')

    expect(prompt).toHaveValue('the cat in @图片1 ')
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('submits the prompt with the uploaded reference URL and refreshes the works', async () => {
    const user = userEvent.setup()
    const onSubmitted = vi.fn()
    render(<Composer onSubmitted={onSubmitted} />)
    await uploadImage(user)
    await user.type(
      screen.getByRole('textbox', { name: 'Video prompt' }),
      'a cat runs'
    )

    await user.click(screen.getByRole('button', { name: 'Generate video' }))

    await waitFor(() => expect(onSubmitted).toHaveBeenCalledOnce())
    expect(createMock).toHaveBeenCalledOnce()
    expect(createMock).toHaveBeenCalledWith({
      model: 'seedance-2.0',
      prompt: 'a cat runs',
      seconds: 5,
      resolution: '720p',
      images: ['https://site.example/video-assets/cat.png'],
    })
    expect(screen.getByText('¥0.75')).toBeInTheDocument()
  })

  it('does not submit an empty prompt', async () => {
    const user = userEvent.setup()
    const onSubmitted = vi.fn()
    render(<Composer onSubmitted={onSubmitted} />)

    await user.click(screen.getByRole('button', { name: 'Generate video' }))

    expect(createMock).not.toHaveBeenCalled()
    expect(onSubmitted).not.toHaveBeenCalled()
  })

  it('removes the mention of a reference when the file is removed', async () => {
    const user = userEvent.setup()
    render(<Composer onSubmitted={vi.fn()} />)
    await uploadImage(user)
    const prompt = screen.getByRole('textbox', { name: 'Video prompt' })
    await user.type(prompt, 'keep @')
    await user.keyboard('{Enter}')

    await user.click(screen.getByRole('button', { name: 'Remove cat.png' }))

    expect(prompt).toHaveValue('keep  ')
    expect(screen.queryByText('@图片1')).not.toBeInTheDocument()
  })
})
