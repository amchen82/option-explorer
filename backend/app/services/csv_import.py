import csv
import io


class UnknownBrokerFormat(Exception):
    pass


_SCHWAB_COLS = {"Symbol", "Quantity", "Average Cost Basis"}
_ROBINHOOD_COLS = {"symbol", "average_buy_price", "quantity"}
_FIDELITY_COLS = {"Symbol", "Quantity", "Average Cost Basis ($)"}
_TD_COLS = {"Symbol", "Qty", "Trade Price"}


def _parse_float(value: str) -> float:
    return float(value.replace("$", "").replace(",", "").replace("%", "").strip())


def _normalize_symbol(symbol: str) -> str:
    return symbol.strip().upper()


class CSVImportService:
    def detect_broker(self, content: str) -> str:
        reader = csv.DictReader(io.StringIO(content))
        cols = set(reader.fieldnames or [])

        if _SCHWAB_COLS.issubset(cols) and "Average Cost Basis ($)" not in cols:
            return "schwab"
        if _ROBINHOOD_COLS.issubset(cols):
            return "robinhood"
        if _FIDELITY_COLS.issubset(cols):
            return "fidelity"
        if _TD_COLS.issubset(cols):
            return "td_ameritrade"
        raise UnknownBrokerFormat(f"Cannot detect broker from columns: {cols}")

    def parse(self, content: str) -> list[dict]:
        broker = self.detect_broker(content)
        reader = csv.DictReader(io.StringIO(content))
        rows = [row for row in reader if row.get("Symbol") or row.get("symbol")]

        if broker == "schwab":
            return self._parse_schwab(rows)
        if broker == "robinhood":
            return self._parse_robinhood(rows)
        if broker == "fidelity":
            return self._parse_fidelity(rows)
        if broker == "td_ameritrade":
            return self._parse_td(rows)
        raise UnknownBrokerFormat(f"No parser for broker: {broker}")

    def _parse_schwab(self, rows: list[dict]) -> list[dict]:
        positions: list[dict] = []
        for row in rows:
            symbol = row.get("Symbol", "").strip()
            if not symbol or symbol.startswith("Account"):
                continue
            try:
                positions.append(
                    {
                        "symbol": symbol,
                        "shares": _parse_float(row["Quantity"]),
                        "cost_basis": _parse_float(row["Average Cost Basis"]),
                    }
                )
            except (KeyError, ValueError):
                continue
        return positions

    def _parse_robinhood(self, rows: list[dict]) -> list[dict]:
        positions: list[dict] = []
        for row in rows:
            symbol = _normalize_symbol(row.get("symbol", ""))
            if not symbol:
                continue
            try:
                positions.append(
                    {
                        "symbol": symbol,
                        "shares": _parse_float(row["quantity"]),
                        "cost_basis": _parse_float(row["average_buy_price"]),
                    }
                )
            except (KeyError, ValueError):
                continue
        return positions

    def _parse_fidelity(self, rows: list[dict]) -> list[dict]:
        positions: list[dict] = []
        for row in rows:
            symbol = row.get("Symbol", "").strip()
            if not symbol:
                continue
            try:
                positions.append(
                    {
                        "symbol": symbol,
                        "shares": _parse_float(row["Quantity"]),
                        "cost_basis": _parse_float(row["Average Cost Basis ($)"]),
                    }
                )
            except (KeyError, ValueError):
                continue
        return positions

    def _parse_td(self, rows: list[dict]) -> list[dict]:
        positions: list[dict] = []
        for row in rows:
            symbol = row.get("Symbol", "").strip()
            if not symbol:
                continue
            try:
                positions.append(
                    {
                        "symbol": symbol,
                        "shares": _parse_float(row["Qty"]),
                        "cost_basis": _parse_float(row["Trade Price"]),
                    }
                )
            except (KeyError, ValueError):
                continue
        return positions

    def find_duplicates(self, imported: list[dict], existing: list[dict]) -> list[dict]:
        existing_symbols = {_normalize_symbol(p["symbol"]) for p in existing}
        return [p for p in imported if _normalize_symbol(p["symbol"]) in existing_symbols]
