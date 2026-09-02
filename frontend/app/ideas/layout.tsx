import type { Metadata } from "next";
import type { ReactNode } from "react";

const title = "Options Strategy Finder and Trade Idea Analyzer | Option Ideas";
const description =
  "Enter a stock ticker to compare options strategies using live option-chain data, probability of profit, " +
  "maximum risk, breakeven and Greeks.";

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: "/ideas" },
  openGraph: { title, description, url: "/ideas", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default function IdeasLayout({ children }: { children: ReactNode }) {
  return children;
}
