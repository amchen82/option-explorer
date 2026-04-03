from __future__ import annotations

from datetime import date, timedelta

from app.engine.base import BaseStrategy
from app.engine.options_math import black_scholes_price, calculate_greeks

_TARGET_DTES = (30, 60, 90)


def _next_friday(days_out: int) -> date:
    target = date.today() + timedelta(days=days_out)
    return target + timedelta(days=(4 - target.weekday()) % 7)


class ProtectivePutStrategy(BaseStrategy):
    def analyze(self, position: dict, market_data: dict) -> list[dict]:
        shares = float(position.get("shares", 0))
        if shares < 100:
            return []

        symbol = position.get("symbol", "")
        current_price = float(market_data["price"])
        iv = float(market_data.get("current_iv", 0.25))
        iv_rank = float(market_data.get("iv_rank", 50.0))

        results: list[dict] = []
        for dte in _TARGET_DTES:
            expiration = _next_friday(dte)
            time_to_expiry = dte / 365.0
            strike = round(current_price * 0.95, 0)
            cost_per_share = float(black_scholes_price(current_price, strike, time_to_expiry, 0.05, iv, "put"))
            greeks = calculate_greeks(current_price, strike, time_to_expiry, 0.05, iv, "put")

            results.append(
                {
                    "strategy": "protective_put",
                    "symbol": symbol,
                    "action": f"Buy {int(shares // 100)}x {symbol} ${strike:.0f} Put, exp {expiration.isoformat()}",
                    "strike": strike,
                    "expiration": expiration.isoformat(),
                    "dte": dte,
                    "cost": round(-(cost_per_share * shares), 2),
                    "cost_per_share": round(-cost_per_share, 2),
                    "protected_below": strike,
                    "max_loss_with_hedge": round(-(current_price - strike + cost_per_share) * shares, 2),
                    "greeks": greeks,
                    "timing_signals": {"iv_rank": iv_rank},
                    "recommendation_strength": "strong" if iv_rank < 30 else "moderate",
                }
            )

        return results
