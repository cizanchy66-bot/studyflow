'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User } from '@supabase/supabase-js';
import { BookOpen, Check, CheckCircle2, Circle, Clock3, LogOut, Plus, Search, Sparkles, Trash2, Pencil, X, CalendarDays, ListTodo, LayoutDashboard, Settings2, AlertCircle } from 'lucide-react';

type Priority = 'Low' | 'Medium' | 'High';
type Task = { id: string; title: string; subject: string; due_date: string | null; priority: Priority; completed: boolean; user_id?: string; created_at?: string };
const FILTERS = ['All tasks', 'Pending', 'Completed'] as const;


function niceDate(dateStr: string | null) {
  if (!dateStr) return 'No due date';
  const due = new Date(`${dateStr}T00:00:00`);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  if (due.getTime() === today.getTime()) return 'Today';
  if (due.getTime() === tomorrow.getTime()) return 'Tomorrow';
  if (due < today) return `${Math.ceil((today.getTime() - due.getTime()) / 86400000)}d overdue`;
  return due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function AuthPanel() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const submit = async (e: FormEvent) => {
    e.preventDefault(); if (!supabase) return;
    setBusy(true); setNotice('');
    const result = mode === 'login'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setBusy(false);
    if (result.error) setNotice(result.error.message);
    else if (mode === 'signup') setNotice('Account created! Check your email if confirmation is enabled, then sign in.');
  };
  return <main className="auth-wrap"><div className="auth-card">
    <div className="brand-mark"><BookOpen size={23} /></div><div className="eyebrow">YOUR PERSONAL STUDY SPACE</div>
    <h1>{mode === 'login' ? 'Welcome back.' : 'Start your flow.'}</h1><p className="auth-sub">A little more focus. A little less chaos.</p>
    <div className="auth-tabs"><button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setNotice('') }}>Log in</button><button className={mode === 'signup' ? 'active' : ''} onClick={() => { setMode('signup'); setNotice('') }}>Create account</button></div>
    <form onSubmit={submit} className="auth-form"><label>Email address<input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label><label>Password<input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" /></label><button className="primary full" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}</button></form>
    {notice && <p className="notice">{notice}</p>}<p className="auth-foot">By signing in, your tasks stay in your own account.</p>
  </div><div className="auth-decoration"><span className="orb orb1" /><span className="orb orb2" /><div className="floating-note"><Sparkles size={17} /><span>Small steps count, too.</span></div></div></main>;
}


export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<typeof FILTERS[number]>('All tasks');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoaded(false);
      if (!user || !supabase) { setTasks([]); setLoaded(true); return; }
      const { data, error: loadError } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
      if (!active) return;
      if (loadError) setError(loadError.message); else setTasks((data ?? []) as Task[]);
      setLoaded(true);
    }
    void load(); return () => { active = false; };
  }, [user]);

  const pending = tasks.filter(t => !t.completed).length;
  const completed = tasks.filter(t => t.completed).length;
  const percent = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
  const shown = useMemo(() => tasks.filter(t => {
    const match = `${t.title} ${t.subject}`.toLowerCase().includes(search.toLowerCase());
    const status = filter === 'All tasks' || (filter === 'Pending' && !t.completed) || (filter === 'Completed' && t.completed);
    return match && status;
  }), [tasks, search, filter]);

  function openNew() { setEditing(null); setTitle(''); setSubject(''); setDueDate(''); setPriority('Medium'); setModal(true); setError(''); }
  function openEdit(task: Task) { setEditing(task); setTitle(task.title); setSubject(task.subject); setDueDate(task.due_date ?? ''); setPriority(task.priority); setModal(true); setError(''); }
  async function saveTask(e: FormEvent) {
    e.preventDefault(); if (!supabase || !user) return;
    setSaving(true); setError('');
    const values = { title: title.trim(), subject: subject.trim() || 'General', due_date: dueDate || null, priority, completed: editing?.completed ?? false };
    const result = editing
      ? await supabase.from('tasks').update(values).eq('id', editing.id).select().single()
      : await supabase.from('tasks').insert({ ...values, user_id: user.id }).select().single();
    setSaving(false);
    if (result.error) { setError(result.error.message); return; }
    if (editing) setTasks(prev => prev.map(t => t.id === editing.id ? result.data as Task : t)); else setTasks(prev => [result.data as Task, ...prev]);
    setModal(false);
  }
  async function toggleTask(task: Task) {
    if (!supabase) return; const next = !task.completed;
    const { error: updateError } = await supabase.from('tasks').update({ completed: next }).eq('id', task.id);
    if (updateError) { setError(updateError.message); return; }
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, completed: next } : t));
  }
  async function deleteTask(task: Task) {
    if (!supabase) return;
    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', task.id);
    if (deleteError) { setError(deleteError.message); return; }
    setTasks(prev => prev.filter(t => t.id !== task.id));
  }
  async function logout() { await supabase?.auth.signOut(); setTasks([]); }

  if (!isSupabaseConfigured) return <main className="setup-screen"><div className="setup-card"><div className="brand-mark"><BookOpen /></div><h1>Almost ready to StudyFlow.</h1><p>Connect your Supabase project to get started. Copy <code>.env.example</code> to <code>.env.local</code> and add your project URL and publishable key, then restart the development server.</p><p className="setup-hint">See <strong>SETUP.md</strong> in the project folder for the step-by-step guide.</p></div></main>;
  if (!user) return <AuthPanel />;

  return <div className="app-shell">
    <aside className="sidebar"><div className="brand"><div className="brand-mark"><BookOpen size={21} /></div><span>studyflow</span></div><div className="side-label">WORKSPACE</div><button className="side-link selected"><LayoutDashboard size={17} /> Dashboard</button><button className="side-link" onClick={() => setFilter('All tasks')}><ListTodo size={17} /> My tasks</button><div className="side-bottom"><div className="side-label">YOUR PROGRESS</div><div className="side-progress"><div className="progress-track"><span style={{ width: `${percent}%` }} /></div><small>{percent}% completed</small></div><button className="side-link" onClick={logout}><LogOut size={17} /> Log out</button></div></aside>
    <main className="main-area"><header className="topbar"><span className="crumb">Workspace <span>/</span> Dashboard</span><div className="user-chip"><div className="avatar">{(user.email?.[0] || 'S').toUpperCase()}</div><span>{user.email}</span></div></header>
      <div className="content"><div className="welcome-row"><div><div className="eyebrow">YOUR SPACE, YOUR PACE</div><h1>Let&apos;s make today count.</h1><p className="welcome-sub">A clear mind starts with a clear plan.</p></div><button className="primary" onClick={openNew}><Plus size={17} /> New task</button></div>
        <section className="stats-grid"><div className="stat-card"><div className="stat-icon purple"><ListTodo size={19} /></div><div className="stat-label">Total tasks</div><div className="stat-number">{tasks.length}</div><div className="stat-note">in your workspace</div></div><div className="stat-card"><div className="stat-icon amber"><Clock3 size={19} /></div><div className="stat-label">To do</div><div className="stat-number">{pending}</div><div className="stat-note">still on your list</div></div><div className="stat-card"><div className="stat-icon green"><CheckCircle2 size={19} /></div><div className="stat-label">Completed</div><div className="stat-number">{completed}</div><div className="stat-note">tasks checked off</div></div><div className="stat-card progress-stat"><div className="stat-label">Your progress</div><div className="stat-number">{percent}<span>%</span></div><div className="progress-track"><span style={{ width: `${percent}%` }} /></div><div className="stat-note">keep the momentum going</div></div></section>
        <section className="focus-banner"><div className="banner-icon"><Sparkles size={18} /></div><div><strong>{pending ? 'One thing at a time.' : 'You’re all caught up!'}</strong><p>{pending ? 'Focus on what matters most. Progress beats perfection.' : 'Enjoy the breathing room—you’ve earned it.'}</p></div><div className="banner-doodle">✳</div></section>
        <section className="tasks-section"><div className="tasks-heading"><div><h2>Your tasks</h2><p>Keep track of the little things.</p></div><button className="outline-button" onClick={openNew}><Plus size={16} /> Add task</button></div><div className="task-controls"><div className="search-box"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks or subjects…" /></div><div className="filter-tabs">{FILTERS.map(f => <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>{f}{f === 'Pending' && <span className="tab-count">{pending}</span>}</button>)}</div></div>
          {error && <div className="inline-error"><AlertCircle size={15} />{error}<button onClick={() => setError('')} aria-label="Dismiss"><X size={14} /></button></div>}
          {!loaded ? <div className="loading">Loading your tasks…</div> : shown.length === 0 ? <div className="empty-state"><div className="empty-icon"><ListTodo size={22} /></div><h3>{search ? 'No matching tasks' : 'Nothing here yet'}</h3><p>{search ? 'Try a different search term.' : 'Add your first task and make a plan for your day.'}</p>{!search && <button className="primary" onClick={openNew}><Plus size={16} /> Create a task</button>}</div> : <div className="task-list">{shown.map(task => <article className={`task-item ${task.completed ? 'done' : ''}`} key={task.id}><button className={`check-button ${task.completed ? 'checked' : ''}`} onClick={() => toggleTask(task)} aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}>{task.completed ? <Check size={15} /> : <Circle size={15} />}</button><div className="task-info"><h3>{task.title}</h3><div className="task-meta"><span className="subject-pill">{task.subject}</span><span className={`date-pill ${task.due_date && new Date(`${task.due_date}T00:00:00`) < new Date(new Date().setHours(0, 0, 0, 0)) && !task.completed ? 'overdue' : ''}`}><CalendarDays size={13} />{niceDate(task.due_date)}</span></div></div><span className={`priority ${task.priority.toLowerCase()}`}>{task.priority}</span><div className="task-actions"><button onClick={() => openEdit(task)} aria-label="Edit task"><Pencil size={15} /></button><button onClick={() => deleteTask(task)} aria-label="Delete task"><Trash2 size={15} /></button></div></article>)}</div>}
        </section><footer className="footer-note"><span>Made for your next little win.</span><span>StudyFlow <span className="footer-dot">·</span> Stay in your flow</span></footer></div></main>
    {modal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(false) }}><div className="modal"><div className="modal-header"><div><h2>{editing ? 'Edit task' : 'Add a task'}</h2><p>Make a plan, then take it one step at a time.</p></div><button className="close-button" onClick={() => setModal(false)}><X size={18} /></button></div><form onSubmit={saveTask} className="task-form"><label>Task name<input required maxLength={120} autoFocus value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Finish calculus assignment" /></label><label>Subject or category<input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Mathematics" /></label><label>Due date<input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} /></label><label>Priority<select value={priority} onChange={e => setPriority(e.target.value as Priority)}><option>Low</option><option>Medium</option><option>High</option></select></label>{error && <div className="inline-error"><AlertCircle size={15} />{error}</div>}<div className="modal-actions"><button type="button" className="outline-button" onClick={() => setModal(false)}>Cancel</button><button className="primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create task'}</button></div></form></div></div>}
  </div>;
}
