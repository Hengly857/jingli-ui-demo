from decimal import Decimal

from pydantic import BaseModel

from app.schemas.product import ProductCard
from app.schemas.recommendation import RecommendationStrategy


class GiftPlanGenerateRequest(BaseModel):
    message: str
    user_id: str | None = None
    conversation_id: str | None = None
    budget: Decimal | None = None
    preference: str | None = None
    recommendation_strategy: RecommendationStrategy | None = None
    allow_generic_recommendation: bool = False
    use_profile: bool = True


class GiftPlanValuePoint(BaseModel):
    title: str
    desc: str
    icon: str = "✨"


class GiftPlanResponse(BaseModel):
    plan_id: str
    title: str
    requirement: str
    strategy: str
    budget: Decimal | None = None
    total_amount: Decimal
    remaining_amount: Decimal | None = None
    usage_percent: float | None = None
    answer: str
    products: list[ProductCard]
    value_points: list[GiftPlanValuePoint]
    replacement_chips: list[str]
