import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../store/useAppStore'
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

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Check if this user has a persisted session (completed quiz before)
  const hasPreviousSession = !!fearType && !!userName

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.')
      return
    }

    setLoading(true)
    setError('')

    // FIREBASE SYNC OVERRIDE ───────────────────────────────────────────────
    const { isFirebaseConfigured, auth } = await import('../../lib/firebase')
    
    if (isFirebaseConfigured && auth) {
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
