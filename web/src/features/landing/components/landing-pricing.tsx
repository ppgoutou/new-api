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
import { useTranslation } from 'react-i18next'

import { useSeedancePricing } from '@/features/home/hooks/use-seedance-pricing'
import { HOME_VIDEO_MODELS } from '@/features/home/lib/video-home'
import { VIDEO_DURATION_RANGES } from '@/features/pricing/lib/video-pricing'

/**
 * Resolutions as rows and Seedance models as columns, so both models' prices
 * for one resolution read side by side. A model without that resolution
 * shows a dash.
 */
export function LandingPricing() {
  const { t } = useTranslation()
  const { byModel } = useSeedancePricing()
  const models = HOME_VIDEO_MODELS.filter((model) => byModel.has(model.name))
  const options = [
    ...new Set(
      models.flatMap((model) =>
        (byModel.get(model.name)?.rows ?? []).map((row) => row.option)
      )
    ),
  ]
  const durations = HOME_VIDEO_MODELS.flatMap((model) => {
    const range = VIDEO_DURATION_RANGES[model.name]
    return range
      ? [
          t('{{model}}: {{min}}–{{max}}s per clip', {
            model: model.name,
            min: range[0],
            max: range[1],
          }),
        ]
      : []
  })

  return (
    <div
      id='pricing'
      className='rounded-2xl bg-gradient-to-br from-brand-on-dark/55 via-white/5 to-violet-400/45 p-px'
    >
      <div className='h-full rounded-[15px] bg-ink-raised p-5 md:p-6'>
        <div className='flex flex-wrap items-baseline justify-between gap-2'>
          <h2 className='text-2xl font-bold text-white'>{t('Pricing')}</h2>
          <p className='font-mono text-xs text-brand-on-dark'>
            ● {t('Live · per second')}
          </p>
        </div>

        {models.length === 0 ? (
          <p className='mt-6 text-sm text-white/60'>
            {t('Billed by generated seconds')}
          </p>
        ) : (
          <div className='mt-4 overflow-x-auto'>
            <table className='w-full text-left text-sm'>
              <thead>
                <tr className='border-b border-white/10 text-xs text-white/50'>
                  <th scope='col' className='py-2.5 pr-3 font-normal'>
                    {t('Resolution')}
                  </th>
                  {models.map((model) => (
                    <th
                      key={model.name}
                      scope='col'
                      className='py-2.5 pr-3 font-mono font-normal text-white/75'
                    >
                      {model.name}
                      {model.isNew && (
                        <span className='ml-2 rounded bg-violet-500/20 px-1.5 py-0.5 font-sans text-[10px] text-violet-300'>
                          {t('New')}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {options.map((option) => (
                  <tr
                    key={option}
                    className='border-b border-white/5 last:border-0'
                  >
                    <th
                      scope='row'
                      className='py-3 pr-3 font-normal text-white/60'
                    >
                      {option.replace(/k$/i, 'K')}
                    </th>
                    {models.map((model) => {
                      const row = byModel
                        .get(model.name)
                        ?.rows.find((entry) => entry.option === option)
                      return (
                        <td key={model.name} className='py-3 pr-3'>
                          {row ? (
                            <>
                              <span className='font-mono font-semibold text-white'>
                                {row.price}
                              </span>
                              {row.officialPrice &&
                                row.officialPrice !== row.price && (
                                  <s className='ml-2 font-mono text-xs text-white/40'>
                                    {row.officialPrice}
                                  </s>
                                )}
                            </>
                          ) : (
                            <span className='text-white/40'>—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className='mt-4 text-xs leading-relaxed text-white/50'>
          {t(
            'Prices are per generated second; struck-through prices are official prices. Tasks with a reference video are billed by tokens.'
          )}{' '}
          {durations.join(' · ')}
        </p>
      </div>
    </div>
  )
}
