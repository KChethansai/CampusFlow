import { Component } from 'react';
import { Link } from 'react-router';
import { btnClass } from '../../system/tokens';

export default class AppErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main className="min-h-screen grid place-items-center bg-[var(--cf-bg)] px-5 py-12 text-[var(--cf-ink)]">
        <section className="w-full max-w-lg rounded-3xl border border-[var(--cf-line)] bg-[var(--cf-surface)] p-8 text-center shadow-xl">
          <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[var(--cf-accent)]">CampusFlow</p>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight">This page hit a snag.</h1>
          <p className="mt-2 text-sm text-[var(--cf-ink-soft)]">Your work is safe. Try loading the page again or return to your workspace.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" className={btnClass('primary')} onClick={() => this.setState({ failed: false })}>Try again</button>
            <Link className={btnClass('outline')} to="/dashboard" onClick={() => this.setState({ failed: false })}>Go to dashboard</Link>
          </div>
        </section>
      </main>
    );
  }
}
