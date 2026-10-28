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
import { create } from 'zustand'

import {
  STUDIO_IMAGE_WORKS_KEY,
  STUDIO_IMAGE_WORKS_LIMIT,
} from '@/features/video-studio/constants'
import type { StudioImage } from '@/features/video-studio/types'

function readStoredWorks(): StudioImage[] {
  try {
    const raw = window.localStorage.getItem(STUDIO_IMAGE_WORKS_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? (parsed as StudioImage[]) : []
  } catch {
    return []
  }
}

interface ImageWorksState {
  works: StudioImage[]
  add: (images: StudioImage[]) => void
}

/**
 * Images generated in this browser, newest first. Image requests leave no
 * task record, so the list lives in localStorage; upstream image URLs expire,
 * so old entries may stop loading.
 */
export const useStudioImageWorks = create<ImageWorksState>((set) => ({
  works: readStoredWorks(),
  add: (images) =>
    set((state) => {
      const works = [...images, ...state.works].slice(
        0,
        STUDIO_IMAGE_WORKS_LIMIT
      )
      try {
        window.localStorage.setItem(
          STUDIO_IMAGE_WORKS_KEY,
          JSON.stringify(works)
        )
      } catch {
        // Storage may be full or blocked; the list still shows this session.
      }
      return { works }
    }),
}))
