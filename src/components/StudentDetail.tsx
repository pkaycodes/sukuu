import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  ChevronRight,
  CircleSlash,
  MessageCircle,
  Pencil,
  Phone,
  Plus,
  Receipt,
  Trash2,
  UserRound,
  Wallet,
} from 'lucide-react'
import type { Database, Term } from '../types'
import { accountFor, termHistory } from '../lib/calc'
import { formatDate, isOverdue } from '../lib/dates'
import { formatMoney } from '../lib/money'
import { PAYMENT_LABELS } from '../lib/options'
import { ProgressBar } from './Ui'

function phoneDigits(phone: string) {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('0')) return `233${digits.slice(1)}`
  if (digits.startsWith('233')) return digits
  return digits
}

export function StudentDetail({
  db,
  term,
  studentId,
  onBack,
  onRecordPayment,
  onEdit,
  onMarkLeft,
  onDelete,
  onOpenReceipt,
}: {
  db: Database
  term: Term
  studentId: string
  onBack: () => void
  onRecordPayment: () => void
  onEdit: () => void
  onMarkLeft: () => void
  onDelete: () => void
  onOpenReceipt: (paymentId: string) => void
}) {
  const account = accountFor(db, studentId, term.id)
  if (!account) {
    return (
      <div className="page">
        <button type="button" className="back-link" onClick={onBack}>
          <ArrowLeft size={16} /> Back to students
        </button>
        <p className="notice notice--warn">This student could not be found.</p>
      </div>
    )
  }

  const history = termHistory(db, studentId)
  const progress = account.chargeMinor > 0 ? (account.paidMinor / account.chargeMinor) * 100 : 0
  const overdue = account.balanceMinor > 0 && isOverdue(term.dueDate)
  const whatsappNumber = phoneDigits(account.student.guardianPhone)
  const reminder = `Hello ${account.student.guardianName || 'there'}, this is ${db.settings.schoolName}. ${account.student.name}'s ${term.label} fee balance is ${formatMoney(account.balanceMinor, db.settings.currency)}. The due date was ${formatDate(term.dueDate)}. Please reach out if you need to discuss it. Thank you.`
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(reminder)}`

  return (
    <div className="page">
      <button type="button" className="back-link" onClick={onBack}>
        <ArrowLeft size={16} /> Back to students
      </button>

      <div className="student-detail-head">
        <div className="student-identity">
          <span className="avatar avatar--large">
            {account.student.name
              .split(' ')
              .map((part) => part[0])
              .slice(0, 2)
              .join('')}
          </span>
          <div>
            <p className="eyebrow">
              {account.classRoom?.name ?? 'No class'} · {account.student.studentNumber}
            </p>
            <h1>{account.student.name}</h1>
            <div className="student-tags">
              <span className={`pill ${account.student.status === 'left' ? 'pill--muted' : 'pill--green'}`}>
                <BadgeCheck size={12} /> {account.student.status === 'left' ? 'Left the school' : 'Active'}
              </span>
              {account.billing ? (
                <span className="pill pill--muted">
                  <CalendarDays size={12} /> {term.label} · {term.academicYear}
                </span>
              ) : null}
              {overdue ? <span className="pill pill--gold">Overdue</span> : null}
            </div>
          </div>
        </div>
        <div className="page-head__actions">
          <button type="button" className="btn btn--quiet" onClick={onEdit}>
            <Pencil size={15} /> Edit
          </button>
          <button type="button" className="btn btn--primary" onClick={onRecordPayment}>
            <Plus size={16} /> Record payment
          </button>
        </div>
      </div>

      <div className="detail-grid">
        <section className="card balance-card">
          <div className="balance-card__head">
            <div>
              <p className="eyebrow">This term</p>
              <h2>Fee balance</h2>
            </div>
            <span className="balance-card__icon">
              <Wallet size={20} />
            </span>
          </div>
          <div className="balance-card__amount">
            <strong>{formatMoney(account.balanceMinor, db.settings.currency)}</strong>
            <span>
              {account.balanceMinor === 0
                ? 'Settled for this term'
                : `of ${formatMoney(account.chargeMinor, db.settings.currency)} outstanding`}
            </span>
          </div>
          <ProgressBar
            value={progress}
            tone={progress >= 100 ? 'green' : 'gold'}
            label={`${account.student.name} fee progress`}
          />
          <div className="balance-breakdown">
            <div>
              <span>Class fee</span>
              <strong>{formatMoney(account.billedMinor, db.settings.currency)}</strong>
            </div>
            <div>
              <span>Discount</span>
              <strong>− {formatMoney(account.discountMinor, db.settings.currency)}</strong>
            </div>
            <div>
              <span>Paid</span>
              <strong>{formatMoney(account.paidMinor, db.settings.currency)}</strong>
            </div>
          </div>
          <div className="balance-card__actions">
            {account.balanceMinor > 0 && whatsappNumber.length >= 10 ? (
              <a
                className="btn btn--quiet"
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageCircle size={15} /> WhatsApp reminder
              </a>
            ) : null}
            <button
              type="button"
              className="btn btn--primary"
              onClick={onRecordPayment}
              disabled={account.balanceMinor === 0}
            >
              <Plus size={15} /> Add payment
            </button>
          </div>
          {account.balanceMinor === 0 ? (
            <p className="paid-note">Paid in full for {term.label}. Receipts are below.</p>
          ) : null}
        </section>

        <aside className="card guardian-card">
          <div className="card-head">
            <div>
              <p className="eyebrow">Guardian</p>
              <h2>Contact</h2>
            </div>
            <UserRound size={18} />
          </div>
          <div className="guardian-name">
            <strong>{account.student.guardianName || 'No guardian recorded'}</strong>
            <span>{account.classRoom?.name ?? 'No class'}</span>
          </div>
          {account.student.guardianPhone ? (
            <a className="guardian-phone" href={`tel:${account.student.guardianPhone.replace(/\s/g, '')}`}>
              <Phone size={15} />
              {account.student.guardianPhone}
              <ChevronRight size={15} />
            </a>
          ) : null}
          {account.student.note ? (
            <div className="guardian-note">
              <span>Note</span>
              <p>{account.student.note}</p>
            </div>
          ) : null}
          <div className="guardian-foot">
            <button type="button" className="text-link" onClick={onMarkLeft}>
              <CircleSlash size={14} />
              {account.student.status === 'left' ? 'Mark as active' : 'Mark as left'}
            </button>
            <button type="button" className="text-link text-link--danger" onClick={onDelete}>
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </aside>
      </div>

      <section className="card detail-payments">
        <div className="card-head">
          <div>
            <p className="eyebrow">{term.label} receipts</p>
            <h2>Payment history</h2>
          </div>
          <span className="card-head__meta">
            {account.payments.length} {account.payments.length === 1 ? 'receipt' : 'receipts'}
          </span>
        </div>
        {account.payments.length === 0 ? (
          <div className="inline-empty">
            <Receipt size={18} />
            <span>No payments recorded for this term.</span>
            <button type="button" className="text-link" onClick={onRecordPayment}>
              Record the first one <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table student-payments">
              <thead>
                <tr>
                  <th>Receipt</th>
                  <th>Date</th>
                  <th>Method</th>
                  <th>Reference</th>
                  <th className="is-right">Amount</th>
                  <th aria-label="Open receipt" />
                </tr>
              </thead>
              <tbody>
                {account.payments.map((payment) => (
                  <tr key={payment.id}>
                    <td className="mono">{payment.receiptNumber}</td>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {history.length > 1 ? (
        <section className="card detail-history">
          <div className="card-head">
            <div>
              <p className="eyebrow">Across terms</p>
              <h2>Fee history</h2>
            </div>
          </div>
          <ul className="history-list">
            {history.map(({ term: item, account: itemAccount }) => (
              <li key={item.id} className={item.id === term.id ? 'is-current' : ''}>
                <span className="history-dot" aria-hidden="true" />
                <div>
                  <strong>
                    {item.label} · {item.academicYear}
                  </strong>
                  <small>Due {formatDate(item.dueDate)}</small>
                </div>
                <span className="history-amounts">
                  <strong>{formatMoney(itemAccount.paidMinor, db.settings.currency)}</strong>
                  <small>{formatMoney(itemAccount.balanceMinor, db.settings.currency)} left</small>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
