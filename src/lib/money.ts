import type { Currency } from '../types'

export const CURRENCIES: { code: Currency; label: string }[] = [
  { code: 'GHS', label: 'Ghana cedi' },
  { code: 'NGN', label: 'Nigerian naira' },
  { code: 'KES', label: 'Kenyan shilling' },
  { code: 'USD', label: 'US dollar' },
  { code: 'GBP', label: 'Pound sterling' },
]

const LOCALE: Record<Currency, string> = {
  GHS: 'en-GH',
  NGN: 'en-NG',
  KES: 'en-KE',
  USD: 'en-US',
  GBP: 'en-GB',
}

export function formatMoney(minor: number, currency: Currency): string {
  return new Intl.NumberFormat(LOCALE[currency], {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(minor / 100)
}

export function formatMoneyShort(minor: number, currency: Currency): string {
  if (Math.abs(minor) >= 1_000_000) {
    return `${formatMoney(Math.round(minor / 100_000) * 1000, currency)}k`
  }
  return formatMoney(minor, currency)
}

/** Parse a user-entered amount into integer minor units. */
export function parseMoneyInput(value: string): number | null {
  const cleaned = value.replace(/,/g, '').replace(/\s/g, '').trim()
  if (!cleaned) return null
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null
  const amount = Number(cleaned)
  if (!Number.isFinite(amount)) return null
  return Math.round(amount * 100)
}

export function moneyInputValue(minor: number): string {
  return (minor / 100).toFixed(2)
}

export function currencySymbol(currency: Currency): string {
  return new Intl.NumberFormat(LOCALE[currency], {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
  })
    .formatToParts(0)
    .find((part) => part.type === 'currency')?.value ?? currency
}
