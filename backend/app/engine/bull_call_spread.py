from __future__ import annotations

from datetime import date, timedelta

from app.engine.base import BaseStrategy
from app.engine.options_math import black_scholes_price

_TARGET_DTES = (30, 45)


def _next_friday(days_out: int) -> date:
    target = date.today() + timedelta(days=days_out)
    return target + timedelta(days=(4 - target.weekday()) % 7)


class BullCallSpreadStrategy(BaseStrategy):
    def analyze(self, position: dict, market_data: dict) -> list[dict]:
        symbol = position.get("symbol", "")
        current_price = float(market_data["price"])
        iv = float(market_data.get("current_iv", 0.25))
        iv_rank = float(market_data.get("iv_rank", 50.0))

        results: list[dict] = []
        for dte in _TARGET_DTES:
            expiration = _next_friday(dte)
            time_to_expiry = dte / 365.0
            long_strike = round(current_price * 1.01, 0)
            short_strike = round(current_price * 1.07, 0)
            long_premium = float(black_scholes_price(current_price, long_strike, time_to_expiry, 0.05, iv, "call"))
            short_premium = float(black_scholes_price(current_price, short_strike, time_to_expiry, 0.05, iv, "call"))
            net_debit = long_premium - short_premium

            results.append(
                {
                    "strategy": "bull_call_spread",
                    "symbol": symbol,
                    "action": f"Buy ${long_strike:.0f} Call / Sell ${short_strike:.0f} Call, exp {expiration.isoformat()}",
                    "long_strike": long_strike,
                    "short_strike": short_strike,
                    "expiration": expiration.isoformat(),
                    "dte": dte,
                    "net_debit": round(net_debit, 2),
                    "max_profit": round((short_strike - long_strike - net_debit) * 100, 2),
                    "max_loss": round(-net_debit * 100, 2),
                    "breakeven": round(long_strike + net_debit, 2),
                    "timing_signals": {"iv_rank": iv_rank},
                    "recommendation_strength": "moderate",
                }
            )

        return results
