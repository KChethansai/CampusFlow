// Landing: cinematic 12-section product story orchestrated through modular sections.
// ONE dominant interaction per section, never stacked effects. Oversized type,
// sticky scenes, scroll choreography, and Obsidian Ember visual identity.
// Clean typography without decorative badge noise or category pills.
// CTAs route to /login, /dashboard, /placement.

import LandingHeader from '../components/landing/LandingHeader';
import HeroSection from '../components/landing/HeroSection';
import PulseSection from '../components/landing/PulseSection';
import SignalsSection from '../components/landing/SignalsSection';
import AttendanceSection from '../components/landing/AttendanceSection';
import PlacementSection from '../components/landing/PlacementSection';
import WorkflowSection from '../components/landing/WorkflowSection';
import DirectorySection from '../components/landing/DirectorySection';
import IntelligenceSection from '../components/landing/IntelligenceSection';
import RoleExperiencesSection from '../components/landing/RoleExperiencesSection';
import JourneySection from '../components/landing/JourneySection';
import FinalCTA from '../components/landing/FinalCTA';
import LandingFooter from '../components/landing/LandingFooter';
import { SectionConnector } from '../components/landing/shared';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F6F7F9] dark:bg-[#100D0B] text-[#100D0B] dark:text-[#F5F7FA] antialiased overflow-x-clip">
      {/* 01 — Capsule nav */}
      <LandingHeader />

      <main>
        {/* 02 — Hero with 3D ContainerScroll */}
        <HeroSection />

        <SectionConnector />

        {/* 03 — Platform pulse */}
        <PulseSection />

        {/* 04 — Academic intelligence */}
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

        {/* 09 — Grounded intelligence */}
        <IntelligenceSection />

        <SectionConnector />

        {/* 10 — Role experiences portal */}
        <RoleExperiencesSection />

        <SectionConnector />

        {/* 11 — Getting started journey */}
        <JourneySection />

        <SectionConnector />

        {/* 12 — Final CTA */}
        <FinalCTA />
      </main>

      {/* Footer */}
      <LandingFooter />
    </div>
  );
}
