# GitHub Pages + Cloudflare + 腾讯云 排查指南

---

## 当前状态确认

✅ GitHub Pages 部署正常：`yadnuses.github.io/academic-detective-site` 已包含 `preBtn` 和 `pre/` 目录

❌ 自定义域名 `www.academic-detective.top` 未显示最新内容

---

## 排查步骤

### 第一步：确认 GitHub Pages 设置

1. 打开 https://github.com/yadnuses/academic-detective-site/settings/pages
2. 确认 **Source** 设置为 `Deploy from a branch`
3. 确认 **Branch** 选择 `main` / `(root)`
4. 确认 **Custom domain** 填写的是 `www.academic-detective.top`
5. 确认 **Enforce HTTPS** 已勾选

如果 Custom domain 未填写或填写错误，请修正并保存。

---

### 第二步：检查 Cloudflare DNS 记录

1. 登录 Cloudflare Dashboard
2. 选择 `academic-detective.top` 域名
3. 进入 **DNS** → **Records**
4. 确认有以下记录：

| 类型 | 名称 | 内容 | 代理状态 |
|:---|:---|:---|:---|
| CNAME | `www` | `yadnuses.github.io` | 已代理（橙色云） |
| CNAME | `@` 或 `academic-detective.top` | `yadnuses.github.io` | 已代理（橙色云） |

**注意**：
- 如果代理状态是灰色云（仅 DNS），Cloudflare 不会缓存内容，问题可能在腾讯云解析
- 如果代理状态是橙色云（已代理），继续下一步

---

### 第三步：检查 Cloudflare 缓存规则

1. 在 Cloudflare Dashboard 左侧菜单选择 **Caching** → **Cache Rules**
2. 检查是否有以下规则：
   - **Cache Everything**（缓存所有内容，包括 HTML）
   - **Edge Cache TTL** 设置过长（如 1 个月）
3. 如果有 **Cache Everything** 规则，请：
   - 点击 **Edit Rule**
   - 添加 **Bypass Cache** 条件：`Hostname contains academic-detective.top` 或 `Page Path contains /pre/`
   - 或直接删除该规则

4. 进入 **Caching** → **Configuration**
   - 确认 **Caching Level** 为 `Standard`
   - 确认 **Browser Cache TTL** 为 `4 hours` 或更短

---

### 第四步：检查 Cloudflare Page Rules

1. 左侧菜单选择 **Rules** → **Page Rules**
2. 检查是否有针对 `academic-detective.top` 的规则：
   - `*academic-detective.top/*` → Cache Level: Cache Everything
   - `*academic-detective.top/pre/*` → 某种重定向
3. 如果有缓存 HTML 的规则，请删除或修改为 `Bypass Cache`

---

### 第五步：检查 Cloudflare Workers 路由

1. 左侧菜单选择 **Workers & Pages**
2. 检查是否有名为 `academic-detective-site` 或类似的 Worker
3. 如果有：
   - 点击进入 Worker 详情
   - 检查 **Routes** 标签，确认路由是否指向 `www.academic-detective.top/*`
   - 如果 Worker 代码中返回了旧内容或重定向，请禁用该 Worker 或删除路由

---

### 第六步：清除 Cloudflare 缓存（再次确认）

1. 左侧菜单 **Caching** → **Purge Cache**
2. 选择 **Purge Everything**
3. 等待 30 秒
4. 强制刷新浏览器（`Cmd + Shift + R`）

---

### 第七步：检查腾讯云 DNS 解析

1. 登录腾讯云控制台 → DNS 解析 DNSPod
2. 找到 `academic-detective.top` 域名
3. 确认解析记录：

| 主机记录 | 记录类型 | 记录值 | 状态 |
|:---|:---|:---|:---|
| `www` | CNAME | `academic-detective.top.cdn.cloudflare.net` 或 Cloudflare 提供的 CNAME | 正常 |
| `@` | CNAME 或 A | 同上 | 正常 |

**注意**：
- 如果记录值是 IP 地址，确认该 IP 属于 Cloudflare
- 如果记录值是其他 CDN 地址，可能是配置错误

4. 如果腾讯云 DNS 有 **缓存** 或 **TTL** 设置，确认 TTL 为 `600` 秒（10 分钟）或更短

---

### 第八步：直接测试 GitHub Pages 地址

1. 访问 `https://yadnuses.github.io/academic-detective-site/pre/index.html`
2. 如果正常显示 Fan Family 封面，说明 GitHub Pages 部署完全正常
3. 问题只在 Cloudflare/腾讯云层面

---

## 快速诊断表

| 现象 | 可能原因 | 解决方案 |
|:---|:---|:---|
| GitHub Pages 地址正常，自定义域名 404 | Cloudflare DNS 未正确指向 | 检查 Cloudflare DNS 记录 |
| 自定义域名能打开但内容旧 | Cloudflare 缓存 HTML | 清除缓存 + 检查缓存规则 |
| 自定义域名时好时坏 | 腾讯云 DNS 缓存 | 等待 TTL 过期或手动刷新 |
| pre/index.html 404，index.html 正常 | pre/ 目录未部署 | 检查 GitHub 文件是否存在 |

---

## 需要我协助的信息

如果按以上步骤仍无法解决，请提供：

1. GitHub Pages 设置页面截图（Settings → Pages）
2. Cloudflare DNS Records 页面截图
3. Cloudflare Cache Rules 和 Page Rules 页面截图
4. 腾讯云 DNS 解析记录截图
5. 浏览器开发者工具（F12）→ Network → 访问 `www.academic-detective.top` 时的 Response Headers 截图

我可以根据这些信息进一步定位问题。
