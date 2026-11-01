import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, MessageSquare, RefreshCw, Users } from 'lucide-react'
import { hotelConfig } from './config'
import { supabase, supabaseConfigured } from './lib/supabase'

type GuestComment = {
  id: string
  guest_name: string
  body: string
  created_at: string
}

type StatusMessage = { type: 'success' | 'error'; text: string } | null

function getVisitorId() {
  const key = 'nkk-visitor-id'
  const existing = sessionStorage.getItem(key)
  if (existing) return existing
  const id = crypto.randomUUID()
  sessionStorage.setItem(key, id)
  return id
}

function formatSubmittedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('ja-JP', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export default function PublicCommunity() {
  const visitorId = useRef(getVisitorId())
  const [online, setOnline] = useState<number | null>(null)
  const [comments, setComments] = useState<GuestComment[]>([])
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(supabaseConfigured)
  const [refreshing, setRefreshing] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [listError, setListError] = useState('')
  const [status, setStatus] = useState<StatusMessage>(null)

  const refreshComments = useCallback(async (showRefreshState = false) => {
    if (!supabase) return false
    if (showRefreshState) setRefreshing(true)
    setListError('')
    const { data, error } = await supabase.rpc('list_public_feedback')
    if (error) {
      setListError('コメントを読み込めませんでした。 / Could not load guest comments.')
      setLoading(false)
      setRefreshing(false)
      return false
    }
    setComments(((data ?? []) as GuestComment[]).slice(0, 100))
    setLoading(false)
    setRefreshing(false)
    return true
  }, [])

  const refreshPresence = useCallback(async () => {
    if (!supabase) return
    const { data, error } = await supabase.rpc('online_visitor_count')
    if (!error) setOnline(Number(data ?? 0))
  }, [])

  useEffect(() => {
    if (!supabase) return
    const client = supabase
    const heartbeat = async () => {
      if (document.visibilityState !== 'visible') return
      await client.rpc('heartbeat_visitor', { visitor: visitorId.current })
      await refreshPresence()
    }
    const refreshVisibleComments = () => {
      if (document.visibilityState === 'visible') void refreshComments()
    }
    const visible = () => {
      if (document.visibilityState !== 'visible') return
      void heartbeat()
      void refreshComments()
    }
    const leave = () => { void client.rpc('leave_visitor', { visitor: visitorId.current }) }

    void heartbeat()
    void refreshComments()
    const heartbeatTimer = window.setInterval(() => void heartbeat(), hotelConfig.presence.heartbeatMs)
    const commentTimer = window.setInterval(refreshVisibleComments, 30_000)
    document.addEventListener('visibilitychange', visible)
    window.addEventListener('pagehide', leave)
    return () => {
      window.clearInterval(heartbeatTimer)
      window.clearInterval(commentTimer)
      document.removeEventListener('visibilitychange', visible)
      window.removeEventListener('pagehide', leave)
    }
  }, [refreshComments, refreshPresence])

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!supabase || submitting) return

    const cleanName = name.trim()
    const cleanBody = body.trim()
    if (cleanName.length > 50) {
      setStatus({ type: 'error', text: 'お名前は50文字以内で入力してください。 / Name must be 50 characters or fewer.' })
      return
    }
    if (cleanBody.length < 2 || cleanBody.length > hotelConfig.feedback.maxLength) {
      setStatus({ type: 'error', text: `コメントは2〜${hotelConfig.feedback.maxLength}文字で入力してください。 / Comment must be 2–${hotelConfig.feedback.maxLength} characters.` })
      return
    }

    setSubmitting(true)
    setStatus(null)
    const { error } = await supabase.rpc('submit_public_feedback', {
      visitor: visitorId.current,
      submitted_name: cleanName,
      submitted_body: cleanBody,
    })

    if (error) {
      const cooldown = /30 seconds|wait/i.test(error.message)
      setStatus({
        type: 'error',
        text: cooldown
          ? '連続投稿はできません。30秒待ってからもう一度お試しください。 / Please wait 30 seconds before posting again.'
          : '送信できませんでした。もう一度お試しください。 / Could not submit your comment. Please try again.',
      })
      setSubmitting(false)
      return
    }

    setName('')
    setBody('')
    const refreshed = await refreshComments()
    setStatus({
      type: refreshed ? 'success' : 'error',
      text: refreshed
        ? 'コメントを公開しました。ありがとうございます。 / Your comment is now public. Thank you.'
        : 'コメントは送信されましたが、一覧を更新できませんでした。「再読み込み」を押してください。 / Comment submitted, but the list could not refresh. Please retry.',
    })
    setSubmitting(false)
  }

  return <section className="community-section" id="feedback" aria-labelledby="guest-comments-title">
    <div className="content-width community-grid">
      <div>
        <div className="section-heading">
          <span className="eyebrow">皆さまの声 · Guest Community</span>
          <h2 id="guest-comments-title">ご意見・ご感想 <em>Guest Comments</em></h2>
        </div>

        {!supabaseConfigured ? <div className="setup-card" role="status">
          <b>コメント機能は現在ご利用いただけません。 / Guest comments require setup.</b>
          <p>SupabaseのURLと公開anon key、および既存のデータベースマイグレーションを設定してください。<small>Configure the Supabase URL, public anon key, and the existing database migration. No comments are simulated or stored locally.</small></p>
        </div> : <>
          <div className="online-count" aria-live="polite"><Users size={20} aria-hidden="true"/><strong>{online ?? '—'}</strong><span>人が現在閲覧中です / visitors online now</span></div>
          <form className="feedback-form" onSubmit={submit} noValidate>
            <p className="privacy-notice"><strong>投稿されたコメントは一般公開されます。氏名、電話番号、住所などの個人情報は入力しないでください。</strong><small>Comments are public. Do not include personal information such as your full name, phone number, or address.</small></p>
            <label htmlFor="guest-name">お名前 <span>（任意） / Name (optional)</span></label>
            <input id="guest-name" value={name} onChange={event => setName(event.target.value)} maxLength={50} placeholder="ゲスト / Guest" autoComplete="name" disabled={submitting}/>
            <div className="field-counter"><span>空欄の場合は「Guest」と表示されます。 / Empty names appear as “Guest”.</span><span>{name.length}/50</span></div>
            <label htmlFor="guest-comment">コメント <span>/ Comment</span></label>
            <textarea id="guest-comment" required value={body} onChange={event => setBody(event.target.value)} minLength={2} maxLength={hotelConfig.feedback.maxLength} placeholder="ご意見・ご感想をご記入ください / Share your comment" aria-describedby="comment-requirements" disabled={submitting}/>
            <div className="field-counter" id="comment-requirements"><span>2〜{hotelConfig.feedback.maxLength}文字 / 2–{hotelConfig.feedback.maxLength} characters</span><span aria-live="polite">{body.length}/{hotelConfig.feedback.maxLength}</span></div>
            <div className="form-actions"><button className="primary-button" disabled={submitting || body.trim().length < 2}>{submitting ? '送信中… / Submitting…' : '公開する / Post comment'}</button></div>
          </form>
        </>}

        {status && <p className={`form-message ${status.type}`} role={status.type === 'error' ? 'alert' : 'status'} aria-live="polite">{status.text}</p>}
      </div>

      <div className="feedback-list" aria-busy={loading || refreshing}>
        <div className="comment-list-heading">
          <h3><MessageSquare size={19} aria-hidden="true"/>最近のコメント <small>Recent comments</small></h3>
          {supabaseConfigured && <button className="refresh-button" type="button" onClick={() => void refreshComments(true)} disabled={loading || refreshing} aria-label="コメントを再読み込み / Refresh comments"><RefreshCw size={16} className={refreshing ? 'is-spinning' : ''}/><span>再読み込み / Refresh</span></button>}
        </div>

        {!supabaseConfigured ? <div className="feedback-empty"><MessageSquare size={24} aria-hidden="true"/><p>設定完了後に公開コメントが表示されます。<small>Public comments will appear after setup.</small></p></div>
          : loading ? <div className="comment-state" role="status"><RefreshCw className="is-spinning" aria-hidden="true"/><p>読み込み中… / Loading comments…</p></div>
          : listError ? <div className="comment-state error-state" role="alert"><AlertCircle aria-hidden="true"/><p>{listError}</p><button type="button" onClick={() => void refreshComments(true)}>もう一度試す / Retry</button></div>
          : comments.length ? <div className="comment-cards" aria-live="polite">{comments.map(comment => <article key={comment.id} className="comment-card"><header><b>{comment.guest_name || 'Guest'}</b><time dateTime={comment.created_at}>{formatSubmittedAt(comment.created_at)}</time></header><p>{comment.body}</p></article>)}</div>
          : <div className="feedback-empty"><MessageSquare size={24} aria-hidden="true"/><p>まだコメントはありません。<small>No comments yet. Be the first to post.</small></p></div>}
      </div>
    </div>
  </section>
}
