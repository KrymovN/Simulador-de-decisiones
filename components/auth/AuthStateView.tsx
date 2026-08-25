"use client";

import { useAuthRuntime } from "./AuthRuntimeProvider";

type AuthStateViewProps = {
  authenticatedLabel?: string;
  signedOutLabel?: string;
  errorLabel?: string;
};

export default function AuthStateView({
  authenticatedLabel = "Sesión iniciada",
  signedOutLabel,
  errorLabel = "No se pudo verificar la sesión. Inténtalo de nuevo.",
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
      <div className="mock-feedback" role="alert">
        El sistema de acceso no está disponible en este momento.
      </div>
    );
  }

  if (!signedOutLabel) {
    return null;
  }

  return (
    <div className="mock-feedback" role="status">
      {signedOutLabel}
    </div>
  );
}
