import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion, useScroll, useTransform } from 'motion/react';
import { ArrowRight, Briefcase, GraduationCap, ShieldCheck, Users } from 'lucide-react';
import ProductPortal from './ProductPortal';
import { Reveal, SectionHead, glassCard } from './shared';
import { stackEnter, stackExit, useReducedMotion } from '../../system/motion';

const ROLE_CARDS = [
  {
    Icon: GraduationCap,
    tag: 'Student',
    title: 'Your day, accounted for',
    body: 'End each day knowing every class, due date, and application is tracked in one record.',
    points: 'Attendance · Assignments · Placement · Study',
    to: '/dashboard'
  },
  {
    Icon: Users,
    tag: 'Faculty',
    title: 'Teach, don’t file',
    body: 'Mark attendance in seconds, clear the grading queue, answer requests without paperwork.',
    points: 'Attendance · Grading · Subjects · Requests',
    to: '/attendance'
  },
  {
    Icon: Briefcase,
    tag: 'Placement cell',
    title: 'Drives to offers',
    body: 'Publish drives, check eligibility, and move candidates from applied to placed.',
    points: 'Pipeline · Directory · Events · Dashboard',
    to: '/placement'
  },
  {
    Icon: ShieldCheck,
    tag: 'Administration',
    title: 'The operating picture',
    body: 'Govern users, departments, courses, and AI reports from one workspace.',
    points: 'Users · Courses · AI reports · Requests',
    to: '/users'
  }
];

function RoleCardLink({ Icon, tag, title, body, points, to }) {
  return (
    <Link
      to={to}
      className={`group ${glassCard} p-6 flex flex-col gap-4 hover:border-[#D86D3E]/40 dark:hover:border-[#D86D3E]/50 transition-colors h-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A94727]`}
    >
      <div className="flex items-center justify-between">
        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-[#D86D3E]/10 dark:bg-[#D86D3E]/15 text-[#D86D3E] dark:text-[#F5B08A]">
          {tag}
        </span>
        <span
          className="w-10 h-10 rounded-2xl grid place-items-center border border-black/10 dark:border-white/10 text-[#4B5563] dark:text-[#A7B0BF]"
          aria-hidden
        >
          <Icon size={19} />
        </span>
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold tracking-tight text-[#100D0B] dark:text-[#F5F7FA]">
          {title}
        </h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[#4B5563] dark:text-[#A7B0BF]">
          {body}
        </p>
      </div>
      <p className="text-xs text-[#4B5563] dark:text-[#A7B0BF]">{points}</p>
      <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-[#A94727] dark:text-[#F5B08A]">
        Enter workspace
        <ArrowRight size={15} aria-hidden className="transition-transform duration-200 group-hover:translate-x-1.5" />
      </span>
    </Link>
  );
}

// One stacking card: entrance consumes stackEnter, scroll shrink drives toward
// stackExit.exit.scale (1 → 0.94) as the next card covers. Transform-only.
function StackCard({ card, index, total, progress, armed }) {
  const start = index / total;
  const end = Math.min(1, (index + 1.15) / total);
  const scale = useTransform(
    progress,
    [start, end],
    [stackExit.initial.scale ?? 1, stackExit.exit.scale ?? 0.94]
  );
  return (
    <div className={`cf-chapter-stack sticky${armed ? ' armed' : ''}`} style={{ top: 84 + index * 16 }}>
      <motion.div
        initial={stackEnter.initial}
        whileInView={stackEnter.animate}
        viewport={{ once: true, margin: '-8% 0px' }}
        transition={stackEnter.transition}
      >
        <motion.div style={{ scale }} className="will-change-transform">
          <RoleCardLink {...card} />
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function RoleExperiencesSection() {
  const reduced = useReducedMotion();
  const sectionRef = useRef(null);
  const stackRef = useRef(null);
  const [armed, setArmed] = useState(false);
  const { scrollYProgress } = useScroll({ target: stackRef, offset: ['start 0.85', 'end 0.55'] });

  // Lazy-arm the scroll enhancer only as the section nears the viewport —
  // before that (and always under reduced motion) the plain readable list wins.
  useEffect(() => {
    if (reduced || armed) return;
    const el = sectionRef.current;
    if (!el || !('IntersectionObserver' in window)) {
      setArmed(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setArmed(true);
          io.disconnect();
        }
      },
      { rootMargin: '480px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced, armed]);

  const enhance = !reduced && armed;

  return (
    <section ref={sectionRef} id="roles" className="landing-band relative isolate w-full" aria-label="Role experiences">
      <div className="landing-inner max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <SectionHead
          title="One platform. Four tailored experiences."
          body="Four roles, four workspaces — each opens what its permissions allow."
        />
        <Reveal className="mt-7">
          <ProductPortal />
        </Reveal>
        {/* Desktop ≥1024px: static 4-up grid, untouched by the stacking idiom. */}
        <div className="hidden lg:grid lg:grid-cols-4 gap-4 mt-4">
          {ROLE_CARDS.map((card) => (
            <Reveal key={card.tag}>
              <RoleCardLink {...card} />
            </Reveal>
          ))}
        </div>
        {/* Below lg: sticky scroll-stacking (progressive enhancement);
            reduced motion or pre-arm: plain stacked-readable list. */}
        <div ref={stackRef} className="lg:hidden mt-4 flex flex-col gap-4">
          {ROLE_CARDS.map((card, i) =>
            enhance ? (
              <StackCard key={card.tag} card={card} index={i} total={ROLE_CARDS.length} progress={scrollYProgress} armed={enhance} />
            ) : (
              <RoleCardLink key={card.tag} {...card} />
            )
          )}
        </div>
      </div>
    </section>
  );
}
