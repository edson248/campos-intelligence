import type { Client } from '../types'
import type { PLANS as PlansType, PAY_LABEL as PayLabelType } from '../store'

interface Props {
  clients: Client[]
  PLANS: typeof PlansType
  PAY_LABEL: typeof PayLabelType
  brl: (n: number) => string
  fdate: (iso: string) => string
  isLate: (iso: string) => boolean
  cyclePay: (id: number) => void
}

export default function Financeiro({ clients, PLANS, PAY_LABEL, brl, fdate, isLate, cyclePay }: Props) {
  const active    = clients.filter(c => c.online)
  const mrr       = active.reduce((s, c) => s + PLANS[c.plan].price, 0)
  const pendVal   = clients.filter(c => c.pay === 'pendente').reduce((s, c) => s + PLANS[c.plan].price, 0)
  const inadVal   = clients.filter(c => c.pay === 'inadimplente').reduce((s, c) => s + PLANS[c.plan].price, 0)
  const total     = mrr + pendVal + inadVal
  const txAdim    = total > 0 ? Math.round((mrr / total) * 100) : 100
  const pendCount = clients.filter(c => c.pay === 'pendente').length
  const inadCount = clients.filter(c => c.pay === 'inadimplente').length

  const planCount = { basico: 0, pro: 0, premium: 0 } as Record<string, number>
  const planRev   = { basico: 0, pro: 0, premium: 0 } as Record<string, number>
  clients.forEach(c => {
    planCount[c.plan]++
    if (c.online) planRev[c.plan] += PLANS[c.plan].price
  })
  const maxCount = Math.max(...Object.values(planCount), 1)

  const now = new Date()
  const upcoming = clients
    .filter(c => { if (!c.due) return false; const d = (new Date(c.due).getTime() - now.getTime()) / 86400000; return d <= 60 })
    .sort((a, b) => new Date(a.due).getTime() - new Date(b.due).getTime())

  function renewBadge(iso: string) {
    const days = Math.round((new Date(iso).getTime() - now.getTime()) / 86400000)
    if (days < 0)  return { label: 'Vencido', bg: 'var(--red-dim)',    color: 'var(--red)'    }
    if (days <= 7) return { label: `${days}d`, bg: 'var(--red-dim)',    color: 'var(--red)'    }
    if (days <= 30)return { label: `${days}d`, bg: 'var(--yellow-dim)', color: 'var(--yellow)' }
    return               { label: `${days}d`, bg: 'var(--green-dim)',  color: 'var(--green)'  }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-lg font-bold">Financeiro</h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--text2)' }}>Receita, inadimplência e próximos vencimentos</p>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-4 gap-3 mb-5" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <Tile label="MRR (sites ativos)"      value={brl(mrr)}     valueColor="var(--accent)"                              sub={`${active.length} contratos ativos`}                dotColor="var(--green)" />
        <Tile label="A receber (pendentes)"   value={brl(pendVal)} valueColor={pendVal > 0 ? 'var(--yellow)' : undefined} sub={`${pendCount} pagamento${pendCount !== 1 ? 's' : ''} em aberto`} dotColor="var(--yellow)" />
        <Tile label="Inadimplência"           value={brl(inadVal)} valueColor={inadVal > 0 ? 'var(--red)' : undefined}    sub={`${inadCount} cliente${inadCount !== 1 ? 's' : ''} inadimplente${inadCount !== 1 ? 's' : ''}`} dotColor="var(--red)" />
        <Tile label="Taxa de adimplência"     value={`${txAdim}%`} valueColor={txAdim >= 80 ? 'var(--green)' : 'var(--yellow)'} sub="dos ativos estão em dia" dotColor={txAdim >= 80 ? 'var(--green)' : 'var(--yellow)'} />
      </div>

      {/* Two columns */}
      <div className="grid gap-4 mb-5" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Card title="Distribuição por plano">
          {(['basico', 'pro', 'premium'] as const).map(k => (
            <BarRow key={k} label={PLANS[k].label} count={planCount[k]} max={maxCount} color={k === 'basico' ? 'var(--text2)' : k === 'pro' ? 'var(--accent)' : 'var(--yellow)'} />
          ))}
          <div className="mt-4 pt-3.5 border-t" style={{ borderColor: 'var(--border)' }}>
            {(['basico', 'pro', 'premium'] as const).map((k, i, arr) => (
              <div key={k} className="flex justify-between py-2.5 text-[13px]" style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ color: 'var(--text2)' }}>Receita {PLANS[k].label}</span>
                <span className="font-semibold tabular-nums" style={{ color: k === 'basico' ? undefined : k === 'pro' ? 'var(--accent)' : 'var(--yellow)' }}>{brl(planRev[k])}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Resumo financeiro">
          {[
            ['Receita potencial total',      brl(total),    undefined],
            ['Receita realizada (MRR)',       brl(mrr),      'var(--green)'],
            ['Pendente de pagamento',         brl(pendVal),  'var(--yellow)'],
            ['Em inadimplência',              brl(inadVal),  'var(--red)'],
            ['Sites suspensos',               String(clients.length - active.length), undefined],
            ['Ticket médio (ativos)',         active.length > 0 ? brl(Math.round(mrr / active.length)) : '—', undefined],
          ].map(([k, v, vc], i, arr) => (
            <div key={String(k)} className="flex justify-between py-2.5 text-[13px]" style={{ borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ color: 'var(--text2)' }}>{k}</span>
              <span className="font-semibold tabular-nums" style={{ color: vc as string | undefined }}>{v}</span>
            </div>
          ))}
        </Card>
      </div>

      {/* Renewals table */}
      <div className="flex items-center justify-between mb-3.5">
        <h2 className="text-sm font-semibold">Próximos vencimentos</h2>
        <span className="text-[12px]" style={{ color: 'var(--text2)' }}>Próximos 60 dias</span>
      </div>
      <div className="rounded-[7px] border overflow-x-auto" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <table className="w-full border-collapse" style={{ minWidth: 550 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Cliente','Plano','Vencimento','Prazo','Pagamento'].map(h => (
                <th key={h} className="px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: 'var(--text3)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {upcoming.length ? upcoming.map(c => {
              const rb = renewBadge(c.due)
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
                <tr key={c.id} className="border-b" style={{ borderColor: 'var(--border)' }}>
                  <td className="px-4 py-3.5 font-medium text-[13px]">{c.name}</td>
                  <td className="px-4 py-3.5"><span className="inline-flex px-2.5 py-1 rounded-full text-[11px] font-semibold" style={planStyle}>{PLANS[c.plan].label}</span></td>
                  <td className="px-4 py-3.5 text-[12px] tabular-nums" style={{ color: isLate(c.due) ? 'var(--red)' : 'var(--text2)' }}>{fdate(c.due)}</td>
                  <td className="px-4 py-3.5"><span className="inline-flex px-2 py-1 rounded text-[10.5px] font-semibold" style={{ background: rb.bg, color: rb.color }}>{rb.label}</span></td>
                  <td className="px-4 py-3.5">
                    <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[5px] text-[11px] font-semibold" style={payStyle} onClick={() => cyclePay(c.id)}>
                      <svg width="7" height="7" viewBox="0 0 7 7"><circle cx="3.5" cy="3.5" r="3.5" fill="currentColor"/></svg>
                      {PAY_LABEL[c.pay]}
                    </button>
                  </td>
                </tr>
              )
            }) : (
              <tr><td colSpan={5} className="py-14 text-center text-[13px]" style={{ color: 'var(--text2)' }}>Nenhum vencimento nos próximos 60 dias.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

function Tile({ label, value, valueColor, sub, dotColor }: { label: string; value: string; valueColor?: string; sub: string; dotColor: string }) {
  return (
    <div className="rounded-[7px] border p-[18px_18px_14px]" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="text-[10.5px] font-medium uppercase tracking-[.06em] mb-2.5" style={{ color: 'var(--text3)' }}>{label}</div>
      <div className="text-[22px] font-bold leading-none mb-1.5 tabular-nums" style={{ color: valueColor }}>{value}</div>
      <div className="text-[11px] flex items-center gap-1.5" style={{ color: 'var(--text2)' }}>
        <span className="w-[7px] h-[7px] rounded-full shrink-0" style={{ background: dotColor }} />{sub}
      </div>
    </div>
  )
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[7px] border p-5" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="text-xs font-semibold uppercase tracking-[.06em] mb-4" style={{ color: 'var(--text2)' }}>{title}</div>
      {children}
    </div>
  )
}

function BarRow({ label, count, max, color }: { label: string; count: number; max: number; color: string }) {
  const pct = Math.round((count / max) * 100)
  return (
    <div className="flex items-center gap-2.5 mb-2.5">
      <span className="text-[12px] shrink-0 w-[72px]" style={{ color: 'var(--text2)' }}>{label}</span>
      <div className="flex-1 h-2 rounded" style={{ background: 'var(--surface2)' }}>
        <div className="h-full rounded transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[12px] font-semibold w-14 text-right tabular-nums" style={{ color }}>{count} cliente{count !== 1 ? 's' : ''}</span>
    </div>
  )
}
