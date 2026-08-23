# Options Data Notebook Design

## Goal

Add a Jupyter notebook that demonstrates:

- Yahoo option chain discovery with `yfinance`
- Selecting a single sample contract from the Yahoo chain
- Querying Polygon option contracts for the same underlying and expiration
- Fetching a Polygon snapshot for a single selected contract

## Scope

The notebook is an example and exploration aid, not production code. It should be readable top-to-bottom and safe to commit.

## Design

- Create one notebook at `notebooks/options_yahoo_polygon_example.ipynb`.
- Use `AAPL` as the default underlying.
- Read `POLYGON_API_KEY` from the environment instead of hardcoding the provided key.
- Keep Yahoo and Polygon examples in separate sections with a shared config cell.
- Normalize the most useful columns into pandas DataFrames for quick inspection.
- Include short notes about Yahoo rate limiting and Polygon plan-dependent data access.

## Error Handling

- Fail fast with a clear message if `POLYGON_API_KEY` is missing.
- Guard Yahoo option queries with explicit checks for missing expirations or empty chains.
- Use `requests.raise_for_status()` for Polygon HTTP responses.

## Verification

- Validate the notebook file as JSON after writing it.
- Keep the code dependency-light by using packages already present in the repo backend where possible: `pandas`, `requests`, and `yfinance`.
