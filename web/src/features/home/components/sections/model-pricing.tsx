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
import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'

import {
  StaticDataTable,
  type StaticDataTableColumn,
} from '@/components/data-table'
import { Badge } from '@/components/ui/badge'

import {
  useSeedancePricing,
  type SeedancePriceRow,
} from '../../hooks/use-seedance-pricing'
import { HOME_VIDEO_MODELS } from '../../lib/video-home'

export function ModelPricing() {
  const { t } = useTranslation()
  const { byModel, bestDiscount } = useSeedancePricing()

  return (
    <section
      id='pricing'
      className='relative z-10 scroll-mt-20 px-6 py-20 md:py-28'
    >
      <div className='mx-auto max-w-6xl'>
        <p className='mb-2 text-sm font-semibold text-brand dark:text-brand-on-dark'>
          {t('Models and pricing')}
        </p>
        <h2 className='text-3xl font-bold tracking-tight md:text-4xl'>
          {bestDiscount
            ? t(
                'Billed per second, {{percentOff}}% off official prices',
                bestDiscount
              )
            : t('Billed per generated second')}
        </h2>
        <p className='text-muted-foreground mt-3 max-w-2xl'>
          {t(
            'No monthly fee or minimum spend: pay only for what you generate. Tasks with a reference video are billed by tokens; see the model square for details.'
          )}
        </p>

        <div className='mt-8 grid gap-5 md:grid-cols-2'>
          {HOME_VIDEO_MODELS.map((model) => {
            const pricing = byModel.get(model.name)
            const range = pricing?.durationRange ?? model.durationRange
            const columns: StaticDataTableColumn<SeedancePriceRow>[] = [
              {
                id: 'option',
                header: t('Resolution'),
                cell: (row) => row.option.replace(/k$/i, 'K'),
              },
            ]
            if (pricing?.discount) {
              columns.push({
                id: 'official',
                header: t('Official price'),
                cellClassName:
                  'text-muted-foreground font-mono tabular-nums line-through',
                cell: (row) =>
                  row.officialPrice
                    ? t('{{price}} / s', { price: row.officialPrice })
                    : '-',
              })
            }
            columns.push({
              id: 'price',
              header: t('Our price'),
              cellClassName: 'font-mono font-semibold tabular-nums',
              cell: (row) => t('{{price}} / s', { price: row.price }),
            })

            return (
              <article
                key={model.name}
                className='bg-card border-border/60 flex flex-col gap-5 rounded-2xl border p-6'
              >
                <div className='flex flex-wrap items-start justify-between gap-4'>
                  <div>
                    <div className='flex items-center gap-2'>
                      <h3 className='font-mono text-xl font-medium'>
                        {model.name}
                      </h3>
                      {model.isNew && <Badge>{t('New')}</Badge>}
                    </div>
                    <p className='text-muted-foreground mt-1 text-sm'>
                      {t(model.tagline)}
                    </p>
                  </div>
                  {pricing && (
                    <p className='text-right'>
                      <span className='text-muted-foreground block text-xs'>
                        {t('From')}
                      </span>
                      <span className='text-2xl font-bold tabular-nums'>
                        {t('{{price}} / s', { price: pricing.lowestPrice })}
                      </span>
                    </p>
                  )}
                </div>
                <dl className='grid grid-cols-2 gap-3 text-sm'>
                  <div className='bg-muted/50 rounded-lg px-3.5 py-2.5'>
                    <dt className='text-muted-foreground text-xs'>
                      {t('Resolution')}
                    </dt>
                    <dd className='mt-0.5 font-medium'>
                      {model.resolutions.join(' / ')}
                    </dd>
                  </div>
                  <div className='bg-muted/50 rounded-lg px-3.5 py-2.5'>
                    <dt className='text-muted-foreground text-xs'>
                      {t('Duration per clip')}
                    </dt>
                    <dd className='mt-0.5 font-medium'>
                      {t('{{min}}–{{max}} seconds', {
                        min: range[0],
                        max: range[1],
                      })}
                    </dd>
                  </div>
                </dl>
                {pricing ? (
                  <StaticDataTable
                    columns={columns}
                    data={pricing.rows}
                    getRowKey={(row) => row.option}
                  />
                ) : (
                  <Link
                    to='/pricing'
                    className='text-sm font-semibold text-brand dark:text-brand-on-dark hover:underline'
                  >
                    {t('See prices in the model square')} →
                  </Link>
                )}
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
