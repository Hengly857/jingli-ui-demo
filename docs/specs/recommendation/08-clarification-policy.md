# 任务 R8：多轮澄清与追问策略

## 目标

让 Agent 在信息不足时先追问，而不是硬推荐。

## 范围

需要实现：

- 根据 `GiftIntent.missing_slots` 判断是否需要追问。
- 定义必须追问字段和可选追问字段。
- 支持追问后合并上下文重新推荐。
- `RecommendationResult` 返回追问状态，便于接口和前端统一处理。
- 聊天流式接口在需要追问时直接输出追问，不推商品卡片。

不做：

- 不做复杂对话状态机。
- 不要求一次追问解决所有问题。
- 不在本任务中做长期用户画像记忆。

## 追问策略

优先级：

1. 缺少送礼对象
2. 缺少场景
3. 缺少预算
4. 偏好/禁忌不明确

## 验收标准

- 用户只说“推荐个礼物”时，Agent 不直接给商品，先问对象/场景/预算。
- 用户补充后能继续推荐，而不是丢失上下文。
- 追问不超过一个核心问题。
- API 返回中能明确区分“需要追问”和“已有推荐结果”。

## 风险点

- 过度追问会降低体验，需要允许“先给通用推荐”。
- 上下文合并要避免旧信息污染新需求。

## 当前实现约束

- R1 的 `GiftIntent` 已有 `missing_slots` 与 `must_ask`。
- R6 已引入推荐策略切换，R8 的追问判断应在策略排序前执行，避免无效召回。
- 上下文合并先采用轻量策略：只有上一轮助手内容像追问时，才合并最近用户消息；避免把很久以前的需求污染新一轮推荐。

## 执行记录

- 状态：已完成
- 规约更新：
  - 明确 `RecommendationResult` 需要返回追问状态，便于接口和前端统一处理。
  - 明确聊天流式接口在需要追问时直接输出追问，不推商品卡片。
  - 明确上下文合并采用轻量策略：只有上一轮助手像追问时，才合并最近用户消息。
- 实现内容：
  - 新增 `backend/app/services/clarification_service.py`：
    - 基于 `GiftIntent.missing_slots / must_ask` 判断是否需要追问。
    - 按 `recipient -> scenario -> budget -> preference` 优先级生成单个核心追问。
    - 支持 `allow_generic_recommendation=True` 跳过追问，直接走通用推荐。
  - 更新 `backend/app/schemas/recommendation.py`：
    - `RecommendationRequest` 新增 `allow_generic_recommendation`。
    - `RecommendationResult` 新增 `needs_clarification / clarification_question / missing_slots`。
  - 更新 `backend/app/schemas/chat.py` 与 `backend/app/schemas/gift_plan.py`：
    - 请求增加 `allow_generic_recommendation`。
    - 聊天响应增加 `needs_clarification / clarification_question`。
  - 更新 `backend/app/schemas/gift_intent.py`：
    - 将 `missing_slots` 规范化为 `recipient / scenario / budget / preference`，过滤 LLM 可能返回的非标准槽位。
  - 更新 `backend/app/services/recommendation_service.py`：
    - 在召回和排序前执行追问判断。
    - 需要追问时返回空商品、追问问题和缺失槽位。
  - 更新 `backend/app/services/chat_service.py`：
    - 流式聊天遇到追问时直接输出问题并结束，不调用商品卡片回放。
    - 支持在上一轮助手为追问时合并最近用户消息，便于用户补充后继续推荐。
  - 更新 `backend/app/services/gift_plan_service.py`：
    - 组合礼单遇到追问时返回空礼单和追问问题。
- 验证结果：
  - `python -m compileall app` 通过。
  - 服务级验证 “推荐个礼物”：
    - `needs_clarification=True`。
    - 商品列表为空。
    - 返回追问：“这份礼物主要想送给谁？比如女朋友、朋友、父母、领导或客户。”
  - 服务级验证 “送女朋友生日礼物，预算500元，想要有心意”：
    - `needs_clarification=False`。
    - 正常返回商品推荐。
  - 服务级验证 `allow_generic_recommendation=True`：
    - “推荐个礼物” 不追问，直接返回通用推荐。
  - 聊天流式验证：
    - 第一轮 “推荐个礼物” 只输出追问文本，不推 `product_cards`。
    - 第二轮补充 “送女朋友生日礼物，预算500元” 后正常输出商品卡片。
  - API 验证：
    - `POST /api/products/recommendations` 对模糊输入返回 200，且 `needs_clarification=True`、`products=[]`。
    - `POST /api/gift-plan/generate` 对模糊输入返回 200，且 `products=[]`、`answer` 为追问问题。
- 后续建议：
  - R9 进入用户画像与偏好记忆，把“用户常送对象、常用预算、禁忌偏好”等长期信息纳入推荐。
  - 后续可以把追问问题做成前端快捷 chip，比如“送女朋友 / 送父母 / 送领导”和预算快捷选项，减少用户输入成本。
