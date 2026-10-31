import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { Clock3, Edit3, LogIn, LogOut, MessageSquare, ShieldCheck, Trash2, Users, X } from 'lucide-react'
import { hotelConfig } from './config'
import { supabase, supabaseConfigured } from './lib/supabase'

type Language = 'en' | 'ja'
type CommentRow = { id: string; author_id: string; author_name: string; body: string; created_at: string; updated_at: string }
type PresenceRow = { user_id: string; display_name: string; last_seen: string }

const words = {
  en: {
    title: 'Guest community', intro: 'Sign in to share helpful notes with other hotel guests.', signIn: 'Sign in', signUp: 'Create account', signOut: 'Sign out',
    email: 'Email', password: 'Password', displayName: 'Display name', comments: 'Guest comments', placeholder: 'Share a helpful note…',
    notice: 'Your display name, comment, and posting time will be visible to other signed-in guests.', presence: 'While you are signed in, hotel administrators can see whether you are currently online and your last activity time.',
    post: 'Post comment', update: 'Update comment', cancel: 'Cancel', empty: 'No guest comments yet. Be the first to leave a helpful note.',
    online: 'Online guests', signedIn: 'Signed in', currentlyOnline: 'currently online', lastActive: 'Last active', setup: 'Guest services need Supabase setup before sign-in, presence, and comments can work.',
    verify: 'Account created. Check your email if confirmation is enabled, then sign in.', own: 'Your comment', edit: 'Edit', remove: 'Delete', loading: 'Loading…', admin: 'Administrator',
  },
  ja: {
    title: 'ゲストコミュニティ', intro: 'サインインして、ほかの宿泊者に役立つ情報を共有できます。', signIn: 'サインイン', signUp: 'アカウント作成', signOut: 'サインアウト',
    email: 'メール', password: 'パスワード', displayName: '表示名', comments: 'ゲストコメント', placeholder: '役立つ情報を入力…',
    notice: '表示名、コメント、投稿時刻は、ほかのサインイン済みゲストに表示されます。', presence: 'サインイン中、ホテル管理者はオンライン状態と最終アクティブ時刻を確認できます。',
    post: 'コメントを投稿', update: 'コメントを更新', cancel: 'キャンセル', empty: 'コメントはまだありません。最初のコメントを投稿しましょう。',
    online: 'オンラインのゲスト', signedIn: 'サインイン中', currentlyOnline: 'オンライン', lastActive: '最終アクティブ', setup: 'サインイン、プレゼンス、コメントを利用するにはSupabaseの設定が必要です。',
    verify: 'アカウントを作成しました。確認メールが有効な場合は確認後、サインインしてください。', own: '自分のコメント', edit: '編集', remove: '削除', loading: '読み込み中…', admin: '管理者',
  },
}

export default function GuestPortal({ language }: { language: Language }) {
  const t = words[language]
  const [session, setSession] = useState<Session | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [comments, setComments] = useState<CommentRow[]>([])
  const [presence, setPresence] = useState<PresenceRow[]>([])
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [auth, setAuth] = useState({ displayName: '', email: '', password: '' })
  const [body, setBody] = useState('')
  const [editing, setEditing] = useState<CommentRow | null>(null)
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const user = session?.user ?? null

  const loadComments = useCallback(async () => {
    if (!supabase || !user) return
    const { data, error } = await supabase.from('guest_comments').select('*').order('created_at', { ascending: false }).limit(100)
    if (error) setMessage(error.message); else setComments((data ?? []) as CommentRow[])
  }, [user])

  const loadPresence = useCallback(async () => {
    if (!supabase || !isAdmin) return
    const cutoff = new Date(Date.now() - hotelConfig.presence.onlineTimeoutSeconds * 1000).toISOString()
    const { data, error } = await supabase.from('guest_presence').select('*').gte('last_seen', cutoff).order('last_seen', { ascending: false })
    if (error) setMessage(error.message); else setPresence((data ?? []) as PresenceRow[])
  }, [isAdmin])

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setLoading(false) })
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next))
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!supabase || !user) { setComments([]); setIsAdmin(false); return }
    let active = true
    supabase.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle().then(({ data }) => { if (active) setIsAdmin(Boolean(data)) })
    void loadComments()
    const channel = supabase.channel('guest-comments').on('postgres_changes', { event: '*', schema: 'public', table: 'guest_comments' }, () => void loadComments()).subscribe()
    return () => { active = false; void supabase.removeChannel(channel) }
  }, [user, loadComments])

  useEffect(() => {
    if (!supabase || !user) return
    const heartbeat = () => { if (document.visibilityState === 'visible') void supabase.rpc('heartbeat_presence') }
    heartbeat()
    const timer = window.setInterval(heartbeat, hotelConfig.presence.heartbeatMs)
    const onActivity = () => heartbeat()
    const onLeave = () => { void supabase.rpc('leave_presence') }
    document.addEventListener('visibilitychange', onActivity)
    window.addEventListener('pagehide', onLeave)
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', onActivity); window.removeEventListener('pagehide', onLeave) }
  }, [user])

  useEffect(() => {
    if (!isAdmin) { setPresence([]); return }
    void loadPresence()
    const timer = window.setInterval(() => void loadPresence(), 15_000)
    return () => window.clearInterval(timer)
  }, [isAdmin, loadPresence])

  const submitAuth = async (event: FormEvent) => {
    event.preventDefault(); if (!supabase) return; setBusy(true); setMessage('')
    const result = authMode === 'signup'
      ? await supabase.auth.signUp({ email: auth.email.trim(), password: auth.password, options: { data: { display_name: auth.displayName.trim() } } })
      : await supabase.auth.signInWithPassword({ email: auth.email.trim(), password: auth.password })
    setBusy(false)
    if (result.error) setMessage(result.error.message); else if (authMode === 'signup') setMessage(t.verify)
  }

  const submitComment = async (event: FormEvent) => {
    event.preventDefault(); if (!supabase || !user) return
    const clean = body.trim()
    if (clean.length < hotelConfig.comments.minLength || clean.length > hotelConfig.comments.maxLength) { setMessage(`${hotelConfig.comments.minLength}–${hotelConfig.comments.maxLength} characters required.`); return }
    setBusy(true); setMessage('')
    const result = editing
      ? await supabase.from('guest_comments').update({ body: clean }).eq('id', editing.id)
      : await supabase.from('guest_comments').insert({ author_id: user.id, author_name: '', body: clean })
    setBusy(false)
    if (result.error) setMessage(result.error.message); else { setBody(''); setEditing(null); await loadComments() }
  }

  const removeComment = async (comment: CommentRow) => {
    if (!supabase || !window.confirm(`${t.remove}?`)) return
    setBusy(true); const { error } = await supabase.from('guest_comments').delete().eq('id', comment.id); setBusy(false)
    if (error) setMessage(error.message); else await loadComments()
  }

  const signOut = async () => {
    if (!supabase) return
    await supabase.rpc('leave_presence')
    const { error } = await supabase.auth.signOut()
    if (error) setMessage(error.message)
  }

  const onlineCount = useMemo(() => presence.length, [presence])
  if (!supabaseConfigured) return <div className="page content-width guest-page"><div className="page-intro"><span className="eyebrow">NKK Wonder · Community</span><h1>{t.title}</h1><p>{t.intro}</p></div><div className="notice setup-notice"><ShieldCheck size={19} /><span>{t.setup}</span></div></div>
  if (loading) return <div className="page content-width"><p>{t.loading}</p></div>

  return <div className="page content-width guest-page">
    <div className="page-intro"><span className="eyebrow">NKK Wonder · Community</span><h1>{t.title}</h1><p>{t.intro}</p></div>
    {!user ? <section className="auth-card"><div className="auth-tabs"><button className={authMode === 'signin' ? 'active' : ''} onClick={() => setAuthMode('signin')}>{t.signIn}</button><button className={authMode === 'signup' ? 'active' : ''} onClick={() => setAuthMode('signup')}>{t.signUp}</button></div><form onSubmit={submitAuth}>{authMode === 'signup' && <label>{t.displayName}<input required minLength={2} maxLength={60} autoComplete="name" value={auth.displayName} onChange={e => setAuth({ ...auth, displayName: e.target.value })} /></label>}<label>{t.email}<input required type="email" autoComplete="email" value={auth.email} onChange={e => setAuth({ ...auth, email: e.target.value })} /></label><label>{t.password}<input required minLength={8} type="password" autoComplete={authMode === 'signin' ? 'current-password' : 'new-password'} value={auth.password} onChange={e => setAuth({ ...auth, password: e.target.value })} /></label><p className="privacy-copy"><ShieldCheck size={15} />{t.presence}</p><button className="primary-button" disabled={busy}>{busy ? t.loading : authMode === 'signin' ? t.signIn : t.signUp}</button></form></section> : <>
      <div className="signed-in-bar"><span><span className="online-dot" />{t.signedIn} · <b>{user.user_metadata.display_name || user.email?.split('@')[0]}</b>{isAdmin && <em>{t.admin}</em>}</span><button className="secondary-button small" onClick={signOut}><LogOut size={14} />{t.signOut}</button></div>
      <p className="privacy-copy"><ShieldCheck size={15} />{t.presence}</p>
      <div className="community-layout"><section><h2><MessageSquare size={20} />{t.comments}</h2><form className="comment-form" onSubmit={submitComment}><p>{t.notice}</p><textarea required minLength={hotelConfig.comments.minLength} maxLength={hotelConfig.comments.maxLength} value={body} onChange={e => setBody(e.target.value)} placeholder={t.placeholder} /><div><small>{body.length}/{hotelConfig.comments.maxLength}</small>{editing && <button type="button" className="secondary-button small" onClick={() => { setEditing(null); setBody('') }}><X size={14} />{t.cancel}</button>}<button className="primary-button compact" disabled={busy}>{editing ? t.update : t.post}</button></div></form><div className="comment-list">{comments.length ? comments.map(comment => { const canChange = comment.author_id === user.id || isAdmin; return <article className="comment-card" key={comment.id}><header><div><b>{comment.author_name}</b>{comment.author_id === user.id && <small>{t.own}</small>}</div><time>{new Intl.DateTimeFormat(language === 'ja' ? 'ja-JP' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(comment.created_at))}</time></header><p>{comment.body}</p>{canChange && <footer>{comment.author_id === user.id && <button onClick={() => { setEditing(comment); setBody(comment.body) }}><Edit3 size={14} />{t.edit}</button>}<button className="danger-link" onClick={() => void removeComment(comment)}><Trash2 size={14} />{t.remove}</button></footer>}</article> }) : <div className="empty-state compact"><MessageSquare size={23} /><p>{t.empty}</p></div>}</div></section>
      {isAdmin && <aside className="online-panel"><div className="online-head"><div><span className="eyebrow">{t.admin}</span><h2>{t.online}</h2></div><strong>{onlineCount}</strong></div><p>{t.signedIn} ≠ {t.currentlyOnline}. Guests time out after {hotelConfig.presence.onlineTimeoutSeconds} seconds without a heartbeat.</p>{presence.length ? <ul>{presence.map(person => <li key={person.user_id}><span className="online-dot" /><div><b>{person.display_name}</b><small><Clock3 size={12} />{t.lastActive}: {new Date(person.last_seen).toLocaleTimeString(language === 'ja' ? 'ja-JP' : 'en-GB')}</small></div></li>)}</ul> : <div className="empty-state compact"><Users size={22} /><p>0 {t.currentlyOnline}</p></div>}</aside>}
      </div>
    </>}
    {message && <div className="status-message" role="status">{message}</div>}
  </div>
}
