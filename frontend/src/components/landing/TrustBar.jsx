// TrustBar: platform pulse — Magic Number Ticker stats, structural truths only.
// Counts derive from tokens + domains + portal tabs, never marketing numbers.
import { PIPELINE_STAGES, ROLES } from '../../system/tokens';
import { DOMAINS } from '../spatial/domains';
import { AnimatedCounter } from '../ui/editorial';

const METRICS = [
  { value: ROLES.length, label: 'Roles, one identity' },
  { value: PIPELINE_STAGES.length, label: 'Placement pipeline stages' },
  { value: DOMAINS.length, label: 'Campus domains in 3D' },
  { value: 4, label: 'Role workspaces in the tour' } // mirrors ProductPortal TABS
];

export default function TrustBar() {
  return (
    <dl
      className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
      aria-label="CampusFlow at a glance"
    >
      {METRICS.map((m) => (
        <div
          key={m.label}
          className="cf-glass rounded-[24px] border border-black/10 dark:border-white/10 px-5 py-5 sm:px-6 sm:py-6 text-center"
        >
          <dd className="font-display font-bold tabular-nums text-4xl sm:text-5xl text-[#100D0B] dark:text-[#F5F7FA]">
            <AnimatedCounter value={m.value} />
          </dd>
          <dt className="mt-1.5 text-xs sm:text-[13px] font-medium text-[#4B5563] dark:text-[#A7B0BF]">
            {m.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}
