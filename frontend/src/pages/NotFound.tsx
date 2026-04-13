import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        {/* Logo mark */}
        <div className="w-16 h-16 mx-auto mb-8 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(192,241,142,0.08)', border: '1px solid rgba(192,241,142,0.15)' }}>
          <span className="font-display font-bold text-2xl" style={{ color: 'var(--accent)' }}>K</span>
        </div>

        <h1 className="font-display font-bold text-4xl text-white mb-3">404</h1>
        <p className="font-sans text-base text-white/40 mb-8">Page not found.</p>

        <button
          onClick={() => navigate('/')}
          className="px-8 py-3.5 rounded-full font-sans font-bold text-sm active:scale-[0.97] transition-transform duration-200"
          style={{ background: 'var(--accent)', color: '#0a1a00', minHeight: '44px' }}
        >
          Go home →
        </button>
      </motion.div>
    </div>
  )
}
