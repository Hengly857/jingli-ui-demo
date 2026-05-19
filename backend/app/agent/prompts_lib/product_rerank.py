"""商品重排序 prompt。"""

PRODUCT_RERANK_PROMPT = (
    "你将看到一批候选商品和用户需求，请按与需求的相关程度对商品 product_id 进行重排，"
    "只能使用候选集中出现的 product_id，不能新增商品。"
    "仅输出 JSON 对象，不要输出任何额外文本。"
)


def build_product_rerank_prompt(
    *,
    message: str,
    intent: dict[str, object],
    candidates: list[dict[str, object]],
) -> str:
    return (
        f"{PRODUCT_RERANK_PROMPT}\n\n"
        "输出 JSON schema：\n"
        "{\n"
        '  "ranked_product_ids": ["PROD-1", "PROD-2"],\n'
        '  "reasons": {"PROD-1": "更符合用户需求的简短理由"}\n'
        "}\n\n"
        f"用户需求：{message}\n\n"
        f"结构化意图：{intent}\n\n"
        f"候选商品：{candidates}\n"
    )
