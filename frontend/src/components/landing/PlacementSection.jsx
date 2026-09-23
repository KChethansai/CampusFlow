import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import { PIPELINE_STAGES, cn, roleLabel } from '../../system/tokens';
import { Reveal, SectionHead, glassCard, kicker } from './shared';

export default function PlacementSection() {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setStage((s) => (s + 1) % PIPELINE_STAGES.length), 2400);
    return () => clearInterval(id);
  }, [reduced]);

  return (
    <section id="placement" className="landing-band relative isolate w-full" aria-label="Placements">
      <div className="landing-inner max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <SectionHead
          title="Drives to offers, in one pipeline."
          body="Every applicant moves down one visible funnel — applied to placed, no side channels."
        />
        <div className="mt-7 grid lg:grid-cols-2 gap-3.5 sm:gap-4">
          <div>
            <Reveal>
              <div className={`${glassCard} p-5 sm:p-6`}>
                <p className={kicker}>The funnel</p>
                <ol className="mt-4 space-y-2">
                  {PIPELINE_STAGES.map((s, i) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => setStage(i)}
                        aria-pressed={stage === i}
                        className={cn(
                          'w-full text-left px-3.5 py-2 rounded-2xl border text-[13px] font-semibold transition-all',
                          stage === i
                            ? 'border-[#D86D3E]/60 bg-[#D86D3E]/[0.08] dark:bg-[#D86D3E]/15'
                            : 'border-black/10 dark:border-white/10 hover:border-[#D86D3E]/40'
                        )}
                        style={{ maxWidth: `${100 - i * 9}%` }}
                      >
                        <span className="font-mono text-[11px] text-[#4B5563] dark:text-[#707A89] mr-2" aria-hidden>
                          {String(i + 1).padStart(2, '0')}
                        </span>
                        {roleLabel(s)}
                      </button>
                    </li>
                  ))}
                </ol>
                <p className="mt-3 text-[13px] text-[#4B5563] dark:text-[#A7B0BF]">
                  Widths illustrate stage order, not cohort sizes.
                </p>
              </div>
            </Reveal>
          </div>
          <Reveal delay={0.08} className="lg:sticky lg:top-24 self-start">
            <div className={`${glassCard} p-5 sm:p-6 min-h-[280px] flex flex-col`}>
              <p className={kicker}>Stage transition</p>
              <div className="mt-4 flex-1" aria-live="polite">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={stage}
                    initial={reduced ? { opacity: 0 } : { opacity: 0, x: 32 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={reduced ? { opacity: 0 } : { opacity: 0, x: -32 }}
                    transition={reduced ? { duration: 0.01 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <p className="font-mono text-[11px] uppercase tracking-wider text-[#4B5563] dark:text-[#707A89]">
                      Stage {String(stage + 1).padStart(2, '0')} of {PIPELINE_STAGES.length}
                    </p>
                    <p className="font-display text-3xl font-bold tracking-tight mt-1 text-[#100D0B] dark:text-[#F5F7FA]">
                      {roleLabel(PIPELINE_STAGES[stage])}
                    </p>
                    <p className="mt-2 text-[15px] leading-relaxed text-[#4B5563] dark:text-[#A7B0BF]">
                      {stage < PIPELINE_STAGES.length - 1
                        ? `Candidates advance to ${roleLabel(PIPELINE_STAGES[stage + 1])} — eligibility checked, interviews scheduled, movement logged.`
                        : 'Hired — the offer letter lands and the record closes clean.'}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="mt-4 flex items-center gap-1.5" role="tablist" aria-label="Placement stages">
                {PIPELINE_STAGES.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    role="tab"
                    aria-selected={stage === i}
                    aria-label={`Show stage ${roleLabel(s)}`}
                    onClick={() => setStage(i)}
                    className={cn(
                      'h-2 rounded-full transition-all',
                      stage === i ? 'w-7 bg-[#D86D3E]' : 'w-2 bg-black/15 dark:bg-white/20 hover:bg-black/30 dark:hover:bg-white/40'
                    )}
                  />
                ))}
              </div>
              <Link
                to="/placement"
                className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#A94727] text-white text-sm font-semibold hover:brightness-110 transition w-fit"
              >
                Open placement <ArrowUpRight size={15} aria-hidden />
              </Link>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
