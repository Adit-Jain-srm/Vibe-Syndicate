import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useConstellationStore } from '../../stores/constellation';

const CONNECTIONS: [string, string][] = [
  ['nexus', 'architect'],
  ['nexus', 'engineer'],
  ['nexus', 'reviewer'],
  ['nexus', 'researcher'],
  ['nexus', 'qa'],
  ['architect', 'engineer'],
  ['engineer', 'reviewer'],
  ['reviewer', 'engineer'],
];

function FiberConnection({ from, to, agents }: {
  from: string;
  to: string;
  agents: { role: string; position: [number, number, number]; color: string; status: string }[];
}) {
  const lineRef = useRef<THREE.Line>(null);
  const fromAgent = agents.find(a => a.role === from);
  const toAgent = agents.find(a => a.role === to);

  const curve = useMemo(() => {
    if (!fromAgent || !toAgent) return null;
    const start = new THREE.Vector3(...fromAgent.position);
    const end = new THREE.Vector3(...toAgent.position);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    mid.y += 0.5;
    return new THREE.QuadraticBezierCurve3(start, mid, end);
  }, [fromAgent, toAgent]);

  const geometry = useMemo(() => {
    if (!curve) return null;
    const points = curve.getPoints(32);
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [curve]);

  useFrame(() => {
    if (!lineRef.current) return;
    const mat = lineRef.current.material as THREE.LineBasicMaterial;
    const bothActive = fromAgent?.status === 'active' || toAgent?.status === 'active';
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, bothActive ? 0.6 : 0.15, 0.05);
  });

  if (!geometry || !fromAgent) return null;

  return (
    <line ref={lineRef as React.RefObject<THREE.Line>} geometry={geometry}>
      <lineBasicMaterial color={fromAgent.color} transparent opacity={0.15} linewidth={1} />
    </line>
  );
}

export default function ConnectionFibers() {
  const agents = useConstellationStore(s => s.agents);

  return (
    <group>
      {CONNECTIONS.map(([from, to]) => (
        <FiberConnection key={`${from}-${to}`} from={from} to={to} agents={agents} />
      ))}
    </group>
  );
}
