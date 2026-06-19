import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import { Suspense, useRef, useMemo } from 'react';
import * as THREE from 'three';
import { useConstellationStore } from '../../stores/constellation';

const NODES = [
  { id: 'nexus', position: [0, 0, 0] as [number, number, number], color: '#6366f1', size: 0.18 },
  { id: 'architect', position: [-1.8, 0.9, 0.6] as [number, number, number], color: '#06b6d4', size: 0.1 },
  { id: 'engineer', position: [1.6, 0.6, 0.9] as [number, number, number], color: '#10b981', size: 0.1 },
  { id: 'reviewer', position: [-1.2, -1.1, -0.6] as [number, number, number], color: '#f43f5e', size: 0.1 },
  { id: 'researcher', position: [1.4, -0.9, -0.7] as [number, number, number], color: '#f59e0b', size: 0.1 },
  { id: 'qa', position: [0.1, -1.4, 1.1] as [number, number, number], color: '#8b5cf6', size: 0.1 },
];

const EDGES: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
  [1, 2], [2, 3], [4, 5],
];

function AgentNode({ node, isActive }: { node: typeof NODES[0]; isActive: boolean }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const color = useMemo(() => new THREE.Color(node.color), [node.color]);

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();

    if (isActive) {
      const pulse = 1 + Math.sin(t * 3.5) * 0.2;
      meshRef.current.scale.setScalar(pulse);
      if (glowRef.current) {
        glowRef.current.scale.setScalar(pulse * 2.5);
        (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.08 + Math.sin(t * 2) * 0.04;
      }
    } else {
      meshRef.current.scale.setScalar(1);
      if (glowRef.current) {
        glowRef.current.scale.setScalar(2);
        (glowRef.current.material as THREE.MeshBasicMaterial).opacity = 0.03;
      }
    }
  });

  return (
    <group position={node.position}>
      {/* Outer glow sphere */}
      <Sphere ref={glowRef} args={[node.size * 2, 16, 16]}>
        <meshBasicMaterial color={color} transparent opacity={0.04} depthWrite={false} />
      </Sphere>
      {/* Core sphere */}
      <Sphere ref={meshRef} args={[node.size, 24, 24]}>
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isActive ? 0.6 : 0.2}
          roughness={0.3}
          metalness={0.1}
          transparent
          opacity={isActive ? 1 : 0.5}
        />
      </Sphere>
    </group>
  );
}

function ConnectionLine({ from, to, color }: { from: [number, number, number]; to: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Line>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const mat = ref.current.material as THREE.LineBasicMaterial;
    mat.opacity = 0.08 + Math.sin(clock.getElapsedTime() * 0.5) * 0.04;
  });

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setFromPoints([new THREE.Vector3(...from), new THREE.Vector3(...to)]);
    return g;
  }, [from, to]);

  return (
    <line ref={ref as React.RefObject<THREE.Line>} geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.1} />
    </line>
  );
}

function NetworkGraph() {
  const agents = useConstellationStore(s => s.agents);

  const activeSet = useMemo(() => {
    const set = new Set<string>();
    agents.forEach(a => { if (a.status === 'active') set.add(a.role); });
    return set;
  }, [agents]);

  return (
    <group>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={0.5} color="#10b981" />
      <pointLight position={[-5, -3, 3]} intensity={0.3} color="#6366f1" />

      {/* Ambient dust particles */}
      <AmbientDust />

      {EDGES.map(([from, to], i) => (
        <ConnectionLine
          key={i}
          from={NODES[from].position}
          to={NODES[to].position}
          color={NODES[from].color}
        />
      ))}

      {NODES.map((node) => (
        <AgentNode
          key={node.id}
          node={node}
          isActive={activeSet.has(node.id)}
        />
      ))}
    </group>
  );
}

function AmbientDust() {
  const count = 60;
  const ref = useRef<THREE.Points>(null);

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 6;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    return pos;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * 0.1;
    ref.current.rotation.y = t;
    ref.current.rotation.x = Math.sin(t * 0.5) * 0.1;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.015} color="#10b981" transparent opacity={0.3} sizeAttenuation />
    </points>
  );
}

export default function AgentGraph() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -1 }}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        style={{ background: 'transparent' }}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <NetworkGraph />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.2}
            enableDamping
            dampingFactor={0.05}
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
