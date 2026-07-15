import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

export const requiredEnv = (name: string) => {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};

export const getStripe = () => new Stripe(requiredEnv("STRIPE_SECRET_KEY"));
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
