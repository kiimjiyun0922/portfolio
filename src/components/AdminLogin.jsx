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
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white">Admin 로그인</h2>
          </div>

          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-3 bg-white hover:bg-gray-100 disabled:opacity-60 text-gray-900 font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2.5"
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
              className="text-red-400 text-sm text-center mt-4"
            >
              {error}
            </motion.p>
          )}

        </div>

        <div className="text-center mt-4">
          <a href="#" className="text-gray-400 hover:text-gray-200 text-xs">
            ← 포트폴리오로 돌아가기
          </a>
        </div>
      </motion.div>
    </div>
  )
}
