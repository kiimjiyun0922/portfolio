import { createAccessToken } from './crypto'
import { SITE } from '../site.config'

const SITE_URL = SITE.url
const SCALE = 2
const A4W = 595, A4H = 842
const A4W_PX = A4W * SCALE, A4H_PX = A4H * SCALE
const PAD = 36 // pt padding top/bottom per page
const PAD_PX = PAD * SCALE

function esc(t) { return (t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
function md(t) {
  if (!t) return ''
  return esc(t).replace(/^[-•◦‣]\s*/gm, '• ').replace(/#{1,4}\s*/g, '').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br>')
}

// Wrap content in a pdf-section div — use PADDING not margin (html2canvas clips margin)
const sec = (html) => `<div class="pdf-section" style="padding-bottom:18px;">${html}</div>`
const h2 = (text) => `<div style="font-size:13px;font-weight:700;color:#3b82f6;padding-bottom:4px;border-bottom:1px solid #e5e7eb;margin-bottom:10px;padding-top:12px;">${text}</div>`

export async function exportPortfolioPDF({ resume, projects, achievements, hero, about, contact, recipient }) {
  const QRCode = (await import('qrcode')).default
  let tokenValue = ''
  try {
    const expiry = new Date(Date.now() + 10 * 86400000)
    const label = recipient ? `PDF-${recipient}` : 'PDF Export'
    tokenValue = await createAccessToken(label, expiry.toISOString())
  } catch { tokenValue = '' }

  const qrSiteUrl = await QRCode.toDataURL(SITE_URL, { width: 140, margin: 1, color: { dark: '#3b82f6', light: '#ffffff' } })
  const tokenUrl = tokenValue ? `${SITE_URL}#token=${tokenValue}` : SITE_URL
  const qrTokenUrl = await QRCode.toDataURL(tokenUrl, { width: 140, margin: 1, color: { dark: '#222222', light: '#ffffff' } })

  // ═══ Build sections array — each item = one pdf-section div ═══
  const sections = []

  // Header
  sections.push(sec(`<div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:12px;border-bottom:2px solid #3b82f6;">
    <div style="flex:1;padding-right:12px;">
      <div style="font-size:20px;font-weight:700;color:#111;margin-bottom:2px;">${SITE.ownerName}</div>
      <div style="font-size:11px;color:#3b82f6;font-weight:600;margin-bottom:6px;">Product Manager</div>
      <div style="font-size:9px;color:#666;margin-bottom:6px;line-height:1.5;">${esc(hero?.subtitle || '')}</div>
      ${contact?.email ? `<div style="font-size:8px;color:#999;">${esc(contact.email)}</div>` : ''}
    </div>
    <div style="display:flex;gap:8px;flex-shrink:0;">
      <div style="text-align:center;"><img src="${qrSiteUrl}" style="width:60px;height:60px;"/><div style="font-size:6px;color:#3b82f6;margin-top:2px;">Portfolio</div></div>
      ${tokenValue ? `<div style="text-align:center;"><img src="${qrTokenUrl}" style="width:60px;height:60px;"/><div style="font-size:6px;color:#999;margin-top:2px;">Quick Access</div></div>` : ''}
    </div>
  </div>`))

  // Access info
  sections.push(sec(`<div style="background:#f8f9fa;border:1px solid #e5e7eb;border-radius:4px;padding:8px 10px;font-size:7.5px;color:#666;line-height:1.6;">
    <b style="color:#333;">Interactive Portfolio:</b> <span style="color:#3b82f6;">${SITE_URL}</span><br>
    ${tokenValue ? `<b style="color:#333;">Access Token:</b> <span style="font-family:monospace;color:#111;">${esc(tokenValue)}</span> <span style="color:#aaa;">(10일 후 만료)</span><br>` : ''}
    <span style="color:#999;">* QR 코드를 스캔하거나 토큰을 입력하면 프로젝트 상세 내용, 다이어그램, 인터랙티브 경력 타임라인 등을 확인할 수 있습니다.</span>
  </div>`))

  // About + Skills
  if (about?.bio) {
    const skillTags = (about?.skills?.length > 0) ? `<div style="font-size:8px;color:#888;margin-top:6px;">${about.skills.map(sk => esc(typeof sk === 'string' ? sk : sk.label)).join(' · ')}</div>` : ''
    sections.push(sec(`${h2('About')}<div style="font-size:9px;color:#444;line-height:1.7;">${md(about.bio)}</div>${skillTags}`))
  }

  // Key Achievements — each as separate section
  if (achievements?.items?.length > 0) {
    sections.push(sec(h2('Key Achievements')))
    achievements.items.forEach(it => {
      sections.push(sec(`<div><div style="font-size:9.5px;font-weight:600;color:#222;">${esc(it.icon||'')} ${esc(it.title)}</div>
        <div style="font-size:8px;color:#555;line-height:1.6;margin-top:2px;">${md(it.description)}</div></div>`))
    })
  }

  // Featured Projects — each project card as separate section
  if (projects?.groups?.length > 0) {
    sections.push(sec(h2('Featured Projects')))
    projects.groups.forEach((g) => {
      let groupHeader = `<div style="font-size:10.5px;font-weight:700;color:#222;margin-bottom:2px;">${esc(g.title)}</div>`
      if (g.subtitle) groupHeader += `<div style="font-size:8px;color:#999;margin-bottom:4px;">${esc(g.subtitle)}</div>`
      sections.push(sec(groupHeader))

      ;(g.projects||[]).forEach(p => {
        let card = `<div style="padding:8px 10px;background:#fafbfc;border:1px solid #eee;border-radius:4px;">`
        card += `<div style="font-size:9.5px;font-weight:600;color:#222;margin-bottom:2px;">${esc(p.title)}</div>`
        if (p.subtitle) card += `<div style="font-size:7.5px;color:#999;margin-bottom:5px;">${esc(p.subtitle)}</div>`
        if (p.highlights?.length > 0) {
          card += `<div style="margin-bottom:5px;">${p.highlights.map(h => `<span style="color:#3b82f6;font-weight:700;font-size:9px;">${esc(h.value)}</span> <span style="font-size:7.5px;color:#999;">${esc(h.label)}</span>`).join('&nbsp;&nbsp;&nbsp;')}</div>`
        }
        if (p.problem) card += `<div style="font-size:8px;color:#555;line-height:1.6;margin-bottom:3px;"><span style="color:#3b82f6;font-weight:600;">Problem</span> ${md(p.problem)}</div>`
        if (p.solution) card += `<div style="font-size:8px;color:#555;line-height:1.6;margin-bottom:3px;"><span style="color:#3b82f6;font-weight:600;">Solution</span> ${md(p.solution)}</div>`
        if (p.collaboration) card += `<div style="font-size:8px;color:#555;line-height:1.6;margin-bottom:3px;"><span style="color:#3b82f6;font-weight:600;">Collab</span> ${md(p.collaboration)}</div>`
        if (p.result) card += `<div style="font-size:8px;color:#3b82f6;line-height:1.6;margin-bottom:3px;"><b>Result</b> ${md(p.result)}</div>`
        if (p.insight) card += `<div style="font-size:7.5px;color:#888;font-style:italic;margin-top:3px;">💡 ${md(p.insight)}</div>`
        card += '</div>'
        sections.push(sec(card))
      })
    })
  }

  // Work Experience — each company as separate section
  if (resume?.work?.length > 0) {
    sections.push(sec(h2('Work Experience')))
    resume.work.filter(w => w.company).forEach((job, ji) => {
      let html = ''
      if (ji > 0) html += '<div style="border-top:1px solid #ddd;padding-top:14px;margin-bottom:0;"></div>'
      html += `<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:2px;">
        <span style="font-size:11px;font-weight:700;color:#222;">${esc(job.company)}</span>
        <span style="font-size:8px;color:#999;">${esc(job.period)}</span>
      </div>`
      html += `<div style="font-size:8.5px;color:#3b82f6;margin-bottom:6px;">${esc(job.title)}</div>`
      if (job.leaveNote) html += `<div style="font-size:7px;color:#bbb;margin-bottom:4px;">${esc(job.leaveNote)}</div>`

      ;(job.projects||[]).forEach(p => {
        html += `<div style="margin:0 0 6px;padding:4px 0 4px 10px;border-left:2px solid #e5e7eb;">`
        html += `<div style="font-size:8.5px;font-weight:600;color:#333;">${esc(p.title)}</div>`
        const detail = [p.period, p.role, p.team].filter(Boolean).join(' · ')
        if (detail) html += `<div style="font-size:7px;color:#aaa;margin-top:1px;">${esc(detail)}</div>`
        if (p.result) html += `<div style="font-size:7.5px;color:#3b82f6;margin-top:2px;line-height:1.5;">${md(p.result)}</div>`
        html += '</div>'
      })

      if (job.otherProjects) {
        html += `<div style="margin-top:6px;padding:4px 0 4px 10px;border-left:2px solid #f0f0f0;">
          <div style="font-size:7.5px;font-weight:600;color:#aaa;margin-bottom:2px;">Other Tasks</div>
          <div style="font-size:7px;color:#999;line-height:1.6;">${md(job.otherProjects)}</div>
        </div>`
      }
      sections.push(sec(html))
    })
  }

  // Education
  if (resume?.education?.length > 0) {
    let html = h2('Education')
    resume.education.filter(e => e.school).forEach(e => {
      html += `<div style="margin-bottom:4px;"><span style="font-size:10px;font-weight:600;color:#222;">${esc(e.school)}</span>
        ${e.degree ? `<span style="font-size:8px;color:#888;margin-left:6px;">${esc(e.degree)} | ${esc(e.period)}</span>` : ''}</div>`
    })
    sections.push(sec(html))
  }

  // Activities
  if (resume?.activities?.length > 0) {
    let html = h2('Activities')
    resume.activities.filter(a => a.summary).forEach(a => {
      html += `<div style="font-size:8.5px;color:#444;margin-bottom:3px;"><b>${esc(a.year||'')}</b> ${esc(a.category||'')} — ${esc(a.summary)}</div>`
    })
    sections.push(sec(html))
  }

  // ═══ Render: each section → individual canvas ═══
  const wrapper = document.createElement('div')
  wrapper.style.cssText = 'position:absolute;left:0;top:0;width:100%;overflow:visible;z-index:99999;pointer-events:none;'
  const container = document.createElement('div')
  container.style.cssText = 'width:595px;padding:0 40px;box-sizing:border-box;font-family:-apple-system,BlinkMacSystemFont,"Noto Sans KR","Apple SD Gothic Neo","Malgun Gothic",sans-serif;color:#333;line-height:1.5;background:#fff;'
  container.innerHTML = sections.join('')
  wrapper.appendChild(container)
  document.body.appendChild(wrapper)

  await new Promise(r => setTimeout(r, 500))

  const html2canvas = (await import('html2canvas-pro')).default
  const sectionEls = container.querySelectorAll('.pdf-section')
  const sectionCanvases = []

  for (const el of sectionEls) {
    const c = await html2canvas(el, {
      scale: SCALE,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    })
    sectionCanvases.push(c)
  }

  document.body.removeChild(wrapper)

  // ═══ Page fitting: place sections one by one ═══
  const { jsPDF } = await import('jspdf')
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })

  const usableH = A4H_PX - PAD_PX * 2 // usable height per page in px
  let curY = 0 // current y position in px on current page canvas
  let pageIdx = 0

  // Create a blank page canvas
  function createPage() {
    const c = document.createElement('canvas')
    c.width = A4W_PX
    c.height = A4H_PX
    const ctx = c.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, A4W_PX, A4H_PX)
    return c
  }

  function flushPage(pageCanvas) {
    if (pageIdx > 0) doc.addPage()
    doc.addImage(pageCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, A4W, A4H)
    pageIdx++
  }

  let pageCanvas = createPage()

  for (const secCanvas of sectionCanvases) {
    const secH = secCanvas.height
    const secW = secCanvas.width

    // If section doesn't fit on current page AND page isn't empty → new page
    if (curY > 0 && (curY + secH) > usableH) {
      flushPage(pageCanvas)
      pageCanvas = createPage()
      curY = 0
    }

    // If section is taller than a full page → just place it (unavoidable overflow)
    // Draw section onto current page
    const drawY = PAD_PX + curY
    pageCanvas.getContext('2d').drawImage(secCanvas, 0, 0, secW, secH, (A4W_PX - secW) / 2, drawY, secW, secH)
    curY += secH
  }

  // Flush last page
  if (curY > 0) {
    flushPage(pageCanvas)
  }

  // Download
  const blob = doc.output('blob')
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${SITE.ownerName.replace(/[^\w가-힣]/g, '')}_Resume.pdf`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)

  return tokenValue
}
