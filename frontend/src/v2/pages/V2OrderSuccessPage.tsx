/**
 * v2 支付成功 + 物流追踪页：复刻 Gemini 原型 SVG 二维码 + 顺丰节点 + 返回首页。
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Icon } from '../components/Icon';
import { useV2 } from '../state/V2Context';

const formatYuan = (n: number) => `¥${Math.round(n).toLocaleString('zh-CN')}`;

export default function V2OrderSuccessPage() {
  const navigate = useNavigate();
  const { latestOrder, triggerIsland } = useV2();

  useEffect(() => {
    if (!latestOrder) return;
    triggerIsland('订单已支付', `单号 ${latestOrder.orderId}`, 5000);
  }, [latestOrder, triggerIsland]);

  if (!latestOrder) {
    return (
      <div className="px-5 py-8 text-center text-[12px] text-slate-500">
        <p>暂无订单数据</p>
        <button
          onClick={() => navigate('/v2/home')}
          className="mt-4 text-[11px] text-indigo-400 underline"
        >
          返回首页
        </button>
      </div>
    );
  }

  const { orderId, items, totalAmount, needLuxuryBox, needAudioQR, address } = latestOrder;

  return (
    <div className="px-5 py-4 animate-fadeIn">
      <div className="py-6 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/10">
          <Icon name="check" className="h-6 w-6 text-emerald-400" />
        </div>
        <h3 className="text-base font-bold text-white">订单支付成功</h3>
        <p className="mt-1 text-[10px] text-slate-500">单号：{orderId}</p>
        <p className="mt-1 text-[10px] text-slate-500">实付：{formatYuan(totalAmount)}</p>
      </div>

      <div className="space-y-4">
        {/* 实体二维码语音卡片预览 */}
        {needAudioQR && (
          <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-[#0e1017] p-4">
            <div className="mb-3 flex items-center space-x-1.5">
              <Icon name="qr-code" className="h-4 w-4 text-cyan-400" />
              <span className="text-[10px] font-bold tracking-wider text-cyan-400">
                配音卡片二维码已随件印发
              </span>
            </div>

            <div className="flex items-center space-x-4">
              {/* 极精美的模拟 SVG 二维码图案 */}
              <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-white p-1.5">
                <svg className="h-full w-full text-slate-900" viewBox="0 0 100 100">
                  <rect x="0" y="0" width="30" height="30" fill="currentColor" />
                  <rect x="5" y="5" width="20" height="20" fill="white" />
                  <rect x="10" y="10" width="10" height="10" fill="currentColor" />

                  <rect x="70" y="0" width="30" height="30" fill="currentColor" />
                  <rect x="75" y="5" width="20" height="20" fill="white" />
                  <rect x="80" y="10" width="10" height="10" fill="currentColor" />

                  <rect x="0" y="70" width="30" height="30" fill="currentColor" />
                  <rect x="5" y="75" width="20" height="20" fill="white" />
                  <rect x="10" y="80" width="10" height="10" fill="currentColor" />

                  <path d="M 40,10 H 50 V 20 H 40 Z" fill="currentColor" />
                  <path d="M 10,40 H 20 V 50 H 10 Z" fill="currentColor" />
                  <path d="M 50,40 H 60 V 60 H 50 Z" fill="currentColor" />
                  <path d="M 80,40 H 90 V 60 H 80 Z" fill="currentColor" />
                  <path d="M 40,70 H 60 V 80 H 40 Z" fill="currentColor" />
                  <path d="M 70,70 H 90 V 90 H 70 Z" fill="currentColor" />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-5 w-5 items-center justify-center rounded-md border border-indigo-500/50 bg-black">
                    <Icon name="mic" className="h-2.5 w-2.5 text-indigo-400" />
                  </div>
                </div>
              </div>

              <div className="flex-1">
                <p className="text-[11px] font-bold text-white">收信人扫一扫听到你</p>
                <p className="mt-1 text-[10px] leading-relaxed text-slate-400">
                  对方在拆礼盒时，只需用手机摄像头扫描此贺卡卡片，即可立时听到你在客户端合成的高品质祝福。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 礼盒清单 */}
        <div className="rounded-xl border border-slate-900 bg-[#11131c] p-3">
          <span className="mb-2 block text-[10px] font-bold tracking-wider text-slate-500">
            本单礼物（{items.length}）
            {needLuxuryBox && (
              <span className="ml-2 rounded-full bg-indigo-500/10 px-1.5 py-0.5 text-[9px] text-indigo-300">
                奢华礼盒
              </span>
            )}
          </span>
          <ul className="space-y-1.5">
            {items.map((it, idx) => (
              <li
                key={`${it.productId}-${idx}`}
                className="flex items-center justify-between text-[11px]"
              >
                <span className="truncate text-slate-300">{it.name}</span>
                <span className="font-bold text-white">{formatYuan(it.price)}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 顺丰轨迹进度条 */}
        <div className="rounded-xl border border-slate-900 bg-[#11131c] p-3">
          <span className="mb-2 block text-[10px] font-bold tracking-wider text-slate-500">
            一公里物流节点轨迹
          </span>
          <div className="flex items-center space-x-3 text-[11px]">
            <div className="h-1.5 w-1.5 shrink-0 animate-ping rounded-full bg-indigo-500" />
            <span className="font-bold text-indigo-400">
              顺丰揽件中：{address.fullAddress.split(' ')[0] || '浙江省杭州市西湖区'}
            </span>
          </div>
          <div className="mt-2 flex items-center space-x-3 text-[10px] text-slate-500">
            <Icon name="truck" className="h-3.5 w-3.5" />
            <span>预计 24h 内由顺丰特快配送至：{address.recipient} {address.phone}</span>
          </div>
        </div>

        {/* 返回首页 */}
        <button
          onClick={() => navigate('/v2/home')}
          className="w-full rounded-xl bg-slate-800 py-2.5 text-center text-[11px] font-bold text-slate-300 transition-transform hover:bg-slate-700 active:scale-95"
        >
          返回首页尊享阁
        </button>
      </div>
    </div>
  );
}