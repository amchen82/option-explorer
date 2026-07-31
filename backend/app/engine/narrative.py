from __future__ import annotations

"""Plain-English explanations for market bias, volatility, Greeks, and risks.

Every function here is pure: no I/O, no network, no clock beyond what callers
pass in. Wording can be revised without touching any math, and each sentence is
directly testable.

Audience is beginners, so jargon is defined the first time it appears in any
single explanation rather than assumed.
"""

CONTRACT_MULTIPLIER = 100


def _clamp(value: float, low: float = -1.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def _money(value: float) -> str:
    """Format a dollar amount without cents for readability."""
    return f"${abs(value):,.0f}"


# ──────────────────────────────────────────────────────────────────────
# Market bias
# ──────────────────────────────────────────────────────────────────────


def _trend_component(above_50dma: bool, above_200dma: bool) -> tuple[float, str]:
    score = (0.5 if above_50dma else -0.5) + (0.5 if above_200dma else -0.5)

    if above_50dma and above_200dma:
        text = "Trading above both the 50- and 200-day averages — the textbook definition of an uptrend."
    elif not above_50dma and not above_200dma:
        text = "Trading below both the 50- and 200-day averages — the trend is down."
    elif above_50dma:
        text = "Above the 50-day average but still below the 200-day — a short-term bounce inside a longer downtrend."
    else:
        text = "Below the 50-day average but still above the 200-day — a pullback inside a longer uptrend."

    return score, text


def _momentum_component(rsi_14: float) -> tuple[float, str]:
    """RSI measures recent gains against recent losses on a 0-100 scale.

    Readings past 70 or under 30 are capped, because an extreme reading signals
    exhaustion as often as it signals continuation.
    """
    if rsi_14 >= 70:
        return 0.3, f"RSI {rsi_14:.0f} — overbought. Momentum is strong but stretched, so chasing it is riskier."
    if rsi_14 <= 30:
        return -0.3, f"RSI {rsi_14:.0f} — oversold. Selling pressure is heavy but may be close to exhausted."

    score = _clamp((rsi_14 - 50.0) / 50.0)

    if rsi_14 >= 55:
        text = f"RSI {rsi_14:.0f} — momentum is positive without being overbought."
    elif rsi_14 <= 45:
        text = f"RSI {rsi_14:.0f} — momentum is negative without being oversold."
    else:
        text = f"RSI {rsi_14:.0f} — momentum is flat, with neither buyers nor sellers in control."

    return score, text


def _range_component(price: float, week_52_high: float, week_52_low: float) -> tuple[float, str]:
    if week_52_high <= week_52_low or price <= 0:
        return 0.0, "Not enough 52-week history to place the current price in its range."

    position = _clamp((price - week_52_low) / (week_52_high - week_52_low), 0.0, 1.0)
    score = position * 2.0 - 1.0
    pct = position * 100.0

    if position >= 0.8:
        text = f"Near the top of its 52-week range ({pct:.0f}% of the way up) — strength, but limited room before resistance."
    elif position <= 0.2:
        text = f"Near the bottom of its 52-week range ({pct:.0f}% of the way up) — weakness, though closer to potential support."
    else:
        text = f"Mid-range, {pct:.0f}% of the way between its 52-week low and high."

    return score, text


def market_bias(signals: dict) -> dict:
    """Return a directional read on the underlying with its supporting drivers.

    The score is the mean of three components, each in [-1, 1]. Every component
    contributes a sentence, so the headline always shows its work.
    """
    price = float(signals.get("price", 0.0))
    rsi_14 = float(signals.get("rsi_14", 50.0))
    above_50dma = bool(signals.get("above_50dma", False))
    above_200dma = bool(signals.get("above_200dma", False))
    week_52_high = float(signals.get("52w_high", 0.0))
    week_52_low = float(signals.get("52w_low", 0.0))

    trend_score, trend_text = _trend_component(above_50dma, above_200dma)
    momentum_score, momentum_text = _momentum_component(rsi_14)
    range_score, range_text = _range_component(price, week_52_high, week_52_low)

    score = _clamp((trend_score + momentum_score + range_score) / 3.0)

    if score >= 0.25:
        bias = "bullish"
        headline = "Strongly bullish" if score >= 0.6 else "Mildly bullish"
    elif score <= -0.25:
        bias = "bearish"
        headline = "Strongly bearish" if score <= -0.6 else "Mildly bearish"
    else:
        bias = "neutral"
        headline = "Neutral / rangebound"

    return {
        "bias": bias,
        "score": round(score, 3),
        "headline": headline,
        "drivers": [trend_text, momentum_text, range_text],
    }


# ──────────────────────────────────────────────────────────────────────
# Volatility
# ──────────────────────────────────────────────────────────────────────


def explain_volatility(signals: dict) -> dict:
    """Describe the current option-pricing environment in plain English."""
    current_iv = float(signals.get("current_iv", 0.0))
    rank = float(signals.get("iv_rank", 0.0))
    hv_20 = float(signals.get("hv_20", 0.0))
    iv_vs_hv = round(current_iv / hv_20, 2) if hv_20 > 0 else 1.0

    if rank >= 70:
        regime, implication = "high", "favors_selling"
        headline = "Options are expensive right now"
    elif rank >= 45:
        regime, implication = "elevated", "favors_selling"
        headline = "Options are pricier than usual"
    elif rank >= 25:
        regime, implication = "normal", "neutral"
        headline = "Option pricing is around average"
    else:
        regime, implication = "low", "favors_buying"
        headline = "Options are cheap right now"

    detail = (
        f"Implied volatility is the market's forecast for how much this stock will move. "
        f"An IV rank of {rank:.0f} means it is currently higher than it was on {rank:.0f}% of days "
        f"in the past year."
    )

    if implication == "favors_selling":
        detail += " Strategies that sell options collect more premium than usual; buyers are paying up."
    elif implication == "favors_buying":
        detail += " Strategies that buy options cost less than usual; sellers are collecting less."
    else:
        detail += " Neither buying nor selling options is especially favored on price alone."

    if iv_vs_hv >= 1.15:
        comparison = (
            f"Options are priced for {iv_vs_hv:.2f}x more movement than the stock has actually "
            f"delivered over the past month — a premium that rewards sellers if it does not materialize."
        )
    elif iv_vs_hv <= 0.9:
        comparison = (
            f"Options are priced for less movement than the stock has actually delivered recently "
            f"({iv_vs_hv:.2f}x) — comparatively cheap for buyers."
        )
    else:
        comparison = "Option pricing is roughly in line with how much the stock has actually been moving."

    return {
        "current_iv": round(current_iv, 4),
        "iv_rank": round(rank, 2),
        "hv_20": round(hv_20, 4),
        "iv_vs_hv": iv_vs_hv,
        "regime": regime,
        "implication": implication,
        "headline": headline,
        "detail": detail,
        "comparison": comparison,
    }


# ──────────────────────────────────────────────────────────────────────
# Greeks
# ──────────────────────────────────────────────────────────────────────


def explain_greeks(net_greeks: dict, symbol: str, prob_itm: float | None = None) -> list[dict]:
    """Explain net position Greeks in the dollar terms a holder actually feels.

    net_greeks are signed per-share sums across every leg, already multiplied by
    each leg's contract count. Multiplying by 100 converts them to position
    dollars, which is what gets explained: a user feels "this loses $12 a day",
    not "theta is -0.04".
    """
    delta = float(net_greeks.get("delta", 0.0))
    gamma = float(net_greeks.get("gamma", 0.0))
    theta = float(net_greeks.get("theta", 0.0))
    vega = float(net_greeks.get("vega", 0.0))

    delta_dollars = delta * CONTRACT_MULTIPLIER
    theta_dollars = theta * CONTRACT_MULTIPLIER
    vega_dollars = vega * CONTRACT_MULTIPLIER
    share_equivalent = abs(delta_dollars)

    if delta >= 0:
        delta_plain = (
            f"Gains about {_money(delta_dollars)} for every $1 {symbol} rises, and loses the same if it falls. "
            f"That is similar to owning {share_equivalent:.0f} shares."
        )
    else:
        delta_plain = (
            f"Gains about {_money(delta_dollars)} for every $1 {symbol} falls, and loses the same if it rises. "
            f"That is similar to being short {share_equivalent:.0f} shares."
        )

    if prob_itm is not None:
        delta_plain += f" Delta also approximates the odds of finishing in the money: about {prob_itm * 100:.0f}%."

    if abs(gamma) < 0.005:
        gamma_plain = "Directional exposure stays fairly steady as the stock moves — no sharp acceleration either way."
    elif gamma >= 0:
        gamma_plain = (
            "Directional exposure grows as the stock moves in your favor and shrinks when it moves against you. "
            "This works for you, and is what you paid for."
        )
    else:
        gamma_plain = (
            "Directional exposure grows as the stock moves against you and shrinks when it moves your way. "
            "This works against you, and is the trade-off for collecting premium."
        )

    if theta >= 0:
        theta_plain = (
            f"Time is on your side: the position gains roughly {_money(theta_dollars)} per day from time passing "
            f"alone, assuming nothing else changes."
        )
    else:
        theta_plain = (
            f"Time works against you: the position loses roughly {_money(theta_dollars)} per day from time passing "
            f"alone, even if {symbol} does not move."
        )

    if vega >= 0:
        vega_plain = (
            f"Gains about {_money(vega_dollars)} for every 1-point rise in implied volatility, and loses the same "
            f"if volatility falls. Rising fear helps this position."
        )
    else:
        vega_plain = (
            f"Loses about {_money(vega_dollars)} for every 1-point rise in implied volatility, and gains the same "
            f"if volatility falls. Calming markets help this position."
        )

    return [
        {"greek": "delta", "label": "Delta", "value": round(delta, 4), "dollars": round(delta_dollars, 2), "plain": delta_plain},
        {"greek": "gamma", "label": "Gamma", "value": round(gamma, 4), "dollars": None, "plain": gamma_plain},
        {"greek": "theta", "label": "Theta", "value": round(theta, 4), "dollars": round(theta_dollars, 2), "plain": theta_plain},
        {"greek": "vega", "label": "Vega", "value": round(vega, 4), "dollars": round(vega_dollars, 2), "plain": vega_plain},
    ]


# ──────────────────────────────────────────────────────────────────────
# Risks
# ──────────────────────────────────────────────────────────────────────


def describe_risks(idea: dict, signals: dict, data_quality: str = "live") -> list[str]:
    """List what can go wrong with an idea, in the order it matters."""
    risks: list[str] = []

    symbol = idea.get("symbol", "the stock")
    dte = int(idea.get("dte", 0))
    net = float(idea.get("net_debit_credit", 0.0))
    max_loss = float(idea.get("max_loss", 0.0))
    earnings_days = signals.get("earnings_days_away")

    if earnings_days is not None and 0 <= int(earnings_days) <= dte:
        risks.append(
            f"Earnings land in {int(earnings_days)} days, before this expires. Expect a sharp move and a drop in "
            f"implied volatility right afterward — that hurts option buyers and can whipsaw sellers."
        )

    if net > 0:  # net credit — the position was opened by selling
        risks.append(
            "Because this collects premium up front, the most you can make is fixed while losses can be larger. "
            "Size it by what you could lose, not by what you collect."
        )
        risks.append(
            "Short options can be assigned early, especially near a dividend date, which would leave you with the "
            "underlying stock position."
        )
    else:
        risks.append(
            f"This is a debit trade: the {_money(net)} you pay is at risk in full if {symbol} does not move enough "
            f"before expiration."
        )
        risks.append(
            "Options expire. If the stock goes nowhere, time decay alone erodes this position toward zero."
        )

    if max_loss <= -10_000:
        risks.append(
            f"Worst case here is roughly {_money(max_loss)}. Confirm that is capital you can genuinely afford to lose."
        )

    liquidity = idea.get("liquidity", {})
    if data_quality == "live" and liquidity:
        if float(liquidity.get("spread_pct", 0.0)) >= 0.10:
            risks.append(
                "The bid/ask spread on these contracts is wide, so you lose meaningful value just entering and "
                "exiting. Use limit orders."
            )
        if int(liquidity.get("min_open_interest", 0)) < 100:
            risks.append(
                "Open interest is thin, meaning few other traders hold these contracts. Getting filled at a fair "
                "price may be difficult."
            )

    if data_quality == "modeled":
        risks.append(
            "Live option quotes were unavailable, so these strikes and premiums are calculated estimates rather "
            "than tradeable market prices. Verify against your broker before acting."
        )

    return risks
