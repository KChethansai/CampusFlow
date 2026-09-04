// Landing: NOTA-grade editorial narrative — one promise per viewport,
// scroll-scrubbed 3D hero, statement splits, counter slider, kit, prospectus.
// Original copy throughout; NOTA supplies structure and craft, never content.
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react';
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Building2,
  GraduationCap,
  Moon,
  Sparkles,
  Sun,
  Users
} from 'lucide-react';
import SpatialCanvas from '../components/spatial/SpatialCanvas';
import { CounterCarousel, MagneticButton, Marquee, Preloader, SplitReveal } from '../components/ui/editorial';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/primitives';
import { useTheme } from '../system/theme';
import { btnClass, cardClass, cn } from '../system/tokens';

const NAV = [
  { label: 'System', href: '#system' },
  { label: "Who it's for", href: '#audience' },
  { label: 'Campus', href: '#campus' },
  { label: 'Inside', href: '#inside' },
  { label: 'Stories', href: '#stories' }
];

const SPECS = [
  { k: 'Learn', title: 'Academics, alive', body: 'Courses, subjects and assignments that behave like a modern workspace — clear deadlines, honest feedback, nothing lost in a register.' },
  { k: 'Work', title: 'Placements, engineered', body: 'A pipeline from applied to placed. Drives, eligibility and interviews in one marketplace worth opening every morning.' },
  { k: 'Know', title: 'Intelligence, grounded', body: 'Every insight answers what changed, why it matters and what happens next — with evidence beside it, never a black box.' }
];

const AUDIENCES = [
  { Icon: GraduationCap, title: 'Students & Learners', body: 'Your day, understood. Next class, due work, attendance health and placement pulse — one command center instead of five portals.' },
  { Icon: Users, title: 'Faculty & Mentors', body: 'Teach, don’t administrate. Attendance in seconds, grading in a queue, announcements without the paperwork.' },
  { Icon: Briefcase, title: 'Recruiters & Admins', body: 'See the institution clearly. Drives, applicants, departments and academic health — one operating picture.' }
];

const SPLITS = [
  { n: '01', Icon: Building2, claim: ['A living twin', 'of <em>your university.</em>'], body: 'Every system on campus — academics, people, placements, intelligence — rendered as one place you can walk through, not tabs you drown in.', tint: 'from-primary-500/25 via-primary-500/5 to-transparent' },
  { n: '02', Icon: BookOpen, claim: ['Looks like a campus.', '<em>Works like software.</em>'], body: 'For you it feels like college. Underneath, every stroke of admin — enrollment, attendance, grading — becomes structured, searchable data.', tint: 'from-accent-violet/25 via-accent-violet/5 to-transparent' },
  { n: '03', Icon: Briefcase, claim: ['No chaos. No follow-ups', '<em>lost in chat.</em>'], body: 'Applications move down a visible pipeline. Students always know where they stand; officers always know what’s stuck.', tint: 'from-green-500/20 via-green-500/5 to-transparent' },
  { n: '04', Icon: Sparkles, claim: ['Quiet intelligence,', '<em>loud clarity.</em>'], body: 'Attendance dips, placement surges, at-risk cohorts — surfaced with reasons and next actions, then out of your way.', tint: 'from-amber-500/20 via-amber-500/5 to-transparent' }
];

const RECRUITERS = ['Infosys', 'TCS', 'Wipro', 'Zoho', 'Freshworks', 'Flipkart', 'Razorpay', 'CRED', 'Swiggy', 'L&T'];

const STORIES = [
  { quote: 'Attendance stopped being a fight. I mark it walking out of class and the patterns just appear.', who: 'Faculty, Computer Science', tint: 'from-primary-500/20 to-transparent' },
  { quote: 'I stopped checking five portals. My morning is one screen: what’s due, where I stand, what’s open.', who: 'Student, 3rd year', tint: 'from-accent-violet/20 to-transparent' },
  { quote: 'Our drive pipeline went from spreadsheets to a board everyone trusts. Offers are up a third.', who: 'Placement Officer', tint: 'from-green-500/20 to-transparent' },
  { quote: 'For the first time I can see the whole institution on a Monday morning and know what needs me.', who: 'College Admin', tint: 'from-amber-500/20 to-transparent' }
];

const KIT = [
  { title: 'Student app', body: 'Command center, attendance pulse, placement board. Your day, understood.' },
  { title: 'Faculty console', body: 'Classes, grading queue, announcements. Teach, don’t administrate.' },
  { title: 'Placement board', body: 'Drives, applicants, pipeline. Classroom to career, visibly.' },
  { title: 'Intelligence', body: 'Signals with evidence. What changed, why, what next.' }
];

function EnquireModal({ open, onClose }) {
  const [state, setState] = useState('idle');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const submit = (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) { setState('required'); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { setState('error'); return; }
    try { localStorage.setItem('cf_enquiry', JSON.stringify({ name, email, at: new Date().toISOString() })); } catch { /* ignore */ }
    setState('success');
  };
  return (
    <Modal open={open} onClose={onClose} title="Book a campus tour">
      {state === 'success' ? (
        <div className="text-center py-6">
          <p className="cf-display italic text-3xl">All set.</p>
          <p className="mt-2 text-sm text-[var(--cf-ink-mute)]">We’ll be in touch shortly, {name.split(' ')[0] || 'friend'}.</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3" noValidate>
          <Input label="Your name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Aarav Sharma"
            error={state === 'required' && !name.trim() ? 'This field is required' : undefined} />
          <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@institution.edu"
            error={state === 'required' && !email.trim() ? 'This field is required' : state === 'error' ? 'That email doesn’t look right — try again' : undefined} />
          <button type="submit" className={cn(btnClass('glow', 'large'), 'w-full')}>Request tour <ArrowUpRight size={16} /></button>
        </form>
      )}
    </Modal>
  );
}

export default function Landing() {
  const { theme, toggle } = useTheme();
  const [enquire, setEnquire] = useState(false);
  const [prospect, setProspect] = useState('idle');
  const [prospectEmail, setProspectEmail] = useState('');
  const heroRef = useRef(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroScale = useTransform(scrollYProgress, [0, 1], [1, reduced ? 1 : 1.12]);
  const heroFade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const prospectSubmit = (e) => {
    e.preventDefault();
    if (!prospectEmail.trim()) { setProspect('required'); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(prospectEmail)) { setProspect('error'); return; }
    setProspect('success');
  };

  return (
    <div className="min-h-screen bg-[var(--cf-bg)] text-[var(--cf-ink)]">
      <Preloader />
      {/* Sticky nav + priced CTA */}
      <header className="sticky top-0 z-50 cf-glass border-b border-[var(--cf-line)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5" aria-label="CampusFlow home">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary-500 to-accent-violet grid place-items-center text-white font-bold text-sm shadow-2" aria-hidden>C</span>
            <span className="font-bold tracking-tight">CampusFlow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1" aria-label="Sections">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} className="px-3 py-2 rounded-full text-sm text-[var(--cf-ink-soft)] hover:bg-black/[.04] dark:hover:bg-white/10 transition">{n.label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <button onClick={toggle} aria-label="Toggle theme" className="p-2 rounded-full hover:bg-black/[.05] dark:hover:bg-white/10 transition">
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <Link to="/login" className="hidden sm:block text-sm font-medium px-3 py-2 rounded-full hover:bg-black/[.05] dark:hover:bg-white/10 transition">Sign in</Link>
            <MagneticButton onClick={() => setEnquire(true)} className={cn(btnClass('primary', 'small'))}>
              Apply now <ArrowUpRight size={14} />
            </MagneticButton>
          </div>
        </div>
      </header>

      <main>
        {/* Hero — scrubbed 3D */}
        <section ref={heroRef} className="relative overflow-hidden cf-grain" aria-label="Introduction">
          <motion.div style={reduced ? undefined : { scale: heroScale, opacity: heroFade }} className="max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-20 pb-6">
            <p className="cf-kicker">Writing infrastructure for modern campuses</p>
            <h1 className="cf-statement mt-4 max-w-5xl">
              <SplitReveal lines={['The campus,', '<em>alive</em> in software.']} />
            </h1>
            <p className="mt-5 max-w-xl text-base sm:text-lg text-[var(--cf-ink-mute)]">
              CampusFlow turns a university into one intelligent place — classes, placements,
              people and insight, moving together in real time.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <MagneticButton onClick={() => setEnquire(true)} className={cn(btnClass('glow', 'large'))}>
                Explore CampusFlow <ArrowRight size={17} />
              </MagneticButton>
              <a href="#campus" className={cn(btnClass('outline', 'large'))}>See how it works</a>
            </div>
          </motion.div>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-14">
            <div className="h-[380px] sm:h-[520px] rounded-3xl overflow-hidden border border-[var(--cf-line)]">
              <SpatialCanvas className="w-full h-full" compact={false} />
            </div>
          </div>
        </section>

        {/* Spec strip */}
        <section id="system" className="max-w-6xl mx-auto px-4 sm:px-6 py-20 sm:py-28" aria-label="System">
          <p className="cf-kicker">The system</p>
          <SplitReveal className="cf-statement-sm mt-3 max-w-3xl" lines={['Three systems.', '<em>One campus.</em>']} />
          <div className="grid md:grid-cols-3 gap-px mt-10 rounded-3xl overflow-hidden border border-[var(--cf-line)] bg-[var(--cf-line)]">
            {SPECS.map((s) => (
              <article key={s.k} className="bg-[var(--cf-surface)] p-7">
                <p className="cf-kicker">{s.k}</p>
                <h3 className="cf-display text-2xl mt-2">{s.title}</h3>
                <p className="mt-2 text-sm text-[var(--cf-ink-mute)] leading-relaxed">{s.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Philosophy interstitial */}
        <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center" aria-label="Philosophy">
          <SplitReveal className="cf-statement" lines={['Some places need time,', 'space, and <em>a pulse</em> to exist.']} />
          <p className="mt-5 text-[var(--cf-ink-mute)] max-w-xl mx-auto">A campus is not a database of records. It’s thousands of days unfolding at once — and software should feel like that.</p>
        </section>

        {/* Audience */}
        <section id="audience" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24" aria-label="Who it's for">
          <p className="cf-kicker">Who it’s for</p>
          <SplitReveal className="cf-statement-sm mt-3 max-w-2xl" lines={['Made for people who', '<em>live on campus.</em>']} />
          <div className="grid md:grid-cols-3 gap-4 mt-10">
            {AUDIENCES.map(({ Icon, title, body }) => (
              <article key={title} className={cn(cardClass, 'p-7 hover:shadow-3 hover:-translate-y-1 transition-all duration-300')}>
                <Icon size={22} className="text-primary-500" aria-hidden />
                <h3 className="cf-display text-2xl mt-4">{title}</h3>
                <p className="mt-2 text-sm text-[var(--cf-ink-mute)] leading-relaxed">{body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Alternating splits */}
        <div id="campus" className="max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-16 space-y-20 sm:space-y-28" aria-label="Campus in depth">
          {SPLITS.map((s, i) => (
            <section key={s.n} className={cn('grid lg:grid-cols-2 gap-8 items-center', i % 2 && 'lg:[&>*:first-child]:order-2')}>
              <div>
                <p className="cf-kicker">{s.n} — CampusFlow</p>
                <SplitReveal className="cf-statement-sm mt-3" lines={s.claim} />
                <p className="mt-4 text-[var(--cf-ink-mute)] max-w-md leading-relaxed">{s.body}</p>
              </div>
              <div className={cn('relative h-[300px] sm:h-[380px] rounded-3xl overflow-hidden border border-[var(--cf-line)] bg-gradient-to-br cf-grain', s.tint)} aria-hidden>
                <s.Icon size={120} strokeWidth={0.6} className="absolute inset-0 m-auto text-[var(--cf-ink)] opacity-15" />
                <span className="cf-display italic absolute bottom-5 left-6 text-6xl opacity-20">{s.n}</span>
              </div>
            </section>
          ))}
        </div>

        {/* Recruiter marquee */}
        <section className="py-16 sm:py-20" aria-label="Hiring partners">
          <p className="cf-kicker text-center mb-6">Hiring on CampusFlow</p>
          <Marquee label="Hiring partners">
            {RECRUITERS.map((r) => (
              <span key={r} className="px-6 py-3 rounded-full border border-[var(--cf-line)] bg-[var(--cf-surface)] text-sm font-semibold whitespace-nowrap">{r}</span>
            ))}
          </Marquee>
        </section>

        {/* Stories slider */}
        <section id="stories" className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24" aria-label="Stories">
          <p className="cf-kicker">Stories</p>
          <CounterCarousel
            label="Campus voices"
            slides={STORIES.map((s) => (
              <figure className={cn('rounded-3xl border border-[var(--cf-line)] bg-gradient-to-br p-8 sm:p-12 cf-grain', s.tint)}>
                <blockquote className="cf-statement-sm">“{s.quote}”</blockquote>
                <figcaption className="mt-5 text-sm text-[var(--cf-ink-mute)]">{s.who}</figcaption>
              </figure>
            ))}
          />
        </section>

        {/* Inside the box */}
        <section id="inside" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24" aria-label="Inside CampusFlow">
          <p className="cf-kicker">Inside CampusFlow</p>
          <SplitReveal className="cf-statement-sm mt-3 max-w-2xl" lines={['A complete,', '<em>ready-to-run</em> campus.']} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-10">
            {KIT.map((k, i) => (
              <article key={k.title} className={cn(cardClass, 'p-6')}>
                <p className="cf-display italic text-4xl opacity-30" aria-hidden>0{i + 1}</p>
                <h3 className="font-semibold mt-2">{k.title}</h3>
                <p className="mt-1 text-sm text-[var(--cf-ink-mute)]">{k.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Prospectus */}
        <section className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center" aria-label="Stay ahead">
          <p className="cf-kicker">Stay ahead</p>
          <h2 className="cf-statement-sm mt-3">Admissions open. <em>Get the prospectus.</em></h2>
          {prospect === 'success' ? (
            <p className="mt-6 text-sm">All set. We’ll keep you posted.</p>
          ) : (
            <form onSubmit={prospectSubmit} className="mt-6 flex flex-col sm:flex-row gap-2 max-w-md mx-auto" noValidate>
              <input
                type="email"
                value={prospectEmail}
                onChange={(e) => setProspectEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email for prospectus"
                className="flex-1 px-4 py-3 rounded-full text-sm bg-[var(--cf-surface)] border border-[var(--cf-line)] focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button type="submit" className={cn(btnClass('primary', 'medium'))}>Notify me</button>
            </form>
          )}
          {prospect === 'required' && <p role="alert" className="mt-2 text-xs">This field is required.</p>}
          {prospect === 'error' && <p role="alert" className="mt-2 text-xs">Something went wrong! Try again.</p>}
        </section>
      </main>

      <footer className="border-t border-[var(--cf-line)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid sm:grid-cols-3 gap-6">
          <div>
            <p className="font-bold tracking-tight">CampusFlow</p>
            <p className="mt-1 text-xs text-[var(--cf-ink-mute)]">The digital campus itself.</p>
          </div>
          <nav className="flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Footer">
            {NAV.map((n) => <a key={n.href} href={n.href} className="text-[var(--cf-ink-soft)] hover:text-primary-600 transition">{n.label}</a>)}
          </nav>
          <p className="text-xs text-[var(--cf-ink-mute)] sm:text-right">© {new Date().getFullYear()} CampusFlow · Crafted with restraint</p>
        </div>
      </footer>

      <EnquireModal open={enquire} onClose={() => setEnquire(false)} />
    </div>
  );
}
