import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getAdminSupabase, getStripe, requiredEnv } from "../../../../lib/server-payments";

export const runtime = "nodejs";

async function syncSubscription(subscription: Stripe.Subscription) {
  const admin = getAdminSupabase(), stripe = getStripe();
  let userId = subscription.metadata.supabase_user_id;
  if (!userId) {
    const { data } = await admin.from("subscriptions").select("user_id").eq("stripe_customer_id", String(subscription.customer)).maybeSingle();
    userId = data?.user_id;
  }
  if (!userId) return;
  const customer = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  const itemPeriodEnd = subscription.items.data[0]?.current_period_end;
  await admin.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: customer,
    stripe_subscription_id: subscription.id,
    status: subscription.status,
    plan: "plus",
    current_period_end: itemPeriodEnd ? new Date(itemPeriodEnd * 1000).toISOString() : null,
    updated_at: new Date().toISOString(),
  });
}

async function syncOneTimePlus(session: Stripe.Checkout.Session) {
  const admin = getAdminSupabase();
  const userId = session.metadata?.supabase_user_id;
  const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id;
  if (!userId || session.payment_status !== "paid" || !paymentIntent) return;
  const { data: existing } = await admin
    .from("subscriptions")
    .select("current_period_end,stripe_payment_intent_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing?.stripe_payment_intent_id === paymentIntent) return;
  const currentEnd = existing?.current_period_end ? new Date(existing.current_period_end).getTime() : 0;
  const start = Math.max(Date.now(), Number.isFinite(currentEnd) ? currentEnd : 0);
  const accessDays = Math.max(1, Number(session.metadata?.access_days || 30));
  await admin.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: typeof session.customer === "string" ? session.customer : session.customer?.id || null,
    stripe_payment_intent_id: paymentIntent,
    status: "active",
    plan: "plus",
    current_period_end: new Date(start + accessDays * 86400000).toISOString(),
    updated_at: new Date().toISOString(),
  });
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  try {
    const stripe = getStripe();
    const event = stripe.webhooks.constructEvent(await request.text(), signature, requiredEnv("STRIPE_WEBHOOK_SECRET"));
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) await syncSubscription(await stripe.subscriptions.retrieve(String(session.subscription)));
      else await syncOneTimePlus(session);
    } else if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      await syncSubscription(event.data.object as Stripe.Subscription);
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
