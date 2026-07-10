import { NextResponse } from "next/server";

import { readAccountDataRetentionSurface } from "../../../../lib/user-data-controls/account-data-retention-surface";

export const dynamic = "force-dynamic";

export async function GET() {
  const result = await readAccountDataRetentionSurface();

  if (result.status === "blocked") {
    return NextResponse.json(
      {
        status: "blocked",
        reason: result.reason,
        message: result.message,
      },
      {
        status: result.reason === "auth_required" ? 401 : 503,
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  }

  return new NextResponse(JSON.stringify(result.document, null, 2), {
    status: 200,
    headers: {
      "Cache-Control": "no-store",
      "Content-Disposition": 'attachment; filename="levio-account-data-retention-plan.json"',
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}
