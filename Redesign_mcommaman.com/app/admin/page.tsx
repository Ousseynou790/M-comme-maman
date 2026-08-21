import type { Metadata } from "next";
import { Admin } from "@/components/admin";

export const metadata: Metadata = { title: "Back-office", robots: { index: false } };

export default function Page() {
  return <Admin />;
}
