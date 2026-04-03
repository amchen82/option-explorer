from pathlib import Path

import pytest

from app.services.csv_import import CSVImportService, UnknownBrokerFormat


FIXTURES_DIR = Path(__file__).parent / "fixtures"


@pytest.fixture
def svc() -> CSVImportService:
    return CSVImportService()


def read_fixture(name: str) -> str:
    return (FIXTURES_DIR / name).read_text()


def test_detect_schwab(svc: CSVImportService) -> None:
    content = read_fixture("schwab_positions.csv")

    broker = svc.detect_broker(content)

    assert broker == "schwab"


def test_detect_robinhood(svc: CSVImportService) -> None:
    content = read_fixture("robinhood_positions.csv")

    broker = svc.detect_broker(content)

    assert broker == "robinhood"


def test_parse_schwab(svc: CSVImportService) -> None:
    content = read_fixture("schwab_positions.csv")

    positions = svc.parse(content)

    assert len(positions) == 2
    aapl = next(p for p in positions if p["symbol"] == "AAPL")
    assert aapl["shares"] == 100
    assert abs(aapl["cost_basis"] - 162.00) < 0.01


def test_parse_robinhood(svc: CSVImportService) -> None:
    content = read_fixture("robinhood_positions.csv")

    positions = svc.parse(content)

    assert len(positions) == 2
    tsla = next(p for p in positions if p["symbol"] == "TSLA")
    assert tsla["shares"] == 25
    assert abs(tsla["cost_basis"] - 240.00) < 0.01


def test_unknown_format_raises(svc: CSVImportService) -> None:
    with pytest.raises(UnknownBrokerFormat):
        svc.parse("col1,col2,col3\na,b,c")


def test_duplicate_detection(svc: CSVImportService) -> None:
    content = read_fixture("schwab_positions.csv")
    positions = svc.parse(content)
    existing = [{"symbol": "AAPL", "shares": 100, "cost_basis": 162.0}]

    duplicates = svc.find_duplicates(positions, existing)

    assert any(d["symbol"] == "AAPL" for d in duplicates)
