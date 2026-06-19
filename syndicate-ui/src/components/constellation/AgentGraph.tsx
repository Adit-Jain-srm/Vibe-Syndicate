import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sphere, Line } from '@react-three/drei';
import { Suspense } from 'react';
import * as THREE from 'three';

const NODES = [
  { id: 'nexus', position: [0, 0, 0] as [number, number, number], color: '#6366f1', size: 0.15 },
  { id: 'architect', position: [-1.5, 0.8, 0.5] as [number, number, number], color: '#06b6d4', size: 0.1 },
  { id: 'engineer', position: [1.5, 0.5, 0.8] as [number, number, number], color: '#34d399', size: 0.1 },
  { id: 'reviewer', position: [-1, -1, -0.5] as [number, number, number], color: '#fb7185', size: 0.1 },
  { id: 'researcher', position: [1.2, -0.8, -0.6] as [number, number, number], color: '#fbbf24', size: 0.1 },
  { id: 'qa', position: [0, -1.2, 1] as [number, number, number], color: '#8b5cf6', size: 0.1 },
];

const EDGES: [number, number][] = [
  [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
  [1, 2], [2, 3], [3, 4],
];

function NetworkGraph() {
  return (
    <group>
      {/* Edges */}
      {EDGES.map(([from, to], i) => (
        <Line
          key={i}
          points={[NODES[from].position, NODES[to].position]}
          color="#6366f1"
          lineWidth={0.5}
          transparent
          opacity={0.2}
        />
      ))}

      {/* Nodes */}
      {NODES.map((node) => (
        <Sphere key={node.id} args={[node.size, 16, 16]} position={node.position}>
          <meshBasicMaterial color={node.color} transparent opacity={0.8} />
        </Sphere>
      ))}
    </group>
  );
}

export default function AgentGraph() {
  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -1 }}>
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }} style={{ background: 'transparent' }}>
        <Suspense fallback={null}>
          <NetworkGraph />
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.3}
            enableDamping
          />
        </Suspense>
      </Canvas>
    </div>
  );
}
