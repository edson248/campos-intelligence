export type PayStatus = 'pago' | 'pendente' | 'inadimplente'
export type PlanKey = 'basico' | 'pro' | 'premium'
export type Section = 'clientes' | 'financeiro' | 'relatorios'
export type FilterKey = 'todos' | 'ativos' | 'suspensos' | 'inadimplentes'

export interface Client {
  id: number
  name: string
  seg: string
  domain: string
  plan: PlanKey
  online: boolean
  pay: PayStatus
  due: string
  since: string
  tel: string
  email: string
}
