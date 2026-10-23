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
import type { AssetKind, StudioDraft, StudioRatio } from './types'

export interface StudioModel {
  name: string
  resolutions: readonly string[]
  /** Shortest and longest output, in seconds. */
  duration: readonly [number, number]
}

/**
 * Duration range of a video model that has no entry in VIDEO_DURATION_RANGES,
 * the same as seedance-2.0.
 */
export const DEFAULT_STUDIO_DURATION: readonly [number, number] = [4, 15]

export const STUDIO_RATIOS: readonly StudioRatio[] = [
  'auto',
  '21:9',
  '16:9',
  '4:3',
  '1:1',
  '3:4',
  '9:16',
]

export const STUDIO_MAX_COUNT = 4

/** Most reference files of each kind one request can carry. */
export const REFERENCE_LIMITS: Readonly<Record<AssetKind, number>> = {
  image: 9,
  video: 3,
  audio: 3,
}

/** Upload limits mirrored from the server (controller/video_asset.go). */
export const ASSET_MAX_BYTES: Readonly<Record<AssetKind, number>> = {
  image: 10 * 1024 * 1024,
  video: 50 * 1024 * 1024,
  audio: 15 * 1024 * 1024,
}

export const ASSET_ACCEPT: Readonly<Record<AssetKind, string>> = {
  image: 'image/jpeg,image/png,image/webp',
  video: 'video/mp4,video/quicktime',
  audio: 'audio/mpeg,audio/wav,audio/x-wav,audio/mp4,audio/x-m4a',
}

/** Days an uploaded reference file stays available. */
export const ASSET_RETENTION_DAYS = 7

/**
 * Prompt tokens that point at a reference, numbered per kind in upload order:
 * "@图片1" is the first image. The model reads these names, so they stay the
 * same in every interface language.
 */
export const REFERENCE_TOKEN_NAMES: Readonly<Record<AssetKind, string>> = {
  image: '图片',
  video: '视频',
  audio: '音频',
}

export const DEFAULT_DRAFT: StudioDraft = {
  mode: 'reference',
  model: 'seedance-2.0',
  prompt: '',
  ratio: 'auto',
  resolution: '720p',
  seconds: 5,
  count: 1,
  references: [],
}

/** Query key of the user's latest video tasks. */
export const STUDIO_WORKS_QUERY_KEY = ['video-studio', 'works'] as const
