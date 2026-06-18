export const brainVertexShader = /* glsl */ `
uniform vec3 uPointer;
uniform vec3 uColor;
uniform float uRotation;
uniform float uSize;
uniform float uHover;
uniform float uProgress;

attribute vec3 aScattered;

varying vec3 vColor;

#define PI 3.14159265359

mat2 rotate2d(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

void main() {
  // Morph between brain position and scattered position based on scroll progress
  vec4 mvPosition = vec4(position, 1.0);
  mvPosition = instanceMatrix * mvPosition;

  // Get the brain-space position for this instance
  vec3 brainPos = mvPosition.xyz;

  // Lerp toward scattered positions when uProgress > 0
  vec3 morphedPos = mix(brainPos, aScattered, uProgress);

  // Distance between the pointer and each instance (for cursor reactivity)
  float d = distance(uPointer, morphedPos);

  // Proximity factor: 1.0 when very close to pointer, 0.0 when far
  float c = smoothstep(0.45, 0.1, d) * uHover;

  // Scale: base size + expansion near cursor
  float scale = uSize + c * 8.0 * uHover;

  // Apply scale and rotation to local position
  vec3 pos = position;
  pos *= scale;
  pos.xz *= rotate2d(PI * c * uRotation + PI * uRotation * 0.43);
  pos.xy *= rotate2d(PI * c * uRotation + PI * uRotation * 0.71);

  // Reconstruct the model-view position with morphed offset
  mvPosition = instanceMatrix * vec4(pos, 1.0);

  // Apply morph offset (difference between morphed and original brain position)
  vec3 offset = morphedPos - brainPos;
  mvPosition.xyz += offset;

  gl_Position = projectionMatrix * modelViewMatrix * mvPosition;

  vColor = uColor;
}
`;
