// Landing: cinematic product story orchestrated through modular sections.
// Flow: hero → proof → chapters → grid. ONE dominant interaction per
// section, never stacked effects. Oversized type, sticky scenes, scroll
// choreography, and Obsidian Ember visual identity.
// Clean typography without decorative badge noise or category pills.
// CTAs route to real product routes only (/login, /dashboard, /attendance,
// /placement, /users).

import LandingHeader from '../components/landing/LandingHeader';
import HeroSection from '../components/landing/HeroSection';
import TrustBar from '../components/landing/TrustBar';
import SignalsSection from '../components/landing/SignalsSection';
import AttendanceSection from '../components/landing/AttendanceSection';
import PlacementSection from '../components/landing/PlacementSection';
import WorkflowSection from '../components/landing/WorkflowSection';
import DirectorySection from '../components/landing/DirectorySection';
import RoleExperiencesSection from '../components/landing/RoleExperiencesSection';
import JourneySection from '../components/landing/JourneySection';
import FinalCTA from '../components/landing/FinalCTA';
import LandingFooter from '../components/landing/LandingFooter';
import { SectionConnector } from '../components/landing/shared';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[var(--cf-bg)] text-[#100D0B] dark:text-[#F5F7FA] antialiased overflow-x-clip">
      {/* 01 — Capsule nav */}
      <LandingHeader />

      <main>
        {/* 02 — Hero with 3D ContainerScroll */}
        <HeroSection />

        {/* 03 — Proof, directly under hero */}
        <section className="landing-band relative isolate w-full" aria-label="CampusFlow at a glance">
          <div className="landing-inner max-w-6xl mx-auto px-4 sm:px-6 pt-8 sm:pt-10 pb-10 sm:pb-14">
            <TrustBar />
          </div>
        </section>

        <SectionConnector />

        {/* 04 — Academic intelligence (pulse framing folded in) */}
        <SignalsSection />

        {/* 05 — Attendance matrix & movement */}
        <AttendanceSection />

        {/* 06 — Placement pipeline */}
        <PlacementSection />

        <SectionConnector />

        {/* 07 — Workflow radial orbital mesh */}
        <WorkflowSection />

        <SectionConnector />

        {/* 08 — Role directory */}
        <DirectorySection />

        <SectionConnector />

        {/* 09 — Role experiences grid */}
        <RoleExperiencesSection />

        <SectionConnector />

        {/* 10 — Getting-started chapters */}
        <JourneySection />

        <SectionConnector />

        {/* 11 — Final CTA */}
        <FinalCTA />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
