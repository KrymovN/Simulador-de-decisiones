export async function POST(req: Request) {
  const { input, lang } = await req.json();

  const dict: any = {
    es: ["Estable", "Equilibrado", "Agresivo"],
    en: ["Stable", "Balanced", "Aggressive"],
    fr: ["Stable", "Équilibré", "Agressif"],
    de: ["Stabil", "Ausgewogen", "Aggressiv"],
    ar: ["مستقر", "متوازن", "هجومي"],
    zh: ["稳定", "平衡", "激进"],
  };

  const labels = dict[lang] || dict.en;

  return Response.json({
    input,
    options: [
      {
        id: "stable",
        title: labels[0],
        description: labels[0],
        risk: "Low",
        reward: "Low",
        color: "#22c55e",
      },
      {
        id: "balanced",
        title: labels[1],
        description: labels[1],
        risk: "Medium",
        reward: "Medium",
        color: "#facc15",
      },
      {
        id: "aggressive",
        title: labels[2],
        description: labels[2],
        risk: "High",
        reward: "High",
        color: "#ef4444",
      },
    ],
    meta: {
      lang,
      safeRender: true,
    },
  });
}