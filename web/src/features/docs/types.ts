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

/** A run of prose in Markdown, or a code sample with a copy button. */
export type DocBlock =
  | { type: 'markdown'; text: string }
  | { type: 'code'; label: string; code: string }

export interface DocSection {
  /** Anchor id, shared by every language so links stay stable. */
  id: string
  title: string
  blocks: DocBlock[]
}

export interface DocContent {
  title: string
  intro: string
  sections: DocSection[]
}
