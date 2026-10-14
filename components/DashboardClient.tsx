"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, CheckSquare, Layers3, Settings2, Sparkles } from "lucide-react";
import { apiRequest } from "@/components/JsonForm";
import { Notice } from "@/components/Notice";

type DashboardData = {
  user: { name: string; email: string; role: string };
  stats: { notes: number; tasks: number; completedTasks: number; flashcards: number };
  recentUsage: { id: string; tool: string; createdAt: string }[];
};
const FAVORITES_KEY = "niar-favorite-tools";
const RECENT_KEY = "niar-recent-tools";

export function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentTools, setRecentTools] = useState<string[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiRequest<DashboardData>("/api/dashboard").then(setData).catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : "Dashboard could not load.");
    });
    try {
      const storedFavorites = JSON.parse(localStorage.getItem(FAVORITES_KEY) || "[]") as string[];
      const storedRecent = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]") as string[];
      Promise.resolve().then(() => { setFavorites(storedFavorites); setRecentTools(storedRecent); });
    } catch {
      localStorage.removeItem(FAVORITES_KEY);
      localStorage.removeItem(RECENT_KEY);
    }
  }, []);

  return (
    <main className="route-page"><section className="page-shell">
      <div className="dashboard-heading">
        <div><span className="eyebrow"><span className="eyebrow-dot" /> Your personal workspace</span><h1>{data ? `Welcome back, ${data.user.name}.` : "Your dashboard"}</h1><p>Real account data from your NIAR One workspace.</p></div>
        <Link className="button button-outline" href="/settings"><Settings2 size={16} /> Account settings</Link>
      </div>
      {error && <Notice kind="error">{error}</Notice>}
      {!data && !error && <div aria-label="Loading dashboard" className="loading-block">Loading your account data…</div>}
      {data && <>
        <div className="metric-grid">
          <article className="metric-card"><BookOpen /><strong>{data.stats.notes}</strong><span>Saved notes</span></article>
          <article className="metric-card"><CheckSquare /><strong>{data.stats.completedTasks}/{data.stats.tasks}</strong><span>Tasks completed</span></article>
          <article className="metric-card"><Layers3 /><strong>{data.stats.flashcards}</strong><span>Flashcards</span></article>
          <article className="metric-card"><Sparkles /><strong>{data.recentUsage.length}</strong><span>Recent tool runs</span></article>
        </div>
        <div className="dashboard-columns">
          <section className="panel"><div className="panel-title"><h2>Recently used tools</h2><Link href="/tools">Browse tools <ArrowRight size={14} /></Link></div>
            {data.recentUsage.length ? <ul className="activity-list">{data.recentUsage.map((entry) => <li key={entry.id}><span>{entry.tool}</span><time dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString()}</time></li>)}</ul> : <p className="empty-state">Your account has no tool activity yet. Data Lab and Study activity are saved here after sign-in.</p>}
            {recentTools.length > 0 && <p className="muted-small">Recently opened on this device: {recentTools.join(", ")}</p>}
          </section>
          <section className="panel"><div className="panel-title"><h2>Your shortcuts</h2></div>
            {favorites.length ? <ul className="shortcut-list">{favorites.map((item) => <li key={item}><Link href={item === "Data Lab" ? "/data-lab" : item === "Study Zone" ? "/study" : item === "AI Studio" ? "/ai" : "/tools"}>{item}<ArrowRight size={14} /></Link></li>)}</ul> : <p className="empty-state">No favorites saved on this device yet. Add some from the <Link href="/tools">tools directory</Link>.</p>}
            <Link className="button button-primary" href="/study">Open Study Zone <ArrowRight size={15} /></Link>
          </section>
        </div>
      </>}
    </section></main>
  );
}
