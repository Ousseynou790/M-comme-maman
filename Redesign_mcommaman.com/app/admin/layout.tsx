import type { Metadata } from "next";
import { AdminProvider } from "@/lib/admin/store";

/* L'état du back-office ne descend que sur `/admin` : la vitrine n'en a pas
   besoin, et le charger partout ferait porter à chaque page un état qu'elle
   n'ouvre jamais. La page de connexion vit sous ce fournisseur elle aussi —
   elle ne s'en sert pas, mais l'y garder évite un remontage à l'entrée. */
export const metadata: Metadata = {
  title: { default: "Back-office", template: "%s · Back-office" },
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminProvider>{children}</AdminProvider>;
}
