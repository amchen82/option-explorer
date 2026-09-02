from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services import option_chain
from tests.conftest import SPOT, build_chain

client = TestClient(app)

QUOTE = {
    "symbol": "AAPL",
    "price": SPOT,
    "52w_high": 260.0,
    "52w_low": 164.0,
    "earnings_date": None,
    "stale": False,
}

SIGNALS = {
    "rsi_14": 58.0,
    "above_50dma": True,
    "above_200dma": True,
    "hv_20": 0.24,
    "hv_60": 0.26,
    "iv_rank": 62.0,
    "current_iv": 0.285,
    "iv_low": 0.20,
    "iv_high": 0.40,
    "52w_high": 260.0,
    "52w_low": 164.0,
}


def fake_market_data(quote_overrides: dict | None = None) -> MagicMock:
    service = MagicMock()
    service.get_stock_quote.return_value = {**QUOTE, **(quote_overrides or {})}
    service.get_market_signals.return_value = dict(SIGNALS)
    return service


def fetch(path: str = "/ideas/AAPL", *, quote_overrides=None, chain=None):
    with patch("app.routers.ideas.market_data_svc", fake_market_data(quote_overrides)), patch(
        "app.routers.ideas.get_option_chain", return_value=chain or build_chain()
    ):
        return client.get(path)


class TestSuccessfulResponse:
    def test_returns_the_full_payload(self):
        response = fetch()

        assert response.status_code == 200
        body = response.json()
        assert set(body) == {
            "symbol",
            "as_of",
            "data_quality",
            "expiration",
            "expiration_bucket",
            "dte",
            "quote",
            "market_view",
            "volatility",
            "ideas",
            "disclaimer",
        }

    def test_symbol_is_normalized_to_uppercase(self):
        assert fetch("/ideas/aapl").json()["symbol"] == "AAPL"

    def test_market_view_carries_a_bias_and_its_drivers(self):
        view = fetch().json()["market_view"]

        assert view["bias"] in {"bullish", "bearish", "neutral"}
        assert view["headline"]
        assert len(view["drivers"]) == 3

    def test_volatility_block_is_explained(self):
        volatility = fetch().json()["volatility"]

        assert volatility["regime"] == "elevated"
        assert volatility["implication"] == "favors_selling"
        assert "implied volatility" in volatility["detail"].lower()

    def test_ideas_are_present_and_ranked(self):
        ideas = fetch().json()["ideas"]

        assert len(ideas) == 8
        scores = [idea["conviction_score"] for idea in ideas]
        assert scores == sorted(scores, reverse=True)

    def test_every_idea_explains_itself(self):
        for idea in fetch().json()["ideas"]:
            assert idea["why"]
            assert idea["greeks_explained"]
            assert idea["risks"]
            assert idea["bias"] in {"bullish", "bearish", "neutral"}

    def test_disclaimer_is_always_returned(self):
        assert "not financial advice" in fetch().json()["disclaimer"]


class TestSharesParameter:
    def test_stock_strategies_are_unsatisfied_by_default(self):
        ideas = fetch().json()["ideas"]
        gated = [idea for idea in ideas if idea["requires_shares"] == 100]

        assert gated
        assert all(idea["shares_satisfied"] is False for idea in gated)

    def test_supplying_shares_satisfies_them(self):
        ideas = fetch("/ideas/AAPL?shares=100").json()["ideas"]

        assert all(idea["shares_satisfied"] for idea in ideas)

    def test_negative_shares_are_rejected(self):
        assert fetch("/ideas/AAPL?shares=-5").status_code == 422


class TestDataQuality:
    def test_live_chain_and_fresh_quote_report_live(self):
        assert fetch().json()["data_quality"] == "live"

    def test_modeled_chain_propagates_to_the_response_and_every_idea(self):
        body = fetch(chain=build_chain(data_quality="modeled")).json()

        assert body["data_quality"] == "modeled"
        assert all(idea["data_quality"] == "modeled" for idea in body["ideas"])

    def test_a_stale_quote_alone_downgrades_the_response(self):
        """A live chain priced off a synthetic spot is not live data."""
        body = fetch(quote_overrides={"stale": True}).json()

        assert body["data_quality"] == "modeled"


class TestExpirationParameter:
    def test_defaults_to_a_month_out(self):
        with patch("app.routers.ideas.market_data_svc", fake_market_data()), patch(
            "app.routers.ideas.get_option_chain", return_value=build_chain()
        ) as mock_chain:
            response = client.get("/ideas/AAPL")

        assert mock_chain.call_args.kwargs["target_dte"] == 35
        assert response.json()["expiration_bucket"] == "1m"

    @pytest.mark.parametrize(
        "bucket,expected_dte",
        [
            ("0d", 0),
            ("1w", 7),
            ("2w", 14),
            ("1m", 35),
            ("3m", 90),
            ("6m", 180),
            ("12m", 365),
            ("gt12m", 545),
        ],
    )
    def test_each_bucket_maps_to_the_right_target_dte(self, bucket, expected_dte):
        with patch("app.routers.ideas.market_data_svc", fake_market_data()), patch(
            "app.routers.ideas.get_option_chain", return_value=build_chain()
        ) as mock_chain:
            response = client.get(f"/ideas/AAPL?expiration={bucket}")

        assert response.status_code == 200
        assert mock_chain.call_args.kwargs["target_dte"] == expected_dte
        assert response.json()["expiration_bucket"] == bucket

    def test_unknown_bucket_is_rejected(self):
        response = fetch("/ideas/AAPL?expiration=9m")

        assert response.status_code == 400
        assert "expiration" in response.json()["detail"].lower()


class TestVolatilityRefinement:
    """A live chain's own ATM IV should win over market_data's pre-chain estimate."""

    def test_live_chain_atm_iv_overrides_the_pre_chain_estimate(self):
        # build_chain()'s default contracts all carry implied_volatility=0.30,
        # distinct from SIGNALS["current_iv"]=0.285 so the two are distinguishable.
        volatility = fetch(chain=build_chain(data_quality="live")).json()["volatility"]

        assert volatility["current_iv"] == pytest.approx(0.30)

    def test_live_chain_atm_iv_also_refines_iv_rank(self):
        # iv_rank(0.30, iv_low=0.20, iv_high=0.40) == 50.0, not SIGNALS' pre-chain 62.0.
        volatility = fetch(chain=build_chain(data_quality="live")).json()["volatility"]

        assert volatility["iv_rank"] == pytest.approx(50.0)

    def test_iv_vs_hv_ratio_is_not_pinned_to_a_fixed_value(self):
        # Regression test: current_iv used to be defined as hv_20 * 1.1 everywhere,
        # which made this ratio exactly 1.1x for every ticker, always. With a live
        # chain's real ATM IV (0.30) against SIGNALS' hv_20 (0.24), it should not be.
        volatility = fetch(chain=build_chain(data_quality="live")).json()["volatility"]

        assert volatility["iv_vs_hv"] == pytest.approx(0.30 / 0.24, abs=0.01)
        assert volatility["iv_vs_hv"] != pytest.approx(1.1, abs=0.001)

    def test_modeled_chain_keeps_the_pre_chain_estimate(self):
        volatility = fetch(chain=build_chain(data_quality="modeled")).json()["volatility"]

        assert volatility["current_iv"] == pytest.approx(0.285)
        assert volatility["iv_rank"] == pytest.approx(62.0)

    def test_a_live_chain_with_no_usable_iv_keeps_the_pre_chain_estimate(self):
        contracts = build_chain(data_quality="live")
        blinded = [
            *[
                option_chain.Contract(**{**c.__dict__, "implied_volatility": 0.0})
                for c in contracts.calls
            ],
        ]
        blind_chain = option_chain.ChainResult(
            symbol=contracts.symbol,
            expiration=contracts.expiration,
            dte=contracts.dte,
            calls=blinded,
            puts=[],
            data_quality="live",
        )

        volatility = fetch(chain=blind_chain).json()["volatility"]

        assert volatility["current_iv"] == pytest.approx(0.285)


class TestCurrentIvSource:
    """A field-level confidence flag: is current_iv a real market quote or a fallback estimate?"""

    def test_live_atm_iv_is_flagged_live(self):
        volatility = fetch(chain=build_chain(data_quality="live")).json()["volatility"]

        assert volatility["current_iv_source"] == "live"

    def test_modeled_chain_is_flagged_estimated(self):
        volatility = fetch(chain=build_chain(data_quality="modeled")).json()["volatility"]

        assert volatility["current_iv_source"] == "estimated"

    def test_a_live_chain_with_no_usable_iv_is_flagged_estimated(self):
        contracts = build_chain(data_quality="live")
        blinded = [option_chain.Contract(**{**c.__dict__, "implied_volatility": 0.0}) for c in contracts.calls]
        blind_chain = option_chain.ChainResult(
            symbol=contracts.symbol,
            expiration=contracts.expiration,
            dte=contracts.dte,
            calls=blinded,
            puts=[],
            data_quality="live",
        )

        volatility = fetch(chain=blind_chain).json()["volatility"]

        assert volatility["current_iv_source"] == "estimated"


class TestErrorHandling:
    @pytest.mark.parametrize("symbol", ["1AAPL", "toolongsymbol", "AA PL"])
    def test_malformed_symbols_are_rejected(self, symbol):
        response = fetch(f"/ideas/{symbol}")

        assert response.status_code == 400
        assert "not a valid ticker" in response.json()["detail"]

    def test_missing_price_returns_not_found(self):
        response = fetch(quote_overrides={"price": 0.0})

        assert response.status_code == 404
        assert "No market data" in response.json()["detail"]

    def test_earnings_dates_in_unexpected_shapes_do_not_crash(self):
        for shape in ([], ["2026-08-28"], "2026-08-28", None, 12345):
            response = fetch(quote_overrides={"earnings_date": shape})
            assert response.status_code == 200


class TestExistingRoutesUnaffected:
    """The ideas engine is additive; nothing it touches may change behavior."""

    def test_health_still_responds(self):
        response = client.get("/health")

        assert response.status_code == 200
        assert response.json() == {"status": "ok"}

    def test_public_strategies_route_still_exists(self):
        routes = {route.path for route in app.routes}

        assert "/strategies/public/{symbol}" in routes
        assert "/ideas/{symbol}" in routes


class TestQuotePreview:
    """A lightweight endpoint for the ticker search box -- no option chain, no ideas."""

    def fetch(self, path: str = "/ideas/AAPL/quote", *, quote_overrides=None):
        with patch("app.routers.ideas.market_data_svc", fake_market_data(quote_overrides)) as service:
            response = client.get(path)
            return response, service

    def test_returns_symbol_price_and_staleness(self):
        response, _ = self.fetch()

        assert response.status_code == 200
        assert response.json() == {"symbol": "AAPL", "price": SPOT, "stale": False}

    def test_does_not_touch_the_option_chain(self):
        with patch("app.routers.ideas.market_data_svc", fake_market_data()), patch(
            "app.routers.ideas.get_option_chain"
        ) as chain_mock:
            response = client.get("/ideas/AAPL/quote")

        assert response.status_code == 200
        chain_mock.assert_not_called()

    def test_does_not_compute_market_signals(self):
        _, service = self.fetch()

        service.get_market_signals.assert_not_called()

    def test_symbol_is_normalized_to_uppercase(self):
        response, _ = self.fetch("/ideas/aapl/quote")

        assert response.json()["symbol"] == "AAPL"

    def test_malformed_symbol_is_rejected(self):
        response, _ = self.fetch("/ideas/1AAPL/quote")

        assert response.status_code == 400

    def test_missing_price_returns_not_found(self):
        response, _ = self.fetch(quote_overrides={"price": 0.0})

        assert response.status_code == 404

    def test_stale_quote_is_reported(self):
        response, _ = self.fetch(quote_overrides={"stale": True})

        assert response.json()["stale"] is True
