import type { Currency, PaymentMethod } from '../types'

export const PAYMENT_METHODS: { code: PaymentMethod; label: string }[] = [
  { code: 'cash', label: 'Cash' },
  { code: 'momo', label: 'Mobile money' },
  { code: 'bank', label: 'Bank transfer' },
  { code: 'cheque', label: 'Cheque' },
  { code: 'other', label: 'Other' },
]

export const PAYMENT_LABELS: Record<PaymentMethod, string> = Object.fromEntries(
  PAYMENT_METHODS.map((method) => [method.code, method.label]),
) as Record<PaymentMethod, string>

export const CURRENCY_LABELS: Record<Currency, string> = {
  GHS: 'GHS · Ghana cedi',
  NGN: 'NGN · Nigerian naira',
  KES: 'KES · Kenyan shilling',
  USD: 'USD · US dollar',
  GBP: 'GBP · Pound sterling',
}
