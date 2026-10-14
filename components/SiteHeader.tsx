"use client";

import { ArrowRight, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiRequest } from "@/components/JsonForm";
import { Notice } from "@/components/Notice";

const navItems = [
  ["Home", "/"],
  ["AI Tools", "/ai"],
  ["Study Zone", "/study"],
  ["Data Lab", "/data-lab"],
  ["Tools", "/tools"],
  ["Pricing", "/pricing"],
  ["About", "/about"],
  ["Contact", "/contact"],
] as const;

function Brand() {
  return (
    <Link className="brand" href="/" aria-label="NIAR One home">
      <span className="brand-mark" aria-hidden="true"><span /><span /><span /></span>
      <span className="brand-wordmark">NIAR<span>One</span></span>
    </Link>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; role: string } | null>(null);
  const [authError, setAuthError] = useState("");
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    apiRequest<{ user: { name: string; role: string } | null }>("/api/auth/session")
      .then(({ user: currentUser }) => { setUser(currentUser); setAuthError(""); })
      .catch((error: unknown) => {
        setAuthError(error instanceof Error ? "Account status could not be refreshed. Retry by reloading the page." : "Account status could not be refreshed.");
      });
  }, [pathname]);

  async function logout() {
    setAuthError("");
    try {
      await apiRequest("/api/auth/logout", { method: "POST" });
      setUser(null);
      setMenuOpen(false);
      router.push("/");
      router.refresh();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Could not log out.");
    }
  }

  return (
    <>
      <div className="announcement">
        <span className="announcement-dot" />
        The next generation of getting things done starts here.
        <Link href="/tools">Take a look <ArrowRight size={13} aria-hidden="true" /></Link>
      </div>
      <header className="site-header">
        <div className="nav-shell">
          <Brand />
          <button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="menu-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
          <nav aria-label="Main navigation" className={menuOpen ? "main-nav nav-open" : "main-nav"}>
            {navItems.map(([label, route]) => (
              <Link
                aria-current={pathname === route ? "page" : undefined}
                href={route}
                key={route}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
            {user && <Link href="/dashboard" onClick={() => setMenuOpen(false)}>Dashboard</Link>}
            {user && <Link href="/settings" onClick={() => setMenuOpen(false)}>Settings</Link>}
            {user?.role === "ADMIN" && <Link href="/admin" onClick={() => setMenuOpen(false)}>Admin</Link>}
            {user ? <button className="mobile-signin" onClick={() => void logout()} type="button">Log out</button> : <>
              <Link className="mobile-signin" href="/login" onClick={() => setMenuOpen(false)}>Log in</Link>
              <Link className="mobile-signup" href="/signup" onClick={() => setMenuOpen(false)}>Create account</Link>
            </>}
          </nav>
          <div className="nav-actions">
            {user ? <>
              <Link className="login-link" href="/dashboard">{user.name}</Link>
              <button className="button button-small button-light" onClick={() => void logout()} type="button">Log out</button>
            </> : <>
              <Link className="login-link" href="/login">Log in</Link>
              <Link className="button button-small button-light" href="/signup">Sign up <ArrowRight size={15} aria-hidden="true" /></Link>
            </>}
          </div>
        </div>
      </header>
      {authError && <div className="nav-error"><Notice kind="error">{authError}</Notice></div>}
    </>
  );
}
