from __future__ import annotations

from datetime import date, timedelta

from app.engine.base import BaseStrategy
from app.engine.options_math import black_scholes_price, calculate_greeks, prob_profit_from_delta
from app.engine.technicals import earnings_days_away

_TARGET_DTES = (21, 28, 35, 42)


def _next_friday(days_out: int) -> date:
    target = date.today() + timedelta(days=days_out)
    return target + timedelta(days=(4 - target.weekday()) % 7)


def _recommendation_strength(iv_rank: float, above_50dma: bool) -> str:
    if iv_rank >= 50 and above_50dma:
        return "strong"
    if iv_rank >= 30:
        return "moderate"
    return "weak"


class CoveredCallStrategy(BaseStrategy):
    def analyze(self, position: dict, market_data: dict) -> list[dict]:
        shares = float(position.get("shares", 0))
        if shares < 100:
            return []

        symbol = position["symbol"]
        current_price = float(market_data["price"])
        cost_basis = float(position.get("cost_basis", current_price))
        iv = float(market_data.get("current_iv", 0.25))
        iv_rank = float(market_data.get("iv_rank", 50.0))
        rsi_14 = float(market_data.get("rsi_14", 50.0))
        above_50dma = bool(market_data.get("above_50dma", True))
        earnings_date = market_data.get("earnings_date")
        earnings_days = earnings_days_away(earnings_date)

        strike = round(current_price * 1.06, 0)
        recommendation_strength = _recommendation_strength(iv_rank, above_50dma)
        contract_count = int(shares // 100)
        results: list[dict] = []

        for dte in _TARGET_DTES:
            expiration = _next_friday(dte)
            time_to_expiry = dte / 365.0
            premium = round(float(black_scholes_price(current_price, strike, time_to_expiry, 0.05, iv, "call")), 2)
            greeks = calculate_greeks(current_price, strike, time_to_expiry, 0.05, iv, "call")
            prob_profit = prob_profit_from_delta(greeks["delta"], "short_call")

            results.append(
                {
                    "strategy": "covered_call",
                    "symbol": symbol,
                    "action": f"Sell {contract_count}x {symbol} ${strike:.0f} Call, exp {expiration.isoformat()}",
                    "strike": strike,
                    "expiration": expiration.isoformat(),
                    "dte": dte,
                    "premium_collected": premium,
                    "max_profit": round((strike - cost_basis + premium) * shares, 2),
                    "max_loss": round(-(cost_basis - premium) * shares, 2),
                    "breakeven": round(cost_basis - premium, 2),
                    "prob_profit": round(float(prob_profit), 4),
                    "greeks": greeks,
                    "timing_signals": {
                        "iv_rank": iv_rank,
                        "earnings_days_away": earnings_days,
                        "rsi_14": rsi_14,
                        "above_50dma": above_50dma,
                    },
                    "recommendation_strength": recommendation_strength,
                }
            )

        strength_order = {"strong": 0, "moderate": 1, "weak": 2}
        results.sort(key=lambda result: (strength_order[result["recommendation_strength"]], result["dte"]))
        return results
