export async function POST(req: Request) {
  const { input } = await req.json();

  return Response.json({
    input,
    options: [
      {
        id: "stable",
        title: "Escenario estable",
        description: "Mantener el estado actual con mínima exposición al riesgo",
        risk: "Bajo",
        reward: "Bajo",
        color: "#22c55e"
      },
      {
        id: "balanced",
        title: "Escenario de evolución",
        description: "Crecimiento progresivo con control del riesgo",
        risk: "Medio",
        reward: "Medio",
        color: "#facc15"
      },
      {
        id: "aggressive",
        title: "Escenario agresivo",
        description: "Máximo crecimiento con alta incertidumbre",
        risk: "Alto",
        reward: "Alto",
        color: "#ef4444"
      }
    ],
    meta: {
      mood: "active",
      breathing: true
    }
  });
}