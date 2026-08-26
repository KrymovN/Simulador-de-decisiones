import DashboardShell from "../../../components/DashboardShell";
import MockAuthGate from "../../../components/MockAuthGate";
import PrivacyPanel from "../../../components/PrivacyPanel";

export default function PrivacyPage({ searchParams }: { searchParams: { draftDeletion?: string } }) {
  return (
    <MockAuthGate>
      <DashboardShell
        description="Revisa, exporta y gestiona los datos personales asociados a tu cuenta."
        eyebrow="LEVIO.ES / CENTRO DE PRIVACIDAD"
        title="Privacidad y datos"
      >
        <div className="privacy-controls-surface">
          {searchParams.draftDeletion === "completed" && (
            <section className="dashboard-card privacy-controls-state privacy-controls-state--success" role="status">
              <h2>El borrador ya no está disponible.</h2>
              <p>Su contenido activo se ha eliminado o ya no estaba disponible. No se ha modificado ninguna otra simulación ni la cuenta.</p>
            </section>
          )}
          <PrivacyPanel />
        </div>
      </DashboardShell>
    </MockAuthGate>
  );
}
