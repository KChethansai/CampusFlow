import RadialOrbitalTimeline from '../visual/RadialOrbitalTimeline';
import { Reveal, SectionHead } from './shared';

export default function WorkflowSection() {
  return (
    <section id="workflow" className="landing-band relative isolate w-full" aria-label="Workflow mesh">
      <div className="landing-inner max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <SectionHead
          title="How campus workflows connect."
          body="Interactive radial topology showing how coursework, attendance, placement drives, and governance synchronize in real time."
        />
        <Reveal className="mt-7">
          <RadialOrbitalTimeline />
        </Reveal>
      </div>
    </section>
  );
}
