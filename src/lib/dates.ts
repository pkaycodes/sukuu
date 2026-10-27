export function todayISO(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function parseLocalDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`)
}

export function addDaysISO(iso: string, days: number): string {
  const date = parseLocalDate(iso)
  date.setDate(date.getDate() + days)
  return todayISO(date)
}

export function isoDaysAgo(days: number): string {
  return addDaysISO(todayISO(), -days)
}

export function isoDaysFromNow(days: number): string {
  return addDaysISO(todayISO(), days)
}

export function defaultStartDate(): string {
  return todayISO()
}

export function defaultDueDate(): string {
  return isoDaysFromNow(90)
}

export function formatDate(iso: string): string {
  return parseLocalDate(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatShortDate(iso: string): string {
  return parseLocalDate(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })
}

export function daysFromToday(iso: string): number {
  const start = parseLocalDate(todayISO()).getTime()
  const target = parseLocalDate(iso).getTime()
  return Math.round((target - start) / 86_400_000)
}

export function daysOverdue(iso: string): number {
  return Math.max(0, -daysFromToday(iso))
}

export function isOverdue(iso: string): boolean {
  return daysFromToday(iso) < 0
}

export function dateRangeLabel(start: string, due: string): string {
  return `${formatShortDate(start)} — ${formatDate(due)}`
}

export function academicYearFor(date = new Date()): string {
  const year = date.getFullYear()
  const month = date.getMonth()
  const start = month >= 8 ? year : year - 1
  return `${start}/${String(start + 1).slice(-2)}`
}

export function makeId(prefix: string): string {
  const source =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefix}_${source}`
}
