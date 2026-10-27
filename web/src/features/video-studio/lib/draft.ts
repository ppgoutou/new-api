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
import {
  getPerVideoPricing,
  getVideoPricing,
} from '@/features/pricing/lib/video-pricing'
import type { PricingModel } from '@/features/pricing/types'

import {
  DEFAULT_STUDIO_DURATION,
  REFERENCE_LIMITS,
  REFERENCE_TOKEN_NAMES,
  type StudioModel,
} from '../constants'
import type {
  AssetKind,
  StudioAsset,
  StudioDraft,
  VideoTaskRequest,
} from '../types'

/**
 * Models of the public pricing list that the canvas can submit: video models
 * priced per output second or per video by resolution, in pricing list order.
 */
export function studioModelsFromPricing(
  models: readonly PricingModel[]
): StudioModel[] {
  return models.flatMap((model) => {
    const pricing = getVideoPricing(model) ?? getPerVideoPricing(model)
    if (!pricing || pricing.optionField !== 'resolution') return []
    return [
      {
        name: model.model_name,
        resolutions: pricing.rows.map((row) => row.option),
        duration: pricing.durationRange ?? DEFAULT_STUDIO_DURATION,
      },
    ]
  })
}

/** The named model, else the first one; undefined when there are none. */
export function findStudioModel(
  models: readonly StudioModel[],
  name: string
): StudioModel | undefined {
  return models.find((model) => model.name === name) ?? models[0]
}

/** Prompt token of a reference, such as "图片2" for the second image. */
export function referenceToken(kind: AssetKind, index: number): string {
  return `${REFERENCE_TOKEN_NAMES[kind]}${index + 1}`
}

/** Each reference with its prompt token, numbered per kind. */
export function labelReferences(
  references: StudioAsset[]
): { asset: StudioAsset; token: string }[] {
  const seen: Record<AssetKind, number> = { image: 0, video: 0, audio: 0 }
  return references.map((asset) => {
    const token = referenceToken(asset.kind, seen[asset.kind])
    seen[asset.kind] += 1
    return { asset, token }
  })
}

/**
 * Prompt text after a reference is removed: its "@" mentions disappear and
 * later references of the same kind move down one number, so every remaining
 * mention still points at the same file.
 */
export function removeReferenceFromPrompt(
  prompt: string,
  kind: AssetKind,
  removedIndex: number
): string {
  const name = REFERENCE_TOKEN_NAMES[kind]
  const pattern = new RegExp(`@${name}(\\d+)`, 'g')
  return prompt.replace(pattern, (match, digits: string) => {
    const index = Number(digits) - 1
    if (index === removedIndex) return ''
    if (index > removedIndex) return `@${referenceToken(kind, index - 1)}`
    return match
  })
}

/**
 * Keeps model, resolution and duration inside what the available models
 * support. Leaves the draft unchanged while there are no models.
 */
export function fitDraftToModel(
  draft: StudioDraft,
  models: readonly StudioModel[]
): StudioDraft {
  const model = findStudioModel(models, draft.model)
  if (!model) return draft
  const [shortest, longest] = model.duration
  return {
    ...draft,
    model: model.name,
    resolution: model.resolutions.includes(draft.resolution)
      ? draft.resolution
      : (model.resolutions.at(-1) ?? draft.resolution),
    seconds: Math.min(Math.max(draft.seconds, shortest), longest),
  }
}

export function countReferences(
  references: StudioAsset[]
): Record<AssetKind, number> {
  const counts: Record<AssetKind, number> = { image: 0, video: 0, audio: 0 }
  for (const asset of references) counts[asset.kind] += 1
  return counts
}

/** i18n key of the reason the draft cannot be submitted, or null. */
export function validateDraft(draft: StudioDraft): string | null {
  if (!draft.prompt.trim()) return 'Describe the video you want'
  const assets =
    draft.mode === 'frames'
      ? [draft.firstFrame, draft.lastFrame].flatMap((asset) =>
          asset ? [asset] : []
        )
      : draft.references
  if (assets.some((asset) => asset.status === 'uploading')) {
    return 'Wait for the uploads to finish'
  }
  if (assets.some((asset) => asset.status !== 'ready' || !asset.url)) {
    return 'Remove the files that failed to upload'
  }
  if (draft.mode === 'frames') {
    return draft.firstFrame ? null : 'Add a first frame image'
  }
  const counts = countReferences(draft.references)
  for (const kind of Object.keys(counts) as AssetKind[]) {
    if (counts[kind] > REFERENCE_LIMITS[kind]) {
      return 'Too many reference files'
    }
  }
  if (counts.audio > 0 && counts.image + counts.video === 0) {
    return 'Audio needs an image or video reference too'
  }
  return null
}

/** Body of POST /pg/videos for a valid draft already fitted to its model. */
export function buildVideoRequest(fitted: StudioDraft): VideoTaskRequest {
  const body: VideoTaskRequest = {
    model: fitted.model,
    prompt: fitted.prompt.trim(),
    seconds: fitted.seconds,
    resolution: fitted.resolution,
  }
  if (fitted.ratio !== 'auto') body.ratio = fitted.ratio

  if (fitted.mode === 'frames') {
    if (fitted.firstFrame?.url) body.first_image_url = fitted.firstFrame.url
    if (fitted.lastFrame?.url) body.last_image_url = fitted.lastFrame.url
    return body
  }
  const urlsOf = (kind: AssetKind) =>
    fitted.references.flatMap((asset) =>
      asset.kind === kind && asset.url ? [asset.url] : []
    )
  const images = urlsOf('image')
  const videos = urlsOf('video')
  const audios = urlsOf('audio')
  if (images.length) body.images = images
  if (videos.length) body.videos = videos
  if (audios.length) body.audios = audios
  return body
}

export interface PriceRow {
  /** USD per output second. */
  secondPrice: number
  /** USD per million tokens when the request carries a reference video. */
  referencePricePerMillion?: number
  tokensPerSecond?: number
  /** USD per video of any length, for models billed per video. */
  videoPrice?: number
}

/**
 * Estimated charge in USD before the group discount. Requests with a
 * reference video are billed by tokens on output seconds plus reference
 * seconds, at least 2/3 of the output rounded up, which is how the server
 * settles them while the reference length is unknown.
 */
export function estimateDraftCostUSD(
  row: PriceRow,
  seconds: number,
  count: number,
  hasReferenceVideo: boolean
): number {
  if (row.videoPrice !== undefined) return row.videoPrice * count
  if (
    hasReferenceVideo &&
    row.referencePricePerMillion !== undefined &&
    row.tokensPerSecond
  ) {
    const billedSeconds = seconds + Math.ceil((seconds * 2) / 3)
    const tokens = billedSeconds * row.tokensPerSecond
    return ((tokens * row.referencePricePerMillion) / 1_000_000) * count
  }
  return row.secondPrice * seconds * count
}
