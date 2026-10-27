import type { Database, Currency, PaymentMethod, StudentStatus } from '../types'
import { CURRENCIES } from './money'
import { PAYMENT_METHODS } from './options'

export const STORAGE_KEY = 'sukuu.db.v1'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0
}

function hasUniqueIds(items: { id: string }[]): boolean {
  return new Set(items.map((item) => item.id)).size === items.length
}

export function validateDatabase(value: unknown): { ok: true; db: Database } | { ok: false; error: string } {
  if (!isRecord(value)) return { ok: false, error: 'The backup is not a Sukuu database.' }
  if (value.version !== 1) return { ok: false, error: 'This backup uses an unsupported version.' }
  if (!isRecord(value.settings)) return { ok: false, error: 'The backup has no school settings.' }

  const settings = value.settings
  if (!isString(settings.schoolName) || !settings.schoolName.trim()) {
    return { ok: false, error: 'The backup has no school name.' }
  }
  const currencies = CURRENCIES.map((item) => item.code) as string[]
  if (!isString(settings.currency) || !currencies.includes(settings.currency)) {
    return { ok: false, error: 'The backup uses an unknown currency.' }
  }
  if (!isNonNegativeInteger(settings.receiptCounter)) {
    return { ok: false, error: 'The backup has an invalid receipt counter.' }
  }

  for (const key of ['terms', 'classes', 'students', 'billings', 'payments'] as const) {
    if (!Array.isArray(value[key])) {
      return { ok: false, error: `The backup is missing ${key}.` }
    }
  }
  const terms = value.terms as Record<string, unknown>[]
  const classes = value.classes as Record<string, unknown>[]
  const students = value.students as Record<string, unknown>[]
  const billings = value.billings as Record<string, unknown>[]
  const payments = value.payments as Record<string, unknown>[]

  if (!terms.every((term) => isString(term.id) && isString(term.label) && isString(term.academicYear) && isString(term.startDate) && isString(term.dueDate) && isString(term.createdAt))) {
    return { ok: false, error: 'A term in the backup is incomplete.' }
  }
  if (!classes.every((room) => isString(room.id) && isString(room.name) && isNonNegativeInteger(room.feeMinor) && isString(room.createdAt))) {
    return { ok: false, error: 'A class in the backup is incomplete.' }
  }
  if (!students.every((student) => isString(student.id) && isString(student.name) && isString(student.studentNumber) && isString(student.classId) && isString(student.guardianName) && isString(student.guardianPhone) && isString(student.note) && isString(student.createdAt) && (student.status === 'active' || student.status === 'left'))) {
    return { ok: false, error: 'A student in the backup is incomplete.' }
  }
  if (!billings.every((billing) => isString(billing.id) && isString(billing.termId) && isString(billing.studentId) && isString(billing.classId) && isNonNegativeInteger(billing.feeMinor) && isNonNegativeInteger(billing.discountMinor) && billing.discountMinor <= billing.feeMinor && isString(billing.createdAt))) {
    return { ok: false, error: 'A fee record in the backup is incomplete.' }
  }
  const methods = PAYMENT_METHODS.map((item) => item.code) as string[]
  if (!payments.every((payment) => isString(payment.id) && isString(payment.termId) && isString(payment.studentId) && isNonNegativeInteger(payment.amountMinor) && payment.amountMinor > 0 && isString(payment.method) && methods.includes(payment.method) && isString(payment.reference) && isString(payment.note) && isString(payment.date) && isString(payment.receiptNumber) && isString(payment.createdAt))) {
    return { ok: false, error: 'A payment in the backup is incomplete.' }
  }

  if (!hasUniqueIds(terms as { id: string }[]) || !hasUniqueIds(classes as { id: string }[]) || !hasUniqueIds(students as { id: string }[]) || !hasUniqueIds(billings as { id: string }[]) || !hasUniqueIds(payments as { id: string }[])) {
    return { ok: false, error: 'The backup contains duplicate IDs.' }
  }
  if (!terms.some((term) => term.id === settings.currentTermId)) {
    return { ok: false, error: 'The current term is missing from the backup.' }
  }

  const termIds = new Set(terms.map((term) => term.id))
  const classIds = new Set(classes.map((room) => room.id))
  const studentIds = new Set(students.map((student) => student.id))
  if (!students.every((student) => classIds.has(student.classId as string))) {
    return { ok: false, error: 'A student references a missing class.' }
  }
  if (!billings.every((billing) => termIds.has(billing.termId as string) && studentIds.has(billing.studentId as string) && classIds.has(billing.classId as string))) {
    return { ok: false, error: 'A fee record references missing data.' }
  }
  if (!payments.every((payment) => termIds.has(payment.termId as string) && studentIds.has(payment.studentId as string))) {
    return { ok: false, error: 'A payment references missing data.' }
  }
  const billingKeys = new Set(billings.map((billing) => `${billing.termId}:${billing.studentId}`))
  if (billingKeys.size !== billings.length) {
    return { ok: false, error: 'A student has two fee records in the same term.' }
  }

  const db: Database = {
    version: 1,
    settings: {
      schoolName: settings.schoolName as string,
      ownerName: settings.ownerName as string,
      currency: settings.currency as Currency,
      currentTermId: settings.currentTermId as string,
      receiptCounter: settings.receiptCounter as number,
      isDemo: Boolean(settings.isDemo),
    },
    terms: terms.map((term) => ({
      id: term.id as string,
      label: term.label as string,
      academicYear: term.academicYear as string,
      startDate: term.startDate as string,
      dueDate: term.dueDate as string,
      createdAt: term.createdAt as string,
    })),
    classes: classes.map((room) => ({
      id: room.id as string,
      name: room.name as string,
      feeMinor: room.feeMinor as number,
      createdAt: room.createdAt as string,
    })),
    students: students.map((student) => ({
      id: student.id as string,
      name: student.name as string,
      studentNumber: student.studentNumber as string,
      classId: student.classId as string,
      guardianName: student.guardianName as string,
      guardianPhone: student.guardianPhone as string,
      note: student.note as string,
      status: student.status as StudentStatus,
      createdAt: student.createdAt as string,
    })),
    billings: billings.map((billing) => ({
      id: billing.id as string,
      termId: billing.termId as string,
      studentId: billing.studentId as string,
      classId: billing.classId as string,
      feeMinor: billing.feeMinor as number,
      discountMinor: billing.discountMinor as number,
      createdAt: billing.createdAt as string,
    })),
    payments: payments.map((payment) => ({
      id: payment.id as string,
      termId: payment.termId as string,
      studentId: payment.studentId as string,
      amountMinor: payment.amountMinor as number,
      method: payment.method as PaymentMethod,
      reference: payment.reference as string,
      note: payment.note as string,
      date: payment.date as string,
      receiptNumber: payment.receiptNumber as string,
      createdAt: payment.createdAt as string,
    })),
  }
  return { ok: true, db }
}

export function loadDb(): { db: Database | null; error: string | null } {
  let raw: string | null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return { db: null, error: 'This browser is blocking local storage.' }
  }
  if (!raw) return { db: null, error: null }

  try {
    const parsed = JSON.parse(raw)
    const result = validateDatabase(parsed)
    if (!result.ok) return { db: null, error: result.error }
    return { db: result.db, error: null }
  } catch {
    return { db: null, error: 'The saved school file is unreadable. Import a backup or start again.' }
  }
}

export function saveDb(db: Database): string | null {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
    return null
  } catch {
    return 'Sukuu could not save to this browser. Export a backup now.'
  }
}

export function parseBackup(text: string): { db: Database | null; error: string | null } {
  try {
    const result = validateDatabase(JSON.parse(text))
    if (result.ok) return { db: result.db, error: null }
    return { db: null, error: result.error }
  } catch {
    return { db: null, error: 'That file is not valid JSON.' }
  }
}
