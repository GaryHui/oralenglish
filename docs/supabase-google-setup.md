# Chunk Talk：Supabase 与 Google 登录配置

本文记录 Chunk Talk 的 Supabase 用户系统、Google OAuth、学习进度和录音存储配置方法。

## 1. 项目公开配置

```env
NEXT_PUBLIC_SUPABASE_URL=https://ddwmsptnbjtmqylyvnvk.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_2hcfjJW678rFJTSdDBL9GA_bpz7LeJI
```

Publishable key 可以用于浏览器。不要把 Supabase Secret key、`service_role` key、数据库密码或 Google Client Secret 提交到 GitHub。

## 2. 创建数据库表和私有录音空间

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)。
2. 打开项目 `ddwmsptnbjtmqylyvnvk`。
3. 进入 **SQL Editor**。
4. 复制并执行仓库中的 `supabase/schema.sql`。
5. 在 **Table Editor** 确认存在：
   - `learning_progress`
   - `speaking_recordings`
6. 在 **Storage** 确认存在私有 bucket：`speaking-recordings`。

SQL 已启用 Row Level Security。每个登录用户只能读取、写入和删除自己的学习进度及录音。

## 3. 设置 Supabase 登录返回地址

进入 **Authentication → URL Configuration**：

### Site URL

```text
https://oralenglish.vercel.app
```

### Redirect URLs

```text
https://oralenglish.vercel.app
http://127.0.0.1:3007
```

若以后更换正式域名，需要把新域名也加入 Redirect URLs。

## 4. 在 Google Cloud 创建 OAuth 客户端

1. 打开 [Google Auth Platform](https://console.cloud.google.com/auth/overview)。
2. 创建或选择一个 Google Cloud 项目。
3. 在 **Branding** 中填写应用名称、支持邮箱和开发者联系方式。
4. 在 **Audience** 中选择 **External**。
5. 测试阶段把需要登录的 Google 邮箱加入 **Test users**。
6. 在 **Data Access** 中保留以下 scopes：
   - `openid`
   - `userinfo.email`
   - `userinfo.profile`
7. 进入 **Clients → Create client**。
8. Application type 选择 **Web application**。

### Authorized JavaScript origins

```text
https://oralenglish.vercel.app
http://127.0.0.1:3007
```

### Authorized redirect URIs

```text
https://ddwmsptnbjtmqylyvnvk.supabase.co/auth/v1/callback
```

注意：这里必须填写 Supabase callback URL，不能填写 Vercel 首页地址。

9. 创建后妥善保存 Google Client ID 和 Google Client Secret。

## 5. 在 Supabase 启用 Google Provider

1. 回到 Supabase Dashboard。
2. 进入 **Authentication → Sign In / Providers → Google**。
3. 打开 Google Provider。
4. 填入 Google Client ID。
5. 填入 Google Client Secret。
6. 保存。

Google Client Secret 只填写在 Supabase Dashboard，不要写入前端环境变量，也不要提交到 GitHub。

## 6. Vercel 环境变量

在 Vercel 项目 `oralenglish` 的 **Settings → Environment Variables** 中添加：

| Name | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://ddwmsptnbjtmqylyvnvk.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | `sb_publishable_2hcfjJW678rFJTSdDBL9GA_bpz7LeJI` | Production, Preview, Development |

添加或修改环境变量后需要重新部署，旧部署不会自动获得新变量。

## 7. 验收步骤

1. 打开 `https://oralenglish.vercel.app`。
2. 点击右上角 **登录 · 云端保存**。
3. 点击 **使用 Google 账号登录**。
4. 完成 Google 授权并返回 Chunk Talk。
5. 完成一道生活口语题，确认学习进度更新。
6. 录制一段语音并点击 **保存到账号**。
7. 在 Supabase 检查：
   - `auth.users` 出现该用户；
   - `learning_progress` 出现该用户的进度；
   - `speaking_recordings` 出现录音记录；
   - `speaking-recordings` bucket 出现以用户 UUID 命名的文件夹。

## 8. 常见错误

- `Unsupported provider`：Supabase 中还没有启用 Google Provider。
- `redirect_uri_mismatch`：Google Cloud 中的 Authorized redirect URI 与 Supabase callback URL 不完全一致。
- 登录后没有返回网站：Supabase URL Configuration 中缺少正式站点地址。
- 录音上传失败：尚未执行 `supabase/schema.sql`，或 Storage bucket/RLS policy 未创建。
- 本地无法录音：浏览器未授予 `127.0.0.1` 麦克风权限。
