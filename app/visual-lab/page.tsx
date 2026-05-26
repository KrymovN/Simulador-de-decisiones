import type { Metadata } from "next";
import DecisionSingularityWebGL from "../../components/DecisionSingularityWebGL";

export const metadata: Metadata = {
  title: "Visual Lab | levio.es",
  description: "Isolated predictive sphere visual sandbox for Levio visual research.",
};

export default function VisualLabPage() {
  return <DecisionSingularityWebGL />;
}
