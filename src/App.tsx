import { useMemo, useState } from 'react'
import {
  ArrowRight,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Clock3,
  DoorOpen,
  Edit3,
  Flower2,
  LayoutGrid,
  MapPin,
  Menu,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import GuestPortal from './GuestPortal'
import { hotelConfig } from './config'

type Language = 'en' | 'ja'
type Page = 'home' | 'events' | 'floors' | 'community' | 'manage'
type Floor = 1 | 2 | 3 | 4
type Location = { floor: Floor | null; room: string | null }
type TimetableItem = { id: string; time: string; title: string }
type Event = {
  id: string
  name: string
  nameJa: string
  date: string
  location: Location
  note?: string
  demo?: boolean
  timetable: TimetableItem[]
}

const initialEvents: Event[] = [
  {
    id: 'student-event',
    name: 'Student Event',
    nameJa: '学生イベント',
    date: '2027-02-15',
    location: { floor: null, room: null },
    note: 'Location to be confirmed with reception.',
    timetable: [
      { id: 'assembly', time: '12:00', title: 'Student Assembly' },
      { id: 'registration', time: '12:45', title: 'Registration Start' },
      { id: 'start', time: '13:00', title: 'Event Start' },
      { id: 'end', time: '14:30', title: 'Event End' },
      { id: 'cleanup', time: '15:00', title: 'Cleanup' },
      { id: 'review', time: '16:00', title: 'Review / Reflection' },
      { id: 'dismissal', time: '16:30', title: 'Student Dismissal' },
    ],
  },
  {
    id: 'garden-wedding-demo',
    name: 'Garden Wedding Reception',
    nameJa: 'ガーデンウェディング披露宴',
    date: '2027-03-20',
    location: { floor: 3, room: 'R2' },
    note: 'DEMO DATA · Example event only',
    demo: true,
    timetable: [
      { id: 'welcome', time: '16:30', title: 'Guest Welcome' },
      { id: 'dinner', time: '17:00', title: 'Dinner & Toasts' },
      { id: 'close', time: '20:00', title: 'Reception Close' },
    ],
  },
]

const floors: { number: Floor; label: string; jp: string; items: string[] }[] = [
  { number: 1, label: 'Arrival', jp: 'エントランス', items: ['Entrance', 'Lobby', 'Front Desk', 'Cloakroom', 'Lift', "Men's Toilet", "Women's Toilet"] },
  { number: 2, label: 'Meeting rooms', jp: '会議室', items: ['R1', 'R2', 'R3', 'R4', 'Lift', "Men's Toilet"] },
  { number: 3, label: 'Meeting rooms', jp: '会議室', items: ['R1', 'R2', 'R3', 'R4', 'Lift', "Women's Toilet"] },
  { number: 4, label: 'Event rooms', jp: 'イベント会場', items: ['R1', 'R2', 'R3', 'R3', 'Lift', "Women's Toilet"] },
]

const copy = {
  en: {
    home: 'Home', events: 'Events', floors: 'Floor guide', reception: 'Reception', manage: 'Manage events', community: 'Guest community',
    welcome: 'Welcome to NKK Wonder', subtitle: 'Your calm, clear guide to every moment at the hotel.',
    explore: 'Explore the hotel', upcoming: 'Upcoming events', viewAll: 'View all events',
    floorTitle: 'Find your way around', floorSub: 'Select a floor to see its rooms and facilities.',
    eventTitle: 'Events & timetable', eventSub: 'Find your event, then follow the timetable at your own pace.',
    search: 'Search events', date: 'Choose a date', allDates: 'All dates', noEvents: 'No events found',
    noEventsSub: 'Try another date or clear your search.', details: 'Event details', location: 'Location',
    confirm: 'Please confirm with reception', find: 'Find this location', timetable: 'Timetable',
    back: 'Back to events', demo: 'DEMO DATA', floor: 'Floor', room: 'Room', name: 'Event name',
    save: 'Save event', cancel: 'Cancel', add: 'Add event', edit: 'Edit', delete: 'Delete',
    management: 'Event management', managementSub: 'Prototype workspace for the hotel team.',
    localNote: 'Changes are saved only in this browser using localStorage. This is not secure authentication or shared storage.',
    addTimetable: 'Add timetable entry', noSchedule: 'No timetable entries yet.', receptionTitle: 'Reception & help',
    receptionSub: 'Our front desk team can confirm locations and help you get settled.',
    frontDesk: 'Front desk', open: 'Open 24 hours', call: 'Call reception', ambiguous: 'Plan note',
    ambiguousText: 'The supplied 4th-floor plan labels two rooms as R3. Please confirm the room label with reception.',
  },
  ja: {
    home: 'ホーム', events: 'イベント', floors: 'フロアガイド', reception: 'フロント', manage: 'イベント管理', community: 'ゲスト交流',
    welcome: 'NKK Wonderへようこそ', subtitle: '館内でのひとときを、わかりやすくご案内します。',
    explore: '館内を見る', upcoming: '今後のイベント', viewAll: 'すべてのイベント',
    floorTitle: '館内を探す', floorSub: 'フロアを選ぶと、部屋と施設が表示されます。',
    eventTitle: 'イベントとタイムテーブル', eventSub: 'イベントを探して、予定を確認できます。',
    search: 'イベントを検索', date: '日付を選択', allDates: 'すべての日付', noEvents: 'イベントがありません',
    noEventsSub: '別の日付を選ぶか、検索条件をクリアしてください。', details: 'イベント詳細', location: '場所',
    confirm: 'フロントにご確認ください', find: '場所を探す', timetable: 'タイムテーブル',
    back: 'イベント一覧へ戻る', demo: 'デモデータ', floor: 'フロア', room: '部屋', name: 'イベント名',
    save: 'イベントを保存', cancel: 'キャンセル', add: 'イベントを追加', edit: '編集', delete: '削除',
    management: 'イベント管理', managementSub: 'ホテルチーム向けプロトタイプ画面。',
    localNote: '変更はlocalStorageを使い、このブラウザ内だけに保存されます。安全な認証や共有ストレージではありません。',
    addTimetable: '予定を追加', noSchedule: '予定はまだありません。', receptionTitle: 'フロント・ヘルプ',
    receptionSub: '場所の確認や館内のご案内はフロントへお声がけください。',
    frontDesk: 'フロント', open: '24時間対応', call: 'フロントに電話', ambiguous: 'プランについて',
    ambiguousText: 'ご提供いただいた4階プランにはR3が2室あります。部屋名はフロントへご確認ください。',
  },
}

function formatDate(date: string, language: Language) {
  return new Intl.DateTimeFormat(language === 'ja' ? 'ja-JP' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${date}T12:00:00`))
}

function App() {
  const [language, setLanguage] = useState<Language>('en')
  const [page, setPage] = useState<Page>('home')
  const [events, setEvents] = useState<Event[]>(() => {
    const saved = localStorage.getItem('nkk-wonder-events')
    return saved ? JSON.parse(saved) as Event[] : initialEvents
  })
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [selectedFloor, setSelectedFloor] = useState<Floor>(1)
  const [highlightedRoom, setHighlightedRoom] = useState<string | null>(null)
  const [mobileMenu, setMobileMenu] = useState(false)
  const t = copy[language]

  const persist = (next: Event[]) => {
    setEvents(next)
    localStorage.setItem('nkk-wonder-events', JSON.stringify(next))
  }

  const go = (next: Page) => { setPage(next); setMobileMenu(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }

  return (
    <div className="app-shell">
      <header className="site-header">
        <button className="brand" onClick={() => go('home')} aria-label="NKK Wonder Hotel home">
          <span className="brand-mark"><img src="/assets/nkk-logo.jpeg" alt="" /></span>
          <span><strong>NKK</strong><small>WONDER HOTEL</small></span>
        </button>
        <nav className={mobileMenu ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation">
          <button className={page === 'home' ? 'active' : ''} onClick={() => go('home')}>{t.home}</button>
          <button className={page === 'events' ? 'active' : ''} onClick={() => go('events')}>{t.events}</button>
          <button className={page === 'floors' ? 'active' : ''} onClick={() => go('floors')}>{t.floors}</button>
          <button className={page === 'community' ? 'active' : ''} onClick={() => go('community')}>{t.community}</button>
          <button className={page === 'manage' ? 'active' : ''} onClick={() => go('manage')}>{t.manage}</button>
        </nav>
        <div className="header-actions">
          <button className="language-toggle" onClick={() => setLanguage(language === 'en' ? 'ja' : 'en')} aria-label="Switch language"><span className={language === 'en' ? 'selected' : ''}>EN</span><span>/</span><span className={language === 'ja' ? 'selected' : ''}>日本語</span></button>
          <button className="menu-button" onClick={() => setMobileMenu(!mobileMenu)} aria-label="Open menu">{mobileMenu ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </header>

      <main>
        {page === 'home' && <Home t={t} events={events} language={language} onPage={go} onEvent={(event) => { setSelectedEvent(event); setPage('events') }} />}
        {page === 'events' && <Events t={t} events={events} language={language} selectedEvent={selectedEvent} onSelect={setSelectedEvent} onPage={go} onFind={(location) => { if (location.floor) setSelectedFloor(location.floor); setHighlightedRoom(location.room); go('floors') }} />}
        {page === 'floors' && <Floors t={t} selectedFloor={selectedFloor} onFloor={(floor) => { setSelectedFloor(floor); setHighlightedRoom(null) }} highlightedRoom={highlightedRoom} events={events} />}
        {page === 'community' && <GuestPortal language={language} />}
        {page === 'manage' && <Management t={t} language={language} events={events} onPersist={persist} />}
      </main>
      <footer className="site-footer"><span>© 2027 NKK Wonder Hotel</span><div className="footer-contact">{hotelConfig.contact.phone ? <a href={`tel:${hotelConfig.contact.phone}`}>{hotelConfig.contact.phone}</a> : <span>Phone not configured</span>}{hotelConfig.contact.email ? <a href={`mailto:${hotelConfig.contact.email}`}>{hotelConfig.contact.email}</a> : <span>Email not configured</span>}</div><button onClick={() => go('home')}>{t.reception} <ArrowRight size={14} /></button></footer>
    </div>
  )
}

type Translations = typeof copy.en
function Home({ t, events, language, onPage, onEvent }: { t: Translations; events: Event[]; language: Language; onPage: (page: Page) => void; onEvent: (event: Event) => void }) {
  return <div>
    <section className="hero">
      <div className="hero-content">
        <div className="eyebrow"><span className="eyebrow-line" />Guest guide · ゲストガイド</div>
        <h1>{t.welcome}<br /><em>— wonder awaits.</em></h1>
        <p>{t.subtitle}</p>
        <button className="primary-button" onClick={() => onPage('events')}>{t.explore}<ArrowRight size={17} /></button>
      </div>
      <div className="hero-art"><img src="/assets/nkk-logo.jpeg" alt="NKK Wonder Hotel cherry blossom and Mount Fuji logo" /></div>
    </section>
    <section className="quick-links content-width">
      <div className="section-heading"><span className="eyebrow">At a glance</span><h2>Everything you need,<br /><em>right here.</em></h2></div>
      <div className="quick-grid">
        <button className="quick-card blush" onClick={() => onPage('events')}><span className="icon-disc"><CalendarDays /></span><span><b>{t.events}</b><small>Explore what’s on</small></span><ArrowRight /></button>
        <button className="quick-card green" onClick={() => onPage('floors')}><span className="icon-disc"><LayoutGrid /></span><span><b>{t.floors}</b><small>Rooms & facilities</small></span><ArrowRight /></button>
        <button className="quick-card gold" onClick={() => document.getElementById('reception')?.scrollIntoView({ behavior: 'smooth' })}><span className="icon-disc"><CircleHelp /></span><span><b>{t.reception}</b><small>We’re here to help</small></span><ArrowRight /></button>
      </div>
    </section>
    <section className="upcoming content-width">
      <div className="section-heading split"><div><span className="eyebrow">On the calendar</span><h2>{t.upcoming}</h2></div><button className="text-button" onClick={() => onPage('events')}>{t.viewAll}<ArrowRight size={15} /></button></div>
      <div className="event-preview-grid">{events.slice(0, 2).map(event => <button className="event-preview" key={event.id} onClick={() => onEvent(event)}><span className="date-stamp"><b>{new Date(`${event.date}T12:00:00`).getDate()}</b><small>{new Date(`${event.date}T12:00:00`).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-GB', { month: 'short' })}</small></span><span className="event-preview-info"><span className="event-tag">{event.demo ? t.demo : 'Featured'}</span><b>{language === 'ja' ? event.nameJa : event.name}</b><small><CalendarDays size={13} />{formatDate(event.date, language)}</small></span><ArrowRight /></button>)}</div>
    </section>
    <section className="reception-band" id="reception"><div className="content-width reception-inner"><div><span className="eyebrow light">Need a hand?</span><h2>{t.receptionTitle}</h2><p>{t.receptionSub}</p></div><div className="reception-card"><span className="icon-disc"><DoorOpen /></span><span><b>{t.frontDesk}</b><small>{t.open}</small></span><span className="reception-location">1F · Lobby</span></div></div></section>
  </div>
}

function Events({ t, events, language, selectedEvent, onSelect, onPage, onFind }: { t: Translations; events: Event[]; language: Language; selectedEvent: Event | null; onSelect: (event: Event | null) => void; onPage: (page: Page) => void; onFind: (location: Location) => void }) {
  const [query, setQuery] = useState('')
  const [date, setDate] = useState('')
  const filtered = events.filter(event => (event.name.toLowerCase().includes(query.toLowerCase()) || event.nameJa.includes(query)) && (!date || event.date === date))
  if (selectedEvent) return <EventDetail t={t} language={language} event={selectedEvent} onBack={() => onSelect(null)} onFind={onFind} />
  return <div className="page content-width"><div className="page-intro"><span className="eyebrow">NKK Wonder · {t.events}</span><h1>{t.eventTitle}</h1><p>{t.eventSub}</p></div><div className="filters"><label><Search size={17} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={t.search} /></label><label><CalendarDays size={17} /><span className="sr-only">{t.date}</span><input type="date" value={date} onChange={event => setDate(event.target.value)} /></label>{date && <button className="clear-filter" onClick={() => setDate('')}><X size={14} /> {t.allDates}</button>}</div><div className="event-list">{filtered.length ? filtered.map(event => <button className="event-row" key={event.id} onClick={() => onSelect(event)}><span className="date-stamp"><b>{new Date(`${event.date}T12:00:00`).getDate()}</b><small>{new Date(`${event.date}T12:00:00`).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-GB', { month: 'short' })}</small></span><span className="event-row-main"><span className="event-tag">{event.demo ? t.demo : 'Featured event'}</span><b>{language === 'ja' ? event.nameJa : event.name}</b><small><CalendarDays size={13} />{formatDate(event.date, language)}</small></span><span className="event-location">{event.location.floor ? <><MapPin size={14} />{event.location.floor}{t.floor} · {event.location.room}</> : <><CircleHelp size={14} />{t.confirm}</>}</span><ArrowRight /></button>) : <div className="empty-state"><Sparkles size={27} /><h3>{t.noEvents}</h3><p>{t.noEventsSub}</p></div>}</div></div>
}

function EventDetail({ t, language, event, onBack, onFind }: { t: Translations; language: Language; event: Event; onBack: () => void; onFind: (location: Location) => void }) {
  const hasLocation = Boolean(event.location.floor && event.location.room)
  return <div className="page content-width detail-page"><button className="back-button" onClick={onBack}><ChevronLeft size={17} />{t.back}</button><div className="detail-layout"><div><span className="event-tag">{event.demo ? t.demo : 'Featured event'}</span><h1>{language === 'ja' ? event.nameJa : event.name}</h1><div className="detail-date"><CalendarDays size={18} /><b>{formatDate(event.date, language)}</b></div><div className="location-panel"><span className="icon-disc"><MapPin /></span><div><span>{t.location}</span>{hasLocation ? <b>{event.location.floor}{t.floor} · {event.location.room}</b> : <b className="confirm-text">{t.confirm}</b>}</div></div>{hasLocation && <button className="primary-button compact" onClick={() => onFind(event.location)}>{t.find}<MapPin size={16} /></button>}{!hasLocation && <p className="detail-note"><CircleHelp size={16} />{event.note ?? t.confirm}</p>}{event.id === 'student-event' && <details className="event-poster"><summary>View supplied schedule / 案内画像を見る</summary><img src="/assets/student-event-schedule.jpeg" alt="Student Event schedule for 15 February 2027" /></details>}</div><div className="timetable-card"><div className="card-title"><span className="eyebrow">{t.timetable}</span><Clock3 size={20} /></div>{event.timetable.length ? <ol>{event.timetable.map(item => <li key={item.id}><time>{item.time}</time><span>{item.title}</span></li>)}</ol> : <p className="muted">{t.noSchedule}</p>}</div></div></div>
}

function Floors({ t, selectedFloor, onFloor, highlightedRoom, events }: { t: Translations; selectedFloor: Floor; onFloor: (floor: Floor) => void; highlightedRoom: string | null; events: Event[] }) {
  const floor = floors.find(item => item.number === selectedFloor)!
  const floorEvents = events.filter(event => event.location.floor === selectedFloor)
  const roomClass = (room: string, position: string) => `plan-room ${position}${highlightedRoom === room ? ' is-highlighted' : ''}`
  return <div className="page content-width"><div className="page-intro"><span className="eyebrow">NKK Wonder · {t.floors}</span><h1>{t.floorTitle}</h1><p>{t.floorSub}</p></div><div className="floor-tabs" role="tablist">{floors.map(item => <button key={item.number} className={selectedFloor === item.number ? 'selected' : ''} onClick={() => onFloor(item.number)} role="tab" aria-selected={selectedFloor === item.number}><b>{item.number}</b><span>{item.label}</span></button>)}</div><div className="floor-view"><div className="floor-view-head"><div><span className="eyebrow">Selected floor</span><h2>{selectedFloor}{t.floor} <em>{floor.jp}</em></h2></div><span className="schematic-note"><LayoutGrid size={15} /> Schematic guide</span></div><div className={`floor-plan floor-${selectedFloor}`}><div className="plan-corridor" /><button className={roomClass(floor.items[0], 'room-a')}>{floor.items[0]}<small>Room</small></button><button className={roomClass(floor.items[1], 'room-b')}>{floor.items[1]}<small>Room</small></button><button className={roomClass(floor.items[2], 'room-c')}>{floor.items[2]}<small>Room</small></button><button className={roomClass(floor.items[3], 'room-d')}>{floor.items[3]}<small>Room</small></button><div className="plan-facility lift">{floor.items[4]}<small>Core</small></div><div className="plan-facility toilet">{floor.items[5]}<small>Facility</small></div><div className="plan-legend"><span /><small>Rooms & shared facilities · schematic, not to scale</small></div></div><details className="source-plan"><summary>View supplied floor plan / 提供された間取り図</summary><img src="/assets/floor-plan.jpeg" alt="Supplied NKK Wonder Hotel floor plan showing floors one through four" /></details>{selectedFloor === 4 && <div className="ambiguity-note"><CircleHelp size={18} /><div><b>{t.ambiguous}</b><p>{t.ambiguousText}</p></div></div>}<div className="floor-events"><h3>{floorEvents.length ? t.upcoming : 'No events on this floor'}</h3>{floorEvents.length ? floorEvents.map(event => <div className="mini-event" key={event.id}><CalendarDays size={15} /><b>{event.name}</b><span>{formatDate(event.date, 'en')}</span></div>) : <p>{t.noEventsSub}</p>}</div></div></div>
}

function Management({ t, language, events, onPersist }: { t: Translations; language: Language; events: Event[]; onPersist: (events: Event[]) => void }) {
  const blank: Event = { id: '', name: '', nameJa: '', date: '', location: { floor: null, room: null }, timetable: [] }
  const [editing, setEditing] = useState<Event | null>(null)
  const [draftItem, setDraftItem] = useState({ time: '', title: '' })
  const save = () => { if (!editing?.name || !editing.date) return; const next = editing.id ? events.map(event => event.id === editing.id ? editing : event) : [...events, { ...editing, id: crypto.randomUUID() }]; onPersist(next); setEditing(null) }
  const deleteEvent = (id: string) => { if (window.confirm('Delete this event?')) onPersist(events.filter(event => event.id !== id)) }
  const addItem = () => { if (!editing || !draftItem.time || !draftItem.title) return; setEditing({ ...editing, timetable: [...editing.timetable, { ...draftItem, id: crypto.randomUUID() }] }); setDraftItem({ time: '', title: '' }) }
  return <div className="page content-width"><div className="page-intro"><span className="eyebrow">NKK Wonder · {t.manage}</span><h1>{t.management}</h1><p>{t.managementSub}</p></div><div className="notice"><Settings size={17} /><span>{t.localNote}</span></div>{editing ? <div className="editor-card"><div className="editor-head"><h2>{editing.id ? t.edit : t.add}</h2><button className="icon-button" onClick={() => setEditing(null)} aria-label={t.cancel}><X /></button></div><div className="form-grid"><label>{t.name}<input value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /></label><label>日本語<input value={editing.nameJa} onChange={e => setEditing({ ...editing, nameJa: e.target.value })} /></label><label>{t.date}<input type="date" value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })} /></label><label>{t.floor}<select value={editing.location.floor ?? ''} onChange={e => setEditing({ ...editing, location: { ...editing.location, floor: e.target.value ? Number(e.target.value) as Floor : null } })}><option value="">— {t.confirm} —</option>{floors.map(floor => <option key={floor.number} value={floor.number}>{floor.number}{t.floor}</option>)}</select></label><label>{t.room}<input value={editing.location.room ?? ''} onChange={e => setEditing({ ...editing, location: { ...editing.location, room: e.target.value || null } })} placeholder="e.g. R2" /></label></div><div className="editor-schedule"><h3>{t.timetable}</h3>{editing.timetable.map(item => <div className="schedule-edit-row" key={item.id}><input type="time" value={item.time} onChange={e => setEditing({ ...editing, timetable: editing.timetable.map(row => row.id === item.id ? { ...row, time: e.target.value } : row) })} /><input value={item.title} onChange={e => setEditing({ ...editing, timetable: editing.timetable.map(row => row.id === item.id ? { ...row, title: e.target.value } : row) })} /><button className="icon-button danger" onClick={() => setEditing({ ...editing, timetable: editing.timetable.filter(row => row.id !== item.id) })} aria-label={t.delete}><Trash2 size={16} /></button></div>)}<div className="schedule-edit-row add-row"><input type="time" value={draftItem.time} onChange={e => setDraftItem({ ...draftItem, time: e.target.value })} /><input value={draftItem.title} onChange={e => setDraftItem({ ...draftItem, title: e.target.value })} placeholder={t.addTimetable} /><button className="icon-button" onClick={addItem} aria-label={t.addTimetable}><Plus size={17} /></button></div></div><div className="editor-actions"><button className="secondary-button" onClick={() => setEditing(null)}>{t.cancel}</button><button className="primary-button compact" onClick={save}>{t.save}</button></div></div> : <><div className="management-head"><h2>{events.length} {t.events}</h2><button className="primary-button compact" onClick={() => setEditing({ ...blank })}><Plus size={17} />{t.add}</button></div><div className="manage-list">{events.map(event => <div className="manage-row" key={event.id}><div><b>{language === 'ja' ? event.nameJa || event.name : event.name}</b><small>{formatDate(event.date, language)} · {event.location.floor ? `${event.location.floor}${t.floor} · ${event.location.room}` : t.confirm}</small></div><div><button className="secondary-button small" onClick={() => setEditing({ ...event })}><Edit3 size={14} />{t.edit}</button><button className="icon-button danger" onClick={() => deleteEvent(event.id)} aria-label={t.delete}><Trash2 size={16} /></button></div></div>)}</div></>}</div>
}

export default App
