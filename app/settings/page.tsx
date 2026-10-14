import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { SettingsClient } from "@/components/SettingsClient";

export default async function SettingsPage() {
  if (!(await getSessionUser())) redirect("/login?next=/settings");
  return <SettingsClient />;
}
