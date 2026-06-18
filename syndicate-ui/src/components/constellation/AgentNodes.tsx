import { useRef, useMemo } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useConstellationStore } from '../../stores/constellation';

const FluidBlobMaterial = shaderMaterial(
  {
    uTime: 0,
    uColor: new THREE.Color('#6366f1'),
    uActivity: 0,
    uMouse: new THREE.Vector2(0, 0),
  },
  // Vertex shader — morphs the sphere into an organic blob
  `
    uniform float uTime;
    uniform float uActivity;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vDisplacement;

    // Simplex-style noise
    vec3 mod289(vec3 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
    vec4 mod289(vec4 x) { return x - floor(x * (1.0/289.0)) * 289.0; }
    vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
    vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

    float snoise(vec3 v) {
      const vec2 C = vec2(1.0/6.0, 1.0/3.0);
      const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
      vec3 i = floor(v + dot(v, C.yyy));
      vec3 x0 = v - i + dot(i, C.xxx);
      vec3 g = step(x0.yzx, x0.xyz);
      vec3 l = 1.0 - g;
      vec3 i1 = min(g.xyz, l.zxy);
      vec3 i2 = max(g.xyz, l.zxy);
      vec3 x1 = x0 - i1 + C.xxx;
      vec3 x2 = x0 - i2 + C.yyy;
      vec3 x3 = x0 - D.yyy;
      i = mod289(i);
      vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
      float n_ = 0.142857142857;
      vec3 ns = n_ * D.wyz - D.xzx;
      vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
      vec4 x_ = floor(j * ns.z);
      vec4 y_ = floor(j - 7.0 * x_);
      vec4 x = x_ * ns.x + ns.yyyy;
      vec4 y = y_ * ns.x + ns.yyyy;
      vec4 h = 1.0 - abs(x) - abs(y);
      vec4 b0 = vec4(x.xy, y.xy);
      vec4 b1 = vec4(x.zw, y.zw);
      vec4 s0 = floor(b0)*2.0 + 1.0;
      vec4 s1 = floor(b1)*2.0 + 1.0;
      vec4 sh = -step(h, vec4(0.0));
      vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
      vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
      vec3 p0 = vec3(a0.xy, h.x);
      vec3 p1 = vec3(a0.zw, h.y);
      vec3 p2 = vec3(a1.xy, h.z);
      vec3 p3 = vec3(a1.zw, h.w);
      vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
      p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
      vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
      m = m * m;
      return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
    }

    void main() {
      float speed = 0.8 + uActivity * 2.0;
      float amplitude = 0.15 + uActivity * 0.35;

      float noise1 = snoise(position * 1.5 + uTime * speed * 0.3);
      float noise2 = snoise(position * 3.0 + uTime * speed * 0.5) * 0.5;
      float noise3 = snoise(position * 5.0 - uTime * speed * 0.2) * 0.25;

      float displacement = (noise1 + noise2 + noise3) * amplitude;
      vec3 newPosition = position + normal * displacement;

      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(newPosition, 1.0)).xyz;
      vDisplacement = displacement;

      gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
    }
  `,
  // Fragment shader — iridescent fluid surface
  `
    uniform vec3 uColor;
    uniform float uTime;
    uniform float uActivity;
    varying vec3 vNormal;
    varying vec3 vPosition;
    varying float vDisplacement;

    void main() {
      vec3 viewDir = normalize(-vPosition);
      float fresnel = pow(1.0 - max(dot(viewDir, vNormal), 0.0), 3.0);

      // Base color with displacement-driven iridescence
      vec3 baseColor = uColor;
      vec3 iridescentShift = vec3(
        sin(vDisplacement * 8.0 + uTime) * 0.15,
        cos(vDisplacement * 6.0 - uTime * 0.5) * 0.1,
        sin(vDisplacement * 10.0 + uTime * 0.7) * 0.12
      );
      vec3 color = baseColor + iridescentShift;

      // Rim glow intensifies with activity
      float rimStrength = 0.4 + uActivity * 1.2;
      vec3 rimColor = color * 2.0;

      vec3 finalColor = mix(color * 0.3, rimColor, fresnel * rimStrength);

      // Core glow
      float core = pow(max(dot(viewDir, vNormal), 0.0), 4.0) * 0.3 * (1.0 + uActivity);
      finalColor += color * core;

      // Emissive pulse when active
      float pulse = sin(uTime * 3.0) * 0.5 + 0.5;
      finalColor += color * pulse * uActivity * 0.3;

      float alpha = 0.7 + fresnel * 0.3;
      gl_FragColor = vec4(finalColor, alpha);
    }
  `
);

extend({ FluidBlobMaterial });

declare global {
  namespace JSX {
    interface IntrinsicElements {
      fluidBlobMaterial: any;
    }
  }
}

function AgentBlob({ role, position, color, status }: {
  role: string;
  position: [number, number, number];
  color: string;
  status: string;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<any>(null);
  const baseScale = role === 'nexus' ? 0.55 : 0.35;
  const activityRef = useRef(0);

  useFrame((_, delta) => {
    if (!matRef.current) return;

    const isActive = status === 'active';
    const targetActivity = isActive ? 1.0 : 0.0;
    activityRef.current += (targetActivity - activityRef.current) * delta * 3;

    matRef.current.uTime += delta;
    matRef.current.uActivity = activityRef.current;

    if (meshRef.current) {
      const targetScale = baseScale * (1 + activityRef.current * 0.2);
      meshRef.current.scale.lerp(
        new THREE.Vector3(targetScale, targetScale, targetScale),
        delta * 4
      );
      meshRef.current.rotation.y += delta * 0.1;
      meshRef.current.rotation.x += delta * 0.05;
    }
  });

  return (
    <group position={position}>
      <mesh ref={meshRef} scale={baseScale}>
        <icosahedronGeometry args={[1, 6]} />
        <fluidBlobMaterial
          ref={matRef}
          uColor={new THREE.Color(color)}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Point light from blob */}
      <pointLight
        color={color}
        intensity={status === 'active' ? 2.5 : 0.8}
        distance={5}
        decay={2}
      />
    </group>
  );
}

export default function AgentNodes() {
  const agents = useConstellationStore(s => s.agents);

  return (
    <group>
      {agents.map(agent => (
        <AgentBlob
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
