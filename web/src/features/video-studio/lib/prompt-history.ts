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

// The server does not keep the prompt of a video task, so the page remembers
// the prompts it submitted in this browser to label the user's works.
const STORAGE_KEY = 'video-studio:prompts'
const MAX_ENTRIES = 200

type PromptEntry = { prompt: string; spec: string; at: number }

function readAll(): Record<string, PromptEntry> {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : {}
    return parsed && typeof parsed === 'object'
      ? (parsed as Record<string, PromptEntry>)
      : {}
  } catch {
    return {}
  }
}

export function rememberTaskPrompt(
  taskId: string,
  prompt: string,
  spec: string
) {
  try {
    const entries = readAll()
    entries[taskId] = { prompt, spec, at: Date.now() }
    const kept = Object.entries(entries)
      .sort((a, b) => b[1].at - a[1].at)
      .slice(0, MAX_ENTRIES)
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(Object.fromEntries(kept))
    )
  } catch {
    // Storage may be unavailable (private mode); the work just shows no prompt.
  }
}

export function recallTaskPrompt(
  taskId: string
): { prompt: string; spec: string } | null {
  const entry = readAll()[taskId]
  if (!entry || typeof entry.prompt !== 'string') return null
  return {
    prompt: entry.prompt,
    spec: typeof entry.spec === 'string' ? entry.spec : '',
  }
}
