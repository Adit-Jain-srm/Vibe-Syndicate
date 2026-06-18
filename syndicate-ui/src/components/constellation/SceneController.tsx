import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useConstellationStore } from '../../stores/constellation';

const CAMERA_PRESETS: Record<string, { position: [number, number, number]; lookAt: [number, number, number] }> = {
  '/': { position: [0, 3, 18], lookAt: [0, 0, 0] },
  '/app': { position: [0, 2, 8], lookAt: [0, 0, 0] },
  '/pipeline': { position: [5, 1, 5], lookAt: [0, 0, 0] },
  '/live': { position: [-4, 2, 7], lookAt: [0, 0, 0] },
  '/metrics': { position: [0, 10, 6], lookAt: [0, 0, 0] },
  '/memory': { position: [0, 2, 13], lookAt: [0, 1, 14] },
  '/approvals': { position: [0, -3, 5], lookAt: [-1, -2, -2] },
  '/agents': { position: [6, 3, 6], lookAt: [0, 0, 0] },
  '/tasks': { position: [2, 1, 7], lookAt: [0, 0, 0] },
};

const SPRING_STIFFNESS = 4.0;
const SPRING_DAMPING = 0.92;

export default function SceneController() {
  const { camera } = useThree();
  const cameraTarget = useConstellationStore(s => s.cameraTarget);

  const targetPos = useRef(new THREE.Vector3(0, 3, 18));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0));
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const lookAtCurrent = useRef(new THREE.Vector3(0, 0, 0));
  const lookAtVelocity = useRef(new THREE.Vector3(0, 0, 0));
  const autoRotateAngle = useRef(0);
  const isLandingRef = useRef(cameraTarget === '/');

  useEffect(() => {
    isLandingRef.current = cameraTarget === '/';
    const preset = CAMERA_PRESETS[cameraTarget] || CAMERA_PRESETS['/app'];
    targetPos.current.set(...preset.position);
    targetLookAt.current.set(...preset.lookAt);
  }, [cameraTarget]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.05);

    if (isLandingRef.current) {
      autoRotateAngle.current += dt * 0.15;
      const radius = 18;
      const x = Math.sin(autoRotateAngle.current) * radius;
      const z = Math.cos(autoRotateAngle.current) * radius;
      targetPos.current.set(x, 3, z);
    }

    // Spring physics for position
    const posForce = new THREE.Vector3()
      .subVectors(targetPos.current, camera.position)
      .multiplyScalar(SPRING_STIFFNESS);
    velocity.current.add(posForce.multiplyScalar(dt));
    velocity.current.multiplyScalar(SPRING_DAMPING);
    camera.position.add(velocity.current.clone().multiplyScalar(dt));

    // Spring physics for lookAt
    const lookAtForce = new THREE.Vector3()
      .subVectors(targetLookAt.current, lookAtCurrent.current)
      .multiplyScalar(SPRING_STIFFNESS);
    lookAtVelocity.current.add(lookAtForce.multiplyScalar(dt));
    lookAtVelocity.current.multiplyScalar(SPRING_DAMPING);
    lookAtCurrent.current.add(lookAtVelocity.current.clone().multiplyScalar(dt));

    camera.lookAt(lookAtCurrent.current);
  });

  return null;
}
