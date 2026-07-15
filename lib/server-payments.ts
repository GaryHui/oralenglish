import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const requiredEnv = (name: string) => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};

export const getStripe = () => {
  const key = requiredEnv("STRIPE_SECRET_KEY");
  if (!/^(sk|rk)_(test|live)_/.test(key)) {
    throw new Error("STRIPE_SECRET_KEY has an invalid format");
  }
  return new Stripe(key, {
    httpClient: Stripe.createFetchHttpClient(),
    maxNetworkRetries: 1,
  });
};
export const getAdminSupabase = () => createClient(
  requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  requiredEnv("SUPABASE_SECRET_KEY"),
  { auth: { persistSession: false, autoRefreshToken: false } },
);

export async function getRequestUser(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const client = createClient(
    requiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    { global: { headers: { Authorization: authorization } }, auth: { persistSession: false } },
  );
  const { data } = await client.auth.getUser();
  return data.user;
}

export const appUrl = (request: Request) =>
  process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
