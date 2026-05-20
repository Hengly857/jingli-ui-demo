/**
 * v2 购物车页：复用旧版礼单接口（list_id="default"），简洁列表 + 进入收银台。
 */
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Icon } from '../components/Icon';
import { useV2 } from '../state/V2Context';
import { decreaseV2CartItem, fetchV2Cart, removeV2CartItem } from '../api/v2CartApi';

const formatYuan = (n: number) => `¥${Math.round(n).toLocaleString('zh-CN')}`;

export default function V2CartPage() {
  const navigate = useNavigate();
  const { cartItems, setCartItems, clearCart, showToast } = useV2();
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setIsLoading(true);
    fetchV2Cart()
      .then((items) => {
        if (alive) setCartItems(items);
      })
      .catch(() => {
        if (alive) showToast('读取礼单失败，请确认后端已启动');
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const subtotal = cartItems.reduce((s, it) => s + it.price, 0);

  async function handleClearAll() {
    if (cartItems.length === 0) return;
    setBusyId('__all__');
    try {
      // 逐个 remove，远端礼单清空（旧版没有 batch 清空接口）
      const uniqueIds = Array.from(new Set(cartItems.map((it) => it.productId)));
      let next = cartItems;
      for (const productId of uniqueIds) {
        // eslint-disable-next-line no-await-in-loop
        next = await removeV2CartItem(productId);
      }
      setCartItems(next);
      clearCart();
    } catch {
      showToast('清空失败，请重试');
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemoveOne(productId: string) {
    setBusyId(productId);
    try {
      const next = await decreaseV2CartItem(productId, cartItems);
      setCartItems(next);
    } catch {
      showToast('移除失败，请重试');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="px-5 py-4 animate-fadeIn">
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={() => navigate('/v2/home')}
          className="p-1 text-slate-400 hover:text-white"
          aria-label="返回首页"
        >
          <Icon name="chevron-left" className="h-6 w-6" />
        </button>
        <span className="text-sm font-bold text-slate-200">购物车 ({cartItems.length})</span>
        <button
          onClick={handleClearAll}
          disabled={cartItems.length === 0 || busyId !== null}
          className="text-[10px] text-slate-500 hover:text-slate-300 disabled:opacity-40"
        >
          清空
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center text-[11px] text-slate-500">正在读取礼单...</div>
      ) : cartItems.length === 0 ? (
        <div className="py-20 text-center">
          <Icon name="shopping-cart" className="mx-auto mb-3 h-12 w-12 text-slate-700" />
          <p className="text-xs text-slate-500">购物车内没有任何商品</p>
          <button
            onClick={() => navigate('/v2/home')}
            className="mt-4 text-[11px] text-indigo-400 underline"
          >
            返回尊享特区
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {cartItems.map((item, index) => (
            <div
              key={`${item.productId}-${index}`}
              className="flex space-x-3 rounded-xl border border-slate-900 bg-[#11131c] p-3"
            >
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} className="h-16 w-16 rounded-lg object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-800 text-slate-600">
                  <Icon name="image" className="h-6 w-6" />
                </div>
              )}
              <div className="flex flex-1 flex-col justify-between">
                <div>
                  <h5 className="text-[12px] font-bold leading-tight text-white">{item.name}</h5>
                  <p className="mt-0.5 line-clamp-1 text-[10px] text-slate-500">
                    {item.isAiCustom ? 'AI 专属高定配置' : item.desc || '京礼推荐心意之选'}
                  </p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-[12px] font-bold text-white">{formatYuan(item.price)}</span>
                  <button
                    onClick={() => handleRemoveOne(item.productId)}
                    disabled={busyId !== null}
                    className="flex items-center space-x-1 text-[10px] text-slate-500 hover:text-red-400 disabled:opacity-40"
                  >
                    <Icon name="x" className="h-3 w-3" />
                    <span>移除</span>
                  </button>
                </div>
              </div>
            </div>
          ))}

          <div className="mt-6 space-y-2 border-t border-slate-900 pt-4">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>小计</span>
              <span>{formatYuan(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white">
              <span>总额</span>
              <span>{formatYuan(subtotal)}</span>
            </div>
          </div>

          <button
            onClick={() => navigate('/v2/checkout')}
            className="mt-4 w-full rounded-xl bg-indigo-600 py-3 text-center text-[12px] font-bold text-white shadow-lg transition-transform hover:bg-indigo-500 active:scale-95"
          >
            进入收银台
          </button>
        </div>
      )}
    </div>
  );
}