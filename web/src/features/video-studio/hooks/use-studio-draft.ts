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
import { useRef, useState } from 'react'

import { DEFAULT_DRAFT } from '../constants'
import { removeReferenceFromPrompt } from '../lib/draft'
import type { StudioAsset, StudioDraft } from '../types'

type FrameSlot = 'first' | 'last'

/**
 * Draft state of the composer, as the user picked it; readers fit it to the
 * available models. Upload callbacks keep reporting progress after a file is
 * removed, so removed assets are remembered and their late updates ignored.
 * An initial model, when given, replaces the default one.
 */
export function useStudioDraft(initialModel?: string) {
  const [draft, setDraft] = useState<StudioDraft>(() =>
    initialModel ? { ...DEFAULT_DRAFT, model: initialModel } : DEFAULT_DRAFT
  )
  const removedIds = useRef(new Set<string>())

  const update = (patch: Partial<StudioDraft>) =>
    setDraft((current) => ({ ...current, ...patch }))

  const putReference = (asset: StudioAsset) => {
    if (removedIds.current.has(asset.id)) return
    setDraft((current) => {
      const exists = current.references.some((item) => item.id === asset.id)
      const references = exists
        ? current.references.map((item) =>
            item.id === asset.id ? asset : item
          )
        : [...current.references, asset]
      return { ...current, references }
    })
  }

  const removeReference = (asset: StudioAsset) => {
    removedIds.current.add(asset.id)
    URL.revokeObjectURL(asset.previewUrl)
    setDraft((current) => {
      const sameKind = current.references.filter(
        (item) => item.kind === asset.kind
      )
      const index = sameKind.findIndex((item) => item.id === asset.id)
      if (index < 0) return current
      return {
        ...current,
        prompt: removeReferenceFromPrompt(current.prompt, asset.kind, index),
        references: current.references.filter((item) => item.id !== asset.id),
      }
    })
  }

  const putFrame = (slot: FrameSlot, asset: StudioAsset) => {
    if (removedIds.current.has(asset.id)) return
    setDraft((current) =>
      slot === 'first'
        ? { ...current, firstFrame: asset }
        : { ...current, lastFrame: asset }
    )
  }

  const removeFrame = (slot: FrameSlot) => {
    setDraft((current) => {
      const asset = slot === 'first' ? current.firstFrame : current.lastFrame
      if (asset) {
        removedIds.current.add(asset.id)
        URL.revokeObjectURL(asset.previewUrl)
      }
      return slot === 'first'
        ? { ...current, firstFrame: undefined }
        : { ...current, lastFrame: undefined }
    })
  }

  return { draft, update, putReference, removeReference, putFrame, removeFrame }
}
