import { NextResponse } from "next/server";

import { readAccountDataRetentionSurface } from "../../../../lib/user-data-controls/account-data-retention-surface";
import {
  enforceExpiredSimulationDraftRetention,
  parseSimulationDraftRetentionRequest,
  type SimulationDraftRetentionResult,
} from "../../../../lib/user-data-controls/simulation-draft-retention-enforcement";

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

const MAX_RETENTION_REQUEST_LENGTH = 1024;

function postStatus(result: SimulationDraftRetentionResult): number {
  if (result.status === "restricted") return 409;
  if (result.status !== "blocked") return 200;
  if (result.reason === "auth_required") return 401;
  if (result.reason === "invalid_request") return 400;
  return 503;
}

function jsonNoStore(result: SimulationDraftRetentionResult, status = postStatus(result)) {
  return NextResponse.json(result, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function invalidPostResponse(status: 400 | 415) {
  const result = parseSimulationDraftRetentionRequest(null);
  if (result.status === "ready") {
    throw new Error("Invalid retention request unexpectedly passed validation.");
  }
  return jsonNoStore(result, status);
}

export async function POST(request: Request) {
  const mediaType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (mediaType !== "application/json") {
    return invalidPostResponse(415);
  }

  const bodyText = await request.text();
  if (bodyText.length === 0 || bodyText.length > MAX_RETENTION_REQUEST_LENGTH) {
    return invalidPostResponse(400);
  }

  let body: unknown;
  try {
    body = JSON.parse(bodyText);
  } catch {
    return invalidPostResponse(400);
  }

  const requestInput = parseSimulationDraftRetentionRequest(body);
  if (requestInput.status === "blocked") {
    return jsonNoStore(requestInput, 400);
  }

  const result = await enforceExpiredSimulationDraftRetention({
    draftId: requestInput.draftId,
  });

  return jsonNoStore(result);
}
