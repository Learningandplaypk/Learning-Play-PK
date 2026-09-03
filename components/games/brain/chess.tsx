"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Move } from "chess.js";
import type { GameProps } from "@/components/game-shell";
import { sfx } from "@/lib/sfx";

const PIECE_GLYPH: Record<string, string> = {
  p: "♟", n: "♞", b: "♝", r: "♜", q: "♛", k: "♚",
  P: "♙", N: "♘", B: "♗", R: "♖", Q: "♕", K: "♔",
};

const VALUES: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };

function evaluate(game: Chess): number {
  // from white's perspective
  let score = 0;
  for (const row of game.board()) {
    for (const sq of row) {
      if (!sq) continue;
      score += sq.color === "w" ? VALUES[sq.type] : -VALUES[sq.type];
    }
  }
  return score;
}

function bestMove(game: Chess, depth: number): Move | null {
  const moves = game.moves({ verbose: true });
  if (!moves.length) return null;
  let best: Move | null = null;
  let bestScore = -Infinity;
  for (const m of moves) {
    game.move(m);
    const score = -negamax(game, depth - 1, -Infinity, Infinity);
    game.undo();
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}

function negamax(game: Chess, depth: number, alpha: number, beta: number): number {
  if (game.isGameOver() || depth === 0) {
    if (game.isCheckmate()) return -10000 - depth;
    if (game.isDraw()) return 0;
    const e = evaluate(game);
    return game.turn() === "w" ? e : -e;
  }
  let value = -Infinity;
  for (const m of game.moves({ verbose: true })) {
    game.move(m);
    value = Math.max(value, -negamax(game, depth - 1, -beta, -alpha));
    game.undo();
    alpha = Math.max(alpha, value);
    if (alpha >= beta) break;
  }
  return value;
}

const FILES = ["a", "b", "c", "d", "e", "f", "g", "h"];

export default function ChessGame({ onEnd }: GameProps) {
  const gameRef = useRef(new Chess());
  const [, setTick] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [status, setStatus] = useState("Aap white khel rahe ho — chalo shuru!");
  const [thinking, setThinking] = useState(false);
  const [startedAt] = useState(() => Date.now());
  const endedRef = useRef(false);
  const game = gameRef.current;

  const legalTargets = useMemo(() => {
    if (!selected) return new Map<string, string>();
    try {
      const map = new Map<string, string>();
      for (const m of game.moves({ square: selected as never, verbose: true }) as Move[]) map.set(m.to, m.flags.includes("c") || m.promotion ? "×" : "•");
      return map;
    } catch {
      return new Map<string, string>();
    }
  }, [selected, game]);

  const finish = (playerWon: boolean | null) => {
    if (endedRef.current) return;
    endedRef.current = true;
    const time = Date.now() - startedAt;
    if (playerWon === true) onEnd({ score: 250, maxScore: 250, accuracy: 1, timeMs: time, flag: "chess-win" });
    else if (playerWon === false) onEnd({ score: 60, maxScore: 250, accuracy: 0.3, timeMs: time });
    else onEnd({ score: 120, maxScore: 250, accuracy: 0.6, timeMs: time });
  };

  const checkEnd = () => {
    if (game.isCheckmate()) {
      setStatus(game.turn() === "w" ? "Checkmate — AI jeeta 💔" : "Checkmate — Tum jeet gaye! 🏆");
      finish(game.turn() !== "w");
      return true;
    }
    if (game.isDraw() || game.isStalemate()) {
      setStatus("Draw — barabar rahe!");
      finish(null);
      return true;
    }
    return false;
  };

  const aiTurn = () => {
    if (game.turn() !== "b" || game.isGameOver()) return;
    setThinking(true);
    setTimeout(() => {
      const m = bestMove(game, 2);
      if (m) {
        game.move(m);
        sfx("click");
      }
      setThinking(false);
      setTick((t) => t + 1);
      if (!checkEnd()) setStatus("Tumhari chaal — white khelo.");
    }, 420);
  };

  const tap = (sq: string) => {
    if (game.turn() !== "w" || thinking || endedRef.current) return;
    if (selected && legalTargets.has(sq)) {
      game.move({ from: selected, to: sq, promotion: "q" });
      sfx("correct");
      setSelected(null);
      setTick((t) => t + 1);
      if (!checkEnd()) aiTurn();
      return;
    }
    const piece = game.get(sq as never);
    if (piece && piece.color === "w") {
      setSelected(sq);
      setStatus(`${PIECE_GLYPH[piece.type]} ${sq} select — green dot par rakho`);
    } else setSelected(null);
  };

  useEffect(() => {
    aiTurn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const board = game.board();

  return (
    <div className="mx-auto max-w-md select-none">
      <div className="mb-3 flex items-center justify-between text-sm">
        <span className="chip">♟️ vs AI (depth 2)</span>
        <span className={`chip ${thinking ? "border-neon-purple/50 text-neon-purple" : ""}`}>{thinking ? "🤖 soch raha…" : status}</span>
      </div>
      <div className="glass overflow-hidden !rounded-2xl p-1.5">
        <div className="grid grid-cols-8">
          {board.map((row, r) =>
            row.map((piece, c) => {
              const sq = `${FILES[c]}${8 - r}`;
              const dark = (r + c) % 2 === 1;
              const isSel = selected === sq;
              const target = legalTargets.get(sq);
              return (
                <button
                  key={sq}
                  onClick={() => tap(sq)}
                  aria-label={`${sq} ${piece ? `${piece.color}${piece.type}` : "empty"}`}
                  className={`relative grid aspect-square place-items-center text-3xl sm:text-4xl ${dark ? "bg-[#151a35]" : "bg-[#232a52]"} ${isSel ? "!bg-electric/40" : ""}`}
                >
                  {piece && (
                    <span className={piece.color === "w" ? "text-white drop-shadow-[0_2px_6px_rgba(0,0,0,.9)]" : "text-neon-purple drop-shadow-[0_0_10px_rgba(176,38,255,.6)]"}>
                      {PIECE_GLYPH[piece.color === "w" ? piece.type.toUpperCase() : piece.type]}
                    </span>
                  )}
                  {target && (
                    <span className={`absolute ${target === "•" ? "h-3 w-3 rounded-full bg-neon-green/80" : "inset-1.5 rounded-xl border-2 border-pink-accent/80"}`} />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
      <p className="mt-3 text-xs text-muted">Pawn ki promotion queen hoti hai. Tum white — neeche se upar chalo.</p>
      <div className="mt-4 flex justify-center gap-2">
        <button className="chip cursor-pointer hover:text-ink" onClick={() => finish(false)} disabled={endedRef.current}>
          🏳️ Haar maan lo (result)
        </button>
      </div>
    </div>
  );
}
