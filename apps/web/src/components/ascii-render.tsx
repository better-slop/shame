import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AsciiEffect } from "three/examples/jsm/effects/AsciiEffect.js";
import type { Mesh } from "three";

type AsciiRendererProps = {
  className?: string;
};

export const AsciiRenderer = ({ className }: AsciiRendererProps) => {
  return (
    <div className={className}>
      <Canvas camera={{ position: [0, 0, 5] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        <directionalLight position={[-10, -10, -5]} intensity={1} />
        <Torusknot />
        <AsciiRenderer_ />
      </Canvas>
    </div>
  );
};

const Torusknot = () => {
  const meshRef = useRef<Mesh>(null);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.x += delta / 4;
    meshRef.current.rotation.y += delta / 4;
  });

  return (
    <mesh ref={meshRef} scale={1.25}>
      <torusKnotGeometry args={[1, 0.2, 128, 32]} />
      <meshStandardMaterial color="#ffffff" />
    </mesh>
  );
};

const AsciiRenderer_ = () => {
  const { gl, scene, camera, size } = useThree();
  const effectRef = useRef<AsciiEffect | null>(null);

  useEffect(() => {
    const effect = new AsciiEffect(gl, " .:-+*=%@#", { invert: true });

    effect.domElement.style.position = "absolute";
    effect.domElement.style.top = "0px";
    effect.domElement.style.left = "0px";
    effect.domElement.style.color = "var(--color-muted-foreground)";
    effect.domElement.style.backgroundColor = "transparent";
    effect.domElement.style.pointerEvents = "none";
    effect.domElement.style.fontFamily = "monospace";
    effect.domElement.style.fontSize = "10px";
    effect.domElement.style.lineHeight = "1";

    effect.setSize(size.width, size.height);

    const container = gl.domElement.parentNode;
    if (container) {
      container.replaceChild(effect.domElement, gl.domElement);
    }

    effectRef.current = effect;

    return () => {
      if (container && effect.domElement.parentNode) {
        container.replaceChild(gl.domElement, effect.domElement);
      }
    };
  }, [gl]);

  useEffect(() => {
    if (effectRef.current) {
      effectRef.current.setSize(size.width, size.height);
    }
  }, [size]);

  useFrame(() => {
    if (effectRef.current) {
      effectRef.current.render(scene, camera);
    }
  }, 1);

  return null;
};
