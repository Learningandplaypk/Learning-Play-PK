"use client";

import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { scrollState } from "@/lib/scroll-state";

const LETTERS = [
  { ch: "A", color: "#178A55", pos: [-1.55, 0.85, 0.2] as const },
  { ch: "ب", color: "#0E5C3B", pos: [1.5, 0.7, -0.1] as const },
  { ch: "한", color: "#F5A524", pos: [-1.35, -0.55, 0.35] as const },
  { ch: "あ", color: "#178A55", pos: [1.4, -0.45, 0.2] as const },
  { ch: "中", color: "#0E5C3B", pos: [0.15, 1.25, -0.3] as const },
];

function makeLetterTexture(ch: string, color: string) {
  const c = document.createElement("canvas");
  c.width = 128;
  c.height = 128;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, 128, 128);
  ctx.font = "700 78px Nunito, 'Noto Nastaliq Urdu', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.fillText(ch, 64, 70);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.needsUpdate = true;
  return t;
}

function LetterBillboard({
  ch,
  color,
  position,
  paused,
}: {
  ch: string;
  color: string;
  position: readonly [number, number, number];
  paused: boolean;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => makeLetterTexture(ch, color), [ch, color]);
  const phase = useMemo(() => Math.random() * Math.PI * 2, []);
  useEffect(() => () => texture.dispose(), [texture]);

  useFrame(({ clock }) => {
    if (paused || !mesh.current) return;
    const t = clock.elapsedTime;
    mesh.current.position.y = position[1] + Math.sin(t * 0.7 + phase) * 0.08;
    mesh.current.rotation.z = Math.sin(t * 0.4 + phase) * 0.12;
  });

  return (
    <mesh ref={mesh} position={position as [number, number, number]}>
      <planeGeometry args={[0.42, 0.42]} />
      <meshBasicMaterial map={texture} transparent depthWrite={false} />
    </mesh>
  );
}

function Book({ paused }: { paused: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (paused || !ref.current) return;
    ref.current.rotation.y = Math.sin(clock.elapsedTime * 0.4) * 0.25;
    ref.current.position.y = -0.95 + Math.sin(clock.elapsedTime * 0.6) * 0.05;
  });
  return (
    <group ref={ref} position={[-1.15, -0.95, 0.4]} rotation={[0.3, 0.6, 0.1]}>
      <mesh>
        <boxGeometry args={[0.42, 0.08, 0.3]} />
        <meshStandardMaterial color="#178A55" roughness={0.7} metalness={0.05} />
      </mesh>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.38, 0.04, 0.26]} />
        <meshStandardMaterial color="#FDF6E9" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Controller({ paused }: { paused: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (paused || !ref.current) return;
    ref.current.rotation.z = Math.sin(clock.elapsedTime * 0.5) * 0.12;
    ref.current.position.y = -0.85 + Math.cos(clock.elapsedTime * 0.55) * 0.05;
  });
  return (
    <group ref={ref} position={[1.2, -0.85, 0.35]} rotation={[0.4, -0.4, 0]}>
      <mesh>
        <boxGeometry args={[0.5, 0.14, 0.24]} />
        <meshStandardMaterial color="#1C1C1A" roughness={0.6} metalness={0.15} />
      </mesh>
      <mesh position={[-0.12, 0.09, 0.02]}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshStandardMaterial color="#F5A524" roughness={0.4} />
      </mesh>
      <mesh position={[0.12, 0.09, 0.02]}>
        <sphereGeometry args={[0.045, 10, 8]} />
        <meshStandardMaterial color="#178A55" roughness={0.4} />
      </mesh>
    </group>
  );
}

function Globe({ paused }: { paused: boolean }) {
  const group = useRef<THREE.Group>(null);
  const shell = useRef<THREE.LineSegments>(null);
  const atmo = useRef<THREE.Mesh>(null);
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.SphereGeometry(1.22, 16, 12)), []);
  useEffect(() => () => edgesGeo.dispose(), [edgesGeo]);

  useFrame((_, delta) => {
    if (paused) return;
    const d = Math.min(delta, 0.05);
    if (group.current) {
      group.current.rotation.y += d * 0.18;
      group.current.rotation.x = THREE.MathUtils.lerp(group.current.rotation.x, scrollState.my * 0.18, 0.08);
      group.current.rotation.z = THREE.MathUtils.lerp(group.current.rotation.z, scrollState.mx * 0.12, 0.08);
    }
    if (shell.current) shell.current.rotation.y -= d * 0.06;
    if (atmo.current) atmo.current.rotation.y += d * 0.04;
  });

  return (
    <>
      <group ref={group}>
        <mesh>
          <sphereGeometry args={[1, 32, 20]} />
          <meshStandardMaterial color="#178A55" roughness={0.72} metalness={0.08} />
        </mesh>
        <mesh position={[0.62, 0.42, 0.66]} rotation={[0.4, 0.2, 0]}>
          <sphereGeometry args={[0.34, 12, 8]} />
          <meshStandardMaterial color="#0E5C3B" roughness={0.85} />
        </mesh>
        <mesh position={[-0.5, -0.35, 0.78]} rotation={[0.2, -0.6, 0]}>
          <sphereGeometry args={[0.26, 12, 8]} />
          <meshStandardMaterial color="#0E5C3B" roughness={0.85} />
        </mesh>
        <mesh position={[0.35, 0.28, 1.02]}>
          <sphereGeometry args={[0.08, 10, 8]} />
          <meshStandardMaterial color="#F5A524" roughness={0.45} emissive="#F5A524" emissiveIntensity={0.25} />
        </mesh>
      </group>
      <lineSegments ref={shell} geometry={edgesGeo}>
        <lineBasicMaterial color="#178A55" transparent opacity={0.22} />
      </lineSegments>
      {/* soft atmosphere — additive shell standing in for light bloom */}
      <mesh ref={atmo} scale={1.38}>
        <sphereGeometry args={[1, 24, 16]} />
        <meshBasicMaterial color="#178A55" transparent opacity={0.1} side={THREE.BackSide} depthWrite={false} />
      </mesh>
      <mesh scale={1.55}>
        <sphereGeometry args={[1, 16, 12]} />
        <meshBasicMaterial color="#F5A524" transparent opacity={0.04} side={THREE.BackSide} depthWrite={false} />
      </mesh>
    </>
  );
}

function Scene({ paused }: { paused: boolean }) {
  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[2.5, 3, 2]} intensity={1.05} color="#FFF8E8" />
      <directionalLight position={[-2, -1, -1]} intensity={0.28} color="#F5A524" />
      <Globe paused={paused} />
      <Book paused={paused} />
      <Controller paused={paused} />
      {LETTERS.map((l) => (
        <LetterBillboard key={l.ch} ch={l.ch} color={l.color} position={l.pos} paused={paused} />
      ))}
    </>
  );
}

export default function HeroScene({ className }: { className?: string }) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    const onMove = (e: PointerEvent) => {
      scrollState.mx = (e.clientX / window.innerWidth) * 2 - 1;
      scrollState.my = (e.clientY / window.innerHeight) * 2 - 1;
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return (
    <div className={className} aria-hidden>
      <Canvas
        camera={{ position: [0, 0.2, 3.6], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: "low-power", alpha: true }}
        style={{ touchAction: "pan-y", background: "transparent" }}
      >
        <Suspense fallback={null}>
          <Scene paused={paused} />
        </Suspense>
      </Canvas>
    </div>
  );
}
