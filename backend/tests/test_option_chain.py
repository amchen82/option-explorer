from __future__ import annotations

from datetime import date, timedelta
from types import SimpleNamespace
from unittest.mock import patch

import pandas as pd
import pytest

from app.services import option_chain
from app.services.option_chain import (
    _contracts_from_frame,
    _expiration_from_chain,
    _modeled_chain,
    _pick_expiration,
    get_option_chain,
)


@pytest.fixture(autouse=True)
def clear_cache():
    option_chain._cache.clear()
    yield
    option_chain._cache.clear()


def iso(days: int) -> str:
    return (date.today() + timedelta(days=days)).isoformat()


def frame(rows: list[dict]) -> pd.DataFrame:
    return pd.DataFrame(rows)


def yf_double(calls: pd.DataFrame, puts: pd.DataFrame, options: tuple[str, ...] = ()):
    chain = SimpleNamespace(calls=calls, puts=puts)
    return SimpleNamespace(option_chain=lambda date_str=None: chain, options=options)


class TestPickExpiration:
    def test_picks_closest_to_target_dte(self):
        available = (iso(7), iso(14), iso(30), iso(60))
        assert _pick_expiration(available, 35) == iso(30)

    def test_prefers_future_over_today(self):
        available = (iso(0), iso(7), iso(35))
        assert _pick_expiration(available, 35) == iso(35)

    def test_skips_0dte_when_future_options_exist(self):
        available = (iso(0), iso(14))
        assert _pick_expiration(available, 35) == iso(14)

    def test_uses_0dte_when_it_is_the_only_choice(self):
        available = (iso(0),)
        assert _pick_expiration(available, 35) == iso(0)

    def test_picks_exact_match_when_available(self):
        available = (iso(7), iso(35), iso(90))
        assert _pick_expiration(available, 35) == iso(35)


class TestExpirationParsing:
    def test_reads_expiration_from_an_occ_contract_symbol(self):
        calls = frame([{"contractSymbol": "AAPL260918C00440000"}])

        assert _expiration_from_chain(calls, pd.DataFrame()) == date(2026, 9, 18)

    def test_returns_none_without_a_parseable_contract_symbol(self):
        calls = frame([{"contractSymbol": "not-a-contract"}])

        assert _expiration_from_chain(calls, pd.DataFrame()) is None


class TestContractNormalization:
    def test_maps_yfinance_columns_onto_contracts(self):
        contracts = _contracts_from_frame(
            frame([{"strike": 230, "bid": 8.0, "ask": 8.8, "lastPrice": 8.4, "volume": 340, "openInterest": 1200, "impliedVolatility": 0.28}]),
            "AAPL",
            "call",
            date.today(),
        )

        assert len(contracts) == 1
        contract = contracts[0]
        assert contract.strike == 230.0
        assert contract.mid == pytest.approx(8.4)
        assert contract.open_interest == 1200
        assert contract.implied_volatility == pytest.approx(0.28)

    def test_drops_contracts_with_no_bid_and_no_last_trade(self):
        contracts = _contracts_from_frame(
            frame(
                [
                    {"strike": 230, "bid": 0.0, "ask": 0.0, "lastPrice": 0.0, "volume": 0, "openInterest": 0, "impliedVolatility": 0.0},
                    {"strike": 235, "bid": 1.0, "ask": 1.2, "lastPrice": 1.1, "volume": 5, "openInterest": 50, "impliedVolatility": 0.3},
                ]
            ),
            "AAPL",
            "call",
            date.today(),
        )

        assert [contract.strike for contract in contracts] == [235.0]

    def test_falls_back_to_last_price_when_the_book_is_empty(self):
        contracts = _contracts_from_frame(
            frame([{"strike": 230, "bid": 0.0, "ask": 0.0, "lastPrice": 7.5, "volume": 1, "openInterest": 10, "impliedVolatility": 0.3}]),
            "AAPL",
            "call",
            date.today(),
        )

        assert contracts[0].mid == pytest.approx(7.5)

    def test_nan_values_become_zero(self):
        contracts = _contracts_from_frame(
            frame([{"strike": 230, "bid": 8.0, "ask": 8.8, "lastPrice": 8.4, "volume": float("nan"), "openInterest": float("nan"), "impliedVolatility": float("nan")}]),
            "AAPL",
            "call",
            date.today(),
        )

        assert contracts[0].volume == 0
        assert contracts[0].open_interest == 0

    def test_contracts_come_back_sorted_by_strike(self):
        contracts = _contracts_from_frame(
            frame(
                [
                    {"strike": 240, "bid": 1.0, "ask": 1.2, "lastPrice": 1.1, "volume": 1, "openInterest": 1, "impliedVolatility": 0.3},
                    {"strike": 220, "bid": 5.0, "ask": 5.2, "lastPrice": 5.1, "volume": 1, "openInterest": 1, "impliedVolatility": 0.3},
                ]
            ),
            "AAPL",
            "call",
            date.today(),
        )

        assert [contract.strike for contract in contracts] == [220.0, 240.0]

    def test_empty_frame_yields_no_contracts(self):
        assert _contracts_from_frame(pd.DataFrame(), "AAPL", "call", date.today()) == []

    def test_spread_pct_is_unquotable_when_there_is_no_book(self):
        contracts = _contracts_from_frame(
            frame([{"strike": 230, "bid": 0.0, "ask": 0.0, "lastPrice": 7.5, "volume": 1, "openInterest": 10, "impliedVolatility": 0.3}]),
            "AAPL",
            "call",
            date.today(),
        )

        assert contracts[0].spread_pct == 1.0


class TestModeledFallback:
    def test_produces_a_ladder_around_spot(self):
        result = _modeled_chain("TEST", 230.0, 0.30, 35)

        assert result.data_quality == "modeled"
        assert result.calls and result.puts
        assert min(call.strike for call in result.calls) < 230.0
        assert max(call.strike for call in result.calls) > 230.0

    def test_expiration_lands_on_a_friday(self):
        result = _modeled_chain("TEST", 230.0, 0.30, 35)

        assert result.expiration.weekday() == 4

    def test_strike_interval_scales_with_price(self):
        cheap = _modeled_chain("TEST", 20.0, 0.30, 35)
        rich = _modeled_chain("TEST", 900.0, 0.30, 35)

        cheap_gap = cheap.calls[1].strike - cheap.calls[0].strike
        rich_gap = rich.calls[1].strike - rich.calls[0].strike

        assert cheap_gap == 1.0
        assert rich_gap == 10.0


class TestGetOptionChain:
    def _rows(self, strikes: list[float]) -> pd.DataFrame:
        return frame(
            [
                {"contractSymbol": f"AAPL{iso(35)[2:].replace('-', '')}C{int(strike * 1000):08d}", "strike": strike, "bid": 5.0, "ask": 5.4, "lastPrice": 5.2, "volume": 100, "openInterest": 500, "impliedVolatility": 0.29}
                for strike in strikes
            ]
        )

    def test_returns_live_data_when_yfinance_responds(self):
        double = yf_double(self._rows([225.0, 230.0]), self._rows([225.0, 230.0]), options=(iso(35),))

        with patch.object(option_chain.yf, "Ticker", return_value=double):
            result = get_option_chain("AAPL", 230.0, 0.30)

        assert result.data_quality == "live"
        assert len(result.calls) == 2
        assert result.dte == 35

    def test_selects_closest_expiration_to_target_dte(self):
        rows = frame(
            [
                {"contractSymbol": f"AAPL{iso(30)[2:].replace('-', '')}C{int(225 * 1000):08d}", "strike": 225.0, "bid": 5.0, "ask": 5.4, "lastPrice": 5.2, "volume": 100, "openInterest": 500, "impliedVolatility": 0.29},
                {"contractSymbol": f"AAPL{iso(30)[2:].replace('-', '')}C{int(230 * 1000):08d}", "strike": 230.0, "bid": 5.0, "ask": 5.4, "lastPrice": 5.2, "volume": 100, "openInterest": 500, "impliedVolatility": 0.29},
            ]
        )
        double = yf_double(rows, rows, options=(iso(7), iso(30), iso(60)))

        with patch.object(option_chain.yf, "Ticker", return_value=double):
            result = get_option_chain("AAPL", 230.0, 0.30, target_dte=35)

        assert result.dte == 30

    def test_skips_0dte_when_future_expirations_exist(self):
        rows = frame(
            [
                {"contractSymbol": f"AAPL{iso(14)[2:].replace('-', '')}C{int(225 * 1000):08d}", "strike": 225.0, "bid": 5.0, "ask": 5.4, "lastPrice": 5.2, "volume": 100, "openInterest": 500, "impliedVolatility": 0.29},
                {"contractSymbol": f"AAPL{iso(14)[2:].replace('-', '')}C{int(230 * 1000):08d}", "strike": 230.0, "bid": 5.0, "ask": 5.4, "lastPrice": 5.2, "volume": 100, "openInterest": 500, "impliedVolatility": 0.29},
            ]
        )
        double = yf_double(rows, rows, options=(iso(0), iso(14)))

        with patch.object(option_chain.yf, "Ticker", return_value=double):
            result = get_option_chain("AAPL", 230.0, 0.30, target_dte=35)

        assert result.dte == 14

    def test_falls_back_to_modeled_when_yfinance_raises(self):
        with patch.object(option_chain.yf, "Ticker", side_effect=RuntimeError("network down")):
            result = get_option_chain("AAPL", 230.0, 0.30)

        assert result.data_quality == "modeled"
        assert result.calls

    def test_falls_back_when_no_expirations_are_available(self):
        double = yf_double(pd.DataFrame(), pd.DataFrame(), options=())

        with patch.object(option_chain.yf, "Ticker", return_value=double):
            result = get_option_chain("AAPL", 230.0, 0.30)

        assert result.data_quality == "modeled"

    def test_falls_back_when_contract_symbols_do_not_contain_an_expiration(self):
        unparseable = frame(
            [{"contractSymbol": "unknown", "strike": 230.0, "bid": 5.0, "ask": 5.4, "lastPrice": 5.2, "volume": 100, "openInterest": 500, "impliedVolatility": 0.29}]
        )
        double = yf_double(unparseable, unparseable, options=(iso(35),))

        with patch.object(option_chain.yf, "Ticker", return_value=double):
            result = get_option_chain("AAPL", 230.0, 0.30)

        # Expiration is recovered from the chosen date string; chain is still live.
        assert result.data_quality == "live"
        assert result.dte == 35

    def test_falls_back_when_the_chain_filters_down_to_nothing(self):
        unquotable = frame(
            [{"strike": 230.0, "bid": 0.0, "ask": 0.0, "lastPrice": 0.0, "volume": 0, "openInterest": 0, "impliedVolatility": 0.0}]
        )
        unquotable["contractSymbol"] = f"AAPL{iso(35)[2:].replace('-', '')}C00230000"
        double = yf_double(unquotable, unquotable, options=(iso(35),))

        with patch.object(option_chain.yf, "Ticker", return_value=double):
            result = get_option_chain("AAPL", 230.0, 0.30)

        assert result.data_quality == "modeled"

    def test_second_call_is_served_from_cache(self):
        double = yf_double(self._rows([230.0]), self._rows([230.0]), options=(iso(35),))

        with patch.object(option_chain.yf, "Ticker", return_value=double) as ticker:
            get_option_chain("AAPL", 230.0, 0.30)
            get_option_chain("AAPL", 230.0, 0.30)

        assert ticker.call_count == 1

    def test_symbols_are_normalized_to_uppercase(self):
        with patch.object(option_chain.yf, "Ticker", side_effect=RuntimeError("offline")):
            result = get_option_chain("aapl", 230.0, 0.30)

        assert result.symbol == "AAPL"

    def test_nonsense_spot_and_iv_do_not_crash_the_fallback(self):
        with patch.object(option_chain.yf, "Ticker", side_effect=RuntimeError("offline")):
            result = get_option_chain("AAPL", 0.0, 0.0)

        assert result.data_quality == "modeled"
        assert result.calls
