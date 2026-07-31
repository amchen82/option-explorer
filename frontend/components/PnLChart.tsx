"use client";

import { useCallback, useRef, useState } from "react";
import type { StrategyResult } from "@/lib/types";

interface Props {
  strategy: StrategyResult;
  currentPrice: number;
}

function buildPayoff(strategy: StrategyResult, price: number, referencePrice: number): number {
  const premium =
    strategy.premium_collected ?? strategy.net_credit ?? -(strategy.cost ?? strategy.net_debit ?? 0);
  const premiumValue = premium ?? 0;

  switch (strategy.strategy) {
    case "covered_call":
    case "cash_secured_put":
      return premiumValue + Math.min(0, price - (strategy.strike ?? strategy.short_strike ?? price));
    case "protective_put":
      return -Math.max(0, (strategy.strike ?? strategy.long_strike ?? price) - price) - (strategy.cost ?? 0);
    case "collar":
      return (
        premiumValue +
        Math.min(0, price - (strategy.call_strike ?? strategy.short_strike ?? price)) +
        Math.max(0, (strategy.put_strike ?? strategy.long_strike ?? price) - price)
      );
    case "bull_call_spread":
      return (
        -Math.max(0, price - (strategy.short_strike ?? strategy.call_strike ?? price)) +
        Math.max(0, price - (strategy.long_strike ?? strategy.strike ?? price)) +
        premiumValue
      );
    case "bear_put_spread":
      return (
        Math.max(0, (strategy.short_strike ?? strategy.put_strike ?? price) - price) -
        Math.max(0, (strategy.long_strike ?? strategy.strike ?? price) - price) +
        premiumValue
      );
    default:
      return premiumValue + price - referencePrice;
  }
}

function pnlLabel(value: number): string {
  const abs = Math.abs(value).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });
  return value >= 0 ? `+${abs}` : `-${abs}`;
}

interface Segment {
  points: string;
  positive: boolean;
}

function buildSegments(
  prices: number[],
  payoffs: number[],
  toX: (p: number) => number,
  toY: (p: number) => number,
  zeroY: number,
): Segment[] {
  const segments: Segment[] = [];
  let currentSeg: string[] = [];
  let currentPos: boolean | null = null;

  for (let i = 0; i < prices.length; i++) {
    const x = toX(prices[i]);
    const y = toY(payoffs[i]);
    const pos = payoffs[i] >= 0;

    if (currentPos === null) {
      currentPos = pos;
      currentSeg.push(`${x},${y}`);
    } else if (pos !== currentPos) {
      const t = Math.abs(payoffs[i - 1]) / (Math.abs(payoffs[i - 1]) + Math.abs(payoffs[i]));
      const crossX = toX(prices[i - 1]) + t * (toX(prices[i]) - toX(prices[i - 1]));
      currentSeg.push(`${crossX},${zeroY}`);
      segments.push({ points: currentSeg.join(" "), positive: currentPos });
      currentSeg = [`${crossX},${zeroY}`, `${x},${y}`];
      currentPos = pos;
    } else {
      currentSeg.push(`${x},${y}`);
    }
  }

  if (currentSeg.length > 1) {
    segments.push({ points: currentSeg.join(" "), positive: currentPos! });
  }

  return segments;
}

export default function PnLChart({ strategy, currentPrice }: Props) {
  const [selectedPrice, setSelectedPrice] = useState(currentPrice);
  const sliderRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const width = 360;
  const height = 160;
  const padding = { top: 16, right: 18, bottom: 24, left: 18 };

  const anchorPrice = Math.max(currentPrice, strategy.strike ?? currentPrice);
  const span = Math.max(anchorPrice * 0.2, 5);
  const low = Math.max(0.01, anchorPrice - span);
  const high = anchorPrice + span;
  const samples = 80;

  const prices = Array.from({ length: samples }, (_, i) => low + ((high - low) * i) / (samples - 1));
  const payoffs = prices.map((price) => buildPayoff(strategy, price, currentPrice));
  const minPnl = Math.min(...payoffs, 0);
  const maxPnl = Math.max(...payoffs, 0);
  const range = Math.max(maxPnl - minPnl, 1);
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const toX = (price: number) => padding.left + ((price - low) / (high - low)) * chartWidth;
  const toY = (pnl: number) => padding.top + ((maxPnl - pnl) / range) * chartHeight;
  const zeroY = toY(0);

  const segments = buildSegments(prices, payoffs, toX, toY, zeroY);

  const clampedPrice = Math.max(low, Math.min(high, selectedPrice));
  const selectedPayoff = buildPayoff(strategy, clampedPrice, currentPrice);
  const selectedX = toX(clampedPrice);
  const selectedY = toY(selectedPayoff);
  const isProfit = selectedPayoff >= 0;

  // Convert a clientX position into a price value using the same coordinate
  // space as the SVG — guarantees the thumb and the dot stay in sync.
  const clientXToPrice = useCallback((clientX: number) => {
    const rect = sliderRef.current?.getBoundingClientRect();
    if (!rect) return selectedPrice;
    const svgX = ((clientX - rect.left) / rect.width) * width;
    const raw = low + ((svgX - padding.left) / chartWidth) * (high - low);
    return Math.max(low, Math.min(high, raw));
  }, [low, high, chartWidth, padding.left, selectedPrice]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    setSelectedPrice(clientXToPrice(e.clientX));
  }, [clientXToPrice]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    setSelectedPrice(clientXToPrice(e.clientX));
  }, [clientXToPrice]);

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  // Thumb and fill positions expressed as % of the SVG viewBox width
  const thumbPct = (selectedX / width) * 100;
  const trackLeftPct = (padding.left / width) * 100;
  const trackRightPct = (padding.right / width) * 100;
  const fillWidthPct = ((selectedX - padding.left) / width) * 100;

  const thumbColor = isProfit ? "var(--text-positive)" : "var(--text-negative)";

  return (
    <div className="rounded border border-[var(--tv-border)] bg-[var(--tv-bg)] p-3">
      {/* Header */}
      <div className="mb-2 flex items-center justify-between text-[11px] uppercase tracking-[0.22em]">
        <span className="text-[var(--text-label)]">Estimated payoff</span>
        <span className={`font-semibold tracking-normal ${isProfit ? "text-[var(--text-positive)]" : "text-[var(--text-negative)]"}`}>
          {pnlLabel(selectedPayoff)}{" "}
          <span className="text-[var(--text-tertiary)]">@ ${clampedPrice.toFixed(2)}</span>
        </span>
      </div>

      {/* Chart */}
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[160px] w-full">
        <line
          x1={padding.left} y1={zeroY}
          x2={width - padding.right} y2={zeroY}
          style={{ stroke: "var(--tv-border)" }}
          strokeWidth={1} strokeDasharray="4 4"
        />
        {segments.map((seg, i) => {
          const pts = seg.points.split(" ");
          const firstX = pts[0].split(",")[0];
          const lastX = pts[pts.length - 1].split(",")[0];
          return (
            <polygon
              key={`fill-${i}`}
              points={`${firstX},${zeroY} ${seg.points} ${lastX},${zeroY}`}
              style={{ fill: seg.positive ? "var(--text-positive)" : "var(--text-negative)" }}
              fillOpacity={0.13}
            />
          );
        })}
        {segments.map((seg, i) => (
          <polyline
            key={`line-${i}`}
            points={seg.points}
            fill="none"
            style={{ stroke: seg.positive ? "var(--text-positive)" : "var(--text-negative)" }}
            strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
          />
        ))}
        <line
          x1={selectedX} y1={padding.top}
          x2={selectedX} y2={height - padding.bottom}
          style={{ stroke: thumbColor }}
          strokeWidth={1} strokeDasharray="3 3" strokeOpacity={0.7}
        />
        <circle cx={selectedX} cy={selectedY} r={3.5} style={{ fill: thumbColor }} />
        <text x={padding.left} y={height - 6} style={{ fill: "var(--text-tertiary)" }} fontSize={10}>
          ${low.toFixed(0)}
        </text>
        <text x={width - padding.right - 28} y={height - 6} style={{ fill: "var(--text-tertiary)" }} fontSize={10}>
          ${high.toFixed(0)}
        </text>
      </svg>

      {/* Custom slider — uses the same coordinate math as the SVG */}
      <div
        className="relative mt-1"
        style={{
          height: "20px",
          overflow: "hidden"
        }}
      >
        <div
          ref={sliderRef}
          className="relative h-full w-full cursor-pointer select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          {/* Track */}
          <div
            className="absolute rounded-full"
            style={{
              left: `${trackLeftPct}%`,
              right: `${trackRightPct}%`,
              top: "50%",
              transform: "translateY(-50%)",
              height: "2px",
              background: "var(--tv-border)",
            }}
          />
          {/* Filled portion */}
          <div
            className="absolute rounded-full"
            style={{
              left: `${trackLeftPct}%`,
              width: `${fillWidthPct}%`,
              top: "50%",
              transform: "translateY(-50%)",
              height: "2px",
              background: thumbColor,
            }}
          />
          {/* Thumb — center is at the exact same x% as the SVG dot */}
          <div
            className="absolute rounded-full"
            style={{
              left: `${thumbPct}%`,
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: "12px",
              height: "12px",
              background: thumbColor,
              boxShadow: `0 0 6px ${thumbColor}80`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
