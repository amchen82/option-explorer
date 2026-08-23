"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Slide {
  src: string;
  alt: string;
  title: string;
  description: string;
  href: string;
}

const slides: Slide[] = [
  {
    src: "/screenshots/ideas.png",
    alt: "Option Ideas strategy explorer showing trade cards for a ticker",
    title: "Compare strategy ideas side by side",
    description: "Every card shows max profit, max loss, probability of profit, and capital required.",
    href: "/ideas",
  },
  {
    src: "/screenshots/tutorial.png",
    alt: "Tutorial page explaining options fundamentals",
    title: "Learn the fundamentals",
    description: "Vocabulary, moneyness, time decay, and the four foundational strategies, explained plainly.",
    href: "/tutorial",
  },
  {
    src: "/screenshots/how-to.png",
    alt: "How To page walking through the app in four steps",
    title: "Get started in four steps",
    description: "A quick walkthrough of picking a ticker, reading the snapshot, and comparing trades.",
    href: "/how-to",
  },
  {
    src: "/screenshots/faq.png",
    alt: "FAQ page answering common options questions",
    title: "Answers to common questions",
    description: "From “what does one contract control” to “is a naked short safe for beginners.”",
    href: "/faq",
  },
];

const AUTO_ADVANCE_MS = 4500;

export default function ScreenshotShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) {
      return;
    }

    const timer = setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, AUTO_ADVANCE_MS);

    return () => clearInterval(timer);
  }, [paused]);

  const slide = slides[active];

  return (
    <div
      className="tv-panel rounded-xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <Link
        href={slide.href}
        className="group block overflow-hidden rounded-lg border border-[var(--tv-border)] bg-[var(--tv-surface-2)]"
      >
        <div className="relative aspect-[1440/960] w-full">
          {slides.map((item, index) => (
            <Image
              key={item.src}
              src={item.src}
              alt={item.alt}
              fill
              priority={index === 0}
              sizes="(min-width: 1024px) 768px, 100vw"
              className={`object-cover object-top transition-opacity duration-500 ${
                index === active ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}
        </div>
      </Link>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-base font-semibold text-[var(--text-primary)]">{slide.title}</h3>
          <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{slide.description}</p>
        </div>
        <Link
          href={slide.href}
          className="shrink-0 whitespace-nowrap text-sm font-medium text-[var(--text-accent)] hover:underline"
        >
          View page &rarr;
        </Link>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2">
        {slides.map((item, index) => (
          <button
            key={item.src}
            type="button"
            aria-label={`Show ${item.title}`}
            aria-current={index === active}
            onClick={() => setActive(index)}
            className={`h-1.5 rounded-full transition-all ${
              index === active ? "w-6 bg-[var(--text-accent)]" : "w-1.5 bg-[var(--tv-border)] hover:bg-[var(--text-tertiary)]"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
