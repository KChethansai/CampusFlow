import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import LiquidGlassButton from '../visual/LiquidGlassButton';
import { Reveal } from './shared';

export default function FinalCTA() {
  return (
    <section className="landing-band relative isolate w-full" aria-label="Get started">
      <div className="landing-inner max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Reveal>
          <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#100D0B] px-6 py-16 sm:py-24 text-center">
            <div
              aria-hidden
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[420px] rounded-full bg-[#D86D3E]/25 blur-[130px] pointer-events-none"
            />
            <div className="relative">
              <h2
                className="font-display font-bold tracking-tight text-balance text-white"
                style={{ fontSize: 'clamp(2.2rem,5.5vw,4.2rem)', lineHeight: 1.04 }}
              >
                Bring your campus in sync.
              </h2>
              <p className="mt-4 text-[#A7B0BF] max-w-md mx-auto text-base">
                Sign in — your role opens its workspace.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <LiquidGlassButton to="/login" size="lg">
                  Get Started
                </LiquidGlassButton>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-white/20 text-white font-semibold hover:bg-white/10 transition-colors"
                >
                  Sign In <ArrowUpRight size={17} aria-hidden />
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
