import { useState } from 'react'
import type {
  Database,
  NewClassInput,
  NewPaymentInput,
  NewStudentInput,
  NewTermInput,
  Settings,
  Term,
} from '../types'
import { accountFor, currentTerm, nextReceiptNumber } from '../lib/calc'
import { makeId, todayISO } from '../lib/dates'
import { createSampleDb, createStarterDb } from '../lib/sample'
import { loadDb, saveDb, STORAGE_KEY } from '../lib/storage'

type Result<T = undefined> = { ok: true; value: T } | { ok: false; error: string }

const ok = <T,>(value: T): Result<T> => ({ ok: true, value })
const fail = (error: string): Result<never> => ({ ok: false, error })

export function useSchool() {
  const [initial] = useState(() => {
    const loaded = loadDb()
    if (
      !loaded.db &&
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('demo') === '1'
    ) {
      const demo = createSampleDb()
      return { db: demo, error: saveDb(demo) }
    }
    return loaded
  })
  const [db, setDb] = useState<Database | null>(initial.db)
  const [storageError, setStorageError] = useState<string | null>(initial.error)

  function persist(next: Database) {
    setStorageError(saveDb(next))
    setDb(next)
  }

  function setup(input: {
    schoolName: string
    ownerName: string
    currency: Settings['currency']
    termLabel: string
    academicYear: string
    startDate: string
    dueDate: string
  }) {
    if (!input.schoolName.trim()) return fail('Add the school name.')
    if (!input.ownerName.trim()) return fail('Add your name.')
    if (!input.termLabel.trim()) return fail('Name the first term.')
    if (!input.academicYear.trim()) return fail('Add the academic year.')
    if (!input.startDate || !input.dueDate) return fail('Choose the term dates.')
    if (input.dueDate < input.startDate) return fail('The due date must follow the start date.')
    persist(createStarterDb(input))
    return ok(undefined)
  }

  function loadSample() {
    persist(createSampleDb())
  }

  function addClass(input: NewClassInput): Result<string> {
    if (!db) return fail('Open a school first.')
    const name = input.name.trim()
    if (!name) return fail('Add a class name.')
    if (input.feeMinor <= 0) return fail('Add a term fee greater than zero.')
    if (db.classes.some((room) => room.name.toLowerCase() === name.toLowerCase())) {
      return fail('A class with that name already exists.')
    }
    const id = makeId('cls')
    const room = {
      id,
      name,
      feeMinor: input.feeMinor,
      createdAt: new Date().toISOString(),
    }
    persist({ ...db, classes: [...db.classes, room] })
    return ok(id)
  }

  function updateClass(id: string, input: NewClassInput): Result {
    if (!db) return fail('Open a school first.')
    const name = input.name.trim()
    if (!name) return fail('Add a class name.')
    if (input.feeMinor <= 0) return fail('Add a term fee greater than zero.')
    if (
      db.classes.some(
        (room) => room.id !== id && room.name.toLowerCase() === name.toLowerCase(),
      )
    ) {
      return fail('A class with that name already exists.')
    }
    persist({
      ...db,
      classes: db.classes.map((room) =>
        room.id === id ? { ...room, name, feeMinor: input.feeMinor } : room,
      ),
    })
    return ok(undefined)
  }

  function addStudent(input: NewStudentInput): Result<string> {
    if (!db) return fail('Open a school first.')
    const room = db.classes.find((item) => item.id === input.classId)
    if (!room) return fail('Choose a class first.')
    const name = input.name.trim()
    if (!name) return fail('Add the student name.')
    const number = input.studentNumber.trim()
    if (!number) return fail('Add a student number.')
    if (db.students.some((student) => student.studentNumber.toLowerCase() === number.toLowerCase())) {
      return fail('That student number is already in use.')
    }
    if (input.discountMinor < 0) return fail('The discount cannot be negative.')
    if (input.discountMinor >= room.feeMinor) return fail('The discount must be less than the fee.')
    const term = currentTerm(db)
    const now = new Date().toISOString()
    const id = makeId('stu')
    const student = {
      id,
      name,
      studentNumber: number,
      classId: room.id,
      guardianName: input.guardianName.trim(),
      guardianPhone: input.guardianPhone.trim(),
      note: input.note.trim(),
      status: 'active' as const,
      createdAt: now,
    }
    const billing = {
      id: makeId('bil'),
      termId: term.id,
      studentId: id,
      classId: room.id,
      feeMinor: room.feeMinor,
      discountMinor: input.discountMinor,
      createdAt: now,
    }
    persist({
      ...db,
      students: [...db.students, student],
      billings: [...db.billings, billing],
    })
    return ok(id)
  }

  function updateStudent(id: string, input: NewStudentInput): Result {
    if (!db) return fail('Open a school first.')
    const student = db.students.find((item) => item.id === id)
    if (!student) return fail('Student not found.')
    const room = db.classes.find((item) => item.id === input.classId)
    if (!room) return fail('Choose a class first.')
    const name = input.name.trim()
    if (!name) return fail('Add the student name.')
    const number = input.studentNumber.trim()
    if (!number) return fail('Add a student number.')
    if (
      db.students.some(
        (item) => item.id !== id && item.studentNumber.toLowerCase() === number.toLowerCase(),
      )
    ) {
      return fail('That student number is already in use.')
    }
    if (input.discountMinor < 0) return fail('The discount cannot be negative.')
    if (input.discountMinor >= room.feeMinor) return fail('The discount must be less than the fee.')
    const term = currentTerm(db)
    const account = accountFor(db, id, term.id)
    const nextCharge = room.feeMinor - input.discountMinor
    if (account && account.paidMinor > nextCharge) {
      return fail('This student has already paid more than the new fee. Record the change carefully.')
    }
    persist({
      ...db,
      students: db.students.map((item) =>
        item.id === id
          ? {
              ...item,
              name,
              studentNumber: number,
              classId: room.id,
              guardianName: input.guardianName.trim(),
              guardianPhone: input.guardianPhone.trim(),
              note: input.note.trim(),
            }
          : item,
      ),
      billings: db.billings.map((billing) =>
        billing.termId === term.id && billing.studentId === id
          ? { ...billing, classId: room.id, feeMinor: room.feeMinor, discountMinor: input.discountMinor }
          : billing,
      ),
    })
    return ok(undefined)
  }

  function setStudentStatus(id: string, status: 'active' | 'left') {
    if (!db) return
    persist({
      ...db,
      students: db.students.map((student) =>
        student.id === id ? { ...student, status } : student,
      ),
    })
  }

  function removeStudent(id: string) {
    if (!db) return
    persist({
      ...db,
      students: db.students.filter((student) => student.id !== id),
      billings: db.billings.filter((billing) => billing.studentId !== id),
      payments: db.payments.filter((payment) => payment.studentId !== id),
    })
  }

  function addTerm(input: NewTermInput): Result<string> {
    if (!db) return fail('Open a school first.')
    if (!input.label.trim()) return fail('Name the term.')
    if (!input.academicYear.trim()) return fail('Add the academic year.')
    if (!input.startDate || !input.dueDate) return fail('Choose the term dates.')
    if (input.dueDate < input.startDate) return fail('The due date must follow the start date.')
    const now = new Date().toISOString()
    const id = makeId('term')
    const term: Term = {
      id,
      label: input.label.trim(),
      academicYear: input.academicYear.trim(),
      startDate: input.startDate,
      dueDate: input.dueDate,
      createdAt: now,
    }
    const billings = input.copyStudents
      ? db.students
          .filter((student) => student.status === 'active')
          .map((student) => {
            const room =
              db.classes.find((item) => item.id === student.classId) ?? db.classes[0]
            if (!room) return null
            const previous = accountFor(db, student.id, db.settings.currentTermId)
            return {
              id: makeId('bil'),
              termId: id,
              studentId: student.id,
              classId: room.id,
              feeMinor: room.feeMinor,
              discountMinor: Math.min(previous?.discountMinor ?? 0, room.feeMinor - 1),
              createdAt: now,
            }
          })
          .filter((billing): billing is NonNullable<typeof billing> => billing !== null)
      : []
    persist({
      ...db,
      settings: { ...db.settings, currentTermId: id },
      terms: [...db.terms, term],
      billings: [...db.billings, ...billings],
    })
    return ok(id)
  }

  function setCurrentTerm(termId: string) {
    if (!db || !db.terms.some((term) => term.id === termId)) return
    persist({ ...db, settings: { ...db.settings, currentTermId: termId } })
  }

  function updateTerm(termId: string, patch: Pick<Term, 'label' | 'academicYear' | 'startDate' | 'dueDate'>): Result {
    if (!db) return fail('Open a school first.')
    if (!patch.label.trim()) return fail('Name the term.')
    if (!patch.academicYear.trim()) return fail('Add the academic year.')
    if (patch.dueDate < patch.startDate) return fail('The due date must follow the start date.')
    persist({
      ...db,
      terms: db.terms.map((term) => (term.id === termId ? { ...term, ...patch } : term)),
    })
    return ok(undefined)
  }

  function recordPayment(input: NewPaymentInput): Result<string> {
    if (!db) return fail('Open a school first.')
    const term = currentTerm(db)
    const account = accountFor(db, input.studentId, term.id)
    if (!account) return fail('Choose a student with a fee record this term.')
    if (input.amountMinor <= 0) return fail('Enter an amount greater than zero.')
    if (input.amountMinor > account.balanceMinor) {
      return fail('That is more than the remaining balance.')
    }
    if (!input.date) return fail('Choose the payment date.')
    const now = new Date().toISOString()
    const id = makeId('pay')
    const receiptNumber = nextReceiptNumber(db, input.date)
    persist({
      ...db,
      settings: { ...db.settings, receiptCounter: db.settings.receiptCounter + 1 },
      payments: [
        ...db.payments,
        {
          id,
          termId: term.id,
          studentId: input.studentId,
          amountMinor: input.amountMinor,
          method: input.method,
          reference: input.reference.trim(),
          note: input.note.trim(),
          date: input.date || todayISO(),
          receiptNumber,
          createdAt: now,
        },
      ],
    })
    return ok(id)
  }

  function updateSettings(patch: Pick<Settings, 'schoolName' | 'ownerName' | 'currency'>): Result {
    if (!db) return fail('Open a school first.')
    if (!patch.schoolName.trim()) return fail('Add the school name.')
    persist({
      ...db,
      settings: {
        ...db.settings,
        schoolName: patch.schoolName.trim(),
        ownerName: patch.ownerName.trim(),
        currency: patch.currency,
      },
    })
    return ok(undefined)
  }

  function importDatabase(next: Database) {
    persist(next)
  }

  function reset() {
    setStorageError(null)
    setDb(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Storage may be unavailable; the in-memory reset still stands.
    }
  }

  return {
    db,
    storageError,
    actions: {
      setup,
      loadSample,
      addClass,
      updateClass,
      addStudent,
      updateStudent,
      setStudentStatus,
      removeStudent,
      addTerm,
      setCurrentTerm,
      updateTerm,
      recordPayment,
      updateSettings,
      importDatabase,
      reset,
    },
  }
}
