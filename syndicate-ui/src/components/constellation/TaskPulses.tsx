import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useConstellationStore } from '../../stores/constellation';

const AGENT_POSITIONS: Record<string, THREE.Vector3> = {
  nexus: new THREE.Vector3(0, 0, 0),
  architect: new THREE.Vector3(-3, 1, 2),
  engineer: new THREE.Vector3(3, 0, 2),
  reviewer: new THREE.Vector3(-2, -1, -3),
  researcher: new THREE.Vector3(4, 1, -2),
  qa: new THREE.Vector3(-1, -2, -2),
};

interface Photon {
  id: string;
  from: THREE.Vector3;
  to: THREE.Vector3;
  color: THREE.Color;
  birth: number;
  duration: number;
}

export default function TaskPulses() {
  const pulses = useConstellationStore(s => s.pulses);
  const groupRef = useRef<THREE.Group>(null);
  const photonsRef = useRef<Photon[]>([]);
  const meshRefs = useRef<Map<string, THREE.Mesh>>(new Map());
  const completedIds = useRef<Set<string>>(new Set());

  const photonGeometry = useMemo(() => new THREE.SphereGeometry(0.08, 8, 8), []);

  useFrame(() => {
    const now = performance.now();

    pulses.forEach(pulse => {
      if (completedIds.current.has(pulse.id) || meshRefs.current.has(pulse.id)) return;
      const from = AGENT_POSITIONS[pulse.from] || AGENT_POSITIONS.nexus;
      const to = AGENT_POSITIONS[pulse.to] || AGENT_POSITIONS.nexus;
      photonsRef.current.push({
        id: pulse.id,
        from: from.clone(),
        to: to.clone(),
        color: new THREE.Color(pulse.color),
        birth: now,
        duration: 1500,
      });
    });

    photonsRef.current = photonsRef.current.filter(photon => {
      const age = now - photon.birth;
      const progress = Math.min(age / photon.duration, 1);
      const mesh = meshRefs.current.get(photon.id);

      if (progress >= 1) {
        if (mesh && groupRef.current) {
          groupRef.current.remove(mesh);
          meshRefs.current.delete(photon.id);
        }
        completedIds.current.add(photon.id);
        if (completedIds.current.size > 100) {
          const entries = [...completedIds.current];
          completedIds.current = new Set(entries.slice(-50));
        }
        return false;
      }

      if (!mesh && groupRef.current) {
        const newMesh = new THREE.Mesh(
          photonGeometry,
          new THREE.MeshBasicMaterial({
            color: photon.color,
            transparent: true,
            opacity: 1,
            depthWrite: false,
          })
        );
        groupRef.current.add(newMesh);
        meshRefs.current.set(photon.id, newMesh);
      }

      const currentMesh = meshRefs.current.get(photon.id);
      if (currentMesh) {
        const eased = easeOutCubic(progress);
        const pos = photon.from.clone().lerp(photon.to, eased);
        const mid = photon.from.clone().add(photon.to).multiplyScalar(0.5);
        mid.y += 1.5 * Math.sin(progress * Math.PI);
        const curved = pos.clone().lerp(mid, Math.sin(progress * Math.PI) * 0.4);

        currentMesh.position.copy(curved);

        const scale = Math.sin(progress * Math.PI) * 1.5 + 0.5;
        currentMesh.scale.setScalar(scale);

        const mat = currentMesh.material as THREE.MeshBasicMaterial;
        mat.opacity = Math.sin(progress * Math.PI);
      }

      return true;
    });
  });

  return <group ref={groupRef} />;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}
