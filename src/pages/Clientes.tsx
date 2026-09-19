import { useRef } from 'react'
import type { Client, FilterKey } from '../types'
import type { PLANS as PlansType, PAY_LABEL as PayLabelType } from '../store'

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'todos',        label: 'Todos'        },
  { key: 'ativos',       label: 'Ativos'       },
  { key: 'suspensos',    label: 'Suspensos'    },
  { key: 'inadimplentes',label: 'Inadimplentes'},
]

interface Props {
  clients: Client[]
  filter: FilterKey
  setFilter: (f: FilterKey) => void
  search: string
  setSearch: (s: string) => void
  dropdown: number | null
  setDropdown: (id: number | null) => void
  detail: Client | null
  setDetail: (c: Client | null) => void
  addModal: boolean
  setAddModal: (v: boolean) => void
  toggleSite: (id: number) => void
  cyclePay: (id: number) => void
  removeClient: (id: number) => void
  addClient: (data: Omit<Client, 'id' | 'online' | 'pay' | 'since'>) => void
  PLANS: typeof PlansType
  PAY_LABEL: typeof PayLabelType
  ini: (n: string) => string
  fdate: (iso: string) => string
  isLate: (iso: string) => boolean
  brl: (n: number) => string
}

export default function Clientes(props: Props) {
  const {
    clients, filter, setFilter, search, setSearch,
    dropdown, setDropdown, detail, setDetail,
    addModal, setAddModal,
    toggleSite, cyclePay, removeClient, addClient,
    PLANS, PAY_LABEL, ini, fdate, isLate, brl,
  } = props

  const stats = {
    total: clients.length,
    active: clients.filter(c => c.online).length,
    pend: clients.filter(c => c.pay === 'pendente').length,
    inad: clients.filter(c => c.pay === 'inadimplente').length,
    mrr: clients.filter(c => c.online).reduce((s, c) => s + PLANS[c.plan].price, 0),
  }

  const list = clients.filter(c => {
    if (filter === 'ativos' && !c.online) return false
    if (filter === 'suspensos' && c.online) return false
    if (filter === 'inadimplentes' && c.pay !== 'inadimplente') return false
    if (search) {
      const q = search.toLowerCase()
      return c.name.toLowerCase().includes(q) || c.domain.toLowerCase().includes(q) || c.seg.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <>
      {/* Tiles */}
      <div className="grid grid-cols-4 gap-3 mb-7" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <Tile label="Total de clientes" value={stats.total} sub={`${stats.active} com site ativo`} dotColor="var(--accent)" />
        <Tile label="Sites ativos" value={stats.active} valueColor="var(--green)" sub={`${stats.total - stats.active} suspenso${stats.total - stats.active !== 1 ? 's' : ''}`} dotColor="var(--red)" />
        <Tile label="Pendências" value={stats.pend + stats.inad} valueColor={stats.pend + stats.inad > 0 ? 'var(--yellow)' : undefined} sub={`${stats.inad} inadimplente${stats.inad !== 1 ? 's' : ''}`} dotColor="var(--red)" />
        <Tile label="Receita mensal (MRR)" value={brl(stats.mrr)} valueStyle={{ fontSize: 22, color: 'var(--accent)' }} sub="apenas sites ativos" dotColor="var(--green)" />
      </div>

      {/* Section header */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-3.5">
        <h2 className="text-sm font-semibold">Clientes</h2>
        <button
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[7px] text-[12.5px] font-medium text-white"
          style={{ background: 'var(--accent)' }}
          onClick={e => { e.stopPropagation(); setAddModal(true) }}
        >
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          Novo cliente
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2.5 flex-wrap mb-3">
        <div className="relative min-w-[180px] max-w-[300px] flex-1">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: 'var(--text3)' }} width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            className="w-full pl-8 pr-3 py-2 rounded-[7px] text-[12.5px] outline-none border"
            style={{ background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }}
            placeholder="Buscar por nome, domínio ou segmento…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f.key}
              onClick={e => { e.stopPropagation(); setFilter(f.key) }}
              className="px-3 py-1.5 rounded-md text-xs font-medium"
              style={{
                background: filter === f.key ? 'var(--accent-dim)' : 'transparent',
                color: filter === f.key ? 'var(--accent)' : 'var(--text2)',
              }}
            >{f.label}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-[7px] border overflow-x-auto" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <table className="w-full border-collapse" style={{ minWidth: 700 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Cliente','Plano','Domínio','Site','Pagamento','Vencimento',''].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--text3)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.length ? list.map(c => (
              <ClientRow
                key={c.id} c={c}
                dropdown={dropdown} setDropdown={setDropdown}
                setDetail={setDetail}
                toggleSite={toggleSite} cyclePay={cyclePay} removeClient={removeClient}
                PLANS={PLANS} PAY_LABEL={PAY_LABEL}
                ini={ini} fdate={fdate} isLate={isLate} brl={brl}
              />
            )) : (
              <tr><td colSpan={7} className="py-14 text-center text-[13px]" style={{ color: 'var(--text2)' }}>Nenhum cliente encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add modal */}
      {addModal && <AddModal onClose={() => setAddModal(false)} onAdd={addClient} />}

      {/* Detail panel */}
      {detail && (
        <>
          <div className="fixed inset-0 z-[140]" style={{ background: 'rgba(0,0,0,.4)' }} onClick={() => setDetail(null)} />
          <DetailPanel
            c={detail} PLANS={PLANS} PAY_LABEL={PAY_LABEL}
            ini={ini} fdate={fdate} isLate={isLate} brl={brl}
            onClose={() => setDetail(null)}
            onToggle={() => toggleSite(detail.id)}
            onCyclePay={() => cyclePay(detail.id)}
          />
        </>
      )}
    </>
  )
}

/* ── Sub-components ── */

function Tile({ label, value, valueColor, valueStyle, sub, dotColor }: {
  label: string; value: string | number; valueColor?: string
  valueStyle?: React.CSSProperties; sub: string; dotColor: string
}) {
  return (
    <div className="rounded-[7px] border p-[18px_18px_14px]" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="text-[10.5px] font-medium uppercase tracking-[.06em] mb-2.5" style={{ color: 'var(--text3)' }}>{label}</div>
      <div className="text-[30px] font-bold leading-none mb-1.5 tabular-nums" style={{ color: valueColor, ...valueStyle }}>{value}</div>
      <div className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--text2)' }}>
        <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: dotColor }} />
        {sub}
      </div>
    </div>
  )
}

interface RowProps {
  c: Client
  dropdown: number | null
  setDropdown: (id: number | null) => void
  setDetail: (c: Client | null) => void
  toggleSite: (id: number) => void
  cyclePay: (id: number) => void
  removeClient: (id: number) => void
  PLANS: typeof PlansType
  PAY_LABEL: typeof PayLabelType
  ini: (n: string) => string
  fdate: (iso: string) => string
  isLate: (iso: string) => boolean
  brl: (n: number) => string
}

function ClientRow({ c, dropdown, setDropdown, setDetail, toggleSite, cyclePay, removeClient, PLANS, PAY_LABEL, ini, fdate, isLate, brl }: RowProps) {
  const planCls = { basico: 'plan-basico', pro: 'plan-pro', premium: 'plan-premium' }[c.plan]
  const planStyle = {
    basico:  { background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)' },
    pro:     { background: 'var(--accent-dim)', color: 'var(--accent)' },
    premium: { background: 'var(--yellow-dim)', color: 'var(--yellow)' },
  }[c.plan]
  const payStyle = {
    pago:        { background: 'var(--green-dim)',  color: 'var(--green)'  },
    pendente:    { background: 'var(--yellow-dim)', color: 'var(--yellow)' },
    inadimplente:{ background: 'var(--red-dim)',    color: 'var(--red)'    },
  }[c.pay]

  return (
    <tr
      className="border-b cursor-pointer transition-colors hover:bg-[var(--surface2)]"
      style={{ borderColor: 'var(--border)' }}
      onClick={() => setDetail(c)}
    >
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-3">
          <div className="w-[34px] h-[34px] rounded-lg grid place-items-center text-[11px] font-bold shrink-0 border" style={{ background: 'var(--surface2)', borderColor: 'var(--border2)' }}>{ini(c.name)}</div>
          <div>
            <div className="font-medium">{c.name}</div>
            <div className="text-[11px] mt-px" style={{ color: 'var(--text2)' }}>{c.seg}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap ${planCls}`} style={planStyle}>
          {PLANS[c.plan].label} · {brl(PLANS[c.plan].price)}
        </span>
      </td>
      <td className="px-4 py-3.5 text-[12px]" style={{ color: 'var(--text2)' }}>{c.domain}</td>
      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2">
          <button className={`tog ${c.online ? 'on' : ''}`} onClick={() => toggleSite(c.id)} aria-label="Toggle site" />
          <span className="text-[11.5px]" style={{ color: c.online ? 'var(--green)' : 'var(--text3)' }}>
            {c.online ? 'Online' : 'Suspenso'}
          </span>
        </div>
      </td>
      <td className="px-4 py-3.5" onClick={e => e.stopPropagation()}>
        <button
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[5px] text-[11px] font-semibold whitespace-nowrap"
          style={payStyle}
          onClick={() => cyclePay(c.id)}
        >
          <svg width="7" height="7" viewBox="0 0 7 7"><circle cx="3.5" cy="3.5" r="3.5" fill="currentColor"/></svg>
          {PAY_LABEL[c.pay]}
        </button>
      </td>
      <td className="px-4 py-3.5 text-[12px] tabular-nums" style={{ color: isLate(c.due) ? 'var(--red)' : 'var(--text2)', fontWeight: isLate(c.due) ? 600 : 400 }}>
        {fdate(c.due)}
      </td>
      <td className="px-4 py-3.5 relative" onClick={e => e.stopPropagation()}>
        <button
          className="w-[30px] h-[30px] rounded-md grid place-items-center transition-colors"
          style={{ color: 'var(--text3)' }}
          onClick={e => { e.stopPropagation(); setDropdown(dropdown === c.id ? null : c.id) }}
        >
          <svg width="15" height="15" fill="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
        </button>
        {dropdown === c.id && (
          <div className="ddrop" onClick={e => e.stopPropagation()}>
            <button className="flex items-center gap-2 px-3 py-2.5 text-[12.5px] w-full text-left hover:bg-[var(--surface2)]" onClick={() => { setDetail(c); setDropdown(null) }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
              Ver detalhes
            </button>
            <button className="flex items-center gap-2 px-3 py-2.5 text-[12.5px] w-full text-left hover:bg-[var(--surface2)]" onClick={() => { toggleSite(c.id); setDropdown(null) }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
              {c.online ? 'Suspender site' : 'Reativar site'}
            </button>
            <div style={{ height: 1, background: 'var(--border)', margin: '3px 0' }} />
            <button className="flex items-center gap-2 px-3 py-2.5 text-[12.5px] w-full text-left hover:bg-[var(--surface2)]" style={{ color: 'var(--red)' }} onClick={() => removeClient(c.id)}>
              <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>
              Remover
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

function DetailPanel({ c, PLANS, PAY_LABEL, ini, fdate, isLate, brl, onClose, onToggle, onCyclePay }: {
  c: Client; PLANS: typeof PlansType; PAY_LABEL: typeof PayLabelType
  ini: (n: string) => string; fdate: (iso: string) => string; isLate: (iso: string) => boolean; brl: (n: number) => string
  onClose: () => void; onToggle: () => void; onCyclePay: () => void
}) {
  const planStyle = {
    basico:  { background: 'var(--surface2)', color: 'var(--text2)', border: '1px solid var(--border)' },
    pro:     { background: 'var(--accent-dim)', color: 'var(--accent)' },
    premium: { background: 'var(--yellow-dim)', color: 'var(--yellow)' },
  }[c.plan]
  const payStyle = {
    pago:        { background: 'var(--green-dim)',  color: 'var(--green)'  },
    pendente:    { background: 'var(--yellow-dim)', color: 'var(--yellow)' },
    inadimplente:{ background: 'var(--red-dim)',    color: 'var(--red)'    },
  }[c.pay]

  return (
    <div className="dpanel">
      <div className="flex items-start justify-between gap-3 px-[18px] py-[18px] sticky top-0 border-b" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-[10px] grid place-items-center text-[13px] font-bold shrink-0 border" style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}>{ini(c.name)}</div>
          <div>
            <div className="font-medium text-sm">{c.name}</div>
            <div className="text-[11px]" style={{ color: 'var(--text2)' }}>{c.seg}</div>
          </div>
        </div>
        <button className="w-7 h-7 rounded-md grid place-items-center" style={{ color: 'var(--text2)' }} onClick={onClose}>
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div className="px-[18px] py-4">
        {[
          ['Plano', <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold" style={planStyle}>{PLANS[c.plan].label} · {brl(PLANS[c.plan].price)}/mês</span>],
          ['Domínio', <span className="text-[12.5px] font-medium" style={{ color: 'var(--text2)' }}>{c.domain}</span>],
          ['Site', <span className="text-[12.5px] font-medium" style={{ color: c.online ? 'var(--green)' : 'var(--red)' }}>{c.online ? 'Online' : 'Suspenso'}</span>],
          ['Pagamento', <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[5px] text-[11px] font-semibold" style={payStyle} onClick={onCyclePay}>{PAY_LABEL[c.pay]}</button>],
          ['Vencimento', <span className="text-[12.5px] font-medium" style={{ color: isLate(c.due) ? 'var(--red)' : undefined }}>{fdate(c.due)}</span>],
          ['Cliente desde', <span className="text-[12.5px] font-medium">{fdate(c.since)}</span>],
          ['Telefone', <span className="text-[12.5px] font-medium">{c.tel}</span>],
          ['E-mail', <span className="text-[12px] font-medium">{c.email}</span>],
        ].map(([key, val], i, arr) => (
          <div key={String(key)} className="flex justify-between items-center py-3 gap-4" style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
            <span className="text-[11.5px] shrink-0" style={{ color: 'var(--text2)' }}>{key}</span>
            {val}
          </div>
        ))}
        <div className="mt-4">
          <button
            className="w-full py-2 rounded-[7px] text-[12.5px] font-medium border"
            style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }}
            onClick={onToggle}
          >
            {c.online ? 'Suspender site' : 'Reativar site'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AddModal({ onClose, onAdd }: { onClose: () => void; onAdd: (data: Omit<Client, 'id' | 'online' | 'pay' | 'since'>) => void }) {
  const ref = useRef<HTMLFormElement>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fd = new FormData(ref.current!)
    const name = (fd.get('name') as string).trim()
    if (!name) return
    onAdd({
      name,
      seg:    (fd.get('seg')    as string).trim() || 'Empresa',
      domain: (fd.get('domain') as string).trim(),
      tel:    (fd.get('tel')    as string).trim(),
      email:  (fd.get('email')  as string).trim(),
      plan:   fd.get('plan') as 'basico' | 'pro' | 'premium',
      due:    fd.get('due') as string,
    })
  }

  const inputCls = "w-full rounded-[7px] border px-2.5 py-2 text-[12.5px] outline-none"
  const inputStyle = { background: 'var(--surface2)', borderColor: 'var(--border)', color: 'var(--text)' }
  const labelCls = "text-[10.5px] font-medium block mb-1"

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-5" style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)' }} onClick={onClose}>
      <div className="w-full max-w-[520px] rounded-[10px] border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border2)' }} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold">Novo cliente</h3>
          <button className="w-7 h-7 rounded-md grid place-items-center" style={{ color: 'var(--text2)' }} onClick={onClose}>
            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <form ref={ref} onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3.5">
            <div className="col-span-2">
              <label className={labelCls} style={{ color: 'var(--text2)' }}>Nome da empresa</label>
              <input name="name" className={inputCls} style={inputStyle} placeholder="Ex: Barbearia Silva" autoFocus />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'var(--text2)' }}>Segmento</label>
              <input name="seg" className={inputCls} style={inputStyle} placeholder="Ex: Barbearia" />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'var(--text2)' }}>Domínio</label>
              <input name="domain" className={inputCls} style={inputStyle} placeholder="exemplo.com.br" />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'var(--text2)' }}>Telefone</label>
              <input name="tel" className={inputCls} style={inputStyle} placeholder="(11) 99999-9999" />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'var(--text2)' }}>E-mail</label>
              <input name="email" type="email" className={inputCls} style={inputStyle} placeholder="contato@empresa.com.br" />
            </div>
            <div>
              <label className={labelCls} style={{ color: 'var(--text2)' }}>Plano</label>
              <select name="plan" className={inputCls} style={inputStyle} defaultValue="pro">
                <option value="basico">Básico — R$ 97/mês</option>
                <option value="pro">Pro — R$ 197/mês</option>
                <option value="premium">Premium — R$ 297/mês</option>
              </select>
            </div>
            <div>
              <label className={labelCls} style={{ color: 'var(--text2)' }}>Vencimento</label>
              <input name="due" type="date" className={inputCls} style={inputStyle} defaultValue="2026-11-01" />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <button type="button" className="px-4 py-2 rounded-[7px] text-[12.5px] font-medium border" style={{ background: 'var(--surface2)', borderColor: 'var(--border)' }} onClick={onClose}>Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-[7px] text-[12.5px] font-medium text-white" style={{ background: 'var(--accent)' }}>Adicionar</button>
          </div>
        </form>
      </div>
    </div>
  )
}
