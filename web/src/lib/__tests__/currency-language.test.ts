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
import i18next from 'i18next'
import { afterEach, describe, expect, it } from 'vitest'

import {
  formatBillingCurrencyFromUSD,
  formatCurrencyFromUSD,
  formatLocalCurrencyAmount,
  getCurrencyLabel,
} from '@/lib/currency'
import {
  DEFAULT_CURRENCY_CONFIG,
  useSystemConfigStore,
  type CurrencyDisplayType,
} from '@/stores/system-config-store'

function setSiteCurrency(quotaDisplayType: CurrencyDisplayType) {
  useSystemConfigStore.getState().setConfig({
    currency: {
      ...DEFAULT_CURRENCY_CONFIG,
      quotaDisplayType,
      usdExchangeRate: 6.66,
    },
  })
}

afterEach(async () => {
  await i18next.changeLanguage('en')
  useSystemConfigStore
    .getState()
    .setConfig({ currency: { ...DEFAULT_CURRENCY_CONFIG } })
})

describe('display currency by interface language', () => {
  it.each(['zhCN', 'zhTW'])(
    'shows a USD site in CNY for the %s interface',
    async (language) => {
      setSiteCurrency('USD')
      await i18next.changeLanguage(language)

      expect(formatCurrencyFromUSD(10)).toBe('¥66.6')
      expect(formatBillingCurrencyFromUSD(1)).toBe('¥6.66')
      expect(getCurrencyLabel()).toBe('CNY')
    }
  )

  it.each(['en', 'fr', 'ru', 'ja', 'vi', 'xx'])(
    'keeps a USD site in USD for the %s interface',
    async (language) => {
      setSiteCurrency('USD')
      await i18next.changeLanguage(language)

      expect(formatCurrencyFromUSD(10)).toBe('$10')
      expect(getCurrencyLabel()).toBe('USD')
    }
  )

  it('follows a language switch on a USD site', async () => {
    setSiteCurrency('USD')
    await i18next.changeLanguage('zhCN')
    expect(formatCurrencyFromUSD(10)).toBe('¥66.6')

    await i18next.changeLanguage('en')
    expect(formatCurrencyFromUSD(10)).toBe('$10')
  })

  it('keeps a CNY site in CNY for an English interface', async () => {
    setSiteCurrency('CNY')
    await i18next.changeLanguage('en')

    expect(formatCurrencyFromUSD(10)).toBe('¥66.6')
  })

  it('keeps payment amounts in the site currency for a Chinese interface', async () => {
    setSiteCurrency('USD')
    await i18next.changeLanguage('zhCN')

    expect(formatLocalCurrencyAmount(10)).toBe('$10')
  })
})
