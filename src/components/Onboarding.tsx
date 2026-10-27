import { useState, type FormEvent } from 'react'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react'
import type { Currency } from '../types'
import { CURRENCY_LABELS } from '../lib/options'
import { academicYearFor, defaultDueDate, defaultStartDate } from '../lib/dates'

export interface StartInput {
  schoolName: string
  ownerName: string
  currency: Currency
  termLabel: string
  academicYear: string
  startDate: string
  dueDate: string
}

export function Onboarding({
  onStart,
  onSample,
  storageError,
}: {
  onStart: (input: StartInput) => { ok: boolean; error?: string }
  onSample: () => void
  storageError: string | null
}) {
  const [schoolName, setSchoolName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [currency, setCurrency] = useState<Currency>('GHS')
  const [termLabel, setTermLabel] = useState('Term 1')
  const [academicYear, setAcademicYear] = useState(academicYearFor())
  const [startDate, setStartDate] = useState(defaultStartDate())
  const [dueDate, setDueDate] = useState(defaultDueDate())
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const result = onStart({
      schoolName,
      ownerName,
      currency,
      termLabel,
      academicYear,
      startDate,
      dueDate,
    })
    if (!result.ok) setError(result.error ?? 'Check the details and try again.')
  }

  return (
    <main className="onboarding">
      <section className="onboarding__story">
        <div className="story__grain" aria-hidden="true" />
        <div className="brand brand--light">
          <span className="brand__mark">
            <GraduationCap size={22} />
          </span>
          <span>
            sukuu<span className="brand__dot">.</span>
          </span>
        </div>

        <div className="story__copy">
          <p className="eyebrow eyebrow--gold">School fees, without the chase</p>
          <h1>
            Every term.
            <br />
            Every child.
            <br />
            <em>In order.</em>
          </h1>
          <p className="story__lede">
            Sukuu is a calm fee ledger for small schools. Know what was billed,
            what has come in, and who still needs a gentle reminder — on one phone,
            without a spreadsheet.
          </p>
          <div className="story__points">
            <span>
              <CheckCircle2 size={15} /> Class fees and scholarships
            </span>
            <span>
              <CheckCircle2 size={15} /> Receipts for every payment
            </span>
            <span>
              <CheckCircle2 size={15} /> Works offline, stays private
            </span>
          </div>
        </div>

        <div className="story__slip" aria-label="Example receipt">
          <div className="story__slip-top">
            <span>RIDGEVIEW ACADEMY</span>
            <span>RCPT-2026-1008</span>
          </div>
          <p className="story__slip-label">Term 1 · 2026/27</p>
          <div className="story__slip-row">
            <span>Ama Mensah</span>
            <strong>GH₵300.00</strong>
          </div>
          <div className="story__slip-line" />
          <div className="story__slip-foot">
            <span>Balance</span>
            <strong>GH₵150.00</strong>
            <span className="stamp">PAID</span>
          </div>
        </div>

        <p className="story__foot">
          <ShieldCheck size={14} /> Your records stay in this browser.
        </p>
      </section>

      <section className="onboarding__panel">
        <div className="onboarding__inner">
          <div className="onboarding__top">
            <span className="onboarding__step">Set up in two minutes</span>
            <span className="sample-badge">
              <Sparkles size={12} /> No account needed
            </span>
          </div>

          <div className="onboarding__head">
            <p className="eyebrow">Your school</p>
            <h2>Start the fee book.</h2>
            <p>
              Add the school and the first term. You can add classes and students
              straight after.
            </p>
          </div>

          {storageError ? (
            <p className="notice notice--warn" role="alert">
              {storageError}
            </p>
          ) : null}

          <form className="form-stack" onSubmit={handleSubmit}>
            <div className="field-grid">
              <label className="field field--full">
                <span>School name</span>
                <input
                  value={schoolName}
                  onChange={(event) => setSchoolName(event.target.value)}
                  placeholder="e.g. Ridgeview Academy"
                  autoComplete="organization"
                  required
                />
              </label>
              <label className="field">
                <span>Your name</span>
                <input
                  value={ownerName}
                  onChange={(event) => setOwnerName(event.target.value)}
                  placeholder="e.g. Adjoa Bediako"
                  autoComplete="name"
                  required
                />
              </label>
              <label className="field">
                <span>Currency</span>
                <select
                  value={currency}
                  onChange={(event) => setCurrency(event.target.value as Currency)}
                >
                  {Object.entries(CURRENCY_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="form-divider">
              <span>
                <BookOpen size={14} /> First term
              </span>
            </div>

            <div className="field-grid">
              <label className="field">
                <span>Term name</span>
                <input
                  value={termLabel}
                  onChange={(event) => setTermLabel(event.target.value)}
                  placeholder="Term 1"
                  required
                />
              </label>
              <label className="field">
                <span>Academic year</span>
                <input
                  value={academicYear}
                  onChange={(event) => setAcademicYear(event.target.value)}
                  placeholder="2026/27"
                  required
                />
              </label>
              <label className="field">
                <span>Term starts</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  required
                />
              </label>
              <label className="field">
                <span>Fees due</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                  required
                />
              </label>
            </div>

            {error ? (
              <p className="form-error" role="alert">
                {error}
              </p>
            ) : null}

            <button type="submit" className="btn btn--primary btn--large">
              Open my fee book <ArrowRight size={17} />
            </button>
          </form>

          <div className="onboarding__sample">
            <div>
              <strong>Just looking?</strong>
              <span>Open a fully populated sample school.</span>
            </div>
            <button type="button" className="btn btn--quiet" onClick={onSample}>
              <Users size={15} /> Explore sample
            </button>
          </div>

          <p className="onboarding__privacy">
            No sign-up, no server, no analytics. Sukuu is a local-first app — export a
            backup before moving to another device.
          </p>
        </div>
      </section>
    </main>
  )
}
