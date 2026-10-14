"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { BookOpen, CalendarClock, Check, ChevronRight, CircleHelp, FileText, Layers3, Plus, Save, Trash2 } from "lucide-react";
import { apiRequest } from "@/components/JsonForm";
import { Notice } from "@/components/Notice";

type ItemType = "NOTE" | "TASK" | "FLASHCARD";
type StudyItem = { id: string; type: ItemType; title: string; content: string; dueAt: string | null; completed: boolean; updatedAt: string };
type Tab = "NOTE" | "TASK" | "FLASHCARD" | "QUIZ" | "PLANNER";
const tabs: { id: Tab; label: string; icon: typeof BookOpen }[] = [
  { id: "NOTE", label: "Notes", icon: FileText },
  { id: "TASK", label: "Tasks", icon: Check },
  { id: "FLASHCARD", label: "Flashcards", icon: Layers3 },
  { id: "QUIZ", label: "Quiz", icon: CircleHelp },
  { id: "PLANNER", label: "Planner", icon: CalendarClock },
];

export function StudyWorkspace() {
  const [items, setItems] = useState<StudyItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("NOTE");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<StudyItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [revealed, setRevealed] = useState<string[]>([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswer, setQuizAnswer] = useState<string | null>(null);
  const usageTracked = useRef(false);

  const reload = useCallback(async () => {
    try {
      const result = await apiRequest<{ items: StudyItem[] }>("/api/study");
      setItems(result.items);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Study data could not be loaded.");
    } finally { setLoading(false); }
  }, []);
  useEffect(() => {
    Promise.resolve().then(() => reload());
  }, [reload]);
  useEffect(() => {
    if (usageTracked.current) return;
    usageTracked.current = true;
    void apiRequest("/api/usage", { method: "POST", body: JSON.stringify({ tool: "study" }) }).catch((caught: unknown) => {
      setError(caught instanceof Error ? `Study usage could not be recorded: ${caught.message}` : "Study usage could not be recorded.");
    });
  }, []);

  const visibleItems = useMemo(
    () => items.filter((item) => item.type === activeTab),
    [items, activeTab],
  );
  const flashcards = useMemo(() => items.filter((item) => item.type === "FLASHCARD"), [items]);
  const tasks = useMemo(() => items.filter((item) => item.type === "TASK"), [items]);

  function startEdit(item: StudyItem) {
    setEditing(item); setShowForm(true); setMessage(""); setError("");
  }
  function startCreate() {
    setEditing(null); setShowForm(true); setMessage(""); setError("");
  }

  async function submitItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setMessage("");
    const form = new FormData(event.currentTarget);
    const dueAt = String(form.get("dueAt") || "");
    const payload = {
      type: activeTab as ItemType,
      title: String(form.get("title") || ""),
      content: String(form.get("content") || ""),
      dueAt: dueAt ? new Date(dueAt).toISOString() : null,
    };
    try {
      if (editing) {
        await apiRequest(`/api/study/${encodeURIComponent(editing.id)}`, { method: "PATCH", body: JSON.stringify(payload) });
        setMessage("Your changes were saved.");
      } else {
        await apiRequest("/api/study", { method: "POST", body: JSON.stringify(payload) });
        setMessage("Your study item was saved.");
      }
      setShowForm(false); setEditing(null); await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Study item could not be saved.");
    } finally { setSaving(false); }
  }

  async function removeItem(item: StudyItem) {
    if (!window.confirm(`Delete “${item.title}”? This cannot be undone.`)) return;
    try {
      await apiRequest(`/api/study/${encodeURIComponent(item.id)}`, { method: "DELETE" });
      setItems((current) => current.filter(({ id }) => id !== item.id));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Study item could not be deleted.");
    }
  }

  async function toggleTask(item: StudyItem) {
    try {
      const result = await apiRequest<{ item: StudyItem }>(`/api/study/${encodeURIComponent(item.id)}`, {
        method: "PATCH", body: JSON.stringify({ completed: !item.completed }),
      });
      setItems((current) => current.map((entry) => entry.id === item.id ? result.item : entry));
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Task could not be updated."); }
  }

  function toggleFlashcard(id: string) {
    setRevealed((current) => current.includes(id) ? current.filter((itemId) => itemId !== id) : [...current, id]);
  }

  const quizCard = flashcards[quizIndex % Math.max(flashcards.length, 1)];
  const quizOptions = useMemo(() => {
    if (!quizCard) return [];
    const wrongAnswers = flashcards.filter(({ id }) => id !== quizCard.id).map(({ content }) => content).filter(Boolean);
    return [quizCard.content, ...wrongAnswers].slice(0, 4).sort((a, b) => a.localeCompare(b));
  }, [flashcards, quizCard]);

  return (
    <main className="route-page"><section className="page-shell">
      <div className="dashboard-heading">
        <div><span className="eyebrow"><span className="eyebrow-dot" /> NIAR Study</span><h1>Your study space.</h1><p>Notes, tasks, flashcards, quick quizzes, and a clear planner—saved to your account.</p></div>
        <button className="button button-primary" onClick={startCreate} type="button"><Plus size={16} /> New {activeTab === "NOTE" ? "note" : activeTab === "TASK" ? "task" : activeTab === "FLASHCARD" ? "flashcard" : "item"}</button>
      </div>
      <div className="study-tabs" role="tablist" aria-label="Study tools">
        {tabs.map(({ id, label, icon: Icon }) => <button aria-selected={activeTab === id} className={activeTab === id ? "study-tab active" : "study-tab"} key={id} onClick={() => { setActiveTab(id); setShowForm(false); setMessage(""); }} role="tab" type="button"><Icon size={16} />{label}{id === "TASK" && <span>{tasks.filter(({ completed }) => !completed).length}</span>}</button>)}
      </div>
      {error && <Notice kind="error">{error}</Notice>}{message && <Notice kind="success">{message}</Notice>}
      {showForm && (activeTab === "NOTE" || activeTab === "TASK" || activeTab === "FLASHCARD") && <form className="panel study-form" onSubmit={submitItem}>
        <h2>{editing ? "Edit" : "Create"} {activeTab === "NOTE" ? "note" : activeTab === "TASK" ? "task" : "flashcard"}</h2>
        <label>{activeTab === "FLASHCARD" ? "Question / front" : "Title"}<input autoFocus maxLength={160} name="title" required defaultValue={editing?.title} /></label>
        <label>{activeTab === "FLASHCARD" ? "Answer / back" : activeTab === "NOTE" ? "Your notes" : "Details (optional)"}<textarea maxLength={20000} name="content" required={activeTab === "FLASHCARD"} rows={activeTab === "NOTE" ? 6 : 3} defaultValue={editing?.content} /></label>
        {activeTab === "TASK" && <label>Due date<input name="dueAt" type="datetime-local" defaultValue={editing?.dueAt ? new Date(editing.dueAt).toISOString().slice(0, 16) : ""} /></label>}
        <div className="form-actions"><button className="button button-primary" disabled={saving} type="submit"><Save size={15} />{saving ? "Saving…" : "Save"}</button><button className="button button-outline" onClick={() => { setShowForm(false); setEditing(null); }} type="button">Cancel</button></div>
      </form>}
      {loading ? <div className="loading-block">Loading your study space…</div> : <>
        {activeTab === "PLANNER" && <Planner tasks={tasks} onToggle={toggleTask} />}
        {activeTab === "QUIZ" && <section className="panel quiz-panel">
          <h2>Flashcard quiz</h2>
          {!quizCard ? <p className="empty-state">Create at least one flashcard to start a quiz.</p> : <>
            <p className="muted-small">Card {quizIndex + 1} of {flashcards.length} · pick the matching answer</p><h3>{quizCard.title}</h3>
            <div className="quiz-options">{quizOptions.map((option, index) => <button className={quizAnswer === option ? (option === quizCard.content ? "quiz-option correct" : "quiz-option incorrect") : "quiz-option"} disabled={quizAnswer !== null} key={`${quizCard.id}-${index}`} onClick={() => setQuizAnswer(option)} type="button">{option || "No answer entered"}</button>)}</div>
            {quizAnswer && <Notice kind={quizAnswer === quizCard.content ? "success" : "error"}>{quizAnswer === quizCard.content ? "Correct!" : "Not quite—review the flashcard and try the next one."}</Notice>}
            <button className="button button-outline" onClick={() => { setQuizIndex((current) => (current + 1) % flashcards.length); setQuizAnswer(null); }} type="button">Next question <ChevronRight size={15} /></button>
          </>}
        </section>}
        {(activeTab === "NOTE" || activeTab === "FLASHCARD") && <div className="study-card-grid">
          {visibleItems.map((item) => <article className="panel study-item-card" key={item.id}>
            {activeTab === "FLASHCARD" ? <><span className="eyebrow">QUESTION</span><h3>{item.title}</h3>{revealed.includes(item.id) ? <div className="flashcard-answer"><span>ANSWER</span><p>{item.content || "No answer saved."}</p></div> : <button className="button button-outline" onClick={() => toggleFlashcard(item.id)} type="button">Reveal answer</button>}{revealed.includes(item.id) && <button className="button button-outline" onClick={() => toggleFlashcard(item.id)} type="button">Hide answer</button>}</> : <><h3>{item.title}</h3><p className="study-item-content">{item.content || "No note content."}</p><small>Updated {new Date(item.updatedAt).toLocaleString()}</small></>}
            <div className="item-actions"><button onClick={() => startEdit(item)} type="button">Edit</button><button aria-label={`Delete ${item.title}`} onClick={() => void removeItem(item)} type="button"><Trash2 size={15} /></button></div>
          </article>)}
          {!visibleItems.length && <div className="panel empty-state">Nothing saved here yet. Use “New” to create your first {activeTab === "NOTE" ? "note" : "flashcard"}.</div>}
        </div>}
        {activeTab === "TASK" && <div className="panel task-list">
          {visibleItems.map((item) => <div className={`task-row${item.completed ? " task-completed" : ""}`} key={item.id}>
            <button aria-label={item.completed ? `Mark ${item.title} incomplete` : `Complete ${item.title}`} className="task-check" onClick={() => void toggleTask(item)} type="button">{item.completed && <Check size={14} />}</button>
            <div><strong>{item.title}</strong>{item.content && <p>{item.content}</p>}{item.dueAt && <small>Due {new Date(item.dueAt).toLocaleString()}</small>}</div>
            <button aria-label={`Edit ${item.title}`} onClick={() => startEdit(item)} type="button">Edit</button><button aria-label={`Delete ${item.title}`} onClick={() => void removeItem(item)} type="button"><Trash2 size={15} /></button>
          </div>)}
          {!visibleItems.length && <p className="empty-state">No assignments yet. Add a task and optionally set its due date.</p>}
        </div>}
      </>}
    </section></main>
  );
}

function Planner({ tasks, onToggle }: { tasks: StudyItem[]; onToggle: (item: StudyItem) => void }) {
  const grouped = useMemo(() => {
    const groups = new Map<string, StudyItem[]>();
    for (const task of tasks) {
      const key = task.dueAt ? new Date(task.dueAt).toLocaleDateString() : "No due date";
      groups.set(key, [...(groups.get(key) ?? []), task]);
    }
    return [...groups.entries()];
  }, [tasks]);
  return <div className="planner-list">
    {!tasks.length && <div className="panel empty-state">Add tasks with due dates to build your timetable.</div>}
    {grouped.map(([date, dayTasks]) => <section className="panel planner-day" key={date}><h2>{date}</h2>{dayTasks.map((task) => <label className="planner-row" key={task.id}><input checked={task.completed} onChange={() => onToggle(task)} type="checkbox" /><span className={task.completed ? "task-strike" : ""}>{task.title}</span>{task.dueAt && <time>{new Date(task.dueAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</time>}</label>)}</section>)}
  </div>;
}
