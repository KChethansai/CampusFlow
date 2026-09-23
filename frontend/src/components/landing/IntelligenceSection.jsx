import { Link } from 'react-router';
import { ArrowUpRight, Sparkles } from 'lucide-react';
import { BeamCard } from '../ui/editorial';
import LiquidGlassButton from '../visual/LiquidGlassButton';
import { Reveal, SectionHead } from './shared';

const REPORT_CHAIN = [
  { step: 'Finding', body: 'Submission gaps cluster ahead of assessment weeks — the queue shows where.' },
  { step: 'Evidence', body: 'Late and missing marks from the grading queue, attached per subject.' },
  { step: 'Implication', body: 'At-risk learners surface while there is still time to intervene.' },
  { step: 'Recommendation', body: 'Nudge mentors for the flagged subjects before the next window.' },
  { step: 'Confidence', body: 'Stated on every report — grounded in workspace records, never a black box.' }
];

export default function IntelligenceSection() {
  return (
    <section id="ai-reports" className="landing-band relative isolate w-full" aria-label="AI reports">
      <div className="landing-inner max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <SectionHead
          title="Every finding shows its work."
          body="An example of the anatomy every report follows — grounded in workspace records."
        />
        <Reveal className="mt-7">
          <BeamCard className="p-px">
            <div className="rounded-[calc(1rem-1px)] p-5 sm:p-8">
              <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-black/10 dark:border-white/10 text-xs font-semibold text-[#4B5563] dark:text-[#A7B0BF]">
                <Sparkles size={13} aria-hidden className="text-[#D86D3E] dark:text-[#F5B08A]" />
                Example report · At-risk learners
              </p>
              <ol className="mt-5 space-y-0">
                {REPORT_CHAIN.map((r, i) => (
                  <li key={r.step} className="relative pl-8 pb-5 last:pb-0">
                    {i < REPORT_CHAIN.length - 1 && (
                      <span aria-hidden className="absolute left-[9px] top-6 bottom-0 w-px bg-[#D86D3E]/25" />
                    )}
                    <span aria-hidden className="absolute left-1 top-1.5 w-[11px] h-[11px] rounded-full border-[2.5px] border-[#D86D3E] bg-transparent" />
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#D86D3E] dark:text-[#F5B08A]">
                      {r.step}
                    </p>
                    <p className="mt-1 text-[15px] leading-relaxed text-[#100D0B] dark:text-[#F5F7FA] max-w-2xl">
                      {r.body}
                    </p>
                  </li>
                ))}
              </ol>
              <div className="mt-6 flex flex-wrap gap-3">
                <LiquidGlassButton to="/login" size="md">
                  Get reports
                </LiquidGlassButton>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-black/10 dark:border-white/15 text-sm font-semibold hover:border-[#D86D3E]/50 transition-colors"
                >
                  Sign in <ArrowUpRight size={15} aria-hidden />
                </Link>
              </div>
            </div>
          </BeamCard>
        </Reveal>
      </div>
    </section>
  );
}
