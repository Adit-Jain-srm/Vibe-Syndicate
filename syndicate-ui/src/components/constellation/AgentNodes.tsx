import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useConstellationStore } from '../../stores/constellation';

function AgentNode({ role, position, color, status }: {
  role: string;
  position: [number, number, number];
  color: string;
  status: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const baseScale = role === 'nexus' ? 0.45 : 0.3;

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    const isActive = status === 'active';
    const targetScale = isActive ? baseScale * 1.2 : baseScale;
    const currentScale = meshRef.current.scale.x;
    const newScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * 4);
    meshRef.current.scale.setScalar(newScale);

    const mat = meshRef.current.material as THREE.MeshStandardMaterial;
    if (mat.emissiveIntensity !== undefined) {
      const targetEmissive = isActive ? 2.5 : 0.8;
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetEmissive, delta * 3);
    }

    if (glowRef.current) {
      const pulseSpeed = isActive ? 3 : 1.2;
      const pulse = Math.sin(performance.now() * 0.001 * pulseSpeed) * 0.1 + 1;
      glowRef.current.scale.setScalar(baseScale * 2.5 * pulse);
      const gMat = glowRef.current.material as THREE.MeshBasicMaterial;
      gMat.opacity = isActive ? 0.15 : 0.06;
    }
  });

  const colorObj = useMemo(() => new THREE.Color(color), [color]);

  return (
    <group position={position}>
      {/* Outer glow sphere */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.06} depthWrite={false} />
      </mesh>

      {/* Main node */}
      <Sphere ref={meshRef} args={[1, 32, 32]} scale={baseScale}>
        <MeshDistortMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          roughness={0.2}
          metalness={0.8}
          distort={status === 'active' ? 0.3 : 0.1}
          speed={status === 'active' ? 4 : 1.5}
        />
      </Sphere>

      {/* Point light from node */}
      <pointLight color={colorObj} intensity={status === 'active' ? 2 : 0.5} distance={6} decay={2} />
    </group>
  );
}

export default function AgentNodes() {
  const agents = useConstellationStore(s => s.agents);

  return (
    <group>
      {agents.map(agent => (
        <AgentNode
          key={agent.role}
          role={agent.role}
          position={agent.position}
          color={agent.color}
          status={agent.status}
        />
      ))}
    </group>
  );
}
