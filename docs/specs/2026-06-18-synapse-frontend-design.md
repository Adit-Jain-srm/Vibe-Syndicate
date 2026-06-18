# Synapse — Frontend Redesign Spec

> Syndicate's frontend as a spatial experience. Navigation = camera movement through a living neural constellation. No pages. One continuous mind.

---

## Vision

The product IS the visualization. Judges don't read a dashboard — they watch AI agents think in real-time, rendered as a living neural constellation in 3D space. Every interaction has physical weight. Every agent action has visible consequence.

**Metaphor**: Living organism + neural constellation hybrid. The swarm is a creature made of light. Agents are its neurons. Tasks are its thoughts. Memory is its growth.

---

## Architecture

### Single Persistent Scene

One Three.js `<Canvas>` lives at the App level. It never unmounts. All "navigation" is camera movement within this scene. Route changes trigger spring-animated camera transitions.

```
App.tsx
├── <ConstellationCanvas />              ← PERSISTENT, never remounts
│   ├── <SceneController />              ← reads route, animates camera
│   ├── <AgentNodes count={6} />         ← glowing spheres, data-driven
│   ├── <ConnectionFibers />             ← light paths between nodes
│   ├── <TaskPulses />                   ← photons traveling connections
│   ├── <MemoryField />                  ← growing outer shell of stars
│   ├── <AmbientDust />                  ← slow particle backdrop
│   ├── <PostProcessing />               ← Bloom + ChromaticAberration
│   └── <InputZone />                    ← 3D text input at center
├── <HUDOverlay />                       ← screen-space 2D panels per route
│   ├── <DashboardHUD />
│   ├── <PipelineHUD />
│   ├── <MetricsHUD />
│   ├── <MemoryHUD />
│   ├── <ApprovalsHUD />
│   └── <LiveRoomHUD />
├── <NavigationRail />                   ← minimal vertical nav (camera presets)
└── <SoundEngine />                      ← ambient + event-driven audio
```

### Data Flow

```
Supabase Realtime → Zustand store → Three.js scene reactivity
                                   → HUD panel updates

User input → Supabase INSERT → Bridge picks up → Band agents process
                                                → Events emit to Supabase
                                                → Realtime pushes to frontend
                                                → Scene reacts (node flares, photon travels)
```

---

## Scene Topology

### Spatial Layout

```
                    ◇ Memory Field (outer sphere, expanding)
                   /
        ◔ Metrics /
         (above) /
                /
    ⬡ Architect --- ◈ Nexus (CENTER) --- ⬡ Engineer
         \              |                    /
          \        [Input Zone]             /
           \            |                  /
            ⬡ Reviewer ---- ⬡ QA        ⬡ Researcher
                  \
                   ⊙ Approvals (below, isolated, amber)
```

- **Center**: Nexus conductor node + Input Zone (task origin point)
- **Inner ring**: 5 specialist agents arranged in a pentagon, radius ~5 units
- **Connections**: Fiber-optic curves between agents that have collaborated
- **Outer shell**: Memory particles — thousands of dim points forming a growing sphere (radius ~15 units)
- **Below center**: Approvals region, isolated, pulled away from the ring

### Node Properties

| Agent | Color | Position | Behavior |
|-------|-------|----------|----------|
| Nexus | #6366f1 (indigo) | Origin (0, 0, 0) | Largest node, pulses as conductor |
| Architect | #06b6d4 (cyan) | (-3, 1, 2) | Flares when planning |
| Engineer | #34d399 (emerald) | (3, 0, 2) | Rapid pulse when coding |
| Reviewer | #fb7185 (rose) | (-2, -1, -3) | Bicolor flicker during review |
| Researcher | #fbbf24 (amber) | (4, 1, -2) | Orbiting smaller particles |
| QA | #8b5cf6 (violet) | (-1, -2, -2) | Steady, validation glow |

---

## Navigation & Camera

### Route → Camera Mapping

| Route | Camera Target | Distance | Angle | HUD Position |
|-------|--------------|----------|-------|--------------|
| `/` (Landing) | (0, 2, 0) | 20 | Orbiting | Full-screen overlay |
| `/app` (Dashboard) | Nexus node | 8 | Front-facing | Right panel |
| `/pipeline` | Along task path | 6 | Tracking rail | Bottom panel |
| `/live` | Orbiting inner ring | 10 | Equatorial orbit | Left feed |
| `/metrics` | (0, 12, 0) | 14 | Top-down | Floating cards |
| `/memory` | Outer shell edge | 12 | Outward-facing | Right timeline |
| `/approvals` | Amber node below | 6 | Looking up | Center modal |
| `/agents` | Orbiting ring | 8 | Slow orbit | Cards near nodes |

### Camera Transitions

- Duration: 800ms
- Easing: Spring (stiffness: 60, damping: 20)
- Path: Curved bezier (not linear — feels organic)
- Overshoot: 5% (camera arrives, bounces slightly back)
- During transition: HUD panels fade out immediately, fade in 200ms after camera arrives

---

## HUD Panels (2D Overlays)

### Design Language

- **Position**: Screen-space, anchored to one edge (never centered — leave 3D breathing room)
- **Background**: `rgba(8, 9, 12, 0.75)` + `backdrop-filter: blur(20px)`
- **Border**: 1px `rgba(255, 255, 255, 0.06)` + subtle inner glow matching nearest node color
- **Border radius**: 24px
- **Max width**: 480px (narrow panels, not full-screen takeovers)
- **Entry animation**: Slide from nearest edge + fade (200ms, ease-out)
- **Exit animation**: Fade out (100ms) — instant, don't slow down navigation
- **Typography**: Inherit from globals (Instrument Serif display, Inter body, JetBrains Mono data)
- **Scrolling**: Within panel only (main page never scrolls — you navigate in 3D)

### Color Tinting

Each HUD panel picks up a subtle color cast from its nearest constellation node:
- Dashboard HUD: indigo tint in border glow
- Pipeline HUD: shifts per active stage (cyan → emerald → rose → indigo)
- Metrics HUD: health-driven (green if healthy, amber if degrading)
- Memory HUD: neutral white/silver (wisdom has no color)
- Approvals HUD: amber/red pulsing border

---

## Key Interactions & Spectacle Moments

### Task Submission (Dashboard)

1. User types in the Input Zone HUD
2. On submit: text dissolves into particle stream
3. Particles spiral into Nexus node (vortex effect)
4. Nexus flares (emissive intensity 0→3→1, scale 1→1.3→1)
5. Pulse radiates outward along all connections
6. Connected agents' nodes receive the pulse (staggered 200ms each)
7. Camera shakes subtly (displacement: 0.3px, 150ms)
8. Sound: deep resonant launch tone (150Hz fundamental + harmonics)

### Agent Processing

1. Receiving agent's node: scale up 20%, halo ring appears
2. Orbiting particles speed up 3x around the active node
3. When complete: photon particle emits toward next agent
4. Photon travels along the fiber connection (800ms travel time)
5. Source agent returns to idle (scale back, halo fades)
6. Sound: unique pitch per agent (Nexus=C, Architect=E, Engineer=G, Reviewer=Bb, Researcher=D, QA=F#)

### Review Decision

1. Reviewer node flickers between green and red (100ms alternation for 2s)
2. On PASS: green wash expands from Reviewer, all connections brighten
3. On FAIL: amber flash, photon reverses direction (travels backward to Engineer)
4. High-risk FAIL: constellation desaturates, only the path lights up red
5. Sound: PASS = major chord resolve. FAIL = minor second tension.

### Memory Formation

1. On task completion: bright particle emerges from Nexus
2. Particle shoots outward (high velocity, decelerating)
3. Particle dims as it slows (bright → dim over 2s)
4. Particle finds resting position in memory sphere (joins the crowd)
5. Memory sphere radius increases imperceptibly (but CountUp shows total growing)
6. Sound: crystalline ping, pitch based on category

### Approval Waiting

1. Pending approval → amber node below center pulses intensely
2. ALL other nodes desaturate to 30% brightness
3. Particle motion throughout system slows to 30% speed
4. Ambient sound shifts to single held note (tension)
5. On Approve: color floods back, motion resumes, amber → green flash
6. On Reject: amber → gray, new reverse-path highlights
7. Sound: resolution chord on approve, descending tone on reject

### Landing Page Entry

1. Screen is black for 500ms
2. Single point of light appears at center
3. 5 more points emerge, drifting to pentagon positions (1.5s)
4. Fiber connections draw between them (staggered, 200ms each)
5. Ambient particles fade in (the memory shell, initially sparse)
6. Title text fades in: "Syndicate" (Instrument Serif, 10vw)
7. Subtitle: "Compound intelligence that grows with you"
8. Camera is in slow auto-orbit
9. On "Enter the Swarm" click: camera accelerates INTO the constellation (zoom transition to Dashboard)

---

## Sound Design

### Ambient Layer
- Continuous generative drone: two oscillators in perfect fifth (C2 + G2)
- Filtered through low-pass, volume at 15%
- When system is ACTIVE (processing): add third oscillator (E3), widen stereo
- When IDLE: reduce to single oscillator, narrow stereo
- When APPROVAL PENDING: shift to tritone interval (C2 + F#2) — tension

### Event Sounds (Web Audio API synthesized)
| Event | Sound Character | Duration |
|-------|----------------|----------|
| Task submit | Sub-bass thud + rising sweep | 400ms |
| Agent activate | Soft pluck at agent's pitch | 200ms |
| Photon arrive | Gentle ping | 150ms |
| Review pass | Major triad arpeggio up | 500ms |
| Review fail | Minor second clash | 300ms |
| Memory form | Crystalline chime | 400ms |
| Approval resolve | Full chord (major=approve, dim=reject) | 600ms |
| Navigation | Whoosh (filtered noise sweep) | 300ms |

### Rules
- All sounds mutable via single toggle
- Volume at 20% default
- No sound until first user interaction (browser policy)
- Sounds are layered — multiple events playing simultaneously should harmonize (all tuned to C major/minor)

---

## Performance Strategy

### Target: 60fps on modern hardware, graceful 30fps fallback

| Technique | Purpose |
|-----------|---------|
| InstancedMesh for particles | One draw call for memory field (1000+ particles) |
| LOD detection | If FPS < 30 for 2s: halve particle count, disable bloom |
| `frameloop="demand"` | Scene only re-renders when state changes (not every frame when idle) |
| Offscreen culling | Nodes behind camera don't compute glow |
| Shared materials | All fiber connections share one ShaderMaterial |
| Texture atlas | Agent node textures in single atlas |
| Postprocessing budget | Bloom only (no DOF, no chromatic unless FPS > 50) |

### Asset Budget
- Total scene: < 50 draw calls
- Geometry: < 100k triangles
- Textures: < 4MB total
- JS bundle: Three.js chunk code-split (only loads on first route)

---

## Navigation Rail (replaces Sidebar)

Minimal vertical strip on the left edge (48px wide). Not a sidebar — a camera controller.

- 7 icon buttons (no labels unless hovered)
- Each button: circle with the destination's accent color
- Active destination: filled circle + subtle glow
- On hover: tooltip appears + constellation subtly orients toward that region
- On click: camera flies to destination, HUD transitions

Mobile: horizontal bottom strip, 5 most important destinations.

---

## Implementation Phases

### Phase 1: Scene Foundation (highest risk — do first)
- Persistent Canvas with 6 agent nodes
- Camera controller with spring transitions
- Route → camera position mapping
- Basic fiber connections (static)

### Phase 2: Data-Driven Reactivity
- Zustand store connected to Supabase Realtime
- Node status changes (idle/active) reflected in glow
- Task pulses (photon particles traveling connections)

### Phase 3: HUD Panels
- Dashboard HUD (task input + status)
- Pipeline HUD (stage view)
- Metrics HUD (KPIs)
- Memory HUD (timeline)
- Approvals HUD (decision cards)

### Phase 4: Spectacle Moments
- Task submission vortex effect
- Memory formation particle shoot
- Approval desaturation/restoration
- Review decision bicolor flicker

### Phase 5: Sound + Polish
- Ambient generative audio
- Event sound triggers
- Landing page assembly animation
- Performance profiling and LOD fallback

---

## Technical Stack

| Layer | Library | Purpose |
|-------|---------|---------|
| 3D Renderer | @react-three/fiber | React bindings for Three.js |
| 3D Utilities | @react-three/drei | Camera controls, instances, effects |
| Postprocessing | @react-three/postprocessing | Bloom, noise |
| Camera Animation | Custom spring (or drei's CameraControls) | Smooth transitions |
| State | Zustand | Shared between 3D scene and HUD |
| Realtime | @supabase/supabase-js | Postgres changes → store updates |
| Sound | Web Audio API (custom) | Generative synthesis |
| HUD Animation | motion (framer-motion) | Panel enter/exit |
| Routing | react-router-dom | Route ↔ camera position binding |

All already in `package.json` except `@react-three/postprocessing` (needs install).

---

## Success Criteria

1. A judge watching a 5-minute screen recording says "I've never seen a developer tool look like this"
2. Task submission → visual response is < 200ms perceived (immediate photon emission)
3. Navigation between "pages" feels like flying, not loading
4. The system's health/state is communicated entirely through visual atmosphere (you know if it's working without reading numbers)
5. Sound enhances but never annoys (mutable, subtle, harmonically consistent)
6. 60fps on M1 MacBook, 30fps graceful on older hardware
