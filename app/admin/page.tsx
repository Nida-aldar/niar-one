import Link from "next/link";
import { forbidden } from "next/navigation";
import { getSessionUser } from "@/lib/auth";
import { AdminDashboard } from "@/components/AdminDashboard";

export default async function AdminPage() {
  const user = await getSessionUser();
  if (!user) {
    return <main className="route-page"><section className="page-shell"><h1>Admin access</h1><p>Log in with an administrator account to continue.</p><Link className="button button-primary" href="/login?next=/admin">Log in</Link></section></main>;
  }
  if (user.role !== "ADMIN") forbidden();
  return <AdminDashboard />;
}
