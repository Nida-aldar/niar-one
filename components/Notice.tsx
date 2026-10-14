import type { ReactNode } from "react";

export function Notice({
  kind = "info",
  children,
}: {
  kind?: "info" | "success" | "error";
  children: ReactNode;
}) {
  return <p aria-live="polite" className={`notice notice-${kind}`} role={kind === "error" ? "alert" : "status"}>{children}</p>;
}
