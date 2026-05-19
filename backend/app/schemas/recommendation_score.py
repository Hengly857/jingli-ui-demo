from pydantic import BaseModel, Field


class RecommendationEvidence(BaseModel):
    product_id: str
    score: float
    matched_features: list[str] = Field(default_factory=list)
    penalties: list[str] = Field(default_factory=list)
    display_reason: str


class ProductScore(BaseModel):
    product_id: str
    score: float
    reasons: list[str] = Field(default_factory=list)
    matched_features: list[str] = Field(default_factory=list)
    penalties: list[str] = Field(default_factory=list)
    display_reason: str = "匹配当前送礼需求"
