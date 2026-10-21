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
import { useMemo, useState, type ReactNode } from 'react'

import { HomePlaybackContext } from '../hooks/use-home-playback'

/**
 * Lets the clip player dialog pause every background preview on the home
 * page while it plays, and resume them when it closes.
 */
export function HomePlaybackProvider(props: { children: ReactNode }) {
  const [suspended, setSuspended] = useState(false)
  const value = useMemo(() => ({ suspended, setSuspended }), [suspended])
  return (
    <HomePlaybackContext.Provider value={value}>
      {props.children}
    </HomePlaybackContext.Provider>
  )
}
