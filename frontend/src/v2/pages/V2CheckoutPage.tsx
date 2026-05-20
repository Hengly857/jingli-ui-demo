/**
 * v2 结账收银台：默认地址 + 尊贵包装定制 + 费用合计 + 安全支付。
 * 支付按钮：先调后端 checkout-preview 确认金额（无可下单时不真正下单），
 * 然后调用 placeOrder 本地生成订单，清空礼单后跳到 /v2/order-success。
 */
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Icon } from '../components/Icon';
import { useV2 } from '../state/V2Context';
import { previewV2Checkout, removeV2CartItem } from '../api/v2CartApi';

const formatYuan = (n: number) => `¥${Math.round(n).toLocaleString('zh-CN')}`;

const LUXURY_BOX_FEE = 68;

export default function V2CheckoutPage() {
  const navigate = useNavigate();
  const {
    cartItems,
    setCartItems,
    address,
    needLuxuryBox,
    setNeedLuxuryBox,
    needAudioQR,
    setNeedAudioQR,
    placeOrder,
    showToast,
  } = useV2();

  const [submitting, setSubmitting] = useState(false);

  const subtotal = useMemo(() => cartItems.reduce((s, it) => s + it.price, 0), [cartItems]);
  const packagingFee = needLuxuryBox ? LUXURY_BOX_FEE : 0;
  const totalAmount = subtotal + packagingFee;

  async function handlePay() {
    if (cartItems.length === 0) {
      showToast('购物车为空，请先添加心仪礼物');
      return;
    }
    setSubmitting(true);
    try {
      // 调用预览接口让后端再确认一次金额，识别不可结算项
      const preview = await previewV2Checkout(cartItems);
      if (preview && preview.unavailable_product_ids.length > 0) {
        showToast(`有 ${preview.unavailable_product_ids.length} 件商品暂不可结算`);
        setSubmitting(false);
        return;
      }

      // 本地生成订单
      const snapshot = [...cartItems];
      placeOrder({ items: snapshot, subtotal });

      // 清空远端礼单（逐条调用 remove），并刷新本地
      const uniqueIds = Array.from(new Set(cartItems.map((it) => it.productId)));
      let next = cartItems;
      for (const productId of uniqueIds) {
        // eslint-disable-next-line no-await-in-loop
        next = await removeV2CartItem(productId);
      }
      setCartItems(next);

      navigate('/v2/order-success', { replace: true });
    } catch (err) {
      console.error(err);
      showToast('支付失败，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="px-5 py-4 animate-fadeIn">
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={() => navigate('/v2/cart')}
          className="p-1 text-slate-400 hover:text-white"
          aria-label="返回购物车"
        >
          <Icon name="chevron-left" className="h-6 w-6" />
        </button>
        <span className="text-sm font-bold text-slate-200">安全结账台</span>
        <div className="w-8" />
      </div>

      <div className="space-y-4">
        {/* 配送地址 */}
        <div className="rounded-xl border border-slate-900 bg-[#11131c] p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider text-slate-500">默认收件地址</span>
            <button
              onClick={() => showToast('地址簿管理：下一版上线')}
              className="text-[9px] text-indigo-400"
            >
              修改
            </button>
          </div>
          <div className="flex items-start space-x-2">
            <Icon name="map-pin" className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
            <div>
              <p className="text-[11px] font-bold text-white">
                {address.recipient} {address.phone}
              </p>
              <p className="text-[10px] text-slate-400">{address.fullAddress}</p>
            </div>
          </div>
        </div>

        {/* 商品清单（简略） */}
        <div className="rounded-xl border border-slate-900 bg-[#11131c] p-3">
          <span className="mb-2 block text-[10px] font-bold tracking-wider text-slate-500">
            本单礼物（{cartItems.length}）
          </span>
          {cartItems.length === 0 ? (
            <p className="py-2 text-center text-[10px] text-slate-500">购物车为空</p>
          ) : (
            <ul className="space-y-1.5">
              {cartItems.map((it, idx) => (
                <li
                  key={`${it.productId}-${idx}`}
                  className="flex items-center justify-between text-[11px]"
                >
                  <span className="truncate text-slate-300">{it.name}</span>
                  <span className="font-bold text-white">{formatYuan(it.price)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 奢华增值定制选项 */}
        <div className="space-y-3 rounded-xl border border-slate-900 bg-[#11131c] p-3">
          <span className="block text-[10px] font-bold tracking-wider text-slate-500">
            尊贵包装定制服务
          </span>

          <label className="flex cursor-pointer items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name="box" className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-300">手工奢华深空绒皮礼盒</p>
                <p className="text-[9px] text-slate-500">配套香薰干花与纯金丝带寄语</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={needLuxuryBox}
              onChange={(e) => setNeedLuxuryBox(e.target.checked)}
              className="h-4 w-4 accent-indigo-500"
            />
          </label>

          <label className="flex cursor-pointer items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon name="qr-code" className="h-4 w-4 text-slate-400" />
              <div>
                <p className="text-[10px] text-slate-300">实体贺卡专属 AI 声音二维码</p>
                <p className="text-[9px] text-slate-500">实体包装上印专属二维码，扫码立听温暖语音</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={needAudioQR}
              onChange={(e) => setNeedAudioQR(e.target.checked)}
              className="h-4 w-4 accent-indigo-500"
            />
          </label>
        </div>

        {/* 费用总结 */}
        <div className="space-y-2 rounded-xl border border-slate-900 bg-[#11131c] p-3 text-[11px]">
          <div className="flex justify-between text-slate-400">
            <span>礼品小计</span>
            <span>{formatYuan(subtotal)}</span>
          </div>
          {needLuxuryBox && (
            <div className="flex justify-between text-slate-400">
              <span>高级绒礼包装</span>
              <span>+ {formatYuan(LUXURY_BOX_FEE)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-400">
            <span>运费 (顺丰特快)</span>
            <span className="text-emerald-400">免运费</span>
          </div>
          <div className="flex justify-between border-t border-slate-900 pt-2 text-sm font-bold text-white">
            <span>最终金额</span>
            <span>{formatYuan(totalAmount)}</span>
          </div>
        </div>

        {/* 安全支付按钮 */}
        <button
          onClick={handlePay}
          disabled={submitting || cartItems.length === 0}
          className="flex w-full items-center justify-center space-x-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-center text-[12px] font-bold text-white shadow-lg transition-transform hover:opacity-95 active:scale-95 disabled:opacity-50"
        >
          <Icon name="credit-card" className="h-4 w-4" />
          <span>{submitting ? '安全扣款中...' : '微信 / 快捷支付安全扣款'}</span>
        </button>
      </div>
    </div>
  );
}