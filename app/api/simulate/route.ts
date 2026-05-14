import { buildMockSimulation } from "../../../lib/simulationEngine";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const input = typeof body.input === "string" ? body.input.trim() : "";

  if (!input) {
    return Response.json(
      {
        error: "Describe una situación para poder simular escenarios.",
      },
      { status: 400 },
    );
  }

  const response = buildMockSimulation(input);

  return Response.json({
    ...response,
    meta: {
      lang: "es",
      safeRender: true,
      mockOnly: true,
      apiReady: true,
      note: "Respuesta mock en español. Sustituir buildMockSimulation por un proveedor real cuando el MVP pase a backend.",
    },
  });
}
