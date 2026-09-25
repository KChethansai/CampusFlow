import { Link } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, CalendarCheck, ClipboardList, Sparkles } from 'lucide-react';
import { SpotCard, SplitReveal } from '../ui/editorial';
import { PIPELINE_STAGES } from '../../system/tokens';
import { Reveal, SectionHead, glassCard, kicker } from './shared';

const AREA_POINTS = [8, 22, 18, 34, 30, 48];

function AreaShape() {
  const reduced = useReducedMotion();
  const w = 560;
  const h = 220;
  const pad = 12;
  const step = (w - pad * 2) / (AREA_POINTS.length - 1);
  const max = Math.max(...AREA_POINTS);
  const coords = AREA_POINTS.map((v, i) => [pad + i * step, h - pad - (v / max) * (h - pad * 2)]);
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(' ');
  const area = `${line} L${(w - pad).toFixed(1)},${h - pad} L${pad},${h - pad} Z`;
  const gradId = 'cf-area-fill';

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto" role="img" aria-label="Pipeline position curve across the six placement stages">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#D86D3E" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#D86D3E" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0.25, 0.5, 0.75].map((f) => (
        <line key={f} x1={pad} x2={w - pad} y1={h * f} y2={h * f} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 5" />
      ))}
      <path d={area} fill={`url(#${gradId})`} />
      <motion.path
        d={line}
        fill="none"
        stroke="#D86D3E"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={reduced ? false : { pathLength: 0 }}
        whileInView={reduced ? undefined : { pathLength: 1 }}
        viewport={{ once: true, margin: '-15% 0px' }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      />
      {coords.map((c, i) => (
        <g key={i}>
          <circle cx={c[0]} cy={c[1]} r="3.5" fill="#100D0B" stroke="#D86D3E" strokeWidth="2" />
          <text x={c[0]} y={h - 1} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.55" fontFamily="monospace">
            {PIPELINE_STAGES[i].slice(0, 5)}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function SignalsSection() {
  return (
    <section id="intelligence" className="landing-band relative isolate w-full" aria-label="Academic intelligence">
      <div className="landing-inner max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <SectionHead
          title="Signals, not noise."
          body="Attendance health, queue movement and pipeline position — each insight ships with its evidence attached. The counts above name real workspace facts, never vanity metrics."
        />
        <div className="mt-7 grid lg:grid-cols-5 gap-3.5 sm:gap-4">
          <Reveal className="lg:col-span-3">
            <div className={`${glassCard} p-5 sm:p-6 text-[#100D0B] dark:text-[#F5F7FA]`}>
              <p className={kicker}>Pipeline position</p>
              <div className="mt-4">
                <AreaShape />
              </div>
              <p className="mt-3 text-[13px] text-[#4B5563] dark:text-[#A7B0BF]">
                Structural diagram — the curve follows stage order ({PIPELINE_STAGES.length} stages), not cohort sizes.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.08} className="lg:col-span-2">
            <SpotCard className={`${glassCard} p-5 sm:p-6 h-full`}>
              <SplitReveal
                className="font-display font-bold tracking-tight text-xl sm:text-2xl text-[#100D0B] dark:text-[#F5F7FA]"
                lines={['At-risk signals surface', 'early — evidence attached,', 'never a black box.']}
              />
              <ul className="mt-5 space-y-2.5">
                {[
                  { Icon: CalendarCheck, text: 'Attendance patterns flag drift before it compounds.' },
                  { Icon: ClipboardList, text: 'Late and missing work queues up per subject.' },
                  { Icon: Sparkles, text: 'AI reports cite the records behind each finding.' }
                ].map(({ Icon, text }) => (
                  <li key={text} className="flex gap-3 text-[13px] leading-relaxed text-[#4B5563] dark:text-[#A7B0BF]">
                    <span className="mt-0.5 w-8 h-8 shrink-0 rounded-full grid place-items-center bg-[#D86D3E]/10 dark:bg-[#D86D3E]/15 text-[#D86D3E] dark:text-[#F5B08A]" aria-hidden>
                      <Icon size={15} />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
              <Link
                to="/dashboard"
                className="mt-6 inline-flex items-center gap-1.5 py-1 text-sm font-semibold text-[#A94727] dark:text-[#F5B08A] hover:underline underline-offset-4"
              >
                Open the workspace <ArrowUpRight size={15} aria-hidden />
              </Link>
            </SpotCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
