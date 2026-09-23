# Component Architecture Registry

This registry tracks the internal mappings, adaptations, and architectural decisions made for the CampusFlow Modern UI layer.

## Single-Owner Component Architecture Matrix

| Component Category | Ecosystem Owner | File Target | Adaptation Details |
| :--- | :--- | :--- | :--- |
| **Animation Engine** | **Motion** | `frontend/src/system/motion.js` | Native springs, reduced-motion guards, layoutId active indicators, stagger orchestrators. |
| **Spatial 3D Canvas** | **Three.js & R3F** | `frontend/src/components/hero/` | Connected architectural topology: elevated obsidian slabs, crystal core structure, CatmullRom conduits, smooth camera rig. |
| **Cinematic 21st.dev Visuals** | **21st.dev** | `frontend/src/components/visual/` | `ContainerScroll`, `LiquidGlassButton`, `RadialOrbitalTimeline`, `DashboardHero`, `SpotlightCard`, `PasswordInput`. |
| **Signature Effects & Cards** | **Magic UI** | `frontend/src/components/ui/editorial.jsx` | BeamCard, SpotCard, HeroBackdrop, BentoGrid, Marquee. Pure CSS/SVG + Motion, zero npm packages. |
| **Typography & Micro-FX** | **React Bits** | `frontend/src/components/ui/editorial.jsx` | SplitReveal, BlurText, DecryptText, AnimatedCounter, NumberTickerLg, MagneticButton. |
| **Surfaces & CTAs** | **Kokonut UI** | `frontend/src/components/ui/primitives.jsx` | GlowButton, ParticleButton, Glass cards, Tokenized buttons. |
| **Form Controls & Triggers** | **Smooth UI** | `frontend/src/components/ui/primitives.jsx` | Animated Tabs (layoutId), Drawer (Motion slide-over), Tooltip, ProgressRing, StepBar. |
| **Data Visualization** | **Bklit UI** | `frontend/src/components/data/charts/` | Pure SVG + Motion ports: AreaChart, BarChart, FunnelChart, GaugeChart, HeatmapChart, RingChart, LineChart. Zero Recharts dependency. |
| **Compositions & Shell** | **21st.dev** | `frontend/src/shell/AppShell.jsx` | Docked rail navigation with active indicators, floating topbar with hide-on-scroll, mobile bottom bar, command palette. |
| **Modular Landing Story** | **CampusFlow Decomposed** | `frontend/src/components/landing/` | Decomposed section components (`HeroSection`, `PulseSection`, `SignalsSection`, `AttendanceSection`, `PlacementSection`, `WorkflowSection`, `DirectorySection`, `IntelligenceSection`, `RoleExperiencesSection`, `JourneySection`, `FinalCTA`). Zero decorative badge noise. |

## Technical Directives Enforced
1. **Zero TypeScript:** Every component is stored as `.jsx` or `.js` with clean standard prop types.
2. **Tailwind CSS v4 Tokens:** CSS custom properties backed by `@theme` and `:root` / `.dark` in Obsidian Ember palette.
3. **Motion Standardization:** Motion.dev with full `prefers-reduced-motion` fallbacks.
4. **Accessible Semantics:** Semantic HTML, ARIA labels, focus-visible indicators, keyboard interaction (Tab, Enter, Space, Escape).
5. **Zero Label Noise:** Clean, monumental editorial hierarchy without decorative section numbers (`01 /`), status pills, or internal jargon.
