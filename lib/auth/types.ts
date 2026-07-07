export type LevioPrincipalType =
  | "anonymous_visitor"
  | "guest_session"
  | "registered_user"
  | "premium_user"
  | "internal_operator"
  | "service";

export type LevioSessionStatus =
  | "active"
  | "expired"
  | "revoked"
  | "compromised"
  | "pending_step_up";

export type LevioAssuranceLevel =
  | "guest"
  | "authenticated"
  | "recently_authenticated"
  | "step_up_verified"
  | "internal_strong_auth";

export type LevioIdentityState =
  | "anonymous"
  | "guest"
  | "authenticated"
  | "signed_out"
  | "auth_error";

export type LevioAuthErrorCode =
  | "auth_runtime_disabled"
  | "auth_config_missing"
  | "session_missing"
  | "session_invalid"
  | "session_expired"
  | "session_revoked"
  | "callback_missing_code"
  | "callback_invalid"
  | "callback_expired"
  | "callback_cancelled"
  | "callback_exchange_failed"
  | "provider_error";

export type LevioAuthError = {
  code: LevioAuthErrorCode;
  message: string;
};

export type LevioPrincipalContext = {
  principalId: string;
  principalType: Extract<LevioPrincipalType, "registered_user">;
  providerReference: string;
  email?: string;
};

export type LevioSessionContext = {
  identityState: Extract<LevioIdentityState, "authenticated">;
  principal: LevioPrincipalContext;
  sessionId: string;
  sessionStatus: Extract<LevioSessionStatus, "active" | "expired">;
  assuranceLevel: Extract<LevioAssuranceLevel, "authenticated">;
  authTime?: string;
  expiresAt?: string;
  riskFlags: string[];
};

export type LevioSignedOutContext = {
  identityState: Extract<LevioIdentityState, "signed_out">;
  error?: LevioAuthError;
};

export type LevioAuthRuntimeContext = LevioSessionContext | LevioSignedOutContext;

export type AuthRuntimeStatus = "enabled" | "disabled";

export type AuthRuntimeConfig =
  | {
      status: "enabled";
      provider: "supabase";
      supabaseUrl: string;
      supabaseAnonKey: string;
      appUrl: string;
      redirectAllowlist: string[];
    }
  | {
      status: "disabled";
      provider: "supabase";
      reason: LevioAuthError;
      appUrl: string;
      redirectAllowlist: string[];
    };
