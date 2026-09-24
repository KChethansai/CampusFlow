// Campus AI widgets — Kokonut-style dark glass + border-beam surfaces,
// finding → evidence → implication → recommendation → confidence chain.
// Provider/endpoint logic stays in callers.
import { memo } from 'react';
import { BeamCard } from '../ui/editorial';
import { cn } from '../../system/tokens';

export const INTEL =
  'rounded-[24px] border border-[var(--cf-line)] bg-[var(--cf-surface)] p-5 relative overflow-hidden text-[var(--cf-ink)]';
export const GRADIENT_LINE =
  'pointer-events-none absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-[#D86D3E] via-[#F5B08A] to-[#E7A66D]';

// Structured output wins; free text falls back to summary.
export const signalsOf = (report) => {
  const out = report.output || {};
  if (Array.isArray(out.insights) && out.insights.length) {
    return out.insights.map((i) => ({
      what: i.what || i.title || 'Signal',
      why: i.why || i.reason || '',
      next: i.next || i.action || '',
      evidence: i.evidence || '',
      implication: i.implication || '',
      confidence: i.confidence ?? null
    }));
  }
  if (out.summary) return [{ what: out.summary, why: '', next: '', evidence: '', implication: '', confidence: null }];
  return [];
};

// Confidence derives from provenance only: live provider + evidence > snapshot.
export const confidenceOf = (report, signal) => {
  if (signal?.confidence != null) return signal.confidence;
  if (report.provider === 'none') return 'Snapshot — unranked';
  return signal?.evidence ? 'High — evidence-backed' : 'Medium — model read';
};

/** Kokonut glass shell with gradient hairline. */
export function IntelShell({ children, label, className }) {
  return (
    <section aria-label={label} className={cn(INTEL, className)}>
      <span className={GRADIENT_LINE} aria-hidden />
      {children}
    </section>
  );
}

/** Border-beam shell for the featured finding. */
export function BeamShell({ children, label, className }) {
  return (
    <BeamCard className={className} aria-label={label}>
      <div className="p-5">{children}</div>
    </BeamCard>
  );
}

/** One finding: what changed → why it matters → implication → next → evidence + confidence. */
export const FindingCard = memo(function FindingCard({ signal, provider, featured }) {
  const Shell = featured ? BeamShell : IntelShell;
  return (
    <Shell>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[#E7A66D]">Finding</p>
          <p className="font-semibold mt-0.5">{signal.what}</p>
        </div>
        <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-bold border border-[var(--cf-line)] text-[var(--cf-ink-soft)]">
          {signal.confidence != null ? signal.confidence : provider === 'none' ? 'Snapshot — unranked' : signal.evidence ? 'High — evidence-backed' : 'Medium — model read'}
        </span>
      </div>
      {signal.evidence && (
        <p className="mt-3 text-xs rounded-[14px] bg-[var(--cf-surface-2)] border border-[var(--cf-line)] p-3 text-[var(--cf-ink-soft)]">
          <span className="font-semibold text-[#E7A66D]">Evidence: </span>
          {signal.evidence}
        </p>
      )}
      {signal.why && (
        <>
          <p className="mt-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--cf-ink-mute)]">Implication</p>
          <p className="text-sm text-[var(--cf-ink-soft)] mt-0.5">{signal.why}</p>
        </>
      )}
      {signal.implication && (
        <p className="text-sm text-[var(--cf-ink-soft)] mt-1.5">{signal.implication}</p>
      )}
      {signal.next && (
        <>
          <p className="mt-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--cf-ink-mute)]">Recommendation</p>
          <p className="text-sm text-[var(--cf-ink-soft)] mt-0.5">{signal.next}</p>
        </>
      )}
    </Shell>
  );
});
