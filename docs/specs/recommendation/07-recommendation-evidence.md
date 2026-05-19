# 任务 R7：推荐理由与打分证据结构化

## 目标

让推荐结果可解释、可调试、可展示。

## 范围

需要实现：

- 推荐结果包含 `score`、`matched_features`、`penalties`。
- 前端商品卡片可以展示简短推荐理由。
- 后端日志记录完整证据。
- 兼容现有 `ProductScore.reasons/penalties`，不要破坏聊天和组合礼单已有调用。

不做：

- 不把所有内部权重暴露给用户。
- 不在本任务中把详细分项权重展示给前端用户。

## 建议数据结构

```py
class RecommendationEvidence(BaseModel):
    product_id: str
    score: float
    matched_features: list[str]
    penalties: list[str]
    display_reason: str
```

## 当前实现约束

- R2 已有 `ProductScore(product_id, score, reasons, penalties)`。
- `ProductCard.reason` 已经被前端用于展示简短推荐理由。
- R7 应在保留上述字段的基础上新增结构化证据：
  - `ProductScore.matched_features`：机器/调试侧使用。
  - `ProductScore.display_reason`：前端自然语言展示。
  - `RecommendationResult.evidence`：按商品聚合后的证据列表。
  - `ProductCard.reason` 与 `display_reason` 保持一致，避免前端额外改造。

## 验收标准

- 每个推荐商品都有 `display_reason`。
- Debug 日志可以看到分项分数。
- 用户看到的是自然理由，不是机械分数。

## 风险点

- 理由不能和真实规则矛盾。
- 前端展示要克制，避免信息过载。
- Debug 日志要避免记录用户敏感信息，只记录商品证据摘要。

## 执行记录

- 状态：已完成
- 规约更新：
  - 明确 R7 基于 R2 已有 `ProductScore.reasons/penalties` 做兼容升级。
  - 明确新增结构化证据字段，但不把内部权重细节直接暴露给前端用户。
  - 明确 `ProductCard.reason` 与 `display_reason` 保持一致，减少前端改造成本。
- 实现内容：
  - `backend/app/schemas/recommendation_score.py`：
    - 新增 `RecommendationEvidence`。
    - `ProductScore` 新增 `matched_features` 与 `display_reason`。
  - `backend/app/schemas/product.py`：
    - `ProductCard` 新增 `display_reason / matched_features / penalties`，供前端卡片展示和调试。
  - `backend/app/schemas/recommendation.py`：
    - `RecommendationResult` 新增 `evidence` 列表。
  - `backend/app/services/product_scorer.py`：
    - 将规则命中的 `reasons` 同步为 `matched_features`。
    - 根据前两条命中原因生成自然语言 `display_reason`。
  - `backend/app/services/recommendation_service.py`：
    - 返回商品卡片时同步写入 `reason / display_reason / matched_features / penalties`。
    - 将最终返回商品的 score 转为 `RecommendationEvidence`。
    - 增加 debug 日志 `recommendation_evidence`，记录商品 id、分数、命中特征、惩罚项与展示理由。
- 验证结果：
  - `python -m compileall app` 通过。
  - 服务级验证 “见家长送礼，有面子但别太贵，预算3000”：
    - 返回商品卡片均包含 `display_reason`。
    - `ProductCard.reason == ProductCard.display_reason`。
    - `scores` 与 `evidence` 数量一致。
    - `evidence` 包含 `product_id / score / matched_features / penalties / display_reason`。
  - API 验证：
    - `POST /api/products/recommendations` 返回 200。
    - 响应商品包含 `display_reason` 和 `matched_features`。
    - 响应 `evidence` 包含结构化证据。
- 后续建议：
  - R8 可进入追问策略：当 recipient / scenario / budget 等关键槽位不足时，先追问而不是强行推荐。
  - 前端可以先只展示 `display_reason`，把 `matched_features / penalties / score` 放到调试面板或后台日志里。
