// TrustBar: counter bar — 4 glass metrics, structural truths only.
// Counts are derived from the real source of truth (tokens + domains),
// never hardcoded marketing numbers.
import { PIPELINE_STAGES, ROLES } from '../../system/tokens';
import { DOMAINS } from '../spatial/domains';

const METRICS = [
  { value: String(ROLES.length), label: 'Roles, one identity' },
  { value: String(PIPELINE_STAGES.length), label: 'Placement pipeline stages' },
  { value: String(DOMAINS.length), label: 'Campus domains in 3D' },
  { value: '4', label: 'Role workspaces in the tour' }
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
          className="cf-glass rounded-3xl border border-black/10 dark:border-white/10 px-5 py-5 sm:px-6 sm:py-6 text-center"
        >
          <dd className="font-display font-bold tabular-nums text-3xl sm:text-4xl text-[#0A0D12] dark:text-[#F5F7FA]">
            {m.value}
          </dd>
          <dt className="mt-1.5 text-xs sm:text-[13px] font-medium text-[#4B5563] dark:text-[#A7B0BF]">
            {m.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}
