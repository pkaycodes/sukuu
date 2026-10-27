import { useMemo, useState } from 'react'
import { ChevronRight, Plus, Receipt, Search, SearchX, TrendingUp, Wallet } from 'lucide-react'
import type { Database, Term } from '../types'
import { formatDate } from '../lib/dates'
import { formatMoney } from '../lib/money'
import { PAYMENT_LABELS } from '../lib/options'
import { EmptyState } from './Ui'

export function Payments({
  db,
  term,
  onAdd,
  onOpenStudent,
  onOpenReceipt,
}: {
  db: Database
  term: Term
  onAdd: () => void
  onOpenStudent: (id: string) => void
  onOpenReceipt: (paymentId: string) => void
}) {
  const [query, setQuery] = useState('')
  const payments = useMemo(
    () =>
      db.payments
        .filter((payment) => payment.termId === term.id)
        .sort(
          (a, b) =>
            b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt),
        ),
    [db.payments, term.id],
  )
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return payments
    return payments.filter((payment) => {
      const student = db.students.find((item) => item.id === payment.studentId)
      return [student?.name, student?.studentNumber, payment.receiptNumber, payment.reference]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [db.students, payments, query])

  const collected = payments.reduce((sum, payment) => sum + payment.amountMinor, 0)
  const average = payments.length > 0 ? Math.round(collected / payments.length) : 0

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Payments · {term.label}</p>
          <h1>The receipt book.</h1>
          <p className="page-head__lede">
            Every payment is recorded against a student and a term. Receipts are
            numbered and ready to print.
          </p>
        </div>
        <div className="page-head__actions">
          <button type="button" className="btn btn--primary" onClick={onAdd}>
            <Plus size={16} /> Record payment
          </button>
        </div>
      </header>

      <div className="mini-stats">
        <div>
          <span>
            <Wallet size={15} /> Collected this term
          </span>
          <strong>{formatMoney(collected, db.settings.currency)}</strong>
        </div>
        <div>
          <span>
            <Receipt size={15} /> Receipts issued
          </span>
          <strong>{payments.length}</strong>
        </div>
        <div>
          <span>
            <TrendingUp size={15} /> Average payment
          </span>
          <strong>{formatMoney(average, db.settings.currency)}</strong>
        </div>
      </div>

      <section className="card student-book">
        <div className="student-toolbar">
          <label className="search-field">
            <Search size={16} />
            <span className="sr-only">Search receipts</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search student, receipt or reference"
            />
          </label>
          <span className="receipt-range">
            RCPT-{new Date().getFullYear()}-{String(db.settings.receiptCounter + 1).padStart(4, '0')} is next
          </span>
        </div>

        {payments.length === 0 ? (
          <EmptyState
            icon={<Receipt size={22} />}
            title="No receipts yet"
            body="When a payment comes in, record it here and Sukuu will keep the receipt."
            action={
              <button type="button" className="btn btn--primary" onClick={onAdd}>
                <Plus size={15} /> Record the first payment
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<SearchX size={22} />}
            title="No matching receipts"
            body="Try a student name, receipt number or reference."
            action={
              <button type="button" className="btn btn--quiet" onClick={() => setQuery('')}>
                Clear search
              </button>
            }
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table payments-table">
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Student</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th className="is-right">Amount</th>
                  <th aria-label="Open receipt" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((payment) => {
                  const student = db.students.find((item) => item.id === payment.studentId)
                  return (
                    <tr key={payment.id}>
                      <td className="mono">{payment.receiptNumber}</td>
                      <td>
                        <button
                          type="button"
                          className="table-person table-person--button"
                          onClick={() => onOpenStudent(payment.studentId)}
                        >
                          <span className="avatar avatar--tiny">
                            {student?.name
                              .split(' ')
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join('') ?? '?'}
                          </span>
                          <span>
                            <strong>{student?.name ?? 'Unknown student'}</strong>
                            <small>{student?.studentNumber ?? ''}</small>
                          </span>
                        </button>
                      </td>
                      <td>{formatDate(payment.date)}</td>
                      <td>{PAYMENT_LABELS[payment.method]}</td>
                      <td>{payment.reference || '—'}</td>
                      <td className="is-right mono">
                        {formatMoney(payment.amountMinor, db.settings.currency)}
                      </td>
                      <td className="is-right">
                        <button
                          type="button"
                          className="row-action"
                          onClick={() => onOpenReceipt(payment.id)}
                          aria-label={`Open receipt ${payment.receiptNumber}`}
                        >
                          <ChevronRight size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
