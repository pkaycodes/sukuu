import { describe, expect, it } from 'vitest'
import { formatMoney, moneyInputValue, parseMoneyInput } from './money'

describe('money helpers', () => {
  it('formats minor units in the school currency', () => {
    expect(formatMoney(45000, 'GHS')).toBe('GH₵450.00')
    expect(formatMoney(0, 'USD')).toBe('$0.00')
    expect(formatMoney(123456, 'GBP')).toBe('£1,234.56')
  })

  it('parses human-entered amounts into minor units', () => {
    expect(parseMoneyInput('450')).toBe(45000)
    expect(parseMoneyInput('450.50')).toBe(45050)
    expect(parseMoneyInput('1,250.25')).toBe(125025)
    expect(parseMoneyInput(' 0.01 ')).toBe(1)
  })

  it('rejects invalid money input', () => {
    expect(parseMoneyInput('')).toBeNull()
    expect(parseMoneyInput('abc')).toBeNull()
    expect(parseMoneyInput('-10')).toBeNull()
    expect(parseMoneyInput('10.999')).toBeNull()
    expect(parseMoneyInput('1.2.3')).toBeNull()
  })

  it('turns minor units back into an input value', () => {
    expect(moneyInputValue(45000)).toBe('450.00')
    expect(moneyInputValue(1)).toBe('0.01')
  })
})
