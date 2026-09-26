// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'

import { Field, FloatingJumpNav, JsonBulkEditor, SelectField, Toast } from '../../src/components/admin/AdminUI.jsx'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('admin UI accessibility', () => {
  it('associates field labels with their controls', () => {
    render(<Field label="프로젝트 이름" value="Portfolio" onChange={() => {}} />)
    expect(screen.getByLabelText('프로젝트 이름').value).toBe('Portfolio')
  })

  it('uses a labelled select for constrained values', () => {
    const change = vi.fn()
    render(<SelectField label="배지 유형" value="ai" onChange={change} options={[{ value: 'ai', label: 'AI' }, { value: 'data', label: '데이터' }]} />)
    const select = screen.getByLabelText('배지 유형')
    expect(select.value).toBe('ai')
    fireEvent.change(select, { target: { value: 'data' } })
    expect(change).toHaveBeenCalledWith('data')
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

  it('applies valid bulk JSON without saving implicitly', () => {
    const apply = vi.fn()
    render(<JsonBulkEditor value={{ heading: '기존' }} onApply={apply} />)
    fireEvent.click(screen.getByRole('button', { name: /JSON 편집/ }))
    const editor = screen.getByRole('textbox')
    fireEvent.change(editor, { target: { value: '{"heading":"변경"}' } })
    fireEvent.click(screen.getByRole('button', { name: '차이 확인' }))
    expect(screen.getByText('적용 전 차이')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: '편집 상태에 적용' }))
    expect(apply).toHaveBeenCalledWith({ heading: '변경' })
  })

  it('keeps the bulk editor open when JSON is invalid', () => {
    render(<JsonBulkEditor value={{}} onApply={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: /JSON 편집/ }))
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '{invalid' } })
    fireEvent.click(screen.getByRole('button', { name: '차이 확인' }))
    expect(screen.getByRole('alert').textContent).toBeTruthy()
    expect(screen.getByRole('dialog')).toBeTruthy()
  })
})
