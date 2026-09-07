"use client";

import React from "react";
import { captureException } from "@/lib/observability";
import { Ustad } from "@/components/brand/ustad";

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
          <div className="grid min-h-[240px] w-full place-items-center rounded-card border border-line bg-surface-2 px-6 py-8 text-center">
            <div className="flex flex-col items-center gap-3">
              <Ustad className="h-20 w-auto" mood="happy" />
              <p className="max-w-xs text-sm text-muted">
                3D is not available on this device — lightweight mode enabled.
              </p>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
