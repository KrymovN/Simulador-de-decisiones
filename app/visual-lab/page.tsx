import type { Metadata } from "next";
import DecisionSingularityWebGL from "../../components/DecisionSingularityWebGL";

export const metadata: Metadata = {
  title: "Visual Lab | levio.es",
  description: "Isolated WebGL sandbox for Levio visual engine research.",
};

export default function VisualLabPage() {
  return <DecisionSingularityWebGL />;
}
