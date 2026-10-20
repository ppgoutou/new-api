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
import { ExternalLink, Gift, History, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { TitledCard } from '@/components/ui/titled-card'
import { cn } from '@/lib/utils'

import { REDEMPTION_ORDERS_URL } from '../constants'

interface RedemptionCardProps {
  /** Where codes are sold (the admin's top-up link); hides the buy panel when empty. */
  topupLink?: string
  /** False until the administrator confirms the payment compliance terms. */
  redemptionEnabled: boolean
  redemptionCode: string
  onRedemptionCodeChange: (code: string) => void
  onRedeem: () => void
  redeeming: boolean
  loading?: boolean
}

export function RedemptionCard(props: RedemptionCardProps) {
  const { t } = useTranslation()
  const purchaseSteps = [
    {
      title: t('Place an order in the shop'),
      detail: t('Pay with WeChat Pay or Alipay'),
    },
    {
      title: t('Receive the code automatically'),
      detail: t('Shown on the order page'),
    },
    {
      title: t('Come back and redeem'),
      detail: t('Credit is added right away'),
    },
  ]

  return (
    <TitledCard
      title={t('Redemption Code Top-up')}
      description={t('Buy with WeChat Pay or Alipay, delivered automatically')}
      icon={<Gift className='h-4 w-4' />}
      iconClassName='rounded-full bg-blue-600 text-white'
      disableHoverEffect
      className='h-full'
      action={
        <a
          href={REDEMPTION_ORDERS_URL}
          target='_blank'
          rel='noopener noreferrer'
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            'w-full gap-2 sm:w-auto'
          )}
        >
          <History className='h-4 w-4' aria-hidden='true' />
          {t('Redemption Records')}
        </a>
      }
      contentClassName='flex flex-1 flex-col gap-4'
    >
      {props.loading ? (
        <div className='space-y-4'>
          <Skeleton className='h-48 w-full rounded-lg' />
          <Skeleton className='h-28 w-full rounded-lg' />
        </div>
      ) : (
        <>
          {props.topupLink && (
            <div className='flex flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-blue-100 bg-blue-50 px-4 py-6 text-center sm:px-6 dark:border-blue-900/60 dark:bg-blue-950/30'>
              <ol className='grid w-full grid-cols-3 gap-2 sm:gap-4'>
                {purchaseSteps.map((step, index) => (
                  <li
                    key={step.title}
                    className='flex flex-col items-center gap-1'
                  >
                    <span className='bg-background mb-1 flex size-7 items-center justify-center rounded-full border border-blue-200 text-xs font-semibold text-blue-600 dark:border-blue-800 dark:text-blue-400'>
                      {index + 1}
                    </span>
                    <span className='text-xs leading-snug font-semibold sm:text-sm'>
                      {step.title}
                    </span>
                    <span className='text-muted-foreground text-xs leading-snug'>
                      {step.detail}
                    </span>
                  </li>
                ))}
              </ol>
              <a
                href={props.topupLink}
                target='_blank'
                rel='noopener noreferrer'
                className={cn(
                  buttonVariants(),
                  'h-11 gap-2 bg-blue-600 px-6 text-base text-white hover:bg-blue-700'
                )}
              >
                <Gift className='h-4 w-4' aria-hidden='true' />
                {t('Buy redemption code')}
                <ExternalLink className='h-3.5 w-3.5' aria-hidden='true' />
              </a>
              <p className='text-muted-foreground text-xs'>
                {t('Credit never expires after redeeming')}
              </p>
            </div>
          )}

          {props.redemptionEnabled ? (
            <div className='space-y-3 rounded-lg border p-4'>
              <Label
                htmlFor='redemption-code'
                className='text-muted-foreground text-xs font-medium'
              >
                {t('Enter redemption code')}
              </Label>
              <div className='grid grid-cols-[minmax(0,1fr)_auto] gap-2'>
                <Input
                  id='redemption-code'
                  value={props.redemptionCode}
                  onChange={(e) => props.onRedemptionCodeChange(e.target.value)}
                  placeholder={t('Paste your redemption code')}
                  className='h-11 min-w-0'
                />
                <Button
                  onClick={props.onRedeem}
                  disabled={props.redeeming}
                  className='h-11 bg-blue-600 px-5 text-white hover:bg-blue-700'
                >
                  {props.redeeming && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  {t('Redeem')}
                </Button>
              </div>
              {props.topupLink && (
                <p className='text-muted-foreground text-xs'>
                  {t('Need a redemption code?')}{' '}
                  <a
                    href={props.topupLink}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='text-blue-600 underline underline-offset-4 dark:text-blue-400'
                  >
                    {t('Buy redemption code')}
                  </a>
                </p>
              )}
            </div>
          ) : (
            <Alert>
              <AlertDescription>
                {t(
                  'Redemption codes are disabled until the administrator confirms compliance terms.'
                )}
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </TitledCard>
  )
}
