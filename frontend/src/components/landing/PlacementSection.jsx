import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight, Pause, Play } from 'lucide-react';
import { PIPELINE_STAGES, cn, roleLabel } from '../../system/tokens';
import { Reveal, SectionHead, glassCard, kicker } from './shared';

export default function PlacementSection() {
  const reduced = useReducedMotion();
  const [stage, setStage] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hoverPause, setHoverPause] = useState(false);

  useEffect(() => {
    if (reduced || paused || hoverPause) return;
    const id = setInterval(() => setStage((s) => (s + 1) % PIPELINE_STAGES.length), 2400);
    return () => clearInterval(id);
  }, [reduced, paused, hoverPause]);

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
            <div
              className={`${glassCard} p-5 sm:p-6 min-h-[280px] flex flex-col`}
              onMouseEnter={() => setHoverPause(true)}
              onMouseLeave={() => setHoverPause(false)}
              onFocus={() => setHoverPause(true)}
              onBlur={() => setHoverPause(false)}
            >
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
                    <p className="font-mono text-[11px] uppercase tracking-wider text-[#4B5563] dark:text-[#A7B0BF]">
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
              <div
                className="mt-4 flex items-center gap-1.5"
                role="tablist"
                aria-label="Placement stages"
                onKeyDown={(e) => {
                  const count = PIPELINE_STAGES.length;
                  let next = null;
                  if (e.key === 'ArrowRight') next = (stage + 1) % count;
                  else if (e.key === 'ArrowLeft') next = (stage - 1 + count) % count;
                  else if (e.key === 'Home') next = 0;
                  else if (e.key === 'End') next = count - 1;
                  if (next === null) return;
                  e.preventDefault();
                  setStage(next);
                  e.currentTarget.querySelector(`[data-index="${next}"]`)?.focus();
                }}
              >
                {PIPELINE_STAGES.map((s, i) => (
                  <button
                    key={s}
                    type="button"
                    role="tab"
                    data-index={i}
                    aria-selected={stage === i}
                    aria-label={`Show stage ${roleLabel(s)}`}
                    onClick={() => setStage(i)}
                    className="min-h-6 min-w-6 grid place-items-center rounded-full"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        'h-2 rounded-full transition-all',
                        stage === i ? 'w-7 bg-[#D86D3E]' : 'w-2 bg-black/15 dark:bg-white/20 hover:bg-black/30 dark:hover:bg-white/40'
                      )}
                    />
                  </button>
                ))}
                <button
                  type="button"
                  aria-pressed={paused}
                  aria-label={paused ? 'Resume stage rotation' : 'Pause stage rotation'}
                  onClick={() => setPaused((p) => !p)}
                  className="ml-1 grid h-11 w-11 place-items-center rounded-full border border-black/10 dark:border-white/10 text-[#4B5563] dark:text-[#A7B0BF] hover:border-[#D86D3E]/40"
                >
                  {paused ? <Play size={15} aria-hidden /> : <Pause size={15} aria-hidden />}
                </button>
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
