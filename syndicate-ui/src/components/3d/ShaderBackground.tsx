import { ShaderGradientCanvas, ShaderGradient } from '@shadergradient/react';

export default function ShaderBackground() {
  return (
    <div className="fixed inset-0 -z-10 opacity-70">
      <ShaderGradientCanvas
        style={{ width: '100%', height: '100%' }}
        pixelDensity={1}
        fov={45}
      >
        <ShaderGradient
          type="waterPlane"
          animate="on"
          uSpeed={0.1}
          uStrength={1.5}
          uDensity={1.2}
          uFrequency={5.5}
          uAmplitude={2}
          positionX={0}
          positionY={0}
          positionZ={0}
          rotationX={0}
          rotationY={0}
          rotationZ={0}
          color1="#0a0a1a"
          color2="#1a0a2e"
          color3="#0a1a2e"
          grain="on"
          lightType="env"
          envPreset="dawn"
          reflection={0.1}
          brightness={0.8}
          cAzimuthAngle={180}
          cPolarAngle={80}
          cDistance={3.6}
          cameraZoom={1}
        />
      </ShaderGradientCanvas>
    </div>
  );
}
