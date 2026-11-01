export type Rule = (value: string) => string

export const required = (label = 'trường này'): Rule => (value) =>
  value.trim() ? '' : `Nhập ${label}.`

export const email = (): Rule => (value) =>
  !value.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) ? '' : 'Email chưa đúng định dạng.'

export const minLength = (n: number, label = 'Mật khẩu'): Rule => (value) =>
  value.length >= n ? '' : `${label} cần ít nhất ${n} ký tự.`

export const phoneVN = (): Rule => (value) =>
  !value.trim() || /^0\d{9,10}$/.test(value.trim().replace(/\s|-/g, '')) ? '' : 'Số điện thoại cần 10–11 số, bắt đầu bằng 0.'

export const amountAtLeast = (n: number): Rule => (value) =>
  Number(value) >= n ? '' : `Số tiền tối thiểu ${n.toLocaleString('vi-VN')}₫.`

/** Runs the first rule that fails for each field; returns field → Vietnamese message. */
export function validate(fields: Record<string, [string, Rule[]]>): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const [name, [value, rules]] of Object.entries(fields)) {
    for (const rule of rules) {
      const message = rule(value ?? '')
      if (message) {
        errors[name] = message
        break
      }
    }
  }
  return errors
}
