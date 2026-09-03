"use client";

import React from "react";
import { captureException } from "@/lib/observability";

/** WebGL support probe — false in sandboxed iframes / blocked GPU / old devices. */
export function hasWebGL(): boolean {
  try {
    if (typeof document === "undefined") return false;
    const canvas = document.createElement("canvas");
    return !!(canvas.getContext("webgl2") ?? canvas.getContext("webgl") ?? canvas.getContext("experimental-webgl"));
  } catch {
    return false;
  }
}

type Props = {
  children: React.ReactNode;
  /** Shown when WebGL is unavailable OR the scene crashes. Same layout slot, graceful degradation. */
  fallback?: React.ReactNode;
  /** Label used in error reports. */
  name?: string;
};

type State = { failed: boolean; webgl: boolean };

/**
 * Per-scene guard: ONE 3D canvas failing must never take down the page.
 * Wrap every R3F <Canvas> with this boundary.
 */
export class SceneBoundary extends React.Component<Props, State> {
  state: State = { failed: false, webgl: true };

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true };
  }

  componentDidCatch(err: Error, info: React.ErrorInfo) {
    captureException(err, { scene: this.props.name ?? "unknown-scene", componentStack: info.componentStack?.slice(0, 500) ?? "" });
  }

  componentDidMount() {
    if (!hasWebGL()) this.setState({ webgl: false, failed: true });
  }

  render() {
    if (this.state.failed) {
      return (
        this.props.fallback ?? (
          <div className="grid min-h-[240px] w-full place-items-center rounded-3xl border border-white/10 bg-gradient-to-br from-bg-800 via-[#101638] to-[#1a0f33] text-center" aria-hidden>
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute left-1/4 top-1/3 h-40 w-40 animate-float rounded-full bg-electric/20 blur-3xl" />
              <div className="absolute right-1/4 bottom-1/4 h-44 w-44 animate-float rounded-full bg-neon-purple/20 blur-3xl [animation-delay:1.2s]" />
            </div>
            <p className="relative text-sm text-muted">⚡ 3D is not available on this device — lightweight mode enabled.</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
