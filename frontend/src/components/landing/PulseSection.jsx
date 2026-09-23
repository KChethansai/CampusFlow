import TrustBar from './TrustBar';
import { Reveal, SectionHead } from './shared';

export default function PulseSection() {
  return (
    <section className="landing-band relative isolate w-full" aria-label="CampusFlow at a glance">
      <div className="landing-inner max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <SectionHead
          title="The shape of the system."
          body="Four structural facts. No vanity metrics — every number names something real in the workspace."
        />
        <Reveal className="mt-7">
          <TrustBar />
        </Reveal>
      </div>
    </section>
  );
}
