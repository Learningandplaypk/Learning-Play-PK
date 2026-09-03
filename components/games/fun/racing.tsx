"use client";

import * as THREE from "three";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { GameProps } from "@/components/game-shell";
import { sfx } from "@/lib/sfx";

const ROAD_W = 7;

type Obstacle = { z: number; x: number; id: number };

let oid = 1;

function Road({ speedRef }: { speedRef: React.MutableRefObject<number> }) {
  const stripes = useRef<THREE.Group>(null);
  const count = 14;
  useFrame((_, delta) => {
    const g = stripes.current;
    if (!g) return;
    g.children.forEach((child) => {
      child.position.z += speedRef.current * delta * 26;
      if (child.position.z > 12) child.position.z -= count * 2;
    });
  });
  return (
    <group>
      {/* road plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, -40]}>
        <planeGeometry args={[ROAD_W, 140]} />
        <meshStandardMaterial color="#0b0d1c" roughness={0.9} />
      </mesh>
      {/* neon edges */}
      {[-ROAD_W / 2, ROAD_W / 2].map((x) => (
        <mesh key={x} position={[x, -0.45, -40]}>
          <boxGeometry args={[0.12, 0.06, 140]} />
          <meshBasicMaterial color={x < 0 ? "#39ff14" : "#ff2e97"} toneMapped={false} />
        </mesh>
      ))}
      {/* center dashes */}
      <group ref={stripes}>
        {Array.from({ length: count }, (_, i) => (
          <mesh key={i} position={[0, -0.44, -i * 2]}>
            <boxGeometry args={[0.16, 0.04, 1]} />
            <meshBasicMaterial color="#f4f6ff" transparent opacity={0.75} toneMapped={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Car({ xRef, crashed }: { xRef: React.MutableRefObject<number>; crashed: boolean }) {
  const g = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!g.current) return;
    g.current.position.x += (xRef.current - g.current.position.x) * Math.min(1, delta * 10);
    g.current.rotation.z = (xRef.current - g.current.position.x) * -0.25;
  });
  return (
    <group ref={g} position={[0, 0, 4]}>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[1.1, 0.5, 2]} />
        <meshStandardMaterial color={crashed ? "#ff2e3f" : "#2d7cff"} emissive={crashed ? "#ff2e3f" : "#2d7cff"} emissiveIntensity={0.8} metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[0, 0.48, -0.15]}>
        <boxGeometry args={[0.8, 0.4, 1]} />
        <meshPhysicalMaterial color="#12142a" roughness={0.1} metalness={0.4} clearcoat={1} />
      </mesh>
      {[-0.55, 0.55].map((x) =>
        [-0.7, 0.7].map((z) => (
          <mesh key={`${x}${z}`} position={[x, -0.1, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.22, 0.22, 0.16, 16]} />
            <meshStandardMaterial color="#05060f" />
          </mesh>
        ))
      )}
      {[-0.35, 0.35].map((x) => (
        <mesh key={x} position={[x, 0.15, 1.05]}>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshBasicMaterial color="#fff7ae" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Obstacles({ speedRef, listRef }: { speedRef: React.MutableRefObject<number>; listRef: React.MutableRefObject<Obstacle[]> }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    g.children.forEach((child, i) => {
      child.position.z += speedRef.current * delta * 26;
      child.rotation.y += delta;
      if (child.position.z > 8) {
        child.position.z = -90 - Math.random() * 30;
        child.position.x = (Math.random() - 0.5) * (ROAD_W - 2.4);
        listRef.current[i] = { z: child.position.z, x: child.position.x, id: i };
      } else {
        listRef.current[i] = { z: child.position.z, x: child.position.x, id: i };
      }
    });
  });
  return (
    <group ref={group}>
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[((i % 3) - 1) * 2, 0.2, -12 - i * 14]}>
          <boxGeometry args={[1.2, 1.2, 1.2]} />
          <meshStandardMaterial color="#b026ff" emissive="#b026ff" emissiveIntensity={0.9} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

export default function Racing({ onEnd }: GameProps) {
  const [score, setScore] = useState(0);
  const [crashed, setCrashed] = useState(false);
  const speedRef = useRef(0.55);
  const xRef = useRef(0);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const startedAt = useRef(Date.now());
  const endedRef = useRef(false);
  const scoreRef = useRef(0);
  scoreRef.current = score;

  // score + speed ramp
  useEffect(() => {
    if (crashed) return;
    const iv = setInterval(() => {
      setScore((s) => s + 1);
      speedRef.current = Math.min(1.7, 0.55 + scoreRef.current / 400);
    }, 220);
    return () => clearInterval(iv);
  }, [crashed]);

  // collision check
  useEffect(() => {
    if (crashed) return;
    const iv = setInterval(() => {
      for (const o of obstaclesRef.current) {
        if (o.z > 2.8 && o.z < 5.4 && Math.abs(o.x - xRef.current) < 1.05) {
          if (!endedRef.current) {
            endedRef.current = true;
            setCrashed(true);
            sfx("lose");
            setTimeout(() => onEnd({ score: scoreRef.current, maxScore: 300, accuracy: Math.min(1, scoreRef.current / 250), timeMs: Date.now() - startedAt.current }), 700);
          }
          break;
        }
      }
    }, 60);
    return () => clearInterval(iv);
  }, [crashed, onEnd]);

  // controls
  useEffect(() => {
    const keys = new Set<string>();
    const down = (e: KeyboardEvent) => {
      keys.add(e.key);
      if (["ArrowLeft", "ArrowRight", "a", "d"].includes(e.key)) e.preventDefault();
    };
    const up = (e: KeyboardEvent) => keys.delete(e.key);
    const iv = setInterval(() => {
      if (crashed) return;
      if (keys.has("ArrowLeft") || keys.has("a")) xRef.current = Math.max(-ROAD_W / 2 + 0.8, xRef.current - 0.22);
      if (keys.has("ArrowRight") || keys.has("d")) xRef.current = Math.min(ROAD_W / 2 - 0.8, xRef.current + 0.22);
    }, 16);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      clearInterval(iv);
    };
  }, [crashed]);

  const swipeStart = useRef<number | null>(null);

  return (
    <div
      className="relative mx-auto aspect-[3/4] max-w-md touch-none select-none"
      onTouchStart={(e) => (swipeStart.current = e.touches[0].clientX)}
      onTouchMove={(e) => {
        if (swipeStart.current === null || crashed) return;
        const dx = e.touches[0].clientX - swipeStart.current;
        if (Math.abs(dx) > 6) {
          xRef.current = Math.max(-ROAD_W / 2 + 0.8, Math.min(ROAD_W / 2 - 0.8, xRef.current + dx * 0.02));
          swipeStart.current = e.touches[0].clientX;
        }
      }}
      onTouchEnd={() => (swipeStart.current = null)}
    >
      <Canvas camera={{ position: [0, 2.6, 7], fov: 62 }} dpr={[1, 1.6]} gl={{ alpha: true }} style={{ background: "transparent" }}>
        <fog attach="fog" args={["#05060f", 10, 85]} />
        <ambientLight intensity={0.5} />
        <pointLight position={[0, 4, 6]} intensity={45} color="#2d7cff" />
        <Road speedRef={speedRef} />
        <Obstacles speedRef={speedRef} listRef={obstaclesRef} />
        <Car xRef={xRef} crashed={crashed} />
        <Stars />
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center gap-2">
        <span className="chip">🏁 {score} m</span>
        <span className="chip">⚡ {(speedRef.current * 160).toFixed(0)} km/h</span>
      </div>
      {crashed && <div className="absolute inset-0 grid place-items-center bg-black/55 backdrop-blur-sm"><p className="font-display text-2xl font-black text-gradient">Crash! — {score} m</p></div>}
      <p className="mt-1 text-center text-xs text-muted">← → ya swipe se lane badlo — neon blocks se bacho!</p>
    </div>
  );
}

function Stars() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(300 * 3);
    for (let i = 0; i < 300; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 60;
      pos[i * 3 + 1] = Math.random() * 18;
      pos[i * 3 + 2] = -Math.random() * 90;
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  return (
    <points geometry={geo}>
      <pointsMaterial size={0.1} color="#8b90b0" transparent opacity={0.7} />
    </points>
  );
}
