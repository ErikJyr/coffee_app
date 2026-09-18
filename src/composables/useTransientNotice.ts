import { onBeforeUnmount, ref } from 'vue'

const DEFAULT_DURATION = 2_200

export function useTransientNotice(duration = DEFAULT_DURATION) {
  const notice = ref('')
  let timer: ReturnType<typeof window.setTimeout> | undefined

  function clearNotice() {
    if (timer !== undefined) {
      window.clearTimeout(timer)
      timer = undefined
    }

    notice.value = ''
  }

  function showNotice(message: string) {
    clearNotice()
    notice.value = message
    timer = window.setTimeout(clearNotice, duration)
  }

  onBeforeUnmount(clearNotice)

  return { notice, showNotice }
}
