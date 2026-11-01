const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })

export function money(value: string | number) {
  return vnd.format(Number(value))
}

export function salePercent(price: string | number, compareAt?: string | number | null) {
  const current = Number(price)
  const listed = Number(compareAt)
  if (!listed || listed <= current) return 0
  return Math.round(((listed - current) / listed) * 100)
}

export function pastelWell(seed: string) {
  const wells = ['#d4ff5c', '#ffd6e7', '#c3e4ff', '#d8ccff', '#b6ffe4', '#ffe6b0']
  let hash = 0
  for (const char of seed) hash = (hash + char.charCodeAt(0)) % wells.length
  return wells[hash]
}
