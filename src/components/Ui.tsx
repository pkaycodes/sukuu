import { useEffect, useId, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

export function Modal({
  title,
  eyebrow,
  children,
  onClose,
  size = 'normal',
}: {
  title: string
  eyebrow?: string
  children: ReactNode
  onClose: () => void
  size?: 'normal' | 'wide' | 'receipt'
}) {
  const titleId = useId()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        className={`modal modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="modal__head">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h2 id={titleId}>{title}</h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
      </section>
    </div>
  )
}

export function Toast({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div className="toast" role="status">
      <span>{message}</span>
      <button type="button" onClick={onDismiss} aria-label="Dismiss notification">
        <X size={15} />
      </button>
    </div>
  )
}

export function ConfirmDialog({
  title,
  body,
  confirmLabel,
  onConfirm,
  onClose,
  destructive = false,
}: {
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onClose: () => void
  destructive?: boolean
}) {
  return (
    <Modal title={title} eyebrow="Please confirm" onClose={onClose}>
      <p className="dialog-copy">{body}</p>
      <div className="modal-actions">
        <button type="button" className="btn btn--quiet" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className={destructive ? 'btn btn--danger' : 'btn btn--primary'}
          onClick={onConfirm}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

export function ProgressBar({
  value,
  tone = 'green',
  label,
}: {
  value: number
  tone?: 'green' | 'gold' | 'ink'
  label: string
}) {
  return (
    <div
      className={`progress progress--${tone}`}
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.min(100, Math.max(0, Math.round(value)))}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  body,
  action,
}: {
  icon: ReactNode
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="empty">
      <div className="empty__icon">{icon}</div>
      <h3>{title}</h3>
      <p>{body}</p>
      {action ? <div className="empty__action">{action}</div> : null}
    </div>
  )
}

export function StatCard({
  label,
  value,
  detail,
  tone = 'paper',
  icon,
}: {
  label: string
  value: string
  detail: string
  tone?: 'paper' | 'green' | 'gold' | 'ink'
  icon: ReactNode
}) {
  return (
    <article className={`stat stat--${tone}`}>
      <div className="stat__top">
        <span>{label}</span>
        <span className="stat__icon">{icon}</span>
      </div>
      <strong>{value}</strong>
      <p>{detail}</p>
    </article>
  )
}
