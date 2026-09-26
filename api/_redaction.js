export function redactTelemetry(value, maxLength = 2000) {
  const output = String(value || '')
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]')
    .replace(/((?:token|password|secret|api[_-]?key|authorization)\s*[:=]\s*)[^\s,;"'}]+/gi, '$1[REDACTED]')
    .replace(/[A-Za-z0-9_-]{24,}\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}/g, '[REDACTED]')
    .replace(/-----BEGIN [^-]+ PRIVATE KEY-----[\s\S]*?-----END [^-]+ PRIVATE KEY-----/g, '[REDACTED]')
  return output.slice(0, maxLength)
}
