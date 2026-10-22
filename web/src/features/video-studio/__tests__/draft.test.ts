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
import { describe, expect, it } from 'vitest'

import { DEFAULT_DRAFT } from '../constants'
import {
  buildVideoRequest,
  estimateDraftCostUSD,
  fitDraftToModel,
  labelReferences,
  removeReferenceFromPrompt,
  validateDraft,
} from '../lib/draft'
import type { AssetKind, StudioAsset, StudioDraft } from '../types'

function asset(
  id: string,
  kind: AssetKind,
  status: StudioAsset['status'] = 'ready'
): StudioAsset {
  return {
    id,
    kind,
    fileName: `${id}.bin`,
    previewUrl: `blob:${id}`,
    status,
    progress: status === 'ready' ? 100 : 0,
    url:
      status === 'ready'
        ? `https://site.example/video-assets/${id}`
        : undefined,
  }
}

function draft(patch: Partial<StudioDraft>): StudioDraft {
  return { ...DEFAULT_DRAFT, prompt: 'a cat', ...patch }
}

describe('labelReferences', () => {
  it('numbers references per kind in upload order', () => {
    const labels = labelReferences([
      asset('a', 'image'),
      asset('b', 'video'),
      asset('c', 'image'),
      asset('d', 'audio'),
    ])
    expect(labels.map((entry) => entry.token)).toEqual([
      '图片1',
      '视频1',
      '图片2',
      '音频1',
    ])
  })
})

describe('removeReferenceFromPrompt', () => {
  it('drops mentions of the removed file and renumbers later ones of the same kind', () => {
    const prompt = '@图片1 dances like @视频1 next to @图片2 and @图片3'
    expect(removeReferenceFromPrompt(prompt, 'image', 1)).toBe(
      '@图片1 dances like @视频1 next to  and @图片2'
    )
  })
})

describe('fitDraftToModel', () => {
  it('lowers 4k and long durations when switching to seedance-2.5 limits', () => {
    const fitted = fitDraftToModel(
      draft({ model: 'seedance-2.5', resolution: '4k', seconds: 40 })
    )
    expect(fitted.resolution).toBe('1080p')
    expect(fitted.seconds).toBe(30)
  })

  it('caps seedance-2.0 at 15 seconds and raises short durations to 4', () => {
    expect(fitDraftToModel(draft({ seconds: 20 })).seconds).toBe(15)
    expect(fitDraftToModel(draft({ seconds: 1 })).seconds).toBe(4)
  })
})

describe('validateDraft', () => {
  it.each([
    ['an empty prompt', draft({ prompt: '  ' }), 'Describe the video you want'],
    [
      'a running upload',
      draft({ references: [asset('a', 'image', 'uploading')] }),
      'Wait for the uploads to finish',
    ],
    [
      'a failed upload',
      draft({ references: [asset('a', 'image', 'error')] }),
      'Remove the files that failed to upload',
    ],
    [
      'audio alone',
      draft({ references: [asset('a', 'audio')] }),
      'Audio needs an image or video reference too',
    ],
    [
      'four reference videos',
      draft({
        references: ['a', 'b', 'c', 'd'].map((id) => asset(id, 'video')),
      }),
      'Too many reference files',
    ],
    [
      'frames without a first frame',
      draft({ mode: 'frames', lastFrame: asset('z', 'image') }),
      'Add a first frame image',
    ],
  ])('rejects %s', (_, value, reason) => {
    expect(validateDraft(value)).toBe(reason)
  })

  it('accepts a text-only prompt', () => {
    expect(validateDraft(draft({}))).toBeNull()
  })
})

describe('buildVideoRequest', () => {
  it('sends references by kind and leaves out the ratio on auto', () => {
    const body = buildVideoRequest(
      draft({
        prompt: '  @图片1 walks  ',
        references: [
          asset('a', 'image'),
          asset('b', 'video'),
          asset('c', 'audio'),
        ],
      })
    )
    expect(body).toEqual({
      model: 'seedance-2.0',
      prompt: '@图片1 walks',
      seconds: 5,
      resolution: '720p',
      images: ['https://site.example/video-assets/a'],
      videos: ['https://site.example/video-assets/b'],
      audios: ['https://site.example/video-assets/c'],
    })
  })

  it('sends only the frame URLs in frames mode', () => {
    const body = buildVideoRequest(
      draft({
        mode: 'frames',
        ratio: '9:16',
        references: [asset('a', 'image')],
        firstFrame: asset('f', 'image'),
        lastFrame: asset('l', 'image'),
      })
    )
    expect(body).toEqual({
      model: 'seedance-2.0',
      prompt: 'a cat',
      seconds: 5,
      resolution: '720p',
      ratio: '9:16',
      first_image_url: 'https://site.example/video-assets/f',
      last_image_url: 'https://site.example/video-assets/l',
    })
  })
})

describe('estimateDraftCostUSD', () => {
  const row = {
    secondPrice: 0.1,
    referencePricePerMillion: 4,
    tokensPerSecond: 21600,
  }

  it('charges per second for each video', () => {
    expect(estimateDraftCostUSD(row, 5, 2, false)).toBeCloseTo(1)
  })

  it('charges reference orders by tokens with at least 2/3 of the output as reference seconds', () => {
    // 5 s output + ceil(10/3) = 4 s reference = 9 s of tokens.
    expect(estimateDraftCostUSD(row, 5, 1, true)).toBeCloseTo(
      (9 * 21600 * 4) / 1_000_000
    )
  })
})
