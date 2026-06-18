import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useConstellationStore } from '../../stores/constellation';

const MAX_PARTICLES = 200;
const SHELL_RADIUS_MIN = 11;
const SHELL_RADIUS_MAX = 15;

export default function MemoryField() {
  const memoryCount = useConstellationStore(s => s.memoryCount);
  const pointsRef = useRef<THREE.Points>(null);
  const particleCount = useRef(0);
  const birthTimes = useRef<Float32Array>(new Float32Array(MAX_PARTICLES));

  const [positions, colors, sizes] = useMemo(() => {
    const pos = new Float32Array(MAX_PARTICLES * 3);
    const col = new Float32Array(MAX_PARTICLES * 3);
    const sz = new Float32Array(MAX_PARTICLES);

    for (let i = 0; i < MAX_PARTICLES; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = 0;
      pos[i * 3 + 2] = 0;
      col[i * 3] = 0.6;
      col[i * 3 + 1] = 0.6;
      col[i * 3 + 2] = 0.8;
      sz[i] = 0;
    }

    return [pos, col, sz];
  }, []);

  useEffect(() => {
    if (memoryCount > particleCount.current && particleCount.current < MAX_PARTICLES) {
      const idx = particleCount.current;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = SHELL_RADIUS_MIN + Math.random() * (SHELL_RADIUS_MAX - SHELL_RADIUS_MIN);

      positions[idx * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[idx * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[idx * 3 + 2] = r * Math.cos(phi);

      const hue = 0.6 + Math.random() * 0.2;
      const color = new THREE.Color().setHSL(hue, 0.4, 0.7);
      colors[idx * 3] = color.r;
      colors[idx * 3 + 1] = color.g;
      colors[idx * 3 + 2] = color.b;

      birthTimes.current[idx] = performance.now();
      particleCount.current = idx + 1;

      if (pointsRef.current) {
        const geo = pointsRef.current.geometry;
        geo.attributes.position.needsUpdate = true;
        geo.attributes.color.needsUpdate = true;
        geo.attributes.size.needsUpdate = true;
      }
    }
  }, [memoryCount, positions, colors]);

  useFrame(() => {
    if (!pointsRef.current) return;
    const now = performance.now();

    for (let i = 0; i < particleCount.current; i++) {
      const age = now - birthTimes.current[i];
      const fadeIn = Math.min(age / 2000, 1);
      sizes[i] = fadeIn * (0.04 + Math.sin(now * 0.001 + i) * 0.01);
    }

    pointsRef.current.geometry.attributes.size.needsUpdate = true;
    pointsRef.current.rotation.y += 0.0001;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={MAX_PARTICLES} itemSize={3} />
        <bufferAttribute attach="attributes-color" array={colors} count={MAX_PARTICLES} itemSize={3} />
        <bufferAttribute attach="attributes-size" array={sizes} count={MAX_PARTICLES} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        size={0.04}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
