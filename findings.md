# 🔍 研究发现 — Xmoso B2B 独立站

## 技术栈发现

### Next.js 16 特性
- `middleware.ts` 已重命名为 `proxy.ts`
- `params` 为异步（`Promise<{ locale: string }>`）
- Turbopack 为默认打包器
- Google Fonts 在构建环境可能不可达（需 fallback）

### Supabase
- 项目 ref: `khauqgzdxkpejdoijzqf`
- 支持直接 REST API 查询（`/rest/v1/`）
- 不支持 Windows 的 Supabase CLI
- 使用 `site_settings` 表（key-value 模式）存储配置项 → 无需新增表即可扩展功能
- 服务角色密钥可用于后端 API 调用

### Vercel 部署
- 项目名称：`xmoso-b2-b`
- 团队：`allen-oy-s-projects`
- 生产域名：`xmoso.com`（通过 Cloudflare）
- 缓存策略：RSC 响应必须设置 `CDN-Cache-Control: no-store`，否则导航会出错
- 部署约需 30-40 秒，从美国东部构建

## 产品与市场发现

### 产品线
- 核心：高端温控酒柜（恒温酒柜）
- 扩展：雪茄柜、智能饮料柜
- 品牌名：Xmoso / DeepCool

### 目标市场
- 北美 + 欧洲（B2B 批发为主）
- 兼顾 D2C 终端消费者
- 语言：英语为主（en），支持中文（zh），欧洲语言（fr/de/no/fi/sv）

### SEO 发现
- Google Keyword Planner 将网站关联为环保类关键词（eco friendly）
- 需要主动优化 title/meta 为产品相关关键词
- `/sitemap.xml` 已重定向到 `/sitemap-index.xml`

## 语言管理设计

### 存储方案
- 使用 `site_settings` 表的 `lang_enabled_{locale}` 键存储布尔值
- 优于创建独立表：无需 migration，复用已有 API 和缓存

### 启用逻辑
- 默认仅 English 启用
- GET `/api/languages` 返回所有语言及其启用状态
- POST `/api/languages` 切换单语言
- LanguageSwitcher 动态获取列表，只显示已启用语言

## 常见 Bug 与修复

### LanguageSwitcher 导航 Bug
- **问题**：从非英文首页（如 `/zh`）切回英文时，`target = ""` 导致页面刷新不跳转
- **根因**：`(cleanPath === "/" ? "" : cleanPath)` 三元运算多余
- **修复**：移除三元运算，直接拼接

### Light Theme Hover Bug
- **问题**：LanguageSwitcher 下拉菜单在 light theme 下 hover 文字变黑（与背景同色）
- **根因**：light theme CSS 使用 `!important` 覆盖了 hover 颜色
- **修复**：改用 `onMouseEnter/onMouseLeave` 内联样式，避开 CSS 覆盖

### 图片 ALT 清空 Bug
- **问题**：新增/删除产品图片时，其他图片的 alt 被清空
- **根因**：`ImageUploader` 返回 `string[]`（纯 URL），但编辑页用 `{url, alt}[]`
- **修复**：保存时先查找已有 alt，保留未改动项
