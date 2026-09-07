"use client";

import React, { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sfx } from "@/lib/sfx";

/* A single, deliberately simple hero scene: a flat-shaded globe with a soft
   wireframe shell and a few markers. ~2k triangles, one light, no shadows,
   no post-processing. Disposed on unmount. */

function Globe({ paused }: { paused: boolean }) {
  const group = useRef<THREE.Group>(null);
  const shell = useRef<THREE.LineSegments>(null);

  useFrame((_, delta) => {
    if (paused) return;
    const d = Math.min(delta, 0.05);
    if (group.current) group.current.rotation.y += d * 0.18;
    if (shell.current) shell.current.rotation.y -= d * 0.06;
  });

  return (
    <>
      <group ref={group}>
        <mesh>
          <sphereGeometry args={[1, 32, 20]} />
          <meshStandardMaterial color="#178A55" flatShading roughness={0.85} metalness={0} />
        </mesh>
        {/* abstract "land" patches */}
        <mesh position={[0.62, 0.42, 0.66]} rotation={[0.4, 0.2, 0]}>
          <sphereGeometry args={[0.34, 12, 8]} />
          <meshStandardMaterial color="#0E5C3B" flatShading roughness={0.9} />
        </mesh>
        <mesh position={[-0.5, -0.35, 0.78]} rotation={[0.2, -0.6, 0]}>
          <sphereGeometry args={[0.26, 12, 8]} />
          <meshStandardMaterial color="#0E5C3B" flatShading roughness={0.9} />
        </mesh>
        {/* marker over Pakistan-ish latitude */}
        <mesh position={[0.35, 0.28, 1.02]}>
          <sphereGeometry args={[0.08, 10, 8]} />
          <meshStandardMaterial color="#F5A524" roughness={0.6} />
        </mesh>
      </group>
      <lineSegments ref={shell}>
        <edgesGeometry args={[new THREE.SphereGeometry(1.22, 16, 12)]} />
        <lineBasicMaterial color="#178A55" transparent opacity={0.28} />
      </lineSegments>
    </>
  );
}

export default function HeroScene({ className }: { className?: string }) {
  const [paused, setPaused] = useState(false);

  // Pause when the tab is hidden or the hero scrolls out of view — saves battery.
  useEffect(() => {
    const onVis = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, []);

  return (
    <div
      className={className}
      onPointerDown={() => sfx("click")}
      aria-hidden
    >
      <Canvas
        camera={{ position: [0, 0.35, 3.4], fov: 42 }}
        dpr={[1, 1.5]}
        gl={{ antialias: false, powerPreference: "low-power", alpha: true }}
        style={{ touchAction: "pan-y" }}
      >
        <ambientLight intensity={0.85} />
        <directionalLight position={[2.5, 3, 2]} intensity={0.9} />
        <directionalLight position={[-2, -1, -1]} intensity={0.25} color="#F5A524" />
        <Suspense fallback={null}>
          <Globe paused={paused} />
        </Suspense>
      </Canvas>
    </div>
  );
}
