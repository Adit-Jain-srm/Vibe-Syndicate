import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import BrainParticles from './BrainParticles';

export default function ConstellationScene() {
  return (
    <div className="fixed inset-0" style={{ zIndex: -1 }}>
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 100, position: [0, 0, 2.0] }}
        gl={{ antialias: window.devicePixelRatio === 1, alpha: true }}
        dpr={[1, 1.5]}
        style={{ background: '#000000', pointerEvents: 'none' }}
      >
        <Suspense fallback={null}>
          <BrainParticles />
        </Suspense>
      </Canvas>
    </div>
  );
}
