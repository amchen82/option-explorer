import type { Metadata } from "next";
import type { ReactNode } from "react";

// Sign-in-gated portfolio utility, not public educational content -- excluded
// from indexing rather than given competing/misleading title, description,
// and canonical metadata it doesn't actually have a public version of.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function ImportLayout({ children }: { children: ReactNode }) {
  return children;
}
