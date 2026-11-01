import { ref, watch } from 'vue'

const KEY = 'choviet-theme'
const night = ref(false)

function apply(value: boolean) {
  night.value = value
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', value)
  document.documentElement.style.colorScheme = value ? 'dark' : 'light'
}

apply(localStorage.getItem(KEY) === 'night')

export function useTheme() {
  function toggle() {
    localStorage.setItem(KEY, night.value ? 'day' : 'night')
    apply(!night.value)
  }
  return { night, toggle }
}

watch(night, (value) => localStorage.setItem(KEY, value ? 'night' : 'day'))
