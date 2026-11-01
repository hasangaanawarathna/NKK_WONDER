import { useState } from 'react'
import { CalendarDays, CircleHelp, Clock3, LayoutGrid, MapPin, Menu, X } from 'lucide-react'
import { hotelConfig } from './config'
import PublicCommunity from './PublicCommunity'

type Floor = 1 | 2 | 3 | 4
const schedule = [['12:00','学生集合','Student assembly'],['12:45','受付開始','Registration opens'],['13:00','イベント開始','Event starts'],['14:30','イベント終了','Event ends'],['15:00','片付け','Cleanup'],['16:00','振り返り','Review and reflection'],['16:30','学生解散','Student dismissal']]
const floors: Record<Floor,{title:string;en:string;rooms:string[];facilities:string[]}> = {
  1:{title:'受付・ロビー',en:'Reception & lobby',rooms:[],facilities:['入口','ロビー','フロント','クローク','エレベーター','男性用トイレ','女性用トイレ']},
  2:{title:'客室フロア',en:'Guest rooms',rooms:['R1','R2','R3','R4'],facilities:['エレベーター','男性用トイレ']},
  3:{title:'客室フロア',en:'Guest rooms',rooms:['R1','R2','R3','R4'],facilities:['エレベーター','女性用トイレ']},
  4:{title:'客室フロア',en:'Guest rooms',rooms:['R1','R2','R3','R3'],facilities:['エレベーター','女性用トイレ']},
}
const asset=(name:string)=>`${import.meta.env.BASE_URL}assets/${name}`

function App(){
 const [floor,setFloor]=useState<Floor>(1); const [menu,setMenu]=useState(false); const selected=floors[floor]
 const scrollTo=(id:string)=>{document.getElementById(id)?.scrollIntoView({behavior:'smooth'});setMenu(false)}
 return <div className="app-shell">
  <header className="site-header"><button className="brand" onClick={()=>scrollTo('home')} aria-label="NKKワンダーホテル ホーム"><span className="brand-mark"><img src={asset('nkk-logo.jpeg')} alt=""/></span><span><strong>NKK</strong><small>WONDER HOTEL</small></span></button><nav className={menu?'main-nav is-open':'main-nav'} aria-label="メインメニュー"><button onClick={()=>scrollTo('event')}>イベント</button><button onClick={()=>scrollTo('floors')}>館内案内</button><button onClick={()=>scrollTo('feedback')}>ご意見・ご感想</button></nav><button className="menu-button" onClick={()=>setMenu(!menu)} aria-label={menu?'メニューを閉じる':'メニューを開く'} aria-expanded={menu}>{menu?<X/>:<Menu/>}</button></header>
  <main>
   <section className="simple-hero" id="home"><div className="content-width hero-grid"><div><span className="eyebrow">ホテルご利用案内</span><h1>ようこそ<br/><em>NKKワンダーホテルへ</em></h1><p>イベントのスケジュールと館内情報を、わかりやすくまとめてご案内します。</p><button className="primary-button" onClick={()=>scrollTo('event')}>イベント日程を見る</button></div><img src={asset('nkk-logo.jpeg')} alt="桜と富士山が描かれたNKKワンダーホテルのロゴ"/></div></section>
   <section className="event-section content-width" id="event"><div className="section-heading"><span className="eyebrow">2027年2月15日（月）</span><h2>学生イベント <em>Student Event</em></h2></div><div className="event-layout"><div><div className="event-meta"><CalendarDays/><div><span>開催日</span><b>2027年2月15日（月）</b></div></div><div className="event-meta warning"><MapPin/><div><span>会場（階・部屋）</span><b>フロントにてご確認ください</b></div></div><details className="supplied-image"><summary>配布されたスケジュール画像を見る</summary><img src={asset('student-event-schedule.jpeg')} alt="2027年2月15日の学生イベントスケジュール"/></details></div><div className="schedule-card"><div className="schedule-title"><span>当日のスケジュール</span><Clock3/></div><ol>{schedule.map(([time,ja,en])=><li key={time}><time>{time}</time><span><b>{ja}</b><small>{en}</small></span></li>)}</ol></div></div></section>
   <section className="floor-section" id="floors"><div className="content-width"><div className="section-heading"><span className="eyebrow">館内フロアマップ</span><h2>館内案内</h2><p>ご覧になりたい階を選択してください。図は案内用の略図であり、実際の縮尺とは異なります。</p></div><div className="floor-tabs" role="tablist" aria-label="階を選択">{([1,2,3,4] as Floor[]).map(number=><button key={number} role="tab" aria-selected={floor===number} className={floor===number?'selected':''} onClick={()=>setFloor(number)}><b>{number}F</b><span>{floors[number].title}</span></button>)}</div><div className="selected-floor"><div className="floor-head"><div><span className="eyebrow">選択中のフロア</span><h3>{floor}F <em>{selected.title} / {selected.en}</em></h3></div><LayoutGrid/></div><div className={`room-grid floor-${floor}`}>{selected.rooms.map((room,index)=><div className="room-tile" key={`${room}-${index}`}><b>{room}</b><small>客室 / ROOM</small></div>)}{selected.facilities.map(item=><div className="facility-tile" key={item}><b>{item}</b><small>館内設備 / FACILITY</small></div>)}</div>{floor===4&&<div className="floor-note"><CircleHelp/><p><b>「R3」と記載された客室が2室あります。</b><br/>配布されたフロア図にも同じ表記があります。詳しい場所はフロントにお尋ねください。</p></div>}<details className="supplied-image floor-image"><summary>館内全体のフロア図を見る</summary><img src={asset('floor-plan.jpeg')} alt="NKKワンダーホテル1階から4階までのフロア図"/></details></div></div></section>
   <PublicCommunity/>
  </main>
  <footer className="site-footer"><div><b>NKKワンダーホテル</b><small>NKK WONDER HOTEL</small></div><div className="footer-contact">{hotelConfig.contact.phone?<a href={`tel:${hotelConfig.contact.phone}`}>{hotelConfig.contact.phone}</a>:<span>電話番号は準備中です</span>}{hotelConfig.contact.email?<a href={`mailto:${hotelConfig.contact.email}`}>{hotelConfig.contact.email}</a>:<span>メールアドレスは準備中です</span>}</div><span>© 2027 NKK Wonder Hotel</span></footer>
 </div>
}
export default App
