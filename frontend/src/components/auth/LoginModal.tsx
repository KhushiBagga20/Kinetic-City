import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
import { isFirebaseConfigured } from '../../lib/firebase'
import { X, ArrowRight, Loader2 } from 'lucide-react'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const navigate = useNavigate()
  const userName = useAppStore(s => s.userName)
  const fearType = useAppStore(s => s.fearType)
  const updateStreak = useAppStore(s => s.updateStreak)
  const setView = useAppStore(s => s.setView)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  // Check if this user has a persisted session (completed quiz before)
  const hasPreviousSession = !!fearType && !!userName

  // ── Google Sign-In handler ───────────────────────────────────────────────
  async function handleGoogleSignIn() {
    if (!isFirebaseConfigured) return
    setGoogleLoading(true)
    setError('')
    try {
      const { signInWithGoogle } = await import('../../lib/firebase')
      const user = await signInWithGoogle()
      const displayName = user.displayName || 'Investor'
      useAppStore.getState().setUserProfile(displayName, user.email || '', '')
      useAppStore.setState({
        isAuthenticated: true,
        userId: user.uid,
        userEmail: user.email || '',
        userName: displayName,
        isNewUser: false,  // returning user — skip onboarding
      })
      updateStreak()
      setGoogleLoading(false)
      onClose()
      // Navigate based on whether user has a fear profile
      const currentFearType = useAppStore.getState().fearType
      if (currentFearType) {
        setView('dashboard')
        navigate('/dashboard/home')
      } else {
        navigate('/start')
      }
    } catch (err: any) {
      setGoogleLoading(false)
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Try email login instead.')
      }
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.')
      return
    }

    setLoading(true)
    setError('')

    // FIREBASE SYNC OVERRIDE ───────────────────────────────────────────────
    const { isFirebaseConfigured: fbConfigured, auth } = await import('../../lib/firebase')
    
    if (fbConfigured && auth) {
      try {
        const { signInWithEmailAndPassword } = await import('firebase/auth')
        await signInWithEmailAndPassword(auth, email, password)
        setLoading(false)
        onClose()
        navigate('/dashboard/home')
        return
      } catch (err: any) {
        setLoading(false)
        console.error("Firebase Auth Error:", err)
        setError('Invalid credentials or no profile found.')
        return
      }
    }

    // FALLBACK MOCK LOGIN ──────────────────────────────────────────────────
    // Simulate login delay
    await new Promise(r => setTimeout(r, 600))

    // If user has a previous session (persisted in localStorage), let them in
    if (hasPreviousSession) {
      useAppStore.setState({
        isAuthenticated: true,
        isNewUser: false,   // returning user
        userId: useAppStore.getState().userId || 'local_' + Math.random().toString(36).substring(2, 10),
        userEmail: email.trim() || useAppStore.getState().userEmail,
      })
      updateStreak()
      setLoading(false)
      onClose()
      navigate('/dashboard/home')
      return
    }

    // No previous session — suggest they take the quiz first
    setLoading(false)
    setError('No profile found. Take the Fear Quiz to create your dashboard.')
  }

  function goToQuiz() {
    onClose()
    navigate('/start')
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 z-[61] flex items-center justify-center px-6"
            onClick={onClose}
          >
            <div
              className="w-full max-w-md rounded-3xl p-8 border relative overflow-hidden"
              onClick={e => e.stopPropagation()}
              style={{
                background: 'var(--bg)',
                borderColor: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(40px)',
              }}
            >
              {/* Ambient glow */}
              <div className="absolute inset-0 pointer-events-none" style={{
                background: 'radial-gradient(ellipse 60% 40% at 50% 30%, rgba(192,241,142,0.04), transparent)',
              }} />

              {/* Close button */}
              <button
                onPointerDown={(e) => { e.stopPropagation(); onClose(); }}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 transition-colors cursor-pointer"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <X className="w-4 h-4 pointer-events-none" />
              </button>

              {/* Content */}
              <div className="relative z-10">
                {/* Header */}
                <h2 className="font-display font-semibold text-2xl text-white mb-1 tracking-tight">
                  Welcome back
                </h2>
                <p className="font-sans text-sm text-white/40 mb-8">
                  {hasPreviousSession
                    ? `Your dashboard is waiting, ${userName}.`
                    : 'Log in to continue your journey.'
                  }
                </p>

                {/* Previous session indicator */}
                {hasPreviousSession && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl p-4 border mb-6 flex items-center gap-3"
                    style={{ background: 'rgba(192,241,142,0.04)', borderColor: 'rgba(192,241,142,0.12)' }}
                  >
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold text-sm"
                      style={{ background: 'rgba(192,241,142,0.1)', color: 'var(--accent)' }}>
                      {userName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-sans text-sm text-white/70 font-medium">{userName}</p>
                      <p className="font-sans text-[10px] text-white/30">Session found in this browser</p>
                    </div>
                  </motion.div>
                )}

                {/* ── Google Sign-In button ──────────────────────────────── */}
                {isFirebaseConfigured && (
                  <>
                    <button
                      type="button"
                      onClick={handleGoogleSignIn}
                      disabled={googleLoading}
                      className="w-full h-12 rounded-2xl flex items-center justify-center gap-3 transition-[background-color] duration-150 disabled:opacity-50 mb-0"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.09)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                    >
                      {googleLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                      ) : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" className="shrink-0">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.47 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                          </svg>
                          <span className="text-[14px] font-medium text-white/75">Continue with Google</span>
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-3 my-5">
                      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                      <span className="text-[11px] text-white/25 font-sans">or continue with email</span>
                      <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    </div>
                  </>
                )}

                {/* Form */}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      placeholder="Email address"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl font-sans text-sm text-white placeholder-white/20 outline-none transition-[border-color] duration-200 focus:border-white/20"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    />
                  </div>
                  <div>
                    <input
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full px-5 py-4 rounded-2xl font-sans text-sm text-white placeholder-white/20 outline-none transition-[border-color] duration-200 focus:border-white/20"
                      style={{
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                      }}
                    />
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="font-sans text-xs text-white/50 leading-relaxed"
                      >
                        {error}{' '}
                        <button type="button" onClick={goToQuiz} className="font-medium underline" style={{ color: 'var(--accent)' }}>
                          Take the quiz →
                        </button>
                      </motion.p>
                    )}
                  </AnimatePresence>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full py-4 rounded-full font-sans font-bold text-sm transition-all duration-200 box-glow active:scale-[0.97] disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ background: 'var(--accent)', color: '#0a1a00' }}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      <>
                        Log in
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3 my-6">
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  <span className="font-sans text-[10px] text-white/20 uppercase tracking-wider">or</span>
                  <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                </div>

                {/* Quiz link */}
                <button
                  onClick={goToQuiz}
                  className="w-full py-3.5 rounded-full font-sans text-sm font-medium border transition-[background-color,border-color] duration-200 hover:bg-white/[0.03]"
                  style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)' }}
                >
                  New here? Take the Fear Quiz
                </button>

                <p className="text-center text-[10px] font-sans text-white/15 mt-4">
                  No financial data leaves your browser. Your profile is stored locally.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
