import { useRef } from 'react';
import { Link } from 'react-router';
import { motion, useReducedMotion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';
import HeroScene from '../hero/HeroScene';
import LiquidGlassButton from '../visual/LiquidGlassButton';
import ContainerScroll from '../visual/ContainerScroll';
import { landingDisplayHero } from '../../system/tokens';
import { BlurText } from './shared';

export default function HeroSection() {
  const reduced = useReducedMotion();
  const heroRef = useRef(null);

  return (
    <section ref={heroRef} className="landing-hero relative isolate w-full overflow-hidden" aria-label="Introduction">
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div
          className="absolute inset-0 opacity-70 dark:opacity-100"
          style={{
            backgroundImage: 'radial-gradient(rgba(10,13,18,0.10) 1px, transparent 1px)',
            backgroundSize: '26px 26px'
          }}
        />
        <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_50%_35%,black,transparent)] bg-gradient-to-b from-[#D86D3E]/[0.07] dark:from-[#D86D3E]/[0.12] to-transparent" />
        {!reduced && (
          <motion.div
            className="landing-hero-orb absolute rounded-full pointer-events-none"
            animate={{ x: [0, 24, -10, 0], y: [0, -14, 12, 0], scale: [1, 1.05, 0.98, 1] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </div>

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-32 sm:pt-44 pb-4 text-center">
        <h1 className={landingDisplayHero}>
          <BlurText text="Your campus." className="block" />
          <BlurText
            text="In sync."
            className="landing-accent block"
            wordClassName="bg-gradient-to-r from-[#B6532B] via-[#2F6B5E] to-[#A66C1F] dark:from-[var(--cf-accent)] dark:via-[var(--cf-teal)] dark:to-[var(--cf-volt)] bg-clip-text text-transparent forced-colors:text-[CanvasText]"
          />
        </h1>
        <motion.p
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, delay: 0.16 }}
          className="mt-6 text-base sm:text-lg leading-relaxed text-[#4B5563] dark:text-[#A7B0BF] max-w-2xl mx-auto"
        >
          Attendance, assignments, placements and insight — moving together in one workspace, one record per student.
        </motion.p>
        <p className="mt-3 text-[13px] font-medium text-[#6B7280] dark:text-[#A7B0BF]">
          Mark attendance from the roster, track drives to offers, read AI reports with evidence attached.
        </p>
        <motion.div
          initial={reduced ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, delay: 0.22 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <LiquidGlassButton to="/login" size="lg" className="focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A94727]">
            Get Started
          </LiquidGlassButton>
          <Link
            to="/login"
            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full border border-black/10 dark:border-white/15 cf-glass font-semibold hover:border-[#D86D3E]/50 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A94727]"
          >
            Sign In <ArrowUpRight size={17} aria-hidden />
          </Link>
        </motion.div>
      </div>

      {/* 21st.dev Container Scroll 3D Perspective Tilt Showcase */}
      <div className="relative w-full max-w-6xl mx-auto px-4 sm:px-6">
        <ContainerScroll>
          <HeroScene />
        </ContainerScroll>
      </div>
    </section>
  );
}
