import MockAuthGate from "../../../../components/MockAuthGate";
import SimulationDetailClient from "../../../../components/SimulationDetailClient";
import { getMockSimulation, mockSimulations } from "../../../../lib/mockSimulations";

export function generateStaticParams() {
  return mockSimulations.map((simulation) => ({
    id: simulation.id,
  }));
}

type SimulationDetailPageProps = {
  params: {
    id: string;
  };
};

export default function SimulationDetailPage({ params }: SimulationDetailPageProps) {
  return (
    <MockAuthGate>
      <SimulationDetailClient id={params.id} initialSimulation={getMockSimulation(params.id) ?? null} />
    </MockAuthGate>
  );
}
