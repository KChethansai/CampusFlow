# External UI Sources & Component Attribution

This document records all external design pattern inspirations and ecosystems adapted into the CampusFlow digital performance UI system. All adapted components are implemented as zero-dependency plain JSX normalized to Tailwind CSS v4, Motion, Three.js/R3F, and Lucide icons.

| Component | Source Ecosystem | Original Name | Reference URL | Adaptation Details |
| :--- | :--- | :--- | :--- | :--- |
| **Spotlight Card** | 21st.dev / Magic UI | `spotlight-card` | https://21st.dev | Dynamic radial gradient track on cursor movement with Obsidian Ember border tokens. |
| **Liquid Glass Button** | 21st.dev | `liquid-glass-button` | https://21st.dev | Conic moving border gradient sheen with spring-physics magnetic cursor attraction. |
| **Container Scroll 3D Tilt** | 21st.dev / Aceternity | `container-scroll-animation` | https://21st.dev | Scroll-progress driven 3D perspective tilt (`rotateX` 16deg → 0deg, scale 0.94 → 1). |
| **Radial Orbital Timeline** | 21st.dev | `radial-orbital-timeline` | https://21st.dev | Interactive 4-quadrant campus workflow mesh with orbiting status nodes and pulse rings. |
| **Dashboard Hero** | 21st.dev | `dashboard-hero` | https://21st.dev | Role greeting card, status ping, quick metrics strip, and action launchers. |
| **Animated Password Input** | 21st.dev | `animated-password-input` | https://21st.dev | Smooth icon morph with spring focus ring and high-contrast toggle. |
| **Connected 3D Topology** | 21st.dev | `3d-spline-hero` | https://21st.dev | Architectural elevated obsidian slabs, crystal core structure, CatmullRom spline conduits. |
| **Border Beam** | Magic UI | `border-beam` | https://magicui.design/docs/components/border-beam | Continuous traveling beam on report cards. |
| **Number Ticker** | Magic UI | `number-ticker` | https://magicui.design/docs/components/number-ticker | Eased number counters for metrics and stats. |
| **Blur Text** | React Bits | `blur-text` | https://reactbits.dev/text-animations/blur-text | Word-stagger blur reveal for hero headings. |
| **Split Text / Reveal** | React Bits | `split-text` | https://reactbits.dev/text-animations/split-text | Line-by-line masked editorial reveals. |
| **Animated Tabs** | Smooth UI | `animated-tabs` | https://smoothui.dev/docs/components/tabs | LayoutId spring indicator tab switchers across portals and auth. |
| **Slide-over Drawer** | Smooth UI | `drawer` | https://smoothui.dev/docs/components/drawer | Motion slide-over panels for responsive navigation and details. |
