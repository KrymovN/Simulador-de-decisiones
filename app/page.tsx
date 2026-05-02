console.log("TEST CHANGE ACTIVE");
"use client";

import { useState } from "react";

const translations: any = {
  es: {
    title: "Simulación dinámica de decisiones",
    placeholder: "Describe la situación...",
    button: "Simular",
    loading: "Analizando...",
  },
  en: {
    title: "Dynamic Decision Simulation",
    placeholder: "Describe the situation...",
    button: "Simulate",
    loading: "Analyzing...",
  },
  fr: {
    title: "Simulation dynamique des décisions",
    placeholder: "Décrivez la situation...",
    button: "Simuler",
    loading: "Analyse...",
  },
  de: {
    title: "Dynamische Entscheidungssimulation",
    placeholder: "Beschreibe die Situation...",
    button: "Simulieren",
    loading: "Analyse...",
  },
  ar: {
    title: "محاكاة ديناميكية للقرارات",
    placeholder: "صف الوضع...",
    button: "محاكاة",
    loading: "جارٍ التحليل...",
    dir: "rtl",
  },
  zh: {
    title: "动态决策模拟",
    placeholder: "描述情况...",
    button: "模拟",
    loading: "分析中...",
  },
};

export default function Page() {
  const [lang, setLang] = useState("es");
  const [input, setInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const t = translations[lang] || translations.es;

  async function simulate() {
    setLoading(true);

    const res = await fetch("/api/simulate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input, lang }),
    });

    const data = await res.json();
    setResult(data);

    setLoading(false);
  }

  return (
    <div
      style={{
        ...styles.container,
        direction: lang === "ar" ? "rtl" : "ltr",
      }}
    >
      <div style={styles.header}>
        <h1>{t.title}</h1>

        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          style={styles.select}
        >
          <option value="es">ES</option>
          <option value="en">EN</option>
          <option value="fr">FR</option>
          <option value="de">DE</option>
          <option value="ar">AR</option>
          <option value="zh">ZH</option>
        </select>
      </div>

      <textarea
        style={styles.input}
        placeholder={t.placeholder}
        value={input}
        onChange={(e) => setInput(e.target.value)}
      />

      <button onClick={simulate} style={styles.button}>
        {loading ? t.loading : t.button}
      </button>

      {result && (
        <div style={styles.grid}>
          {result.options.map((opt: any) => (
            <div
              key={opt.id}
              style={{
                ...styles.card,
                borderColor: opt.color,
                animation: "breathe 3s ease-in-out infinite",
              }}
            >
              <h2 style={{ color: opt.color }}>{opt.title}</h2>
              <p>{opt.description}</p>
              <p>Risk: {opt.risk}</p>
              <p>Reward: {opt.reward}</p>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes breathe {
          0% { transform: scale(1); opacity: 0.85; }
          50% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(1); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}

const styles: any = {
  container: {
    minHeight: "100vh",
    background: "#0b0f19",
    color: "white",
    padding: "40px",
    fontFamily: "Arial",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  select: {
    padding: "6px",
  },
  input: {
    width: "100%",
    height: "120px",
    marginTop: "20px",
    padding: "12px",
  },
  button: {
    marginTop: "10px",
    padding: "10px 16px",
    cursor: "pointer",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    marginTop: "20px",
  },
  card: {
    padding: "16px",
    border: "2px solid",
    borderRadius: "12px",
    background: "#111827",
  },
};