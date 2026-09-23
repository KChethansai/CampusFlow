import { useRef } from 'react';
import { Link } from 'react-router';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { Reveal, SectionHead, glassCard } from './shared';

const JOURNEY = [
  { title: 'Sign in', body: 'Your role unlocks its workspace.', to: '/login', cta: 'Sign in' },
  { title: 'Open your workspace', body: 'Dashboard, attendance, placement — one record per student.', to: '/dashboard', cta: 'Open dashboard' },
  { title: 'Work the queue', body: 'Requests, grading and drives move pending → done.', to: '/dashboard', cta: 'See the flow' },
  { title: 'Follow the signals', body: 'AI reports attach evidence to every finding.', to: '/dashboard', cta: 'See signals' }
];

export default function JourneySection() {
  const reduced = useReducedMotion();
  const journeyRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: journeyRef, offset: ['start 0.75', 'end 0.55'] });
  const journeyScale = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="journey" className="landing-band relative isolate w-full" aria-label="Getting started journey">
      <div className="landing-inner max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <SectionHead
          title="Live in four steps."
          body="From sign-in to signal — the line fills as you scroll."
        />
        <div ref={journeyRef} className="mt-7 relative">
          <div aria-hidden className="absolute left-[21px] sm:left-[23px] top-2 bottom-2 w-[2px] bg-black/10 dark:bg-white/10 rounded-full">
            <motion.div
              className="w-full h-full origin-top bg-[#D86D3E] rounded-full"
              style={reduced ? undefined : { scaleY: journeyScale }}
            />
          </div>
          <ol className="space-y-3.5 sm:space-y-4">
            {JOURNEY.map((j, i) => (
              <li key={j.title} className="relative ml-12 sm:ml-14">
                <span
                  aria-hidden
                  className="absolute -left-12 sm:-left-14 top-5 w-[22px] h-[22px] sm:w-6 sm:h-6 rounded-full grid place-items-center font-mono text-[10px] font-bold bg-[#A94727] text-white"
                >
                  {i + 1}
                </span>
                <Reveal className={`${glassCard} p-5 flex flex-wrap items-center justify-between gap-3`}>
                  <div className="min-w-0">
                    <h3 className="font-display font-semibold tracking-tight text-lg text-[#100D0B] dark:text-[#F5F7FA]">
                      {j.title}
                    </h3>
                    <p className="mt-0.5 text-[13px] text-[#4B5563] dark:text-[#A7B0BF]">{j.body}</p>
                  </div>
                  <Link
                    to={j.to}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-black/10 dark:border-white/15 text-sm font-semibold hover:border-[#D86D3E]/50 transition-colors shrink-0"
                  >
                    {j.cta} <ArrowUpRight size={14} aria-hidden />
                  </Link>
                </Reveal>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
