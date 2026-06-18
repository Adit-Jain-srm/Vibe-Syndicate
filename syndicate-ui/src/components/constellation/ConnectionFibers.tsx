import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line } from '@react-three/drei';
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
  const fromAgent = agents.find(a => a.role === from);
  const toAgent = agents.find(a => a.role === to);
  const opacityRef = useRef(0.15);

  const points = useMemo(() => {
    if (!fromAgent || !toAgent) return [];
    const start = new THREE.Vector3(...fromAgent.position);
    const end = new THREE.Vector3(...toAgent.position);
    const mid = start.clone().add(end).multiplyScalar(0.5);
    mid.y += 0.5;
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(24);
  }, [fromAgent, toAgent]);

  useFrame((_, delta) => {
    const bothActive = fromAgent?.status === 'active' || toAgent?.status === 'active';
    const target = bothActive ? 0.6 : 0.15;
    opacityRef.current += (target - opacityRef.current) * delta * 3;
  });

  if (points.length === 0 || !fromAgent) return null;

  return (
    <Line
      points={points}
      color={fromAgent.color}
      lineWidth={1}
      transparent
      opacity={opacityRef.current}
    />
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
