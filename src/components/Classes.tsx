import { ArrowRight, BookOpen, Pencil, Plus, Users, Wallet } from 'lucide-react'
import type { Database, Term } from '../types'
import { classSummaries } from '../lib/calc'
import { formatMoney } from '../lib/money'
import { EmptyState, ProgressBar } from './Ui'

export function Classes({
  db,
  term,
  onAdd,
  onEdit,
  onViewStudents,
}: {
  db: Database
  term: Term
  onAdd: () => void
  onEdit: (id: string) => void
  onViewStudents: () => void
}) {
  const rows = classSummaries(db, term.id)

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Classes &amp; fees · {term.label}</p>
          <h1>Set the term fee.</h1>
          <p className="page-head__lede">
            One fee per class, with a per-student discount when a family needs it.
            New students are billed automatically.
          </p>
        </div>
        <div className="page-head__actions">
          <button type="button" className="btn btn--primary" onClick={onAdd}>
            <Plus size={16} /> Add class
          </button>
        </div>
      </header>

      <p className="info-strip">
        <BookOpen size={16} />
        Changing a class fee applies to new students and new terms. Charges already
        recorded for {term.label} stay exactly as they were.
      </p>

      {rows.length === 0 ? (
        <section className="card">
          <EmptyState
            icon={<BookOpen size={22} />}
            title="No classes yet"
            body="Add the classes in your school and the term fee for each one. You can add students straight after."
            action={
              <button type="button" className="btn btn--primary" onClick={onAdd}>
                <Plus size={15} /> Add the first class
              </button>
            }
          />
        </section>
      ) : (
        <div className="class-grid">
          {rows.map((row, index) => {
            const rate = row.billedMinor > 0 ? (row.paidMinor / row.billedMinor) * 100 : 0
            return (
              <article className="class-card" key={row.classRoom.id}>
                <div className="class-card__top">
                  <span className="class-card__no">{String(index + 1).padStart(2, '0')}</span>
                  <button
                    type="button"
                    className="icon-btn"
                    onClick={() => onEdit(row.classRoom.id)}
                    aria-label={`Edit ${row.classRoom.name}`}
                  >
                    <Pencil size={16} />
                  </button>
                </div>
                <h2>{row.classRoom.name}</h2>
                <p className="class-card__fee">
                  {formatMoney(row.classRoom.feeMinor, db.settings.currency)}
                  <span> per term</span>
                </p>
                <div className="class-card__stats">
                  <span>
                    <Users size={14} /> {row.students} {row.students === 1 ? 'student' : 'students'}
                  </span>
                  <span>
                    <Wallet size={14} /> {formatMoney(row.outstandingMinor, db.settings.currency)} left
                  </span>
                </div>
                <div className="class-card__progress">
                  <div>
                    <span>{formatMoney(row.paidMinor, db.settings.currency)} collected</span>
                    <strong>{Math.round(rate)}%</strong>
                  </div>
                  <ProgressBar
                    value={rate}
                    tone={rate >= 90 ? 'green' : rate >= 50 ? 'gold' : 'ink'}
                    label={`${row.classRoom.name} fee collection`}
                  />
                </div>
              </article>
            )
          })}
        </div>
      )}

      <div className="page-foot-note">
        <span>Need to see the students behind these numbers?</span>
        <button type="button" className="text-link" onClick={onViewStudents}>
          Open the student book <ArrowRight size={14} />
        </button>
      </div>
    </div>
  )
}
