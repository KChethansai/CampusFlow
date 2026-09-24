import { useReducedMotion } from '../../system/motion';
import { ShieldCheck, Sparkles, UserCheck, Layers } from 'lucide-react';

/**
 * AuthVisual
 * Cinematic left-panel centerpiece for the authentication portal.
 * Depicts the synchronized multi-role campus operating system with
 * subtle orbital geometry, glowing data conduits, and genuine platform capabilities.
 */
export default function AuthVisual() {
  const reduced = useReducedMotion();

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-8 sm:p-12 overflow-hidden select-none bg-[#100D0B] text-white">
      {/* Background ambient lighting */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
        style={{
          background:
            'radial-gradient(600px 420px at 15% 15%, rgba(216,109,62,0.22), transparent 70%), radial-gradient(520px 360px at 85% 85%, rgba(121,184,166,0.14), transparent 70%), radial-gradient(400px 300px at 50% 50%, rgba(231,166,109,0.12), transparent 75%)'
        }}
      />

      {/* Subtle fine dot grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
        aria-hidden
      />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 rounded-2xl bg-[#D86D3E] grid place-items-center font-display font-bold text-lg text-white shadow-lg shadow-[#D86D3E]/30" aria-hidden>
            C
          </span>
          <div>
            <span className="block font-display font-bold tracking-tight text-lg text-white">CampusFlow</span>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur px-3 py-1 font-mono text-[11px] font-medium text-[#A7B0BF]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#E7A66D] animate-pulse" aria-hidden />
          100% Deterministic RBAC
        </span>
      </div>

      {/* Center Cinematic Geometry & Narrative */}
      <div className="relative z-10 my-auto py-8">
        {/* Abstract Connected Campus Network Graphic */}
        <div className="relative w-full max-w-[380px] aspect-[4/3] mx-auto mb-8 flex items-center justify-center">
          <svg className="w-full h-full" viewBox="0 0 400 300" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="av-line-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#D86D3E" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#79B8A6" stopOpacity="0.7" />
              </linearGradient>
            </defs>

            {/* Orbital Rings */}
            <circle cx="200" cy="150" r="110" stroke="rgba(255,255,255,0.06)" strokeWidth="1" strokeDasharray="4 6" />
            <circle cx="200" cy="150" r="75" stroke="rgba(216,109,62,0.25)" strokeWidth="1.2" />

            {/* Conduits */}
            <line x1="200" y1="150" x2="80" y2="70" stroke="url(#av-line-grad)" strokeWidth="1.2" strokeDasharray="3 3" />
            <line x1="200" y1="150" x2="320" y2="70" stroke="url(#av-line-grad)" strokeWidth="1.2" strokeDasharray="3 3" />
            <line x1="200" y1="150" x2="310" y2="230" stroke="url(#av-line-grad)" strokeWidth="1.2" strokeDasharray="3 3" />
            <line x1="200" y1="150" x2="90" y2="230" stroke="url(#av-line-grad)" strokeWidth="1.2" strokeDasharray="3 3" />

            {/* Central Core Nucleus */}
            <polygon points="200,118 226,138 226,168 200,188 174,168 174,138" fill="#1C1512" stroke="#E7A66D" strokeWidth="1.8" />
            <circle cx="200" cy="150" r="8" fill="#D86D3E" />
            <circle cx="200" cy="150" r="3" fill="#FFF" />

            {/* Role Satellite Nodes */}
            <g transform="translate(80, 70)">
              <circle cx="0" cy="0" r="14" fill="#1C1512" stroke="#D86D3E" strokeWidth="1.4" />
              <circle cx="0" cy="0" r="4" fill="#D86D3E" />
              <text x="0" y="24" textAnchor="middle" fill="#A7B0BF" fontSize="9" fontFamily="monospace">STUDENT</text>
            </g>
            <g transform="translate(320, 70)">
              <circle cx="0" cy="0" r="14" fill="#1C1512" stroke="#79B8A6" strokeWidth="1.4" />
              <circle cx="0" cy="0" r="4" fill="#79B8A6" />
              <text x="0" y="24" textAnchor="middle" fill="#A7B0BF" fontSize="9" fontFamily="monospace">FACULTY</text>
            </g>
            <g transform="translate(310, 230)">
              <circle cx="0" cy="0" r="14" fill="#1C1512" stroke="#E7A66D" strokeWidth="1.4" />
              <circle cx="0" cy="0" r="4" fill="#E7A66D" />
              <text x="0" y="24" textAnchor="middle" fill="#A7B0BF" fontSize="9" fontFamily="monospace">PLACEMENT</text>
            </g>
            <g transform="translate(90, 230)">
              <circle cx="0" cy="0" r="14" fill="#1C1512" stroke="#F5B08A" strokeWidth="1.4" />
              <circle cx="0" cy="0" r="4" fill="#F5B08A" />
              <text x="0" y="24" textAnchor="middle" fill="#A7B0BF" fontSize="9" fontFamily="monospace">ADMIN</text>
            </g>

            {/* Traveling Data Pulses */}
            <circle cx="140" cy="110" r="3" fill="#E7A66D" opacity="0.9" />
            <circle cx="260" cy="110" r="3" fill="#79B8A6" opacity="0.9" />
            <circle cx="255" cy="190" r="3" fill="#E7A66D" opacity="0.9" />
            <circle cx="145" cy="190" r="3" fill="#D86D3E" opacity="0.9" />
          </svg>
        </div>
        <h2 className="mt-3 font-display text-4xl sm:text-5xl font-bold tracking-tight text-white leading-[1.08]">
          One campus.<br />
          <span className="bg-gradient-to-r from-[#D86D3E] via-[#F5B08A] to-[#79B8A6] bg-clip-text text-transparent">
            Synchronized.
          </span>
        </h2>
        <p className="mt-4 text-sm sm:text-base leading-relaxed text-[#A7B0BF] max-w-md">
          A single institutional account grants verified access to coursework, daily attendance, placement drives, and campus governance.
        </p>

        {/* Real Capability Badges */}
        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { label: 'Attendance Matrix', icon: UserCheck },
            { label: 'Placement Funnel', icon: Layers },
            { label: 'AI Intelligence', icon: Sparkles }
          ].map(({ label, icon: Icon }) => (
            <span
              key={label}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur px-3 py-1.5 text-xs font-medium text-[#F4EFE8]"
            >
              <Icon size={13} className="text-[#E7A66D]" aria-hidden />
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Bottom Security / Trust Anchor */}
      <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-[#A7B0BF]">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-[#25D890]" aria-hidden />
          <span>Role-scoped authorization & tenant isolation</span>
        </div>
        <span className="font-mono text-[11px] opacity-70">v1.0</span>
      </div>
    </div>
  );
}
