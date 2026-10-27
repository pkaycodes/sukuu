import type {
  ClassSummary,
  Database,
  Payment,
  StudentAccount,
  Term,
  TermSummary,
} from '../types'
import { isOverdue } from './dates'

export function currentTerm(db: Database): Term {
  return (
    db.terms.find((term) => term.id === db.settings.currentTermId) ??
    db.terms[db.terms.length - 1]
  )
}

export function billingFor(db: Database, termId: string, studentId: string) {
  return db.billings.find(
    (billing) => billing.termId === termId && billing.studentId === studentId,
  )
}

export function paymentsFor(db: Database, termId: string, studentId: string): Payment[] {
  return db.payments
    .filter((payment) => payment.termId === termId && payment.studentId === studentId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
}

export function accountFor(
  db: Database,
  studentId: string,
  termId: string,
): StudentAccount | null {
  const student = db.students.find((item) => item.id === studentId)
  if (!student) return null
  const billing = billingFor(db, termId, studentId) ?? null
  const classRoom =
    db.classes.find((item) => item.id === (billing?.classId ?? student.classId)) ?? null
  const payments = paymentsFor(db, termId, studentId)
  const discountMinor = billing?.discountMinor ?? 0
  const billedMinor = billing?.feeMinor ?? 0
  const chargeMinor = Math.max(0, billedMinor - discountMinor)
  const paidMinor = payments.reduce((sum, payment) => sum + payment.amountMinor, 0)
  return {
    student,
    classRoom,
    billing,
    billedMinor,
    discountMinor,
    chargeMinor,
    paidMinor,
    balanceMinor: Math.max(0, chargeMinor - paidMinor),
    payments,
  }
}

export function accountsFor(db: Database, termId: string): StudentAccount[] {
  return db.students
    .filter((student) => billingFor(db, termId, student.id))
    .map((student) => accountFor(db, student.id, termId))
    .filter((account): account is StudentAccount => account !== null)
    .sort((a, b) => a.student.name.localeCompare(b.student.name))
}

export function classSummaries(db: Database, termId: string): ClassSummary[] {
  const accounts = accountsFor(db, termId)
  return db.classes
    .map((classRoom) => {
      const matching = accounts.filter(
        (account) => (account.billing?.classId ?? account.student.classId) === classRoom.id,
      )
      const billedMinor = matching.reduce((sum, account) => sum + account.chargeMinor, 0)
      const paidMinor = matching.reduce((sum, account) => sum + account.paidMinor, 0)
      return {
        classRoom,
        students: matching.length,
        billedMinor,
        paidMinor,
        outstandingMinor: Math.max(0, billedMinor - paidMinor),
      }
    })
    .sort((a, b) => a.classRoom.name.localeCompare(b.classRoom.name))
}

export function termSummary(db: Database, termId: string): TermSummary {
  const accounts = accountsFor(db, termId)
  const billedMinor = accounts.reduce((sum, account) => sum + account.chargeMinor, 0)
  const paidMinor = accounts.reduce((sum, account) => sum + account.paidMinor, 0)
  const outstandingMinor = Math.max(0, billedMinor - paidMinor)
  const term = db.terms.find((item) => item.id === termId)
  return {
    billedMinor,
    paidMinor,
    outstandingMinor,
    rate: billedMinor > 0 ? Math.round((paidMinor / billedMinor) * 100) : 0,
    students: accounts.length,
    paidInFull: accounts.filter((account) => account.chargeMinor > 0 && account.balanceMinor === 0).length,
    overdue:
      term && isOverdue(term.dueDate)
        ? accounts.filter((account) => account.balanceMinor > 0).length
        : 0,
    classes: classSummaries(db, termId),
  }
}

export function outstandingAccounts(db: Database, termId: string): StudentAccount[] {
  return accountsFor(db, termId)
    .filter((account) => account.balanceMinor > 0)
    .sort((a, b) => b.balanceMinor - a.balanceMinor || a.student.name.localeCompare(b.student.name))
}

export function recentPayments(db: Database, termId: string, limit = 6): Payment[] {
  return db.payments
    .filter((payment) => payment.termId === termId)
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

export function allRecentPayments(db: Database, limit = 40): Payment[] {
  return [...db.payments]
    .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
    .slice(0, limit)
}

export function studentName(db: Database, studentId: string): string {
  return db.students.find((student) => student.id === studentId)?.name ?? 'Unknown student'
}

export function paymentFor(db: Database, paymentId: string): Payment | null {
  return db.payments.find((payment) => payment.id === paymentId) ?? null
}

export function balanceAfterPayment(db: Database, payment: Payment): number {
  const account = accountFor(db, payment.studentId, payment.termId)
  if (!account) return 0
  const ordered = [...account.payments].sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  )
  let paid = 0
  for (const item of ordered) {
    paid += item.amountMinor
    if (item.id === payment.id) {
      return Math.max(0, account.chargeMinor - paid)
    }
  }
  return account.balanceMinor
}

export function nextReceiptNumber(db: Database, date: string): string {
  const year = date.slice(0, 4)
  return `RCPT-${year}-${String(db.settings.receiptCounter + 1).padStart(4, '0')}`
}

export function termHistory(db: Database, studentId: string) {
  return db.terms
    .filter((term) => billingFor(db, term.id, studentId))
    .map((term) => ({
      term,
      account: accountFor(db, studentId, term.id),
    }))
    .filter((entry): entry is { term: Term; account: StudentAccount } => entry.account !== null)
    .sort((a, b) => b.term.startDate.localeCompare(a.term.startDate))
}
