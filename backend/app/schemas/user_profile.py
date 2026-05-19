from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, Field


class GiftUserProfile(BaseModel):
    preferred_budget_levels: list[str] = Field(default_factory=list)
    preferred_styles: list[str] = Field(default_factory=list)
    frequent_recipients: list[str] = Field(default_factory=list)
    disliked_product_ids: list[str] = Field(default_factory=list)
    recommended_product_ids: list[str] = Field(default_factory=list)
    last_budget: Decimal | None = None
    last_scenarios: list[str] = Field(default_factory=list)
    last_target_people: list[str] = Field(default_factory=list)
