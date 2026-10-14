"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import type { ReactNode } from "react";
import { Notice } from "@/components/Notice";
import { apiRequest } from "@/components/JsonForm";

function useSubmit() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  return { pending, setPending, error, setError, success, setSuccess };
}

function AuthPanel({ children }: { children: ReactNode }) {
  return <main className="auth-page"><section className="auth-card">{children}</section></main>;
}

export function LoginForm({ returnTo = "/dashboard" }: { returnTo?: string }) {
  const router = useRouter();
  const state = useSubmit();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    state.setPending(true); state.setError("");
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest("/api/auth/login", { method: "POST", body: JSON.stringify({
        email: form.get("email"), password: form.get("password"),
      }) });
      router.replace(returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/dashboard");
      router.refresh();
    } catch (error) {
      state.setError(error instanceof Error ? error.message : "Login failed.");
    } finally { state.setPending(false); }
  }
  return (
    <AuthPanel>
      <span className="eyebrow"><span className="eyebrow-dot" /> Welcome back</span>
      <h1>Log in to NIAR One</h1>
      <p className="auth-lede">Pick up where your ideas left off.</p>
      <form className="form-stack" onSubmit={submit}>
        <label>Email address<input autoComplete="email" name="email" required type="email" /></label>
        <label>Password<input autoComplete="current-password" name="password" required type="password" /></label>
        {state.error && <Notice kind="error">{state.error}</Notice>}
        <button className="button button-primary" disabled={state.pending} type="submit">{state.pending ? "Signing in…" : "Log in"}</button>
      </form>
      <div className="auth-links"><Link href="/forgot-password">Forgot password?</Link><span>New here? <Link href="/signup">Create an account</Link></span></div>
    </AuthPanel>
  );
}

export function SignupForm() {
  const router = useRouter();
  const state = useSubmit();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    state.setPending(true); state.setError("");
    const form = new FormData(event.currentTarget);
    try {
      await apiRequest("/api/auth/signup", { method: "POST", body: JSON.stringify({
        name: form.get("name"), email: form.get("email"), password: form.get("password"),
      }) });
      router.replace("/dashboard"); router.refresh();
    } catch (error) {
      state.setError(error instanceof Error ? error.message : "Sign-up failed.");
    } finally { state.setPending(false); }
  }
  return (
    <AuthPanel>
      <span className="eyebrow"><span className="eyebrow-dot" /> Make it yours</span>
      <h1>Create your account</h1>
      <p className="auth-lede">A secure account keeps your study work saved across sessions.</p>
      <form className="form-stack" onSubmit={submit}>
        <label>Your name<input autoComplete="name" maxLength={80} name="name" required /></label>
        <label>Email address<input autoComplete="email" name="email" required type="email" /></label>
        <label>Password<input autoComplete="new-password" minLength={12} name="password" required type="password" /><small>Use at least 12 characters.</small></label>
        {state.error && <Notice kind="error">{state.error}</Notice>}
        <button className="button button-primary" disabled={state.pending} type="submit">{state.pending ? "Creating account…" : "Create account"}</button>
      </form>
      <p className="auth-footnote">Passwords are hashed before storage. By continuing, you agree to use this preview responsibly.</p>
      <div className="auth-links"><span>Already registered? <Link href="/login">Log in</Link></span></div>
    </AuthPanel>
  );
}

export function ForgotPasswordForm() {
  const state = useSubmit();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); state.setPending(true); state.setError(""); state.setSuccess("");
    const email = new FormData(event.currentTarget).get("email");
    try {
      const result = await apiRequest<{ message: string }>("/api/auth/password-reset/request", {
        method: "POST", body: JSON.stringify({ email }),
      });
      state.setSuccess(result.message);
    } catch (error) {
      state.setError(error instanceof Error ? error.message : "Reset request failed.");
    } finally { state.setPending(false); }
  }
  return (
    <AuthPanel>
      <span className="eyebrow"><span className="eyebrow-dot" /> Account recovery</span>
      <h1>Reset your password</h1>
      <p className="auth-lede">We’ll send a one-time reset link if the mail service is configured.</p>
      <form className="form-stack" onSubmit={submit}>
        <label>Email address<input autoComplete="email" name="email" required type="email" /></label>
        {state.error && <Notice kind="error">{state.error}</Notice>}
        {state.success && <Notice kind="success">{state.success}</Notice>}
        <button className="button button-primary" disabled={state.pending} type="submit">{state.pending ? "Sending…" : "Send reset link"}</button>
      </form>
      <div className="auth-links"><Link href="/login">Back to login</Link></div>
    </AuthPanel>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const state = useSubmit();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); state.setPending(true); state.setError("");
    const password = new FormData(event.currentTarget).get("password");
    try {
      await apiRequest("/api/auth/password-reset/confirm", {
        method: "POST", body: JSON.stringify({ token, password }),
      });
      router.replace("/login?reset=success"); router.refresh();
    } catch (error) {
      state.setError(error instanceof Error ? error.message : "Password reset failed.");
    } finally { state.setPending(false); }
  }
  return (
    <AuthPanel>
      <span className="eyebrow"><span className="eyebrow-dot" /> Account recovery</span>
      <h1>Choose a new password</h1>
      {!token && <Notice kind="error">This reset link is missing its token. Request a new link.</Notice>}
      <form className="form-stack" onSubmit={submit}>
        <label>New password<input autoComplete="new-password" minLength={12} name="password" required type="password" /></label>
        <small>Use at least 12 characters.</small>
        {state.error && <Notice kind="error">{state.error}</Notice>}
        <button className="button button-primary" disabled={state.pending || !token} type="submit">{state.pending ? "Updating…" : "Update password"}</button>
      </form>
    </AuthPanel>
  );
}
