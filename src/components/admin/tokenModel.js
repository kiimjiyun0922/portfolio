export function isActiveToken(token, now = Date.now()) {
  return !token.revoked && !token.forceExpired && token.expiresAt > now
}

export function getTokenStatus(token, now = Date.now()) {
  if (token.revoked) return { text: '폐기됨', cls: 'text-gray-500' }
  if (token.forceExpired) return { text: '만료(강제)', cls: 'text-yellow-400' }
  if (token.expiresAt <= now) return { text: '만료', cls: 'text-red-400' }
  return { text: '활성', cls: 'text-green-400' }
}

export function filterTokens(tokens, tab, now = Date.now()) {
  return tokens.filter((token) => tab === 'active'
    ? isActiveToken(token, now)
    : tab === 'expired' ? (!token.revoked && !isActiveToken(token, now)) : token.revoked)
}
