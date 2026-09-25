import { Link } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { Reveal, SectionHead, glassCard, kicker } from './shared';

const ATTENDANCE_STATES = [
  { key: 'present', label: 'Present', color: '#D86D3E', hint: 'Marked in the live matrix' },
  { key: 'od', label: 'On duty', color: '#E7A66D', hint: 'Approved leave shapes' },
  { key: 'absent', label: 'Absent', color: '#B4806A', hint: 'Watch-list inputs' }
];

function StatusRing() {
  const r = 58;
  const c = 2 * Math.PI * r;
  const third = c / 3;
  return (
    <svg width="168" height="168" viewBox="0 0 168 168" role="img" aria-label="The three attendance states: present, on duty, absent">
      {ATTENDANCE_STATES.map((s, i) => (
        <circle
          key={s.key}
          cx="84"
          cy="84"
          r={r}
          fill="none"
          stroke={s.color}
          strokeWidth="14"
          strokeLinecap="butt"
          strokeDasharray={`${third - 6} ${c - third + 6}`}
          strokeDashoffset={-i * third}
          transform="rotate(-90 84 84)"
        />
      ))}
      <text x="84" y="80" textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.6" fontFamily="monospace">
        3
      </text>
      <text x="84" y="96" textAnchor="middle" fontSize="11" fill="currentColor" opacity="0.6" fontFamily="monospace">
        states
      </text>
    </svg>
  );
}

const HEAT_CELLS = Array.from({ length: 48 }, (_, i) => ATTENDANCE_STATES[i % 3].key);

function StatusHeatmap() {
  const reduced = useReducedMotion();
  const color = (k) => ATTENDANCE_STATES.find((s) => s.key === k).color;
  return (
    <div
      className="grid grid-cols-8 gap-1.5"
      role="img"
      aria-label="Illustrative attendance matrix showing the present, on duty and absent status key"
    >
      {HEAT_CELLS.map((k, i) => (
        <motion.span
          key={i}
          className="aspect-square rounded-[6px]"
          style={{ background: color(k), opacity: 0.85 }}
          initial={reduced ? false : { opacity: 0, scale: 0.6 }}
          whileInView={reduced ? undefined : { opacity: 0.85, scale: 1 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 0.3, delay: (i % 8) * 0.03 + Math.floor(i / 8) * 0.05 }}
        />
      ))}
    </div>
  );
}

export default function AttendanceSection() {
  const reduced = useReducedMotion();

  return (
    <section id="attendance" className="landing-band relative isolate w-full" aria-label="Attendance">
      <div className="landing-inner max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <SectionHead
          title="Every mark, one matrix."
          body="Present, on duty, absent — three states resolve every session in the live grid."
        />
        <div className="mt-7 grid md:grid-cols-3 gap-3.5 sm:gap-4">
          <Reveal>
            <div className={`${glassCard} p-5 sm:p-6 text-center h-full`}>
              <p className={kicker}>The three states</p>
              <div className="mt-4 flex justify-center">
                <StatusRing />
              </div>
              <ul className="mt-4 space-y-1.5 text-left text-[13px] font-medium text-[#4B5563] dark:text-[#A7B0BF]">
                {ATTENDANCE_STATES.map((s) => (
                  <li key={s.key} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: s.color }} aria-hidden />
                    {s.label} — {s.hint}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            <div className={`${glassCard} p-5 sm:p-6 h-full`}>
              <p className={kicker}>Status key matrix</p>
              <div className="mt-4">
                <StatusHeatmap />
              </div>
              <p className="mt-3 text-[13px] text-[#4B5563] dark:text-[#A7B0BF]">
                Illustrative pattern of the status vocabulary — live marks resolve per class.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.16}>
            <div className={`${glassCard} p-5 sm:p-6 h-full flex flex-col`}>
              <p className={kicker}>Movement shape</p>
              <svg viewBox="0 0 200 90" className="mt-4 w-full h-auto" role="img" aria-label="Direction-only trend shape">
                <motion.polyline
                  points="4,70 34,62 64,66 94,48 124,52 154,30 184,34"
                  fill="none"
                  stroke="#E7A66D"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={reduced ? false : { pathLength: 0 }}
                  whileInView={reduced ? undefined : { pathLength: 1 }}
                  viewport={{ once: true, margin: '-15% 0px' }}
                  transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
                />
              </svg>
              <p className="mt-3 text-[13px] text-[#4B5563] dark:text-[#A7B0BF]">
                Direction only — live values resolve per subject after sign-in.
              </p>
              <Link
                to="/attendance"
                className="mt-auto pt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#D86D3E] dark:text-[#F5B08A] hover:underline underline-offset-4"
              >
                Check attendance <ArrowUpRight size={15} aria-hidden />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
