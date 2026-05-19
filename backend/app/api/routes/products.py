from fastapi import APIRouter

from app.schemas.product import ProductCreate, ProductResponse
from app.schemas.recommendation import RecommendationRequest, RecommendationResult
from app.services.product_service import ProductService
from app.services.recommendation_service import RecommendationService

router = APIRouter()


@router.get("", response_model=list[ProductResponse])
async def list_products() -> list[ProductResponse]:
    return await ProductService().list_products()


@router.post("", response_model=ProductResponse)
async def create_product(payload: ProductCreate) -> ProductResponse:
    return await ProductService().create_product(payload)


@router.post("/recommendations", response_model=RecommendationResult)
async def recommend_products(payload: RecommendationRequest) -> RecommendationResult:
    return await RecommendationService().recommend_products(payload)
