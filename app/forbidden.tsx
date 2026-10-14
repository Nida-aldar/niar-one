import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="route-page"><section className="page-shell error-page">
      <span className="error-code">403</span><h1>Administrator access required.</h1>
      <p>Your account cannot access this area. No administrator information was loaded.</p>
      <Link className="button button-outline" href="/dashboard">Return to dashboard</Link>
    </section></main>
  );
}
