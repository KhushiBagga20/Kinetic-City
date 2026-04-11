import { Bell, Settings, User, Search } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

export default function DashboardNavbar() {
  const setView = useAppStore(state => state.setView)

  const navLinks = [
    { label: 'Dashboard', active: true },
    { label: 'Portfolio', active: false },
    { label: 'Market', active: false },
    { label: 'Tools', active: false },
  ]

  return (
    <nav className="w-full bg-[#00161b] border-b border-white/[0.06] sticky top-0 z-40">
      <div className="max-w-[1400px] mx-auto px-6 md:px-12 flex items-center justify-between h-[64px]">

        {/* Left: Logo + Nav Links */}
        <div className="flex items-center gap-10">
          {/* Logo */}
          <div
            onClick={() => setView('landing')}
            className="flex items-center gap-2 cursor-pointer shrink-0"
          >
            <div className="w-5 h-5 bg-[#c0f18e] flex items-center justify-center">
              <div className="w-1.5 h-3.5 bg-[#00161b] skew-x-[15deg]" />
            </div>
            <span className="font-display font-semibold text-base tracking-widest text-white">
              KINETIC
            </span>
          </div>

          {/* Nav Links — all sit in the same flex row as the nav bar */}
          <div className="hidden md:flex items-stretch h-[64px]">
            {navLinks.map(link => (
              <a
                key={link.label}
                href="#"
                className={`
                  relative flex items-center px-4 text-sm font-sans transition-colors duration-200
                  ${link.active
                    ? 'text-[#c0f18e]'
                    : 'text-white/45 hover:text-white/80'
                  }
                `}
              >
                {link.label}
                {/* Underline sits flush at the bottom of the navbar */}
                {link.active && (
                  <span className="absolute bottom-0 left-4 right-4 h-[2px] bg-[#c0f18e] rounded-t-full" />
                )}
              </a>
            ))}
          </div>
        </div>

        {/* Right: Search + Icons */}
        <div className="flex items-center gap-5">
          {/* Search bar */}
          <div className="hidden lg:flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-lg px-3.5 py-2 w-64">
            <Search className="w-3.5 h-3.5 text-white/35 shrink-0" />
            <input
              type="text"
              placeholder="Search stocks, mutual funds..."
              className="bg-transparent border-none outline-none text-sm text-white/80 w-full placeholder:text-white/35 font-sans"
            />
          </div>

          {/* Icon row */}
          <div className="flex items-center gap-4">
            <button className="text-white/45 hover:text-white/80 transition-colors">
              <Bell className="w-[18px] h-[18px]" />
            </button>
            <button className="text-white/45 hover:text-white/80 transition-colors">
              <Settings className="w-[18px] h-[18px]" />
            </button>
            <div className="w-8 h-8 rounded-full bg-[#152e34] border border-white/10 flex items-center justify-center">
              <User className="w-4 h-4 text-white/70" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
