import "server-only";

import { handleSupabaseOperationalHealthRequest } from "../../../../lib/operations/supabase-operational-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request): Promise<Response> {
  return handleSupabaseOperationalHealthRequest({
    request,
    cronSecret: process.env.CRON_SECRET,
  });
}
