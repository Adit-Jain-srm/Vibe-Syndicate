---
name: Dala-Style 3D Rewrite
overview: "Complete ground-up rewrite of the 3D constellation system, replacing the current fluid-blob approach with a Dala-inspired particle cosmos: thousands of tiny wireframe geometric shapes positioned on agent-network geometry, reacting to cursor proximity with rotation/scale, using custom GLSL shaders, violet pulse accent on pure black void."
todos:
  - id: delete-old
    content: Delete all current constellation components except NavigationRail
    status: completed
  - id: install-dep
    content: Install three-instanced-uniforms-mesh
    status: completed
  - id: network-geometry
    content: Build NetworkGeometry.ts - procedural point generation (8000 particles distributed across agent nodes + connections)
    status: cancelled
  - id: shaders
    content: Write GLSL vertex/fragment shaders adapted from Dala (cursor-reactive rotation + scale + per-instance color)
    status: completed
  - id: particle-brain
    content: Build ParticleBrain.tsx - InstancedUniformsMesh with shader, point distribution, wireframe cubes
    status: completed
  - id: cursor-reactor
    content: Build CursorReactor.tsx - Raycaster + GSAP pointer tracking + camera parallax
    status: completed
  - id: scene-camera
    content: Build SceneCamera.tsx - GSAP route transitions (replacing spring physics)
    status: completed
  - id: scene-wrapper
    content: Rewrite ConstellationScene.tsx - new canvas with bloom on pure black
    status: completed
  - id: landing-rewrite
    content: Rewrite Landing.tsx - Dala-style loading counter + particle assembly animation
    status: completed
  - id: color-update
    content: Update globals.css + HUD panels to violet palette (#963CBD primary)
    status: completed
  - id: verify
    content: TypeScript check + Vite build + push
    status: completed
isProject: false
---

# Dala-Style 3D Rewrite - Particle Cosmos on Void

## Design Read

Reading this as: AI developer platform dashboard for hackathon judges, with a Dala-cosmic-void language, leaning toward custom GLSL shaders + InstancedMesh + cursor reactivity on pure black.

Dials: `DESIGN_VARIANCE: 9 / MOTION_INTENSITY: 8 / VISUAL_DENSITY: 3`

## What Gets Deleted (current system)

All files in `syndicate-ui/src/components/constellation/`:
- `AgentNodes.tsx` (fluid blob shader - replaced)
- `ConnectionFibers.tsx` (drei Line - replaced)
- `TaskPulses.tsx` (imperative mesh creation - replaced)
- `MemoryField.tsx` (point particles - replaced)
- `AmbientDust.tsx` (background particles - replaced)
- `SystemAtmosphere.tsx` (health lighting - merged into new system)
- `SceneController.tsx` (spring camera - kept but rewritten)
- `ConstellationScene.tsx` (canvas wrapper - rewritten)

## What Gets Built (Dala pattern adapted for Syndicate)

### Core Technique (from Dala source)

Dala's approach:
1. Load a **3D model** (brain.glb) 
2. Extract vertex positions from the model geometry
3. Place thousands of **tiny wireframe cubes** (BoxGeometry 0.004) at each vertex using `InstancedUniformsMesh`
4. Custom GLSL shader: each cube rotates/scales based on distance to cursor (raycasted onto the mesh)
5. On hover: cubes near the pointer inflate and spin. On leave: they settle back.

**Syndicate adaptation:**
- Use the SAME brain.glb model as Dala (available from the threejs-dala repo, MIT licensed)
- Same `InstancedUniformsMesh` technique - thousands of tiny wireframe cubes on every vertex of the brain mesh
- Same cursor-reactive rotation/scale GLSL shader (proximity-based smoothstep)
- Same GSAP-driven pointer tracking and camera parallax
- Color: Dala's exact palette - violet (#963CBD), coral (#FF6F61), magenta (#C5299B), gold (#FEAE51) randomly assigned per instance
- The brain IS the swarm. It represents collective intelligence. No separate "agent nodes" - the entire brain pulses and reacts as one organism.
- Additional Syndicate-specific: when an agent is `active` (from Supabase Realtime), a radial pulse wave expands from a random point on the brain surface, making nearby cubes flare larger momentarily
- Camera position: `z: 1.2` (desktop), `z: 2.3` (mobile) - exactly Dala's values
- Background: pure `#000000`, no fog, no ambient light, no postprocessing bloom (Dala doesn't use it - the wireframe cubes glow purely through color contrast against void)

### Architecture

```
ConstellationScene.tsx (Canvas wrapper - pure black, no postprocessing)
  BrainParticles.tsx (loads brain.glb, InstancedUniformsMesh, GLSL morph shader)
  CursorReactor.tsx (Raycaster + GSAP pointer/camera tweens)
  SceneCamera.tsx (route-driven + scroll-driven camera via GSAP)

Landing.tsx (scrollytelling page)
  ScrollSections.tsx (pinned text sections that fade in/out with scroll progress)
  ScrollController.tsx (GSAP ScrollTrigger binding scroll to uProgress + camera + text)

App.tsx
  ConstellationScene (persistent, shifts position based on route)
  NavigationRail (only visible on dashboard routes)
  HUD panels (only visible on dashboard routes)
```

Two modes for the brain:
- **Landing mode** (route `/`): brain is centered, full-size, scroll-morphing, text fades around it
- **Dashboard mode** (routes `/app`, `/pipeline`, etc.): brain shrinks and drifts to top-left corner, HUD panels take over

### Shader Pipeline (adapted from Dala's GLSL + morph technique)

**Vertex shader:**
- Receives per-instance uniforms: `uColor`, `uRotation`, `uSize`, `uPointer`, `uHover`
- Receives GLOBAL uniforms: `uProgress` (scroll-driven morph 0-1), `uPulse` (agent activity)
- TWO position attributes: `position` (brain vertices) + custom attribute `aScattered` (random scattered positions)
- Core morph: `vec3 pos = mix(brainPosition, scatteredPosition, uProgress)`
- Then applies Dala's proximity rotation/scale on top of the morphed position
- `smoothstep(0.45, 0.1, distance(uPointer, pos))` drives per-cube inflation

**Fragment shader:**
- Outputs `vColor` (per-instance, randomly assigned from Dala's 4-color palette)
- Pure flat color, wireframe: true on the material provides the geometric edge look
- No lighting calculations, no alpha - just solid color wireframe against void

**Key uniforms driven by scroll (via GSAP ScrollTrigger):**
- `uProgress`: 0 = brain formed, 1 = particles scattered (section 30-45%)
- Camera z-position: 1.2 (close) to 2.5 (pulled back) based on section
- Camera rotation: slight y-rotation in section 60-75%

### Particle Distribution (brain.glb vertices)

Exact Dala approach:
- Load `brain.glb` via GLTFLoader
- Extract `geometry.attributes.position.array` from the mesh
- For each vertex (position[i], position[i+1], position[i+2]):
  - Create an instance of a tiny wireframe cube (BoxGeometry 0.004)
  - Set per-instance uniforms: random color from palette, random rotation, random size (0.3-3.0)
- Total particle count = brain model vertex count (typically 3000-8000 depending on model)
- Brain mesh itself is NOT added to scene (invisible - only used for raycasting)

### Loading Sequence (Dala-style)

1. Black screen, nothing visible
2. Counter animates 0 to 100 (Dala's "LOADING... Completed 0" pattern)
3. At 100%: particles fly IN from random positions to their target network positions (1.5s GSAP tween per particle, staggered)
4. Network assembles - the shape becomes clear
5. Text fades in: "Syndicate" then "Compound intelligence that grows with you"
6. Camera settles into default position

### Cursor Reactivity

- Raycaster projects mouse onto an invisible mesh (sphere encompassing the network)
- Intersection point passed as `uPointer` uniform to all instances
- Cubes within 0.3 units of pointer: scale 8x, rotate based on `uRotation`
- GSAP tween for smooth pointer tracking (duration: 0.3s)
- Camera parallax: slight X/Y offset following mouse (GSAP, 0.5s duration)
- On mouseenter (hover over brain area): `uHover` animates 0 to 1 (all cubes slightly enliven)
- On mouseleave: `uHover` animates back to 0 (cubes settle to dormant state)

### Scroll Behavior (Full Page - the KEY differentiator from just a 3D hero)

Dala uses the particle brain as a **perpetual storytelling device** that morphs into different visual metaphors as user scrolls. From [Unseen Studio](https://unseen.co/projects/dala/): "We use these fragments as a perpetual storytelling device, morphing them to form different visual metaphors as the user navigates down the page."

**Implementation: Scroll-driven particle morphing via GSAP ScrollTrigger**

The page is NOT a traditional scroll page. It is a single pinned WebGL canvas with text sections that fade in/out as the scroll progresses. The 3D brain stays in view the entire time but TRANSFORMS:

| Scroll % | Brain State | Text Section | Technique |
|----------|-------------|--------------|-----------|
| 0-15% | Particles scattered (loading state, then assemble into brain) | "Syndicate / Compound intelligence" | GSAP stagger, particles lerp to target positions |
| 15-30% | Brain fully formed, idle breathing, cursor-reactive | "What shall we build?" (task input) | `uHover` responsive, camera at z:1.2 |
| 30-45% | Brain FRAGMENTS outward (cubes spread into a chaotic cloud) | "Fragmented tools..." problem statement | `uProgress` uniform 0 to 1 drives position lerp AWAY from brain |
| 45-60% | Fragments REASSEMBLE into brain (reverse of above) | "Syndicate connects them..." solution | `uProgress` 1 back to 0 |
| 60-75% | Brain rotates to show different angle, cubes pulse in sequence | "Watch agents think in real-time" | Camera rotation via GSAP, `uPulse` waves |
| 75-90% | Brain scales down, moves to corner, text takes over | Metrics / Memory / Evidence section | `camera.position.z` animates to 2.5, brain shifts left |
| 90-100% | Brain at rest, small, in a corner with CTA | "Enter the Swarm" final CTA | Static, cursor-reactive only |

**Technical approach for morphing:**
- Store TWO position sets as attributes: `position` (brain vertices) and `aPositionTarget` (scattered random positions)
- Uniform `uProgress` (0 to 1) drives `mix(position, aPositionTarget, uProgress)` in vertex shader
- GSAP ScrollTrigger scrubs `uProgress` based on scroll position
- This is the [standard particles morphing shader technique](https://threejs-journey.com/lessons/particles-morphing-shader)

**GSAP ScrollTrigger setup:**
```
ScrollTrigger.create({
  trigger: scrollContainer,
  start: "top top",
  end: "+=500%",  // 5x viewport height of scroll distance
  pin: canvasWrapper,  // brain stays in view
  scrub: 1.1,  // smooth scrub
  onUpdate: (self) => {
    // Update uniforms based on self.progress (0 to 1)
    material.uniforms.uProgress.value = progressCurve(self.progress)
  }
})
```

**Text sections (DOM overlays):**
- Each text section is position:absolute, fades in/out based on scroll progress
- Uses GSAP's `fromTo` with ScrollTrigger for per-section opacity + y-translate
- Text is sparse: large headline (tracking-[-0.06em]) + short body (max 20 words) per section
- Dala style: text appears LEFT or RIGHT of the brain, never centered over it

### Hover Effects (Non-3D elements)

Beyond the brain cursor reactivity, the page has hover states on:
- **Navigation links**: text color fades from white/50 to white/100, slight y-translate (-2px)
- **CTA buttons (pill shape)**: background shifts from transparent to `rgba(255,255,255,0.06)`, border brightens
- **Team cards** (if used): scale 1.02 + subtle border glow on hover
- **All transitions**: 0.3s cubic-bezier(0.16, 1, 0.3, 1) - Dala uses this exact easing everywhere

### Page Structure (scrollytelling, NOT traditional pages)

The current multi-route architecture (separate /app, /pipeline, /metrics pages) CONFLICTS with the Dala scroll approach. Two options:

**Option chosen: Hybrid**
- Landing route (`/`) = full Dala scrollytelling experience (brain morphs through sections)
- Dashboard routes (`/app`, `/pipeline`, etc.) = brain stays in corner, HUD panels overlay
- Transition from landing to dashboard = brain animates from center to top-left corner via GSAP

This means the Landing page becomes a LONG scrollytelling page with pinned WebGL, and the dashboard pages keep the brain as a small ambient element.

### Data-Driven Pulses (Syndicate addition on top of Dala)

When an agent becomes `active` (from Zustand store):
- Pick a random vertex on the brain surface as the pulse origin
- Animate `uHover` uniform for instances near that point (same smoothstep as cursor, but time-driven)
- Effect: a brief "thought flash" - cubes near the pulse point flare and rotate, then settle
- Multiple agents active = multiple concurrent pulse points
- This is the ONLY difference from pure Dala - everything else is identical to the reference

### Color Palette

- Background: pure `#000000` (not off-black)
- Primary accent: `#963CBD` (Dala's violet)
- Secondary accents per agent: violet, coral (#FF6F61), magenta (#C5299B), gold (#FEAE51)
- Text: `#ffffff` (pure white, glows against void)
- UI elements: hairline borders `rgba(255,255,255,0.08)`, pill shapes

### Typography Changes

- Headlines: stretched tight tracking (`tracking-[-0.06em]`, weight 200-300)
- Body: slightly open (`tracking-[0.01em]`)
- Font stays Instrument Serif for display (matches Dala's editorial void feel)

## Key Dependencies

- `three-instanced-uniforms-mesh` - Dala's exact library for per-instance shader uniforms on InstancedMesh. Install: `npm install three-instanced-uniforms-mesh`
- `brain.glb` - Download from https://github.com/kekkorider/threejs-dala/raw/main/src/brain.glb and place in `syndicate-ui/public/`
- `gsap` - already installed (used for pointer tweens and camera, NOT for the particle animation itself)

## Files to Create

| File | Purpose |
|------|---------|
| `constellation/BrainParticles.tsx` | Core: loads brain.glb, InstancedUniformsMesh, morph shader, scroll-driven uProgress |
| `constellation/CursorReactor.tsx` | Raycaster on invisible brain + GSAP pointer + camera parallax |
| `constellation/SceneCamera.tsx` | GSAP camera (scroll-driven on landing, route-driven on dashboard) |
| `constellation/ConstellationScene.tsx` | Minimal canvas, pure #000, alpha:true, no postprocessing |
| `constellation/shaders/brain.vert.ts` | Vertex shader: morph + proximity rotation/scale (TS string export) |
| `constellation/shaders/brain.frag.ts` | Fragment shader: flat vColor output (TS string export) |
| `constellation/ScrollController.tsx` | GSAP ScrollTrigger binding: scrubs uProgress, camera, text sections |
| `pages/Landing.tsx` | Full scrollytelling page: loading counter + pinned brain + 6 text sections |
| `components/hud/ScrollSections.tsx` | The DOM text overlays that fade in/out per scroll progress |
| `public/brain.glb` | 3D brain model (MIT, from kekkorider/threejs-dala) |

## Files to Delete

All current `constellation/*.tsx` files except `NavigationRail.tsx` (keep nav).

## Integration Points

- `stores/constellation.ts` stays (Zustand store drives pulse state)
- `App.tsx` stays (same persistent canvas architecture)
- `NavigationRail.tsx` stays (but update colors to violet palette)
- HUD panels stay (DashboardHUD, MetricsHUD, ApprovalsHUD - update accent to violet)
