"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Notice } from "@/components/Notice";

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...init?.headers },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => ({})) as { error?: string } & T;
  if (!response.ok) throw new Error(payload.error || `Request failed (${response.status}).`);
  return payload;
}

export function SubmitButton({
  pending,
  children,
}: {
  pending: boolean;
  children: ReactNode;
}) {
  return <button className="button button-primary" disabled={pending} type="submit">{pending ? "Please wait…" : children}</button>;
}

export function AsyncForm({
  action,
  successMessage,
  className,
  children,
  onSuccess,
}: {
  action: (formData: FormData) => Promise<string | void>;
  successMessage?: string;
  className?: string;
  children: (pending: boolean) => ReactNode;
  onSuccess?: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setError("");
    try {
      const result = await action(new FormData(event.currentTarget));
      setMessage(result || successMessage || "Saved.");
      onSuccess?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "The request failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form className={className} onSubmit={handleSubmit}>
      {children(pending)}
      {error && <Notice kind="error">{error}</Notice>}
      {message && <Notice kind="success">{message}</Notice>}
    </form>
  );
}
