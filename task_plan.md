# 🎯 任务计划 — Xmoso B2B 独立站

## 项目概述

构建一个面向北美 + 欧洲市场的 B2B 独立站（兼顾 D2C），核心产品为**高端温控酒柜**。

---

## 阶段

### Phase 0-7 ✅ 全部完成
基础项目已构建、部署、上线。

### Phase 8：性能优化 + PWA（进行中）

#### 性能诊断
- **CLS 0.492**（目标 <0.1）— 严重布局偏移
- **LCP 5.9s**（目标 <2.5s）— 内容加载慢
- **FCP 0.9s** ✅ 良好
- **TBT 10ms** ✅ 良好
- **Speed Index 4.5s**（目标 <3.4s）

#### 修复清单

| # | 问题 | CLS | LCP | 方案 |
|:-|:----|:---:|:---:|:----|
| 1 | Header Logo 异步加载导致偏移 | 🔴 | | 固定 Logo 容器高度 |
| 2 | Banner 占位符 200px → 图片替换 | 🔴 | 🔴 | 统一 aspect-ratio 容器 |
| 3 | HomeProducts Loading→内容切换 | 🔴 | | 固定骨架屏高度 |
| 4 | 图片缺少 width/height 属性 | 🟡 | | 添加显式尺寸 |
| 5 | Framer Motion 动画延迟 | | 🔴 | 减少 delayChildren |
| 6 | Google Fonts 阻塞渲染 | 🟡 | 🟡 | font-display: swap + preconnect |
| 7 | 缺少 LCP 图片 preload | | 🔴 | 添加 preload link |
| 8 | framer-motion bundle 过大 | | 🟡 | dynamic import |
| 9 | PWA 支持 | — | — | manifest + service worker |

---

## 决策记录

| 日期 | 决策 | 理由 |
|:----|:----|:-----|
| 2026-06-02 | Dark Luxury 视觉方向 | 适合高端制冷产品定位 |
| 2026-06-02 | 全栈单体架构 | 部署最简单，成本最低 |
| 2026-07-03 | site_settings 存语言开关 | 复用已有基础设施 |
| 2026-07-03 | 固定容器高防止 CLS | 最大程度减少布局偏移 |
| 2026-07-03 | PWA 仅基础配置 | 站点的 B2B 性质决定离线不是核心需求 |
