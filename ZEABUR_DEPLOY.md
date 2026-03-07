# Zeabur 部署指南

## 快速部署

### 1. 准备工作
确保你的代码已推送到 GitHub：
```bash
git add -A
git commit -m "准备部署到 Zeabur"
git push
```

### 2. 在 Zeabur 部署

#### 方式一：通过 Zeabur Dashboard
1. 访问 [Zeabur Dashboard](https://zeabur.com)
2. 点击 "New Project"
3. 选择 "Deploy from GitHub"
4. 选择你的仓库：`wendylandcan/Sweethearttest`
5. 选择分支：`sonet` 或 `main`
6. Zeabur 会自动检测为 Vite 项目并配置

#### 方式二：使用 Zeabur CLI
```bash
# 安装 Zeabur CLI
npm install -g @zeabur/cli

# 登录
zeabur auth login

# 部署
zeabur deploy
```

### 3. 环境变量配置

在 Zeabur Dashboard 中设置以下环境变量：

```
VITE_SITE_URL=https://your-domain.zeabur.app
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### 4. 自定义域名（可选）

1. 在 Zeabur Dashboard 中点击你的项目
2. 进入 "Domains" 设置
3. 添加自定义域名
4. 按照提示配置 DNS

## 多人并发支持

### Zeabur 默认配置
- ✅ **自动扩展**: Zeabur 会根据流量自动扩展实例
- ✅ **负载均衡**: 自动分配请求到多个实例
- ✅ **CDN 加速**: 静态资源自动使用 CDN
- ✅ **全球节点**: 支持多地域部署

### 性能优化建议

#### 1. 启用 Gzip 压缩（已配置）
项目已配置 Gzip 压缩，Zeabur 会自动识别并使用。

#### 2. 静态资源缓存
Zeabur 会自动为静态资源设置缓存头：
- HTML: 不缓存（确保更新及时）
- JS/CSS: 长期缓存（文件名包含 hash）
- 图片/音频: 长期缓存

#### 3. 数据库连接池
如果使用 Supabase，确保配置了连接池：
```javascript
// 已在 src/lib/supabase.js 中配置
const supabase = createClient(url, key, {
  db: {
    schema: 'public',
  },
  auth: {
    persistSession: true,
  },
  global: {
    headers: { 'x-my-custom-header': 'my-app-name' },
  },
})
```

### 并发测试

部署后可以使用以下工具测试并发性能：

#### 使用 Apache Bench
```bash
# 测试 100 个并发用户，总共 1000 个请求
ab -n 1000 -c 100 https://your-domain.zeabur.app/
```

#### 使用 wrk
```bash
# 测试 12 个线程，100 个连接，持续 30 秒
wrk -t12 -c100 -d30s https://your-domain.zeabur.app/
```

### 预期性能

基于当前优化配置：

| 指标 | 预期值 |
|------|--------|
| 并发用户 | 1000+ |
| 响应时间 | < 200ms |
| 首屏加载 | < 2s (4G) |
| 可用性 | 99.9% |

### 监控和日志

#### 1. Zeabur 内置监控
- 访问 Dashboard → 你的项目 → "Metrics"
- 查看 CPU、内存、请求数等指标

#### 2. Google Analytics
项目已集成 GA，可以查看：
- 实时在线用户数
- 页面浏览量
- 用户地理分布
- 设备类型统计

#### 3. 错误追踪（可选）
如需更详细的错误追踪，可以集成 Sentry：

```bash
npm install @sentry/react
```

```javascript
// src/main.jsx
import * as Sentry from "@sentry/react";

if (import.meta.env.PROD) {
  Sentry.init({
    dsn: "your-sentry-dsn",
    integrations: [new Sentry.BrowserTracing()],
    tracesSampleRate: 1.0,
  });
}
```

## 扩展配置

### 增加实例数量
如果需要处理更高并发，可以在 Zeabur Dashboard 中：
1. 进入项目设置
2. 调整 "Replicas" 数量
3. 建议设置为 2-5 个实例

### 启用自动扩展
```json
// zeabur.json
{
  "scaling": {
    "minReplicas": 2,
    "maxReplicas": 10,
    "targetCPUUtilization": 70
  }
}
```

## 常见问题

### Q: 部署后页面空白？
A: 检查环境变量是否正确配置，特别是 `VITE_SITE_URL`

### Q: 音频/图片加载失败？
A: 确保 `public` 目录下的资源已正确上传

### Q: 多人访问时变慢？
A:
1. 检查 Supabase 连接数限制
2. 考虑升级 Zeabur 套餐
3. 启用 CDN 加速

### Q: 如何回滚版本？
A: 在 Zeabur Dashboard 中选择 "Deployments"，点击之前的版本进行回滚

## 成本估算

Zeabur 定价（参考）：
- **免费套餐**: 适合测试，有一定限制
- **Hobby**: $5/月，适合小型项目
- **Pro**: $20/月，支持更高并发

建议根据实际访问量选择合适的套餐。

## 部署检查清单

- [ ] 代码已推送到 GitHub
- [ ] 环境变量已配置
- [ ] Google Analytics ID 已设置
- [ ] Supabase 连接已测试
- [ ] 构建成功（`npm run build`）
- [ ] 本地预览正常（`npm run preview`）
- [ ] 域名已配置（如需要）
- [ ] 监控已启用

## 技术支持

- Zeabur 文档: https://zeabur.com/docs
- Zeabur Discord: https://discord.gg/zeabur
- 项目 Issues: https://github.com/wendylandcan/Sweethearttest/issues

