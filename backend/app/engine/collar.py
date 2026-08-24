from __future__ import annotations

from datetime import date, timedelta

from app.engine.base import BaseStrategy
from app.engine.options_math import black_scholes_price, calculate_greeks

_TARGET_DTES = (30, 45, 60)


def _next_friday(days_out: int) -> date:
    target = date.today() + timedelta(days=days_out)
    return target + timedelta(days=(4 - target.weekday()) % 7)


class CollarStrategy(BaseStrategy):
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
            call_strike = round(current_price * 1.06, 0)
            put_strike = round(current_price * 0.95, 0)
            call_premium = float(black_scholes_price(current_price, call_strike, time_to_expiry, 0.05, iv, "call"))
            put_cost = float(black_scholes_price(current_price, put_strike, time_to_expiry, 0.05, iv, "put"))
            call_greeks = calculate_greeks(current_price, call_strike, time_to_expiry, 0.05, iv, "call")

            results.append(
                {
                    "strategy": "collar",
                    "symbol": symbol,
                    "action": f"Sell ${call_strike:.0f} Call + Buy ${put_strike:.0f} Put, exp {expiration.isoformat()}",
                    "call_strike": call_strike,
                    "put_strike": put_strike,
                    "expiration": expiration.isoformat(),
                    "dte": dte,
                    "net_credit": round(call_premium - put_cost, 2),
                    "call_premium": round(call_premium, 2),
                    "put_cost": round(put_cost, 2),
                    "upside_cap": call_strike,
                    "downside_floor": put_strike,
                    "greeks": call_greeks,
                    "timing_signals": {"iv_rank": iv_rank},
                    "recommendation_strength": "strong" if iv_rank >= 40 else "moderate",
                }
            )

        return results
