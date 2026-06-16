import { type NextRequest } from "next/server";
import { handleSupabaseAuthCallback } from "../../../lib/auth/supabase/callback";

export async function GET(request: NextRequest) {
  return handleSupabaseAuthCallback(request);
}
