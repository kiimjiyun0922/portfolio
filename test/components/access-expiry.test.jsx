// @vitest-environment jsdom
import { act, cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TokenExpiryBanner } from '../../src/App.jsx'

describe('visitor token expiry', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-26T00:00:00Z'))
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('shows a live warning in the final ten minutes and expires on time', async () => {
    const onExpired = vi.fn()
    render(<TokenExpiryBanner expiresAt={Date.now() + 10_000} onExpired={onExpired} />)

    expect(screen.getByRole('status').textContent).toContain('00:10')
    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
    expect(screen.getByRole('status').textContent).toContain('00:09')

    await act(async () => { await vi.advanceTimersByTimeAsync(9000) })
    expect(onExpired).toHaveBeenCalledOnce()
  })

  it('expires immediately when a suspended tab returns after the deadline', () => {
    const onExpired = vi.fn()
    render(<TokenExpiryBanner expiresAt={Date.now() + 1000} onExpired={onExpired} />)

    vi.setSystemTime(new Date('2026-09-26T00:00:02Z'))
    window.dispatchEvent(new Event('focus'))
    expect(onExpired).toHaveBeenCalledOnce()
  })
})
