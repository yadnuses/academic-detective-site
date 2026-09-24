# 检查 Cloudflare Workers 路由拦截 详细步骤

---

## 一、进入 Workers & Pages 控制台

1. 打开 https://dash.cloudflare.com
2. 登录账号
3. 在左侧菜单栏找到并点击 **Workers & Pages**
4. 页面会显示所有 Workers 和 Pages 项目列表

---

## 二、查看 Workers 列表

在 Workers & Pages 页面，查看是否有以下项目：

- `academic-detective-site`
- `academic-detective`
- `www-academic-detective-top`
- 或其他与网站相关的名称

**可能的情况：**

### 情况 A：列表为空，没有 Worker
- 说明没有 Worker 拦截，问题不在 Workers 路由
- 跳过本节，检查 Cloudflare 缓存规则或 DNS 设置

### 情况 B：有 Worker，但名称不熟悉
- 可能是之前测试时创建的，需要检查其路由和代码

### 情况 C：有明确的 `academic-detective-site` Worker
- 很可能是它拦截了请求，需要重点检查

---

## 三、检查 Worker 路由

1. 点击 Worker 名称进入详情页
2. 在顶部标签栏找到 **Routes**（路由）
3. 查看是否有以下路由：

```
www.academic-detective.top/*
academic-detective.top/*
*.academic-detective.top/*
```

**判断标准：**
- 如果有 `www.academic-detective.top/*` 或类似路由，说明所有访问 www.academic-detective.top 的请求都会被这个 Worker 处理
- Worker 会直接返回它代码里的内容，不会回源到 GitHub Pages
- 这就是导致看不到 pre 按钮的原因

---

## 四、检查 Worker 代码

1. 在 Worker 详情页，点击 **Edit Code** 或 **Quick Edit**
2. 查看代码内容，寻找以下特征：

**如果代码返回静态 HTML：**
```javascript
return new Response(`<!DOCTYPE html>...旧版本首页...`, {
  headers: { 'content-type': 'text/html' }
});
```
- 说明 Worker 直接返回了写死的旧版本 HTML

**如果代码有重定向或回源：**
```javascript
return fetch('https://yadnuses.github.io/academic-detective-site' + pathname);
```
- 说明 Worker 会回源到 GitHub Pages，但需要检查是否有缓存或路径问题

**如果代码是默认模板：**
```javascript
export default {
  async fetch(request, env, ctx) {
    return new Response('Hello World!');
  }
};
```
- 说明 Worker 返回的是默认内容，覆盖了 GitHub Pages

---

## 五、解决方案

### 方案 1：删除 Worker 路由（推荐）

1. 在 Worker 详情页的 **Routes** 标签
2. 找到 `www.academic-detective.top/*` 或相关路由
3. 点击路由右侧的 **Delete** 或 **Remove**
4. 保存更改

这样请求就会直接回源到 GitHub Pages，不再被 Worker 拦截。

### 方案 2：禁用 Worker

1. 在 Worker 详情页顶部
2. 找到 **Disable** 或 **Pause** 按钮
3. 点击禁用

### 方案 3：删除整个 Worker

1. 在 Workers & Pages 列表页
2. 找到对应 Worker
3. 点击右侧 **···**（更多）→ **Delete**
4. 确认删除

**注意**：删除前请确认 Worker 没有其他用途。

---

## 六、检查 Pages 项目

Cloudflare Pages 和 Workers 是分开的：

1. 在 Workers & Pages 页面，切换到 **Pages** 标签
2. 查看是否有 `academic-detective-site` 项目
3. 如果有：
   - 点击进入项目
   - 查看 **Deployments**，确认最新部署是否为 `aff3880`
   - 如果 Pages 项目也绑定了 `www.academic-detective.top`，可能会与 GitHub Pages 冲突

**如果 Pages 项目绑定了域名：**
- 进入 Pages 项目 → **Settings** → **Custom domains**
- 删除 `www.academic-detective.top` 的绑定，或改为其他子域名（如 `pages.academic-detective.top`）

---

## 七、验证修复

完成上述操作后：

1. 等待 1-2 分钟
2. 清除 Cloudflare 缓存（Caching → Purge Everything）
3. 强制刷新浏览器（`Cmd + Shift + R`）
4. 访问 `https://www.academic-detective.top`
5. 检查右上角是否出现 **pre** 按钮

---

## 八、截图参考

如果周老师不确定如何操作，可以按以下位置截图发给我：

1. Workers & Pages 列表页截图
2. Worker 详情页的 Routes 标签截图
3. Worker 代码编辑器截图
4. Pages 项目的 Custom domains 截图

我可以根据截图判断具体是哪个配置导致了拦截。
