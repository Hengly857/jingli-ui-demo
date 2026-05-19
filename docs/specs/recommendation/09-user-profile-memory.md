# 任务 R9：用户画像与会话记忆

## 目标

让推荐系统能利用用户历史偏好和当前会话上下文。

## 范围

需要实现：

- 会话内记忆：对象、预算、偏好、已推荐商品。
- 简单用户画像：偏好价位、常见送礼对象、偏好风格。
- 推荐时避免重复推荐。
- 支持用户明确“不喜欢 / 换一个 / 不要这个”时，把最近推荐商品加入规避列表。
- 推荐时在用户信息缺失时，用画像做轻量补全。

不做：

- 不做复杂账号系统。
- 不做跨设备画像同步。
- 不做长期持久化画像；Demo 阶段先使用进程内存储。

## 建议数据

```py
class GiftUserProfile(BaseModel):
    preferred_budget_levels: list[str] = []
    preferred_styles: list[str] = []
    frequent_recipients: list[str] = []
    disliked_product_ids: list[str] = []
    recommended_product_ids: list[str] = []
    last_budget: Decimal | None = None
    last_scenarios: list[str] = []
```

## 当前实现约束

- 当前已有 `ConversationMemory`，但它只保存最近对话文本，不适合作为结构化画像。
- R9 新增独立 `UserProfileService`：
  - 有 `user_id` 时以 `user_id` 为 key。
  - 没有账号系统时以 `conversation_id` 为 key。
  - 没有 key 时不启用画像，不影响推荐。
- 画像只做轻量补全，不覆盖用户本轮明确表达的信息。
- 过滤已推荐商品时，如果候选被过滤为空，允许后续任务再做更精细的“放宽重复过滤”策略。

## 验收标准

- 同一会话内追问后能继承预算和对象。
- 已明确不喜欢的商品不会继续推荐。
- 用户画像缺失时不影响推荐。
- pipeline 能看到画像是否启用、过滤了多少候选。

## 风险点

- 画像不要过早复杂化。
- 本地 Demo 可先用内存或 SQLite 保存。
- 画像补全不能覆盖用户本轮新意图。

## 执行记录

- 状态：已完成
- 规约更新：
  - 明确 Demo 阶段画像使用进程内存储，不做跨设备同步和长期持久化。
  - 明确画像 key 优先使用 `user_id`，没有账号时使用 `conversation_id`。
  - 明确画像只做轻量补全，不覆盖用户本轮明确表达的信息。
  - 明确支持“换一个 / 不喜欢 / 不要这个”等反馈，把最近推荐商品加入规避列表。
- 实现内容：
  - 新增 `backend/app/schemas/user_profile.py`：
    - 定义 `GiftUserProfile`，包含预算档位、风格、常见对象、已推荐商品、不喜欢商品、最近预算/场景/对象。
  - 新增 `backend/app/services/user_profile_service.py`：
    - 进程内画像存储。
    - `merge_intent()`：用画像补齐缺失的预算、对象、场景和风格。
    - `mark_dislikes_from_message()`：识别“不喜欢 / 换一个 / 不要这个”等反馈，把最近推荐商品加入 `disliked_product_ids`。
    - `update_after_recommendation()`：推荐完成后回写预算、对象、风格和已推荐商品。
  - 更新 `backend/app/schemas/recommendation.py`：
    - `RecommendationRequest` 新增 `user_id / use_profile`。
  - 更新 `backend/app/schemas/chat.py` 与 `backend/app/schemas/gift_plan.py`：
    - 请求增加 `user_id / use_profile`。
  - 更新 `backend/app/services/recommendation_service.py`：
    - 推荐前加载画像，并用画像补齐 `GiftIntent`。
    - 推荐前识别负反馈并更新规避列表。
    - 召回合并后过滤 `disliked_product_ids` 与 `recommended_product_ids`。
    - 推荐后回写画像。
    - pipeline 增加 `profile_used / profile_filtered_count / profile_disliked_added`。
  - 更新 `backend/app/services/chat_service.py` 与 `backend/app/services/gift_plan_service.py`：
    - 将 `user_id / conversation_id / use_profile` 传入推荐服务。
  - 更新 `backend/app/schemas/gift_intent.py`：
    - `missing_slots / must_ask` 改为基于当前字段重新计算，避免画像补齐后仍误触发追问。
- 验证结果：
  - `python -m compileall app` 通过。
  - 服务级验证：
    - 第一轮：`送女朋友生日礼物，预算500元，想要有心意`，正常返回 3 个商品，并回写画像。
    - 第二轮同会话：`不喜欢这些，换一个`，继承上一轮女朋友/生日/500 元，不再追问。
    - 第二轮自动过滤第一轮商品，返回新商品，且 `profile_disliked_added >= 1`、`profile_filtered_count >= 1`。
    - `use_profile=False` 时仍可正常推荐，pipeline 中 `profile_used=False`。
  - 聊天流式验证：
    - 第一轮正常推商品卡片。
    - 第二轮“换一个”正常推不同商品卡片，未重复推荐上一轮商品。
  - API 验证：
    - 连续调用 `POST /api/products/recommendations`，同一 `conversation_id` 下第二轮“换一个”返回不同商品。
    - 第二轮 pipeline 显示画像过滤生效。
- 后续建议：
  - R10 进入评测与可观测性：建立离线评测集，比较 `llm_direct / hybrid_algorithm / llm_rerank` 在不同送礼场景下的命中率、重复率、追问率和稳定性。
  - 后续如果要做真实产品，可把 `UserProfileService` 的存储从进程内存迁移到 SQLite/PostgreSQL，并加入用户主动清除画像的能力。
