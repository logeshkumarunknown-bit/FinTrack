"use client";

import { useSearchParams } from "next/navigation";

/** Reads `?new=<value>` so the sidebar "+ Add" menu can open a form directly. */
export function useNewParam(): string | null {
  return useSearchParams().get("new");
}
