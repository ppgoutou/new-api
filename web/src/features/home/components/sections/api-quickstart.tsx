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

import { CopyButton } from '@/components/copy-button'
import { useStatus } from '@/hooks/use-status'

import { HERO_VIDEO } from '../../lib/video-home'

export function ApiQuickstart() {
  const { t } = useTranslation()
  const { status } = useStatus()
  const serverAddress =
    (status?.server_address as string | undefined) || window.location.origin
  const prompt = t(HERO_VIDEO.prompt).replaceAll("'", '’')
  const code = [
    `curl ${serverAddress.replace(/\/+$/, '')}/v1/videos \\`,
    '  -H "Authorization: Bearer $API_KEY" \\',
    '  -H "Content-Type: application/json" \\',
    "  -d '{",
    '    "model": "seedance-2.0",',
    `    "prompt": ${JSON.stringify(prompt)},`,
    '    "seconds": "5",',
    '    "size": "1280x720"',
    "  }'",
  ].join('\n')

  const steps = [
    {
      title: t('Sign up and top up'),
      desc: t(
        'Pay by card; credits are available as soon as payment completes.'
      ),
    },
    {
      title: t('Create an API key'),
      desc: t('Create one on the Tokens page of the console.'),
    },
    {
      title: t('Submit a task and fetch the video'),
      desc: t(
        'Submitting returns a task ID; download the video when it completes.'
      ),
    },
  ]

  return (
    <section
      id='api'
      className='bg-muted/30 border-border/40 relative z-10 scroll-mt-20 border-y px-6 py-20 md:py-28'
    >
      <div className='mx-auto flex max-w-6xl flex-wrap items-start gap-12'>
        <div className='min-w-0 flex-[1_1_20rem]'>
          <p className='mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400'>
            {t('For developers')}
          </p>
          <h2 className='text-3xl font-bold tracking-tight md:text-4xl'>
            {t('Prefer code? Generate video with the API')}
          </h2>
          <ol className='mt-7 flex flex-col gap-5'>
            {steps.map((step, index) => (
              <li key={step.title} className='flex gap-4'>
                <span
                  className='flex size-7 shrink-0 items-center justify-center rounded-full border border-blue-500/50 text-xs font-semibold text-blue-700 dark:text-blue-300'
                  aria-hidden
                >
                  {index + 1}
                </span>
                <div>
                  <h3 className='font-semibold'>{step.title}</h3>
                  <p className='text-muted-foreground mt-0.5 text-sm'>
                    {step.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className='border-border/60 min-w-0 flex-[1.4_1_28rem] overflow-hidden rounded-2xl border bg-slate-950 text-slate-200'>
          <div className='flex items-center justify-between border-b border-slate-800 px-4 py-2'>
            <span className='font-mono text-xs text-slate-400'>curl</span>
            <CopyButton
              value={code}
              className='text-slate-300 hover:bg-slate-800 hover:text-white'
              aria-label={t('Copy code')}
            />
          </div>
          <pre className='overflow-x-auto p-5 font-mono text-[13px] leading-relaxed'>
            <code>{code}</code>
          </pre>
        </div>
      </div>
    </section>
  )
}
