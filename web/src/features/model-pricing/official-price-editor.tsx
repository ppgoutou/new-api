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
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { handleServerError } from '@/lib/handle-server-error'

import { useModelPricing, useSaveOfficialPrice } from './api'

const OFFICIAL_PRICE_KEY = 'billing_setting.official_price_expr'

/**
 * Edits the vendor's published price that the pricing page shows above the
 * group prices. It is saved on its own and never affects what is charged.
 */
export function OfficialPriceEditor(props: { modelName: string }) {
  const { t } = useTranslation()
  const query = useModelPricing([props.modelName], Boolean(props.modelName))
  const save = useSaveOfficialPrice()
  const entry = query.data?.entries.find(
    (item) => item.model_name === props.modelName
  )
  const saved = entry?.configured[OFFICIAL_PRICE_KEY] ?? ''
  const [expression, setExpression] = useState(saved)

  useEffect(() => {
    setExpression(saved)
  }, [saved, props.modelName])

  const persist = async (value: string) => {
    try {
      await save.mutateAsync({ model_name: props.modelName, expression: value })
      toast.success(
        value.trim() ? t('Official price saved') : t('Official price removed')
      )
    } catch (error) {
      handleServerError(error)
    }
  }

  const inputId = `official-price-${props.modelName}`
  return (
    <section
      aria-label={t('Official Price')}
      className='space-y-2 rounded-lg border p-3'
    >
      <div className='space-y-1'>
        <Label htmlFor={inputId}>{t('Official Price')}</Label>
        <p className='text-muted-foreground text-xs'>
          {t(
            'Shown to users above the group prices. It is never charged. Use the same usage fields as the billing expression, in USD; leave it empty to hide the section.'
          )}
        </p>
      </div>
      <Textarea
        id={inputId}
        value={expression}
        onChange={(event) => setExpression(event.target.value)}
        className='min-h-20 font-mono text-xs'
        disabled={!entry || save.isPending}
      />
      <div className='flex justify-end gap-2'>
        <Button
          type='button'
          variant='outline'
          size='sm'
          disabled={!saved || save.isPending}
          onClick={() => void persist('')}
        >
          {t('Remove official price')}
        </Button>
        <Button
          type='button'
          size='sm'
          disabled={!entry || save.isPending || expression === saved}
          onClick={() => void persist(expression)}
        >
          {t('Save official price')}
        </Button>
      </div>
    </section>
  )
}
