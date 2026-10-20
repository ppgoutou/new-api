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
import { ExternalLink, Gift, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { TitledCard } from '@/components/ui/titled-card'
import { cn } from '@/lib/utils'

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
    t('Place an order in the shop'),
    t('Receive your code right after payment'),
    t('Enter the code below to add credit'),
  ]

  return (
    <TitledCard
      title={t('Redemption Code Top-up')}
      description={t('Buy a redemption code, then redeem it here')}
      icon={<Gift className='h-4 w-4' />}
      iconTone='primary'
      disableHoverEffect
      className='h-full'
      contentClassName='space-y-4 sm:space-y-5'
    >
      {props.loading ? (
        <div className='space-y-4'>
          <Skeleton className='h-40 w-full rounded-lg' />
          <Skeleton className='h-10 w-full' />
        </div>
      ) : (
        <>
          {props.topupLink && (
            <div className='bg-primary/5 border-primary/15 flex flex-col items-center gap-4 rounded-lg border px-4 py-5 text-center sm:px-6'>
              <ol className='grid w-full grid-cols-3 gap-2 sm:gap-4'>
                {purchaseSteps.map((step, index) => (
                  <li key={step} className='flex flex-col items-center gap-1.5'>
                    <span className='border-primary/30 bg-background text-primary flex size-7 items-center justify-center rounded-full border text-xs font-semibold'>
                      {index + 1}
                    </span>
                    <span className='text-xs leading-snug font-medium sm:text-sm'>
                      {step}
                    </span>
                  </li>
                ))}
              </ol>
              <a
                href={props.topupLink}
                target='_blank'
                rel='noopener noreferrer'
                className={cn(buttonVariants(), 'h-10 gap-2 px-5')}
              >
                <Gift className='h-4 w-4' aria-hidden='true' />
                {t('Buy redemption code')}
                <ExternalLink className='h-3.5 w-3.5' aria-hidden='true' />
              </a>
            </div>
          )}

          {props.redemptionEnabled ? (
            <div className='space-y-2.5 sm:space-y-3'>
              <Label
                htmlFor='redemption-code'
                className='text-muted-foreground text-xs font-medium tracking-wider uppercase'
              >
                {t('Have a Code?')}
              </Label>
              <div className='grid grid-cols-[minmax(0,1fr)_auto] gap-2'>
                <Input
                  id='redemption-code'
                  value={props.redemptionCode}
                  onChange={(e) => props.onRedemptionCodeChange(e.target.value)}
                  placeholder={t('Enter your redemption code')}
                  className='h-10 min-w-0'
                />
                <Button
                  onClick={props.onRedeem}
                  disabled={props.redeeming}
                  className='h-10 px-4'
                >
                  {props.redeeming && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  {t('Redeem')}
                </Button>
              </div>
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
