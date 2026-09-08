/**
 * Nested-safe scroll lock for modal / sheet.
 * Uses a counter so two overlays opening then one closing does not unlock
 * the page, and always restores overflow after the last overlay closes.
 */

const LOCK_CLASS = "scroll-locked";

let lockCount = 0;
let prevBodyPadding = "";

export function getScrollLockCount(): number {
  return lockCount;
}

export function lockScroll(): () => void {
  if (typeof document === "undefined") return () => {};
  lockCount += 1;
  if (lockCount === 1) {
    const doc = document.documentElement;
    const sb = window.innerWidth - doc.clientWidth;
    prevBodyPadding = document.body.style.paddingInlineEnd;
    if (sb > 0) document.body.style.paddingInlineEnd = `${sb}px`;
    doc.classList.add(LOCK_CLASS);
    document.body.classList.add(LOCK_CLASS);
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    unlockScroll();
  };
}

export function unlockScroll(): void {
  if (typeof document === "undefined") return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.documentElement.classList.remove(LOCK_CLASS);
    document.body.classList.remove(LOCK_CLASS);
    document.body.style.paddingInlineEnd = prevBodyPadding;
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }
}

/** Test helper — never call from UI. */
export function resetScrollLockForTests(): void {
  lockCount = 0;
  prevBodyPadding = "";
  if (typeof document !== "undefined") {
    document.documentElement.classList.remove(LOCK_CLASS);
    document.body.classList.remove(LOCK_CLASS);
    document.body.style.paddingInlineEnd = "";
    document.body.style.overflow = "";
    document.documentElement.style.overflow = "";
  }
}
