/**
 * v2 推荐方案视图：渲染 RAG 召回 + LLM 重排后返回的真实商品 + 价值点 + 总结文案
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Icon } from '../components/Icon';
import { useV2 } from '../state/V2Context';
import type { V2Recommendation } from '../api/v2Api';
import { addV2CartItem } from '../api/v2CartApi';
import type { ProductCardData } from '../../api/chat';

const recToProductCard = (rec: V2Recommendation): ProductCardData => ({
  product_id: rec.productId,
  name: rec.name,
  image_url: rec.imageUrl,
  price: rec.price,
  tags: rec.tags,
  highlights: [rec.rationale],
  reason: rec.rationale,
  display_reason: rec.rationale,
  scenarios: rec.scenarios,
  target_people: rec.targetPeople,
});

function ProductImage({ rec }: { rec: V2Recommendation }) {
  if (!rec.imageUrl) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 text-center text-slate-400">
        <Icon name="image" className="mb-3 h-8 w-8 text-slate-400" />
        <button
          type="button"
          className="rounded-md bg-[#f59e0b] px-3 py-1.5 text-[10px] font-black text-white shadow-sm"
        >
          生成实物图
        </button>
      </div>
    );
  }
  return (
    <img
      src={rec.imageUrl}
      alt={rec.name}
      className="h-full w-full rounded-2xl object-cover"
      onError={(e) => {
        const target = e.currentTarget as HTMLImageElement;
        target.style.display = 'none';
        const fallback = target.parentElement?.querySelector('[data-fallback]');
        if (fallback) (fallback as HTMLElement).style.display = 'flex';
      }}
    />
  );
}

export default function V2RecommendationsPage() {
  const navigate = useNavigate();
  const { recommendations, showToast, setCartItems, triggerIsland } = useV2();

  // 直接刷新此页面没有数据时，引导用户回到 wizard
  useEffect(() => {
    if (!recommendations) {
      const timer = window.setTimeout(() => navigate('/v2/wizard', { replace: true }), 50);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [recommendations, navigate]);

  if (!recommendations) {
    return (
      <div className="flex h-full items-center justify-center text-[12px] text-slate-500">
        正在跳转到画像配置...
      </div>
    );
  }

  async function handlePickToCart(rec: V2Recommendation) {
    try {
      const next = await addV2CartItem(recToProductCard(rec));
      setCartItems(next);
      triggerIsland('已加入礼单', `${rec.name} · 京礼礼单`, 3000);
      navigate('/v2/cart');
    } catch (err) {
      console.error(err);
      showToast('加入礼单失败，请确认后端礼单服务已启动');
    }
  }

  const { answer, recommendations: list } = recommendations;
  const introCount = Math.max(list.length, 1);

  return (
    <div className="min-h-full bg-[#f8f9fb] px-5 pb-7 pt-4 text-slate-950 animate-fadeIn">
      <div className="mb-5 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/v2/wizard')}
          className="flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-white hover:text-slate-900"
        >
          <Icon name="chevron-left" className="h-[18px] w-[18px]" />
        </button>
        <span className="text-[13px] font-black text-slate-400">AI 推荐礼品清单</span>
        <div className="w-8" />
      </div>

      <section className="mb-5 rounded-[18px] border border-[#ffe4a8] bg-gradient-to-br from-[#fffdf4] via-[#fff8f1] to-[#fff3f7] px-4 py-4 shadow-sm">
        <div className="flex items-start gap-2">
          <Icon name="sparkles" className="mt-0.5 h-5 w-5 shrink-0 text-[#f59e0b]" />
          <div>
            <h1 className="text-[15px] font-black tracking-tight text-slate-950">
              AI 已调遣如下定制礼包
            </h1>
            <p className="mt-1 text-[11px] font-semibold leading-5 text-slate-500">
              为您在高端供应链检索并绘制了如下 {introCount} 个专属方案：
            </p>
          </div>
        </div>
      </section>

      <div className="space-y-4">
        {list.map((gift, idx) => (
          <article
            key={gift.productId}
            className="grid grid-cols-[108px_minmax(0,1fr)] gap-4 rounded-[18px] bg-white p-4 shadow-[0_8px_20px_rgba(15,23,42,0.06)] ring-1 ring-slate-100"
          >
            <div className="min-w-0">
              <div className="h-[108px] w-[108px] overflow-hidden rounded-2xl bg-slate-50">
                <ProductImage rec={gift} />
              </div>
              <p className="mt-2 truncate text-center text-[10px] font-black text-slate-400">
                {gift.tags[0] || gift.scenarios[0] || `方案 ${idx + 1}`}
              </p>
            </div>

            <div className="min-w-0">
              <div className="mb-1.5 flex items-start justify-between gap-3">
                <h2 className="min-w-0 flex-1 text-[14px] font-black leading-5 text-slate-950 line-clamp-2">
                  {gift.name}
                </h2>
                <span className="shrink-0 text-[14px] font-black text-[#ff3f63]">¥{gift.price}</span>
              </div>

              <p className="mb-3 text-[11px] font-semibold leading-5 text-slate-500 line-clamp-3">
                {gift.rationale || answer || '这份礼物匹配当前画像，适合作为专属送礼方案。'}
              </p>

              <div className="mb-3 flex flex-wrap gap-1.5">
                {(gift.tags.length > 0 ? gift.tags : gift.scenarios).slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-lg bg-[#fff0f2] px-2.5 py-1 text-[10px] font-black text-[#ff3f63]"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-[#fff0f2] px-3 py-2 text-[10px] font-black text-[#ff3f63]"
                >
                  写专属语音卡
                </button>
                <button
                  type="button"
                  onClick={() => handlePickToCart(gift)}
                  className="rounded-xl bg-[#020719] px-4 py-2 text-[10px] font-black text-white shadow-[0_8px_16px_rgba(2,7,25,0.14)] transition active:scale-95"
                >
                  选这个结算
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {list.length === 0 && (
        <div className="rounded-2xl bg-white p-5 text-center text-[12px] font-bold text-slate-500 shadow-sm ring-1 ring-slate-100">
          暂时没有匹配到合适礼品，请返回修改画像条件。
        </div>
      )}
    </div>
  );
}
