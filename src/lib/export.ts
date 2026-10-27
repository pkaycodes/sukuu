import type { Database } from '../types'
import { accountFor, currentTerm } from './calc'
import { formatDate } from './dates'
import { formatMoney } from './money'
import { PAYMENT_LABELS } from './options'

function safeCell(value: string | number): string {
  const text = String(value)
  if (/^[=+\-@]/.test(text)) return `'${text}`
  if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function downloadText(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function exportBackup(db: Database) {
  const date = new Date().toISOString().slice(0, 10)
  downloadText(
    `sukuu-backup-${date}.json`,
    JSON.stringify(db, null, 2),
    'application/json',
  )
}

export function exportStudentsCsv(db: Database) {
  const term = currentTerm(db)
  const header = [
    'Student',
    'Student number',
    'Class',
    'Guardian',
    'Guardian phone',
    'Fee',
    'Discount',
    'Paid',
    'Balance',
  ]
  const rows = db.students
    .map((student) => accountFor(db, student.id, term.id))
    .filter((account) => account !== null)
    .map((account) =>
      [
        account.student.name,
        account.student.studentNumber,
        account.classRoom?.name ?? '',
        account.student.guardianName,
        account.student.guardianPhone,
        formatMoney(account.chargeMinor, db.settings.currency),
        formatMoney(account.discountMinor, db.settings.currency),
        formatMoney(account.paidMinor, db.settings.currency),
        formatMoney(account.balanceMinor, db.settings.currency),
      ]
        .map(safeCell)
        .join(','),
    )
  const date = new Date().toISOString().slice(0, 10)
  downloadText(
    `sukuu-${term.label.toLowerCase().replace(/\s+/g, '-')}-${date}.csv`,
    [header.join(','), ...rows].join('\n'),
    'text/csv;charset=utf-8',
  )
}

export function exportPaymentsCsv(db: Database) {
  const term = currentTerm(db)
  const header = ['Receipt', 'Date', 'Student', 'Amount', 'Method', 'Reference', 'Note']
  const rows = db.payments
    .filter((payment) => payment.termId === term.id)
    .map((payment) => {
      const student = db.students.find((item) => item.id === payment.studentId)
      return [
        payment.receiptNumber,
        formatDate(payment.date),
        student?.name ?? '',
        formatMoney(payment.amountMinor, db.settings.currency),
        PAYMENT_LABELS[payment.method],
        payment.reference,
        payment.note,
      ]
        .map(safeCell)
        .join(',')
    })
  const date = new Date().toISOString().slice(0, 10)
  downloadText(
    `sukuu-payments-${term.label.toLowerCase().replace(/\s+/g, '-')}-${date}.csv`,
    [header.join(','), ...rows].join('\n'),
    'text/csv;charset=utf-8',
  )
}
