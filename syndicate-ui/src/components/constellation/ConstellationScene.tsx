import { Canvas } from '@react-three/fiber';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import AgentNodes from './AgentNodes';
import ConnectionFibers from './ConnectionFibers';
import TaskPulses from './TaskPulses';
import MemoryField from './MemoryField';
import AmbientDust from './AmbientDust';
import SystemAtmosphere from './SystemAtmosphere';
import SceneController from './SceneController';

export default function ConstellationScene() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ fov: 50, near: 0.1, far: 100, position: [0, 3, 18] }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, 2]}
      >
        <color attach="background" args={['#050507']} />
        <fog attach="fog" args={['#050507', 18, 40]} />

        <SceneController />

        {/* The living constellation */}
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
  );
}
