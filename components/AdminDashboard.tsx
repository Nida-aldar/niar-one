"use client";

import { useEffect, useState } from "react";
import { apiRequest } from "@/components/JsonForm";
import { Notice } from "@/components/Notice";

type AdminData = {
  users: { id: string; name: string; email: string; role: "USER" | "ADMIN"; createdAt: string; _count: { studyItems: number } }[];
  stats: { userCount: number; studyItems: number; recentUsage: number };
  recentUsage: { id: string; tool: string; createdAt: string; user: { email: string } | null }[];
  recentContacts: { id: string; name: string; email: string; subject: string; message: string; createdAt: string }[];
};

export function AdminDashboard() {
  const [data, setData] = useState<AdminData | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadingId, setLoadingId] = useState("");
  async function load() {
    try { setData(await apiRequest<AdminData>("/api/admin")); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Admin data failed to load."); }
  }
  useEffect(() => { Promise.resolve().then(() => load()); }, []);
  async function updateRole(userId: string, role: "USER" | "ADMIN") {
    setError(""); setNotice(""); setLoadingId(userId);
    try {
      await apiRequest("/api/admin", { method: "PATCH", body: JSON.stringify({ userId, role }) });
      setNotice("User role updated."); await load();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Role update failed."); }
    finally { setLoadingId(""); }
  }
  return (
    <main className="route-page"><section className="page-shell">
      <span className="eyebrow"><span className="eyebrow-dot" /> Restricted administration</span><h1>Admin dashboard</h1><p className="page-lede">User and usage data are visible only to authorized administrators.</p>
      {error && <Notice kind="error">{error}</Notice>}{notice && <Notice kind="success">{notice}</Notice>}
      {!data && !error && <div className="loading-block">Loading admin data…</div>}
      {data && <>
        <div className="metric-grid admin-metrics"><article className="metric-card"><strong>{data.stats.userCount}</strong><span>Accounts</span></article><article className="metric-card"><strong>{data.stats.studyItems}</strong><span>Saved study items</span></article><article className="metric-card"><strong>{data.stats.recentUsage}</strong><span>Latest tool events</span></article></div>
        <section className="panel admin-panel"><h2>User management</h2><div className="table-scroll"><table><thead><tr><th>User</th><th>Role</th><th>Study items</th><th>Joined</th><th>Access</th></tr></thead><tbody>
          {data.users.map((user) => <tr key={user.id}><td><strong>{user.name}</strong><small>{user.email}</small></td><td>{user.role}</td><td>{user._count.studyItems}</td><td>{new Date(user.createdAt).toLocaleDateString()}</td><td><button className="button button-outline button-tiny" disabled={loadingId === user.id} onClick={() => updateRole(user.id, user.role === "ADMIN" ? "USER" : "ADMIN")} type="button">{loadingId === user.id ? "Saving…" : user.role === "ADMIN" ? "Remove admin" : "Make admin"}</button></td></tr>)}
        </tbody></table></div><p className="muted-small">User lists are limited to the latest 100 accounts.</p></section>
        <section className="dashboard-columns"><div className="panel"><h2>Recent tool usage</h2>{data.recentUsage.length ? <ul className="activity-list">{data.recentUsage.map((event) => <li key={event.id}><span>{event.tool} · {event.user?.email ?? "Guest"}</span><time>{new Date(event.createdAt).toLocaleString()}</time></li>)}</ul> : <p className="empty-state">No usage events yet.</p>}</div>
        <div className="panel"><h2>Contact inbox</h2>{data.recentContacts.length ? <div className="contact-inbox">{data.recentContacts.map((message) => <article key={message.id}><strong>{message.subject}</strong><small>{message.name} · {message.email} · {new Date(message.createdAt).toLocaleDateString()}</small><p>{message.message}</p></article>)}</div> : <p className="empty-state">No messages received yet.</p>}</div></section>
        <Notice kind="info">Plan and tool catalog management and billing are not configured in this release. No payment or subscription data is fabricated.</Notice>
      </>}
    </section></main>
  );
}
