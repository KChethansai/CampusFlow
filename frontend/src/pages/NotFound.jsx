import { Link } from 'react-router';
import { ArrowLeft, Compass } from 'lucide-react';
import { btnClass } from '../system/tokens';

export default function NotFound() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[var(--cf-bg)] px-5 py-12 text-[var(--cf-ink)]">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(200,93,52,.14),transparent_58%)]" />
      <section className="relative w-full max-w-xl text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-[var(--cf-line)] bg-[var(--cf-surface)] text-[var(--cf-accent)]"><Compass size={25} aria-hidden /></span>
        <p className="mt-6 font-mono text-xs font-semibold uppercase tracking-[.2em] text-[var(--cf-ink-mute)]">404 · Off the map</p>
        <h1 className="mt-3 font-display text-4xl font-bold tracking-tight sm:text-5xl">This page isn’t on campus.</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-[var(--cf-ink-soft)]">The link may be old, or the address may have a typo. Head back to a page you know.</p>
        <Link to="/" className={`${btnClass('primary')} mt-7`}><ArrowLeft size={15} aria-hidden /> Back to CampusFlow</Link>
      </section>
    </main>
  );
}
