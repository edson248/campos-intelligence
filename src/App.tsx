import { useState } from 'react'
import type { Client, Section, FilterKey } from './types'
import { loadClients, saveClients, PLANS, PAY_LABEL } from './store'
import { ini, fdate, isLate, brl, nextId } from './lib'
import Clientes from './pages/Clientes'
import Financeiro from './pages/Financeiro'
import Relatorios from './pages/Relatorios'

const NAV: { key: Section; label: string }[] = [
  { key: 'clientes',   label: 'Clientes'    },
  { key: 'financeiro', label: 'Financeiro'  },
  { key: 'relatorios', label: 'Relatórios'  },
]

export default function App() {
  const [clients, setClients] = useState<Client[]>(loadClients)
  const [section, setSection] = useState<Section>('clientes')
  const [filter, setFilter] = useState<FilterKey>('todos')
  const [search, setSearch] = useState('')
  const [dropdown, setDropdown] = useState<number | null>(null)
  const [detail, setDetail] = useState<Client | null>(null)
  const [addModal, setAddModal] = useState(false)

  function mutate(updated: Client[]) {
    setClients(updated)
    saveClients(updated)
  }

  function toggleSite(id: number) {
    mutate(clients.map(c => c.id === id ? { ...c, online: !c.online } : c))
    if (detail?.id === id) setDetail(d => d ? { ...d, online: !d.online } : null)
  }

  function cyclePay(id: number) {
    const nxt = { pago: 'pendente', pendente: 'inadimplente', inadimplente: 'pago' } as const
    mutate(clients.map(c => c.id === id ? { ...c, pay: nxt[c.pay] } : c))
    if (detail?.id === id) setDetail(d => d ? { ...d, pay: nxt[d.pay] } : null)
  }

  function removeClient(id: number) {
    if (!confirm('Remover este cliente?')) return
    mutate(clients.filter(c => c.id !== id))
    setDropdown(null)
    if (detail?.id === id) setDetail(null)
  }

  function addClient(data: Omit<Client, 'id' | 'online' | 'pay' | 'since'>) {
    const newClient: Client = {
      ...data,
      id: nextId(clients.map(c => c.id)),
      online: true,
      pay: 'pendente',
      since: new Date().toISOString().split('T')[0],
    }
    mutate([...clients, newClient])
    setAddModal(false)
  }

  const ctx = {
    clients, filter, setFilter, search, setSearch,
    dropdown, setDropdown, detail, setDetail,
    addModal, setAddModal,
    toggleSite, cyclePay, removeClient, addClient,
    PLANS, PAY_LABEL, ini, fdate, isLate, brl,
  }

  function closeOverlays() {
    if (dropdown !== null) setDropdown(null)
  }

  return (
    <div onClick={closeOverlays}>
      {/* Header */}
      <header
        className="sticky top-0 z-80 h-14 flex items-center gap-5 px-5 border-b"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 shrink-0 font-bold text-[13px]">
          <div
            className="w-8 h-8 rounded-lg grid place-items-center text-xs font-extrabold text-white tracking-tight"
            style={{ background: 'var(--accent)' }}
          >CI</div>
          <span>Campos <span style={{ color: 'var(--text2)', fontWeight: 400 }}>Intelligence</span></span>
        </div>

        <nav className="flex gap-0.5">
          {NAV.map(n => (
            <button
              key={n.key}
              onClick={() => { setSection(n.key); setDetail(null); setDropdown(null) }}
              className="px-3 py-1.5 rounded-md text-[12.5px] transition-colors"
              style={{
                background: section === n.key ? 'var(--surface2)' : 'transparent',
                color: section === n.key ? 'var(--text)' : 'var(--text2)',
                fontWeight: section === n.key ? 500 : 400,
              }}
            >{n.label}</button>
          ))}
        </nav>

        <div className="ml-auto">
          <div
            className="w-8 h-8 rounded-full grid place-items-center text-xs font-bold border"
            style={{ background: 'var(--accent-dim)', color: 'var(--accent)', borderColor: 'var(--border2)' }}
          >EC</div>
        </div>
      </header>

      <main className="max-w-[1260px] mx-auto px-5 py-6">
        {section === 'clientes'   && <Clientes   {...ctx} />}
        {section === 'financeiro' && <Financeiro clients={clients} PLANS={PLANS} brl={brl} fdate={fdate} isLate={isLate} PAY_LABEL={PAY_LABEL} cyclePay={cyclePay} />}
        {section === 'relatorios' && <Relatorios clients={clients} PLANS={PLANS} brl={brl} />}
      </main>
    </div>
  )
}
