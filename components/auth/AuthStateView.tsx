"use client";

import { useAuthRuntime } from "./AuthRuntimeProvider";

type AuthStateViewProps = {
  authenticatedLabel?: string;
  signedOutLabel?: string;
  errorLabel?: string;
};

export default function AuthStateView({
  authenticatedLabel = "Sesión autenticada",
  signedOutLabel = "Sesión no iniciada",
  errorLabel = "No se pudo verificar la sesión",
}: AuthStateViewProps) {
  const auth = useAuthRuntime();

  if (auth.identityState === "authenticated") {
    return (
      <div className="mock-feedback" role="status">
        {authenticatedLabel}
        {auth.email ? `: ${auth.email}` : ""}
      </div>
    );
  }

  if (auth.identityState === "auth_error") {
    return (
      <div className="mock-feedback" role="alert">
        {errorLabel}
      </div>
    );
  }

  if (auth.error === "auth_config_missing") {
    return (
      <div className="mock-feedback" role="status">
        Auth Runtime no está configurado todavía.
      </div>
    );
  }

  return (
    <div className="mock-feedback" role="status">
      {signedOutLabel}
    </div>
  );
}
