export type ProviderFailureType =
  | "connection_error"
  | "http_error"
  | "timeout"
  | "other_supported_existing_type";

export type ProviderFailureOperationalMetadata = {
  providerFailureType: ProviderFailureType;
  httpStatus: number | null;
  providerCode: string | null;
  providerErrorType: string | null;
};

function boundedHttpStatus(value: unknown): number | null {
  return Number.isSafeInteger(value) && Number(value) >= 400 && Number(value) <= 599
    ? Number(value)
    : null;
}

function boundedProviderToken(value: unknown): string | null {
  if (typeof value !== "string" || value.length < 1 || value.length > 160) return null;
  return /^[A-Za-z0-9_.\[\]-]+$/.test(value) ? value : null;
}

export function boundedProviderFailureMetadata(value: {
  providerFailureType: ProviderFailureType;
  httpStatus?: unknown;
  providerCode?: unknown;
  providerErrorType?: unknown;
}): ProviderFailureOperationalMetadata {
  return {
    providerFailureType: value.providerFailureType,
    httpStatus: boundedHttpStatus(value.httpStatus),
    providerCode: boundedProviderToken(value.providerCode),
    providerErrorType: boundedProviderToken(value.providerErrorType),
  };
}
