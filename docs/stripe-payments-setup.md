# Chunk Talk：Stripe Plus 订阅配置

## 套餐

| 方案 | 价格 | 云端录音 | 单条时长 |
|---|---:|---:|---:|
| Free | CA$0 | 最近 20 条 | 90 秒 |
| Plus | CA$4.99/月或 CA$49/年 | 最近 200 条 | 180 秒 |

第一版建议只在应用中展示月付。确认转化后，再增加年付入口。

## 1. Supabase

在 Supabase SQL Editor 执行：

```text
supabase/payments.sql
```

该脚本创建只允许用户读取本人状态的 `subscriptions` 表。订阅状态只能由服务器端 Stripe Webhook 更新。

## 2. Stripe 产品与价格

1. 注册并完成 [Stripe Dashboard](https://dashboard.stripe.com/) 商户验证。
2. 使用 Test mode 开始配置。
3. 进入 **Product catalog → Add product**。
4. 产品名称：`Chunk Talk Plus`。
5. 创建 recurring monthly price：`CA$4.99 CAD / month`。
6. 复制生成的 Price ID，格式为 `price_...`。
7. 可再创建 recurring yearly price：`CA$49 CAD / year`，后续接入年付按钮。

## 3. Vercel 环境变量

在 Vercel 项目设置中添加以下服务器端变量。除 `NEXT_PUBLIC_APP_URL` 外，全部标记为 Sensitive：

```env
NEXT_PUBLIC_APP_URL=https://oralenglish.vercel.app
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PLUS_PRICE_ID=price_...
STRIPE_WEBHOOK_SECRET=whsec_...
SUPABASE_SECRET_KEY=sb_secret_...
```

`SUPABASE_SECRET_KEY` 在 Supabase **Settings → API Keys → Secret keys** 创建。它会绕过 RLS，只能放在 Vercel，绝不能使用 `NEXT_PUBLIC_` 前缀或提交到 GitHub。

## 4. Stripe Webhook

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**。
2. Endpoint URL：

```text
https://oralenglish.vercel.app/api/stripe/webhook
```

3. 监听事件：
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. 创建后复制 Signing secret 到 Vercel 的 `STRIPE_WEBHOOK_SECRET`。

## 5. Customer Portal

在 Stripe Dashboard → **Settings → Billing → Customer portal** 中启用：

- Update payment method
- Cancel subscription
- View invoice history

用户在 Chunk Talk 点击“管理订阅”后会进入 Stripe 托管页面，不需要本站处理信用卡信息。

## 6. 测试

1. 配置所有变量后重新部署。
2. 登录 Chunk Talk Google 账号。
3. 点击“升级 Plus”。
4. Stripe Test mode 使用测试卡 `4242 4242 4242 4242`、任意未来日期和 CVC。
5. 支付后检查 `public.subscriptions` 是否出现 `active`。
6. 确认录音卡显示 Plus：200 条、180 秒。
7. 在 Stripe 取消订阅并确认 Webhook 把状态同步回来。
8. 全流程通过后，把 Stripe 变量替换为 Live mode 的 `sk_live_...`、正式 Price ID 和正式 Webhook secret。
