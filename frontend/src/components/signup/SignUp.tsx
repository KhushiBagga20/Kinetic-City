import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react'
import { useAppStore, type FearType } from '../../store/useAppStore'
import { postCreateUser } from '../../lib/api'

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
    const { isFirebaseConfigured, auth, db } = await import('../../lib/firebase')
    
    if (isFirebaseConfigured && auth && db) {
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
    setUserProfile('', '', generateGuestId())
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
