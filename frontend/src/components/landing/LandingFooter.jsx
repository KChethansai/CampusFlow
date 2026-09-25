import { Link } from 'react-router';

export default function LandingFooter() {
  return (
    <footer className="border-t border-black/10 dark:border-white/10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <p className="flex items-center gap-2">
          <span
            className="w-7 h-7 rounded-full bg-[#A94727] text-white grid place-items-center font-display font-bold text-xs"
            aria-hidden
          >
            C
          </span>
          <span className="font-display font-semibold tracking-tight">CampusFlow</span>
          <span className="text-xs text-[#4B5563] dark:text-[#A7B0BF]">
            © {new Date().getFullYear()}
          </span>
        </p>
        <nav className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm font-medium" aria-label="Footer">
          <Link to="/dashboard" className="py-1 text-[#4B5563] dark:text-[#A7B0BF] hover:text-[#100D0B] dark:hover:text-white transition-colors">
            Dashboard
          </Link>
          <Link to="/placement" className="py-1 text-[#4B5563] dark:text-[#A7B0BF] hover:text-[#100D0B] dark:hover:text-white transition-colors">
            Placement
          </Link>
          <Link to="/login" className="py-1 text-[#4B5563] dark:text-[#A7B0BF] hover:text-[#100D0B] dark:hover:text-white transition-colors">
            Sign In
          </Link>
        </nav>
      </div>
    </footer>
  );
}
