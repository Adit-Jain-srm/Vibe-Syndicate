import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useConstellationStore } from '../../stores/constellation';

export default function SystemAtmosphere() {
  const systemHealth = useConstellationStore(s => s.systemHealth);
  const lightRef = useRef<THREE.PointLight>(null);
  const ambientRef = useRef<THREE.AmbientLight>(null);

  useFrame((_, delta) => {
    if (!lightRef.current || !ambientRef.current) return;

    const targetColor = systemHealth === 'paused'
      ? new THREE.Color('#fbbf24')
      : systemHealth === 'degraded'
      ? new THREE.Color('#fb7185')
      : new THREE.Color('#6366f1');

    const targetIntensity = systemHealth === 'paused' ? 0.8 : 0.3;
    const targetAmbient = systemHealth === 'paused' ? 0.02 : 0.05;

    lightRef.current.color.lerp(targetColor, delta * 2);
    lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, targetIntensity, delta * 2);
    ambientRef.current.intensity = THREE.MathUtils.lerp(ambientRef.current.intensity, targetAmbient, delta * 2);
  });

  return (
    <>
      <pointLight ref={lightRef} position={[0, 5, 0]} color="#6366f1" intensity={0.3} distance={20} decay={2} />
      <ambientLight ref={ambientRef} intensity={0.05} />
    </>
  );
}
