import "server-only";

import OpenAI from "openai";

import {
  DecisionMaterialTransportFailure,
  OPENAI_DECISION_MATERIAL_PROVIDER,
  type DecisionMaterialProviderRequest,
  type DecisionMaterialTransport,
} from "./openai-decision-material-adapter";
import {
  SyntheticRiskTransportFailure,
  boundedProviderBadRequestMetadata,
  executeSyntheticCandidateRiskSignals,
  type SyntheticRiskExecutionResult,
  type SyntheticRiskProviderRequest,
} from "./openai-synthetic-risk-adapter";

type OpenAIResponsesProviderRequest = {
  model: string;
  instructions: string;
  input: string;
  reasoningEffort: "low";
  schemaName: string;
  schema: Record<string, unknown>;
  strict: true;
  tools: [];
  maxOutputTokens: number;
};

type OpenAIResponsesTransportGeneration =
  | {
      status: "completed";
      outputText: string;
      usage: { inputTokens: number; outputTokens: number; totalTokens: number };
    }
  | { status: "refused" }
  | { status: "incomplete" };

type OpenAIResponsesTransport<TRequest extends OpenAIResponsesProviderRequest> = {
  countInput(request: TRequest, timeoutMs: number): Promise<number>;
  generate(
    request: TRequest,
    timeoutMs: number,
  ): Promise<OpenAIResponsesTransportGeneration>;
};

type OpenAIProviderFailureCategory =
  | "provider_timeout"
  | "provider_authentication_failed"
  | "provider_rate_limited"
  | "provider_unavailable"
  | "provider_bad_request"
  | "provider_response_invalid"
  | "provider_unknown_failure";

type OpenAIProviderFailureFactory = (
  category: OpenAIProviderFailureCategory,
  providerErrorMetadata?: ReturnType<typeof boundedProviderBadRequestMetadata>,
) => Error;

function responseRequest(request: OpenAIResponsesProviderRequest) {
  return {
    model: request.model,
    instructions: request.instructions,
    input: request.input,
    reasoning: { effort: request.reasoningEffort },
    text: {
      format: {
        type: "json_schema" as const,
        name: request.schemaName,
        strict: request.strict,
        schema: request.schema,
      },
    },
    tools: request.tools,
  };
}

function normalizeOpenAIProviderFailure(
  error: unknown,
  failure: OpenAIProviderFailureFactory,
): Error {
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return failure("provider_timeout");
  }
  if (error instanceof OpenAI.AuthenticationError) {
    return failure("provider_authentication_failed");
  }
  if (error instanceof OpenAI.RateLimitError) {
    return failure("provider_rate_limited");
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return failure("provider_unavailable");
  }
  if (error instanceof OpenAI.BadRequestError) {
    return failure(
      "provider_bad_request",
      boundedProviderBadRequestMetadata({
        status: error.status,
        type: error.type,
        code: error.code,
        param: error.param,
        message: error.message,
      }),
    );
  }
  if (error instanceof OpenAI.APIError && error.status != null && error.status >= 500) {
    return failure("provider_unavailable");
  }
  return failure("provider_unknown_failure");
}

const syntheticRiskFailure: OpenAIProviderFailureFactory = (category, metadata) =>
  new SyntheticRiskTransportFailure(category, metadata);

const decisionMaterialFailure: OpenAIProviderFailureFactory = (category, metadata) =>
  new DecisionMaterialTransportFailure(category, metadata);

export function normalizedProviderFailure(error: unknown): SyntheticRiskTransportFailure {
  return normalizeOpenAIProviderFailure(error, syntheticRiskFailure) as SyntheticRiskTransportFailure;
}

function responseWasRefused(response: OpenAI.Responses.Response): boolean {
  return response.output.some(
    (item) => item.type === "message" &&
      item.content.some((content) => content.type === "refusal"),
  );
}

/** Existing server-only OpenAI Responses transport shared by bounded adapters. */
function createOpenAITransport<
  TRequest extends OpenAIResponsesProviderRequest = SyntheticRiskProviderRequest,
>(
  apiKey: string,
  failure: OpenAIProviderFailureFactory = syntheticRiskFailure,
): OpenAIResponsesTransport<TRequest> {
  const client = new OpenAI({
    apiKey,
    maxRetries: 0,
  });

  return {
    async countInput(request, timeoutMs) {
      try {
        const counted = await client.responses.inputTokens.count(
          responseRequest(request),
          { timeout: timeoutMs, maxRetries: 0 },
        );
        return counted.input_tokens;
      } catch (error) {
        throw normalizeOpenAIProviderFailure(error, failure);
      }
    },

    async generate(request, timeoutMs): Promise<OpenAIResponsesTransportGeneration> {
      try {
        const response = await client.responses.create(
          {
            ...responseRequest(request),
            background: false,
            max_output_tokens: request.maxOutputTokens,
            store: false,
            stream: false,
          },
          { timeout: timeoutMs, maxRetries: 0 },
        );
        if (responseWasRefused(response)) return { status: "refused" };
        if (response.status !== "completed") return { status: "incomplete" };
        if (!response.usage || typeof response.output_text !== "string") {
          throw failure("provider_response_invalid");
        }
        return {
          status: "completed",
          outputText: response.output_text,
          usage: {
            inputTokens: response.usage.input_tokens,
            outputTokens: response.usage.output_tokens,
            totalTokens: response.usage.total_tokens,
          },
        };
      } catch (error) {
        if (
          error instanceof SyntheticRiskTransportFailure ||
          error instanceof DecisionMaterialTransportFailure
        ) throw error;
        throw normalizeOpenAIProviderFailure(error, failure);
      }
    },
  };
}

export function createOpenAIDecisionMaterialTransport(
  apiKey: string,
): DecisionMaterialTransport {
  return createOpenAITransport<DecisionMaterialProviderRequest>(
    apiKey,
    decisionMaterialFailure,
  );
}

export function readOpenAIEnvironmentConfiguration(
  environment?: Readonly<Record<string, string | undefined>>,
): {
  LEVIO_REAL_AI_DEV_ENABLED?: string;
  LEVIO_AI_PROVIDER?: string;
  OPENAI_API_KEY?: string;
} {
  const source = environment ?? {
    get LEVIO_REAL_AI_DEV_ENABLED() {
      return process.env.LEVIO_REAL_AI_DEV_ENABLED;
    },
    get LEVIO_AI_PROVIDER() {
      return process.env.LEVIO_AI_PROVIDER;
    },
    get OPENAI_API_KEY() {
      return process.env.OPENAI_API_KEY;
    },
  };
  const enabled = source.LEVIO_REAL_AI_DEV_ENABLED;
  if (enabled !== "true") {
    return { LEVIO_REAL_AI_DEV_ENABLED: enabled };
  }

  const provider = source.LEVIO_AI_PROVIDER;
  if (provider !== OPENAI_DECISION_MATERIAL_PROVIDER) {
    return {
      LEVIO_REAL_AI_DEV_ENABLED: enabled,
      LEVIO_AI_PROVIDER: provider,
    };
  }

  return {
    LEVIO_REAL_AI_DEV_ENABLED: enabled,
    LEVIO_AI_PROVIDER: provider,
    OPENAI_API_KEY: source.OPENAI_API_KEY,
  };
}

export async function executeOpenAISyntheticCandidateRiskSignalsManually(
  repositoryOwnedFixture: unknown,
): Promise<SyntheticRiskExecutionResult> {
  const environment = readOpenAIEnvironmentConfiguration();
  const apiKey = environment.OPENAI_API_KEY;
  return executeSyntheticCandidateRiskSignals(repositoryOwnedFixture, {
    enabled: environment.LEVIO_REAL_AI_DEV_ENABLED === "true",
    apiKeyAvailable: Boolean(apiKey),
    provider: environment.LEVIO_AI_PROVIDER,
    manualDevInvocation: true,
    transport: apiKey
      ? createOpenAITransport<SyntheticRiskProviderRequest>(apiKey)
      : {
          countInput: async () => {
            throw new SyntheticRiskTransportFailure("credentials_unavailable");
          },
          generate: async () => {
            throw new SyntheticRiskTransportFailure("credentials_unavailable");
          },
        },
  });
}
