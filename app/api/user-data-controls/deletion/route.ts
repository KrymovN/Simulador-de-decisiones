import { handleUserDataControlsDeletionRequest } from "../../../../lib/user-data-controls/api-route-foundation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  return handleUserDataControlsDeletionRequest(request);
}
