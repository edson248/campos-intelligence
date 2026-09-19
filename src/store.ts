import type { Client, PlanKey } from './types'

export const PLANS: Record<PlanKey, { label: string; price: number }> = {
  basico:  { label: 'Básico',  price: 97  },
  pro:     { label: 'Pro',     price: 197 },
  premium: { label: 'Premium', price: 297 },
}

export const PAY_LABEL: Record<string, string> = {
  pago: 'Pago',
  pendente: 'Pendente',
  inadimplente: 'Inadimplente',
}

const STORAGE_KEY = 'ci_clients_v1'

const SEED: Client[] = [
  { id:1, name:'Presença 360',          seg:'Eletricista',       domain:'presenca360.com.br',        plan:'pro',     online:true,  pay:'pago',        due:'2026-10-15', since:'2024-03-01', tel:'(11) 98742-1108', email:'contato@presenca360.com.br' },
  { id:2, name:'Studio Bella',          seg:'Salão de Beleza',   domain:'studiobella.com.br',         plan:'basico',  online:true,  pay:'pendente',    due:'2026-10-05', since:'2024-06-10', tel:'(11) 97231-4409', email:'studio@bella.com.br' },
  { id:3, name:'Advocacia Torres',      seg:'Advocacia',         domain:'advocaciatorres.adv.br',     plan:'premium', online:true,  pay:'pago',        due:'2026-10-20', since:'2024-01-15', tel:'(11) 99120-7730', email:'contato@torres.adv.br' },
  { id:4, name:'Auto Peças Rápido',     seg:'Auto Peças',        domain:'autopecasrapido.com.br',     plan:'basico',  online:false, pay:'inadimplente',due:'2026-09-01', since:'2024-08-20', tel:'(11) 98901-3312', email:'contato@aprapido.com.br' },
  { id:5, name:'Clínica Saúde Total',   seg:'Saúde',             domain:'clinicasaudetotal.com.br',   plan:'pro',     online:true,  pay:'pago',        due:'2026-10-10', since:'2024-04-05', tel:'(11) 97440-8821', email:'clinica@saudetotal.com.br' },
  { id:6, name:'Pet Shop Amigo Fiel',   seg:'Pet Shop',          domain:'petshopamigofiel.com.br',    plan:'basico',  online:true,  pay:'pago',        due:'2026-10-25', since:'2024-09-01', tel:'(11) 99320-5514', email:'petshop@amigofiel.com.br' },
  { id:7, name:'Construtora Almeida',   seg:'Construção',        domain:'construtorapalmeida.com.br', plan:'premium', online:false, pay:'inadimplente',due:'2026-08-15', since:'2023-11-20', tel:'(11) 97650-1190', email:'obras@almeida.com.br' },
]

export function loadClients(): Client[] {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (s) return JSON.parse(s) as Client[]
  } catch { /* ignore */ }
  const seeded = SEED.map(c => ({ ...c }))
  saveClients(seeded)
  return seeded
}

export function saveClients(clients: Client[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(clients)) } catch { /* ignore */ }
}

export function calcStats(clients: Client[]) {
  const total = clients.length
  const active = clients.filter(c => c.online).length
  const pend = clients.filter(c => c.pay === 'pendente').length
  const inad = clients.filter(c => c.pay === 'inadimplente').length
  const mrr = clients.filter(c => c.online).reduce((s, c) => s + PLANS[c.plan].price, 0)
  const pendVal = clients.filter(c => c.pay === 'pendente').reduce((s, c) => s + PLANS[c.plan].price, 0)
  const inadVal = clients.filter(c => c.pay === 'inadimplente').reduce((s, c) => s + PLANS[c.plan].price, 0)
  return { total, active, pend, inad, mrr, pendVal, inadVal }
}
