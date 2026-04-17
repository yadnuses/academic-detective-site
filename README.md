# Academic Detective — 演示站点

纯静态前端演示站点，基于 Apple Design System 暗色主题。

## 页面结构

| 文件 | 说明 |
|------|------|
| `index.html` | 首页（Landing） |
| `investigate.html` | 调查入口页（含对话模拟） |
| `deep-service.html` | 深度服务介绍 |
| `test_network_network.html` | D3.js 交互式学术关系网络图谱 Demo |
| `poster_apple_vertical.html` | 竖版宣传海报页 |
| `学术档案调查报告_模板.html` | 学术档案调查报告 HTML 模板 |
| `style.css` | 全局样式（Space Black / Spectral White / Glassmorphism） |
| `lang.js` | 中英双语切换 |

## 本地预览

```bash
# Python 3
python -m http.server 8888

# 或 Node
npx serve .
```

然后访问 `http://localhost:8888`

## 部署

直接上传至任何静态托管服务即可：
- GitHub Pages
- Vercel / Netlify
- Cloudflare Pages
