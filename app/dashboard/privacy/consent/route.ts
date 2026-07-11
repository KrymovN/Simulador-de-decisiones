import { NextResponse } from "next/server";

import { readAccountConsentStatusSurface } from "../../../../lib/user-data-controls/account-consent-status-surface";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await readAccountConsentStatusSurface();

  if (result.status === "blocked") {
    return NextResponse.json(result, {
      status: result.reason === "auth_required" ? 401 : 503,
      headers: { "Cache-Control": "no-store" },
    });
  }

  return new NextResponse(JSON.stringify(result.document, null, 2), {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": 'attachment; filename="levio-account-consent-status.json"',
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
