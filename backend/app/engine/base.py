from __future__ import annotations

from abc import ABC, abstractmethod


class BaseStrategy(ABC):
    """Interface for strategy engines."""

    @abstractmethod
    def analyze(self, position: dict, market_data: dict) -> list[dict]:
        """Analyze a position and return ranked strategy recommendations."""
        raise NotImplementedError
