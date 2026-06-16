import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial, Float, Environment } from '@react-three/drei';
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
      meshRef.current.rotation.x = Math.sin(clock.elapsedTime * speed * 0.3) * 0.3;
      meshRef.current.rotation.y = clock.elapsedTime * speed * 0.15;
    }
  });

  return (
    <Float speed={speed * 1.5} rotationIntensity={0.4} floatIntensity={0.8}>
      <Sphere ref={meshRef} args={[size, 128, 128]}>
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.4}
          roughness={0.05}
          metalness={0.95}
          distort={distort}
          speed={speed * 3}
          envMapIntensity={1.5}
        />
      </Sphere>
    </Float>
  );
}

export default function AgentOrb({ color, speed, distort, size }: OrbProps) {
  return (
    <div className="w-full h-full">
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }} gl={{ antialias: true, alpha: true }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[3, 3, 5]} intensity={2} color={color} />
        <pointLight position={[-3, -2, 3]} intensity={1.5} color="#818cf8" />
        <spotLight position={[0, 5, 5]} angle={0.5} penumbra={1} intensity={2} color="#ffffff" />
        <Environment preset="night" />
        <AnimatedOrb color={color} speed={speed} distort={distort} size={size} />
      </Canvas>
    </div>
  );
}
