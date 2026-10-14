"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { console.error("Root application failure.", error); }, [error]);
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: "15vh 24px", color: "#252338", fontFamily: "Arial, sans-serif", textAlign: "center" }}>
        <h1>NIAR One hit an unexpected error.</h1>
        <p>Please try again. If the problem continues, review the application logs.</p>
        <button onClick={() => reset()} style={{ padding: "12px 20px", cursor: "pointer" }} type="button">Try again</button>
      </body>
    </html>
  );
}
