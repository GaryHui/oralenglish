import { NextResponse } from "next/server";
import { appUrl, getAdminSupabase, getRequestUser, getStripe } from "../../../../lib/server-payments";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const user = await getRequestUser(request);
    if (!user) return NextResponse.json({ error: "请先登录。" }, { status: 401 });
    const admin = getAdminSupabase();
    const { data } = await admin.from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).single();
    if (!data?.stripe_customer_id) return NextResponse.json({ error: "没有找到有效订阅。" }, { status: 404 });
    const session = await getStripe().billingPortal.sessions.create({ customer: data.stripe_customer_id, return_url: appUrl(request) });
    return NextResponse.json({ url: session.url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "无法打开订阅管理";
    return NextResponse.json({ error: message }, { status: 503 });
  }
}
