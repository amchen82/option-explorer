"use client";

import { useId } from "react";

interface Props {
  text: string;
  children: React.ReactNode;
}

export default function Tooltip({ text, children }: Props) {
  const id = useId();

  return (
    <span className="group relative inline-flex items-center gap-1">
      <span
        tabIndex={0}
        aria-describedby={id}
        onClick={(event) => event.stopPropagation()}
        className="cursor-help border-b border-dotted border-[var(--text-tertiary)] outline-none focus-visible:border-[var(--text-accent)]"
      >
        {children}
      </span>
      <span
        role="tooltip"
        id={id}
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 w-56 -translate-x-1/2 scale-95 rounded-lg border border-[var(--tv-border)] bg-[var(--tv-surface-3)] px-3 py-2 text-xs font-normal normal-case leading-relaxed tracking-normal text-[var(--text-secondary)] opacity-0 shadow-lg transition duration-100 group-hover:scale-100 group-hover:opacity-100 group-focus-within:scale-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
