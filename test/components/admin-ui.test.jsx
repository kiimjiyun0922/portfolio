// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import { Field, FloatingJumpNav, Toast } from '../../src/components/admin/AdminUI.jsx'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('admin UI accessibility', () => {
  it('associates field labels with their controls', () => {
    render(<Field label="프로젝트 이름" value="Portfolio" onChange={() => {}} />)
    expect(screen.getByLabelText('프로젝트 이름').value).toBe('Portfolio')
  })

  it('announces toast messages as status updates', () => {
    render(<Toast message="저장되었습니다" />)
    expect(screen.getByRole('status').textContent).toContain('저장되었습니다')
  })

  it('exposes and operates jump navigation with buttons', () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 500 })
    window.scrollTo = vi.fn()
    const jump = vi.fn()
    render(<FloatingJumpNav items={[{ label: '프로젝트', onClick: jump }]} />)

    const toggle = screen.getByRole('button', { name: '페이지 바로가기 열기' })
    expect(toggle.getAttribute('aria-expanded')).toBe('false')
    fireEvent.click(toggle)
    fireEvent.click(screen.getByRole('button', { name: '프로젝트' }))
    expect(jump).toHaveBeenCalledOnce()
  })
})
