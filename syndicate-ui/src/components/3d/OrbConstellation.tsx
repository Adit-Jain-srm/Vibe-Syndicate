import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, Environment } from '@react-three/drei';
import * as THREE from 'three';

const AGENTS = [
  { color: '#6b62f2', offset: 0 },
  { color: '#06b6d4', offset: 1.05 },
  { color: '#34d399', offset: 2.1 },
  { color: '#fb7185', offset: 3.14 },
  { color: '#fbbf24', offset: 4.19 },
  { color: '#8b5cf6', offset: 5.24 },
];

function OrbitingOrb({ color, offset }: { color: string; offset: number }) {
  const ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.elapsedTime * 0.3 + offset;
      ref.current.position.x = Math.cos(t) * 3;
      ref.current.position.z = Math.sin(t) * 3;
      ref.current.position.y = Math.sin(t * 2) * 0.5;
    }
  });

  return (
    <group ref={ref}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.3}>
        <Sphere args={[0.25, 32, 32]}>
          <MeshDistortMaterial
            color={color}
            emissive={color}
            emissiveIntensity={0.6}
            roughness={0.1}
            metalness={0.9}
            distort={0.3}
            speed={4}
          />
        </Sphere>
      </Float>
      <pointLight color={color} intensity={0.8} distance={3} />
    </group>
  );
}

function CentralNexus() {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.1;
      ref.current.rotation.x = Math.sin(clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <Float speed={1} floatIntensity={0.3}>
      <Sphere ref={ref} args={[0.8, 64, 64]}>
        <MeshDistortMaterial
          color="#6b62f2"
          emissive="#6b62f2"
          emissiveIntensity={0.5}
          roughness={0.05}
          metalness={0.95}
          distort={0.4}
          speed={2}
        />
      </Sphere>
    </Float>
  );
}

export default function OrbConstellation() {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 2, 8], fov: 50 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[0, 0, 0]} intensity={2} color="#6b62f2" />
        <Environment preset="night" />

        <CentralNexus />
        {AGENTS.map((agent, i) => (
          <OrbitingOrb key={i} color={agent.color} offset={agent.offset} />
        ))}
      </Canvas>
    </div>
  );
}
