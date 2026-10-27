import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  Download,
  Plus,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import type { Database, Term } from '../types'
import {
  accountsFor,
  outstandingAccounts,
  recentPayments,
  termSummary,
} from '../lib/calc'
import { formatDate, formatShortDate, isOverdue } from '../lib/dates'
import { formatMoney } from '../lib/money'
import { PAYMENT_LABELS } from '../lib/options'
import { EmptyState, ProgressBar, StatCard } from './Ui'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function Dashboard({
  db,
  term,
  onOpenStudent,
  onAddPayment,
  onAddStudent,
  onAddClass,
  onAddTerm,
  onOpenPayments,
  onExport,
}: {
  db: Database
  term: Term
  onOpenStudent: (id: string) => void
  onAddPayment: (studentId?: string) => void
  onAddStudent: () => void
  onAddClass: () => void
  onAddTerm: () => void
  onOpenPayments: () => void
  onExport: () => void
}) {
  const summary = termSummary(db, term.id)
  const outstanding = outstandingAccounts(db, term.id)
  const recent = recentPayments(db, term.id, 5)
  const accounts = accountsFor(db, term.id)
  const overdue = isOverdue(term.dueDate) && outstanding.length > 0
  const firstName = db.settings.ownerName.trim().split(/\s+/).slice(-1)[0] || 'there'
  const setupNeeded = db.classes.length === 0 || accounts.length === 0

  return (
    <div className="page page--overview">
      <header className="page-head">
        <div>
          <p className="eyebrow">
            {term.label} · {term.academicYear}
            {db.settings.isDemo ? <span className="demo-pill">Sample school</span> : null}
          </p>
          <h1>
            {greeting()}, {firstName}.
          </h1>
          <p className="page-head__lede">
            {outstanding.length === 0 && summary.students > 0
              ? 'Every recorded fee is paid. A rare and beautiful thing.'
              : `${outstanding.length} ${
                  outstanding.length === 1 ? 'student has' : 'students have'
                } a balance. ${
                  overdue
                    ? `The term due date passed on ${formatDate(term.dueDate)}.`
                    : `Fees are due ${formatDate(term.dueDate)}.`
                }`}
          </p>
        </div>
        <div className="page-head__actions">
          <button type="button" className="btn btn--quiet" onClick={onExport}>
            <Download size={15} /> Export
          </button>
          <button type="button" className="btn btn--primary" onClick={() => onAddPayment()}>
            <Plus size={16} /> Record payment
          </button>
        </div>
      </header>

      {setupNeeded ? (
        <section className="setup-card" aria-labelledby="setup-title">
          <div className="setup-card__copy">
            <span className="setup-card__icon">
              <BookOpen size={20} />
            </span>
            <div>
              <h2 id="setup-title">Let&rsquo;s open the fee book.</h2>
              <p>
                {db.classes.length === 0
                  ? 'Start with the classes you teach and the fee for each one.'
                  : 'Add your first student, then record a payment when it comes in.'}
              </p>
            </div>
          </div>
          <div className="setup-steps">
            <button
              type="button"
              className={db.classes.length > 0 ? 'setup-step is-done' : 'setup-step'}
              onClick={onAddClass}
            >
              <span>{db.classes.length > 0 ? <CheckCircle2 size={18} /> : '01'}</span>
              <div>
                <strong>Add a class</strong>
                <small>Name and term fee</small>
              </div>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className={accounts.length > 0 ? 'setup-step is-done' : 'setup-step'}
              onClick={onAddStudent}
              disabled={db.classes.length === 0}
            >
              <span>{accounts.length > 0 ? <CheckCircle2 size={18} /> : '02'}</span>
              <div>
                <strong>Add a student</strong>
                <small>Guardian and class</small>
              </div>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              className="setup-step"
              onClick={() => onAddPayment()}
              disabled={accounts.length === 0}
            >
              <span>03</span>
              <div>
                <strong>Record a payment</strong>
                <small>Issue a receipt</small>
              </div>
              <ArrowRight size={16} />
            </button>
          </div>
        </section>
      ) : null}

      <section className="stats-grid" aria-label="Term summary">
        <StatCard
          label="Expected this term"
          value={formatMoney(summary.billedMinor, db.settings.currency)}
          detail={`${summary.students} students on the book`}
          tone="paper"
          icon={<Wallet size={17} />}
        />
        <StatCard
          label="Collected"
          value={formatMoney(summary.paidMinor, db.settings.currency)}
          detail={`${summary.paidInFull} of ${summary.students} paid in full`}
          tone="green"
          icon={<TrendingUp size={17} />}
        />
        <StatCard
          label="Outstanding"
          value={formatMoney(summary.outstandingMinor, db.settings.currency)}
          detail={overdue ? `${summary.overdue} overdue` : `${outstanding.length} balances open`}
          tone="gold"
          icon={<AlertCircle size={17} />}
        />
        <StatCard
          label="Collection rate"
          value={`${summary.rate}%`}
          detail={`Due ${formatShortDate(term.dueDate)}`}
          tone="ink"
          icon={<Receipt size={17} />}
        />
      </section>

      <div className="overview-grid">
        <section className="card collection-card">
          <div className="card-head">
            <div>
              <p className="eyebrow">By class</p>
              <h2>How the term is going</h2>
            </div>
            <span className="card-head__meta">{summary.rate}% collected</span>
          </div>
          {summary.classes.length === 0 ? (
            <EmptyState
              icon={<BookOpen size={22} />}
              title="No classes yet"
              body="Add a class and its term fee to start tracking."
              action={
                <button type="button" className="btn btn--primary" onClick={onAddClass}>
                  <Plus size={15} /> Add a class
                </button>
              }
            />
          ) : (
            <div className="class-progress-list">
              {summary.classes.map((row) => {
                const rate = row.billedMinor > 0 ? (row.paidMinor / row.billedMinor) * 100 : 0
                return (
                  <div className="class-progress" key={row.classRoom.id}>
                    <div className="class-progress__top">
                      <span>
                        <strong>{row.classRoom.name}</strong>
                        <small>
                          {row.students} {row.students === 1 ? 'student' : 'students'}
                        </small>
                      </span>
                      <span>
                        <strong>{formatMoney(row.paidMinor, db.settings.currency)}</strong>
                        <small>of {formatMoney(row.billedMinor, db.settings.currency)}</small>
                      </span>
                    </div>
                    <ProgressBar
                      value={rate}
                      tone={rate >= 90 ? 'green' : rate >= 50 ? 'gold' : 'ink'}
                      label={`${row.classRoom.name} fee collection`}
                    />
                  </div>
                )
              })}
            </div>
          )}
        </section>

        <section className="card attention-card">
          <div className="card-head">
            <div>
              <p className="eyebrow">Needs attention</p>
              <h2>Who still owes</h2>
            </div>
            <button type="button" className="text-link" onClick={() => onOpenPayments()}>
              All payments <ArrowUpRight size={14} />
            </button>
          </div>
          {outstanding.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 size={22} />}
              title="Nothing outstanding"
              body="Every student with a fee record is settled for this term."
            />
          ) : (
            <ul className="attention-list">
              {outstanding.slice(0, 5).map((account) => (
                <li key={account.student.id}>
                  <button type="button" onClick={() => onOpenStudent(account.student.id)}>
                    <span className="avatar avatar--small">
                      {account.student.name
                        .split(' ')
                        .map((part) => part[0])
                        .slice(0, 2)
                        .join('')}
                    </span>
                    <span className="attention-list__name">
                      <strong>{account.student.name}</strong>
                      <small>
                        {account.classRoom?.name ?? 'No class'} ·{' '}
                        {formatMoney(account.paidMinor, db.settings.currency)} paid
                      </small>
                    </span>
                    <span className="attention-list__amount">
                      {formatMoney(account.balanceMinor, db.settings.currency)}
                    </span>
                    <ArrowRight size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card payments-card">
        <div className="card-head">
          <div>
            <p className="eyebrow">Latest receipts</p>
            <h2>Money that came in</h2>
          </div>
          <button type="button" className="text-link" onClick={onOpenPayments}>
            View all <ArrowUpRight size={14} />
          </button>
        </div>
        {recent.length === 0 ? (
          <EmptyState
            icon={<Receipt size={22} />}
            title="No payments recorded"
            body="Record the first payment and Sukuu will issue a receipt."
            action={
              <button type="button" className="btn btn--primary" onClick={() => onAddPayment()}>
                <Plus size={15} /> Record payment
              </button>
            }
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table dashboard-receipts">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Receipt</th>
                  <th>Method</th>
                  <th>Date</th>
                  <th className="is-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((payment) => {
                  const student = db.students.find((item) => item.id === payment.studentId)
                  return (
                    <tr key={payment.id}>
                      <td>
                        <span className="table-person">
                          <span className="avatar avatar--tiny">
                            {student?.name
                              .split(' ')
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join('') ?? '?'}
                          </span>
                          {student?.name ?? 'Unknown student'}
                        </span>
                      </td>
                      <td className="mono">{payment.receiptNumber}</td>
                      <td>{PAYMENT_LABELS[payment.method]}</td>
                      <td>{formatDate(payment.date)}</td>
                      <td className="is-right mono">
                        {formatMoney(payment.amountMinor, db.settings.currency)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="overview-foot">
        <span>
          <Users size={15} /> {db.students.filter((student) => student.status === 'active').length}{' '}
          active students
        </span>
        <span>
          <Receipt size={15} /> Next receipt: RCPT-{new Date().getFullYear()}-
          {String(db.settings.receiptCounter + 1).padStart(4, '0')}
        </span>
        <button type="button" className="text-link" onClick={onAddTerm}>
          Start a new term <ArrowUpRight size={14} />
        </button>
      </div>
    </div>
  )
}
