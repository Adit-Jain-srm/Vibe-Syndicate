import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float } from '@react-three/drei';
import * as THREE from 'three';

interface OrbProps {
  color: string;
  speed?: number;
  distort?: number;
  size?: number;
}

function AnimatedOrb({ color, speed = 1, distort = 0.4, size = 1 }: OrbProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(clock.elapsedTime * speed * 0.3) * 0.2;
      meshRef.current.rotation.y = clock.elapsedTime * speed * 0.2;
    }
  });

  return (
    <Float speed={speed * 2} rotationIntensity={0.3} floatIntensity={0.5}>
      <Sphere ref={meshRef} args={[size, 64, 64]}>
        <MeshDistortMaterial
          color={color}
          roughness={0.1}
          metalness={0.8}
          distort={distort}
          speed={speed * 2}
        />
      </Sphere>
    </Float>
  );
}

export default function AgentOrb({ color, speed, distort, size }: OrbProps) {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <ambientLight intensity={0.3} />
        <pointLight position={[5, 5, 5]} intensity={1} color={color} />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#6366f1" />
        <AnimatedOrb color={color} speed={speed} distort={distort} size={size} />
      </Canvas>
    </div>
  );
}
