import { Link } from 'react-router';
import { ArrowRight, Users } from 'lucide-react';
import { SpotCard } from '../ui/editorial';
import { ROLES, roleLabel } from '../../system/tokens';
import { Reveal, SectionHead, glassCard } from './shared';

export default function DirectorySection() {
  return (
    <section id="people" className="landing-band relative isolate w-full" aria-label="People">
      <div className="landing-inner max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <SectionHead
          title="Everyone, findable."
          body="Six verified roles, unified authentication — the directory mirrors the real identity model."
        />
        <div className="mt-7 grid sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {ROLES.map((role, i) => (
            <Reveal key={role} delay={Math.min(i * 0.06, 0.24)}>
              <SpotCard className={`${glassCard} p-5 flex gap-4 items-start h-full`}>
                <span
                  className="w-12 h-12 shrink-0 rounded-2xl grid place-items-center font-display font-bold text-lg bg-[#D86D3E]/10 dark:bg-[#D86D3E]/15 text-[#D86D3E] dark:text-[#F5B08A]"
                  aria-hidden
                >
                  {roleLabel(role).charAt(0)}
                </span>
                <span>
                  <span className="block font-display font-semibold tracking-tight text-[17px] text-[#100D0B] dark:text-[#F5F7FA]">
                    {roleLabel(role)}
                  </span>
                  <span className="block font-mono text-[11px] text-[#4B5563] dark:text-[#707A89] mt-0.5">
                    @{role}
                  </span>
                  <span className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full border border-black/10 dark:border-white/10 font-mono text-[10px] text-[#4B5563] dark:text-[#A7B0BF]">
                    {role === 'student'
                      ? 'Learner Workspace'
                      : role === 'faculty'
                      ? 'Faculty Portal'
                      : role === 'hod'
                      ? 'Department Desk'
                      : role === 'placement_officer'
                      ? 'Placement Cell'
                      : role === 'college_admin'
                      ? 'Campus Admin'
                      : 'System Root'}
                  </span>
                  <Link
                    to="/dashboard"
                    className="mt-2.5 inline-flex items-center gap-1 py-1 text-[13px] font-semibold text-[#A94727] dark:text-[#F5B08A] hover:underline underline-offset-4"
                  >
                    View workspace <ArrowRight size={13} aria-hidden />
                  </Link>
                </span>
              </SpotCard>
            </Reveal>
          ))}
          <Reveal delay={0.24}>
            <Link
              to="/dashboard"
              className={`group ${glassCard} p-5 flex flex-col justify-center h-full hover:border-[#D86D3E]/40 transition-colors min-h-[148px]`}
            >
              <span className="inline-flex items-center gap-2 text-[13px] font-semibold uppercase tracking-wider text-[#4B5563] dark:text-[#A7B0BF]">
                <Users size={14} aria-hidden /> Institutional Directory
              </span>
              <span className="mt-2 font-display font-semibold text-[17px] tracking-tight text-[#100D0B] dark:text-[#F5F7FA]">
                Browse the full directory after sign-in
              </span>
              <span className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#D86D3E] dark:text-[#F5B08A]">
                Enter directory
                <ArrowRight size={15} aria-hidden className="transition-transform duration-200 group-hover:translate-x-1.5" />
              </span>
            </Link>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
