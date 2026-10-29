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
import type { CellContext, ColumnDef } from '@tanstack/react-table'
import { render, renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, test } from 'vitest'

import { formatLogQuota } from '@/lib/format'

import type { TaskLog } from '../../types'
import { useTaskLogsColumns } from '../columns/task-logs-columns'

function taskLog(overrides: Partial<TaskLog> = {}): TaskLog {
  return {
    id: 1,
    user_id: 7,
    platform: 'seedance',
    task_id: 'task-1',
    action: 'generate',
    channel_id: 3,
    group: 'default',
    quota: 125000,
    submit_time: 1,
    status: 'SUCCESS',
    properties: { origin_model_name: 'seedance-2-5' },
    ...overrides,
  }
}

function columnById(columns: ColumnDef<TaskLog>[], id: string) {
  const column = columns.find(
    (item) => item.id === id || ('accessorKey' in item && item.accessorKey === id)
  )
  if (!column) throw new Error(`missing column ${id}`)
  return column
}

function renderCell(column: ColumnDef<TaskLog>, log: TaskLog) {
  const cell = column.cell as (context: CellContext<TaskLog, unknown>) => ReactNode
  render(
    <>
      {cell({
        row: { original: log, getValue: () => undefined },
      } as unknown as CellContext<TaskLog, unknown>)}
    </>
  )
}

describe('task log columns', () => {
  test('given a user task, the model and cost columns show its model and charge', () => {
    const { result } = renderHook(() => useTaskLogsColumns(false, false))

    renderCell(columnById(result.current, 'model'), taskLog())
    renderCell(columnById(result.current, 'quota'), taskLog())

    expect(screen.getByText('seedance-2-5')).toBeVisible()
    expect(screen.getByText(formatLogQuota(125000))).toBeVisible()
  })

  test('given a task without a model or a charge, both columns show a dash', () => {
    const { result } = renderHook(() => useTaskLogsColumns(false, false))
    const log = taskLog({ quota: 0, properties: {} })

    renderCell(columnById(result.current, 'model'), log)
    renderCell(columnById(result.current, 'quota'), log)

    expect(screen.getAllByText('-')).toHaveLength(2)
  })
})
