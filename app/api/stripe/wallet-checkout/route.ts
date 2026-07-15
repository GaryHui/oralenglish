import { NextResponse } from "next/server";
import { appUrl, getRequestUser, getStripe } from "../../../../lib/server-payments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user?.email) return NextResponse.json({ error: "请先登录 Google 账号。" }, { status: 401 });
    const stripe = getStripe(), origin = appUrl(request);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "alipay", "wechat_pay"],
      line_items: [{
        price_data: {
          currency: "cad",
          unit_amount: 499,
          product_data: {
            name: "Chunk Talk Plus · 30 天",
            description: "200 条云端录音，每条最长 180 秒。",
          },
        },
        quantity: 1,
      }],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: { supabase_user_id: user.id, plan: "plus", access_days: "30", checkout_kind: "wallet_30_days" },
      payment_intent_data: { metadata: { supabase_user_id: user.id, plan: "plus", access_days: "30", checkout_kind: "wallet_30_days" } },
      success_url: `${origin}/?payment=success`,
      cancel_url: `${origin}/?payment=cancelled`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "无法创建微信/支付宝支付页面";
    console.error("Stripe wallet checkout failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message,
      code: typeof error === "object" && error && "code" in error ? String(error.code) : undefined,
    });
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
