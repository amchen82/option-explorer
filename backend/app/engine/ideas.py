from __future__ import annotations

"""Generate and rank concrete option trade ideas for a single underlying.

The ranking and the explanation are the same computation. Each scoring component
emits its own rationale sentence as it is calculated, so an idea's stated reasons
can never drift away from why it actually ranked where it did.
"""

from dataclasses import dataclass

from app.engine.narrative import describe_risks, explain_greeks
from app.engine.options_math import calculate_greeks, prob_profit_from_delta
from app.services.option_chain import RISK_FREE_RATE, ChainResult, Contract

CONTRACT_MULTIPLIER = 100

WEIGHT_DIRECTIONAL = 0.40
WEIGHT_VOLATILITY = 0.30
WEIGHT_LIQUIDITY = 0.20
WEIGHT_EARNINGS = 0.10

# A component must move the needle at least this much before it earns a sentence.
RATIONALE_THRESHOLD = 0.15


@dataclass(frozen=True)
class Leg:
    action: str  # "buy" or "sell"
    contract: Contract
    quantity: int = 1

    @property
    def sign(self) -> int:
        return 1 if self.action == "buy" else -1


def _clamp(value: float, low: float = -1.0, high: float = 1.0) -> float:
    return max(low, min(high, value))


def _leg_greeks(contract: Contract, spot: float, dte: int, fallback_iv: float) -> dict:
    iv = contract.implied_volatility if contract.implied_volatility > 0 else fallback_iv
    time_to_expiry = max(dte, 1) / 365.0
    return calculate_greeks(spot, contract.strike, time_to_expiry, RISK_FREE_RATE, iv, contract.contract_type)


def _select_by_delta(
    contracts: list[Contract],
    target_delta: float,
    spot: float,
    dte: int,
    fallback_iv: float,
    exclude_strikes: set[float] | None = None,
) -> Contract | None:
    """Return the contract whose absolute delta sits closest to target_delta."""
    exclude_strikes = exclude_strikes or set()
    best: Contract | None = None
    best_distance = float("inf")

    for contract in contracts:
        if contract.strike in exclude_strikes:
            continue
        if contract.mid <= 0:
            continue

        delta = abs(_leg_greeks(contract, spot, dte, fallback_iv)["delta"])
        if delta <= 0.0 or delta >= 1.0:
            continue

        distance = abs(delta - target_delta)
        if distance < best_distance:
            best_distance = distance
            best = contract

    # Refuse a wildly wrong strike rather than emit a misleading idea.
    if best is None or best_distance > 0.25:
        return None

    return best


def _net_greeks(legs: list[Leg], spot: float, dte: int, fallback_iv: float) -> dict:
    totals = {"delta": 0.0, "gamma": 0.0, "theta": 0.0, "vega": 0.0, "rho": 0.0}

    for leg in legs:
        greeks = _leg_greeks(leg.contract, spot, dte, fallback_iv)
        for key in totals:
            totals[key] += greeks[key] * leg.sign * leg.quantity

    return {key: round(value, 4) for key, value in totals.items()}


def _net_cash(legs: list[Leg]) -> float:
    """Positive means net credit received, negative means net debit paid."""
    total = 0.0
    for leg in legs:
        total += -leg.sign * leg.contract.mid * leg.quantity * CONTRACT_MULTIPLIER
    return round(total, 2)


def _liquidity_profile(legs: list[Leg]) -> dict:
    spreads = [leg.contract.spread_pct for leg in legs]
    open_interest = [leg.contract.open_interest for leg in legs]
    volume = [leg.contract.volume for leg in legs]

    return {
        "spread_pct": round(max(spreads), 4) if spreads else 1.0,
        "min_open_interest": min(open_interest) if open_interest else 0,
        "min_volume": min(volume) if volume else 0,
    }


def _leg_payload(leg: Leg, spot: float, dte: int, fallback_iv: float) -> dict:
    contract = leg.contract
    return {
        "action": leg.action,
        "contract_type": contract.contract_type,
        "strike": contract.strike,
        "expiration": contract.expiration.isoformat(),
        "quantity": leg.quantity,
        "price": round(contract.mid, 2),
        "bid": round(contract.bid, 2),
        "ask": round(contract.ask, 2),
        "implied_volatility": round(contract.implied_volatility, 4),
        "open_interest": contract.open_interest,
        "volume": contract.volume,
        "delta": _leg_greeks(contract, spot, dte, fallback_iv)["delta"],
    }


# ──────────────────────────────────────────────────────────────────────
# Strategy templates
# ──────────────────────────────────────────────────────────────────────


def _build_templates(chain: ChainResult, spot: float, fallback_iv: float, symbol: str) -> list[dict]:
    """Assemble every strategy whose required strikes actually exist in the chain."""
    calls, puts, dte = chain.calls, chain.puts, chain.dte
    pick_call = lambda target, exclude=None: _select_by_delta(calls, target, spot, dte, fallback_iv, exclude)
    pick_put = lambda target, exclude=None: _select_by_delta(puts, target, spot, dte, fallback_iv, exclude)

    templates: list[dict] = []

    # ── Bullish ──────────────────────────────────────────────────────
    long_call = pick_call(0.40)
    if long_call:
        debit = long_call.mid * CONTRACT_MULTIPLIER
        templates.append(
            {
                "strategy": "long_call",
                "name": "Long Call",
                "bias": "bullish",
                "legs": [Leg("buy", long_call)],
                "max_profit": None,
                "max_loss": -debit,
                "breakeven": long_call.strike + long_call.mid,
                "capital_required": debit,
                "requires_shares": 0,
                "pop": prob_profit_from_delta(_leg_greeks(long_call, spot, dte, fallback_iv)["delta"], "long_call"),
                "thesis": "A direct bullish bet with a known, capped cost.",
                "max_profit_when": f"Grows without limit the further {symbol} rises past "
                f"${long_call.strike + long_call.mid:.2f} by expiration.",
                "max_loss_when": f"if {symbol} closes at or below ${long_call.strike:g} at expiration "
                f"(the option expires worthless).",
            }
        )

    bcs_long = pick_call(0.45)
    bcs_short = pick_call(0.25, exclude={bcs_long.strike} if bcs_long else None)
    if bcs_long and bcs_short and bcs_short.strike > bcs_long.strike:
        debit = (bcs_long.mid - bcs_short.mid) * CONTRACT_MULTIPLIER
        if debit > 0:
            width = (bcs_short.strike - bcs_long.strike) * CONTRACT_MULTIPLIER
            outright = bcs_long.mid * CONTRACT_MULTIPLIER
            savings = (1 - debit / outright) * 100 if outright > 0 else 0.0
            templates.append(
                {
                    "strategy": "bull_call_spread",
                    "name": "Bull Call Spread",
                    "bias": "bullish",
                    "legs": [Leg("buy", bcs_long), Leg("sell", bcs_short)],
                    "max_profit": width - debit,
                    "max_loss": -debit,
                    "breakeven": bcs_long.strike + debit / CONTRACT_MULTIPLIER,
                    "capital_required": debit,
                    "requires_shares": 0,
                    "pop": prob_profit_from_delta(_leg_greeks(bcs_long, spot, dte, fallback_iv)["delta"], "long_call"),
                    "thesis": f"Capping the upside at ${bcs_short.strike:g} cuts the cost {savings:.0f}% "
                    f"versus buying the call outright.",
                    "max_profit_when": f"if {symbol} closes at or above ${bcs_short.strike:g} at expiration.",
                    "max_loss_when": f"if {symbol} closes at or below ${bcs_long.strike:g} at expiration "
                    f"(both legs expire worthless).",
                }
            )

    csp = pick_put(0.30)
    if csp:
        credit = csp.mid * CONTRACT_MULTIPLIER
        templates.append(
            {
                "strategy": "cash_secured_put",
                "name": "Cash-Secured Put",
                "bias": "bullish",
                "legs": [Leg("sell", csp)],
                "max_profit": credit,
                "max_loss": -(csp.strike * CONTRACT_MULTIPLIER - credit),
                "breakeven": csp.strike - csp.mid,
                "capital_required": csp.strike * CONTRACT_MULTIPLIER,
                "requires_shares": 0,
                "pop": prob_profit_from_delta(_leg_greeks(csp, spot, dte, fallback_iv)["delta"], "short_put"),
                "thesis": f"Get paid to wait. If assigned you buy the stock at an effective "
                f"${csp.strike - csp.mid:.2f}, below today's ${spot:.2f}.",
                "max_profit_when": f"if {symbol} closes at or above ${csp.strike:g} at expiration "
                f"(the put expires worthless and you keep the premium).",
                "max_loss_when": f"if {symbol} falls to $0 by expiration "
                f"(worst case — you're assigned the stock at ${csp.strike:g}).",
            }
        )

    # ── Bearish ──────────────────────────────────────────────────────
    long_put = pick_put(0.40)
    if long_put:
        debit = long_put.mid * CONTRACT_MULTIPLIER
        templates.append(
            {
                "strategy": "long_put",
                "name": "Long Put",
                "bias": "bearish",
                "legs": [Leg("buy", long_put)],
                "max_profit": long_put.strike * CONTRACT_MULTIPLIER - debit,
                "max_loss": -debit,
                "breakeven": long_put.strike - long_put.mid,
                "capital_required": debit,
                "requires_shares": 0,
                "pop": prob_profit_from_delta(_leg_greeks(long_put, spot, dte, fallback_iv)["delta"], "long_put"),
                "thesis": "A direct bearish bet, and the cost is the most you can lose.",
                "max_profit_when": f"if {symbol} falls to $0 by expiration.",
                "max_loss_when": f"if {symbol} closes at or above ${long_put.strike:g} at expiration "
                f"(the option expires worthless).",
            }
        )

    bps_long = pick_put(0.45)
    bps_short = pick_put(0.25, exclude={bps_long.strike} if bps_long else None)
    if bps_long and bps_short and bps_short.strike < bps_long.strike:
        debit = (bps_long.mid - bps_short.mid) * CONTRACT_MULTIPLIER
        if debit > 0:
            width = (bps_long.strike - bps_short.strike) * CONTRACT_MULTIPLIER
            templates.append(
                {
                    "strategy": "bear_put_spread",
                    "name": "Bear Put Spread",
                    "bias": "bearish",
                    "legs": [Leg("buy", bps_long), Leg("sell", bps_short)],
                    "max_profit": width - debit,
                    "max_loss": -debit,
                    "breakeven": bps_long.strike - debit / CONTRACT_MULTIPLIER,
                    "capital_required": debit,
                    "requires_shares": 0,
                    "pop": prob_profit_from_delta(_leg_greeks(bps_long, spot, dte, fallback_iv)["delta"], "long_put"),
                    "thesis": f"A defined-risk bearish bet that pays out fully below ${bps_short.strike:g}.",
                    "max_profit_when": f"if {symbol} closes at or below ${bps_short.strike:g} at expiration.",
                    "max_loss_when": f"if {symbol} closes at or above ${bps_long.strike:g} at expiration "
                    f"(both legs expire worthless).",
                }
            )

    bcall_short = pick_call(0.30)
    bcall_long = pick_call(0.15, exclude={bcall_short.strike} if bcall_short else None)
    if bcall_short and bcall_long and bcall_long.strike > bcall_short.strike:
        credit = (bcall_short.mid - bcall_long.mid) * CONTRACT_MULTIPLIER
        if credit > 0:
            width = (bcall_long.strike - bcall_short.strike) * CONTRACT_MULTIPLIER
            templates.append(
                {
                    "strategy": "bear_call_spread",
                    "name": "Bear Call Spread",
                    "bias": "bearish",
                    "legs": [Leg("sell", bcall_short), Leg("buy", bcall_long)],
                    "max_profit": credit,
                    "max_loss": -(width - credit),
                    "breakeven": bcall_short.strike + credit / CONTRACT_MULTIPLIER,
                    "capital_required": width - credit,
                    "requires_shares": 0,
                    "pop": prob_profit_from_delta(
                        _leg_greeks(bcall_short, spot, dte, fallback_iv)["delta"], "short_call"
                    ),
                    "thesis": f"Collect premium and win as long as the stock stays below "
                    f"${bcall_short.strike:g}. It does not need to fall.",
                    "max_profit_when": f"if {symbol} closes at or below ${bcall_short.strike:g} at expiration "
                    f"(both legs expire worthless and you keep the premium).",
                    "max_loss_when": f"if {symbol} closes at or above ${bcall_long.strike:g} at expiration.",
                }
            )

    # ── Neutral / income (require owning stock) ──────────────────────
    cc = pick_call(0.30)
    if cc:
        credit = cc.mid * CONTRACT_MULTIPLIER
        templates.append(
            {
                "strategy": "covered_call",
                "name": "Covered Call",
                "bias": "neutral",
                "legs": [Leg("sell", cc)],
                "max_profit": (cc.strike - spot) * CONTRACT_MULTIPLIER + credit,
                "max_loss": -(spot * CONTRACT_MULTIPLIER - credit),
                "breakeven": spot - cc.mid,
                "capital_required": spot * CONTRACT_MULTIPLIER,
                "requires_shares": 100,
                "pop": prob_profit_from_delta(_leg_greeks(cc, spot, dte, fallback_iv)["delta"], "short_call"),
                "thesis": f"Turn shares you already own into income, in exchange for capping gains "
                f"above ${cc.strike:g}.",
                "max_profit_when": f"if {symbol} closes at or above ${cc.strike:g} at expiration "
                f"(your shares get called away).",
                "max_loss_when": f"if {symbol} falls to $0 by expiration.",
            }
        )

    collar_call = pick_call(0.30)
    collar_put = pick_put(0.25)
    if collar_call and collar_put:
        net = (collar_call.mid - collar_put.mid) * CONTRACT_MULTIPLIER
        templates.append(
            {
                "strategy": "collar",
                "name": "Collar",
                "bias": "neutral",
                "legs": [Leg("sell", collar_call), Leg("buy", collar_put)],
                "max_profit": (collar_call.strike - spot) * CONTRACT_MULTIPLIER + net,
                "max_loss": (collar_put.strike - spot) * CONTRACT_MULTIPLIER + net,
                "breakeven": spot - net / CONTRACT_MULTIPLIER,
                "capital_required": spot * CONTRACT_MULTIPLIER,
                "requires_shares": 100,
                "pop": prob_profit_from_delta(
                    _leg_greeks(collar_call, spot, dte, fallback_iv)["delta"], "short_call"
                ),
                "thesis": f"Sell an upside call to pay for downside protection, fencing the position "
                f"between ${collar_put.strike:g} and ${collar_call.strike:g}.",
                "max_profit_when": f"if {symbol} closes at or above ${collar_call.strike:g} at expiration.",
                "max_loss_when": f"if {symbol} closes at or below ${collar_put.strike:g} at expiration.",
            }
        )

    return templates


# ──────────────────────────────────────────────────────────────────────
# Conviction scoring — rationale is emitted here, by the scorer
# ──────────────────────────────────────────────────────────────────────


def _score_directional(bias: str, market_score: float) -> tuple[float, str | None]:
    if bias == "bullish":
        component = market_score
    elif bias == "bearish":
        component = -market_score
    else:
        # Neutral ideas are at their best precisely when there is no clear direction.
        component = 1.0 - abs(market_score)

    if abs(component) < RATIONALE_THRESHOLD:
        return component, None

    if bias == "neutral":
        text = "No strong directional signal right now, which is exactly when a neutral, premium-collecting position fits best."
    elif component > 0:
        text = f"The trend and momentum readings point the same way as this {bias} position."
    else:
        text = f"The current trend actually leans against this {bias} position — treat it as a contrarian bet."

    return component, text


def _score_volatility(is_credit: bool, iv_rank: float) -> tuple[float, str | None]:
    normalized = _clamp((iv_rank - 50.0) / 50.0)
    component = normalized if is_credit else -normalized

    if abs(component) < RATIONALE_THRESHOLD:
        return component, None

    if is_credit and component > 0:
        text = f"IV rank {iv_rank:.0f} — you are being paid above-average premium to sell."
    elif is_credit:
        text = f"IV rank {iv_rank:.0f} — premium is below average, so selling pays less than usual here."
    elif component > 0:
        text = f"IV rank {iv_rank:.0f} — options are cheap, so buying costs less than usual."
    else:
        text = f"IV rank {iv_rank:.0f} — options are expensive, so you are paying up for this position."

    return component, text


def _score_liquidity(profile: dict, data_quality: str) -> tuple[float, str | None]:
    if data_quality == "modeled":
        # Unknown liquidity is not good liquidity. Score it neutral, say nothing.
        return 0.0, None

    spread_score = _clamp(1.0 - profile["spread_pct"] / 0.15)
    oi_score = _clamp(min(profile["min_open_interest"] / 500.0, 1.0) * 2.0 - 1.0)
    component = (spread_score + oi_score) / 2.0

    if abs(component) < RATIONALE_THRESHOLD:
        return component, None

    if component > 0:
        text = (
            f"Liquid contracts — {profile['min_open_interest']:,} open interest and a "
            f"{profile['spread_pct'] * 100:.0f}% bid/ask spread, so you can get in and out at a fair price."
        )
    else:
        text = (
            f"Thin contracts — {profile['min_open_interest']:,} open interest and a "
            f"{profile['spread_pct'] * 100:.0f}% bid/ask spread. Expect slippage."
        )

    return component, text


def _score_earnings(earnings_days: int | None, dte: int) -> tuple[float, str | None]:
    if earnings_days is None or earnings_days < 0 or earnings_days > dte:
        return 0.0, None

    return -0.5, f"Earnings fall inside this trade's life ({earnings_days} days out), which adds event risk."


def _conviction(
    template: dict,
    market_score: float,
    iv_rank: float,
    liquidity: dict,
    earnings_days: int | None,
    dte: int,
    data_quality: str,
    is_credit: bool,
) -> tuple[float, str, list[str]]:
    directional, directional_text = _score_directional(template["bias"], market_score)
    volatility, volatility_text = _score_volatility(is_credit, iv_rank)
    liquidity_score, liquidity_text = _score_liquidity(liquidity, data_quality)
    earnings, earnings_text = _score_earnings(earnings_days, dte)

    raw = (
        directional * WEIGHT_DIRECTIONAL
        + volatility * WEIGHT_VOLATILITY
        + liquidity_score * WEIGHT_LIQUIDITY
        + earnings * WEIGHT_EARNINGS
    )
    score = _clamp((raw + 1.0) / 2.0, 0.0, 1.0)

    if score >= 0.65:
        label = "high"
    elif score >= 0.45:
        label = "medium"
    else:
        label = "low"

    why = [text for text in (directional_text, volatility_text, liquidity_text, earnings_text) if text]
    if template.get("thesis"):
        why.insert(0, template["thesis"])

    return round(score, 3), label, why


# ──────────────────────────────────────────────────────────────────────
# Public entry point
# ──────────────────────────────────────────────────────────────────────


def generate_ideas(
    symbol: str,
    spot: float,
    chain: ChainResult,
    signals: dict,
    market_view: dict,
    owned_shares: int = 0,
) -> list[dict]:
    """Return ranked trade ideas, highest conviction first."""
    fallback_iv = float(signals.get("current_iv", 0.30)) or 0.30
    iv_rank = float(signals.get("iv_rank", 50.0))
    market_score = float(market_view.get("score", 0.0))
    earnings_days = signals.get("earnings_days_away")
    dte = chain.dte

    ideas: list[dict] = []

    for template in _build_templates(chain, spot, fallback_iv, symbol):
        legs: list[Leg] = template["legs"]
        net_cash = _net_cash(legs)
        is_credit = net_cash > 0
        liquidity = _liquidity_profile(legs)
        net_greeks = _net_greeks(legs, spot, dte, fallback_iv)

        score, label, why = _conviction(
            template=template,
            market_score=market_score,
            iv_rank=iv_rank,
            liquidity=liquidity,
            earnings_days=earnings_days,
            dte=dte,
            data_quality=chain.data_quality,
            is_credit=is_credit,
        )

        strikes = "-".join(f"{leg.contract.strike:g}" for leg in legs)
        leg_descriptions = ", ".join(
            f"{leg.action} the ${leg.contract.strike:g} {leg.contract.contract_type}" for leg in legs
        )

        idea = {
            "id": f"{template['strategy']}-{chain.expiration.isoformat()}-{strikes}",
            "symbol": symbol,
            "strategy": template["strategy"],
            "name": template["name"],
            "bias": template["bias"],
            "summary": f"{leg_descriptions.capitalize()}, expiring {chain.expiration:%b %d}",
            "legs": [_leg_payload(leg, spot, dte, fallback_iv) for leg in legs],
            "expiration": chain.expiration.isoformat(),
            "dte": dte,
            "net_debit_credit": net_cash,
            "is_credit": is_credit,
            "max_profit": round(template["max_profit"], 2) if template["max_profit"] is not None else None,
            "max_profit_when": template["max_profit_when"],
            "max_loss": round(template["max_loss"], 2),
            "max_loss_when": template["max_loss_when"],
            "breakeven": round(template["breakeven"], 2),
            "prob_profit": template["pop"],
            "capital_required": round(template["capital_required"], 2),
            "requires_shares": template["requires_shares"],
            "shares_satisfied": owned_shares >= template["requires_shares"],
            "conviction": label,
            "conviction_score": score,
            "why": why,
            "greeks": net_greeks,
            "liquidity": liquidity,
            "data_quality": chain.data_quality,
        }

        idea["greeks_explained"] = explain_greeks(net_greeks, symbol, prob_itm=template["pop"])
        idea["risks"] = describe_risks(idea, signals, chain.data_quality)

        ideas.append(idea)

    ideas.sort(key=lambda item: item["conviction_score"], reverse=True)
    return ideas
