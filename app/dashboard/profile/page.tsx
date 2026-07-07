import DashboardShell from "../../../components/DashboardShell";
import DashboardProfileAccountState from "../../../components/dashboard/DashboardProfileAccountState";
import MockAuthGate from "../../../components/MockAuthGate";
import { accountSignals, activityLog, futureLanguages } from "../../../lib/personalArea";

export default function ProfilePage() {
  return (
    <MockAuthGate>
      <DashboardShell
        description="Prepara identidad, idioma preferido y configuración regional para futuras simulaciones personalizadas."
        eyebrow="levio.es / Perfil"
        title="Perfil preparado."
      >
        <DashboardProfileAccountState
          accountSignals={accountSignals}
          activityLog={activityLog}
          futureLanguages={futureLanguages}
        />
      </DashboardShell>
    </MockAuthGate>
  );
}
