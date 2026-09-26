export const ADMIN_IDLE_TIMEOUT_MS = 30 * 60 * 1000
export const ADMIN_IDLE_WARNING_MS = 5 * 60 * 1000
export const ADMIN_ACTIVITY_KEY = 'portfolio_admin_last_activity'
export const ADMIN_LOGOUT_KEY = 'portfolio_admin_logout_at'

export function getAdminIdleState(lastActivity, now = Date.now()) {
  const activity = Number(lastActivity)
  if (!Number.isFinite(activity) || activity <= 0) {
    return { expired: false, warning: false, remainingMs: ADMIN_IDLE_TIMEOUT_MS }
  }
  const remainingMs = Math.max(0, ADMIN_IDLE_TIMEOUT_MS - (now - activity))
  return {
    expired: remainingMs === 0,
    warning: remainingMs > 0 && remainingMs <= ADMIN_IDLE_WARNING_MS,
    remainingMs,
  }
}

export function readAdminActivity(storage = globalThis.localStorage) {
  return Number(storage?.getItem(ADMIN_ACTIVITY_KEY)) || 0
}

export function writeAdminActivity(now = Date.now(), storage = globalThis.localStorage) {
  storage?.setItem(ADMIN_ACTIVITY_KEY, String(now))
  return now
}
