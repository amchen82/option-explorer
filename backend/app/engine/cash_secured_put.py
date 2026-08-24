from __future__ import annotations

from datetime import date, timedelta

from app.engine.base import BaseStrategy
from app.engine.options_math import black_scholes_price, calculate_greeks, prob_profit_from_delta
from app.engine.technicals import earnings_days_away

_TARGET_DTES = (21, 35, 45)


def _next_friday(days_out: int) -> date:
    target = date.today() + timedelta(days=days_out)
    return target + timedelta(days=(4 - target.weekday()) % 7)


def _recommendation_strength(iv_rank: float) -> str:
    if iv_rank >= 50:
        return "strong"
    if iv_rank >= 30:
        return "moderate"
    return "weak"


class CashSecuredPutStrategy(BaseStrategy):
    def analyze(self, position: dict, market_data: dict) -> list[dict]:
        symbol = position.get("symbol", "")
        current_price = float(market_data["price"])
        iv = float(market_data.get("current_iv", 0.25))
        iv_rank = float(market_data.get("iv_rank", 50.0))
        rsi_14 = float(market_data.get("rsi_14", 50.0))
        above_50dma = bool(market_data.get("above_50dma", True))
        earnings_date = market_data.get("earnings_date")
        earnings_days = earnings_days_away(earnings_date)
        recommendation_strength = _recommendation_strength(iv_rank)

        results: list[dict] = []
        for dte in _TARGET_DTES:
            expiration = _next_friday(dte)
            time_to_expiry = dte / 365.0
            strike = round(current_price * 0.94, 0)
            premium = float(black_scholes_price(current_price, strike, time_to_expiry, 0.05, iv, "put"))
            greeks = calculate_greeks(current_price, strike, time_to_expiry, 0.05, iv, "put")
            prob_profit = prob_profit_from_delta(greeks["delta"], "short_put")

            results.append(
                {
                    "strategy": "cash_secured_put",
                    "symbol": symbol,
                    "action": f"Sell 1x {symbol} ${strike:.0f} Put, exp {expiration.isoformat()}",
                    "strike": strike,
                    "expiration": expiration.isoformat(),
                    "dte": dte,
                    "premium_collected": round(premium, 2),
                    "max_profit": round(premium * 100, 2),
                    "max_loss": round(-(strike - premium) * 100, 2),
                    "breakeven": round(strike - premium, 2),
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

        return results
