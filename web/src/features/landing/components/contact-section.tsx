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
import { MessageCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { SupportContacts } from '@/features/home/components/support-contacts'

export function ContactSection() {
  const { t } = useTranslation()

  return (
    <section
      id='contact'
      className='relative z-10 scroll-mt-20 px-6 py-20 md:py-28'
    >
      <div className='bg-card border-border/60 mx-auto flex max-w-4xl flex-wrap items-center gap-8 rounded-3xl border p-8 md:p-10'>
        <div className='min-w-0 flex-[1_1_18rem]'>
          <span className='mb-4 flex size-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400'>
            <MessageCircle className='size-5' strokeWidth={1.75} aria-hidden />
          </span>
          <h2 className='text-2xl font-bold tracking-tight md:text-3xl'>
            {t('Contact us')}
          </h2>
          <p className='text-muted-foreground mt-2 text-sm leading-relaxed'>
            {t(
              'Questions about pricing, bulk usage, top-ups or integration? Message us and we will help you get started.'
            )}
          </p>
        </div>
        <div className='text-muted-foreground min-w-0 flex-[1_1_18rem] text-[15px]'>
          <SupportContacts />
        </div>
      </div>
    </section>
  )
}
