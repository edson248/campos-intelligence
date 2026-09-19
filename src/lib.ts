export function ini(name: string) {
  return name.trim().split(/\s+/).map(w => w[0] ?? '').slice(0, 2).join('').toUpperCase()
}

export function fdate(iso: string) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

export function isLate(iso: string) {
  return !!iso && new Date(iso) < new Date()
}

export function brl(n: number) {
  return 'R$ ' + n.toLocaleString('pt-BR')
}

export function nextId(ids: number[]) {
  return Math.max(0, ...ids) + 1
}
