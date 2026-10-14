"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight, Bot, Copy, LoaderCircle, Sparkles } from "lucide-react";
import Link from "next/link";
import { apiRequest } from "@/components/JsonForm";
import { PageIntro } from "@/components/PageIntro";
import { Notice } from "@/components/Notice";

type Tool = "chat" | "summarize" | "email" | "rewrite" | "ideas" | "notes";
type Message = { role: "user" | "assistant"; content: string };
const tools: { id: Tool; label: string; prompt: string }[] = [
  { id: "chat", label: "AI chat", prompt: "Ask a question, work through an idea, or get help with a task…" },
  { id: "summarize", label: "Summarizer", prompt: "Paste the text you want summarized…" },
  { id: "email", label: "Email writer", prompt: "Tell us who you are writing to, what you need to say, and the tone…" },
  { id: "rewrite", label: "Rewriter", prompt: "Paste text you want rewritten for clarity…" },
  { id: "ideas", label: "Idea generator", prompt: "Describe a challenge, project, or topic…" },
  { id: "notes", label: "Study notes", prompt: "Paste learning material to turn into study notes…" },
];

export function AIWorkspace() {
  const [active, setActive] = useState<Tool>("chat");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [output, setOutput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    apiRequest<{ aiConfigured: boolean }>("/api/status").then((status) => setAiConfigured(status.aiConfigured)).catch(() => setAiConfigured(false));
    apiRequest<{ user: unknown }>("/api/auth/session").then(({ user }) => setLoggedIn(Boolean(user))).catch(() => setLoggedIn(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setOutput(""); setPending(true);
    const prompt = input.trim();
    if (!prompt) { setPending(false); return; }
    if (active === "chat") setMessages((current) => [...current, { role: "user", content: prompt }]);
    try {
      const result = await apiRequest<{ text: string }>("/api/ai", {
        method: "POST",
        body: JSON.stringify({
          tool: active,
          input: prompt,
          history: active === "chat" ? messages.slice(-10) : [],
        }),
      });
      setOutput(result.text);
      if (active === "chat") setMessages((current) => [...current, { role: "assistant", content: result.text }]);
      setInput("");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "The AI request failed.";
      setError(message);
      if (active === "chat") setMessages((current) => [...current, { role: "assistant", content: `Request failed: ${message}` }]);
    } finally { setPending(false); }
  }

  async function saveAsNote() {
    try {
      await apiRequest("/api/study", {
        method: "POST",
        body: JSON.stringify({ type: "NOTE", title: `NIAR AI ${active} result`, content: output }),
      });
      setError("");
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Note could not be saved."); }
  }

  const activeTool = tools.find(({ id }) => id === active)!;
  return (
    <main className="route-page"><section className="page-shell ai-shell">
      <PageIntro eyebrow="NIAR AI · server-side provider" title={<>A little help<br /><span>goes a long way.</span></>} description="Choose a focused AI tool. Requests are sent only to the server-configured AI provider; responses are never simulated." />
      {aiConfigured === false && <Notice>AI is not configured yet. Add AI_API_KEY (and optionally AI_API_URL and AI_MODEL) to the server environment to enable real generation. No demo answer is shown.</Notice>}
      {error && <Notice kind="error">{error}</Notice>}
      <div className="ai-layout">
        <nav aria-label="AI tools" className="panel ai-tool-nav">{tools.map((tool) => <button aria-current={active === tool.id ? "true" : undefined} className={active === tool.id ? "ai-tool active" : "ai-tool"} key={tool.id} onClick={() => { setActive(tool.id); setOutput(""); setError(""); }} type="button"><Sparkles size={15} />{tool.label}</button>)}</nav>
        <section aria-label={activeTool.label} className="panel ai-conversation">
          <div className="ai-conversation-title"><div className="tool-icon"><Bot size={19} /></div><div><h2>{activeTool.label}</h2><p>Responses use your configured AI provider</p></div><span className={aiConfigured ? "status-dot status-on" : "status-dot"}>{aiConfigured ? "Connected" : "Not configured"}</span></div>
          <div aria-live="polite" className="ai-message-list">
            {active === "chat" && !messages.length && <div className="ai-empty"><Sparkles size={23} /><h3>What would you like to work through?</h3><p>Ask a question or share an idea to begin. Your conversation is not stored by NIAR One.</p></div>}
            {active === "chat" && messages.map((message, index) => <article className={`chat-message ${message.role}`} key={`${index}-${message.role}`}><strong>{message.role === "user" ? "You" : "NIAR AI"}</strong><p>{message.content}</p></article>)}
            {active !== "chat" && !output && <div className="ai-empty"><Sparkles size={23} /><h3>{activeTool.label}</h3><p>Your response will appear here after the provider completes a request.</p></div>}
            {output && active !== "chat" && <article className="ai-output"><div className="panel-title"><h3>Generated with your configured AI provider</h3><button aria-label="Copy response" className="icon-button" onClick={() => void navigator.clipboard.writeText(output)} type="button"><Copy size={15} /></button></div><pre>{output}</pre>{loggedIn && <button className="button button-outline button-tiny" onClick={() => void saveAsNote()} type="button">Save to Study notes</button>}</article>}
            {pending && <p className="ai-pending"><LoaderCircle size={16} />Waiting for the configured AI service…</p>}
          </div>
          <form className="ai-prompt" onSubmit={submit}><label htmlFor="ai-input">{active === "chat" ? "Message NIAR AI" : `Input for ${activeTool.label}`}</label><textarea id="ai-input" maxLength={12000} onChange={(event) => setInput(event.target.value)} placeholder={activeTool.prompt} required rows={active === "chat" ? 3 : 6} value={input} /><div className="ai-prompt-footer"><span>{input.length.toLocaleString()} / 12,000 characters</span><button className="button button-primary" disabled={pending || !input.trim() || aiConfigured === false} type="submit">{pending ? "Working…" : "Generate"} <ArrowRight size={15} /></button></div></form>
        </section>
      </div>
      <p className="tool-privacy-note">Do not enter sensitive personal or confidential information. <Link href="/contact">Questions about AI configuration? Contact us.</Link></p>
    </section></main>
  );
}
