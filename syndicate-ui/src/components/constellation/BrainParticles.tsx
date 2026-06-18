import { useEffect, useRef, useState } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import {
  BoxGeometry,
  ShaderMaterial,
  Color,
  Vector3,
  Object3D,
  MathUtils,
  Raycaster,
  Vector2,
  Mesh,
} from 'three';
import { InstancedUniformsMesh } from 'three-instanced-uniforms-mesh';
import { gsap } from 'gsap';
import { brainVertexShader } from './shaders/brain.vert';
import { brainFragmentShader } from './shaders/brain.frag';
import { useConstellationStore } from '../../stores/constellation';

const COLORS = [
  new Color(0x963cbd),
  new Color(0xff6f61),
  new Color(0xc5299b),
  new Color(0xfeae51),
];

export default function BrainParticles() {
  const { scene, camera, gl } = useThree();
  const groupRef = useRef<any>(null);
  const meshRef = useRef<InstancedUniformsMesh | null>(null);
  const brainMeshRef = useRef<Mesh | null>(null);
  const hoverRef = useRef({ value: 0 });
  const pointerRef = useRef(new Vector3());
  const raycaster = useRef(new Raycaster());
  const mouse = useRef(new Vector2());
  const [ready, setReady] = useState(false);

  const gltf = useGLTF('/brain.glb');

  useEffect(() => {
    if (!gltf || !groupRef.current) return;

    const brain = gltf.scene.children[0] as Mesh;
    if (!brain || !brain.geometry) return;

    brainMeshRef.current = brain;

    const positions = brain.geometry.attributes.position.array;
    const count = positions.length / 3;

    const geometry = new BoxGeometry(0.004, 0.004, 0.004, 1, 1, 1);

    const material = new ShaderMaterial({
      vertexShader: brainVertexShader,
      fragmentShader: brainFragmentShader,
      wireframe: true,
      uniforms: {
        uPointer: { value: new Vector3() },
        uColor: { value: new Color() },
        uRotation: { value: 0 },
        uSize: { value: 0 },
        uHover: { value: 0 },
        uProgress: { value: 0 },
      },
    });

    const instancedMesh = new InstancedUniformsMesh(geometry, material, count);
    meshRef.current = instancedMesh;

    const dummy = new Object3D();

    for (let i = 0; i < positions.length; i += 3) {
      const idx = i / 3;

      dummy.position.set(positions[i], positions[i + 1], positions[i + 2]);
      dummy.updateMatrix();
      instancedMesh.setMatrixAt(idx, dummy.matrix);

      instancedMesh.setUniformAt('uRotation', idx, MathUtils.randFloat(-1, 1));
      instancedMesh.setUniformAt('uSize', idx, MathUtils.randFloat(0.3, 3));

      const colorIndex = MathUtils.randInt(0, COLORS.length - 1);
      instancedMesh.setUniformAt('uColor', idx, COLORS[colorIndex]);
    }

    groupRef.current.add(instancedMesh);
    setReady(true);

    return () => {
      if (groupRef.current && instancedMesh) {
        groupRef.current.remove(instancedMesh);
      }
      geometry.dispose();
      material.dispose();
    };
  }, [gltf]);

  // Mouse move handler
  useEffect(() => {
    const container = gl.domElement;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 - 1;
      mouse.current.set(x, y);

      // Camera parallax
      gsap.to(camera.position, {
        x: x * 0.15,
        y: y * 0.1,
        duration: 0.5,
        overwrite: true,
      });

      // Raycast onto invisible brain
      if (brainMeshRef.current && meshRef.current) {
        raycaster.current.setFromCamera(mouse.current, camera);
        const intersects = raycaster.current.intersectObject(brainMeshRef.current);

        if (intersects.length > 0) {
          if (hoverRef.current.value === 0) {
            gsap.to(hoverRef.current, {
              value: 1,
              duration: 0.25,
              onUpdate: () => {
                if (!meshRef.current) return;
                for (let i = 0; i < meshRef.current.count; i++) {
                  meshRef.current.setUniformAt('uHover', i, hoverRef.current.value);
                }
              },
            });
          }

          // Tween pointer position
          const point = intersects[0].point;
          gsap.to(pointerRef.current, {
            x: point.x,
            y: point.y,
            z: point.z,
            duration: 0.3,
            overwrite: true,
            onUpdate: () => {
              if (!meshRef.current) return;
              for (let i = 0; i < meshRef.current.count; i++) {
                meshRef.current.setUniformAt('uPointer', i, pointerRef.current);
              }
            },
          });
        } else {
          if (hoverRef.current.value === 1) {
            gsap.to(hoverRef.current, {
              value: 0,
              duration: 0.25,
              onUpdate: () => {
                if (!meshRef.current) return;
                for (let i = 0; i < meshRef.current.count; i++) {
                  meshRef.current.setUniformAt('uHover', i, hoverRef.current.value);
                }
              },
            });
          }
        }
      }
    };

    container.addEventListener('mousemove', onMouseMove, { passive: true });
    return () => container.removeEventListener('mousemove', onMouseMove);
  }, [camera, gl, ready]);

  // Keep camera looking at center
  useFrame(() => {
    camera.lookAt(0, 0, 0);
  });

  return <group ref={groupRef} />;
}

useGLTF.preload('/brain.glb');
