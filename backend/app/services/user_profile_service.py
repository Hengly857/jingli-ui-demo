from __future__ import annotations

import threading

from app.schemas.gift_intent import GiftIntent, infer_budget_level
from app.schemas.product import ProductCard
from app.schemas.user_profile import GiftUserProfile


class UserProfileService:
    """Process-local gift preference profile for the demo."""

    _instance: "UserProfileService | None" = None
    _instance_lock = threading.Lock()

    def __new__(cls) -> "UserProfileService":
        with cls._instance_lock:
            if cls._instance is None:
                inst = super().__new__(cls)
                inst._profiles = {}  # type: ignore[attr-defined]
                inst._lock = threading.Lock()  # type: ignore[attr-defined]
                cls._instance = inst
        return cls._instance

    _profiles: dict[str, GiftUserProfile]
    _lock: threading.Lock

    def get(self, profile_key: str | None) -> GiftUserProfile | None:
        if not profile_key:
            return None
        with self._lock:
            profile = self._profiles.get(profile_key)
            return profile.model_copy(deep=True) if profile else GiftUserProfile()

    def merge_intent(self, intent: GiftIntent, profile: GiftUserProfile | None) -> GiftIntent:
        if profile is None:
            return intent

        data = intent.model_dump()
        if data.get("budget") is None and profile.last_budget is not None:
            data["budget"] = profile.last_budget
            data["budget_level"] = data.get("budget_level") or infer_budget_level(profile.last_budget)

        if not data.get("target_people") and profile.last_target_people:
            data["target_people"] = profile.last_target_people[:]
        if not data.get("recipient") and profile.frequent_recipients:
            data["recipient"] = profile.frequent_recipients[0]
        if not data.get("scenarios") and profile.last_scenarios:
            data["scenarios"] = profile.last_scenarios[:]
            data["scenario"] = data.get("scenario") or profile.last_scenarios[0]
        if not data.get("gift_style") and profile.preferred_styles:
            data["gift_style"] = profile.preferred_styles[:3]

        return GiftIntent.model_validate(data)

    def mark_dislikes_from_message(self, profile_key: str | None, message: str) -> int:
        if not profile_key or not self._is_dislike_message(message):
            return 0
        with self._lock:
            profile = self._profiles.setdefault(profile_key, GiftUserProfile())
            before = len(profile.disliked_product_ids)
            profile.disliked_product_ids = self._merge_unique(
                [*profile.recommended_product_ids[-6:], *profile.disliked_product_ids],
                max_items=40,
            )
            return len(profile.disliked_product_ids) - before

    def update_after_recommendation(
        self,
        profile_key: str | None,
        *,
        intent: GiftIntent,
        products: list[ProductCard],
    ) -> GiftUserProfile | None:
        if not profile_key:
            return None
        with self._lock:
            profile = self._profiles.setdefault(profile_key, GiftUserProfile())
            if intent.budget is not None:
                profile.last_budget = intent.budget
            if intent.budget_level:
                profile.preferred_budget_levels = self._merge_unique(
                    [intent.budget_level, *profile.preferred_budget_levels],
                    max_items=6,
                )
            if intent.target_people:
                profile.last_target_people = intent.target_people[:]
                profile.frequent_recipients = self._merge_unique(
                    [*intent.target_people, *profile.frequent_recipients],
                    max_items=12,
                )
            if intent.scenarios:
                profile.last_scenarios = intent.scenarios[:]
            if intent.gift_style:
                profile.preferred_styles = self._merge_unique(
                    [*intent.gift_style, *profile.preferred_styles],
                    max_items=12,
                )
            if products:
                profile.recommended_product_ids = self._merge_unique(
                    [
                        *(item.product_id for item in products if item.product_id),
                        *profile.recommended_product_ids,
                    ],
                    max_items=50,
                )
            return profile.model_copy(deep=True)

    @staticmethod
    def _is_dislike_message(message: str) -> bool:
        markers = ("不喜欢", "不想要", "不要这个", "别推荐", "换一个", "换一批", "不合适")
        return any(marker in message for marker in markers)

    @staticmethod
    def _merge_unique(values: list[str], *, max_items: int) -> list[str]:
        merged: list[str] = []
        for value in values:
            if not value or value in merged:
                continue
            merged.append(value)
            if len(merged) >= max_items:
                break
        return merged
