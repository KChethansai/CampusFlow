import { useId } from 'react';

/**
 * HeroSceneFallback
 * High-fidelity Obsidian Ember atmospheric visual for environments where
 * WebGL is disabled, unsupported, or reduced motion is requested.
 * Zero 3D overhead, pristine responsive rendering across all viewports.
 */
export default function HeroSceneFallback({ className = '' }) {
  const maskId = useId();
  const gradId = useId();

  return (
    <div
      className={`relative w-full h-full min-h-[340px] sm:min-h-[440px] flex items-center justify-center overflow-hidden rounded-[32px] bg-[#100D0B] select-none ${className}`}
      role="img"
      aria-label="Connected campus infrastructure visualization: unified platform core with synchronized academic, operational, and placement pathways"
    >
      {/* Background ambient ember and teal gradient pools */}
      <div
        className="absolute inset-0 pointer-events-none opacity-60"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(216, 109, 62, 0.16) 0%, rgba(121, 184, 166, 0.08) 45%, transparent 70%)'
        }}
      />

      <svg
        className="relative w-full max-w-[620px] h-auto aspect-square p-6"
        viewBox="0 0 500 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id={gradId} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D86D3E" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#D86D3E" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#79B8A6" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${gradId}-core`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E7A66D" />
            <stop offset="50%" stopColor="#D86D3E" />
            <stop offset="100%" stopColor="#241B15" />
          </linearGradient>
          <linearGradient id={`${gradId}-rail`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#79B8A6" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#D86D3E" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Concentric orbital rings */}
        <circle cx="250" cy="250" r="195" stroke="rgba(255, 255, 255, 0.07)" strokeWidth="1" strokeDasharray="3 6" />
        <circle cx="250" cy="250" r="145" stroke="rgba(216, 109, 62, 0.22)" strokeWidth="1.2" />
        <circle cx="250" cy="250" r="95" stroke="rgba(121, 184, 166, 0.25)" strokeWidth="1.2" strokeDasharray="6 4" />
        <circle cx="250" cy="250" r="50" stroke="rgba(231, 166, 109, 0.35)" strokeWidth="1" />

        {/* Diagonal and orthogonal data pathways */}
        <line x1="250" y1="55" x2="250" y2="445" stroke={`url(#${gradId}-rail)`} strokeWidth="1.2" strokeDasharray="4 4" opacity="0.4" />
        <line x1="55" y1="250" x2="445" y2="250" stroke={`url(#${gradId}-rail)`} strokeWidth="1.2" strokeDasharray="4 4" opacity="0.4" />
        <line x1="112" y1="112" x2="388" y2="388" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
        <line x1="388" y1="112" x2="112" y2="388" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />

        {/* Central Architectural Core Geometry */}
        <polygon
          points="250,185 295,225 295,275 250,315 205,275 205,225"
          fill="#1A1410"
          stroke={`url(#${gradId}-core)`}
          strokeWidth="2"
        />
        <polygon
          points="250,205 278,232 278,268 250,295 222,268 222,232"
          fill="#211713"
          stroke="#E7A66D"
          strokeWidth="1.2"
          opacity="0.8"
        />
        <circle cx="250" cy="250" r="14" fill="#D86D3E" opacity="0.9" />
        <circle cx="250" cy="250" r="6" fill="#F4EFE8" />

        {/* Campus System Satellite Nodes */}
        {/* Academic Node */}
        <g transform="translate(105, 145)">
          <circle cx="0" cy="0" r="18" fill="rgba(216, 109, 62, 0.1)" stroke="#D86D3E" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="5" fill="#D86D3E" />
          <text x="0" y="32" textAnchor="middle" fill="#A7B0BF" fontSize="10" fontFamily="monospace" letterSpacing="0.05em">ACADEMICS</text>
        </g>

        {/* Student Flow Node */}
        <g transform="translate(395, 145)">
          <circle cx="0" cy="0" r="18" fill="rgba(37, 216, 144, 0.1)" stroke="#25D890" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="5" fill="#25D890" />
          <text x="0" y="32" textAnchor="middle" fill="#A7B0BF" fontSize="10" fontFamily="monospace" letterSpacing="0.05em">STUDENT FLOW</text>
        </g>

        {/* Placements Node */}
        <g transform="translate(370, 355)">
          <circle cx="0" cy="0" r="18" fill="rgba(231, 166, 109, 0.1)" stroke="#E7A66D" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="5" fill="#E7A66D" />
          <text x="0" y="32" textAnchor="middle" fill="#A7B0BF" fontSize="10" fontFamily="monospace" letterSpacing="0.05em">PLACEMENTS</text>
        </g>

        {/* Faculty Operations Node */}
        <g transform="translate(130, 355)">
          <circle cx="0" cy="0" r="18" fill="rgba(121, 184, 166, 0.1)" stroke="#79B8A6" strokeWidth="1.5" />
          <circle cx="0" cy="0" r="5" fill="#79B8A6" />
          <text x="0" y="32" textAnchor="middle" fill="#A7B0BF" fontSize="10" fontFamily="monospace" letterSpacing="0.05em">FACULTY</text>
        </g>

        {/* Governance Node */}
        <g transform="translate(250, 55)">
          <circle cx="0" cy="0" r="14" fill="rgba(245, 176, 138, 0.1)" stroke="#F5B08A" strokeWidth="1.2" />
          <circle cx="0" cy="0" r="4" fill="#F5B08A" />
          <text x="0" y="-12" textAnchor="middle" fill="#A7B0BF" fontSize="10" fontFamily="monospace" letterSpacing="0.05em">GOVERNANCE</text>
        </g>

        {/* Live Conduit Pulses */}
        <circle cx="178" cy="198" r="3.5" fill="#E7A66D" opacity="0.85" />
        <circle cx="322" cy="198" r="3.5" fill="#25D890" opacity="0.85" />
        <circle cx="310" cy="302" r="3.5" fill="#E7A66D" opacity="0.85" />
        <circle cx="190" cy="302" r="3.5" fill="#79B8A6" opacity="0.85" />
      </svg>
    </div>
  );
}
