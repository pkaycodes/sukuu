import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import App from './App'
import { termSummary } from './lib/calc'
import { formatMoney } from './lib/money'
import { createSampleDb } from './lib/sample'
import { STORAGE_KEY } from './lib/storage'

describe('Sukuu app', () => {
  beforeEach(() => {
    localStorage.clear()
    window.history.replaceState({}, '', '/')
  })

  it('loads the sample school directly from a demo link', async () => {
    window.history.replaceState({}, '', '/?demo=1')
    render(<App />)
    expect(await screen.findAllByText('Ridgeview Academy')).not.toHaveLength(0)
    expect(screen.getAllByText('Sample school').length).toBeGreaterThan(0)
  })

  it('starts a new school, adds a class and student, then records a payment', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(screen.getByRole('heading', { name: /Every term/i })).toBeInTheDocument()
    await user.type(screen.getByLabelText('School name'), 'Little Stars Academy')
    await user.type(screen.getByLabelText('Your name'), 'Akua Mensah')
    await user.click(screen.getByRole('button', { name: /Open my fee book/i }))

    expect(await screen.findByText(/open the fee book/i)).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: /Add a class/i })[0])
    await user.type(screen.getByLabelText('Class name'), 'Primary 1')
    await user.type(screen.getByLabelText('Term fee'), '450')
    await user.click(screen.getByRole('button', { name: /^Add class$/i }))

    await user.click(screen.getAllByRole('button', { name: /Add a student/i })[0])
    await user.type(screen.getByLabelText('Student name'), 'Kofi Mensah')
    await user.type(screen.getByLabelText('Guardian name'), 'Akua Mensah')
    await user.type(screen.getByLabelText('Guardian phone'), '+233 24 000 0000')
    await user.click(screen.getByRole('button', { name: /^Add student$/i }))

    expect(await screen.findAllByText('GH₵450.00')).not.toHaveLength(0)
    expect(screen.getByText(/0 of 1 paid in full/i)).toBeInTheDocument()

    await user.click(screen.getAllByRole('button', { name: /^Record payment$/i })[0])
    expect(await screen.findByRole('heading', { name: /Record a payment/i })).toBeInTheDocument()
    expect(screen.getByLabelText('Amount received')).toHaveValue('450.00')
    await user.click(screen.getByRole('button', { name: /Save & issue receipt/i }))

    expect(await screen.findByRole('heading', { name: /^Receipt$/i })).toBeInTheDocument()
    expect(screen.getAllByText(/RCPT-/).length).toBeGreaterThan(0)
    expect(screen.getByText('PAID')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^Close$/i }))
    await waitFor(() => expect(screen.queryByRole('heading', { name: /^Receipt$/i })).not.toBeInTheDocument())
    expect(await screen.findByText(/1 of 1 paid in full/i)).toBeInTheDocument()
    expect(localStorage.getItem(STORAGE_KEY)).toContain('Little Stars Academy')
  })

  it('opens the sample school, filters students and shows a full account', async () => {
    const db = createSampleDb()
    const summary = termSummary(db, db.settings.currentTermId)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
    const user = userEvent.setup()
    render(<App />)

    expect(await screen.findAllByText('Ridgeview Academy')).not.toHaveLength(0)
    expect(screen.getAllByText(formatMoney(summary.billedMinor, 'GHS')).length).toBeGreaterThan(0)

    const sidebar = screen.getAllByRole('navigation', { name: 'Main navigation' })[0]
    await user.click(within(sidebar).getByRole('button', { name: /Students/i }))
    expect(await screen.findByRole('heading', { name: /The student book/i })).toBeInTheDocument()

    const search = screen.getByPlaceholderText(/Search name, number or guardian/i)
    await user.type(search, 'Yaa')
    expect(screen.getAllByText('Yaa Owusu').length).toBeGreaterThan(0)
    expect(screen.queryByText('Ama Mensah')).not.toBeInTheDocument()

    await user.clear(search)
    await user.click(screen.getAllByRole('button', { name: /Ama Mensah/i })[0])
    expect(await screen.findByRole('heading', { name: 'Ama Mensah' })).toBeInTheDocument()
    expect(screen.getByText(/WhatsApp reminder/i)).toBeInTheDocument()
    expect(screen.getAllByText('GH₵150.00').length).toBeGreaterThan(0)
  })

  it('rejects a payment larger than the remaining balance', async () => {
    const db = createSampleDb()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
    const user = userEvent.setup()
    render(<App />)

    await user.click((await screen.findAllByRole('button', { name: /^Record payment$/i }))[0])
    const amount = screen.getByLabelText('Amount received')
    await user.clear(amount)
    await user.type(amount, '9999')
    await user.click(screen.getByRole('button', { name: /Save & issue receipt/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/more than the remaining balance/i)
    expect(screen.queryByRole('heading', { name: /^Receipt$/i })).not.toBeInTheDocument()
  })
})
