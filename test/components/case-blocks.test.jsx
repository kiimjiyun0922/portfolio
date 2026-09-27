// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import CaseBlockList from '../../src/components/CaseBlocks.jsx'
import { blockPlacement, clampPercent, isVideoUrl } from '../../src/utils/caseBlocks.js'

beforeEach(() => {
  vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(function play() {
    this.dispatchEvent(new Event('play'))
    return Promise.resolve()
  })
  vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(function pause() {
    this.dispatchEvent(new Event('pause'))
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('case block data helpers', () => {
  it('detects video files including storage download URLs', () => {
    expect(isVideoUrl('/media/prototype.mp4')).toBe(true)
    expect(isVideoUrl('https://firebasestorage.googleapis.com/v0/b/x/o/portfolio%2Fclip.webm?alt=media&token=1')).toBe(true)
    expect(isVideoUrl('/media/cover.webp')).toBe(false)
    expect(isVideoUrl('/media/cover.webp', 'video')).toBe(true)
    expect(isVideoUrl('/media/clip.mp4', 'image')).toBe(false)
  })

  it('keeps pins inside the image and defaults unknown placements', () => {
    expect(clampPercent(140)).toBe(100)
    expect(clampPercent(-4)).toBe(0)
    expect(clampPercent('x')).toBe(50)
    expect(blockPlacement({ placement: 'nowhere' })).toBe('solution')
  })
})

describe('case block rendering', () => {
  const blocks = [
    { id: 'a', type: 'stats', placement: 'problem', title: 'Findings', items: [{ value: '83.7%', label: 'Login clicks', source: 'Beusable' }, { value: '', label: 'ignored' }] },
    { id: 'b', type: 'compare', placement: 'solution', beforeUrl: '/before.webp', beforeAlt: 'Old hero', afterUrl: '/after.webp', afterAlt: 'New hero' },
    { id: 'c', type: 'media', placement: 'solution', url: '/prototype.mp4', alt: 'Prototype recording' },
    { id: 'd', type: 'media', placement: 'solution', url: '' },
    { id: 'e', type: 'unknown', placement: 'solution' },
    { id: 'f', type: 'annotated', placement: 'validation', url: '/pricing.webp', alt: 'Pricing', pins: [{ x: 20, y: 30, note: 'Recommended plan badge' }] },
  ]

  it('renders only the blocks for the requested placement', () => {
    render(<CaseBlockList blocks={blocks} placement="problem" />)
    expect(screen.getByText('83.7%')).toBeTruthy()
    expect(screen.queryByText('ignored')).toBeNull()
    expect(screen.queryByAltText('Old hero')).toBeNull()
  })

  it('renders nothing when a placement has no usable blocks', () => {
    const { container } = render(<CaseBlockList blocks={blocks} placement="brief" />)
    expect(container.innerHTML).toBe('')
    const empty = render(<CaseBlockList blocks={[{ type: 'media', placement: 'userFlow', url: '' }]} placement="userFlow" />)
    expect(empty.container.innerHTML).toBe('')
  })

  it('moves the comparison divider with the accessible range control', () => {
    render(<CaseBlockList blocks={blocks} placement="solution" />)
    const range = screen.getByLabelText('Compare Before and After')
    fireEvent.change(range, { target: { value: '30' } })
    expect(range.closest('.case-block__compare').style.getPropertyValue('--case-compare-position')).toBe('30%')
  })

  it('offers a pause control for autoplaying video and skips empty media', () => {
    const { container } = render(<CaseBlockList blocks={blocks} placement="solution" />)
    expect(container.querySelectorAll('.case-block--media')).toHaveLength(1)
    const toggle = screen.getByRole('button', { name: 'Pause' })
    fireEvent.click(toggle)
    expect(screen.getByRole('button', { name: 'Play' })).toBeTruthy()
  })

  it('pairs numbered pins with written notes', () => {
    render(<CaseBlockList blocks={blocks} placement="validation" />)
    expect(screen.getByText('Recommended plan badge')).toBeTruthy()
    expect(document.querySelector('.case-block__pin').style.left).toBe('20%')
  })
})
