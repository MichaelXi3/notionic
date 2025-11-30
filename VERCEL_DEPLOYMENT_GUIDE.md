# Vercel 部署完整指南（从零开始）

## 📝 前置准备

在开始之前，确保你有：
- [x] GitHub 账号
- [ ] Vercel 账号（下面会教你注册）
- [x] 本地项目代码

---

## 步骤 1: 将代码推送到 GitHub

### 1.1 检查 Git 状态

```bash
cd /Users/xiyukun/Desktop/Projects/notionic

# 查看当前状态
git status
```

### 1.2 初始化 Git（如果还没有）

```bash
# 如果还没有 Git 仓库
git init

# 添加所有文件
git add .

# 提交
git commit -m "Initial commit with view count feature"
```

### 1.3 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 仓库名：`notionic` 或你喜欢的名字
3. 设置为 Public 或 Private
4. **不要**勾选 "Initialize with README"（因为你已经有代码了）
5. 点击 "Create repository"

### 1.4 推送代码到 GitHub

```bash
# 添加远程仓库（替换成你的 GitHub 用户名和仓库名）
git remote add origin https://github.com/你的用户名/notionic.git

# 推送代码
git branch -M main
git push -u origin main
```

---

## 步骤 2: 注册 Vercel 账号

### 2.1 访问 Vercel

打开浏览器访问：https://vercel.com

### 2.2 注册方式（推荐用 GitHub）

点击右上角 **"Sign Up"**，选择：

- **Continue with GitHub** ⭐ 推荐
- Continue with GitLab
- Continue with Bitbucket
- Continue with Email

### 2.3 授权 GitHub

1. 选择 "Continue with GitHub"
2. 登录你的 GitHub 账号
3. 授权 Vercel 访问你的仓库
4. 完成注册！

---

## 步骤 3: 部署项目到 Vercel

### 3.1 导入项目

1. 登录 Vercel 后，点击 **"Add New..."** → **"Project"**
2. 选择 **"Import Git Repository"**
3. 找到你的 `notionic` 仓库，点击 **"Import"**

### 3.2 配置项目

Vercel 会自动检测这是一个 Next.js 项目。

**配置选项**：
- **Framework Preset**: Next.js ✅（自动检测）
- **Root Directory**: `./` ✅
- **Build Command**: `npm run build` ✅
- **Output Directory**: `.next` ✅

### 3.3 配置环境变量 ⚠️ 重要！

在部署之前，点击 **"Environment Variables"** 展开，添加：

#### 必需的环境变量：

```bash
# Notion 配置（必需）
NOTION_PAGE_ID=你的_notion_page_id
```

**如何获取 Notion Page ID？**
- 参考之前创建的 Notion 模板
- 或者暂时用测试 ID：`12c38b5f459d4eb9a759f92fba6cea36`

#### 可选的环境变量：

```bash
# ISR 重新验证令牌
TOKEN_FOR_REVALIDATE=你的密钥（随便设置一个复杂的字符串）

# Google Analytics（可选）
# NEXT_PUBLIC_GOOGLE_MEASUREMENT_ID=G-XXXXXXXXXX

# Google Search Console（可选）
# NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=xxxxxxxxxx

# Utterances 评论（可选）
# NEXT_PUBLIC_UTTERANCES_REPO=你的用户名/仓库名
```

### 3.4 部署！

点击 **"Deploy"** 按钮！🚀

---

## 步骤 4: 等待部署完成

### 4.1 部署过程

你会看到实时日志：

```
Installing dependencies...
Building application...
Optimizing production build...
Deploying...
✅ Deployment ready!
```

通常需要 **2-5 分钟**。

### 4.2 获取网址

部署成功后，你会得到一个网址：

```
https://notionic-xxx.vercel.app
```

点击 **"Visit"** 访问你的网站！🎉

---

## 步骤 5: 配置 Vercel KV（持久化存储）

### 5.1 进入 Storage 设置

1. 在 Vercel Dashboard，选择你的项目
2. 点击顶部的 **"Storage"** 标签
3. 点击 **"Create Database"**

### 5.2 创建 KV 数据库

1. 选择 **"KV"** (Redis)
2. 数据库名称：`notionic-views` 或你喜欢的名字
3. 选择 **Region**：
   - 推荐选择离你最近的（如 `Hong Kong (hkg1)`）
4. 点击 **"Create"**

### 5.3 连接到项目

1. 创建完成后，点击 **"Connect Project"**
2. 选择你的 `notionic` 项目
3. 点击 **"Connect"**

### 5.4 自动配置

Vercel 会自动添加这些环境变量到你的项目：

```bash
KV_REST_API_URL=https://xxx.kv.vercel-storage.com
KV_REST_API_TOKEN=xxx
KV_REST_API_READ_ONLY_TOKEN=xxx
KV_URL=redis://xxx
```

**无需手动配置！** ✅

### 5.5 重新部署

环境变量更新后，需要重新部署：

1. 回到项目 Dashboard
2. 点击 **"Deployments"** 标签
3. 点击最新部署右侧的 **"..."** 菜单
4. 选择 **"Redeploy"**

或者更简单的方法：
```bash
# 本地做一个小改动，然后推送
git commit --allow-empty -m "Trigger redeploy with KV"
git push
```

---

## 步骤 6: 验证部署

### 6.1 访问网站

打开你的 Vercel 网址：
```
https://notionic-xxx.vercel.app
```

### 6.2 测试浏览次数功能

1. 点击一篇文章
2. 看到浏览次数：👁️ 1
3. 刷新页面：👁️ 2
4. **关键测试**：等待 30 秒（让 Serverless Function 休眠）
5. 再次访问：👁️ 3（数据依然保留！）✅

### 6.3 检查 KV 数据

1. 进入 Vercel Dashboard → Storage → 你的 KV 数据库
2. 点击 **"Data Browser"**
3. 你会看到类似的数据：

```
Key: views:your-article-slug
Value: 3
```

---

## 步骤 7: 配置自定义域名（可选）

### 7.1 添加域名

1. 在项目 Dashboard，点击 **"Settings"**
2. 点击 **"Domains"**
3. 输入你的域名（如 `blog.yourdomain.com`）
4. 点击 **"Add"**

### 7.2 配置 DNS

Vercel 会告诉你如何配置 DNS：

**如果是 A 记录**：
```
Type: A
Name: blog (or @)
Value: 76.76.21.21
```

**如果是 CNAME**：
```
Type: CNAME
Name: blog
Value: cname.vercel-dns.com
```

### 7.3 等待生效

DNS 配置通常需要几分钟到几小时生效。

---

## 🎯 部署清单

完成这个清单，确保一切正常：

### 基础部署
- [ ] GitHub 仓库已创建
- [ ] 代码已推送到 GitHub
- [ ] Vercel 账号已注册
- [ ] 项目已导入到 Vercel
- [ ] `NOTION_PAGE_ID` 环境变量已配置
- [ ] 首次部署成功
- [ ] 可以访问网站

### 浏览次数功能
- [ ] Vercel KV 数据库已创建
- [ ] KV 已连接到项目
- [ ] 已重新部署
- [ ] 浏览次数正常显示
- [ ] 浏览次数正常增加
- [ ] 数据持久化（重新访问后数据保留）

### 优化（可选）
- [ ] 自定义域名已配置
- [ ] Google Analytics 已配置
- [ ] 评论系统已配置

---

## 📊 Vercel 免费额度

Vercel Hobby 计划（免费）包括：

| 资源 | 限制 |
|------|------|
| 带宽 | 100 GB/月 |
| 构建时间 | 6,000 分钟/月 |
| Serverless 函数执行 | 100 GB-小时/月 |
| KV 存储 | 256 MB |
| KV 请求 | 10,000/月 |
| 自定义域名 | ✅ 无限 |
| HTTPS | ✅ 自动 |

**够用吗？**

对于个人博客来说，完全够用！除非你的博客超级火爆 🔥

---

## 🔄 日常更新流程

以后要更新网站很简单：

```bash
# 1. 修改代码
vim src/...

# 2. 提交到 Git
git add .
git commit -m "Update: 描述你的改动"

# 3. 推送到 GitHub
git push

# 4. Vercel 自动部署！
# 无需任何操作，1-2 分钟后自动更新
```

---

## 🐛 常见问题

### Q1: 部署失败了怎么办？

**查看错误日志**：
1. Vercel Dashboard → 你的项目 → Deployments
2. 点击失败的部署
3. 查看 "Build Logs"

**常见错误**：
- `NOTION_PAGE_ID` 未配置 → 添加环境变量
- 构建超时 → 检查 `package.json` 依赖
- 环境变量错误 → 检查拼写

### Q2: 浏览次数不显示？

**检查清单**：
- [ ] KV 数据库已创建并连接
- [ ] 已重新部署
- [ ] 浏览器控制台无错误
- [ ] `site.config.js` 中 `viewCount.enable = true`

### Q3: 网站很慢？

**可能原因**：
- Serverless Function 冷启动（第一次访问慢 1-2 秒是正常的）
- Notion API 响应慢（Notion 服务器在国外）
- 图片未优化

**解决方法**：
- 使用 CDN（Vercel 自动提供）
- 优化图片大小
- 考虑增加 ISR revalidate 时间

### Q4: 费用会超吗？

对于个人博客，基本不会。

**监控用量**：
1. Vercel Dashboard → Usage
2. 查看各项指标
3. 接近限制时会收到邮件通知

---

## 🎉 恭喜！

你现在有了一个：

- ✅ 部署在 Vercel 上的博客
- ✅ 自动 CI/CD（推送代码自动部署）
- ✅ 全球 CDN 加速
- ✅ 自动 HTTPS
- ✅ 持久化浏览次数统计
- ✅ 免费托管

---

## 📚 相关链接

- **Vercel 文档**: https://vercel.com/docs
- **Next.js 文档**: https://nextjs.org/docs
- **Vercel KV 文档**: https://vercel.com/docs/storage/vercel-kv
- **你的 Vercel Dashboard**: https://vercel.com/dashboard

---

## 🆘 需要帮助？

遇到问题可以：

1. 查看 Vercel 部署日志
2. 检查浏览器控制台错误
3. 参考 Vercel 官方文档
4. 在这里问我！😊

---

**开始部署吧！从步骤 1 开始！** 🚀

