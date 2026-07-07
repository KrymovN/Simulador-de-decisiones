import type { Session, User } from "@supabase/supabase-js";
import type { LevioSessionContext } from "./types";

function readSessionId(accessToken: string | undefined) {
  if (!accessToken) {
    return "supabase-session";
  }

  try {
    const [, payload] = accessToken.split(".");

    if (!payload) {
      return "supabase-session";
    }

    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));

    if (typeof decoded.session_id === "string" && decoded.session_id.length > 0) {
      return decoded.session_id;
    }
  } catch {
    return "supabase-session";
  }

  return "supabase-session";
}

function readExpiresAt(session: Session) {
  if (!session.expires_at) {
    return undefined;
  }

  return new Date(session.expires_at * 1000).toISOString();
}

function readSessionStatus(session: Session): LevioSessionContext["sessionStatus"] {
  if (!session.expires_at) {
    return "active";
  }

  return session.expires_at * 1000 <= Date.now() ? "expired" : "active";
}

function readEmailVerified(user: User) {
  return Boolean(user.email_confirmed_at ?? user.confirmed_at);
}

export function normalizeRegisteredUserSession(session: Session, user: User): LevioSessionContext {
  const providerReference = `supabase:${user.id}`;

  return {
    identityState: "authenticated",
    principal: {
      principalId: `stage4_1b_registered:${user.id}`,
      principalType: "registered_user",
      providerReference,
      email: user.email,
      emailVerified: readEmailVerified(user),
    },
    sessionId: readSessionId(session.access_token),
    sessionStatus: readSessionStatus(session),
    assuranceLevel: "authenticated",
    authTime: user.last_sign_in_at ?? undefined,
    expiresAt: readExpiresAt(session),
    riskFlags: [],
  };
}
