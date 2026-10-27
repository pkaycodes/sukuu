export type Currency = 'GHS' | 'NGN' | 'KES' | 'USD' | 'GBP'

export type PaymentMethod = 'cash' | 'momo' | 'bank' | 'cheque' | 'other'

export type StudentStatus = 'active' | 'left'

export interface Settings {
  schoolName: string
  ownerName: string
  currency: Currency
  currentTermId: string
  receiptCounter: number
  isDemo: boolean
}

export interface Term {
  id: string
  label: string
  academicYear: string
  startDate: string
  dueDate: string
  createdAt: string
}

export interface SchoolClass {
  id: string
  name: string
  feeMinor: number
  createdAt: string
}

export interface Student {
  id: string
  name: string
  studentNumber: string
  classId: string
  guardianName: string
  guardianPhone: string
  note: string
  status: StudentStatus
  createdAt: string
}

export interface Billing {
  id: string
  termId: string
  studentId: string
  classId: string
  feeMinor: number
  discountMinor: number
  createdAt: string
}

export interface Payment {
  id: string
  termId: string
  studentId: string
  amountMinor: number
  method: PaymentMethod
  reference: string
  note: string
  date: string
  receiptNumber: string
  createdAt: string
}

export interface Database {
  version: 1
  settings: Settings
  terms: Term[]
  classes: SchoolClass[]
  students: Student[]
  billings: Billing[]
  payments: Payment[]
}

export interface NewStudentInput {
  name: string
  studentNumber: string
  classId: string
  guardianName: string
  guardianPhone: string
  discountMinor: number
  note: string
}

export interface NewPaymentInput {
  studentId: string
  amountMinor: number
  method: PaymentMethod
  reference: string
  note: string
  date: string
}

export interface NewClassInput {
  name: string
  feeMinor: number
}

export interface NewTermInput {
  label: string
  academicYear: string
  startDate: string
  dueDate: string
  copyStudents: boolean
}

export interface StudentAccount {
  student: Student
  classRoom: SchoolClass | null
  billing: Billing | null
  billedMinor: number
  discountMinor: number
  chargeMinor: number
  paidMinor: number
  balanceMinor: number
  payments: Payment[]
}

export interface ClassSummary {
  classRoom: SchoolClass
  students: number
  billedMinor: number
  paidMinor: number
  outstandingMinor: number
}

export interface TermSummary {
  billedMinor: number
  paidMinor: number
  outstandingMinor: number
  rate: number
  students: number
  paidInFull: number
  overdue: number
  classes: ClassSummary[]
}

export type View =
  | 'overview'
  | 'students'
  | 'student'
  | 'classes'
  | 'payments'
  | 'settings'
