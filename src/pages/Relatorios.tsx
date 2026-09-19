import type { Client } from '../types'
import type { PLANS as PlansType } from '../store'

interface Props {
  clients: Client[]
  PLANS: typeof PlansType
  brl: (n: number) => string
}

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export default function Relatorios({ clients, PLANS, brl }: Props) {
  const now = new Date()
  const total  = clients.length
  const active = clients.filter(c => c.online).length

  const avgMonths = total
    ? Math.round(clients.reduce((acc, c) => acc + (c.since ? (now.getTime() - new Date(c.since).getTime()) / (1000*60*60*24*30) : 0), 0) / total)
    : 0

  const mrr = clients.filter(c => c.online).reduce((s, c) => s + PLANS[c.plan].price, 0)

  // New clients per month (last 6)
  const monthMap: Record<string, number> = {}
  for (let m = 5; m >= 0; m--) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1)
    monthMap[`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`] = 0
  }
  clients.forEach(c => { if (c.since) { const k = c.since.slice(0, 7); if (k in monthMap) monthMap[k]++ } })
  const months = Object.entries(monthMap)
  const maxMonth = Math.max(...months.map(([,v]) => v), 1)

  // Segment distribution
  const bySegment: Record<string, number> = {}
  clients.forEach(c => { bySegment[c.seg] = (bySegment[c.seg] ?? 0) + 1 })
  const segments = Object.entries(bySegment).sort((a, b) => b[1] - a[1])
  const maxSeg = segments[0]?.[1] ?? 1

  // Oldest clients
  const oldest = [...clients].sort((a, b) => (a.since ?? '') < (b.since ?? '') ? -1 : 1).slice(0, 5)

  return (
    <>
      <div className="mb-6">
        <h1 className="text-lg font-bold">Relatórios</h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--text2)' }}>Visão geral da base de clientes</p>
      </div>

      {/* Tiles */}
      <div className="grid grid-cols-4 gap-3 mb-5" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>
        <Tile label="Total de clientes"     value={String(total)}          sub="base ativa"            dotColor="var(--accent)" />
        <Tile label="Sites online"          value={String(active)}         valueColor="var(--green)"   sub={`${Math.round((active/Math.max(total,1))*100)}% da base`} dotColor="var(--accent)" />
        <Tile label="Tempo médio de cliente" value={String(avgMonths)}     sub="meses de relação"      dotColor="var(--accent)" />
        <Tile label="MRR total"             value={brl(mrr)}               valueColor="var(--accent)"  sub="receita recorrente" valueStyle={{ fontSize: 22 }} dotColor="var(--green)" />
      </div>

      {/* Two columns */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Card title="Novos clientes (6 meses)">
          <div className="flex gap-2 items-end h-[120px] pt-2">
            {months.map(([key, count]) => {
              const pct = Math.round((count / maxMonth) * 100)
              const [, m] = key.split('-')
              return (
                <div key={key} className="flex-1 flex flex-col items-center gap-1.5">
                  <span className="text-[11px] font-semibold" style={{ color: count > 0 ? 'var(--text)' : 'var(--text3)' }}>{count || ''}</span>
                  <div className="w-full flex items-end rounded" style={{ background: 'var(--surface2)', height: 80 }}>
                    <div className="w-full rounded transition-all" style={{ background: 'var(--accent)', height: `${Math.max(pct, count > 0 ? 8 : 0)}%` }} />
                  </div>
                  <span className="text-[10px]" style={{ color: 'var(--text3)' }}>{MONTH_NAMES[parseInt(m, 10) - 1]}</span>
                </div>
              )
            })}
          </div>
        </Card>

        <Card title="Clientes por segmento">
          {segments.map(([seg, count]) => (
            <div key={seg} className="flex items-center gap-2.5 mb-2.5">
              <span className="text-[12px] shrink-0 w-[110px] truncate" style={{ color: 'var(--text2)' }}>{seg}</span>
              <div className="flex-1 h-2 rounded" style={{ background: 'var(--surface2)' }}>
                <div className="h-full rounded" style={{ width: `${Math.round((count/maxSeg)*100)}%`, background: 'var(--accent)' }} />
              </div>
              <span className="text-[12px] font-semibold w-5 text-right tabular-nums">{count}</span>
            </div>
          ))}
        </Card>
      </div>

      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <Card title="Status dos sites">
          {[
            ['Online',          String(active),              'var(--green)'],
            ['Suspensos',       String(total - active),      'var(--red)'],
            ['Taxa de atividade', `${Math.round((active/Math.max(total,1))*100)}%`, undefined],
          ].map(([k, v, vc], i) => (
            <div key={String(k)} className="flex justify-between py-2.5 text-[13px]" style={{ borderBottom: i < 2 ? '1px solid var(--border)' : 'none' }}>
              <span style={{ color: 'var(--text2)' }}>{k}</span>
              <span className="font-semibold tabular-nums" style={{ color: vc as string | undefined }}>{v}</span>
            </div>
          ))}
        </Card>

        <Card title="Clientes mais antigos">
          {oldest.map((c, i) => {
            const months = c.since ? Math.round((now.getTime() - new Date(c.since).getTime()) / (1000*60*60*24*30)) : 0
            return (
              <div key={c.id} className="flex justify-between py-2.5 text-[13px]" style={{ borderBottom: i < oldest.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <span style={{ color: 'var(--text2)' }}>{c.name}</span>
                <span className="font-semibold tabular-nums">{months} meses</span>
              </div>
            )
          })}
        </Card>
      </div>
    </>
  )
}

function Tile({ label, value, valueColor, valueStyle, sub, dotColor }: { label: string; value: string; valueColor?: string; valueStyle?: React.CSSProperties; sub: string; dotColor: string }) {
  return (
    <div className="rounded-[7px] border p-[18px_18px_14px]" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="text-[10.5px] font-medium uppercase tracking-[.06em] mb-2.5" style={{ color: 'var(--text3)' }}>{label}</div>
      <div className="text-[30px] font-bold leading-none mb-1.5 tabular-nums" style={{ color: valueColor, ...valueStyle }}>{value}</div>
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
