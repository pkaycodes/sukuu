import { useRef, useState, type FormEvent } from 'react'
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileJson,
  FileSpreadsheet,
  RotateCcw,
  Save,
  Sparkles,
  Upload,
} from 'lucide-react'
import type { Currency, Database, Term } from '../types'
import { exportBackup, exportPaymentsCsv, exportStudentsCsv } from '../lib/export'
import { CURRENCY_LABELS } from '../lib/options'

export function Settings({
  db,
  term,
  onUpdateSettings,
  onUpdateTerm,
  onAddTerm,
  onImport,
  onReset,
  onLoadSample,
}: {
  db: Database
  term: Term
  onUpdateSettings: (patch: {
    schoolName: string
    ownerName: string
    currency: Currency
  }) => { ok: boolean; error?: string }
  onUpdateTerm: (
    termId: string,
    patch: Pick<Term, 'label' | 'academicYear' | 'startDate' | 'dueDate'>,
  ) => { ok: boolean; error?: string }
  onAddTerm: () => void
  onImport: (text: string) => { ok: boolean; error?: string }
  onReset: () => void
  onLoadSample: () => void
}) {
  const [schoolName, setSchoolName] = useState(db.settings.schoolName)
  const [ownerName, setOwnerName] = useState(db.settings.ownerName)
  const [currency, setCurrency] = useState<Currency>(db.settings.currency)
  const [termLabel, setTermLabel] = useState(term.label)
  const [academicYear, setAcademicYear] = useState(term.academicYear)
  const [startDate, setStartDate] = useState(term.startDate)
  const [dueDate, setDueDate] = useState(term.dueDate)
  const [schoolMessage, setSchoolMessage] = useState<string | null>(null)
  const [termMessage, setTermMessage] = useState<string | null>(null)
  const [dataMessage, setDataMessage] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function saveSchool(event: FormEvent) {
    event.preventDefault()
    const result = onUpdateSettings({ schoolName, ownerName, currency })
    setSchoolMessage(result.ok ? 'School details saved.' : (result.error ?? 'Could not save.'))
  }

  function saveTerm(event: FormEvent) {
    event.preventDefault()
    const result = onUpdateTerm(term.id, { label: termLabel, academicYear, startDate, dueDate })
    setTermMessage(result.ok ? 'Term details saved.' : (result.error ?? 'Could not save.'))
  }

  async function handleImport(file: File | undefined) {
    if (!file) return
    try {
      const text = await file.text()
      const result = onImport(text)
      setDataMessage(result.ok ? 'Backup imported. Your fee book is now this school.' : (result.error ?? 'Could not import.'))
    } catch {
      setDataMessage('That file could not be read.')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Settings</p>
          <h1>The school office.</h1>
          <p className="page-head__lede">
            School details, the current term and your data. Everything lives in this
            browser until you export it.
          </p>
        </div>
        <div className="page-head__actions">
          <button type="button" className="btn btn--quiet" onClick={onAddTerm}>
            <Sparkles size={15} /> Start a new term
          </button>
        </div>
      </header>

      <div className="settings-grid">
        <section className="card settings-card">
          <div className="card-head">
            <div>
              <p className="eyebrow">Profile</p>
              <h2>School details</h2>
            </div>
          </div>
          <form className="form-stack" onSubmit={saveSchool}>
            <div className="field-grid">
              <label className="field field--full">
                <span>School name</span>
                <input value={schoolName} onChange={(event) => setSchoolName(event.target.value)} />
              </label>
              <label className="field">
                <span>School owner</span>
                <input value={ownerName} onChange={(event) => setOwnerName(event.target.value)} />
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
            {schoolMessage ? <p className="form-note">{schoolMessage}</p> : null}
            <button type="submit" className="btn btn--primary">
              <Save size={15} /> Save school details
            </button>
          </form>
        </section>

        <section className="card settings-card">
          <div className="card-head">
            <div>
              <p className="eyebrow">Current term</p>
              <h2>Term details</h2>
            </div>
          </div>
          <form className="form-stack" onSubmit={saveTerm}>
            <div className="field-grid">
              <label className="field">
                <span>Term name</span>
                <input value={termLabel} onChange={(event) => setTermLabel(event.target.value)} />
              </label>
              <label className="field">
                <span>Academic year</span>
                <input value={academicYear} onChange={(event) => setAcademicYear(event.target.value)} />
              </label>
              <label className="field">
                <span>Starts</span>
                <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
              </label>
              <label className="field">
                <span>Fees due</span>
                <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
              </label>
            </div>
            {termMessage ? <p className="form-note">{termMessage}</p> : null}
            <button type="submit" className="btn btn--primary">
              <Save size={15} /> Save term details
            </button>
          </form>
        </section>
      </div>

      <section className="card settings-card">
        <div className="card-head">
          <div>
            <p className="eyebrow">Your data</p>
            <h2>Back up, export, restore</h2>
          </div>
          <span className="pill pill--green">
            <CheckCircle2 size={12} /> Local only
          </span>
        </div>
        <div className="data-actions">
          <button type="button" className="data-action" onClick={() => exportBackup(db)}>
            <span className="data-action__icon">
              <FileJson size={19} />
            </span>
            <span>
              <strong>Download backup</strong>
              <small>Every student, fee and payment as JSON.</small>
            </span>
            <Download size={16} />
          </button>
          <button type="button" className="data-action" onClick={() => exportStudentsCsv(db)}>
            <span className="data-action__icon">
              <FileSpreadsheet size={19} />
            </span>
            <span>
              <strong>Student balances CSV</strong>
              <small>For Excel, Sheets or the school office.</small>
            </span>
            <Download size={16} />
          </button>
          <button type="button" className="data-action" onClick={() => exportPaymentsCsv(db)}>
            <span className="data-action__icon">
              <FileSpreadsheet size={19} />
            </span>
            <span>
              <strong>Payments CSV</strong>
              <small>All receipts recorded this term.</small>
            </span>
            <Download size={16} />
          </button>
          <button type="button" className="data-action" onClick={() => fileRef.current?.click()}>
            <span className="data-action__icon">
              <Upload size={19} />
            </span>
            <span>
              <strong>Restore a backup</strong>
              <small>Replaces the fee book on this device.</small>
            </span>
            <Upload size={16} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            aria-label="Choose a Sukuu backup"
            onChange={(event) => void handleImport(event.target.files?.[0])}
          />
        </div>
        {dataMessage ? <p className="form-note">{dataMessage}</p> : null}
        <p className="settings-note">
          Sukuu never sends your school data anywhere. A browser data reset or a new
          device needs a backup. Keep the JSON file somewhere safe.
        </p>
      </section>

      <section className="card settings-card settings-card--danger">
        <div className="card-head">
          <div>
            <p className="eyebrow">Careful</p>
            <h2>Replace or clear the book</h2>
          </div>
          <AlertTriangle size={19} />
        </div>
        <p className="dialog-copy">
          Loading the sample replaces the current school. Clearing removes every
          student and receipt from this browser. Export a backup first.
        </p>
        <div className="settings-danger-actions">
          <button type="button" className="btn btn--quiet" onClick={onLoadSample}>
            <Sparkles size={15} /> Load sample school
          </button>
          <button type="button" className="btn btn--danger" onClick={onReset}>
            <RotateCcw size={15} /> Clear this device
          </button>
        </div>
      </section>

      <p className="settings-version">Sukuu 1.0 · built by Mejo Labs · local-first, always.</p>
    </div>
  )
}
