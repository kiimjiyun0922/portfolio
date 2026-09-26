import { useState } from 'react'
import { motion } from 'framer-motion'
import { signInOwner, signOutOwner, OWNER_EMAIL } from '../utils/firebase'
import { recordSecurityAlert } from '../utils/crypto'

export default function AdminLogin() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      const user = await signInOwner()
      if (user && user.email !== OWNER_EMAIL) {
        // Wrong Google account — sign it out immediately and log the attempt
        recordSecurityAlert('admin_fail', `권한 없는 구글 계정: ${user.email}`)
        await signOutOwner()
        setError('이 구글 계정에는 관리자 권한이 없습니다.')
      }
      // On success, the auth listener in App switches to the admin console automatically
    } catch (e) {
      if (e?.code !== 'auth/popup-closed-by-user' && e?.code !== 'auth/cancelled-popup-request') {
        setError('로그인에 실패했습니다: ' + (e?.message || e))
      }
    }
    setLoading(false)
  }

  return (
    <div className="admin-shell admin-login-shell" data-admin-theme="light">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="admin-login"
      >
        <section className="admin-login-card">
          <header>
            <p><span className="admin-status-dot" />Private Archive</p>
            <h1>관리자 로그인</h1>
            <span>포트폴리오 콘텐츠와 방문 권한을 관리합니다.</span>
          </header>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="admin-login-button"
          >
            <svg className="w-4.5 h-4.5" width="18" height="18" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            {loading ? '로그인 중...' : 'Google로 로그인'}
          </button>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="admin-login-error"
              role="alert"
            >
              {error}
            </motion.p>
          )}

        </section>

        <div className="admin-login-back">
          <a href="/">
            ← 포트폴리오로 돌아가기
          </a>
        </div>
      </motion.div>
    </div>
  )
}
