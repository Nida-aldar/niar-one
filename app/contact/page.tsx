"use client";

import { useState, type FormEvent } from "react";
import { PageIntro } from "@/components/PageIntro";
import { Notice } from "@/components/Notice";
import { apiRequest } from "@/components/JsonForm";

export default function ContactPage() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPending(true); setError(""); setSuccess("");
    const form = event.currentTarget;
    const formData = new FormData(form);
    try {
      const result = await apiRequest<{ message: string }>("/api/contact", {
        method: "POST",
        body: JSON.stringify(Object.fromEntries(formData.entries())),
      });
      setSuccess(result.message);
      form.reset();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Your message could not be sent.");
    } finally { setPending(false); }
  }
  return (
    <main className="route-page"><section className="page-shell">
      <PageIntro eyebrow="We’d like to hear from you" title={<>Say hello.<br /><span>We’re listening.</span></>} description="Send a question or share feedback. Your message is saved securely to the NIAR One inbox." />
      <form className="panel form-stack contact-form" onSubmit={submit}>
        <label>Your name<input autoComplete="name" maxLength={80} name="name" required /></label>
        <label>Email address<input autoComplete="email" maxLength={254} name="email" required type="email" /></label>
        <label>Subject<input maxLength={120} name="subject" required /></label>
        <label>Your message<textarea maxLength={5000} minLength={10} name="message" required rows={6} /></label>
        {error && <Notice kind="error">{error}</Notice>}{success && <Notice kind="success">{success}</Notice>}
        <button className="button button-primary" disabled={pending} type="submit">{pending ? "Sending…" : "Send message"}</button>
        <small>Messages are stored for follow-up and visible to authorized administrators.</small>
      </form>
    </section></main>
  );
}
