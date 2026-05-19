# 任务 R6：LLM Rerank 候选商品精排

## 目标

让大模型在后端已召回并打分的候选商品中做精排，提升复杂语义场景的排序质量。

## 范围

需要实现：

- 输入候选商品列表、规则分数和 GiftIntent。
- LLM 返回 product_id 排序和简短理由。
- 后端校验 LLM 只返回候选集内 product_id。
- 失败时回退规则排序。
- 增加推荐策略切换接口：
  - `llm_direct`：默认模式，用户回答仍由大模型直接生成；后端商品候选只作为卡片/白名单支撑。
  - `hybrid_algorithm`：使用 R1-R5 的意图抽取、混合召回、规则打分排序。
  - `llm_rerank`：在 `hybrid_algorithm` 候选上追加 LLM 精排。

不做：

- 不让 LLM 直接访问全量商品库。
- 不允许 LLM 新增商品。
- 不在本任务中把新推荐算法切为默认最终推荐策略。

## 建议输出

```json
{
  "ranked_product_ids": ["PROD-1", "PROD-2"],
  "reasons": {
    "PROD-1": "更符合见家长场景的体面感"
  }
}
```

## 验收标准

- LLM rerank 结果稳定在候选集内。
- 非法 product_id 被忽略。
- LLM 超时或解析失败时，系统使用规则排序。
- 日志能区分规则排序和 LLM rerank 排序。
- `POST /api/products/recommendations` 可通过 `strategy` 显式选择推荐策略。
- 聊天和组合礼单请求可通过 `recommendation_strategy` 覆盖默认策略。

## 风险点

- Rerank prompt 不宜过长，候选数量建议 10-20 个。
- 大模型可能偏好文案更漂亮的商品，需要结合规则分数约束。
- 当前默认策略保持 `llm_direct`，避免新算法尚未充分评测时影响用户主链路。

## 执行记录

- 状态：已完成
- 规约更新：
  - 在 R6 中加入推荐策略切换接口，支持默认大模型直出与新算法链路并存。
  - 明确 `llm_direct / hybrid_algorithm / llm_rerank` 三种策略语义。
  - 明确 R6 不把新算法切为默认最终推荐策略。
- 实现内容：
  - `backend/app/core/config.py` 新增 `recommendation_strategy`，默认值为 `llm_direct`。
  - `backend/app/schemas/recommendation.py` 新增 `RecommendationStrategy`、`RecommendationRequest.strategy`、`RecommendationResult.strategy`。
  - `backend/app/schemas/chat.py` 和 `backend/app/schemas/gift_plan.py` 新增 `recommendation_strategy`，允许调用方覆盖默认策略。
  - `backend/app/api/routes/products.py` 新增 `POST /api/products/recommendations`，可直接测试推荐策略。
  - `backend/app/agent/prompts_lib/product_rerank.py` 新增 `build_product_rerank_prompt()`，要求模型只返回候选商品内的 JSON 排序结果。
  - `backend/app/services/recommendation_service.py` 新增 LLM rerank：
    - 规则排序后取候选短名单。
    - 将候选商品、规则分、规则证据和用户意图交给 LLM。
    - 解析 `ranked_product_ids`。
    - 过滤非法 product_id 和重复 product_id。
    - 解析失败、模型失败或没有合法 id 时回退规则排序。
  - `pipeline` 增加 `strategy / llm_rerank_enabled / llm_rerank_used / llm_rerank_invalid_count / llm_rerank_fallback`，用于观察当前使用的是规则排序还是 LLM rerank。
- 验证结果：
  - `python -m compileall app` 通过。
  - 服务级验证 `strategy=llm_direct`：
    - 返回商品：龙井茶礼盒、金骏眉红茶礼罐、山羊绒围巾礼盒。
    - `llm_rerank_enabled=False`。
  - 服务级验证 `strategy=hybrid_algorithm`：
    - 正常返回混合召回 + scorer 排序结果。
    - `llm_rerank_enabled=False`。
  - 服务级验证 `strategy=llm_rerank` 且 mock LLM 返回非 JSON：
    - `llm_rerank_enabled=True`。
    - `llm_rerank_used=False`。
    - `llm_rerank_fallback=True`，成功回退规则排序。
  - 模拟 LLM 返回：
    - `["PROD-SCARF-001", "FAKE-ID", "PROD-TEA-002"]`
    - 最终商品顺序按合法 id 重排为山羊绒围巾礼盒、金骏眉红茶礼罐、龙井茶礼盒。
    - `llm_rerank_invalid_count=1`，非法 `FAKE-ID` 被过滤。
  - 接口验证：
    - `POST /api/products/recommendations` 返回 200。
    - `strategy=hybrid_algorithm` 正常返回商品与 pipeline。
- 后续建议：
  - R7 进入推荐理由与打分证据结构化，让前端能展示“为什么推荐这件商品”。
  - 在切换默认策略前，建议新增离线评测集：覆盖生日、见家长、送领导、乔迁、长辈健康、预算模糊等场景，对比 `llm_direct / hybrid_algorithm / llm_rerank` 的命中率和稳定性。
