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
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'

import { DataTableView } from '../data-table-view'

const rows = [{ name: 'alpha', action: 'edit' }]

function Fixture() {
  const table = useReactTable({
    data: rows,
    columns: [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'action', header: 'Action' },
    ],
    getCoreRowModel: getCoreRowModel(),
  })
  return (
    <DataTableView
      table={table}
      pinnedColumns={[{ columnId: 'action', side: 'right' }]}
    />
  )
}

// The console content area is transparent over the site backdrop, so the
// table frame must paint its own surface and pinned cells must use that same
// surface; otherwise rows show the backdrop while pinned cells stay white.
it('paints pinned cells with the same opaque surface as the table frame', () => {
  render(<Fixture />)
  const frame = screen.getByRole('table').closest('.rounded-lg')
  const pinnedCell = screen.getByRole('cell', { name: 'edit' })

  expect(frame).toHaveClass('bg-card')
  expect(pinnedCell).toHaveClass('bg-card')
  expect(pinnedCell).not.toHaveClass('bg-background')
})
