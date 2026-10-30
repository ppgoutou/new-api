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
  useVideoSeriesPricing,
  type SeriesPriceRow,
} from '../../hooks/use-video-series-pricing'

export function ModelPricing() {
  const { t } = useTranslation()
  const seriesList = useVideoSeriesPricing()

  const formatResolution = (option: string) => option.replace(/k$/i, 'K')
  const columns: StaticDataTableColumn<SeriesPriceRow>[] = [
    {
      id: 'option',
      header: t('Resolution'),
      className: 'w-[20%]',
      cell: (row) => formatResolution(row.option),
    },
    {
      id: 'price',
      header: t('Lowest per second'),
      className: 'w-[28%]',
      cellClassName: 'font-mono font-semibold whitespace-nowrap tabular-nums',
      cell: (row) => (row.approximate ? `≈${row.price}` : row.price),
    },
    {
      id: 'model',
      header: t('Model'),
      cellClassName: 'text-muted-foreground text-[11px]!',
      cell: (row) => row.modelName,
    },
  ]

  return (
    <section
      id='pricing'
      className='relative z-10 scroll-mt-20 px-6 py-14 md:py-20'
    >
      <div className='mx-auto max-w-6xl'>
        <p className='text-brand dark:text-brand-on-dark mb-2 text-sm font-semibold'>
          {t('Models and pricing')}
        </p>
        <h2 className='text-3xl font-bold tracking-tight md:text-4xl'>
          {t('Billed per second, as low as half the official price')}
        </h2>
        <p className='text-muted-foreground mt-3 max-w-2xl'>
          {t(
            'No monthly fee or minimum spend: pay only for what you generate. Each resolution shows the cheapest model in the series.'
          )}
        </p>

        {seriesList.length === 0 ? (
          <Link
            to='/pricing'
            className='text-brand dark:text-brand-on-dark mt-8 inline-block text-sm font-semibold hover:underline'
          >
            {t('See prices in the model square')} →
          </Link>
        ) : (
          <div className='mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3'>
            {seriesList.map((series) => {
              const first = series.rows[0]
              const last = series.rows.at(-1)

              return (
                <article
                  key={series.name}
                  className='bg-card border-border/60 flex flex-col gap-4 rounded-2xl border p-5'
                >
                  <div className='flex items-start justify-between gap-3'>
                    <div className='min-w-0'>
                      <div className='flex flex-wrap items-center gap-2'>
                        <h3 className='font-mono text-lg font-medium whitespace-nowrap sm:text-xl'>
                          {series.name}
                        </h3>
                        {series.isNew && <Badge>{t('New')}</Badge>}
                      </div>
                      <p className='text-muted-foreground mt-1 text-sm'>
                        {t('Supports {{models}}', {
                          models: series.variants.join(' / '),
                        })}
                      </p>
                    </div>
                    {series.lowest && (
                      <p className='shrink-0 text-right'>
                        <span className='text-muted-foreground block text-xs'>
                          {t('From')}
                        </span>
                        <span className='text-xl font-bold whitespace-nowrap tabular-nums sm:text-2xl'>
                          {t('{{price}} / s', {
                            price: series.lowest.approximate
                              ? `≈${series.lowest.price}`
                              : series.lowest.price,
                          })}
                        </span>
                      </p>
                    )}
                  </div>
                  <dl className='grid grid-cols-3 gap-2 text-xs sm:text-sm'>
                    <div className='bg-muted/50 rounded-lg px-2.5 py-2'>
                      <dt className='text-muted-foreground text-xs'>
                        {t('Resolution')}
                      </dt>
                      <dd className='mt-0.5 font-medium whitespace-nowrap'>
                        {first && last && first !== last
                          ? `${formatResolution(first.option)}–${formatResolution(last.option)}`
                          : formatResolution(first?.option ?? '-')}
                      </dd>
                    </div>
                    <div className='bg-muted/50 rounded-lg px-2.5 py-2'>
                      <dt className='text-muted-foreground text-xs'>
                        {t('Duration per clip')}
                      </dt>
                      <dd className='mt-0.5 font-medium whitespace-nowrap'>
                        {series.durationRange
                          ? t('{{min}}–{{max}} seconds', {
                              min: series.durationRange[0],
                              max: series.durationRange[1],
                            })
                          : '-'}
                      </dd>
                    </div>
                    <div className='bg-muted/50 rounded-lg px-2.5 py-2'>
                      <dt className='text-muted-foreground text-xs'>
                        {t('Aspect ratio')}
                      </dt>
                      <dd className='mt-0.5 font-medium whitespace-nowrap'>
                        {series.aspectRatioCount > 0
                          ? t('{{count}} ratios', {
                              count: series.aspectRatioCount,
                            })
                          : '-'}
                      </dd>
                    </div>
                  </dl>
                  <StaticDataTable
                    tableClassName='table-fixed'
                    columns={columns}
                    data={series.rows}
                    getRowKey={(row) => row.option}
                  />
                  {series.perVideo && (
                    <p className='text-muted-foreground text-xs'>
                      {t('Per video')}{' '}
                      <span className='text-foreground font-mono font-semibold'>
                        {t('{{price}} / video', {
                          price: series.perVideo.price,
                        })}
                      </span>{' '}
                      · {series.perVideo.modelName}
                    </p>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
