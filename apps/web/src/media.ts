export function productImageUrl(product: { images?: { objectKey: string }[] } | null | undefined) {
  const key = product?.images?.[0]?.objectKey
  if (!key) return ''
  if (/^https?:\/\//i.test(key) || key.startsWith('/')) return key
  return `/${key}`
}

export function productInitials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((word) => word.charAt(0).toUpperCase()).join('')
}
