# Chunk Talk：Stripe Plus 订阅配置

## 套餐

| 方案 | 价格 | 云端录音 | 单条时长 |
|---|---:|---:|---:|
| Free | CA$0 | 最近 20 条 | 90 秒 |
| Plus 月订阅 | CA$4.99/月 | 最近 200 条 | 180 秒 |
| Plus 30 天 | CA$4.99/次 | 最近 200 条 | 180 秒 |

信用卡走月订阅；微信支付和支付宝走一次性购买 30 天 Plus。Stripe 当前限制下，WeChat Pay 不支持自动续费，Alipay 的 recurring 需要额外审批，不能把它们当作稳定的月订阅扣款方式。

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

注意 ID 类型：

- `STRIPE_SECRET_KEY` 必须是 `sk_test_...` 或 `sk_live_...`，不能用 `pk_...`。
- `STRIPE_PLUS_PRICE_ID` 必须是 `price_...`，不能用 `prod_...`。`prod_...` 是产品 ID，不是价格 ID。
- `STRIPE_WEBHOOK_SECRET` 必须是 `whsec_...`，不能用 `we_...`。`we_...` 是 Webhook 接收端 ID。
- `SUPABASE_SECRET_KEY` 优先使用 `sb_secret_...`，不能用 `sb_publishable_...`。

复制 Price ID 的位置：Stripe **Product catalog → Chunk Talk Plus → Pricing**，在 `CA$4.99 CAD / month` 价格右侧点击 `... → Copy price ID`。

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

新版 Stripe 沙盒在 **Workbench → Webhook** 中配置；旧版界面可能是 **Developers → Webhooks**。

1. Stripe Dashboard → **Workbench → Webhook → 添加接收端**。
2. Endpoint URL：

```text
https://oralenglish.vercel.app/api/stripe/webhook
```

3. 有效载荷类型选择 **Snapshot / 快照**。
4. 监听事件：
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. 创建后打开这个接收端，在 **签名密钥 / Signing secret** 点击 **Reveal**，复制 `whsec_...` 到 Vercel 的 `STRIPE_WEBHOOK_SECRET`。

如果误建了 Thin 和 Snapshot 两个接收端，保留 Snapshot。Thin 接收端可以禁用或删除，避免同一个 URL 收到两套签名不同的事件。

微信/支付宝一次性付款也依赖 `checkout.session.completed`。因此这四个事件里，第一个必须保留。

## 5. 微信支付和支付宝

在 Stripe **Settings → Payments → Payment methods** 中启用：

- Alipay
- WeChat Pay

应用中有两个入口：

- `信用卡订阅 · CA$4.99/月`：调用 `/api/stripe/checkout`，创建 recurring subscription。
- `微信/支付宝 · 购买 30 天`：调用 `/api/stripe/wallet-checkout`，创建一次性 `payment` 模式 Checkout，金额 `CA$4.99 CAD`。

微信/支付宝支付成功后，Webhook 会把 `public.subscriptions` 更新为：

- `plan = plus`
- `status = active`
- `current_period_end = 当前时间或原到期时间 + 30 天`

如果同一个 Stripe 事件被重试，系统会用 `stripe_payment_intent_id` 防止重复叠加 30 天。旧项目需要重新执行 `supabase/payments.sql`，给 `subscriptions` 表增加 `stripe_payment_intent_id` 列。

## 6. Customer Portal

在 Stripe Dashboard → **Settings → Billing → Customer portal** 中启用：

- Update payment method
- Cancel subscription
- View invoice history

用户在 Chunk Talk 点击“管理订阅”后会进入 Stripe 托管页面，不需要本站处理信用卡信息。

## 7. 测试

1. 配置所有变量后重新部署。
2. 登录 Chunk Talk Google 账号。
3. 点击“信用卡订阅 · CA$4.99/月”。
4. Stripe Test mode 使用测试卡 `4242 4242 4242 4242`、任意未来日期和 CVC。
5. 支付后检查 `public.subscriptions` 是否出现 `active`。
6. 确认录音卡显示 Plus：200 条、180 秒。
7. 再点击“微信/支付宝 · 购买 30 天”，确认 Stripe Checkout 显示 Alipay / WeChat Pay。若没有显示，进入 Stripe Payment methods 页面用 Troubleshooting 工具检查账户地区、币种和方法是否已启用。
8. 在 Stripe 取消订阅并确认 Webhook 把状态同步回来。
9. 全流程通过后，把 Stripe 变量替换为 Live mode 的 `sk_live_...`、正式 Price ID 和正式 Webhook secret，并在 Live mode 重新启用 Alipay / WeChat Pay。

## 8. 常见错误

`STRIPE_SECRET_KEY has an invalid format`：Vercel 里填的不是 `sk_test_...` 或 `sk_live_...`。重新到 Stripe **API Keys → Secret key → Reveal** 复制。

`No such price: 'prod_...'`：把产品 ID 填到了 `STRIPE_PLUS_PRICE_ID`。需要回到产品的 Pricing 区域复制 `price_...`。

微信/支付宝不显示：先确认当前是一次性付款入口，不是月订阅入口；再确认 Stripe Payment methods 中 Alipay / WeChat Pay 已启用，币种为 CAD，账号处于支持国家或地区。
