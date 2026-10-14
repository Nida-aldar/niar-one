import Link from "next/link";
import { ArrowLeft, Search } from "lucide-react";

export default function NotFound() {
  return (
    <main className="route-page"><section className="page-shell error-page">
      <span className="error-code">404</span><Search size={24} /><h1>That page isn’t here.</h1>
      <p>The link may be outdated, or this page may have moved.</p>
      <Link className="button button-primary" href="/"><ArrowLeft size={15} />Back to NIAR One</Link>
    </section></main>
  );
}
