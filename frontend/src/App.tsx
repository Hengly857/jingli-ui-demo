import { useEffect, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import {
  ComboChatPage,
  CompareRecommendationPage,
  GiftCartPage,
  GiftComboPlanPage,
  GiftSolutionPage,
  HomePage,
  JingliPage,
  PremiumComboPlanPage,
} from './pages/AppPages';
import V2Layout from './v2/V2Layout';
import V2HomePage from './v2/pages/V2HomePage';
import V2WizardPage from './v2/pages/V2WizardPage';
import V2RecommendationsPage from './v2/pages/V2RecommendationsPage';
import V2CartPage from './v2/pages/V2CartPage';
import V2CheckoutPage from './v2/pages/V2CheckoutPage';
import V2OrderSuccessPage from './v2/pages/V2OrderSuccessPage';

const DEVICE_WIDTH = 390;
const DEVICE_HEIGHT = 844;

function useDeviceScale() {
  const getScale = () => {
    const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    return Math.min(1, (viewportWidth - 32) / DEVICE_WIDTH, (viewportHeight - 32) / DEVICE_HEIGHT);
  };

  const [scale, setScale] = useState(getScale);

  useEffect(() => {
    const syncScale = () => setScale(getScale());
    syncScale();
    window.addEventListener('resize', syncScale);
    window.visualViewport?.addEventListener('resize', syncScale);
    return () => {
      window.removeEventListener('resize', syncScale);
      window.visualViewport?.removeEventListener('resize', syncScale);
    };
  }, []);

  return scale;
}

export default function App() {
  const deviceScale = useDeviceScale();

  return (
    <main className="flex h-screen items-center justify-center overflow-hidden bg-[#f3f4f7] text-zinc-950">
      <div
        style={{ width: DEVICE_WIDTH * deviceScale, height: DEVICE_HEIGHT * deviceScale }}
      >
        <section
          className="h-[844px] w-[390px] origin-top-left rounded-[50px] bg-[#0c0d12] p-2 shadow-[0_25px_60px_rgba(0,0,0,0.45),inset_0_0_0_1px_rgba(255,255,255,0.08)]"
          style={{ transform: `scale(${deviceScale})` }}
        >
          <div className="h-[828px] w-[374px] overflow-hidden rounded-[42px] bg-gradient-to-b from-[#fff4f1] via-[#f6f3f2] to-[#f1f2f4] shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)]">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Navigate to="/home" replace />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/jingli" element={<JingliPage />} />
              <Route path="/combo-chat" element={<ComboChatPage />} />
              <Route path="/compare" element={<CompareRecommendationPage />} />
              <Route path="/combo-plan" element={<GiftComboPlanPage />} />
              <Route path="/gift-solution" element={<GiftSolutionPage />} />
              <Route path="/combo-premium" element={<PremiumComboPlanPage />} />
              <Route path="/cart" element={<GiftCartPage />} />
              <Route path="/combo" element={<Navigate to="/combo-plan" replace />} />

              {/* v2 新版：原型迁移版本，与旧版并存 */}
              <Route path="/v2" element={<V2Layout />}>
                <Route index element={<Navigate to="/v2/home" replace />} />
                <Route path="home" element={<V2HomePage />} />
                <Route path="wizard" element={<V2WizardPage />} />
                <Route path="recommendations" element={<V2RecommendationsPage />} />
                <Route path="cart" element={<V2CartPage />} />
                <Route path="checkout" element={<V2CheckoutPage />} />
                <Route path="order-success" element={<V2OrderSuccessPage />} />
                <Route path="*" element={<Navigate to="/v2/home" replace />} />
              </Route>

              <Route path="*" element={<Navigate to="/home" replace />} />
            </Routes>
          </BrowserRouter>
          </div>
        </section>
      </div>
    </main>
  );
}
