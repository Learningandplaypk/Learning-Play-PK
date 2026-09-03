"use client";

import * as THREE from "three";
import React, { useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import type { GameProps } from "@/components/game-shell";
import { SceneBoundary } from "@/components/scene-boundary";
import { sfx } from "@/lib/sfx";

type Cell = "X" | "O" | null;

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function winnerOf(b: Cell[]): { who: Cell; line: number[] } | null {
  for (const line of LINES) {
    const [a, c, d] = line;
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return { who: b[a], line };
  }
  return null;
}

function minimax(b: Cell[], isAI: boolean): { score: number; move: number } {
  const w = winnerOf(b);
  if (w) return { score: w.who === "O" ? 10 : -10, move: -1 };
  if (b.every(Boolean)) return { score: 0, move: -1 };
  let best = { score: isAI ? -Infinity : Infinity, move: -1 };
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue;
    b[i] = isAI ? "O" : "X";
    const res = minimax(b, !isAI);
    b[i] = null;
    const score = res.score - Math.sign(res.score) * 0.1; // prefer faster wins
    if (isAI ? score > best.score : score < best.score) best = { score, move: i };
  }
  return best;
}

function pos3(i: number): [number, number, number] {
  const r = Math.floor(i / 3);
  const c = i % 3;
  return [(c - 1) * 1.55, ((1 - r) - 0) * 1.55, 0];
}

function XOrO({ cell, idx, hover }: { cell: Cell; idx: number; hover: boolean }) {
  const group = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (!group.current) return;
    group.current.scale.setScalar(THREE.MathUtils.damp(group.current.scale.x, cell ? 1 : 0.001, 8, delta));
    group.current.rotation.y += cell ? delta * 0.8 : 0;
  });
  if (!cell) return null;
  const color = cell === "X" ? "#39ff14" : "#ff2e97";
  return (
    <group ref={group} position={pos3(idx)}>
      {cell === "X" ? (
        <>
          <mesh rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.9, 0.22, 0.22]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
          <mesh rotation={[0, 0, -Math.PI / 4]}>
            <boxGeometry args={[0.9, 0.22, 0.22]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
        </>
      ) : (
        <mesh>
          <torusGeometry args={[0.4, 0.12, 16, 40]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
      )}
      {hover && <pointLight intensity={2} color={color} distance={2} />}
    </group>
  );
}

function Tile({ idx, onPick, disabled }: { idx: number; onPick: (i: number) => void; disabled: boolean }) {
  const [hover, setHover] = useState(false);
  const mesh = useRef<THREE.Mesh>(null);
  useFrame((state, delta) => {
    if (!mesh.current) return;
    const target = hover && !disabled ? 1.08 : 1;
    mesh.current.scale.setScalar(THREE.MathUtils.damp(mesh.current.scale.x, target, 10, delta));
    void state;
  });
  return (
    <mesh
      ref={mesh}
      position={pos3(idx)}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (!disabled) onPick(idx);
      }}
    >
      <boxGeometry args={[1.42, 1.42, 0.22]} />
      <meshPhysicalMaterial color={hover ? "#1b2048" : "#12142a"} roughness={0.25} clearcoat={1} />
    </mesh>
  );
}

export default function TicTacToe({ onEnd }: GameProps) {
  const [board, setBoard] = useState<Cell[]>(Array(9).fill(null));
  const [busy, setBusy] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const endedRef = useRef(false);
  const result = useMemo(() => winnerOf(board), [board]);
  const full = board.every(Boolean);

  const finish = (playerWon: boolean | null) => {
    if (endedRef.current) return;
    endedRef.current = true;
    const time = Date.now() - startedAt;
    onEnd({
      score: playerWon === true ? 100 : playerWon === false ? 30 : 60,
      maxScore: 100,
      accuracy: playerWon === true ? 1 : playerWon === null ? 0.6 : 0.3,
      timeMs: time,
    });
  };

  const pick = (i: number) => {
    if (board[i] || busy || result) return;
    sfx("click");
    const nb = board.slice();
    nb[i] = "X";
    setBoard(nb);
    const w1 = winnerOf(nb);
    if (w1 || nb.every(Boolean)) {
      if (w1) sfx("win");
      setTimeout(() => finish(w1 ? w1.who === "X" : null), 700);
      return;
    }
    setBusy(true);
    setTimeout(() => {
      const { move } = minimax(nb.slice(), true);
      if (move >= 0) nb[move] = "O";
      sfx("click");
      setBoard(nb);
      setBusy(false);
      const w2 = winnerOf(nb);
      if (w2 || nb.every(Boolean)) {
        if (w2 && w2.who === "O") sfx("lose");
        setTimeout(() => finish(w2 ? w2.who === "X" : null), 700);
      }
    }, 480);
  };

  return (
    <div className="mx-auto max-w-md select-none">
      <div className="mb-3 flex justify-center gap-2 text-sm">
        <span className="chip">🟢 Tum (X)</span>
        <span className="chip">🤖 AI (O)</span>
        <span className={`chip ${busy ? "border-neon-purple/50 text-neon-purple" : ""}`}>{busy ? "AI soch raha…" : result ? (result.who === "X" ? "🏆 Tum jeetay!" : "AI jeeta") : full ? "Draw!" : "Tumhari chaal"}</span>
      </div>
      <div className="aspect-square">
        <SceneBoundary name="tictactoe-3d">
      <Canvas camera={{ position: [0, 0, 5.6], fov: 45 }} dpr={[1, 1.75]} gl={{ alpha: true }} style={{ background: "transparent" }}>
          <ambientLight intensity={0.7} />
          <pointLight position={[3, 4, 5]} intensity={40} color="#2d7cff" />
          <pointLight position={[-4, -3, 4]} intensity={30} color="#b026ff" />
          {Array.from({ length: 9 }, (_, i) => (
            <Tile key={i} idx={i} onPick={pick} disabled={busy || !!result || endedRef.current} />
          ))}
          {board.map((cell, i) => (
            <XOrO key={`p${i}`} cell={cell} idx={i} hover={false} />
          ))}
        </Canvas>
      </SceneBoundary>
      </div>
      {(result || full) && !endedRef.current && <p className="text-center font-display text-xl font-black text-gradient">{result ? (result.who === "X" ? "Tum jeet gaye! 🏆" : "AI jeet gaya 🤖") : "Barabari!"}</p>}
      <button className="chip mx-auto mt-2 block cursor-pointer hover:text-ink" onClick={() => finish(null)} disabled={endedRef.current}>
        🏳️ Draw maan kar result dekho
      </button>
    </div>
  );
}
