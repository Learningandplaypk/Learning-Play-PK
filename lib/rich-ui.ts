/**
 * richUI = desktop (≥1024px) AND not prefers-reduced-motion AND not Lite mode
 * AND deviceMemory ≥ 4 (if known). Mobile / low-end get the same layout with
 * static art and simple fades.
 */
export type RichUiInput = {
  width: number;
  reducedMotion: boolean;
  lite: boolean;
  deviceMemory?: number;
};

export function computeRichUI(input: RichUiInput): boolean {
  if (input.lite) return false;
  if (input.reducedMotion) return false;
  if (input.width < 1024) return false;
  if (typeof input.deviceMemory === "number" && input.deviceMemory < 4) return false;
  return true;
}
