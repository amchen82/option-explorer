from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.portfolio import StockPosition
from app.routers.portfolios import _get_portfolio_or_404, _get_user
from app.services.csv_import import CSVImportService, UnknownBrokerFormat

router = APIRouter(prefix="/portfolios", tags=["import"])
_import_service = CSVImportService()


@router.post("/{portfolio_id}/import")
async def import_csv(
    portfolio_id: int,
    file: UploadFile = File(...),
    user=Depends(_get_user),
    db: Session = Depends(get_db),
):
    _get_portfolio_or_404(portfolio_id, user.id, db)

    content = (await file.read()).decode("utf-8")

    try:
        imported_positions = _import_service.parse(content)
    except UnknownBrokerFormat as error:
        raise HTTPException(status_code=422, detail=str(error)) from error

    existing_positions = (
        db.query(StockPosition)
        .filter(StockPosition.portfolio_id == portfolio_id)
        .all()
    )
    existing_payload = [
        {
            "symbol": position.symbol,
            "shares": position.shares,
            "cost_basis": position.cost_basis,
        }
        for position in existing_positions
    ]
    duplicate_positions = _import_service.find_duplicates(imported_positions, existing_payload)
    duplicate_symbols = sorted({position["symbol"] for position in duplicate_positions})

    for position in imported_positions:
        if position["symbol"] in duplicate_symbols:
            continue

        db.add(
            StockPosition(
                portfolio_id=portfolio_id,
                symbol=position["symbol"],
                shares=position["shares"],
                cost_basis=position["cost_basis"],
            )
        )

    db.commit()

    return {
        "imported": len(imported_positions) - len(duplicate_positions),
        "skipped_duplicates": len(duplicate_positions),
        "duplicate_symbols": duplicate_symbols,
    }
