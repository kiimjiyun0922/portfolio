import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithCustomToken, onAuthStateChanged, signOut } from 'firebase/auth'
import { SITE } from '../site.config'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
}

const hasConfig = !!firebaseConfig.projectId

// The only Google account allowed into the admin console.
// Firestore rules enforce the same email server-side for content writes.
export const OWNER_EMAIL = SITE.ownerEmail

let db = null
let auth = null

if (hasConfig) {
  const app = initializeApp(firebaseConfig)
  db = getFirestore(app)
  auth = getAuth(app)
}

// Owner sign-in: Firestore rules only allow content writes from the owner's Google account
export async function signInOwner() {
  if (!auth) throw new Error('Firebase가 설정되지 않았습니다')
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })
  const res = await signInWithPopup(auth, provider)
  return res.user
}

export function signOutOwner() {
  if (auth) return signOut(auth)
}

// Visitor sign-in with a server-minted custom token ({visitor: true} claim)
// — Firestore rules gate content reads on this claim.
export async function signInVisitor(customToken) {
  if (!auth) throw new Error('Firebase가 설정되지 않았습니다')
  return signInWithCustomToken(auth, customToken)
}

// cb receives the current user (or null); returns unsubscribe
export function watchOwnerAuth(cb) {
  if (!auth) { cb(null); return () => {} }
  return onAuthStateChanged(auth, cb)
}

export { db, auth, hasConfig }
