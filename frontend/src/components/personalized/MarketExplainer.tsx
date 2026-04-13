import { useAppStore } from '../../store/useAppStore'

export default function MarketExplainer() {
  const setDashboardSection = useAppStore(s => s.setDashboardSection)

  return (
    <div className="space-y-5">
      <h4 className="font-display font-semibold text-base text-white">Primary vs Secondary Market</h4>

      {/* Diagram */}
      <div className="rounded-2xl p-6 border overflow-x-auto" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center justify-between min-w-[400px] gap-4">
          {/* Company */}
          <button onClick={() => setDashboardSection('kinu')}
            className="rounded-2xl p-4 border text-center shrink-0 transition-[border-color] duration-200 hover:border-[var(--accent)]"
            style={{ borderColor: 'var(--border)', background: 'rgba(29,158,117,0.06)', width: '110px' }}>
            <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: 'rgba(29,158,117,0.12)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M12 8v8M8 12h8" /></svg>
            </div>
            <p className="font-sans text-xs text-white/70 font-medium">Company</p>
          </button>

          {/* Arrows */}
          <div className="flex flex-col gap-4 flex-1">
            {/* IPO arrow */}
            <div className="relative">
              <div className="h-[2px] w-full" style={{ background: 'var(--teal)' }} />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px]" style={{ borderLeftColor: 'var(--teal)' }} />
              <p className="font-sans text-[9px] text-center mt-1" style={{ color: 'var(--teal)' }}>IPO (Primary Market)</p>
            </div>
            {/* Exchange arrow */}
            <div className="relative">
              <div className="h-[2px] w-full" style={{ background: 'var(--accent)' }} />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[8px]" style={{ borderLeftColor: 'var(--accent)' }} />
              <p className="font-sans text-[9px] text-center mt-1" style={{ color: 'var(--accent)' }}>Stock Exchange</p>
            </div>
          </div>

          {/* You */}
          <button onClick={() => setDashboardSection('kinu')}
            className="rounded-2xl p-4 border text-center shrink-0 transition-[border-color] duration-200 hover:border-[var(--accent)]"
            style={{ borderColor: 'var(--border)', background: 'rgba(192,241,142,0.04)', width: '110px' }}>
            <div className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center" style={{ background: 'rgba(192,241,142,0.08)' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#c0f18e" strokeWidth="1.5"><circle cx="12" cy="8" r="4" /><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2" /></svg>
            </div>
            <p className="font-sans text-xs text-white/70 font-medium">You (Investor)</p>
          </button>
        </div>

        {/* Second arrow: secondary market */}
        <div className="mt-4 flex items-center gap-3 justify-end min-w-[400px]">
          <div className="relative w-[180px]">
            <div className="h-[2px] w-full" style={{ background: 'var(--blue)' }} />
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[8px]" style={{ borderRightColor: 'var(--blue)' }} />
            <p className="font-sans text-[9px] text-center mt-1" style={{ color: 'var(--blue)' }}>You sell to another investor (Secondary Market)</p>
          </div>
        </div>
      </div>

      {/* Explanations */}
      <div className="space-y-3">
        <p className="font-sans text-sm text-white/55 leading-relaxed">
          <span className="font-medium text-white">Primary market:</span> you buy directly from the company during an IPO. The company gets your money.
        </p>
        <p className="font-sans text-sm text-white/55 leading-relaxed">
          <span className="font-medium text-white">Secondary market:</span> you buy from another investor on the stock exchange. The company gets nothing — this is just investors trading with each other.
        </p>
        <p className="font-sans text-sm text-white/55 leading-relaxed">
          99% of investing happens in the secondary market. When you buy a Nifty 50 index fund, you're in the secondary market.
        </p>
      </div>
    </div>
  )
}
