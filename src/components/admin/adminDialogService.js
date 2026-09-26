const listeners = new Set()

function requestDialog(dialog) {
  return new Promise((resolve) => {
    listeners.forEach((listener) => listener({ ...dialog, resolve }))
  })
}

export function subscribeAdminDialogs(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function adminConfirm(message, options = {}) {
  return requestDialog({ kind: 'confirm', title: options.title || '확인이 필요합니다', message, confirmLabel: options.confirmLabel || '확인', danger: options.danger !== false })
}

export function adminPrompt(message, options = {}) {
  return requestDialog({ kind: 'prompt', title: options.title || '정보 입력', message, confirmLabel: options.confirmLabel || '계속', placeholder: options.placeholder || '', initialValue: options.initialValue || '', danger: false })
}

export function adminAlert(message, options = {}) {
  return requestDialog({ kind: 'alert', title: options.title || '작업 결과', message, confirmLabel: options.confirmLabel || '확인', danger: options.danger === true })
}
