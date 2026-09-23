import { Link } from 'react-router';
import { ArrowRight, Briefcase, GraduationCap, ShieldCheck, Users } from 'lucide-react';
import ProductPortal from './ProductPortal';
import { Reveal, SectionHead, glassCard } from './shared';

const ROLE_CARDS = [
  {
    Icon: GraduationCap,
    tag: 'Student',
    title: 'One command center',
    body: 'Next class, due work, attendance health and placement pulse.',
    points: 'Attendance · Assignments · Placement · Study'
  },
  {
    Icon: Users,
    tag: 'Faculty',
    title: 'Teach, don’t file',
    body: 'Attendance in seconds, grading in a queue, requests without paperwork.',
    points: 'Attendance · Grading · Subjects · Requests'
  },
  {
    Icon: Briefcase,
    tag: 'Placement cell',
    title: 'Drives to offers',
    body: 'Publish drives, track eligibility, move candidates down the pipeline.',
    points: 'Pipeline · Directory · Events · Dashboard'
  },
  {
    Icon: ShieldCheck,
    tag: 'Administration',
    title: 'The operating picture',
    body: 'People, departments, academics and insight — one governed workspace.',
    points: 'Users · Courses · AI reports · Requests'
  }
];

export default function RoleExperiencesSection() {
  return (
    <section id="roles" className="landing-band relative isolate w-full" aria-label="Role experiences">
      <div className="landing-inner max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <SectionHead
          title="One platform. Four tailored experiences."
          body="Each campus stakeholder accesses a purpose-built workspace aligned with their daily workflows, permissions, and priorities."
        />
        <Reveal className="mt-7">
          <ProductPortal />
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mt-4">
          {ROLE_CARDS.map(({ Icon, tag, title, body, points }) => (
            <Reveal key={tag}>
              <Link
                to="/login"
                className={`group ${glassCard} p-6 flex flex-col gap-4 hover:border-[#D86D3E]/40 dark:hover:border-[#D86D3E]/50 transition-colors h-full`}
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
                <p className="text-xs text-[#4B5563] dark:text-[#707A89]">{points}</p>
                <span className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold text-[#D86D3E] dark:text-[#F5B08A]">
                  Enter workspace
                  <ArrowRight size={15} aria-hidden className="transition-transform duration-200 group-hover:translate-x-1.5" />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
