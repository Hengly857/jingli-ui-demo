from __future__ import annotations

from app.schemas.gift_intent import GiftIntent


class ClarificationService:
    """Decides when the guide should ask before recommending."""

    _SLOT_QUESTIONS: dict[str, str] = {
        "recipient": "这份礼物主要想送给谁？比如女朋友、朋友、父母、领导或客户。",
        "scenario": "这是为了什么场景送礼？比如生日、见家长、乔迁、节日或商务拜访。",
        "budget": "你的大概预算是多少？给我一个范围也可以。",
        "preference": "对风格或禁忌有什么偏好吗？比如实用、体面、浪漫、健康，或者不要太张扬。",
    }

    _PRIORITY = ("recipient", "scenario", "budget", "preference")

    def should_ask(self, intent: GiftIntent, *, allow_generic: bool = False) -> bool:
        if allow_generic:
            return False
        if intent.must_ask:
            return True
        missing = set(intent.missing_slots)
        # 预算缺失时可以给通用分档推荐；但如果用户信息几乎为空，仍建议先问。
        return {"recipient", "scenario"}.issubset(missing)

    def build_question(self, intent: GiftIntent) -> str:
        missing = set(intent.missing_slots)
        for slot in self._PRIORITY:
            if slot in missing:
                return self._SLOT_QUESTIONS[slot]
        if not intent.preferences and not intent.gift_style and not intent.avoid:
            return self._SLOT_QUESTIONS["preference"]
        return "我还需要一个关键信息：这份礼物主要想送给谁、什么场景、预算大概多少？"
