import type { LevioAuthErrorCode } from "./types";

const AUTH_ERROR_MESSAGES: Record<LevioAuthErrorCode, string> = {
  auth_runtime_disabled: "Auth Runtime está desactivado por configuración.",
  auth_config_missing: "Auth Runtime no está configurado todavía.",
  session_missing: "Inicia sesión para acceder al dashboard.",
  session_invalid: "No se pudo validar la sesión. Vuelve a entrar.",
  session_expired: "La sesión ha caducado. Vuelve a entrar.",
  session_revoked: "La sesión ya no está activa. Vuelve a entrar.",
  callback_missing_code: "El enlace de acceso no contiene un código válido.",
  callback_exchange_failed: "No se pudo validar el enlace de acceso.",
  provider_error: "El proveedor de autenticación rechazó la solicitud.",
};

export function getAuthErrorMessage(code: string | null | undefined) {
  if (!code) {
    return "";
  }

  return AUTH_ERROR_MESSAGES[code as LevioAuthErrorCode] ?? "No se pudo verificar el acceso.";
}
