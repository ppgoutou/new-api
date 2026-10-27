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
import { ArrowUpRight, MessageCircle, Send } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import {
  getSupportQqChatUrl,
  SUPPORT_QQ,
  SUPPORT_TELEGRAM,
} from '@/features/home/lib/video-home'
import { cn } from '@/lib/utils'

export function LandingContacts() {
  const { t } = useTranslation()

  const contacts = [
    {
      key: 'telegram',
      label: t('International · Telegram'),
      value: `@${SUPPORT_TELEGRAM}`,
      href: `https://t.me/${SUPPORT_TELEGRAM}`,
      external: true,
      icon: Send,
      tone: 'border-blue-400/35 hover:border-blue-400/70',
      iconTone: 'bg-blue-600/20 text-blue-400',
    },
    {
      key: 'qq',
      label: t('Mainland China · QQ'),
      value: SUPPORT_QQ,
      href: getSupportQqChatUrl(navigator.userAgent),
      external: false,
      icon: MessageCircle,
      tone: 'border-violet-400/35 hover:border-violet-400/70',
      iconTone: 'bg-violet-600/20 text-violet-400',
    },
  ]

  return (
    <div id='contact' className='flex flex-col gap-3'>
      <h2 className='text-2xl font-bold text-white'>{t('Contact us')}</h2>
      <p className='text-sm leading-relaxed text-slate-400'>
        {t(
          'Questions about pricing, volume, top-ups or integration? Reach us directly.'
        )}
      </p>
      <ul className='mt-1 flex flex-col gap-3'>
        {contacts.map((contact) => (
          <li key={contact.key}>
            <a
              href={contact.href}
              {...(contact.external
                ? { target: '_blank', rel: 'noopener noreferrer' }
                : {})}
              className={cn(
                'group flex items-center gap-3 rounded-xl border bg-slate-900/60 px-4 py-3.5 backdrop-blur-sm transition-colors',
                contact.tone
              )}
            >
              <span
                className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-lg',
                  contact.iconTone
                )}
              >
                <contact.icon className='size-5' aria-hidden />
              </span>
              <span className='min-w-0 flex-1'>
                <span className='block text-xs text-slate-500'>
                  {contact.label}
                </span>
                <span className='block truncate font-mono text-sm text-white'>
                  {contact.value}
                </span>
              </span>
              <ArrowUpRight
                className='size-4 text-slate-500 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-white'
                aria-hidden
              />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
