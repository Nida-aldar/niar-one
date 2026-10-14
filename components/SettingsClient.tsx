"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { apiRequest } from "@/components/JsonForm";
import { Notice } from "@/components/Notice";

type Profile = { id: string; name: string; email: string; role: string; createdAt: string };
export function SettingsClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    apiRequest<{ user: Profile }>("/api/account").then(({ user }) => setProfile(user)).catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : "Account details could not be loaded.");
    });
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!profile) return;
    setPending(true); setError(""); setMessage("");
    try {
      const result = await apiRequest<{ user: Profile }>("/api/account", {
        method: "PATCH", body: JSON.stringify({ name: new FormData(event.currentTarget).get("name") }),
      });
      setProfile(result.user); setMessage("Your profile was updated.");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Profile update failed."); }
    finally { setPending(false); }
  }

  async function logout() {
    setPending(true); setError("");
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
      window.location.assign("/");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Could not log out."); }
    finally { setPending(false); }
  }

  return (
    <main className="route-page"><section className="page-shell">
      <span className="eyebrow"><span className="eyebrow-dot" /> Account</span><h1>Settings</h1><p className="page-lede">Manage your NIAR One profile and sign-in session.</p>
      {error && <Notice kind="error">{error}</Notice>}{message && <Notice kind="success">{message}</Notice>}
      {!profile && !error && <div className="loading-block">Loading account settings…</div>}
      {profile && <div className="settings-grid">
        <form className="panel form-stack" onSubmit={save}>
          <h2>Profile details</h2>
          <label>Display name<input autoComplete="name" maxLength={80} name="name" required defaultValue={profile.name} /></label>
          <label>Email address<input disabled type="email" value={profile.email} /><small>Email changes are disabled to protect account recovery.</small></label>
          <p className="muted-small">Account role: {profile.role.toLowerCase()} · joined {new Date(profile.createdAt).toLocaleDateString()}</p>
          <button className="button button-primary" disabled={pending} type="submit">{pending ? "Saving…" : "Save profile"}</button>
        </form>
        <section className="panel form-stack"><h2>Security &amp; access</h2><p>Password changes are managed through the password reset flow.</p><Link className="button button-outline" href="/forgot-password">Request password reset</Link><button className="button button-danger" disabled={pending} onClick={logout} type="button">{pending ? "Working…" : "Log out"}</button></section>
      </div>}
    </section></main>
  );
}
