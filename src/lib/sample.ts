import type {
  Billing,
  Currency,
  Database,
  Payment,
  SchoolClass,
  Student,
  Term,
} from '../types'
import { isoDaysAgo, makeId, todayISO } from './dates'

interface StarterInput {
  schoolName: string
  ownerName: string
  currency: Currency
  termLabel: string
  academicYear: string
  startDate: string
  dueDate: string
}

export function createStarterDb(input: StarterInput): Database {
  const now = new Date().toISOString()
  const term: Term = {
    id: makeId('term'),
    label: input.termLabel.trim() || 'Term 1',
    academicYear: input.academicYear.trim(),
    startDate: input.startDate,
    dueDate: input.dueDate,
    createdAt: now,
  }
  return {
    version: 1,
    settings: {
      schoolName: input.schoolName.trim(),
      ownerName: input.ownerName.trim(),
      currency: input.currency,
      currentTermId: term.id,
      receiptCounter: 1000,
      isDemo: false,
    },
    terms: [term],
    classes: [],
    students: [],
    billings: [],
    payments: [],
  }
}

const classSeeds: SchoolClass[] = [
  { id: 'cls_nursery', name: 'Nursery 2', feeMinor: 38000, createdAt: '2026-08-18T08:00:00.000Z' },
  { id: 'cls_primary', name: 'Primary 3', feeMinor: 45000, createdAt: '2026-08-18T08:00:00.000Z' },
  { id: 'cls_jhs', name: 'JHS 1', feeMinor: 56000, createdAt: '2026-08-18T08:00:00.000Z' },
]

const studentSeeds: Omit<Student, 'createdAt'>[] = [
  {
    id: 'stu_ama',
    name: 'Ama Mensah',
    studentNumber: 'SUK-001',
    classId: 'cls_primary',
    guardianName: 'Abena Mensah',
    guardianPhone: '+233 24 400 0111',
    note: 'School bus, East Legon route.',
    status: 'active',
  },
  {
    id: 'stu_kwame',
    name: 'Kwame Asante',
    studentNumber: 'SUK-002',
    classId: 'cls_primary',
    guardianName: 'Kojo Asante',
    guardianPhone: '+233 24 400 0112',
    note: 'Staff scholarship: GH₵50 off the term fee.',
    status: 'active',
  },
  {
    id: 'stu_yaa',
    name: 'Yaa Owusu',
    studentNumber: 'SUK-003',
    classId: 'cls_jhs',
    guardianName: 'Esi Owusu',
    guardianPhone: '+233 24 400 0113',
    note: '',
    status: 'active',
  },
  {
    id: 'stu_kofi',
    name: 'Kofi Boateng',
    studentNumber: 'SUK-004',
    classId: 'cls_nursery',
    guardianName: 'Akosua Boateng',
    guardianPhone: '+233 24 400 0114',
    note: 'Peanut allergy. See the class teacher.',
    status: 'active',
  },
  {
    id: 'stu_adwoa',
    name: 'Adwoa Nyarko',
    studentNumber: 'SUK-005',
    classId: 'cls_jhs',
    guardianName: 'Yaw Nyarko',
    guardianPhone: '+233 24 400 0115',
    note: '',
    status: 'active',
  },
  {
    id: 'stu_nana',
    name: 'Nana Adjei',
    studentNumber: 'SUK-006',
    classId: 'cls_primary',
    guardianName: 'Akua Adjei',
    guardianPhone: '+233 24 400 0116',
    note: '',
    status: 'active',
  },
  {
    id: 'stu_efua',
    name: 'Efua Danso',
    studentNumber: 'SUK-007',
    classId: 'cls_nursery',
    guardianName: 'Kofi Danso',
    guardianPhone: '+233 24 400 0117',
    note: '',
    status: 'active',
  },
  {
    id: 'stu_kojo',
    name: 'Kojo Antwi',
    studentNumber: 'SUK-008',
    classId: 'cls_jhs',
    guardianName: 'Ama Antwi',
    guardianPhone: '+233 24 400 0118',
    note: 'Guardian prefers SMS.',
    status: 'active',
  },
  {
    id: 'stu_akua',
    name: 'Akua Frimpong',
    studentNumber: 'SUK-009',
    classId: 'cls_primary',
    guardianName: 'Yaa Frimpong',
    guardianPhone: '+233 24 400 0119',
    note: '',
    status: 'active',
  },
  {
    id: 'stu_yaw',
    name: 'Yaw Sarpong',
    studentNumber: 'SUK-010',
    classId: 'cls_jhs',
    guardianName: 'Nana Sarpong',
    guardianPhone: '+233 24 400 0120',
    note: '',
    status: 'active',
  },
  {
    id: 'stu_abena',
    name: 'Abena Ofori',
    studentNumber: 'SUK-011',
    classId: 'cls_nursery',
    guardianName: 'Kwesi Ofori',
    guardianPhone: '+233 24 400 0121',
    note: '',
    status: 'active',
  },
  {
    id: 'stu_kweku',
    name: 'Kweku Appiah',
    studentNumber: 'SUK-012',
    classId: 'cls_primary',
    guardianName: 'Adjoa Appiah',
    guardianPhone: '+233 24 400 0122',
    note: '',
    status: 'active',
  },
]

const paymentSeeds: {
  studentId: string
  amountMinor: number
  method: Payment['method']
  reference: string
  note: string
  daysAgo: number
}[] = [
  { studentId: 'stu_ama', amountMinor: 30000, method: 'momo', reference: 'MOMO-8241', note: 'First instalment.', daysAgo: 3 },
  { studentId: 'stu_kwame', amountMinor: 40000, method: 'bank', reference: 'GCB-99120', note: 'Full term fee.', daysAgo: 8 },
  { studentId: 'stu_yaa', amountMinor: 25000, method: 'cash', reference: 'CASH-104', note: 'Part payment.', daysAgo: 4 },
  { studentId: 'stu_kofi', amountMinor: 38000, method: 'momo', reference: 'MOMO-8257', note: 'Paid in full.', daysAgo: 12 },
  { studentId: 'stu_adwoa', amountMinor: 20000, method: 'momo', reference: 'MOMO-8293', note: '', daysAgo: 6 },
  { studentId: 'stu_nana', amountMinor: 45000, method: 'bank', reference: 'ECOBANK-722', note: 'School fees.', daysAgo: 9 },
  { studentId: 'stu_efua', amountMinor: 18000, method: 'cash', reference: 'CASH-109', note: 'Balance promised next week.', daysAgo: 2 },
  { studentId: 'stu_akua', amountMinor: 10000, method: 'momo', reference: 'MOMO-8317', note: 'First payment.', daysAgo: 1 },
  { studentId: 'stu_yaw', amountMinor: 30000, method: 'bank', reference: 'GCB-99408', note: '', daysAgo: 5 },
  { studentId: 'stu_abena', amountMinor: 38000, method: 'cash', reference: 'CASH-112', note: 'Paid at the office.', daysAgo: 11 },
]

export function createSampleDb(): Database {
  const now = new Date().toISOString()
  const termId = 'term_2026_t1'
  const term: Term = {
    id: termId,
    label: 'Term 1',
    academicYear: '2026/27',
    startDate: isoDaysAgo(84),
    dueDate: isoDaysAgo(10),
    createdAt: now,
  }
  const students: Student[] = studentSeeds.map((student, index) => ({
    ...student,
    createdAt: new Date(Date.now() - (index + 20) * 86_400_000).toISOString(),
  }))
  const classMap = new Map(classSeeds.map((room) => [room.id, room]))
  const billings: Billing[] = students.map((student) => {
    const room = classMap.get(student.classId)!
    const discountMinor = student.id === 'stu_kwame' ? 5000 : 0
    return {
      id: `bil_${student.id.slice(4)}`,
      termId,
      studentId: student.id,
      classId: student.classId,
      feeMinor: room.feeMinor,
      discountMinor,
      createdAt: now,
    }
  })
  const payments: Payment[] = paymentSeeds.map((seed, index) => ({
    id: `pay_${String(index + 1).padStart(3, '0')}`,
    termId,
    studentId: seed.studentId,
    amountMinor: seed.amountMinor,
    method: seed.method,
    reference: seed.reference,
    note: seed.note,
    date: isoDaysAgo(seed.daysAgo),
    receiptNumber: `RCPT-2026-${String(1001 + index)}`,
    createdAt: new Date(Date.now() - seed.daysAgo * 86_400_000).toISOString(),
  }))

  return {
    version: 1,
    settings: {
      schoolName: 'Ridgeview Academy',
      ownerName: 'Mrs. Adjoa Bediako',
      currency: 'GHS',
      currentTermId: termId,
      receiptCounter: 1000 + payments.length,
      isDemo: true,
    },
    terms: [term],
    classes: classSeeds,
    students,
    billings,
    payments,
  }
}

export function newTermLabel(index: number): string {
  return `Term ${index}`
}

export function todayForInput(): string {
  return todayISO()
}
