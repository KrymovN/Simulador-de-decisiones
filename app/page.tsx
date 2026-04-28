"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [lang, setLang] = useState("es");

  const run = async () => {
    setLoading(true);
    setResult(null);
    setStage(0);

    // визуальные этапы "мышления"
    setTimeout(() => setStage(1), 300);
    setTimeout(() => setStage(2), 800);
    setTimeout(() => setStage(3), 1300);

    const res = await fetch("/api/simulate", {
      method: "POST",
      body: JSON.stringify({ input }),
    });

    const data = await res.json();

    setTimeout(() => {
      setResult(data);
      setLoading(false);
    }, 1500);
  };

  return (
    <div style={styles.page}>
      {/* фон */}
      <div style={styles.bg} />

      <div style={styles.container}>
        {/* header */}
        <div style={styles.header}>
          <div style={styles.logo}>Levio</div>

          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={styles.select}
          >
            <option value="es">ES</option>
            <option value="en">EN</option>
            <option value="fr">FR</option>
          </select>
        </div>

        {/* card */}
        <div style={styles.card}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe tu situación..."
            style={styles.textarea}
          />

          <button onClick={run} style={styles.button}>
            Iniciar análisis
          </button>

          {/* thinking */}
          {loading && (
            <div style={styles.thinking}>
              {stage >= 1 && <p>Analizando contexto...</p>}
              {stage >= 2 && <p>Generando escenarios...</p>}
              {stage >= 3 && <p>Evaluando consecuencias...</p>}
            </div>
          )}

          {/* result */}
          {result && (
            <div style={styles.result}>
              <p style={styles.summary}>{result.analysis.summary}</p>

              <div style={styles.options}>
                {result.options.map((o: any, i: number) => (
                  <div key={i} style={styles.option}>
                    <div style={styles.title}>{o.title}</div>
                    <div style={styles.text}>{o.description}</div>
                    <div style={styles.meta}>Riesgo: {o.risk}</div>
                    <div style={styles.meta}>Beneficio: {o.benefit}</div>
                  </div>
                ))}
              </div>

              <div style={styles.conclusion}>
                {result.analysis.conclusion}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* 🎨 STYLES */
const styles: any = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#05070d",
    color: "white",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    position: "relative",
    overflow: "hidden",
  },

  bg: {
    position: "absolute",
    width: "600px",
    height: "600px",
    background: "radial-gradient(circle, rgba(255,0,0,0.25), transparent 60%)",
    top: "-200px",
    left: "-200px",
    filter: "blur(80px)",
  },

  container: {
    width: "100%",
    maxWidth: "800px",
    zIndex: 2,
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  logo: {
    fontSize: 24,
    color: "#ff2d2d",
    fontWeight: "bold",
  },

  select: {
    background: "#111",
    color: "white",
    border: "1px solid #333",
    padding: "5px 10px",
    borderRadius: 6,
  },

  card: {
    background: "rgba(0,0,0,0.6)",
    border: "1px solid #222",
    borderRadius: 16,
    padding: 20,
    backdropFilter: "blur(10px)",
  },

  textarea: {
    width: "100%",
    height: 120,
    background: "#0a0a0a",
    border: "1px solid #333",
    borderRadius: 10,
    padding: 12,
    color: "white",
    outline: "none",
  },

  button: {
    width: "100%",
    marginTop: 12,
    padding: 12,
    background: "#ff2d2d",
    border: "none",
    color: "white",
    borderRadius: 10,
    cursor: "pointer",
  },

  thinking: {
    marginTop: 15,
    fontSize: 13,
    color: "#ff6666",
  },

  result: {
    marginTop: 20,
  },

  summary: {
    color: "#aaa",
    fontSize: 14,
  },

  options: {
    marginTop: 10,
    display: "flex",
    flexDirection: "column",
    gap: 10,
  },

  option: {
    padding: 12,
    border: "1px solid #222",
    borderRadius: 10,
    background: "#0a0a0a",
  },

  title: {
    color: "#ff3b3b",
    fontWeight: "bold",
  },

  text: {
    fontSize: 13,
    color: "#ccc",
  },

  meta: {
    fontSize: 11,
    color: "#777",
  },

  conclusion: {
    marginTop: 15,
    fontStyle: "italic",
    color: "#999",
  },
};