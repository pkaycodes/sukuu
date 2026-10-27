import { useEffect, useState } from 'react'
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  Plus,
  ReceiptText,
  Settings as SettingsIcon,
  Users,
  WifiOff,
} from 'lucide-react'
import type { NewStudentInput, View } from './types'
import { useSchool } from './hooks/useSchool'
import { accountsFor, currentTerm } from './lib/calc'
import { formatDate } from './lib/dates'
import { exportStudentsCsv } from './lib/export'
import { parseBackup } from './lib/storage'
import { Classes } from './components/Classes'
import { Dashboard } from './components/Dashboard'
import { Onboarding } from './components/Onboarding'
import {
  ClassFormDialog,
  PaymentFormDialog,
  ReceiptDialog,
  StudentFormDialog,
  TermFormDialog,
} from './components/Forms'
import { Payments } from './components/Payments'
import { Settings } from './components/Settings'
import { StudentDetail } from './components/StudentDetail'
import { Students } from './components/Students'
import { ConfirmDialog, Toast } from './components/Ui'

const NAV: { view: View; label: string; icon: typeof LayoutDashboard }[] = [
  { view: 'overview', label: 'Overview', icon: LayoutDashboard },
  { view: 'students', label: 'Students', icon: Users },
  { view: 'classes', label: 'Classes & fees', icon: BookOpen },
  { view: 'payments', label: 'Payments', icon: ReceiptText },
  { view: 'settings', label: 'Settings', icon: SettingsIcon },
]

const PAGE_TITLES: Record<View, string> = {
  overview: 'Overview',
  students: 'Students',
  student: 'Student',
  classes: 'Classes & fees',
  payments: 'Payments',
  settings: 'Settings',
}

type ConfirmState = 'deleteStudent' | 'reset' | 'loadSample' | null

export default function App() {
  const { db, storageError, actions } = useSchool()
  const [view, setView] = useState<View>('overview')
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [studentForm, setStudentForm] = useState<{ id?: string } | null>(null)
  const [classForm, setClassForm] = useState<{ id?: string } | null>(null)
  const [paymentForm, setPaymentForm] = useState<{ studentId?: string } | null>(null)
  const [termForm, setTermForm] = useState(false)
  const [receiptId, setReceiptId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<ConfirmState>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [online, setOnline] = useState(() => navigator.onLine)

  useEffect(() => {
    const update = () => setOnline(navigator.onLine)
    window.addEventListener('online', update)
    window.addEventListener('offline', update)
    return () => {
      window.removeEventListener('online', update)
      window.removeEventListener('offline', update)
    }
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 4200)
    return () => window.clearTimeout(timer)
  }, [toast])

  if (!db) {
    return (
      <>
        <Onboarding
          storageError={storageError}
          onStart={(input) => {
            const result = actions.setup(input)
            if (result.ok) setView('overview')
            return result
          }}
          onSample={() => {
            actions.loadSample()
            setView('overview')
          }}
        />
        {toast ? <Toast message={toast} onDismiss={() => setToast(null)} /> : null}
      </>
    )
  }

  const term = currentTerm(db)
  const termAccounts = accountsFor(db, term.id)
  const hasClasses = db.classes.length > 0
  const selectedStudent = selectedStudentId
    ? db.students.find((student) => student.id === selectedStudentId)
    : null
  const receipt = receiptId
    ? db.payments.find((payment) => payment.id === receiptId)
    : null
  const receiptTerm = receipt
    ? (db.terms.find((item) => item.id === receipt.termId) ?? term)
    : term
  const editingStudent = studentForm?.id
    ? db.students.find((student) => student.id === studentForm.id)
    : undefined
  const editingClass = classForm?.id
    ? db.classes.find((room) => room.id === classForm.id)
    : undefined

  function notify(message: string) {
    setToast(message)
  }

  function go(next: View) {
    setView(next)
    if (next !== 'student') setSelectedStudentId(null)
  }

  function openStudent(id: string) {
    setSelectedStudentId(id)
    setView('student')
  }

  function openAddStudent() {
    if (!hasClasses) {
      notify('Add a class first, then students can be billed automatically.')
      setClassForm({})
      return
    }
    setStudentForm({})
  }

  function openAddPayment(studentId?: string) {
    if (!termAccounts.some((account) => account.balanceMinor > 0)) {
      if (termAccounts.length === 0) {
        notify('Add a student first so there is a fee to collect.')
      } else {
        notify('Everyone on the book is paid up for this term.')
      }
      return
    }
    setPaymentForm({ studentId })
  }

  function saveStudent(input: NewStudentInput) {
    if (studentForm?.id) {
      const result = actions.updateStudent(studentForm.id, input)
      if (result.ok) notify('Student updated.')
      return result
    }
    const result = actions.addStudent(input)
    if (result.ok) notify('Student added and billed for this term.')
    return result
  }

  function deleteStudent() {
    if (!selectedStudentId) return
    const name = selectedStudent?.name ?? 'Student'
    actions.removeStudent(selectedStudentId)
    setConfirm(null)
    setSelectedStudentId(null)
    setView('students')
    notify(`${name} and their records were removed.`)
  }

  function clearDevice() {
    actions.reset()
    setConfirm(null)
    setView('overview')
  }

  function loadSample() {
    actions.loadSample()
    setConfirm(null)
    setView('overview')
    notify('Sample school loaded. Explore freely — nothing leaves this browser.')
  }

  function importBackup(text: string) {
    const result = parseBackup(text)
    if (!result.db) return { ok: false as const, error: result.error ?? 'Could not read the backup.' }
    actions.importDatabase(result.db)
    setView('overview')
    notify('Backup restored.')
    return { ok: true as const }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <span className="brand__mark">
            <GraduationCap size={21} />
          </span>
          <span className="brand__word">
            sukuu<span>.</span>
          </span>
        </div>

        <div className="school-card">
          <span className="school-card__label">Fee book for</span>
          <strong>{db.settings.schoolName}</strong>
          <small>{db.settings.ownerName || 'School office'}</small>
          {db.settings.isDemo ? <span className="demo-tag">Sample school</span> : null}
        </div>

        <nav className="side-nav" aria-label="Main navigation">
          {NAV.map(({ view: item, label, icon: Icon }) => (
            <button
              key={item}
              type="button"
              className={view === item || (item === 'students' && view === 'student') ? 'is-active' : ''}
              onClick={() => go(item)}
            >
              <Icon size={18} strokeWidth={1.8} />
              <span>{label}</span>
              {item === 'students' && termAccounts.length > 0 ? (
                <small>{termAccounts.length}</small>
              ) : null}
            </button>
          ))}
        </nav>

        <div className="sidebar-term">
          <div className="sidebar-term__head">
            <span>Current term</span>
            <span className="status-dot" />
          </div>
          <strong>{term.label}</strong>
          <small>
            {term.academicYear} · due {formatDate(term.dueDate)}
          </small>
          <button type="button" className="sidebar-term__new" onClick={() => setTermForm(true)}>
            <Plus size={13} /> Start a new term
          </button>
        </div>

        <div className="sidebar__foot">
          <div className={`offline-pill ${online ? '' : 'is-offline'}`}>
            {online ? <span className="online-dot" /> : <WifiOff size={12} />}
            {online ? 'Saved on this device' : 'Offline — still working'}
          </div>
          <small>Local-first by Mejo Labs</small>
        </div>
      </aside>

      <div className="workspace">
        <header className="topbar">
          <div className="topbar__title">
            <span className="mobile-brand">
              <GraduationCap size={19} /> sukuu
            </span>
            <span className="crumb">{db.settings.schoolName}</span>
            <span className="crumb-sep">/</span>
            <strong>{PAGE_TITLES[view]}</strong>
          </div>
          <div className="topbar__actions">
            <label className="term-switch">
              <CalendarDays size={15} />
              <span className="sr-only">Current term</span>
              <select
                value={term.id}
                onChange={(event) => {
                  actions.setCurrentTerm(event.target.value)
                  setView('overview')
                  setSelectedStudentId(null)
                  notify('Term switched.')
                }}
              >
                {db.terms.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label} · {item.academicYear}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} />
            </label>
            <button type="button" className="btn btn--primary topbar__pay" onClick={() => openAddPayment()}>
              <Plus size={16} />
              <span>Record payment</span>
            </button>
          </div>
        </header>

        <main className="main">
          {storageError ? (
            <p className="notice notice--warn shell-notice" role="alert">
              {storageError}
            </p>
          ) : null}

          {view === 'overview' ? (
            <Dashboard
              db={db}
              term={term}
              onOpenStudent={openStudent}
              onAddPayment={openAddPayment}
              onAddStudent={openAddStudent}
              onAddClass={() => setClassForm({})}
              onAddTerm={() => setTermForm(true)}
              onOpenPayments={() => go('payments')}
              onExport={() => {
                exportStudentsCsv(db)
                notify('Student balances exported as CSV.')
              }}
            />
          ) : null}

          {view === 'students' ? (
            <Students db={db} term={term} onOpen={openStudent} onAdd={openAddStudent} />
          ) : null}

          {view === 'student' && selectedStudentId ? (
            <StudentDetail
              db={db}
              term={term}
              studentId={selectedStudentId}
              onBack={() => go('students')}
              onRecordPayment={() => openAddPayment(selectedStudentId)}
              onEdit={() => setStudentForm({ id: selectedStudentId })}
              onMarkLeft={() => {
                if (!selectedStudent) return
                actions.setStudentStatus(
                  selectedStudent.id,
                  selectedStudent.status === 'left' ? 'active' : 'left',
                )
                notify(
                  selectedStudent.status === 'left'
                    ? `${selectedStudent.name} marked active.`
                    : `${selectedStudent.name} marked as left. Their balance stays on record.`,
                )
              }}
              onDelete={() => setConfirm('deleteStudent')}
              onOpenReceipt={setReceiptId}
            />
          ) : null}

          {view === 'classes' ? (
            <Classes
              db={db}
              term={term}
              onAdd={() => setClassForm({})}
              onEdit={(id) => setClassForm({ id })}
              onViewStudents={() => go('students')}
            />
          ) : null}

          {view === 'payments' ? (
            <Payments
              db={db}
              term={term}
              onAdd={() => openAddPayment()}
              onOpenStudent={openStudent}
              onOpenReceipt={setReceiptId}
            />
          ) : null}

          {view === 'settings' ? (
            <Settings
              key={`${db.settings.schoolName}-${term.id}`}
              db={db}
              term={term}
              onUpdateSettings={(patch) => actions.updateSettings(patch)}
              onUpdateTerm={(termId, patch) => actions.updateTerm(termId, patch)}
              onAddTerm={() => setTermForm(true)}
              onImport={importBackup}
              onReset={() => setConfirm('reset')}
              onLoadSample={() => setConfirm('loadSample')}
            />
          ) : null}
        </main>

        <nav className="mobile-nav" aria-label="Main navigation">
          {NAV.map(({ view: item, label, icon: Icon }) => (
            <button
              key={item}
              type="button"
              className={view === item || (item === 'students' && view === 'student') ? 'is-active' : ''}
              onClick={() => go(item)}
            >
              <Icon size={19} />
              <span>{label === 'Classes & fees' ? 'Classes' : label}</span>
            </button>
          ))}
        </nav>
      </div>

      {toast ? <Toast message={toast} onDismiss={() => setToast(null)} /> : null}

      {studentForm ? (
        <StudentFormDialog
          db={db}
          term={term}
          initial={editingStudent}
          onClose={() => setStudentForm(null)}
          onSave={saveStudent}
        />
      ) : null}

      {classForm ? (
        <ClassFormDialog
          initial={editingClass}
          onClose={() => setClassForm(null)}
          onSave={(input) => {
            if (classForm.id) {
              const result = actions.updateClass(classForm.id, input)
              if (result.ok) notify('Class fee updated for future charges.')
              return result
            }
            const result = actions.addClass(input)
            if (result.ok) notify('Class added. Add students to bill them.')
            return result
          }}
        />
      ) : null}

      {paymentForm ? (
        <PaymentFormDialog
          db={db}
          term={term}
          initialStudentId={paymentForm.studentId}
          onClose={() => setPaymentForm(null)}
          onSave={(input) => {
            const result = actions.recordPayment(input)
            return result.ok ? { ok: true, id: result.value } : result
          }}
          onSaved={(paymentId) => {
            setPaymentForm(null)
            setReceiptId(paymentId)
            notify('Payment recorded. Receipt ready.')
          }}
        />
      ) : null}

      {termForm ? (
        <TermFormDialog
          db={db}
          onClose={() => setTermForm(false)}
          onSave={(input) => {
            const result = actions.addTerm(input)
            if (result.ok) {
              setView('overview')
              notify('New term created and set as current.')
              return { ok: true }
            }
            return result
          }}
        />
      ) : null}

      {receipt ? (
        <ReceiptDialog
          db={db}
          term={receiptTerm}
          payment={receipt}
          onClose={() => setReceiptId(null)}
        />
      ) : null}

      {confirm === 'deleteStudent' ? (
        <ConfirmDialog
          title="Delete this student?"
          body={`This removes ${selectedStudent?.name ?? 'the student'}, their fee records and every payment receipt for them from this device. It cannot be undone.`}
          confirmLabel="Delete student"
          destructive
          onConfirm={deleteStudent}
          onClose={() => setConfirm(null)}
        />
      ) : null}

      {confirm === 'reset' ? (
        <ConfirmDialog
          title="Clear this device?"
          body="Every class, student and payment in this browser will be removed. Export a backup first if you might need the records."
          confirmLabel="Clear the fee book"
          destructive
          onConfirm={clearDevice}
          onClose={() => setConfirm(null)}
        />
      ) : null}

      {confirm === 'loadSample' ? (
        <ConfirmDialog
          title="Load the sample school?"
          body="The current fee book on this device will be replaced by Ridgeview Academy and its 12 sample students. Export a backup first if you need these records."
          confirmLabel="Load sample"
          destructive
          onConfirm={loadSample}
          onClose={() => setConfirm(null)}
        />
      ) : null}
    </div>
  )
}
