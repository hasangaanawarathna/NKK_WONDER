import { FormEvent, useCallback, useEffect, useRef, useState } from 'react'
import { MessageSquare, Users } from 'lucide-react'
import { hotelConfig } from './config'
import { supabase, supabaseConfigured } from './lib/supabase'

type Feedback = { id: string; guest_name: string; body: string; created_at: string }

function getVisitorId() {
  const key = 'nkk-visitor-id'
  const existing = sessionStorage.getItem(key)
  if (existing) return existing
  const id = crypto.randomUUID()
  sessionStorage.setItem(key, id)
  return id
}

export default function PublicCommunity() {
  const visitorId = useRef(getVisitorId())
  const [online, setOnline] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<Feedback[]>([])
  const [name, setName] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const refresh = useCallback(async () => {
    if (!supabase) return
    const [countResult, feedbackResult] = await Promise.all([
      supabase.rpc('online_visitor_count'),
      supabase.rpc('list_public_feedback'),
    ])
    if (countResult.error) setMessage(countResult.error.message)
    else setOnline(Number(countResult.data ?? 0))
    if (feedbackResult.error) setMessage(feedbackResult.error.message)
    else setFeedback((feedbackResult.data ?? []) as Feedback[])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    const client = supabase
    const heartbeat = async () => {
      if (document.visibilityState !== 'visible') return
      await client.rpc('heartbeat_visitor', { visitor: visitorId.current })
      await refresh()
    }
    void heartbeat()
    const timer = window.setInterval(() => void heartbeat(), hotelConfig.presence.heartbeatMs)
    const visible = () => { if (document.visibilityState === 'visible') void heartbeat() }
    const leave = () => { void client.rpc('leave_visitor', { visitor: visitorId.current }) }
    document.addEventListener('visibilitychange', visible)
    window.addEventListener('pagehide', leave)
    return () => {
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', visible)
      window.removeEventListener('pagehide', leave)
    }
  }, [refresh])

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!supabase) return
    const cleanName = name.trim()
    const cleanBody = body.trim()
    if (cleanName.length > 50 || cleanBody.length < 2 || cleanBody.length > hotelConfig.feedback.maxLength) {
      setMessage(`Feedback must be 2–${hotelConfig.feedback.maxLength} characters. Name can be up to 50 characters.`)
      return
    }
    setSubmitting(true)
    setMessage('')
    const { error } = await supabase.rpc('submit_public_feedback', {
      visitor: visitorId.current,
      submitted_name: cleanName,
      submitted_body: cleanBody,
    })
    setSubmitting(false)
    if (error) setMessage(error.message)
    else {
      setName('')
      setBody('')
      setMessage('Thank you. Your feedback is now visible.')
      await refresh()
    }
  }

  return <section className="community-section" id="feedback">
    <div className="content-width community-grid">
      <div>
        <div className="section-heading"><span className="eyebrow">Shared guest space</span><h2>Visitor feedback</h2></div>
        {!supabaseConfigured ? <div className="setup-card"><b>Shared features need setup</b><p>Online visitors and feedback will become live after the Supabase environment values and migration are configured.</p></div> : <>
          <div className="online-count" aria-live="polite"><Users size={20} /><strong>{online ?? '—'}</strong><span>visitor{online === 1 ? '' : 's'} online now</span></div>
          <form className="feedback-form" onSubmit={submit}>
            <p>Feedback is public and will be visible to other visitors.</p>
            <label>Name <span>(optional)</span><input value={name} onChange={e => setName(e.target.value)} maxLength={50} placeholder="Guest" /></label>
            <label>Feedback<textarea required value={body} onChange={e => setBody(e.target.value)} minLength={2} maxLength={hotelConfig.feedback.maxLength} placeholder="Share your feedback" /></label>
            <div><small>{body.length}/{hotelConfig.feedback.maxLength}</small><button className="primary-button" disabled={submitting}>{submitting ? 'Submitting…' : 'Submit'}</button></div>
          </form>
        </>}
        {message && <p className="form-message" role="status">{message}</p>}
      </div>
      <div className="feedback-list" aria-busy={loading}>
        <h3><MessageSquare size={19} />Recent feedback</h3>
        {loading ? <p className="muted-text">Loading feedback…</p> : feedback.length ? feedback.map(item => <article key={item.id}><header><b>{item.guest_name}</b><time>{new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium' }).format(new Date(item.created_at))}</time></header><p>{item.body}</p></article>) : <div className="feedback-empty"><MessageSquare size={24} /><p>No feedback yet.</p></div>}
      </div>
    </div>
  </section>
}
