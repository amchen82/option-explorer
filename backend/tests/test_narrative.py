from __future__ import annotations

import pytest

from app.engine.narrative import describe_risks, explain_greeks, explain_volatility, market_bias


class TestMarketBias:
    def test_uptrend_reads_bullish(self, bullish_signals):
        result = market_bias(bullish_signals)

        assert result["bias"] == "bullish"
        assert result["score"] > 0.25
        assert "bullish" in result["headline"].lower()

    def test_downtrend_reads_bearish(self, bearish_signals):
        result = market_bias(bearish_signals)

        assert result["bias"] == "bearish"
        assert result["score"] < -0.25

    def test_mixed_signals_read_neutral(self):
        result = market_bias(
            {
                "price": 212.0,
                "rsi_14": 50.0,
                "above_50dma": True,
                "above_200dma": False,
                "52w_high": 260.0,
                "52w_low": 164.0,
            }
        )

        assert result["bias"] == "neutral"
        assert -0.25 < result["score"] < 0.25

    def test_every_component_contributes_a_driver(self, bullish_signals):
        """The headline must always show its work."""
        result = market_bias(bullish_signals)

        assert len(result["drivers"]) == 3
        assert all(isinstance(driver, str) and driver for driver in result["drivers"])

    def test_overbought_rsi_is_capped_and_flagged(self):
        stretched = market_bias(
            {
                "price": 255.0,
                "rsi_14": 82.0,
                "above_50dma": True,
                "above_200dma": True,
                "52w_high": 260.0,
                "52w_low": 164.0,
            }
        )

        # An 82 RSI would score 0.64 uncapped; it is deliberately capped at 0.3.
        assert any("overbought" in driver.lower() for driver in stretched["drivers"])
        assert stretched["score"] < (1.0 + 0.64 + 0.87) / 3.0

    def test_oversold_rsi_is_capped_and_flagged(self):
        result = market_bias(
            {
                "price": 170.0,
                "rsi_14": 22.0,
                "above_50dma": False,
                "above_200dma": False,
                "52w_high": 260.0,
                "52w_low": 164.0,
            }
        )

        assert any("oversold" in driver.lower() for driver in result["drivers"])

    def test_missing_52w_range_does_not_crash(self):
        result = market_bias({"price": 100.0, "rsi_14": 50.0, "52w_high": 0.0, "52w_low": 0.0})

        assert result["bias"] in {"bullish", "bearish", "neutral"}
        assert len(result["drivers"]) == 3


class TestExplainVolatility:
    @pytest.mark.parametrize(
        "rank,regime,implication",
        [
            (85.0, "high", "favors_selling"),
            (62.0, "elevated", "favors_selling"),
            (35.0, "normal", "neutral"),
            (10.0, "low", "favors_buying"),
        ],
    )
    def test_regime_buckets(self, rank, regime, implication):
        result = explain_volatility({"iv_rank": rank, "current_iv": 0.30, "hv_20": 0.25})

        assert result["regime"] == regime
        assert result["implication"] == implication

    def test_boundaries_are_inclusive_at_the_lower_edge(self):
        assert explain_volatility({"iv_rank": 70.0, "current_iv": 0.3, "hv_20": 0.3})["regime"] == "high"
        assert explain_volatility({"iv_rank": 45.0, "current_iv": 0.3, "hv_20": 0.3})["regime"] == "elevated"
        assert explain_volatility({"iv_rank": 25.0, "current_iv": 0.3, "hv_20": 0.3})["regime"] == "normal"

    def test_iv_vs_hv_ratio(self):
        result = explain_volatility({"iv_rank": 50.0, "current_iv": 0.30, "hv_20": 0.24})

        assert result["iv_vs_hv"] == pytest.approx(1.25, abs=0.01)
        assert "more movement" in result["comparison"]

    def test_zero_hv_does_not_divide_by_zero(self):
        result = explain_volatility({"iv_rank": 50.0, "current_iv": 0.30, "hv_20": 0.0})

        assert result["iv_vs_hv"] == 1.0

    def test_detail_defines_implied_volatility_for_beginners(self):
        result = explain_volatility({"iv_rank": 62.0, "current_iv": 0.3, "hv_20": 0.25})

        assert "implied volatility" in result["detail"].lower()
        assert "62" in result["detail"]


class TestExplainGreeks:
    def test_positive_delta_reads_as_owning_shares(self):
        rows = explain_greeks({"delta": 0.31, "gamma": 0.02, "theta": -0.04, "vega": 0.11}, "AAPL")
        delta_row = next(row for row in rows if row["greek"] == "delta")

        assert "owning 31 shares" in delta_row["plain"]
        assert "$31" in delta_row["plain"]
        assert delta_row["dollars"] == pytest.approx(31.0)

    def test_negative_delta_reads_as_being_short(self):
        rows = explain_greeks({"delta": -0.45, "gamma": 0.0, "theta": 0.0, "vega": 0.0}, "TSLA")
        delta_row = next(row for row in rows if row["greek"] == "delta")

        assert "short 45 shares" in delta_row["plain"]
        assert "falls" in delta_row["plain"]

    def test_probability_is_appended_when_supplied(self):
        rows = explain_greeks({"delta": 0.30, "gamma": 0.0, "theta": 0.0, "vega": 0.0}, "AAPL", prob_itm=0.44)
        delta_row = next(row for row in rows if row["greek"] == "delta")

        assert "44%" in delta_row["plain"]

    def test_theta_is_expressed_in_dollars_per_day(self):
        rows = explain_greeks({"delta": 0.0, "gamma": 0.0, "theta": -0.12, "vega": 0.0}, "AAPL")
        theta_row = next(row for row in rows if row["greek"] == "theta")

        assert "$12" in theta_row["plain"]
        assert "per day" in theta_row["plain"]
        assert "against you" in theta_row["plain"]

    def test_positive_theta_reads_as_time_working_for_you(self):
        rows = explain_greeks({"delta": 0.0, "gamma": 0.0, "theta": 0.09, "vega": 0.0}, "AAPL")
        theta_row = next(row for row in rows if row["greek"] == "theta")

        assert "on your side" in theta_row["plain"]

    def test_short_vega_reads_as_benefiting_from_calm(self):
        rows = explain_greeks({"delta": 0.0, "gamma": 0.0, "theta": 0.0, "vega": -0.20}, "AAPL")
        vega_row = next(row for row in rows if row["greek"] == "vega")

        assert "$20" in vega_row["plain"]
        assert "Calming markets" in vega_row["plain"]

    def test_short_gamma_is_described_as_working_against_you(self):
        rows = explain_greeks({"delta": 0.0, "gamma": -0.03, "theta": 0.0, "vega": 0.0}, "AAPL")
        gamma_row = next(row for row in rows if row["greek"] == "gamma")

        assert "against you" in gamma_row["plain"]

    def test_all_four_greeks_returned_in_order(self):
        rows = explain_greeks({"delta": 0.1, "gamma": 0.1, "theta": 0.1, "vega": 0.1}, "AAPL")

        assert [row["greek"] for row in rows] == ["delta", "gamma", "theta", "vega"]
        assert all(row["plain"] for row in rows)


class TestDescribeRisks:
    def test_earnings_inside_the_trade_is_flagged(self):
        risks = describe_risks(
            {"symbol": "AAPL", "dte": 35, "net_debit_credit": -640, "max_loss": -640},
            {"earnings_days_away": 9},
        )

        assert any("Earnings land in 9 days" in risk for risk in risks)

    def test_earnings_after_expiration_is_not_flagged(self):
        risks = describe_risks(
            {"symbol": "AAPL", "dte": 35, "net_debit_credit": -640, "max_loss": -640},
            {"earnings_days_away": 60},
        )

        assert not any("Earnings" in risk for risk in risks)

    def test_credit_trades_warn_about_assignment(self):
        risks = describe_risks(
            {"symbol": "AAPL", "dte": 35, "net_debit_credit": 670, "max_loss": -21330},
            {"earnings_days_away": None},
        )

        assert any("assigned" in risk for risk in risks)

    def test_debit_trades_warn_about_total_loss_and_decay(self):
        risks = describe_risks(
            {"symbol": "AAPL", "dte": 35, "net_debit_credit": -640, "max_loss": -640},
            {"earnings_days_away": None},
        )

        assert any("at risk in full" in risk for risk in risks)
        assert any("time decay" in risk.lower() for risk in risks)

    def test_large_max_loss_prompts_an_affordability_check(self):
        risks = describe_risks(
            {"symbol": "AAPL", "dte": 35, "net_debit_credit": 670, "max_loss": -21330},
            {"earnings_days_away": None},
        )

        assert any("afford to lose" in risk for risk in risks)

    def test_modeled_data_is_disclosed_as_a_risk(self):
        risks = describe_risks(
            {"symbol": "AAPL", "dte": 35, "net_debit_credit": -640, "max_loss": -640},
            {"earnings_days_away": None},
            data_quality="modeled",
        )

        assert any("not tradeable market prices" in risk or "rather than tradeable" in risk for risk in risks)

    def test_wide_spreads_and_thin_interest_are_called_out(self):
        risks = describe_risks(
            {
                "symbol": "AAPL",
                "dte": 35,
                "net_debit_credit": -640,
                "max_loss": -640,
                "liquidity": {"spread_pct": 0.22, "min_open_interest": 12},
            },
            {"earnings_days_away": None},
            data_quality="live",
        )

        assert any("bid/ask spread" in risk for risk in risks)
        assert any("Open interest is thin" in risk for risk in risks)

    def test_liquidity_is_not_judged_on_modeled_data(self):
        risks = describe_risks(
            {
                "symbol": "AAPL",
                "dte": 35,
                "net_debit_credit": -640,
                "max_loss": -640,
                "liquidity": {"spread_pct": 0.22, "min_open_interest": 12},
            },
            {"earnings_days_away": None},
            data_quality="modeled",
        )

        assert not any("Open interest is thin" in risk for risk in risks)
