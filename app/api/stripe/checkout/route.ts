import { NextResponse } from "next/server";
import { appUrl, getRequestUser, getStripe, requiredEnv } from "../../../../lib/server-payments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user?.email) return NextResponse.json({ error: "请先登录 Google 账号。" }, { status: 401 });
    const stripe = getStripe(), origin = appUrl(request);
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: requiredEnv("STRIPE_PLUS_PRICE_ID"), quantity: 1 }],
      customer_email: user.email,
      client_reference_id: user.id,
      metadata: { supabase_user_id: user.id, plan: "plus" },
      subscription_data: { metadata: { supabase_user_id: user.id, plan: "plus" } },
      allow_promotion_codes: true,
      success_url: `${origin}/?payment=success`,
      cancel_url: `${origin}/?payment=cancelled`,
    });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "无法创建支付页面";
    console.error("Stripe checkout failed", {
      name: error instanceof Error ? error.name : "UnknownError",
      message,
      code: typeof error === "object" && error && "code" in error ? String(error.code) : undefined,
    });
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
