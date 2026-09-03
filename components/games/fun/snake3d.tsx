"use client";

import * as THREE from "three";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { GameProps } from "@/components/game-shell";
import { sfx } from "@/lib/sfx";

const SIZE = 13;
const CELL = 0.62;
const TICK = 170;

type P = { x: number; y: number };

function v(x: number, y: number): [number, number, number] {
  return [(x - (SIZE - 1) / 2) * CELL, (y - (SIZE - 1) / 2) * CELL, 0];
}

function Snake({ snake, food }: { snake: P[]; food: P }) {
  const head = useRef<THREE.Mesh>(null);
  const body = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame((state, delta) => {
    if (head.current) {
      const p = v(snake[0].x, snake[0].y);
      head.current.position.x += (p[0] - head.current.position.x) * Math.min(1, delta * 14);
      head.current.position.y += (p[1] - head.current.position.y) * Math.min(1, delta * 14);
    }
    if (body.current) {
      for (let i = 1; i < snake.length; i++) {
        const p = v(snake[i].x, snake[i].y);
        dummy.position.set(p[0], p[1], 0);
        const s = 0.86 - (i / snake.length) * 0.25;
        dummy.scale.setScalar(s);
        dummy.rotation.z = Math.sin(state.clock.elapsedTime * 2 + i) * 0.15;
        dummy.updateMatrix();
        body.current.setMatrixAt(i - 1, dummy.matrix);
      }
      body.current.count = snake.length - 1;
      body.current.instanceMatrix.needsUpdate = true;
    }
  });

  const fp = v(food.x, food.y);
  return (
    <group>
      <mesh ref={head} position={v(snake[0].x, snake[0].y)}>
        <boxGeometry args={[CELL * 0.92, CELL * 0.92, CELL * 0.92]} />
        <meshStandardMaterial color="#39ff14" emissive="#39ff14" emissiveIntensity={1.5} toneMapped={false} />
      </mesh>
      <instancedMesh ref={body} args={[undefined, undefined, Math.max(1, snake.length - 1)]}>
        <boxGeometry args={[CELL * 0.92, CELL * 0.92, CELL * 0.92]} />
        <meshStandardMaterial color="#2d7cff" emissive="#2d7cff" emissiveIntensity={0.7} toneMapped={false} />
      </instancedMesh>
      <mesh position={fp}>
        <icosahedronGeometry args={[CELL * 0.42, 1]} />
        <meshStandardMaterial color="#ff2e97" emissive="#ff2e97" emissiveIntensity={2} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Board() {
  return (
    <group>
      {Array.from({ length: SIZE * SIZE }, (_, i) => {
        const x = i % SIZE;
        const y = Math.floor(i / SIZE);
        const dark = (x + y) % 2 === 0;
        return (
          <mesh key={i} position={[v(x, y)[0], v(x, y)[1], -0.45]}>
            <planeGeometry args={[CELL * 0.96, CELL * 0.96]} />
            <meshBasicMaterial color={dark ? "#0b0d1c" : "#101331"} transparent opacity={0.85} />
          </mesh>
        );
      })}
    </group>
  );
}

export default function Snake3D({ onEnd }: GameProps) {
  const [snake, setSnake] = useState<P[]>([{ x: 6, y: 6 }, { x: 5, y: 6 }, { x: 4, y: 6 }]);
  const [food, setFood] = useState<P>({ x: 9, y: 6 });
  const [dead, setDead] = useState(false);
  const [score, setScore] = useState(0);
  const [paused, setPaused] = useState(false);
  const dir = useRef<P>({ x: 1, y: 0 });
  const nextDir = useRef<P>({ x: 1, y: 0 });
  const startedAt = useRef(Date.now());
  const endedRef = useRef(false);

  const spawnFood = (s: P[]): P => {
    let f: P;
    do {
      f = { x: Math.floor(Math.random() * SIZE), y: Math.floor(Math.random() * SIZE) };
    } while (s.some((p) => p.x === f.x && p.y === f.y));
    return f;
  };

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const map: Record<string, P> = { ArrowUp: { x: 0, y: 1 }, ArrowDown: { x: 0, y: -1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 }, w: { x: 0, y: 1 }, s: { x: 0, y: -1 }, a: { x: -1, y: 0 }, d: { x: 1, y: 0 } };
      const nd = map[e.key];
      if (nd) {
        e.preventDefault();
        if (nd.x !== -dir.current.x || nd.y !== -dir.current.y) nextDir.current = nd;
      }
      if (e.key === " ") setPaused((p) => !p);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, []);

  useEffect(() => {
    if (dead) return;
    const iv = setInterval(() => {
      if (paused) return;
      setSnake((prev) => {
        dir.current = nextDir.current;
        const head = { x: prev[0].x + dir.current.x, y: prev[0].y + dir.current.y };
        if (head.x < 0 || head.y < 0 || head.x >= SIZE || head.y >= SIZE || prev.some((p) => p.x === head.x && p.y === head.y)) {
          if (!endedRef.current) {
            endedRef.current = true;
            setDead(true);
            const finalScore = score;
            setTimeout(() => onEnd({ score: finalScore, maxScore: 200, accuracy: Math.min(1, finalScore / 100), timeMs: Date.now() - startedAt.current, flag: finalScore >= 20 ? "snake-20" : undefined }), 600);
          }
          return prev;
        }
        const grew = head.x === food.x && head.y === food.y;
        if (grew) {
          sfx("coin");
          setScore((s) => s + 1);
          setFood(spawnFood([...prev, head]));
        } else sfx("tick");
        return [head, ...(grew ? prev : prev.slice(0, -1))];
      });
    }, TICK);
    return () => clearInterval(iv);
  }, [food, dead, paused, score, onEnd]);

  const swipe = useRef<{ x: number; y: number } | null>(null);

  return (
    <div
      className="relative mx-auto aspect-square max-w-lg touch-none select-none"
      onTouchStart={(e) => (swipe.current = { x: e.touches[0].clientX, y: e.touches[0].clientY })}
      onTouchEnd={(e) => {
        if (!swipe.current) return;
        const dx = e.changedTouches[0].clientX - swipe.current.x;
        const dy = e.changedTouches[0].clientY - swipe.current.y;
        if (Math.abs(dx) > 20 || Math.abs(dy) > 20) {
          const nd = Math.abs(dx) > Math.abs(dy) ? { x: Math.sign(dx), y: 0 } : { x: 0, y: Math.sign(dy) };
          if (nd.x !== -dir.current.x || nd.y !== -dir.current.y) nextDir.current = nd;
        }
        swipe.current = null;
      }}
    >
      <Canvas camera={{ position: [0, 0, 10.5], fov: 50 }} dpr={[1, 1.75]} gl={{ antialias: true, alpha: true }} style={{ background: "transparent" }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[4, 6, 8]} intensity={50} color="#2d7cff" />
        <pointLight position={[-5, -4, 6]} intensity={35} color="#39ff14" />
        <Board />
        <Snake snake={snake} food={food} />
      </Canvas>
      <div className="pointer-events-none absolute inset-x-0 top-2 flex justify-center gap-2">
        <span className="chip pointer-events-auto">🐍 {score}</span>
        <button className="chip pointer-events-auto cursor-pointer" onClick={() => setPaused(!paused)}>
          {paused ? "▶️ Resume" : "⏸ Pause"}
        </button>
      </div>
      {dead && <div className="absolute inset-0 grid place-items-center bg-black/50 backdrop-blur-sm"><p className="font-display text-2xl font-black text-gradient">Game Over — {score}!</p></div>}
      <div className="mt-2 grid grid-cols-3 gap-1.5 sm:hidden">
        <div />
        <button className="btn btn-ghost !py-2" onClick={() => { const nd = { x: 0, y: 1 }; if (nd.y !== -dir.current.y) nextDir.current = nd; }} aria-label="Up">↑</button>
        <div />
        <button className="btn btn-ghost !py-2" onClick={() => { const nd = { x: -1, y: 0 }; if (nd.x !== -dir.current.x) nextDir.current = nd; }} aria-label="Left">←</button>
        <button className="btn btn-ghost !py-2" onClick={() => { const nd = { x: 0, y: -1 }; if (nd.y !== -dir.current.y) nextDir.current = nd; }} aria-label="Down">↓</button>
        <button className="btn btn-ghost !py-2" onClick={() => { const nd = { x: 1, y: 0 }; if (nd.x !== -dir.current.x) nextDir.current = nd; }} aria-label="Right">→</button>
      </div>
    </div>
  );
}
