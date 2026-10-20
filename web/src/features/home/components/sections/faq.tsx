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

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

import { useSeedancePricing } from '../../hooks/use-seedance-pricing'
import { SUPPORT_EMAIL } from '../../lib/video-home'

export function Faq() {
  const { t } = useTranslation()
  const { bestDiscount } = useSeedancePricing()

  const items = [
    {
      id: 'billing',
      question: t('How is it billed?'),
      answer: (
        <p>
          {t(
            'By the seconds and resolution of the generated video, deducted from your balance on each call. Tasks with a reference video are billed by tokens.'
          )}
          {bestDiscount && (
            <> {t('{{percentOff}}% off official prices', bestDiscount)}</>
          )}
        </p>
      ),
    },
    {
      id: 'specs',
      question: t('Which resolutions and durations are supported?'),
      answer: (
        <p>
          {t(
            'seedance-2.0 supports 480p to 4K and 4–15 seconds per clip; seedance-2.5 supports 480p to 1080p and 4–30 seconds per clip.'
          )}
        </p>
      ),
    },
    {
      id: 'topup',
      question: t('How do I top up?'),
      answer: (
        <p>
          {t(
            'After signing in, top up by bank card on the Wallet page. Payments are processed securely by Stripe and credited immediately.'
          )}
        </p>
      ),
    },
    {
      id: 'help',
      question: t('How do I get help?'),
      answer: (
        <p>
          {t('Email us at')}{' '}
          <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
        </p>
      ),
    },
  ]

  return (
    <section className='relative z-10 px-6 py-20 md:py-28'>
      <div className='mx-auto max-w-3xl'>
        <h2 className='mb-8 text-center text-3xl font-bold tracking-tight md:text-4xl'>
          {t('FAQ')}
        </h2>
        <Accordion
          defaultValue={['billing']}
          className='bg-card border-border/60 rounded-2xl border px-5'
        >
          {items.map((item) => (
            <AccordionItem key={item.id} value={item.id}>
              <AccordionTrigger className='py-4 text-base'>
                {item.question}
              </AccordionTrigger>
              <AccordionContent className='text-muted-foreground pb-4 text-[15px] leading-relaxed'>
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
