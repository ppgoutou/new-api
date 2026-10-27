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
import { ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { CopyButton } from '@/components/copy-button'
import { Button } from '@/components/ui/button'
import { useStatus } from '@/hooks/use-status'

interface RelayGuideProps {
  isAuthenticated?: boolean
}

/** Step-by-step guide from a first visit to a first video in the relay station. */
export function RelayGuide(props: RelayGuideProps) {
  const { t } = useTranslation()
  const { status } = useStatus()
  const serverAddress = (
    (status?.server_address as string | undefined) || window.location.origin
  ).replace(/\/+$/, '')
  const apiBaseUrl = `${serverAddress}/v1`
  const docsLink = status?.docs_link as string | undefined

  const steps = [
    {
      title: t('Create an account'),
      desc: t(
        'Sign up with your email in under a minute. One account works for both online creation and the API.'
      ),
      action: props.isAuthenticated
        ? { label: t('Go to Dashboard'), to: '/dashboard' }
        : { label: t('Sign up free'), to: '/sign-up' },
    },
    {
      title: t('Top up your balance'),
      desc: t(
        'On the Wallet page, pay by card through Stripe or redeem a top-up code. The balance is credited right away.'
      ),
      action: { label: t('Open Wallet'), to: '/wallet' },
    },
    {
      title: t('Create in the browser'),
      desc: t(
        'Open Video Creation, pick a model, resolution and duration, write a prompt and generate. No code needed.'
      ),
      action: { label: t('Open Video Creation'), to: '/video-studio' },
    },
    {
      title: t('Or call the API'),
      desc: t(
        'Create an API key on the Tokens page and point your client at the address below.'
      ),
      action: { label: t('Create an API key'), to: '/keys' },
    },
  ]

  return (
    <section
      id='guide'
      className='bg-muted/30 border-border/40 relative z-10 scroll-mt-20 border-y px-6 py-20 md:py-28'
    >
      <div className='mx-auto max-w-6xl'>
        <p className='mb-2 text-sm font-semibold text-blue-600 dark:text-blue-400'>
          {t('Getting started')}
        </p>
        <h2 className='text-3xl font-bold tracking-tight md:text-4xl'>
          {t('How to enter the relay station')}
        </h2>
        <p className='text-muted-foreground mt-3 max-w-2xl'>
          {t(
            'The relay station is this site: it connects you to Seedance with one account and one balance. Sign up, top up, then create online or through the API.'
          )}
        </p>

        <ol className='mt-10 grid gap-5 md:grid-cols-2'>
          {steps.map((step, index) => (
            <li
              key={step.title}
              className='bg-card border-border/60 flex gap-4 rounded-2xl border p-6'
            >
              <span
                className='flex size-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white'
                aria-hidden
              >
                {index + 1}
              </span>
              <div className='flex min-w-0 flex-col gap-3'>
                <div>
                  <h3 className='text-base font-semibold'>{step.title}</h3>
                  <p className='text-muted-foreground mt-1 text-sm leading-relaxed'>
                    {step.desc}
                  </p>
                </div>
                <Link
                  to={step.action.to}
                  className='inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400'
                >
                  {step.action.label}
                  <ArrowRight className='size-3.5' aria-hidden />
                </Link>
              </div>
            </li>
          ))}
        </ol>

        <div className='bg-card border-border/60 mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-6'>
          <div className='min-w-0'>
            <p className='text-muted-foreground text-xs'>{t('API base URL')}</p>
            <div className='mt-1 flex items-center gap-2'>
              <code className='truncate font-mono text-base font-semibold'>
                {apiBaseUrl}
              </code>
              <CopyButton
                value={apiBaseUrl}
                size='sm'
                className='size-7'
                aria-label={t('Copy API base URL')}
              />
            </div>
            <p className='text-muted-foreground mt-1 text-xs'>
              {t(
                'Send requests with the header Authorization: Bearer <your API key>.'
              )}
            </p>
          </div>
          <Button
            variant='outline'
            className='rounded-xl'
            render={
              docsLink ? (
                <a href={docsLink} target='_blank' rel='noopener noreferrer' />
              ) : (
                <Link to='/docs' />
              )
            }
          >
            {t('Read the docs')}
          </Button>
        </div>
      </div>
    </section>
  )
}
