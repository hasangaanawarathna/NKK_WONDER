import { useState } from 'react'
import { CalendarDays, CircleHelp, Clock3, LayoutGrid, MapPin, Menu, X } from 'lucide-react'
import { hotelConfig } from './config'
import PublicCommunity from './PublicCommunity'

type Floor = 1 | 2 | 3 | 4

const schedule = [
  ['12:00', 'Student Assembly', '学生集合'],
  ['12:45', 'Registration Start', '受付開始'],
  ['13:00', 'Event Start', 'イベント開始'],
  ['14:30', 'Event End', 'イベント終了'],
  ['15:00', 'Cleanup', '片付け'],
  ['16:00', 'Review / Reflection', '振り返り'],
  ['16:30', 'Student Dismissal', '学生解散'],
]

const floors: Record<Floor, { title: string; jp: string; rooms: string[]; facilities: string[] }> = {
  1: { title: 'Arrival & reception', jp: '1階', rooms: [], facilities: ['Entrance', 'Lobby', 'Front desk', 'Cloakroom', 'Lift', "Men's toilet", "Women's toilet"] },
  2: { title: 'Guest rooms', jp: '2階', rooms: ['R1', 'R2', 'R3', 'R4'], facilities: ['Lift', "Men's toilet"] },
  3: { title: 'Guest rooms', jp: '3階', rooms: ['R1', 'R2', 'R3', 'R4'], facilities: ['Lift', "Women's toilet"] },
  4: { title: 'Guest rooms', jp: '4階', rooms: ['R1', 'R2', 'R3', 'R3'], facilities: ['Lift', "Women's toilet"] },
}

function App() {
  const [floor, setFloor] = useState<Floor>(1)
  const [menu, setMenu] = useState(false)
  const selected = floors[floor]
  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenu(false) }

  return <div className="app-shell">
    <header className="site-header">
      <button className="brand" onClick={() => scrollTo('home')} aria-label="NKK Wonder Hotel home"><span className="brand-mark"><img src="/assets/nkk-logo.jpeg" alt="" /></span><span><strong>NKK</strong><small>WONDER HOTEL</small></span></button>
      <nav className={menu ? 'main-nav is-open' : 'main-nav'} aria-label="Main navigation"><button onClick={() => scrollTo('event')}>Event / イベント</button><button onClick={() => scrollTo('floors')}>Floor guide / フロア</button><button onClick={() => scrollTo('feedback')}>Feedback / ご意見</button></nav>
      <button className="menu-button" onClick={() => setMenu(!menu)} aria-label="Toggle menu">{menu ? <X /> : <Menu />}</button>
    </header>

    <main>
      <section className="simple-hero" id="home"><div className="content-width hero-grid"><div><span className="eyebrow">Hotel guest guide · ホテル案内</span><h1>Welcome to<br /><em>NKK Wonder Hotel</em></h1><p>Event schedule and hotel floor information in one simple guide.</p><button className="primary-button" onClick={() => scrollTo('event')}>View event schedule</button></div><img src="/assets/nkk-logo.jpeg" alt="NKK Wonder Hotel logo with cherry blossoms and Mount Fuji" /></div></section>

      <section className="event-section content-width" id="event"><div className="section-heading"><span className="eyebrow">15 February 2027 · 2027年2月15日</span><h2>Student Event <em>学生イベント</em></h2></div><div className="event-layout"><div><div className="event-meta"><CalendarDays /><div><span>Date</span><b>15 February 2027</b></div></div><div className="event-meta warning"><MapPin /><div><span>Floor & room</span><b>Please confirm with reception</b></div></div><details className="supplied-image"><summary>View supplied timetable image</summary><img src="/assets/student-event-schedule.jpeg" alt="Supplied Student Event timetable for 15 February 2027" /></details></div><div className="schedule-card"><div className="schedule-title"><span>Timetable · スケジュール</span><Clock3 /></div><ol>{schedule.map(([time, en, ja]) => <li key={time}><time>{time}</time><span><b>{en}</b><small>{ja}</small></span></li>)}</ol></div></div></section>

      <section className="floor-section" id="floors"><div className="content-width"><div className="section-heading"><span className="eyebrow">Hotel floor plan · ホテル間取り図</span><h2>Floor guide</h2><p>Select a floor to view its rooms and facilities. This guide is schematic and not to scale.</p></div><div className="floor-tabs" role="tablist">{([1, 2, 3, 4] as Floor[]).map(number => <button key={number} role="tab" aria-selected={floor === number} className={floor === number ? 'selected' : ''} onClick={() => setFloor(number)}><b>{number}F</b><span>{floors[number].title}</span></button>)}</div><div className="selected-floor"><div className="floor-head"><div><span className="eyebrow">Selected floor</span><h3>{floor}F <em>{selected.jp}</em></h3></div><LayoutGrid /></div><div className={`room-grid floor-${floor}`}>{selected.rooms.map((room, index) => <div className="room-tile" key={`${room}-${index}`}><b>{room}</b><small>Room · 客室</small></div>)}{selected.facilities.map(item => <div className="facility-tile" key={item}><b>{item}</b><small>Facility · 施設</small></div>)}</div>{floor === 4 && <div className="floor-note"><CircleHelp /><p><b>Two rooms are labelled R3.</b><br />The supplied plan contains this duplicate label. Reception can clarify which room you need.</p></div>}<details className="supplied-image floor-image"><summary>View supplied complete floor plan</summary><img src="/assets/floor-plan.jpeg" alt="Supplied NKK Wonder Hotel floor plan for floors one to four" /></details></div></div></section>

      <PublicCommunity />
    </main>

    <footer className="site-footer"><div><b>NKK Wonder Hotel</b><small>ホテルゲストガイド</small></div><div className="footer-contact">{hotelConfig.contact.phone ? <a href={`tel:${hotelConfig.contact.phone}`}>{hotelConfig.contact.phone}</a> : <span>Phone not configured</span>}{hotelConfig.contact.email ? <a href={`mailto:${hotelConfig.contact.email}`}>{hotelConfig.contact.email}</a> : <span>Email not configured</span>}</div><span>© 2027 NKK Wonder Hotel</span></footer>
  </div>
}

export default App
