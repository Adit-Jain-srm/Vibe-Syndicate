import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import BrainParticles from './BrainParticles';

export default function ConstellationScene() {
  return (
    <div className="fixed inset-0 z-0">
      <Canvas
        camera={{ fov: 75, near: 0.1, far: 100, position: [0, 0, 1.2] }}
        gl={{ antialias: window.devicePixelRatio === 1, alpha: true }}
        dpr={[1, 1.5]}
        style={{ background: '#000000' }}
      >
        <Suspense fallback={null}>
          <BrainParticles />
        </Suspense>
      </Canvas>
    </div>
  );
}
