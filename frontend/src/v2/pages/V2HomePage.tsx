/**
 * v2 首页：按 Gemini 原型重做的轻奢白底首页。
 * 重点是品牌门面、强 hero、双列甄选商品卡，而不是暗黑商品列表。
 */
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Icon } from '../components/Icon';
import { getInstantProducts, type V2InstantProduct } from '../api/v2Api';
import { addV2CartItem } from '../api/v2CartApi';
import { useV2 } from '../state/V2Context';
import type { ProductCardData } from '../../api/chat';

const fallbackProducts: V2InstantProduct[] = [
  {
    id: 'fallback-aroma',
    name: '巴黎幽境 · 轻奢手工香氛礼盒',
    price: 299,
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&q=80&w=600',
    desc: '温柔木质香调，适合生日和日常关怀。',
    tag: '生活美学',
  },
  {
    id: 'fallback-mic',
    name: '落日余晖 · 复古黑胶无线音箱',
    price: 458,
    image: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=600',
    desc: '复古造型与氛围灯效，适合有品味的 TA。',
    tag: '高端数码',
  },
  {
    id: 'fallback-pen',
    name: '低调绅士 · 极简金属签字笔',
    price: 168,
    image: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&q=80&w=600',
    desc: '商务、教师、同事场景都稳妥。',
    tag: '文具礼品',
  },
  {
    id: 'fallback-box',
    name: '粉金礼遇 · 高定惊喜礼盒',
    price: 399,
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?auto=format&fit=crop&q=80&w=600',
    desc: '仪式感包装，适合节日和纪念日。',
    tag: '智能家居',
  },
];

const toProductCard = (prod: V2InstantProduct): ProductCardData => ({
  product_id: prod.id,
  name: prod.name,
  image_url: prod.image || null,
  price: prod.price,
  tags: [prod.tag],
  highlights: [prod.desc],
  reason: prod.desc || '适合作为京礼精选礼物',
  display_reason: prod.desc || '适合作为京礼精选礼物',
});

function ProductImage({ product }: { product: V2InstantProduct }) {
  const [failed, setFailed] = useState(false);
  if (!product.image || failed) {
    return (
      <div className="grid h-full w-full place-items-center bg-gradient-to-br from-slate-100 via-white to-orange-50 text-2xl">
        🎁
      </div>
    );
  }
  return (
    <img
      src={product.image}
      alt={product.name}
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

function HomeProductCard({
  product,
  onAdd,
}: {
  product: V2InstantProduct;
  onAdd: (product: V2InstantProduct) => void;
}) {
  return (
    <article className="overflow-hidden rounded-[20px] bg-white shadow-[0_12px_26px_rgba(15,23,42,0.07)] ring-1 ring-slate-100">
      <div className="relative h-[92px] overflow-hidden bg-slate-100">
        <ProductImage product={product} />
        <span className="absolute left-2.5 top-2.5 rounded-full bg-slate-950/78 px-2 py-0.5 text-[10px] font-black text-white backdrop-blur">
          {product.tag || '精选好礼'}
        </span>
      </div>
      <div className="p-2.5">
        <h3 className="line-clamp-2 min-h-8 text-[12px] font-black leading-4 text-[#111827]">
          {product.name}
        </h3>
        <p className="mt-1 line-clamp-2 min-h-7 text-[9px] font-semibold leading-[13px] text-slate-500">
          {product.desc || '京礼真实商品库精选，适合体面送礼。'}
        </p>
        <div className="mt-1 text-[17px] font-black tracking-tight text-[#070b1a]">
          ¥{Math.round(product.price).toLocaleString('zh-CN')}
        </div>
        <button
          type="button"
          onClick={() => onAdd(product)}
          className="mt-2 h-8 w-full rounded-[14px] bg-[#071026] text-[11px] font-black text-white shadow-[0_8px_14px_rgba(7,16,38,0.16)] transition active:scale-[0.98]"
        >
          加入购物车
        </button>
      </div>
    </article>
  );
}

export default function V2HomePage() {
  const navigate = useNavigate();
  const { showToast, setCartItems, triggerIsland } = useV2();
  const [products, setProducts] = useState<V2InstantProduct[]>([]);
  const displayProducts = useMemo(() => (products.length ? products : fallbackProducts), [products]);

  useEffect(() => {
    let alive = true;
    getInstantProducts(4)
      .then((items) => {
        if (alive) setProducts(items);
      })
      .catch((err) => {
        console.error(err);
        if (alive) showToast('商品库暂时不可用，已展示本地精选样例');
      });
    return () => {
      alive = false;
    };
  }, [showToast]);

  async function handleAdd(product: V2InstantProduct) {
    try {
      const next = await addV2CartItem(toProductCard(product));
      setCartItems(next);
      triggerIsland('已加入购物车', product.name, 3000);
    } catch (err) {
      console.error(err);
      showToast('加入购物车失败，请确认后端已启动');
    }
  }

  return (
    <div className="min-h-full bg-[#f7f8fb] px-6 pb-8 pt-5 text-[#070b1a] animate-fadeIn">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-[26px] font-black leading-none tracking-[-0.04em] text-[#070b1a]">
            Maison d'Amour
          </h1>
          <p className="mt-2 text-[12px] font-black tracking-[0.12em] text-slate-400">
            爱慕工坊 · 掌上自营店
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/v2/cart')}
          aria-label="查看购物车"
          className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-[#ff9f1c] via-[#ff6b26] to-[#f43f5e] text-white shadow-[0_10px_20px_rgba(244,63,94,0.2)] transition active:scale-95"
        >
          <Icon name="gift" className="h-5 w-5" />
        </button>
      </header>

      <section className="relative overflow-hidden rounded-[26px] bg-[#020719] px-5 py-5 shadow-[0_20px_34px_rgba(2,7,25,0.16)]">
        <div className="pointer-events-none absolute -bottom-16 -left-12 h-44 w-44 rounded-full bg-[#fb3159]/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-8 top-10 h-40 w-40 rounded-full bg-[#ff9f1c]/18 blur-3xl" />
        <div className="relative">
          <div className="text-[11px] font-black tracking-[0.28em] text-[#ffd234]">
            AI-GIFT EXPERT
          </div>
          <h2 className="mt-3.5 text-[22px] font-black leading-[1.32] tracking-[-0.04em] text-white">
            卡在挑选礼物的关头?
            <br />
            让全新 <span className="text-[#ffd234]">京礼 AI</span> 拯救灵感!
          </h2>
          <p className="mt-3.5 max-w-[278px] text-[11px] font-semibold leading-5 text-slate-400">
            一键分析送礼对象喜好，自主绘制质感概念图，生成体面又有分寸的送礼方案。
          </p>
          <button
            type="button"
            onClick={() => navigate('/v2/wizard')}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-[#fb3f63] via-[#ff6441] to-[#f59e0b] text-[14px] font-black text-white shadow-[0_12px_22px_rgba(251,63,99,0.2)] transition active:scale-[0.98]"
          >
            <Icon name="sparkles" className="h-4 w-4" />
            <span>开启 AI 送礼专家</span>
            <Icon name="arrow-right" className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>

      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-[17px] font-black tracking-[-0.04em] text-[#070b1a]">
            <span className="text-sm">🌟</span>
            今日甄选好物现货
          </h2>
          <span className="text-[10px] font-black tracking-[0.14em] text-slate-300">REAL STOCK</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {displayProducts.map((product) => (
            <HomeProductCard key={product.id} product={product} onAdd={handleAdd} />
          ))}
        </div>
      </section>
    </div>
  );
}
