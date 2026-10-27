import { describe, expect, it } from 'vitest'
import { accountFor, balanceAfterPayment, currentTerm, nextReceiptNumber, termHistory, termSummary } from './calc'
import { createSampleDb } from './sample'

describe('fee calculations', () => {
  it('turns the sample school into a balanced term summary', () => {
    const db = createSampleDb()
    const term = currentTerm(db)
    const summary = termSummary(db, term.id)
    expect(summary.students).toBe(12)
    expect(summary.billedMinor).toBeGreaterThan(0)
    expect(summary.paidMinor).toBeGreaterThan(0)
    expect(summary.billedMinor - summary.paidMinor).toBe(summary.outstandingMinor)
    expect(summary.rate).toBeGreaterThan(0)
    expect(summary.rate).toBeLessThanOrEqual(100)
    expect(summary.classes).toHaveLength(3)
  })

  it('calculates a student account after a part payment', () => {
    const db = createSampleDb()
    const term = currentTerm(db)
    const account = accountFor(db, 'stu_ama', term.id)
    expect(account).not.toBeNull()
    expect(account?.classRoom?.name).toBe('Primary 3')
    expect(account?.billedMinor).toBe(45000)
    expect(account?.discountMinor).toBe(0)
    expect(account?.chargeMinor).toBe(45000)
    expect(account?.paidMinor).toBe(30000)
    expect(account?.balanceMinor).toBe(15000)
    expect(account?.payments).toHaveLength(1)
  })

  it('applies scholarships to the net charge', () => {
    const db = createSampleDb()
    const term = currentTerm(db)
    const account = accountFor(db, 'stu_kwame', term.id)
    expect(account?.billedMinor).toBe(45000)
    expect(account?.discountMinor).toBe(5000)
    expect(account?.chargeMinor).toBe(40000)
    expect(account?.balanceMinor).toBe(0)
  })

  it('exposes the student fee history across terms', () => {
    const db = createSampleDb()
    expect(termHistory(db, 'stu_ama')).toHaveLength(1)
    expect(termHistory(db, 'missing_student')).toHaveLength(0)
  })

  it('generates the next receipt number from the stored counter', () => {
    const db = createSampleDb()
    expect(nextReceiptNumber(db, '2026-11-01')).toBe('RCPT-2026-1011')
  })

  it('reports the balance at the moment a receipt was issued', () => {
    const db = createSampleDb()
    const term = currentTerm(db)
    const account = accountFor(db, 'stu_ama', term.id)
    const receipt = account?.payments[0]
    expect(receipt).toBeDefined()
    expect(balanceAfterPayment(db, receipt!)).toBe(15000)
  })
})
