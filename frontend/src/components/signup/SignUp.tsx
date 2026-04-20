import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react'
import { useAppStore, type FearType } from '../../store/useAppStore'
import { postCreateUser } from '../../lib/api'
import { isFirebaseConfigured } from '../../lib/firebase'

// ── Personalized headlines per fear type ──────────────────────────────────────

const HEADLINES: Record<FearType, string> = {
  loss: "Let's turn your caution into confidence.",
  jargon: "Let's make this simple. Actually simple.",
  scam: "No tricks. No fees. Just honest math.",
  trust: "You don't have to trust us. Trust the numbers.",
}

// ── Fear type profiles for badge ─────────────────────────────────────────────

const FEAR_BADGES: Record<FearType, { name: string; color: string; bg: string }> = {
  loss: { name: 'Loss Avoider', color: '#E24B4A', bg: 'rgba(226,75,74,0.10)' },
  jargon: { name: 'Clarity Seeker', color: '#378ADD', bg: 'rgba(55,138,221,0.10)' },
  scam: { name: 'Pattern Detector', color: '#EF9F27', bg: 'rgba(239,159,39,0.10)' },
  trust: { name: 'Independence Guardian', color: '#1D9E75', bg: 'rgba(29,158,117,0.10)' },
}

// ── Input style helper ──────────────────────────────────────────────────────

const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  border: '1px solid rgba(255,255,255,0.08)',
}

// ── Component ────────────────────────────────────────────────────────────────

interface SignUpProps {
  onComplete: () => void
}

export default function SignUp({ onComplete }: SignUpProps) {
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const setUserProfile = useAppStore(s => s.setUserProfile)
  const setUserAge = useAppStore(s => s.setUserAge)
  const setSipSetupDate = useAppStore(s => s.setSipSetupDate)
  const resetForNewUser = useAppStore(s => s.resetForNewUser)
  const updateStreak = useAppStore(s => s.updateStreak)

  const [name, setName] = useState('')
  const [age, setAge] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')

  const headline = HEADLINES[fearType]
  const badge = FEAR_BADGES[fearType]

  const isValid = name.trim().length > 0
    && age.trim().length > 0 && Number(age) >= 18 && Number(age) <= 80
    && email.trim().length > 0
    && password.length >= 8

  function generateGuestId() {
    return 'guest_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
  }

  // ── Google Sign-In handler ─────────────────────────────────────────────────
  async function handleGoogleSignIn() {
    if (!isFirebaseConfigured) return
    setGoogleLoading(true)
    setError('')
    try {
      const { signInWithGoogle } = await import('../../lib/firebase')
      const user = await signInWithGoogle()
      const savedFearType = useAppStore.getState().fearType
      const savedMetaphor = useAppStore.getState().metaphorStyle
      resetForNewUser()
      if (savedFearType) {
        useAppStore.setState({ fearType: savedFearType, metaphorStyle: savedMetaphor })
      }
      const displayName = user.displayName || 'Investor'
      setUserProfile(displayName, user.email || '', '')
      useAppStore.setState({
        isAuthenticated: true,
        userId: user.uid,
        userEmail: user.email || '',
        userName: displayName,
      })
      setSipSetupDate(new Date().toISOString().split('T')[0])
      updateStreak()
      onComplete()
    } catch (err: any) {
      setGoogleLoading(false)
      if (err.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Try email sign-up instead.')
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValid) return

    setLoading(true)
    setError('')

    const trimmedName = name.trim()
    const trimmedEmail = email.trim()
    const userAge = Math.max(18, Math.min(80, Number(age)))

    // Save the current fearType before reset (quiz just set it)
    const savedFearType = useAppStore.getState().fearType
    const savedMetaphor = useAppStore.getState().metaphorStyle

    // Clear all previous session data
    resetForNewUser()

    // Restore quiz results that were just set
    if (savedFearType) {
      useAppStore.setState({ fearType: savedFearType, metaphorStyle: savedMetaphor })
    }

    // Set new user data
    setUserProfile(trimmedName, trimmedEmail, '')
    setUserAge(userAge)
    setSipSetupDate(new Date().toISOString().split('T')[0])

    // FIREBASE SYNC OVERRIDE ───────────────────────────────────────────────
    const { isFirebaseConfigured: fbConfigured, auth, db } = await import('../../lib/firebase')
    
    if (fbConfigured && auth && db) {
      try {
        const { createUserWithEmailAndPassword } = await import('firebase/auth')
        const { doc, setDoc } = await import('firebase/firestore')
        
        const userCredential = await createUserWithEmailAndPassword(auth, trimmedEmail, password)
        const user = userCredential.user

        // Save foundational profile to Firestore
        await setDoc(doc(db, 'users', user.uid), {
          userName: trimmedName,
          userAge: userAge,
          fearType: savedFearType ?? 'loss',
          metaphorStyle: savedMetaphor ?? 'generic',
          createdAt: new Date().toISOString()
        })
        
        useAppStore.setState({ userId: user.uid, isAuthenticated: true })
        updateStreak()
        await new Promise(resolve => setTimeout(resolve, 400))
        onComplete()
        return
      } catch (err: any) {
        setLoading(false)
        console.error("Firebase Auth Error:", err)
        setError('Could not create account: ' + err.message)
        return
      }
    }

    // FALLBACK MOCK API LOGIN ──────────────────────────────────────────────
    // Call backend to create user
    try {
      const res = await postCreateUser({
        name: trimmedName,
        email: trimmedEmail,
        fear_type: savedFearType ?? 'loss',
        metaphor_style: savedMetaphor ?? 'generic',
        password,
      })
      if (res.success && res.user_id) {
        useAppStore.setState({ userId: res.user_id, isAuthenticated: true })
      }
    } catch {
      // Backend offline — still set auth for offline usage
      useAppStore.setState({
        userId: 'local_' + Math.random().toString(36).substring(2, 10),
        isAuthenticated: true,
      })
    }

    updateStreak()
    await new Promise(resolve => setTimeout(resolve, 400))
    onComplete()
  }

  function handleSkip() {
    setLoading(true)
    const gid = generateGuestId()
    setUserProfile('', '', gid)
    useAppStore.setState({
      isAuthenticated: true,
      userId: 'guest_' + gid,
    })
    updateStreak()

    setTimeout(() => {
      onComplete()
    }, 400)
  }

  const fields = [
    { key: 'name', delay: 0.26 },
    { key: 'age', delay: 0.30 },
    { key: 'email', delay: 0.34 },
    { key: 'password', delay: 0.38 },
  ]

  return (
    <div className="min-h-screen bg-[#00161b] flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{
          background: `radial-gradient(ellipse 50% 40% at 50% 50%, ${badge.bg}, transparent)`,
        }}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Fear type badge — carried from reveal via layoutId */}
        <motion.div
          layoutId="fear-badge"
          className="rounded-2xl px-5 py-3 flex items-center gap-3 border mx-auto w-fit mb-10"
          style={{ background: badge.bg, borderColor: `${badge.color}30` }}
        >
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: badge.color }}
          />
          <span
            className="text-xs font-display font-bold tracking-wide"
            style={{ color: badge.color }}
          >
            {badge.name}
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
          className="font-display font-bold text-white text-center mb-4 tracking-tight leading-[1.15]"
          style={{ fontSize: 'clamp(1.6rem, 4vw, 2.4rem)' }}
        >
          {headline}
        </motion.h1>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18, ease: 'easeOut' }}
          className="font-sans text-sm text-white/50 text-center mb-10 leading-relaxed max-w-sm mx-auto"
        >
          Save your fear profile and get a dashboard built around you.
        </motion.p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ── Google Sign-In button ──────────────────────────────────── */}
          {isFirebaseConfigured && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.22, ease: 'easeOut' }}
            >
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleLoading}
                className="w-full h-12 rounded-2xl flex items-center justify-center gap-3 transition-[background-color] duration-150 disabled:opacity-50"
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
            </motion.div>
          )}

          {/* ── Divider ───────────────────────────────────────────────── */}
          {isFirebaseConfigured && (
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <span className="text-[11px] text-white/25 font-sans">or continue with email</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
          )}

          {/* Name field */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: fields[0].delay, ease: 'easeOut' }}
          >
            <input
              type="text"
              placeholder="What should we call you?"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl font-sans text-sm text-white placeholder-white/25 outline-none transition-all duration-200 focus:border-white/20"
              style={INPUT_STYLE}
            />
          </motion.div>

          {/* Age field */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: fields[1].delay, ease: 'easeOut' }}
          >
            <input
              type="number"
              placeholder="Your age"
              min={18}
              max={80}
              value={age}
              onChange={e => setAge(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl font-sans text-sm text-white placeholder-white/25 outline-none transition-all duration-200 focus:border-white/20"
              style={INPUT_STYLE}
            />
          </motion.div>

          {/* Email field */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: fields[2].delay, ease: 'easeOut' }}
          >
            <input
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl font-sans text-sm text-white placeholder-white/25 outline-none transition-all duration-200 focus:border-white/20"
              style={INPUT_STYLE}
            />
          </motion.div>

          {/* Password field */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: fields[3].delay, ease: 'easeOut' }}
            className="relative"
          >
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Create a password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-5 py-4 rounded-2xl font-sans text-sm text-white placeholder-white/25 outline-none transition-all duration-200 focus:border-white/20 pr-12"
              style={INPUT_STYLE}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white/25 hover:text-white/50 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
            {password.length > 0 && password.length < 8 && (
              <p className="font-sans text-[10px] text-white/25 mt-1.5 pl-1">
                Minimum 8 characters
              </p>
            )}
          </motion.div>

          {/* Error */}
          {error && (
            <p className="font-sans text-xs text-center" style={{ color: 'var(--danger)' }}>{error}</p>
          )}

          {/* Submit button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.42, ease: 'easeOut' }}
          >
            <button
              type="submit"
              disabled={loading || !isValid}
              className="w-full py-4 rounded-full font-sans font-bold text-sm transition-all duration-200 box-glow active:scale-[0.97] disabled:opacity-40 flex items-center justify-center gap-2"
              style={{
                background: 'var(--color-primary-fixed)',
                color: '#0a1a00',
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Building your dashboard...
                </>
              ) : (
                <>
                  Build my dashboard
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>
        </form>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center text-[11px] font-sans text-white/25 mt-5"
        >
          No spam. No financial advice. No BS.
        </motion.p>

        {/* Skip link */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.58 }}
          onClick={handleSkip}
          className="block mx-auto mt-4 text-xs font-sans text-white/30 hover:text-white/55 transition-colors duration-200"
        >
          Skip for now →
        </motion.button>
      </motion.div>
    </div>
  )
}
