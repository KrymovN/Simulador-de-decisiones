export async function POST(req: Request) {
  try {
    const body = await req.json();
    const input = body?.input || "";

    const variants = [
      {
        title: "Escenario estable",
        description: "Mantener situación actual",
        risk: "Bajo",
        benefit: "Estabilidad",
      },
      {
        title: "Escenario de cambio",
        description: "Evolución progresiva",
        risk: "Medio",
        benefit: "Crecimiento",
      },
      {
        title: "Escenario agresivo",
        description: "Cambio radical",
        risk: "Alto",
        benefit: "Alto potencial",
      },
    ];

    return Response.json({
      input,
      options: variants,
      analysis: {
        summary: "Sistema analizando la situación...",
        conclusion: "Existen múltiples escenarios posibles.",
      },
    });
  } catch (error) {
    return Response.json(
      {
        error: "Request failed",
      },
      { status: 500 }
    );
  }
}