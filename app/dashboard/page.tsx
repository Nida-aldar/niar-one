import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { DashboardClient } from "@/components/DashboardClient";

export default async function DashboardPage() {
  if (!(await getSessionUser())) redirect("/login?next=/dashboard");
  return <DashboardClient />;
}
