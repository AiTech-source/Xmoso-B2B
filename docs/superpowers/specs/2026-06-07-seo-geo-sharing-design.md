# DeepCool 推广体系设计文档

## 概述

在现有 B2B 独立站基础上，增加 SEO 优化、GEO（生成式引擎优化）和社交媒体分享功能，面向欧美为主的海外市场，不做在线交易，所有询盘通过 Inquiry 表单转化。

---

## 一、SEO 基础设施

### 1.1 页面 SEO 元数据

**现状：** `product_translations` 表已有 `meta_title`、`meta_description`、`og_image` 字段，但前台未使用。

**实现：** 所有页面 `<head>` 动态输出：
- 产品页 — 读取 `translation.meta_xxx`，回退到 `translation.name/description`
- About/Contact/Home 页 — 从 `page_contents` 读取（Admin → Pages 编辑器中新增 SEO 字段）
- FAQ 页 — 自动生成

### 1.2 JSON-LD 结构化数据

**Product Schema** — 产品详情页：
```json
{"@context":"https://schema.org","@type":"Product","name":"...","brand":{"@type":"Brand","name":"DeepCool"},"description":"...","image":"..."}
```

**Organization Schema** — 首页 + About 页：
```json
{"@context":"https://schema.org","@type":"Organization","name":"DeepCool","url":"...","logo":"..."}
```

**BreadcrumbList Schema** — 所有带面包屑的页面（自动序列化现有数据）

### 1.3 Sitemap + Robots

- `src/app/sitemap.ts` — 自动列出所有产品、分类、静态页面
- `public/robots.txt` — 指向正式域名

### 1.4 Admin SEO 字段扩展

- Admin → Pages 编辑器中，每个页面增加 SEO 区域：
  - Meta Title（输入框）
  - Meta Description（文本域）
  - OG Image URL（输入框 + 上传）

---

## 二、GEO + AI 内容优化

### 2.1 FAQ 系统

**数据库：** 新建 `faq_items` 表

```sql
CREATE TABLE faq_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  locale VARCHAR(5) NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'general',
  sort_order INT DEFAULT 0
);
```

**Admin 后台：** 📋 FAQ Manager
- 增删改 FAQ 条目
- 按分类分组（Product / Installation / Warranty / Shipping）
- 拖拽排序

**前台：**
- `/[locale]/faq` — 手风琴折叠页面
- `<head>` 中嵌入 FAQPage JSON-LD Schema
- Header 导航栏加 FAQ 链接

### 2.2 How-to 结构化数据（安装指南）

**数据库：** `products` 表新增 `installation_media` JSONB 字段

```json
[
  {"type":"image", "url":"...", "label":"Installation Diagram"},
  {"type":"image", "url":"...", "label":"Drain Hole Detail"},
  {"type":"pdf", "url":"...", "label":"User Manual"}
]
```

**Admin 编辑产品页** — 新增 Installation Resources 区块：
- Label 输入框 / URL 输入框 / Type 下拉（Image|PDF|Video）
- 每行可删除 / + Add 按钮

**前台产品详情页** — 在 SPEC 表和 Eco Panel 之间插入：
```
┌─ 📐 Installation ─────────────────────────┐
│  [标签页: 安装图 | 说明书 | 视频]         │
│  ┌──────────────────────────────────┐     │
│  │        图片/PDF/视频内容          │     │
│  └──────────────────────────────────┘     │
└───────────────────────────────────────────┘
```

**HowTo Schema：** 安装资源同时输出 HowTo JSON-LD。

### 2.3 FAQ 结构化数据

FAQ 页面在 `<head>` 中嵌入 `FAQPage` Schema：
- 每对 Q&A 作为一个 `mainEntity`
- 分类组织，但 Schema 中保持单一 `mainEntity` 数组

---

## 三、社交媒体

### 3.1 Share 组件（分享当前页面）

**位置：**
- 产品详情页 — 浮动在标题右侧
- About / Contact / FAQ 页 — 底部

**支持的平台（纯 URL 实现，无 JS SDK）：**

| 平台 | 分享内容 | 优先级 |
|---|---|---|
| LinkedIn | 产品名 + URL | 核心(B2B) |
| Facebook | OG 卡片 + URL | 高 |
| Twitter/X | 文案 + URL | 中 |
| WhatsApp | URL（移动端重点） | 高 |
| Email | 主题 + URL | 中 |
| Copy Link | 纯 URL 复制 | 高 |

**组件样式：**
- 桌面端：hover 显示，字体图标按钮
- 移动端：固定底部（与 Inquiry 按钮整合）
- 复制链接后显示 "✓ 已复制" 提示

### 3.2 Follow 组件（关注品牌主页）

**位置：** Footer — Quick Links 区域上方

**平台链接（在 Admin 设置页配置）：**

| 平台 | 配置方式 |
|---|---|
| YouTube | URL |
| Instagram | URL |
| TikTok | URL |
| LinkedIn | URL |
| WeChat | 上传二维码图片 |

**Admin → ⚙️ Settings** 新增 Social Media 区域：
- 每个平台一个输入框（URL）
- WeChat 单独上传二维码图片
- 实时预览 Footer 中的效果

---

## 四、优先级与计划

### Phase 1（核心 — 2天）
1. SEO meta 标签接入所有页面
2. JSON-LD Schema（Product / Organization / BreadcrumbList）
3. sitemap.ts + robots.txt

### Phase 2（GEO — 2天）
4. FAQ 表 + Admin 管理 + 前台页面
5. FAQ Schema 嵌入
6. 安装资源（installation_media 字段 + Admin 编辑 + 前台展示）

### Phase 3（社交 — 1天）
7. Share 组件
8. Follow 组件 + Admin 配置
9. WeChat QR 码

总计约 5 个工作日。
