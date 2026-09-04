// Landing: premium marketing — hero + digital campus + story + CTA.
// One coherent narrative, cinematic Motion reveals, lazy 3D.
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowRight,
  Play,
  GraduationCap,
  Users,
  Briefcase,
  Sparkles,
  ClipboardList,
  Building2,
  Moon,
  Sun
} from 'lucide-react';
import SpatialCanvas from '../components/spatial/SpatialCanvas';
import { staggerChild, staggerParent } from '../system/motion';
import { useTheme } from '../system/theme';
import { btnClass, cardClass, cn } from '../system/tokens';

const PILLARS = [
  { Icon: GraduationCap, title: 'Student experience', body: 'Today, next class, attendance health and placement pulse — one command center that understands your day.' },
  { Icon: Users, title: 'Faculty experience', body: 'Classes, attendance, grading and announcements with the admin friction removed.' },
  { Icon: Building2, title: 'Administration', body: 'Institution pulse — people, departments, academic and placement health at a glance.' },
  { Icon: Briefcase, title: 'Classroom → career', body: 'A spatial placement pipeline from applied to placed, with a marketplace worth browsing.' },
  { Icon: Sparkles, title: 'Campus intelligence', body: 'Every insight answers what changed, why it matters, and what should happen next — with evidence.' },
  { Icon: ClipboardList, title: 'Unified ecosystem', body: 'Academics, requests, directory, events and notifications in one operating system.' }
];

function Reveal({ children, className, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function Landing() {
  const { theme, toggle } = useTheme();
  return (
    <div className="min-h-screen cf-atmosphere text-[var(--cf-ink)]">
      <header className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <span className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-violet grid place-items-center text-white font-bold text-sm shadow-2" aria-hidden>C</span>
          <span className="font-bold tracking-tight">CampusFlow</span>
        </span>
        <div className="flex items-center gap-2">
          <button onClick={toggle} aria-label="Toggle theme" className="p-2 rounded-full hover:bg-black/[.05] dark:hover:bg-white/10 transition">
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <Link to="/login" className="text-sm font-medium px-3 py-2 rounded-full hover:bg-black/[.05] dark:hover:bg-white/10 transition">Sign in</Link>
          <Link to="/signup" className={cn(btnClass('primary', 'small'))}>Get started</Link>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.section
          {...staggerParent(0.09)}
          initial="initial"
          animate="animate"
          className="pt-10 sm:pt-16 pb-8 grid lg:grid-cols-2 gap-8 items-center"
        >
          <div>
            <motion.p variants={staggerChild} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border border-[var(--cf-line)] bg-[var(--cf-surface)]">
              <Sparkles size={13} className="text-primary-500" /> The digital campus operating system
            </motion.p>
            <motion.h1 variants={staggerChild} className="mt-5 text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.05]">
              The operating system for your campus.
            </motion.h1>
            <motion.p variants={staggerChild} className="mt-4 text-base sm:text-lg text-[var(--cf-ink-mute)] max-w-xl">
              CampusFlow connects students, faculty, administration and placements in one
              spatial, intelligent product — not another college ERP.
            </motion.p>
            <motion.div variants={staggerChild} className="mt-7 flex flex-wrap gap-3">
              <Link to="/signup" className={cn(btnClass('glow', 'large'))}>
                Explore CampusFlow <ArrowRight size={17} />
              </Link>
              <a href="#campus" className={cn(btnClass('outline', 'large'))}>
                <Play size={16} /> See how it works
              </a>
            </motion.div>
          </div>
          <motion.div variants={staggerChild} className="h-[320px] sm:h-[420px]">
            <SpatialCanvas className="w-full h-full" />
          </motion.div>
        </motion.section>

        {/* Digital campus */}
        <Reveal className="py-12" delay={0}>
          <section id="campus" aria-label="Digital campus">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary-600 dark:text-primary-300">01 — Digital campus</p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight">A living twin of your university.</h2>
            <p className="mt-2 text-[var(--cf-ink-mute)] max-w-2xl">Every tower is a system that never sleeps — academics, people, placements and intelligence, connected by design.</p>
          </section>
        </Reveal>

        {/* Pillars */}
        <motion.section
          {...staggerParent(0.06)}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: '-60px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-12"
          aria-label="Everything connected"
        >
          {PILLARS.map(({ Icon, title, body }) => (
            <motion.article key={title} variants={staggerChild} className={cn(cardClass, 'p-5 hover:shadow-3 hover:-translate-y-0.5 transition-all duration-200')}>
              <span className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-500/15 text-primary-600 dark:text-primary-300 grid place-items-center" aria-hidden>
                <Icon size={18} />
              </span>
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">{body}</p>
            </motion.article>
          ))}
        </motion.section>

        {/* CTA */}
        <Reveal className="pb-20">
          <section className={cn(cardClass, 'relative overflow-hidden p-8 sm:p-12 text-center cf-atmosphere')} aria-label="Get started">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">Your campus, finally in focus.</h2>
            <p className="mt-2 text-[var(--cf-ink-mute)]">Join the institutions running on CampusFlow.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/signup" className={cn(btnClass('glow', 'large'))}>Explore CampusFlow <ArrowRight size={17} /></Link>
              <Link to="/login" className={cn(btnClass('outline', 'large'))}>Sign in</Link>
            </div>
          </section>
        </Reveal>
      </main>

      <footer className="border-t border-[var(--cf-line)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--cf-ink-mute)]">
          <span>© {new Date().getFullYear()} CampusFlow</span>
          <span>The digital campus itself.</span>
        </div>
      </footer>
    </div>
  );
}
