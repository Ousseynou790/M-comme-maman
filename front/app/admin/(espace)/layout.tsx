import { AdminGate, AdminShell } from "@/components/admin/shell";

/* Le groupe « (espace) » porte la chrome et le portier ; `/admin/connexion`
   reste en dehors, sinon la page de connexion serait elle-même protégée. */
export default function EspaceLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminGate>
      <AdminShell>{children}</AdminShell>
    </AdminGate>
  );
}
