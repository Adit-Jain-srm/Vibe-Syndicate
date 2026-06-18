import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { Component, type ReactNode } from 'react';
import AgentNodes from './AgentNodes';
import ConnectionFibers from './ConnectionFibers';
import TaskPulses from './TaskPulses';
import MemoryField from './MemoryField';
import AmbientDust from './AmbientDust';
import SystemAtmosphere from './SystemAtmosphere';
import SceneController from './SceneController';

class WebGLErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-0 bg-[#050507]">
          <div className="absolute inset-0 bg-gradient-radial from-[#6366f108] to-transparent" />
        </div>
      );
    }
    return this.props.children;
  }
}

export default function ConstellationScene() {
  return (
    <WebGLErrorBoundary>
      <div className="fixed inset-0 z-0 pointer-events-none">
        <Canvas
          camera={{ fov: 50, near: 0.1, far: 100, position: [0, 3, 18] }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          dpr={[1, 2]}
          style={{ pointerEvents: 'none' }}
          onCreated={({ gl }) => {
            gl.setClearColor('#050507', 1);
          }}
        >
          <color attach="background" args={['#050507']} />
          <fog attach="fog" args={['#050507', 18, 40]} />

          <SceneController />

          <AgentNodes />
          <ConnectionFibers />
          <TaskPulses />
          <MemoryField />
          <AmbientDust />
          <SystemAtmosphere />

          <EffectComposer>
            <Bloom
              intensity={1.4}
              luminanceThreshold={0.15}
              luminanceSmoothing={0.9}
              mipmapBlur
            />
          </EffectComposer>
        </Canvas>
      </div>
    </WebGLErrorBoundary>
  );
}
