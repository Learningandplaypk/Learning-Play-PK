"use client";

/** Shared scroll state written by GSAP ScrollTrigger, read inside the R3F frame loop. */
export const scrollState = {
  progress: 0, // 0..1 across the whole home experience
  mx: 0,
  my: 0,
};
