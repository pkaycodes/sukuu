import { useState, type FormEvent } from 'react'
import { CheckCircle2, Printer, ReceiptText, Wallet } from 'lucide-react'
import type {
  Database,
  NewClassInput,
  NewPaymentInput,
  NewStudentInput,
  NewTermInput,
  Payment,
  PaymentMethod,
  SchoolClass,
  Student,
  Term,
} from '../types'
import { accountFor, accountsFor, balanceAfterPayment, billingFor, currentTerm } from '../lib/calc'
import { defaultStartDate, formatDate, isoDaysFromNow } from '../lib/dates'
import { formatMoney, moneyInputValue, parseMoneyInput } from '../lib/money'
import { PAYMENT_METHODS, PAYMENT_LABELS } from '../lib/options'
import { Modal } from './Ui'

type SaveResult = { ok: true } | { ok: false; error: string }
type PaymentResult = { ok: true; id: string } | { ok: false; error: string }

function nextStudentNumber(db: Database): string {
  const numbers = db.students
    .map((student) => Number(student.studentNumber.match(/(\d+)$/)?.[1] ?? 0))
    .filter((value) => Number.isFinite(value))
  const next = Math.max(0, ...numbers) + 1
  return `SUK-${String(next).padStart(3, '0')}`
}

export function StudentFormDialog({
  db,
  term,
  initial,
  onClose,
  onSave,
}: {
  db: Database
  term: Term
  initial?: Student
  onClose: () => void
  onSave: (input: NewStudentInput) => SaveResult
}) {
  const initialBilling = initial ? billingFor(db, term.id, initial.id) : undefined
  const [name, setName] = useState(initial?.name ?? '')
  const [studentNumber, setStudentNumber] = useState(
    initial?.studentNumber ?? nextStudentNumber(db),
  )
  const [classId, setClassId] = useState(initial?.classId ?? db.classes[0]?.id ?? '')
  const [guardianName, setGuardianName] = useState(initial?.guardianName ?? '')
  const [guardianPhone, setGuardianPhone] = useState(initial?.guardianPhone ?? '')
  const [discount, setDiscount] = useState(
    initialBilling ? moneyInputValue(initialBilling.discountMinor) : '0.00',
  )
  const [note, setNote] = useState(initial?.note ?? '')
  const [error, setError] = useState<string | null>(null)
  const selectedClass = db.classes.find((room) => room.id === classId)
  const discountMinor = parseMoneyInput(discount) ?? -1
  const netFee =
    selectedClass && discountMinor >= 0 ? selectedClass.feeMinor - discountMinor : null

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (discountMinor < 0) {
      setError('Enter a discount as an amount, or leave it at 0.')
      return
    }
    const result = onSave({
      name,
      studentNumber,
      classId,
      guardianName,
      guardianPhone,
      discountMinor,
      note,
    })
    if (!result.ok) setError(result.error)
    else onClose()
  }

  return (
    <Modal
      title={initial ? 'Edit student' : 'Add a student'}
      eyebrow={initial ? initial.studentNumber : 'Student book'}
      onClose={onClose}
      size="wide"
    >
      <form className="form-stack" onSubmit={handleSubmit}>
        <div className="field-grid">
          <label className="field field--full">
            <span>Student name</span>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Full name"
              autoFocus
              required
            />
          </label>
          <label className="field">
            <span>Student number</span>
            <input
              value={studentNumber}
              onChange={(event) => setStudentNumber(event.target.value)}
              placeholder="SUK-013"
              required
            />
          </label>
          <label className="field">
            <span>Class</span>
            <select value={classId} onChange={(event) => setClassId(event.target.value)} required>
              {db.classes.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} · {formatMoney(room.feeMinor, db.settings.currency)}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Guardian name</span>
            <input
              value={guardianName}
              onChange={(event) => setGuardianName(event.target.value)}
              placeholder="Parent or caregiver"
            />
          </label>
          <label className="field">
            <span>Guardian phone</span>
            <input
              value={guardianPhone}
              onChange={(event) => setGuardianPhone(event.target.value)}
              placeholder="+233 24 000 0000"
              inputMode="tel"
            />
          </label>
          <label className="field">
            <span>Discount / scholarship</span>
            <input
              value={discount}
              onChange={(event) => setDiscount(event.target.value)}
              placeholder="0.00"
              inputMode="decimal"
            />
          </label>
          <label className="field field--full">
            <span>Note</span>
            <input
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Anything the office should remember"
            />
          </label>
        </div>

        <div className="fee-preview">
          <span className="fee-preview__icon">
            <Wallet size={17} />
          </span>
          <div>
            <span>Term charge</span>
            <strong>{netFee === null ? '—' : formatMoney(netFee, db.settings.currency)}</strong>
          </div>
          <small>
            {selectedClass
              ? `${formatMoney(selectedClass.feeMinor, db.settings.currency)} class fee − ${
                  discountMinor > 0 ? formatMoney(discountMinor, db.settings.currency) : 'no'
                } discount`
              : 'Choose a class first.'}
          </small>
        </div>

        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="modal-actions">
          <button type="button" className="btn btn--quiet" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary">
            {initial ? 'Save changes' : 'Add student'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function ClassFormDialog({
  initial,
  onClose,
  onSave,
}: {
  initial?: SchoolClass
  onClose: () => void
  onSave: (input: NewClassInput) => SaveResult
}) {
  const [name, setName] = useState(initial?.name ?? '')
  const [fee, setFee] = useState(
    initial ? moneyInputValue(initial.feeMinor) : '',
  )
  const [error, setError] = useState<string | null>(null)
  const feeMinor = parseMoneyInput(fee)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (feeMinor === null) {
      setError('Enter the term fee in figures, for example 450.00.')
      return
    }
    const result = onSave({ name, feeMinor })
    if (!result.ok) setError(result.error)
    else onClose()
  }

  return (
    <Modal
      title={initial ? 'Edit class fee' : 'Add a class'}
      eyebrow="Classes & fees"
      onClose={onClose}
    >
      <form className="form-stack" onSubmit={handleSubmit}>
        <label className="field">
          <span>Class name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Primary 4"
            autoFocus
            required
          />
        </label>
        <label className="field">
          <span>Term fee</span>
          <input
            value={fee}
            onChange={(event) => setFee(event.target.value)}
            placeholder="e.g. 450.00"
            inputMode="decimal"
            required
          />
        </label>
        <p className="form-hint">
          This is the fee used when a student joins, and when a new term is created.
          Existing term charges do not change.
        </p>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="modal-actions">
          <button type="button" className="btn btn--quiet" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary">
            {initial ? 'Save fee' : 'Add class'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function PaymentFormDialog({
  db,
  term,
  initialStudentId,
  onClose,
  onSave,
  onSaved,
}: {
  db: Database
  term: Term
  initialStudentId?: string
  onClose: () => void
  onSave: (input: NewPaymentInput) => PaymentResult
  onSaved: (paymentId: string) => void
}) {
  const accounts = accountsFor(db, term.id)
  const firstOpen = accounts.find((account) => account.balanceMinor > 0)
  const [studentId, setStudentId] = useState(
    initialStudentId ?? firstOpen?.student.id ?? accounts[0]?.student.id ?? '',
  )
  const account = studentId ? accountFor(db, studentId, term.id) : null
  const [amount, setAmount] = useState(
    account && account.balanceMinor > 0 ? moneyInputValue(account.balanceMinor) : '',
  )
  const [method, setMethod] = useState<PaymentMethod>('momo')
  const [reference, setReference] = useState('')
  const [date, setDate] = useState(defaultStartDate())
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const amountMinor = parseMoneyInput(amount)

  function chooseStudent(id: string) {
    setStudentId(id)
    const next = accountFor(db, id, term.id)
    setAmount(next && next.balanceMinor > 0 ? moneyInputValue(next.balanceMinor) : '')
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (amountMinor === null || amountMinor <= 0) {
      setError('Enter an amount greater than zero.')
      return
    }
    const result = onSave({
      studentId,
      amountMinor,
      method,
      reference,
      note,
      date,
    })
    if (!result.ok) setError(result.error)
    else onSaved(result.id)
  }

  const projectedBalance =
    account && amountMinor !== null ? Math.max(0, account.balanceMinor - amountMinor) : null

  return (
    <Modal title="Record a payment" eyebrow={`${term.label} · ${term.academicYear}`} onClose={onClose} size="wide">
      {accounts.length === 0 ? (
        <div className="dialog-empty">
          <ReceiptText size={24} />
          <p>Add a class and a student first. There is no one to bill yet.</p>
        </div>
      ) : (
        <form className="form-stack" onSubmit={handleSubmit}>
          <label className="field">
            <span>Student</span>
            <select value={studentId} onChange={(event) => chooseStudent(event.target.value)}>
              {accounts.map((item) => (
                <option key={item.student.id} value={item.student.id}>
                  {item.student.name} · {formatMoney(item.balanceMinor, db.settings.currency)} balance
                </option>
              ))}
            </select>
          </label>

          {account ? (
            <div className="payment-summary">
              <div>
                <span>Fee</span>
                <strong>{formatMoney(account.chargeMinor, db.settings.currency)}</strong>
              </div>
              <div>
                <span>Already paid</span>
                <strong>{formatMoney(account.paidMinor, db.settings.currency)}</strong>
              </div>
              <div className="payment-summary__balance">
                <span>Balance</span>
                <strong>{formatMoney(account.balanceMinor, db.settings.currency)}</strong>
              </div>
            </div>
          ) : null}

          <div className="field-grid">
            <label className="field">
              <span>Amount received</span>
              <input
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="0.00"
                inputMode="decimal"
                autoFocus
                required
              />
            </label>
            <label className="field">
              <span>Payment method</span>
              <select
                value={method}
                onChange={(event) => setMethod(event.target.value as PaymentMethod)}
              >
                {PAYMENT_METHODS.map((option) => (
                  <option key={option.code} value={option.code}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Date received</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} required />
            </label>
            <label className="field">
              <span>Reference</span>
              <input
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="MoMo or cheque reference"
              />
            </label>
            <label className="field field--full">
              <span>Note</span>
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Optional note for the receipt"
              />
            </label>
          </div>

          <div className="payment-preview">
            <span>
              <ReceiptText size={16} /> Receipt{' '}
              <strong>
                RCPT-{new Date().getFullYear()}-
                {String(db.settings.receiptCounter + 1).padStart(4, '0')}
              </strong>
            </span>
            {projectedBalance !== null ? (
              <span>
                New balance <strong>{formatMoney(projectedBalance, db.settings.currency)}</strong>
              </span>
            ) : null}
          </div>

          {error ? (
            <p className="form-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="modal-actions">
            <button type="button" className="btn btn--quiet" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={!account || account.balanceMinor === 0}
            >
              <CheckCircle2 size={16} /> Save &amp; issue receipt
            </button>
          </div>
        </form>
      )}
    </Modal>
  )
}

export function TermFormDialog({
  db,
  onClose,
  onSave,
}: {
  db: Database
  onClose: () => void
  onSave: (input: NewTermInput) => SaveResult
}) {
  const [label, setLabel] = useState(`Term ${db.terms.length + 1}`)
  const [academicYear, setAcademicYear] = useState(
    currentTerm(db).academicYear || String(new Date().getFullYear()),
  )
  const [startDate, setStartDate] = useState(defaultStartDate())
  const [dueDate, setDueDate] = useState(isoDaysFromNow(90))
  const [copyStudents, setCopyStudents] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const activeStudents = db.students.filter((student) => student.status === 'active')

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const result = onSave({ label, academicYear, startDate, dueDate, copyStudents })
    if (!result.ok) setError(result.error)
    else onClose()
  }

  return (
    <Modal title="Start a new term" eyebrow="A fresh fee book" onClose={onClose}>
      <form className="form-stack" onSubmit={handleSubmit}>
        <div className="field-grid">
          <label className="field">
            <span>Term name</span>
            <input value={label} onChange={(event) => setLabel(event.target.value)} required autoFocus />
          </label>
          <label className="field">
            <span>Academic year</span>
            <input
              value={academicYear}
              onChange={(event) => setAcademicYear(event.target.value)}
              required
            />
          </label>
          <label className="field">
            <span>Term starts</span>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required />
          </label>
          <label className="field">
            <span>Fees due</span>
            <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} required />
          </label>
        </div>

        <label className="check-row">
          <input
            type="checkbox"
            checked={copyStudents}
            onChange={(event) => setCopyStudents(event.target.checked)}
          />
          <span>
            <strong>Copy {activeStudents.length} active students into this term</strong>
            <small>Each gets a fee record at the class&rsquo;s current term fee.</small>
          </span>
        </label>

        <p className="form-hint">
          The new term becomes the active term. Previous payments and receipts stay in the
          history, and you can switch back from the term menu at the top.
        </p>
        {error ? (
          <p className="form-error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="modal-actions">
          <button type="button" className="btn btn--quiet" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary">
            Create term
          </button>
        </div>
      </form>
    </Modal>
  )
}

export function ReceiptDialog({
  db,
  term,
  payment,
  onClose,
}: {
  db: Database
  term: Term
  payment: Payment
  onClose: () => void
}) {
  const student = db.students.find((item) => item.id === payment.studentId)
  const balanceAfter = balanceAfterPayment(db, payment)

  return (
    <Modal title="Receipt" eyebrow="Ready to print or keep" onClose={onClose} size="receipt">
      <div className="receipt-sheet">
        <div className="receipt-sheet__brand">
          <span className="receipt-sheet__mark">
            <ReceiptText size={19} />
          </span>
          <div>
            <strong>{db.settings.schoolName}</strong>
            <span>Fee receipt · {term.academicYear}</span>
          </div>
          <span className="receipt-sheet__stamp">PAID</span>
        </div>
        <div className="receipt-sheet__rule" />
        <div className="receipt-sheet__meta">
          <span>
            Receipt no. <strong>{payment.receiptNumber}</strong>
          </span>
          <span>
            Date <strong>{formatDate(payment.date)}</strong>
          </span>
        </div>
        <div className="receipt-sheet__student">
          <span>Received from</span>
          <strong>{student?.name ?? 'Unknown student'}</strong>
          <small>
            {student?.studentNumber} · {term.label} · {term.academicYear}
          </small>
        </div>
        <div className="receipt-sheet__amount">
          <span>Amount received</span>
          <strong>{formatMoney(payment.amountMinor, db.settings.currency)}</strong>
        </div>
        <div className="receipt-sheet__details">
          <div>
            <span>Method</span>
            <strong>{PAYMENT_LABELS[payment.method]}</strong>
          </div>
          <div>
            <span>Reference</span>
            <strong>{payment.reference || '—'}</strong>
          </div>
          <div>
            <span>Term</span>
            <strong>
              {term.label} · {term.academicYear}
            </strong>
          </div>
        </div>
        {payment.note ? <p className="receipt-sheet__note">“{payment.note}”</p> : null}
        <div className="receipt-sheet__balance">
          <span>Balance after receipt</span>
          <strong>{formatMoney(balanceAfter, db.settings.currency)}</strong>
        </div>
        <div className="receipt-sheet__rule" />
        <p className="receipt-sheet__thanks">
          Thank you. This receipt is recorded in {db.settings.schoolName}&rsquo;s Sukuu
          fee book.
        </p>
      </div>

      <div className="modal-actions receipt-actions">
        <button type="button" className="btn btn--quiet" onClick={onClose}>
          Close
        </button>
        <button type="button" className="btn btn--primary" onClick={() => window.print()}>
          <Printer size={16} /> Print receipt
        </button>
      </div>
    </Modal>
  )
}
