import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';

export default function ShaderBackground() {
  return (
    <div className="fixed inset-0 -z-10">
      <ShaderGradientCanvas
        style={{ width: '100%', height: '100%' }}
        pixelDensity={1.5}
        fov={45}
      >
        <ShaderGradient
          type="waterPlane"
          animate="on"
          uSpeed={0.2}
          uStrength={2.5}
          uDensity={1.8}
          uFrequency={4}
          uAmplitude={3}
          positionX={0}
          positionY={0.5}
          positionZ={-1}
          rotationX={-20}
          rotationY={0}
          rotationZ={0}
          color1="#1a0533"
          color2="#0d1b3e"
          color3="#15062e"
          grain="on"
          lightType="3d"
          envPreset="dawn"
          reflection={0.4}
          brightness={1.2}
          cAzimuthAngle={180}
          cPolarAngle={90}
          cDistance={2.8}
          cameraZoom={1}
        />
      </ShaderGradientCanvas>
    </div>
  );
}
