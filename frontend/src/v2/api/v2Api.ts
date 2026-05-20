/**
 * v2 前端专用 API 客户端：
 * - getInstantProducts：取真实商品库（用于"现货尊享特区"展示）
 * - generateRecommendations：把 wizard 4 字段映射到后端 GiftPlanGenerateRequest，并把响应转成 v2 渲染所需的扁平结构
 */
import { API_BASE, type ProductCardData } from '../../api/chat';
import type { GiftPlanResponse, GiftPlanValuePoint } from '../../api/giftPlan';

export interface V2InstantProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  desc: string;
  tag: string;
}

export interface V2Recommendation {
  productId: string;
  name: string;
  price: number;
  rationale: string;
  tags: string[];
  imageUrl: string | null;
  scenarios: string[];
  targetPeople: string[];
}

export interface V2RecommendationResult {
  planId: string;
  title: string;
  answer: string;
  budget?: number | null;
  totalAmount: number;
  valuePoints: GiftPlanValuePoint[];
  recommendations: V2Recommendation[];
}

export interface V2WizardInput {
  relation: string;
  age: string;
  budget: number;
  tags: string[];
}

const toNumber = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildMessage = ({ relation, age, budget, tags }: V2WizardInput): string => {
  const tagPart = tags.length > 0 ? `TA 的特质标签：${tags.join('、')}。` : '';
  return `想给${relation}（${age}）挑选一份心意礼物，预算约 ${budget} 元。${tagPart}请推荐合适的方案。`;
};

const cardToRecommendation = (card: ProductCardData): V2Recommendation => ({
  productId: card.product_id,
  name: card.name,
  price: toNumber(card.price),
  rationale: card.display_reason || card.reason || card.highlights?.[0] || '匹配你当前的送礼需求',
  tags: (card.tags ?? []).slice(0, 3),
  imageUrl: card.image_url || null,
  scenarios: card.scenarios ?? [],
  targetPeople: card.target_people ?? [],
});

export async function generateRecommendations(input: V2WizardInput): Promise<V2RecommendationResult> {
  const response = await fetch(`${API_BASE}/gift-plan/generate`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      message: buildMessage(input),
      budget: input.budget,
      preference: input.tags.join(','),
      // wizard 没有显式收集"场景"，让后端走通用推荐而非反问澄清
      allow_generic_recommendation: true,
    }),
  });

  if (!response.ok) {
    throw new Error(`Generate recommendations failed: ${response.status}`);
  }

  const data = (await response.json()) as GiftPlanResponse;
  return {
    planId: data.plan_id,
    title: data.title,
    answer: data.answer,
    budget: typeof data.budget === 'string' ? Number(data.budget) : data.budget ?? null,
    totalAmount: toNumber(data.total_amount),
    valuePoints: data.value_points ?? [],
    recommendations: (data.products ?? []).map(cardToRecommendation),
  };
}

export async function getInstantProducts(limit = 4): Promise<V2InstantProduct[]> {
  const response = await fetch(`${API_BASE}/products`);
  if (!response.ok) {
    throw new Error(`Fetch instant products failed: ${response.status}`);
  }
  const list = (await response.json()) as Array<{
    product_id: string;
    name: string;
    category?: string | null;
    price: number | string | null;
    image_url?: string | null;
    tags?: string[];
    highlights?: string[];
    scenarios?: string[];
    target_people?: string[];
  }>;
  const giftSignals = ['香', '礼', '茶', '花', '杯', '围巾', '健康', '家居', '咖啡', '美妆', '护肤', '首饰'];
  const scoreProduct = (p: (typeof list)[number]) => {
    const joined = [
      p.name,
      p.category,
      ...(p.tags ?? []),
      ...(p.highlights ?? []),
      ...(p.scenarios ?? []),
      ...(p.target_people ?? []),
    ].join(' ');
    const giftScore = giftSignals.reduce((score, signal) => score + (joined.includes(signal) ? 8 : 0), 0);
    const imageScore = p.image_url ? 20 : 0;
    const price = toNumber(p.price);
    const priceScore = price >= 80 && price <= 2500 ? 12 : price > 0 ? 4 : 0;
    return giftScore + imageScore + priceScore;
  };
  // 首页是品牌门面，优先展示有图、送礼感强的商品，而不是简单按价格取最贵。
  const sorted = [...list].sort((a, b) => scoreProduct(b) - scoreProduct(a));
  return sorted.slice(0, limit).map((p) => ({
    id: p.product_id,
    name: p.name,
    price: toNumber(p.price),
    image: p.image_url || '',
    desc: p.highlights?.[0] || '',
    tag: p.tags?.[0] || '精选',
  }));
}
