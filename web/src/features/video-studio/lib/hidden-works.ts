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

// Video tasks stay on the server as usage records, so deleting a work only
// hides it from this browser's works lists.
const STORAGE_KEY = 'video-studio:hidden-tasks'
const MAX_ENTRIES = 500

export function readHiddenTasks(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : []
  } catch {
    return []
  }
}

/** Hides the task and returns every hidden task id, newest first. */
export function hideTask(taskId: string): string[] {
  const hidden = [
    taskId,
    ...readHiddenTasks().filter((id) => id !== taskId),
  ].slice(0, MAX_ENTRIES)
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(hidden))
  } catch {
    // Storage may be unavailable; the work stays hidden until the page reloads.
  }
  return hidden
}
