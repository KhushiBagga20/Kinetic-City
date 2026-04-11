export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-[#001015]">
      <div className="container mx-auto px-6 py-8 md:py-12 flex flex-col md:flex-row justify-between items-center md:items-end gap-6 md:gap-0">
        <div className="flex flex-col items-center md:items-start">
          <span className="font-display font-bold text-xl tracking-wider text-white mb-2">
            KINETIC
          </span>
          <p className="font-mono text-[10px] text-white/40 tracking-wider">
            © {new Date().getFullYear()} KINETIC ARCHITECT FINANCE. ALL RIGHTS RESERVED.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-6 text-[10px] md:text-xs font-sans font-medium text-white/50 tracking-wider uppercase">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-white transition-colors">Security</a>
          <a href="#" className="hover:text-white transition-colors">Institutional</a>
        </div>
      </div>
    </footer>
  )
}
