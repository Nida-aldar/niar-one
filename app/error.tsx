"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { console.error("Application route failed.", error); }, [error]);
  return (
    <main className="route-page"><section className="page-shell error-page">
      <span className="eyebrow"><span className="eyebrow-dot" /> Something went wrong</span>
      <h1>This page couldn’t load.</h1><p>Please retry. If it keeps happening, contact NIAR One support.</p>
      <div className="form-actions"><button className="button button-primary" onClick={() => reset()} type="button">Try again</button><Link className="button button-outline" href="/">Go home</Link></div>
    </section></main>
  );
}
