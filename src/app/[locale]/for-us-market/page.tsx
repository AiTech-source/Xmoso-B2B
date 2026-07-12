import { generateLocaleParams } from "@/lib/static-params";
export const generateStaticParams = generateLocaleParams;
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Breadcrumbs from "@/components/layout/Breadcrumbs";
import { createServerStaticClient } from "@/lib/supabase/server-static";
import { ogImageUrl, getOgSettings } from "@/lib/seo/og";
import { generateAlternates } from "@/lib/seo/hreflang";
import { localePath } from "@/lib/locale-path";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const supabase = await createServerStaticClient();
  const ogSet = await getOgSettings(supabase);
  const isZh = locale === "zh";
  return {
    title: isZh
      ? "北美市场酒柜 OEM 供应商 — ETL/UL 认证酒柜定制 | Xmoso"
      : "Wine Cooler OEM for North America — ETL/UL Certified Custom Wine Fridge Supplier | Xmoso",
    description: isZh
      ? "专为北美市场提供 ETL/UL 认证酒柜 OEM 服务。120V/60Hz 标准、ENERGY STAR 合规、北美仓储代发。中国酒柜工厂直供美国加拿大品牌商。"
      : "Xmoso offers ETL/UL certified wine cooler OEM for North American brands. 120V/60Hz standard, ENERGY STAR compliance, US/CA warehouse distribution. China factory direct.",
    alternates: generateAlternates("/for-us-market", locale),
    openGraph: {
      type: "website",
      title: `Xmoso — ${isZh ? "北美酒柜 OEM" : "Wine Cooler OEM North America"}`,
      description: isZh ? "ETL/UL 认证酒柜，专供美国加拿大市场。" : "ETL/UL certified wine coolers for the US and Canadian markets.",
      images: [{ url: ogImageUrl({ title: "Wine Cooler OEM North America", subtitle: "ETL/UL Certified Factory", type: "page", brand: ogSet.brand }), width: 1200, height: 630 }],
    },
  };
}

export default async function ForUSMarketPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isZh = locale === "zh";

  return (
    <>
      <Header />
      <main style={{ paddingTop: "64px", minHeight: "80vh" }}>
        <Breadcrumbs items={[{ label: isZh ? "北美市场" : "North America Market" }]} />

        <div className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-3xl md:text-4xl font-light tracking-wider text-white leading-tight mb-6">
            {isZh ? "北美市场酒柜 OEM 解决方案" : "Wine Cooler OEM Solutions for North America"}
          </h1>
          <p className="text-silver/50 text-sm mb-12">
            {isZh
              ? "ETL/UL 认证 · 120V/60Hz 标准 · ENERGY STAR 合规 · 北美仓储代发"
              : "ETL/UL Certified · 120V/60Hz Standard · ENERGY STAR Compliant · US Warehouse Distribution"}
          </p>

          <div className="space-y-8 text-silver/70 text-[15px] leading-relaxed">
            {isZh ? (
              <>
                <p>Xmoso 是为北美品牌商提供酒柜 OEM 服务的专业制造商。所有出口美国市场的产品均通过 ETL 或 UL 安全认证，符合 DOE（美国能源部）能效标准和 ENERGY STAR 自愿性能效标签要求。</p>
                <p>我们理解北美市场的特殊要求：120V/60Hz 电气标准、ADA 无障碍合规选项、加州 CEC 能效数据库注册支持。产品开发阶段即可将这些要求纳入设计，避免批量生产后的认证返工。</p>
                <h2 className="text-xl font-light text-white mt-10 mb-4">认证与合规</h2>
                <p>每款出口北美的产品均经过以下认证流程：样品送检 ETL/UL 实验室 → 结构评估与测试 → 工厂检查 → 列名与标签授权。同时支持 DOE 测试报告和 ENERGY STAR 认证申请。我们的工程团队熟悉 NRTL 认证流程，平均周期比行业快 20%。</p>
                <h2 className="text-xl font-light text-white mt-10 mb-4">物流与仓储</h2>
                <p>我们提供 FOB 中国主要港口（深圳/广州）和 CIF 北美主要港口（洛杉矶/长滩/温哥华）两种贸易条款。针对长期合作的 OEM 客户，我们还提供北美仓储代发服务——批量运至我们在洛杉矶的合作仓库后，按订单分批发往美国各州和加拿大，有效降低小批量补货的运输成本。</p>
                <h2 className="text-xl font-light text-white mt-10 mb-4">成功案例</h2>
                <p>Xmoso 已为多家美国知名厨电品牌提供 OEM 服务，产品覆盖单温区酒柜、双温区酒柜、饮料柜和雪茄柜。最低起订量 100 台/款，样品订单 1-5 台可供质量评估。</p>
              </>
            ) : (
              <>
                <p>Xmoso is a professional wine cooler OEM manufacturer serving brand partners across North America. Every product exported to the US market is ETL or UL safety certified, compliant with DOE (Department of Energy) energy efficiency standards, and eligible for ENERGY STAR voluntary labeling.</p>
                <p>We understand the specific requirements of the North American market: 120V/60Hz electrical standard, ADA compliance options for undercounter models, and California CEC energy database registration support. These requirements are integrated at the product development stage, eliminating costly post-production certification rework.</p>
                <h2 className="text-xl font-light text-white mt-10 mb-4">Certification & Compliance</h2>
                <p>Every North America-bound product undergoes: sample submission to ETL/UL laboratory → construction evaluation and testing → factory inspection → listing and label authorization. We also support DOE test reporting and ENERGY STAR certification applications. Our engineering team's familiarity with the NRTL certification process results in cycle times averaging 20% faster than industry benchmarks.</p>
                <h2 className="text-xl font-light text-white mt-10 mb-4">Logistics & Warehousing</h2>
                <p>We offer FOB China (Shenzhen/Guangzhou) and CIF North America (Los Angeles/Long Beach/Vancouver) trade terms. For long-term OEM partners, we provide US warehouse distribution services — bulk shipment to our partner warehouse in Los Angeles, with staggered releases to US states and Canada based on order scheduling. This significantly reduces small-batch replenishment logistics costs.</p>
                <h2 className="text-xl font-light text-white mt-10 mb-4">Case Studies</h2>
                <p>Xmoso has served multiple established US kitchen appliance brands with OEM manufacturing across single-zone wine coolers, dual-zone wine cabinets, beverage coolers, and cigar humidors. Minimum order quantity: 100 units per model, with 1-5 unit sample orders available for quality evaluation.</p>
              </>
            )}
          </div>

          <div className="mt-12 p-8 bg-deep-blue/20 border border-silver/10 rounded-xl">
            <h3 className="text-white text-sm font-medium mb-4">
              {isZh ? "📋 北美市场快速需求表单" : "📋 North America Market Quick Inquiry"}
            </h3>
            <p className="text-silver/60 text-sm mb-6">
              {isZh
                ? "告诉我们您的需求，我们的北美市场专案团队将在 24 小时内回复。"
                : "Tell us your requirements — our North America project team will respond within 24 hours."}
            </p>
            <a href={localePath(locale, "/contact")}
              className="inline-block px-8 py-3 bg-forest/80 text-white rounded-full text-sm tracking-wider hover:bg-forest transition-all">
              {isZh ? "联系北美市场团队 →" : "Contact North America Team →"}
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
