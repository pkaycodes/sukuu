import { describe, expect, it } from 'vitest'
import { createSampleDb, createStarterDb } from './sample'
import { loadDb, parseBackup, saveDb, STORAGE_KEY, validateDatabase } from './storage'

describe('local database validation', () => {
  it('accepts a sample database and a fresh school', () => {
    expect(validateDatabase(createSampleDb()).ok).toBe(true)
    const starter = createStarterDb({
      schoolName: 'Little Stars',
      ownerName: 'Akua Mensah',
      currency: 'GHS',
      termLabel: 'Term 1',
      academicYear: '2026/27',
      startDate: '2026-09-01',
      dueDate: '2026-12-01',
    })
    expect(validateDatabase(starter).ok).toBe(true)
  })

  it('rejects malformed or inconsistent data', () => {
    expect(validateDatabase(null).ok).toBe(false)
    expect(validateDatabase({ version: 2 }).ok).toBe(false)
    const db = createSampleDb()
    const broken = {
      ...db,
      billings: [{ ...db.billings[0], studentId: 'missing_student' }],
    }
    const result = validateDatabase(broken)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/missing/i)
  })

  it('rejects duplicate fee records for the same term and student', () => {
    const db = createSampleDb()
    const duplicate = {
      ...db,
      billings: [...db.billings, { ...db.billings[0], id: 'bil_duplicate' }],
    }
    const result = validateDatabase(duplicate)
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toMatch(/two fee records|duplicate/i)
  })

  it('round-trips through localStorage', () => {
    const db = createSampleDb()
    expect(saveDb(db)).toBeNull()
    const loaded = loadDb()
    expect(loaded.error).toBeNull()
    expect(loaded.db?.settings.schoolName).toBe('Ridgeview Academy')
    expect(localStorage.getItem(STORAGE_KEY)).toContain('Ridgeview')
  })

  it('returns a helpful error for an unreadable backup', () => {
    const result = parseBackup('{not json')
    expect(result.db).toBeNull()
    expect(result.error).toMatch(/not valid JSON/i)
  })

  it('parses a valid exported backup', () => {
    const db = createSampleDb()
    const result = parseBackup(JSON.stringify(db))
    expect(result.error).toBeNull()
    expect(result.db?.students).toHaveLength(12)
  })
})
