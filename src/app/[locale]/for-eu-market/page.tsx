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
      ? "欧洲市场酒柜 OEM 供应商 — CE/ERP 认证定制酒柜 | Xmoso"
      : "Wine Cooler OEM for Europe — CE/ERP Certified Custom Wine Fridge Supplier | Xmoso",
    description: isZh
      ? "专为欧洲市场提供 CE/ERP 认证酒柜 OEM 服务。230V/50Hz 标准、欧盟能效标签、RoHS/REACH 合规。中国工厂直供欧洲品牌商。"
      : "Xmoso offers CE/ERP certified wine cooler OEM for European brands. 230V/50Hz standard, EU energy label, RoHS/REACH compliance, WEEE registration support. China factory direct.",
    alternates: generateAlternates("/for-eu-market", locale),
    openGraph: {
      type: "website",
      title: `Xmoso — ${isZh ? "欧洲酒柜 OEM" : "Wine Cooler OEM Europe"}`,
      description: isZh ? "CE/ERP 认证酒柜，专供欧盟市场。" : "CE/ERP certified wine coolers for the European market.",
      images: [{ url: ogImageUrl({ title: "Wine Cooler OEM Europe", subtitle: "CE/ERP Certified Factory", type: "page", brand: ogSet.brand }), width: 1200, height: 630 }],
    },
  };
}

export default async function ForEUMarketPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isZh = locale === "zh";

  return (
    <>
      <Header />
      <main style={{ paddingTop: "64px", minHeight: "80vh" }}>
        <Breadcrumbs items={[{ label: isZh ? "欧洲市场" : "Europe Market" }]} />

        <div className="max-w-4xl mx-auto px-4 py-16">
          <h1 className="text-3xl md:text-4xl font-light tracking-wider text-white leading-tight mb-6">
            {isZh ? "欧洲市场酒柜 OEM 解决方案" : "Wine Cooler OEM Solutions for Europe"}
          </h1>
          <p className="text-silver/50 text-sm mb-12">
            {isZh
              ? "CE/ERP 认证 · 230V/50Hz 标准 · RoHS/REACH 合规 · WEEE 注册支持"
              : "CE/ERP Certified · 230V/50Hz Standard · RoHS/REACH Compliant · WEEE Registration Support"}
          </p>

          <div className="space-y-8 text-silver/70 text-[15px] leading-relaxed">
            {isZh ? (
              <>
                <p>Xmoso 是为欧洲品牌商提供酒柜 OEM 服务的专业制造商。所有出口欧盟市场的产品均通过 CE 认证，符合 ERP 能效指令要求，并满足 RoHS 和 REACH 化学品限制法规。</p>
                <p>我们持续跟踪欧盟法规更新，包括 ERP 2025+ 新能效等级（A 到 G 重新校准）、PFAS 限制提案、以及 WEEE 指令修订。确保 OEM 客户的进口产品始终合规，避免因法规变更导致的库存风险。</p>
                <h2 className="text-xl font-light text-white mt-10 mb-4">能效与环保合规</h2>
                <p>酒柜产品按照 EU 2019/2018 能效标签法规进行测试和分级。我们的 100 瓶装酒柜年耗电量低于 100 kWh（A 级能效）。产品采用环戊烷发泡保温材料（零 ODP，GWP5（全球变暖潜能值低于 5））和可回收包装设计，满足欧盟环保采购要求。</p>
                <h2 className="text-xl font-light text-white mt-10 mb-4">物流与服务</h2>
                <p>提供 FOB 中国港口和 DDP 欧洲主要港口（鹿特丹/汉堡/安特卫普）两种贸易条款。海运至欧洲约 25-30 天。对长期合作客户提供欧洲仓储代发服务，降低小批量补货的物流成本。</p>
                <h2 className="text-xl font-light text-white mt-10 mb-4">多语言支持</h2>
                <p>我们提供产品说明书、能效标签和包装的多语言版本（英语/法语/德语/西班牙语/意大利语），确保符合各成员国语言要求。OEM 客户的品牌信息可完全本地化。</p>
              </>
            ) : (
                <>
                <p>Xmoso is a wine cooler OEM manufacturer serving brand partners across the European Union. Every product destined for the EU market is CE certified, compliant with the ERP energy efficiency directive, and meets RoHS and REACH chemical restriction regulations.</p>
                <p>We continuously monitor EU regulatory updates including the ERP 2025+ energy label recalibration (A to G scale), PFAS restriction proposals, and WEEE directive amendments — ensuring OEM clients' imported products remain compliant and avoiding inventory risk from regulatory changes.</p>
                <h2 className="text-xl font-light text-white mt-10 mb-4">Energy Efficiency & Environmental Compliance</h2>
                <p>Wine cabinet products are tested and classified per EU 2019/2018 energy labeling regulations. Our 100-bottle wine cooler achieves annual energy consumption below 100 kWh (Class A rating). Products utilize cyclopentane-blown insulation foam (zero ODP, GWP {`<5`}) and recyclable packaging design, meeting EU green public procurement requirements.</p>
                <h2 className="text-xl font-light text-white mt-10 mb-4">Logistics & Service</h2>
                <p>We offer FOB China and DDP European ports (Rotterdam/Hamburg/Antwerp). Sea freight to Europe takes approximately 25-30 days. For long-term partners, European warehouse distribution services are available to reduce small-batch replenishment logistics costs.</p>
                <h2 className="text-xl font-light text-white mt-10 mb-4">Multilingual Support</h2>
                <p>We provide product manuals, energy labels, and packaging in multiple languages (English, French, German, Spanish, Italian) to meet member state language requirements. OEM clients' branding can be fully localized.</p>
              </>
            )}
          </div>

          <div className="mt-12 p-8 bg-deep-blue/20 border border-silver/10 rounded-xl">
            <h3 className="text-white text-sm font-medium mb-4">
              {isZh ? "📋 欧洲市场快速需求表单" : "📋 Europe Market Quick Inquiry"}
            </h3>
            <p className="text-silver/60 text-sm mb-6">
              {isZh
                ? "告诉我们您的需求，我们的欧洲市场专案团队将在 24 小时内回复。"
                : "Tell us your requirements — our Europe project team will respond within 24 hours."}
            </p>
            <a href={localePath(locale, "/contact")}
              className="inline-block px-8 py-3 bg-forest/80 text-white rounded-full text-sm tracking-wider hover:bg-forest transition-all">
              {isZh ? "联系欧洲市场团队 →" : "Contact Europe Team →"}
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
