import "server-only";

import OpenAI from "openai";

import {
  OPENAI_SYNTHETIC_RISK_MODEL,
  SyntheticRiskTransportFailure,
  executeSyntheticCandidateRiskSignals,
  type SyntheticRiskExecutionResult,
  type SyntheticRiskProviderRequest,
  type SyntheticRiskTransport,
  type SyntheticRiskTransportGeneration,
} from "./openai-synthetic-risk-adapter";

function responseRequest(request: SyntheticRiskProviderRequest) {
  return {
    model: OPENAI_SYNTHETIC_RISK_MODEL,
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

function normalizedProviderFailure(error: unknown): SyntheticRiskTransportFailure {
  if (error instanceof OpenAI.APIConnectionTimeoutError) {
    return new SyntheticRiskTransportFailure("provider_timeout");
  }
  if (error instanceof OpenAI.AuthenticationError) {
    return new SyntheticRiskTransportFailure("provider_authentication_failed");
  }
  if (error instanceof OpenAI.RateLimitError) {
    return new SyntheticRiskTransportFailure("provider_rate_limited");
  }
  if (error instanceof OpenAI.APIConnectionError) {
    return new SyntheticRiskTransportFailure("provider_unavailable");
  }
  if (error instanceof OpenAI.APIError && error.status != null && error.status >= 500) {
    return new SyntheticRiskTransportFailure("provider_unavailable");
  }
  return new SyntheticRiskTransportFailure("provider_unknown_failure");
}

function responseWasRefused(response: OpenAI.Responses.Response): boolean {
  return response.output.some(
    (item) => item.type === "message" &&
      item.content.some((content) => content.type === "refusal"),
  );
}

function createOpenAITransport(apiKey: string): SyntheticRiskTransport {
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
        throw normalizedProviderFailure(error);
      }
    },

    async generate(request, timeoutMs): Promise<SyntheticRiskTransportGeneration> {
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
          throw new SyntheticRiskTransportFailure("provider_response_invalid");
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
        if (error instanceof SyntheticRiskTransportFailure) throw error;
        throw normalizedProviderFailure(error);
      }
    },
  };
}

export async function executeOpenAISyntheticCandidateRiskSignalsManually(
  repositoryOwnedFixture: unknown,
): Promise<SyntheticRiskExecutionResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  return executeSyntheticCandidateRiskSignals(repositoryOwnedFixture, {
    enabled: process.env.LEVIO_REAL_AI_DEV_ENABLED === "true",
    apiKeyAvailable: Boolean(apiKey),
    provider: process.env.LEVIO_AI_PROVIDER,
    manualDevInvocation: true,
    transport: apiKey
      ? createOpenAITransport(apiKey)
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
