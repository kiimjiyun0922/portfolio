export const LOG_FILTERS = [
  { key: 'all', label: '전체' },
  { key: 'access', label: '인증 접속' },
  { key: 'gate', label: '게이트 방문' },
  { key: 'alert', label: '보안 알림' },
]

export const SECTION_LABELS = {
  about: '소개', journey: '커리어 저니', achievements: '핵심 성과',
  projects: '최근 프로젝트', experience: '경력사항', resume: '학력·활동', contact: '연락처',
}

export const ACTION_LABELS = {
  section: '섹션 도달', tab: '카드 탭', journey: '저니 클릭', detail: '경력 상세 펼침', click: '클릭',
}

export function buildLogRows({ accessLogs, gateLogs, alertLogs, now, liveWindow = 6 * 60 * 1000 }) {
  return [
    ...accessLogs.map((log) => ({
      kind: 'access', at: log.accessedAt, title: log.tokenLabel || 'unknown',
      detail: log.lastSeenAt && now - log.lastSeenAt < liveWindow
        ? '지금 열람 중'
        : log.lastSeenAt && Math.round((log.lastSeenAt - log.accessedAt) / 60000) >= 1
          ? `체류 ${Math.round((log.lastSeenAt - log.accessedAt) / 60000)}분` : '',
      ua: log.userAgent, lang: log.language,
      live: !!(log.lastSeenAt && now - log.lastSeenAt < liveWindow),
      actions: log.actions || [],
    })),
    ...gateLogs.map((log) => ({
      kind: 'gate', at: log.visitedAt, title: '게이트 도달',
      detail: log.referrer ? `유입: ${log.referrer.replace(/^https?:\/\//, '').slice(0, 40)}` : '직접 접속',
      ua: log.userAgent, lang: log.language,
    })),
    ...alertLogs.map((log) => ({
      kind: 'alert', at: log.at,
      title: log.type === 'admin_fail' ? '어드민 로그인 실패' : '잘못된 토큰 시도',
      detail: log.detail || '', ua: log.userAgent, lang: log.language,
    })),
  ].sort((a, b) => b.at - a.at)
}

export function countLogRows(rows) {
  const counts = { all: rows.length, access: 0, gate: 0, alert: 0 }
  rows.forEach((row) => { if (counts[row.kind] !== undefined) counts[row.kind] += 1 })
  return counts
}
