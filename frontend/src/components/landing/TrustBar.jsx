// TrustBar: generic institution-type chips. No named institutes, no fake
// testimonials, no numbers — only the kinds of institutions CampusFlow fits.
const TYPES = [
  'Engineering colleges',
  'Arts & science colleges',
  'Polytechnics',
  'Business schools',
  'Universities',
  'Training & placement cells'
];

export default function TrustBar() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-2.5" aria-label="Built for these institution types">
      {TYPES.map((t) => (
        <span key={t} className="brutal-tag inline-flex items-center gap-2 bg-[var(--cf-surface)] px-4 py-2 text-xs font-bold uppercase tracking-wider">
          <span className="w-2 h-2 bg-gold border border-[var(--cf-ink)]" aria-hidden />
          {t}
        </span>
      ))}
    </div>
  );
}
