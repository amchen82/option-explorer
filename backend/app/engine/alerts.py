from __future__ import annotations

from datetime import date

from app.engine.technicals import earnings_days_away

_HIGH_IV_RANK_THRESHOLD = 50.0
_STOCK_GAIN_THRESHOLD = 0.10
_EARNINGS_WARNING_DAYS = 14
_EXPIRY_WARNING_DAYS = 7


def check_proactive_alerts(position: dict, market_data: dict, existing_options: list) -> list[dict]:
    """Return alert dicts for a position."""
    alerts: list[dict] = []
    current_price = float(market_data.get("price", 0))
    cost_basis = float(position.get("cost_basis", current_price))
    iv_rank = float(market_data.get("iv_rank", 0))
    earnings_date = market_data.get("earnings_date")
    symbol = str(position.get("symbol", ""))

    if iv_rank >= _HIGH_IV_RANK_THRESHOLD:
        alerts.append(
            {
                "type": "high_iv_rank",
                "message": f"{symbol} IV Rank is {iv_rank:.0f} - elevated volatility, good time to sell premium",
                "severity": "info",
            }
        )

    if cost_basis > 0:
        gain_pct = (current_price - cost_basis) / cost_basis
        if gain_pct >= _STOCK_GAIN_THRESHOLD:
            alerts.append(
                {
                    "type": "stock_up_consider_covered_call",
                    "message": f"{symbol} is up {gain_pct * 100:.1f}% from cost basis - consider a covered call or collar",
                    "severity": "info",
                }
            )

    days_to_earnings = earnings_days_away(earnings_date)
    if days_to_earnings is not None and 0 < days_to_earnings <= _EARNINGS_WARNING_DAYS:
        alerts.append(
            {
                "type": "earnings_approaching",
                "message": f"{symbol} earnings in {days_to_earnings} days - consider hedging before the event",
                "severity": "warning",
            }
        )

    for opt in existing_options:
        try:
            expiry = date.fromisoformat(opt["expiration"])
            days_left = (expiry - date.today()).days
        except (KeyError, TypeError, ValueError):
            continue

        if 0 < days_left <= _EXPIRY_WARNING_DAYS:
            alerts.append(
                {
                    "type": "option_expiring_soon",
                    "message": (
                        f"{opt['symbol']} ${opt['strike']} {str(opt['contract_type']).upper()} "
                        f"expires in {days_left} days"
                    ),
                    "severity": "warning",
                }
            )

    return alerts
