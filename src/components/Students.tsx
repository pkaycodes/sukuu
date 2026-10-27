import { useMemo, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Plus,
  Search,
  SlidersHorizontal,
  Users,
  Wallet,
} from 'lucide-react'
import type { Database, StudentAccount, Term } from '../types'
import { accountsFor } from '../lib/calc'
import { formatMoney } from '../lib/money'
import { EmptyState } from './Ui'

type Filter = 'all' | 'owing' | 'paid' | 'left'

function accountState(account: StudentAccount): Filter {
  if (account.student.status === 'left') return 'left'
  if (account.chargeMinor > 0 && account.balanceMinor === 0) return 'paid'
  if (account.balanceMinor > 0) return 'owing'
  return 'all'
}

function stateLabel(account: StudentAccount) {
  if (account.student.status === 'left') return 'Left'
  if (account.chargeMinor === 0) return 'No fee'
  if (account.balanceMinor === 0) return 'Paid'
  return 'Owing'
}

export function Students({
  db,
  term,
  onOpen,
  onAdd,
}: {
  db: Database
  term: Term
  onOpen: (id: string) => void
  onAdd: () => void
}) {
  const [query, setQuery] = useState('')
  const [classId, setClassId] = useState('all')
  const [filter, setFilter] = useState<Filter>('all')
  const accounts = accountsFor(db, term.id)
  const classes = db.classes

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return accounts.filter((account) => {
      if (classId !== 'all' && account.student.classId !== classId) return false
      if (filter !== 'all' && accountState(account) !== filter) return false
      if (!needle) return true
      return [
        account.student.name,
        account.student.studentNumber,
        account.student.guardianName,
        account.student.guardianPhone,
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    })
  }, [accounts, classId, filter, query])

  const owing = accounts.filter((account) => account.balanceMinor > 0)
  const collected = accounts.reduce((sum, account) => sum + account.paidMinor, 0)
  const outstanding = owing.reduce((sum, account) => sum + account.balanceMinor, 0)

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Students · {term.label}</p>
          <h1>The student book.</h1>
          <p className="page-head__lede">
            {accounts.length} students on the fee book. {owing.length} still have a balance.
          </p>
        </div>
        <div className="page-head__actions">
          <button type="button" className="btn btn--primary" onClick={onAdd}>
            <Plus size={16} /> Add student
          </button>
        </div>
      </header>

      <div className="mini-stats">
        <div>
          <span>
            <Users size={15} /> On the book
          </span>
          <strong>{accounts.length}</strong>
        </div>
        <div>
          <span>
            <CheckCircle2 size={15} /> Collected
          </span>
          <strong>{formatMoney(collected, db.settings.currency)}</strong>
        </div>
        <div>
          <span>
            <Wallet size={15} /> Outstanding
          </span>
          <strong>{formatMoney(outstanding, db.settings.currency)}</strong>
        </div>
      </div>

      <section className="card student-book">
        <div className="student-toolbar">
          <label className="search-field">
            <Search size={16} />
            <span className="sr-only">Search students</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, number or guardian"
            />
          </label>
          <label className="select-field">
            <SlidersHorizontal size={15} />
            <span className="sr-only">Filter by class</span>
            <select value={classId} onChange={(event) => setClassId(event.target.value)}>
              <option value="all">All classes</option>
              {classes.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="filter-tabs" role="tablist" aria-label="Student status">
          {(
            [
              ['all', 'All'],
              ['owing', 'Owing'],
              ['paid', 'Paid'],
              ['left', 'Left'],
            ] as [Filter, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={filter === value}
              className={filter === value ? 'is-active' : ''}
              onClick={() => setFilter(value)}
            >
              {label}
              {value === 'all' ? <span>{accounts.length}</span> : null}
              {value === 'owing' ? <span>{owing.length}</span> : null}
            </button>
          ))}
        </div>

        {accounts.length === 0 ? (
          <EmptyState
            icon={<Users size={22} />}
            title="The book is empty"
            body="Add a class first, then a student and their fee will be created automatically."
            action={
              <button type="button" className="btn btn--primary" onClick={onAdd}>
                <Plus size={15} /> Add student
              </button>
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Search size={22} />}
            title="No matches"
            body="Try another name, class or status."
            action={
              <button
                type="button"
                className="btn btn--quiet"
                onClick={() => {
                  setQuery('')
                  setClassId('all')
                  setFilter('all')
                }}
              >
                Clear filters
              </button>
            }
          />
        ) : (
          <>
            <div className="table-scroll student-table-wrap">
              <table className="data-table student-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Class</th>
                    <th>Guardian</th>
                    <th className="is-right">Fee</th>
                    <th className="is-right">Paid</th>
                    <th className="is-right">Balance</th>
                    <th>Status</th>
                    <th aria-label="Open" />
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((account) => (
                    <tr key={account.student.id}>
                      <td>
                        <button
                          type="button"
                          className="table-person table-person--button"
                          onClick={() => onOpen(account.student.id)}
                        >
                          <span className="avatar avatar--tiny">
                            {account.student.name
                              .split(' ')
                              .map((part) => part[0])
                              .slice(0, 2)
                              .join('')}
                          </span>
                          <span>
                            <strong>{account.student.name}</strong>
                            <small>{account.student.studentNumber}</small>
                          </span>
                        </button>
                      </td>
                      <td>{account.classRoom?.name ?? '—'}</td>
                      <td>
                        <span className="table-stack">
                          {account.student.guardianName || '—'}
                          <small>{account.student.guardianPhone}</small>
                        </span>
                      </td>
                      <td className="is-right mono">
                        {formatMoney(account.chargeMinor, db.settings.currency)}
                      </td>
                      <td className="is-right mono">
                        {formatMoney(account.paidMinor, db.settings.currency)}
                      </td>
                      <td className="is-right mono">
                        <strong>
                          {formatMoney(account.balanceMinor, db.settings.currency)}
                        </strong>
                      </td>
                      <td>
                        <span
                          className={`pill ${
                            accountState(account) === 'paid'
                              ? 'pill--green'
                              : accountState(account) === 'owing'
                                ? 'pill--gold'
                                : 'pill--muted'
                          }`}
                        >
                          {stateLabel(account)}
                        </span>
                      </td>
                      <td className="is-right">
                        <button
                          type="button"
                          className="row-action"
                          onClick={() => onOpen(account.student.id)}
                          aria-label={`Open ${account.student.name}`}
                        >
                          <ArrowRight size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="student-cards">
              {filtered.map((account) => (
                <button
                  key={account.student.id}
                  type="button"
                  className="student-card"
                  onClick={() => onOpen(account.student.id)}
                >
                  <span className="avatar">
                    {account.student.name
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')}
                  </span>
                  <span className="student-card__body">
                    <span className="student-card__top">
                      <strong>{account.student.name}</strong>
                      <span
                        className={`pill ${
                          accountState(account) === 'paid'
                            ? 'pill--green'
                            : accountState(account) === 'owing'
                              ? 'pill--gold'
                              : 'pill--muted'
                        }`}
                      >
                        {stateLabel(account)}
                      </span>
                    </span>
                    <small>
                      {account.classRoom?.name ?? 'No class'} ·{' '}
                      {account.student.studentNumber}
                    </small>
                    <span className="student-card__amounts">
                      <span>
                        Paid <strong>{formatMoney(account.paidMinor, db.settings.currency)}</strong>
                      </span>
                      <span>
                        Balance{' '}
                        <strong>{formatMoney(account.balanceMinor, db.settings.currency)}</strong>
                      </span>
                    </span>
                  </span>
                  <ArrowRight size={17} className="student-card__arrow" />
                </button>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}
