/**
 * v2 购物车 API：复用旧版礼单接口（list_id="default"），把后端 GiftListItem 适配为 V2CartItem。
 */
import {
  addGiftListItem,
  getGiftList,
  previewGiftListCheckout,
  removeGiftListItem,
  updateGiftListItemQuantity,
  type GiftListResponse,
} from '../../api/giftList';
import type { ProductCardData } from '../../api/chat';
import type { V2CartItem } from '../state/V2Context';

const toNumber = (value: number | string | null | undefined): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number') return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * 后端礼单一项可能因为 quantity > 1 需要展开成多条卡片视图，
 * 但 v2 设计是"一件一卡"，因此这里只取 quantity=1 的视觉表示，
 * 数量在 V2CartItem 之外不暴露（与原型语义一致：cart.length 即件数）。
 */
function expandGiftList(response: GiftListResponse): V2CartItem[] {
  const result: V2CartItem[] = [];
  response.items.forEach((item) => {
    const baseItem: V2CartItem = {
      productId: item.product.product_id,
      name: item.product.name,
      price: toNumber(item.product.price),
      imageUrl: item.product.image_url || null,
      desc: item.product.display_reason || item.product.reason || item.product.highlights?.[0] || '',
    };
    const repeats = Math.max(1, item.quantity);
    for (let i = 0; i < repeats; i += 1) {
      result.push({ ...baseItem });
    }
  });
  return result;
}

export async function fetchV2Cart(): Promise<V2CartItem[]> {
  const response = await getGiftList();
  return expandGiftList(response);
}

export async function addV2CartItem(card: ProductCardData): Promise<V2CartItem[]> {
  const response = await addGiftListItem(card);
  return expandGiftList(response);
}

export async function removeV2CartItem(productId: string): Promise<V2CartItem[]> {
  const response = await removeGiftListItem(productId);
  return expandGiftList(response);
}

/**
 * v2 购物车按"件"操作：每点一次减一，数量减到 0 则真正移除该商品。
 */
export async function decreaseV2CartItem(productId: string, currentItems: V2CartItem[]): Promise<V2CartItem[]> {
  const occurrences = currentItems.filter((it) => it.productId === productId).length;
  if (occurrences <= 1) {
    return removeV2CartItem(productId);
  }
  const response = await updateGiftListItemQuantity(productId, occurrences - 1);
  return expandGiftList(response);
}

export async function previewV2Checkout(items: V2CartItem[]) {
  // 按 productId 折叠为 quantity，调用预览接口确认金额
  const map = new Map<string, number>();
  items.forEach((it) => map.set(it.productId, (map.get(it.productId) ?? 0) + 1));
  const payload = Array.from(map.entries()).map(([product_id, quantity]) => ({ product_id, quantity }));
  if (payload.length === 0) return null;
  return previewGiftListCheckout(payload);
}