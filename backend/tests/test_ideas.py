from __future__ import annotations

from datetime import date, timedelta

import pytest

from app.engine.ideas import generate_ideas
from app.engine.narrative import market_bias
from app.services.option_chain import ChainResult
from tests.conftest import SPOT, build_chain

NO_SHARES_STRATEGIES = {
    "long_call",
    "bull_call_spread",
    "cash_secured_put",
    "long_put",
    "bear_put_spread",
    "bear_call_spread",
}
SHARE_STRATEGIES = {"covered_call", "collar"}


def run(chain, signals, owned_shares: int = 0) -> list[dict]:
    view = market_bias(signals)
    return generate_ideas("TEST", SPOT, chain, signals, view, owned_shares=owned_shares)


@pytest.fixture
def ideas(sample_chain, bullish_signals):
    return run(sample_chain, bullish_signals)


class TestTemplateGeneration:
    def test_all_eight_templates_are_produced(self, ideas):
        assert {idea["strategy"] for idea in ideas} == NO_SHARES_STRATEGIES | SHARE_STRATEGIES

    def test_six_templates_need_no_stock(self, ideas):
        no_stock = [idea for idea in ideas if idea["requires_shares"] == 0]

        assert len(no_stock) == 6
        assert {idea["strategy"] for idea in no_stock} == NO_SHARES_STRATEGIES

    def test_stock_requiring_templates_are_flagged_not_hidden(self, ideas):
        flagged = [idea for idea in ideas if idea["requires_shares"] == 100]

        assert {idea["strategy"] for idea in flagged} == SHARE_STRATEGIES
        assert all(idea["shares_satisfied"] is False for idea in flagged)

    def test_owning_shares_satisfies_the_requirement(self, sample_chain, bullish_signals):
        owned = run(sample_chain, bullish_signals, owned_shares=100)

        assert all(idea["shares_satisfied"] for idea in owned)

    def test_empty_chain_yields_no_ideas(self, bullish_signals):
        empty = ChainResult("TEST", date.today() + timedelta(days=35), 35, [], [], "live")

        assert run(empty, bullish_signals) == []

    def test_templates_are_skipped_when_no_strike_matches(self, bullish_signals):
        """A chain of only deep out-of-the-money calls cannot satisfy the templates."""
        chain = build_chain()
        far_only = ChainResult(
            "TEST",
            chain.expiration,
            chain.dte,
            [call for call in chain.calls if call.strike >= 300],
            [],
            "live",
        )

        assert run(far_only, bullish_signals) == []


class TestIdeaShape:
    def test_every_idea_explains_itself(self, ideas):
        for idea in ideas:
            assert idea["why"], f"{idea['strategy']} has no rationale"
            assert idea["greeks_explained"], f"{idea['strategy']} has no Greeks explanation"
            assert idea["risks"], f"{idea['strategy']} has no risks"

    def test_every_idea_carries_the_core_numbers(self, ideas):
        for idea in ideas:
            assert idea["max_loss"] < 0
            assert idea["breakeven"] > 0
            assert 0.0 <= idea["prob_profit"] <= 1.0
            assert idea["capital_required"] > 0
            assert idea["dte"] == 35
            assert idea["legs"]

    def test_ids_are_unique_and_descriptive(self, ideas):
        ids = [idea["id"] for idea in ideas]

        assert len(ids) == len(set(ids))
        assert all(idea["strategy"] in idea["id"] for idea in ideas)

    def test_summary_names_every_leg(self, ideas):
        for idea in ideas:
            assert idea["summary"].count("$") == len(idea["legs"])


class TestStrategyMath:
    def _idea(self, ideas, strategy):
        return next(idea for idea in ideas if idea["strategy"] == strategy)

    def test_debit_spread_risk_and_reward_sum_to_the_width(self, ideas):
        spread = self._idea(ideas, "bull_call_spread")
        long_strike, short_strike = sorted(leg["strike"] for leg in spread["legs"])
        width = (short_strike - long_strike) * 100

        assert spread["max_profit"] + abs(spread["max_loss"]) == pytest.approx(width, abs=1.0)

    def test_credit_spread_risk_and_reward_sum_to_the_width(self, ideas):
        spread = self._idea(ideas, "bear_call_spread")
        short_strike, long_strike = sorted(leg["strike"] for leg in spread["legs"])
        width = (long_strike - short_strike) * 100

        assert spread["max_profit"] + abs(spread["max_loss"]) == pytest.approx(width, abs=1.0)

    def test_credit_trades_are_marked_as_credits(self, ideas):
        for strategy in ("cash_secured_put", "bear_call_spread", "covered_call"):
            idea = self._idea(ideas, strategy)
            assert idea["is_credit"] is True
            assert idea["net_debit_credit"] > 0

    def test_debit_trades_are_marked_as_debits(self, ideas):
        for strategy in ("long_call", "long_put", "bull_call_spread", "bear_put_spread"):
            idea = self._idea(ideas, strategy)
            assert idea["is_credit"] is False
            assert idea["net_debit_credit"] < 0

    def test_long_call_upside_is_uncapped(self, ideas):
        assert self._idea(ideas, "long_call")["max_profit"] is None

    def test_long_call_breakeven_is_strike_plus_premium(self, ideas):
        call = self._idea(ideas, "long_call")
        leg = call["legs"][0]

        assert call["breakeven"] == pytest.approx(leg["strike"] + leg["price"], abs=0.01)

    def test_cash_secured_put_reserves_the_full_strike(self, ideas):
        csp = self._idea(ideas, "cash_secured_put")

        assert csp["capital_required"] == pytest.approx(csp["legs"][0]["strike"] * 100, abs=0.01)

    def test_net_greeks_are_signed_per_leg(self, ideas):
        """A long call is delta-positive; a short call is delta-negative."""
        assert self._idea(ideas, "long_call")["greeks"]["delta"] > 0
        assert self._idea(ideas, "covered_call")["greeks"]["delta"] < 0
        assert self._idea(ideas, "long_put")["greeks"]["delta"] < 0


class TestProfitLossConditions:
    """Tooltip copy explaining *when* max profit/loss happens must name the right strike."""

    def _idea(self, ideas, strategy):
        return next(idea for idea in ideas if idea["strategy"] == strategy)

    def test_every_idea_explains_both_conditions(self, ideas):
        for idea in ideas:
            assert idea["max_profit_when"], f"{idea['strategy']} has no max_profit_when"
            assert idea["max_loss_when"], f"{idea['strategy']} has no max_loss_when"
            assert "TEST" in idea["max_profit_when"]
            assert "TEST" in idea["max_loss_when"]

    def test_long_call_max_loss_names_its_strike(self, ideas):
        call = self._idea(ideas, "long_call")
        strike = call["legs"][0]["strike"]

        assert f"${strike:g}" in call["max_loss_when"]

    def test_bull_call_spread_conditions_name_each_strike(self, ideas):
        spread = self._idea(ideas, "bull_call_spread")
        long_strike, short_strike = sorted(leg["strike"] for leg in spread["legs"])

        assert f"${short_strike:g}" in spread["max_profit_when"]
        assert f"${long_strike:g}" in spread["max_loss_when"]

    def test_bear_call_spread_conditions_name_each_strike(self, ideas):
        spread = self._idea(ideas, "bear_call_spread")
        short_strike, long_strike = sorted(leg["strike"] for leg in spread["legs"])

        assert f"${short_strike:g}" in spread["max_profit_when"]
        assert f"${long_strike:g}" in spread["max_loss_when"]

    def test_cash_secured_put_max_loss_describes_stock_going_to_zero(self, ideas):
        csp = self._idea(ideas, "cash_secured_put")

        assert "$0" in csp["max_loss_when"]
        assert f"${csp['legs'][0]['strike']:g}" in csp["max_profit_when"]

    def test_covered_call_and_collar_name_their_call_strike_for_max_profit(self, ideas):
        cc = self._idea(ideas, "covered_call")
        cc_strike = cc["legs"][0]["strike"]
        assert f"${cc_strike:g}" in cc["max_profit_when"]

        collar = self._idea(ideas, "collar")
        call_leg = next(leg for leg in collar["legs"] if leg["contract_type"] == "call")
        put_leg = next(leg for leg in collar["legs"] if leg["contract_type"] == "put")
        assert f"${call_leg['strike']:g}" in collar["max_profit_when"]
        assert f"${put_leg['strike']:g}" in collar["max_loss_when"]


class TestConvictionScoring:
    def test_ideas_are_sorted_by_conviction(self, ideas):
        scores = [idea["conviction_score"] for idea in ideas]

        assert scores == sorted(scores, reverse=True)

    def test_scores_stay_in_range_and_match_their_label(self, ideas):
        for idea in ideas:
            score = idea["conviction_score"]
            assert 0.0 <= score <= 1.0

            expected = "high" if score >= 0.65 else "medium" if score >= 0.45 else "low"
            assert idea["conviction"] == expected

    def test_bullish_ideas_outrank_bearish_ones_in_an_uptrend(self, ideas):
        bullish = [idea["conviction_score"] for idea in ideas if idea["bias"] == "bullish"]
        bearish = [idea["conviction_score"] for idea in ideas if idea["bias"] == "bearish"]

        assert min(bullish) > min(bearish)
        assert max(bullish) > max(bearish)

    def test_directional_reasoning_cites_the_actual_trend_driver(self, sample_chain, bullish_signals):
        # bullish_signals has above_50dma=True, above_200dma=True, which market_bias's
        # own trend component describes with this exact sentence -- a bullish idea's
        # own "why" should cite it directly, not just say "the trend agrees" generically.
        ideas = run(sample_chain, bullish_signals)
        bullish_idea = next(idea for idea in ideas if idea["bias"] == "bullish")

        assert any("textbook definition of an uptrend" in reason for reason in bullish_idea["why"])

    def test_high_iv_favors_selling_premium_over_buying_it(self, sample_chain, bullish_signals):
        high_iv = run(sample_chain, {**bullish_signals, "iv_rank": 90.0})
        seller = next(idea for idea in high_iv if idea["strategy"] == "cash_secured_put")
        buyer = next(idea for idea in high_iv if idea["strategy"] == "long_call")

        assert seller["conviction_score"] > buyer["conviction_score"]

    def test_low_iv_reverses_that_preference(self, sample_chain, bullish_signals):
        low_iv = run(sample_chain, {**bullish_signals, "iv_rank": 5.0})
        seller = next(idea for idea in low_iv if idea["strategy"] == "cash_secured_put")
        buyer = next(idea for idea in low_iv if idea["strategy"] == "long_call")

        assert buyer["conviction_score"] > seller["conviction_score"]

    def test_earnings_inside_the_trade_lowers_conviction(self, sample_chain, bullish_signals):
        without = run(sample_chain, bullish_signals)
        within = run(sample_chain, {**bullish_signals, "earnings_days_away": 9})

        by_strategy = {idea["strategy"]: idea["conviction_score"] for idea in without}
        for idea in within:
            assert idea["conviction_score"] < by_strategy[idea["strategy"]]

    def test_illiquid_contracts_score_lower_than_liquid_ones(self, bullish_signals):
        liquid = run(build_chain(open_interest=2000, spread=0.01), bullish_signals)
        illiquid = run(build_chain(open_interest=5, spread=0.40), bullish_signals)

        liquid_scores = {idea["strategy"]: idea["conviction_score"] for idea in liquid}
        for idea in illiquid:
            assert idea["conviction_score"] < liquid_scores[idea["strategy"]]


class TestRationale:
    def test_high_iv_credit_ideas_say_they_are_paid_to_sell(self, sample_chain, bullish_signals):
        ideas = run(sample_chain, {**bullish_signals, "iv_rank": 90.0})
        csp = next(idea for idea in ideas if idea["strategy"] == "cash_secured_put")

        assert any("paid above-average premium to sell" in reason for reason in csp["why"])

    def test_earnings_risk_is_always_stated_even_when_it_barely_scores(self, sample_chain, bullish_signals):
        ideas = run(sample_chain, {**bullish_signals, "earnings_days_away": 9})

        for idea in ideas:
            assert any("Earnings" in risk for risk in idea["risks"])

    def test_contrarian_ideas_are_labelled_as_such(self, sample_chain, bullish_signals):
        ideas = run(sample_chain, bullish_signals)
        bearish = next(idea for idea in ideas if idea["strategy"] == "long_put")

        assert any("contrarian" in reason for reason in bearish["why"])

    def test_neutral_ideas_explain_why_neutral_fits(self, sample_chain):
        flat = {
            "price": 212.0,
            "rsi_14": 50.0,
            "above_50dma": True,
            "above_200dma": False,
            "52w_high": 260.0,
            "52w_low": 164.0,
            "current_iv": 0.28,
            "iv_rank": 50.0,
            "hv_20": 0.25,
            "earnings_days_away": None,
        }
        ideas = run(sample_chain, flat)
        collar = next(idea for idea in ideas if idea["strategy"] == "collar")

        assert any("No strong directional signal" in reason for reason in collar["why"])


class TestModeledData:
    def test_liquidity_is_scored_neutral_when_data_is_modeled(self, bullish_signals):
        modeled = run(build_chain(data_quality="modeled", open_interest=0, spread=0.0), bullish_signals)

        for idea in modeled:
            assert idea["data_quality"] == "modeled"
            assert not any("Liquid contracts" in reason or "Thin contracts" in reason for reason in idea["why"])

    def test_modeled_data_quality_propagates_to_every_idea(self, bullish_signals):
        modeled = run(build_chain(data_quality="modeled"), bullish_signals)

        assert modeled
        assert all(idea["data_quality"] == "modeled" for idea in modeled)
