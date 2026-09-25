"use client";

import * as React from "react";

/**
 * React's ViewTransition ships on the canary channel that the App Router
 * runs on, so it isn't in the stable `react` types. Fall back to rendering
 * the children untouched if it isn't there (transitions simply don't play).
 */
const ViewTransition = (
  React as unknown as {
    ViewTransition?: React.ComponentType<{ children: React.ReactNode }>;
  }
).ViewTransition;

/** Crossfades page content on navigation; see globals.css for the animation. */
export function PageTransition({ children }: { children: React.ReactNode }) {
  if (!ViewTransition) return <>{children}</>;
  return <ViewTransition>{children}</ViewTransition>;
}
