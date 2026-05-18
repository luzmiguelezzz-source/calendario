'use client';
import { useState, useRef, useEffect } from "react";

const STATUS_CONFIG = {
  pensar:      { label: "💭 Pensar",      color: "#94a3b8", bg: "#f1f5f9", border: "#cbd5e1", text: "#475569" },
  planificado: { label: "📋 Planificado", color: "#f59e0b", bg: "#fffbeb", border: "#fcd34d", text: "#92400e" },
  grabar:      { label: "🎬 Grabar",      color: "#f97316", bg: "#fff7ed", border: "#fb923c", text: "#9a3412" },
  editar:      { label: "✂️ Editar",      color: "#8b5cf6", bg: "#f5f3ff", border: "#a78bfa", text: "#5b21b6" },
  borrador:    { label: "✅ Borrador",    color: "#10b981", bg: "#ecfdf5", border: "#6ee7b7", text: "#065f46" },
  publicado:   { label: "🌟 Publicado",   color: "#6b7280", bg: "#f9fafb", border: "#d1d5db", text: "#374151" },
};

const PLATFORM_CONFIG = {
  instagram: { label: "Instagram", icon: "📸", color: "#e1306c" },
  tiktok:    { label: "TikTok",    icon: "🎵", color: "#000000" },
  youtube:   { label: "YouTube",   icon: "▶️", color: "#ff0000" },
};

const FORMAT_OPTIONS = ["Reel", "Carrusel", "Post estático", "Story", "Video largo", "Short", "Live"];
const DAYS   = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function getDaysInMonth(y, m) { return new Date(y, m + 1, 0).getDate(); }
function getFirstDay(y, m)    { return new Date(y, m, 1).getDay(); }
function pad(n)                { return String(n).padStart(2, "0"); }
function toDateStr(y, m, d)    { return `${y}-${pad(m+1)}-${pad(d)}`; }

const emptyEvent = {
  id: null, title: "", platform: "instagram", format: "Reel", status: "pensar",
  date: "", time: "10:00", script: "", copy: "",
  cover: null, coverName: "",
  mediaFile: null, mediaFileName: "", mediaFileType: "",
};

function toICSDate(dateStr, timeStr) {
  const [y,m,d] = dateStr.split("-");
  const [h,min] = timeStr.split(":");
  return `${y}${m}${d}T${h}${min}00`;
}

function exportToGoogleCalendar(ev) {
  const start = toICSDate(ev.date, ev.time);
  const [h, min] = ev.time.split(":").map(Number);
  const endTime = `${pad(Math.min(h+1,23))}:${pad(min)}`;
  const end = toICSDate(ev.date, endTime);
  const description = [
    `Plataforma: ${PLATFORM_CONFIG[ev.platform].label}`,
    `Formato: ${ev.format}`,
    `Estado: ${STATUS_CONFIG[ev.status].label}`,
    ev.copy   ? `\nCopy:\n${ev.copy}`   : "",
    ev.script ? `\nGuion:\n${ev.script}` : "",
  ].filter(Boolean).join("\n");
  const ics = [
    "BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//LuzPsicosex//ContentCalendar//ES",
    "BEGIN:VEVENT",
    `DTSTART:${start}`,`DTEND:${end}`,
    `SUMMARY:${PLATFORM_CONFIG[ev.platform].icon} ${ev.title}`,
    `DESCRIPTION:${description.replace(/\n/g,"\\n")}`,
    "END:VEVENT","END:VCALENDAR"
  ].join("\r\n");
  const blob = new Blob([ics],{type:"text/calendar"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download=`${ev.title.replace(/\s+/g,"-")}.ics`; a.click();
  URL.revokeObjectURL(url);
}

function exportWeekToGoogleCalendar(weekEvents) {
  const lines = ["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//LuzPsicosex//ContentCalendar//ES"];
  weekEvents.forEach(ev => {
    const start = toICSDate(ev.date, ev.time);
    const [h, min] = ev.time.split(":").map(Number);
    const end = toICSDate(ev.date, `${pad(Math.min(h+1,23))}:${pad(min)}`);
    lines.push("BEGIN:VEVENT",`DTSTART:${start}`,`DTEND:${end}`,`SUMMARY:${PLATFORM_CONFIG[ev.platform].icon} ${ev.title}`,`DESCRIPTION:${PLATFORM_CONFIG[ev.platform].label} | ${ev.format} | ${STATUS_CONFIG[ev.status].label}`,"END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")],{type:"text/calendar"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href=url; a.download="semana-contenido.ics"; a.click();
  URL.revokeObjectURL(url);
}

function scheduleNotification(title, body, atDate) {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const delay = atDate.getTime() - Date.now();
  if (delay < 0 || delay > 7*24*60*60*1000) return; // only schedule within 7 days
  setTimeout(() => { try { new Notification(title, { body }); } catch(e) {} }, delay);
}

export default function ContentCalendar() {
  const today = new Date();
  const [view, setView]               = useState("month");
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [events, setEvents]           = useState([
    { id:1, title:"Tips sobre deseo sexual",      platform:"instagram", format:"Carrusel",   status:"borrador",    date:toDateStr(today.getFullYear(),today.getMonth(),today.getDate()),              time:"09:00", script:"Hoy vamos a hablar sobre el deseo...", copy:"¿Sabés qué activa tu deseo? 🔥", cover:null, coverName:"", mediaFile:null, mediaFileName:"", mediaFileType:"" },
    { id:2, title:"Reel educativo sobre orgasmos", platform:"tiktok",   format:"Reel",       status:"grabar",      date:toDateStr(today.getFullYear(),today.getMonth(),Math.min(today.getDate()+2,28)), time:"18:00", script:"", copy:"", cover:null, coverName:"", mediaFile:null, mediaFileName:"", mediaFileType:"" },
    { id:3, title:"Video: autoestima sexual",      platform:"youtube",  format:"Video largo", status:"editar",      date:toDateStr(today.getFullYear(),today.getMonth(),Math.min(today.getDate()+5,28)), time:"12:00", script:"", copy:"", cover:null, coverName:"", mediaFile:null, mediaFileName:"", mediaFileType:"" },
  ]);
  const [modal, setModal]               = useState(null);
  const [form,  setForm]                = useState(emptyEvent);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterPlat,   setFilterPlat]   = useState("all");
  const [toast, setToast]               = useState(null);
  const coverRef = useRef();
  const mediaRef = useRef();

  const year  = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "granted") {
      events.forEach(ev => {
        if (!ev.date||!ev.time) return;
        const [h,m] = ev.time.split(":").map(Number);
        const eventTime = new Date(`${ev.date}T${pad(h)}:${pad(m)}:00`);
        const notifTime = new Date(eventTime.getTime() - 60*60*1000);
        scheduleNotification(`⏰ En 1 hora: ${ev.title}`, `${PLATFORM_CONFIG[ev.platform].icon} ${PLATFORM_CONFIG[ev.platform].label} · ${ev.format}`, notifTime);
      });
      // Monday reminder
      const now = new Date();
      const daysUntilMon = ((8 - now.getDay()) % 7) || 7;
      const monday = new Date(now); monday.setDate(now.getDate()+daysUntilMon); monday.setHours(9,0,0,0);
      const wStart = new Date(monday), wEnd = new Date(monday); wEnd.setDate(monday.getDate()+6);
      const wEvs = events.filter(e => { const d=new Date(e.date); return d>=wStart&&d<=wEnd; });
      if (wEvs.length>0) scheduleNotification(`📅 Esta semana tenés ${wEvs.length} publicaciones`, wEvs.map(e=>`• ${e.title}`).join("\n"), monday);
    }
  }, [events]);

  function showToast(msg) { setToast(msg); setTimeout(()=>setToast(null),3000); }

  const filteredEvents = events.filter(e => {
    if (filterStatus!=="all" && e.status!==filterStatus) return false;
    if (filterPlat!=="all"   && e.platform!==filterPlat)  return false;
    return true;
  });
  function eventsForDate(ds) { return filteredEvents.filter(e=>e.date===ds); }

  function openNew(ds)  { setForm({...emptyEvent,id:Date.now(),date:ds}); setModal({mode:"new"}); }
  function openView(ev) { setForm({...ev}); setModal({mode:"view"}); }

  function saveEvent() {
    if (!form.title||!form.date) return;
    if (modal.mode==="new") setEvents(p=>[...p,{...form}]);
    else setEvents(p=>p.map(e=>e.id===form.id?{...form}:e));
    showToast(modal.mode==="new"?"✨ Publicación agregada":"✅ Cambios guardados");
    setModal(null);
  }
  function deleteEvent(id) { setEvents(p=>p.filter(e=>e.id!==id)); showToast("🗑️ Publicación eliminada"); setModal(null); }

  function handleCover(e) {
    const file=e.target.files[0]; if(!file) return;
    const r=new FileReader(); r.onload=ev=>setForm(f=>({...f,cover:ev.target.result,coverName:file.name})); r.readAsDataURL(file);
  }
  function handleMedia(e) {
    const file=e.target.files[0]; if(!file) return;
    const isVideo=file.type.startsWith("video/");
    const r=new FileReader(); r.onload=ev=>setForm(f=>({...f,mediaFile:ev.target.result,mediaFileName:file.name,mediaFileType:isVideo?"video":"image"})); r.readAsDataURL(file);
  }

  function prevMonth() { setCurrentDate(new Date(year,month-1,1)); }
  function nextMonth() { setCurrentDate(new Date(year,month+1,1)); }
  function prevWeek()  { setCurrentDate(d=>{const n=new Date(d);n.setDate(n.getDate()-7);return n;}); }
  function nextWeek()  { setCurrentDate(d=>{const n=new Date(d);n.setDate(n.getDate()+7);return n;}); }
  function goToday()   { setCurrentDate(new Date(today.getFullYear(),today.getMonth(),1)); }

  function getWeekDates() {
    const base=new Date(year,month,currentDate.getDate()||1);
    const dow=base.getDay();
    return Array.from({length:7},(_,i)=>{const d=new Date(base);d.setDate(base.getDate()-dow+i);return d;});
  }

  const daysInMonth = getDaysInMonth(year,month);
  const firstDay    = getFirstDay(year,month);
  const totalCells  = Math.ceil((firstDay+daysInMonth)/7)*7;
  const isToday     = (y2,m2,d2)=>y2===today.getFullYear()&&m2===today.getMonth()&&d2===today.getDate();

  const weekDates    = getWeekDates();
  const weekDateStrs = weekDates.map(d=>toDateStr(d.getFullYear(),d.getMonth(),d.getDate()));
  const weekEvents   = events.filter(e=>weekDateStrs.includes(e.date));

  return (
    <div style={{fontFamily:"'DM Sans','Segoe UI',sans-serif",background:"#f8f7ff",minHeight:"100vh",color:"#1a1a2e"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@700&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:#f1f5f9}::-webkit-scrollbar-thumb{background:#c4b5fd;border-radius:3px}
        .btn{cursor:pointer;border:none;border-radius:8px;font-family:inherit;font-weight:500;transition:all .15s}
        .btn:hover{filter:brightness(.95);transform:translateY(-1px)}.btn:active{transform:translateY(0)}
        .chip{display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;white-space:nowrap}
        .ev-pill{border-radius:6px;padding:2px 7px;font-size:11px;font-weight:600;cursor:pointer;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%;display:flex;align-items:center;gap:4px;transition:all .1s;border-left:3px solid}
        .ev-pill:hover{filter:brightness(.92);transform:translateX(1px)}
        .day-cell{min-height:100px;border-right:1px solid #ede9fe;border-bottom:1px solid #ede9fe;padding:6px;cursor:pointer;transition:background .1s}
        .day-cell:hover{background:#f5f3ff}
        .modal-overlay{position:fixed;inset:0;background:rgba(26,26,46,.45);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px}
        .modal{background:white;border-radius:20px;width:100%;max-width:660px;max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(139,92,246,.2)}
        input,textarea,select{font-family:inherit;border:1.5px solid #e2d9f3;border-radius:10px;padding:8px 12px;width:100%;font-size:14px;color:#1a1a2e;background:#faf9ff;transition:border .15s;outline:none}
        input:focus,textarea:focus,select:focus{border-color:#8b5cf6}
        label{font-size:12px;font-weight:600;color:#7c3aed;text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:4px}
        .status-btn{padding:6px 12px;border-radius:20px;border:2px solid;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;background:white}
        .plat-btn{padding:6px 14px;border-radius:20px;border:2px solid;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s;display:flex;align-items:center;gap:5px}
        .toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1a1a2e;color:white;padding:10px 20px;border-radius:12px;font-size:14px;font-weight:500;z-index:2000;box-shadow:0 8px 24px rgba(0,0,0,.2);animation:fadeUp .3s ease;white-space:nowrap}
        @keyframes fadeUp{from{opacity:0;transform:translate(-50%,10px)}to{opacity:1;transform:translate(-50%,0)}}
        .gcal-btn{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:8px;border:1.5px solid #4285f4;background:white;color:#4285f4;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s}
        .gcal-btn:hover{background:#4285f4;color:white}
        .notif-banner{background:#faf5ff;border:1px solid #e2d9f3;border-radius:12px;padding:10px 14px;font-size:12px;color:#7c3aed;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
        .drop-zone{border:2px dashed;border-radius:12px;padding:14px;text-align:center;cursor:pointer;transition:all .15s}
        .drop-zone:hover{opacity:.85}
      `}</style>

      {toast && <div className="toast">{toast}</div>}

      {/* HEADER */}
      <div style={{background:"white",borderBottom:"1px solid #ede9fe",padding:"14px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:10,boxShadow:"0 2px 12px rgba(139,92,246,.06)"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{background:"linear-gradient(135deg,#7c3aed,#db2877)",borderRadius:12,width:38,height:38,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18}}>✨</div>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,fontWeight:700,color:"#1a1a2e",lineHeight:1}}>Content Calendar</div>
            <div style={{fontSize:11,color:"#9d71ea",fontWeight:500}}>@luz.psicosex</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
          <select value={filterPlat} onChange={e=>setFilterPlat(e.target.value)} style={{width:"auto",fontSize:12,padding:"6px 10px",borderColor:"#e2d9f3"}}>
            <option value="all">Todas las plataformas</option>
            {Object.entries(PLATFORM_CONFIG).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
          </select>
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{width:"auto",fontSize:12,padding:"6px 10px",borderColor:"#e2d9f3"}}>
            <option value="all">Todos los estados</option>
            {Object.entries(STATUS_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
          </select>
          <div style={{display:"flex",background:"#f5f3ff",borderRadius:10,padding:3,gap:2}}>
            {["month","week"].map(v=>(
              <button key={v} className="btn" onClick={()=>setView(v)} style={{padding:"5px 14px",fontSize:12,background:view===v?"#7c3aed":"transparent",color:view===v?"white":"#7c3aed",borderRadius:7}}>{v==="month"?"Mes":"Semana"}</button>
            ))}
          </div>
          <button className="btn" onClick={()=>openNew(toDateStr(today.getFullYear(),today.getMonth(),today.getDate()))} style={{background:"linear-gradient(135deg,#7c3aed,#db2877)",color:"white",padding:"7px 16px",fontSize:13,borderRadius:10,display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:16,lineHeight:1}}>+</span> Nuevo contenido
          </button>
        </div>
      </div>

      {/* NOTIF BANNER */}
      {typeof window !== "undefined" && "Notification" in window && Notification.permission!=="granted" && (
        <div style={{padding:"8px 20px",background:"white",borderBottom:"1px solid #ede9fe"}}>
          <div className="notif-banner">
            <span style={{fontSize:18}}>🔔</span>
            <span style={{flex:1}}>Activá las notificaciones del navegador para recibir recordatorios automáticos 1 hora antes de cada publicación, y el lunes con el resumen semanal.</span>
            <button className="btn" onClick={()=>Notification.requestPermission().then(()=>showToast("🔔 Notificaciones activadas"))} style={{background:"#7c3aed",color:"white",padding:"5px 14px",fontSize:12,flexShrink:0}}>Activar ahora</button>
          </div>
        </div>
      )}

      {/* LEGEND + WEEK EXPORT */}
      <div style={{display:"flex",gap:6,padding:"8px 20px",flexWrap:"wrap",borderBottom:"1px solid #ede9fe",background:"white",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {Object.entries(STATUS_CONFIG).map(([k,v])=>(
            <span key={k} className="chip" style={{background:v.bg,color:v.text,border:`1.5px solid ${v.border}`}}>{v.label}</span>
          ))}
        </div>
        {view==="week" && weekEvents.length>0 && (
          <button className="gcal-btn" onClick={()=>{exportWeekToGoogleCalendar(weekEvents);showToast("📅 Semana exportada — importá el .ics en Google Calendar");}}>
            📅 Exportar semana a Google Calendar
          </button>
        )}
      </div>

      {/* NAV */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 20px"}}>
        <div style={{display:"flex",gap:8}}>
          <button className="btn" onClick={view==="month"?prevMonth:prevWeek} style={{background:"white",border:"1.5px solid #e2d9f3",padding:"6px 12px",color:"#7c3aed",fontSize:16}}>‹</button>
          <button className="btn" onClick={view==="month"?nextMonth:nextWeek} style={{background:"white",border:"1.5px solid #e2d9f3",padding:"6px 12px",color:"#7c3aed",fontSize:16}}>›</button>
          <button className="btn" onClick={goToday} style={{background:"white",border:"1.5px solid #e2d9f3",padding:"6px 14px",color:"#7c3aed",fontSize:12}}>Hoy</button>
        </div>
        <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,fontWeight:700,color:"#1a1a2e"}}>
          {view==="month"
            ? `${MONTHS[month]} ${year}`
            : (()=>{const wk=getWeekDates();return `${wk[0].getDate()} – ${wk[6].getDate()} ${MONTHS[wk[6].getMonth()]} ${wk[6].getFullYear()}`;})()}
        </div>
        <div style={{color:"#a78bfa",fontSize:13,fontWeight:500}}>{filteredEvents.length} publicaciones</div>
      </div>

      {/* CALENDAR GRID */}
      <div style={{padding:"0 20px 24px"}}>
        <div style={{background:"white",borderRadius:16,overflow:"hidden",border:"1px solid #ede9fe",boxShadow:"0 4px 20px rgba(139,92,246,.07)"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:"#faf9ff",borderBottom:"1px solid #ede9fe"}}>
            {DAYS.map(d=><div key={d} style={{padding:"10px 0",textAlign:"center",fontSize:11,fontWeight:700,color:"#9d71ea",textTransform:"uppercase",letterSpacing:".07em"}}>{d}</div>)}
          </div>

          {view==="month" ? (
            <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)"}}>
              {Array.from({length:totalCells},(_,i)=>{
                const dayNum=i-firstDay+1;
                const valid=dayNum>=1&&dayNum<=daysInMonth;
                const ds=valid?toDateStr(year,month,dayNum):null;
                const dayEvs=ds?eventsForDate(ds):[];
                const todayC=valid&&isToday(year,month,dayNum);
                return (
                  <div key={i} className="day-cell" style={{background:todayC?"#faf5ff":"white"}} onClick={()=>valid&&openNew(ds)}>
                    {valid&&(
                      <>
                        <div style={{display:"flex",justifyContent:"flex-end",marginBottom:4}}>
                          <span style={{width:24,height:24,display:"flex",alignItems:"center",justifyContent:"center",borderRadius:"50%",fontSize:12,fontWeight:todayC?700:400,background:todayC?"#7c3aed":"transparent",color:todayC?"white":"#6b7280"}}>{dayNum}</span>
                        </div>
                        <div style={{display:"flex",flexDirection:"column",gap:2}}>
                          {dayEvs.map(ev=>{
                            const st=STATUS_CONFIG[ev.status],pl=PLATFORM_CONFIG[ev.platform];
                            return (
                              <div key={ev.id} className="ev-pill" style={{background:st.bg,color:st.text,borderLeftColor:st.color}} onClick={e=>{e.stopPropagation();openView(ev);}}>
                                <span style={{fontSize:10}}>{pl.icon}</span>
                                <span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{ev.time} {ev.title}</span>
                                {ev.mediaFile&&<span style={{fontSize:9,opacity:.7,flexShrink:0}}>{ev.mediaFileType==="video"?"🎬":"🖼"}</span>}
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div>
              <div style={{display:"grid",gridTemplateColumns:"60px repeat(7,1fr)"}}>
                <div style={{borderRight:"1px solid #ede9fe"}}/>
                {getWeekDates().map((d,i)=>{
                  const t=isToday(d.getFullYear(),d.getMonth(),d.getDate());
                  return (
                    <div key={i} style={{padding:"10px 6px",textAlign:"center",borderRight:"1px solid #ede9fe",borderBottom:"1px solid #ede9fe",cursor:"pointer"}} onClick={()=>openNew(toDateStr(d.getFullYear(),d.getMonth(),d.getDate()))}>
                      <div style={{fontSize:10,color:"#9d71ea",fontWeight:600,textTransform:"uppercase"}}>{DAYS[d.getDay()]}</div>
                      <div style={{width:28,height:28,borderRadius:"50%",background:t?"#7c3aed":"transparent",color:t?"white":"#1a1a2e",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:t?700:400,margin:"2px auto 0"}}>{d.getDate()}</div>
                    </div>
                  );
                })}
              </div>
              {Array.from({length:14},(_,hi)=>{
                const hour=hi+8;
                return (
                  <div key={hour} style={{display:"grid",gridTemplateColumns:"60px repeat(7,1fr)",borderBottom:"1px solid #f3f0ff"}}>
                    <div style={{padding:"4px 8px",fontSize:10,color:"#9d71ea",textAlign:"right",borderRight:"1px solid #ede9fe",paddingTop:8}}>{pad(hour)}:00</div>
                    {getWeekDates().map((d,di)=>{
                      const ds=toDateStr(d.getFullYear(),d.getMonth(),d.getDate());
                      const hourEvs=eventsForDate(ds).filter(e=>parseInt(e.time)===hour);
                      return (
                        <div key={di} style={{minHeight:52,borderRight:"1px solid #ede9fe",padding:"3px 4px",cursor:"pointer"}} onClick={()=>openNew(ds)}>
                          {hourEvs.map(ev=>{
                            const st=STATUS_CONFIG[ev.status],pl=PLATFORM_CONFIG[ev.platform];
                            return (
                              <div key={ev.id} className="ev-pill" style={{background:st.bg,color:st.text,borderLeftColor:st.color,marginBottom:2}} onClick={e=>{e.stopPropagation();openView(ev);}}>
                                <span style={{fontSize:10}}>{pl.icon}</span>{ev.title}
                                {ev.mediaFile&&<span style={{fontSize:9,opacity:.7}}>{ev.mediaFileType==="video"?"🎬":"🖼"}</span>}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* MODAL */}
      {modal&&(
        <div className="modal-overlay" onClick={()=>setModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <div style={{padding:"20px 24px 16px",borderBottom:"1px solid #f3f0ff",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:18,fontWeight:700,color:"#1a1a2e"}}>
                  {modal.mode==="view"?form.title||"Contenido":modal.mode==="new"?"✨ Nuevo contenido":"Editar contenido"}
                </div>
                {modal.mode==="view"&&(
                  <div style={{display:"flex",gap:6,marginTop:6,flexWrap:"wrap"}}>
                    <span className="chip" style={{background:STATUS_CONFIG[form.status].bg,color:STATUS_CONFIG[form.status].text,border:`1.5px solid ${STATUS_CONFIG[form.status].border}`}}>{STATUS_CONFIG[form.status].label}</span>
                    <span className="chip" style={{background:"#f5f3ff",color:"#7c3aed",border:"1.5px solid #e2d9f3"}}>{PLATFORM_CONFIG[form.platform].icon} {PLATFORM_CONFIG[form.platform].label}</span>
                    <span className="chip" style={{background:"#faf9ff",color:"#6b7280",border:"1.5px solid #e2d9f3"}}>{form.format}</span>
                    {form.mediaFile&&<span className="chip" style={{background:"#faf9ff",color:"#6b7280",border:"1.5px solid #e2d9f3"}}>{form.mediaFileType==="video"?"🎬 Video":"🖼️ Imagen"}</span>}
                  </div>
                )}
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {modal.mode==="view"&&(
                  <>
                    <button className="gcal-btn" onClick={()=>{exportToGoogleCalendar(form);showToast("📅 Exportado — importá el .ics en Google Calendar");}}>📅 Exportar</button>
                    <button className="btn" onClick={()=>setModal({mode:"edit"})} style={{background:"#f5f3ff",color:"#7c3aed",padding:"7px 14px",fontSize:13}}>Editar</button>
                  </>
                )}
                {modal.mode!=="new"&&<button className="btn" onClick={()=>deleteEvent(form.id)} style={{background:"#fff0f0",color:"#ef4444",padding:"7px 14px",fontSize:13}}>Eliminar</button>}
                <button className="btn" onClick={()=>setModal(null)} style={{background:"#f5f3ff",color:"#7c3aed",padding:"7px 12px",fontSize:16,lineHeight:1}}>✕</button>
              </div>
            </div>

            <div style={{padding:"20px 24px"}}>
              {modal.mode==="view" ? (
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  {form.cover&&<img src={form.cover} alt="Portada" style={{borderRadius:12,maxHeight:180,objectFit:"cover",width:"100%"}}/>}
                  {form.mediaFile&&(
                    <div style={{borderRadius:12,overflow:"hidden",border:"1.5px solid #e2d9f3"}}>
                      {form.mediaFileType==="video"
                        ? <video src={form.mediaFile} controls style={{width:"100%",maxHeight:240,background:"#000"}}/>
                        : <img src={form.mediaFile} alt={form.mediaFileName} style={{width:"100%",maxHeight:240,objectFit:"cover"}}/>
                      }
                      <div style={{padding:"6px 10px",fontSize:11,color:"#9d71ea",background:"#faf9ff"}}>{form.mediaFileType==="video"?"🎬":"🖼️"} {form.mediaFileName}</div>
                    </div>
                  )}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <div><label>Fecha y hora</label><div style={{fontSize:14,color:"#374151",background:"#faf9ff",padding:"8px 12px",borderRadius:10,border:"1.5px solid #e2d9f3"}}>{form.date} · {form.time}</div></div>
                    <div><label>Formato</label><div style={{fontSize:14,color:"#374151",background:"#faf9ff",padding:"8px 12px",borderRadius:10,border:"1.5px solid #e2d9f3"}}>{form.format}</div></div>
                  </div>
                  {form.copy&&<div><label>Copy</label><div style={{fontSize:14,color:"#374151",background:"#faf9ff",padding:"10px 12px",borderRadius:10,border:"1.5px solid #e2d9f3",whiteSpace:"pre-wrap"}}>{form.copy}</div></div>}
                  {form.script&&<div><label>Guion</label><div style={{fontSize:14,color:"#374151",background:"#faf9ff",padding:"10px 12px",borderRadius:10,border:"1.5px solid #e2d9f3",whiteSpace:"pre-wrap",maxHeight:200,overflow:"auto"}}>{form.script}</div></div>}
                </div>
              ) : (
                <div style={{display:"flex",flexDirection:"column",gap:16}}>
                  <div><label>Título *</label><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} placeholder="Ej: Reel sobre deseo sexual"/></div>

                  <div>
                    <label>Plataforma</label>
                    <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                      {Object.entries(PLATFORM_CONFIG).map(([k,v])=>(
                        <button key={k} className="plat-btn" onClick={()=>setForm(f=>({...f,platform:k}))} style={{background:form.platform===k?v.color:"white",color:form.platform===k?"white":"#374151",borderColor:form.platform===k?v.color:"#e2d9f3"}}>{v.icon} {v.label}</button>
                      ))}
                    </div>
                  </div>

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
                    <div><label>Fecha *</label><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))}/></div>
                    <div><label>Horario</label><input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))}/></div>
                  </div>

                  <div><label>Formato</label>
                    <select value={form.format} onChange={e=>setForm(f=>({...f,format:e.target.value}))}>
                      {FORMAT_OPTIONS.map(o=><option key={o}>{o}</option>)}
                    </select>
                  </div>

                  <div>
                    <label>Estado</label>
                    <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                      {Object.entries(STATUS_CONFIG).map(([k,v])=>(
                        <button key={k} className="status-btn" onClick={()=>setForm(f=>({...f,status:k}))} style={{background:form.status===k?v.bg:"white",color:form.status===k?v.text:"#6b7280",borderColor:form.status===k?v.color:"#e2d9f3"}}>{v.label}</button>
                      ))}
                    </div>
                  </div>

                  <div><label>Copy (caption)</label><textarea value={form.copy} onChange={e=>setForm(f=>({...f,copy:e.target.value}))} placeholder="El texto que vas a publicar..." rows={3} style={{resize:"vertical"}}/></div>
                  <div><label>Guion</label><textarea value={form.script} onChange={e=>setForm(f=>({...f,script:e.target.value}))} placeholder="El guion completo del video o post..." rows={4} style={{resize:"vertical"}}/></div>

                  {/* PORTADA */}
                  <div>
                    <label>Portada (thumbnail)</label>
                    <div className="drop-zone" style={{borderColor:"#c4b5fd",background:"#faf9ff"}} onClick={()=>coverRef.current.click()}>
                      {form.cover
                        ? <div style={{display:"flex",alignItems:"center",gap:10,justifyContent:"center"}}>
                            <img src={form.cover} alt="" style={{width:52,height:52,borderRadius:8,objectFit:"cover"}}/>
                            <span style={{fontSize:13,color:"#7c3aed"}}>{form.coverName}</span>
                            <button className="btn" style={{background:"#fff0f0",color:"#ef4444",padding:"2px 8px",fontSize:11}} onClick={e=>{e.stopPropagation();setForm(f=>({...f,cover:null,coverName:""}));}}>✕</button>
                          </div>
                        : <div><div style={{fontSize:22,marginBottom:4}}>🖼️</div><div style={{fontSize:13,color:"#9d71ea"}}>Clic para subir portada</div><div style={{fontSize:11,color:"#c4b5fd"}}>JPG, PNG, WebP</div></div>
                      }
                    </div>
                    <input ref={coverRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleCover}/>
                  </div>

                  {/* ARCHIVO DE CONTENIDO */}
                  <div>
                    <label>Archivo de contenido — video o foto</label>
                    <div className="drop-zone" style={{borderColor:"#a78bfa",background:"#faf9ff"}} onClick={()=>mediaRef.current.click()}>
                      {form.mediaFile
                        ? <div>
                            {form.mediaFileType==="video"
                              ? <video src={form.mediaFile} controls style={{width:"100%",maxHeight:180,borderRadius:8,background:"#000",marginBottom:8}}/>
                              : <img src={form.mediaFile} alt="" style={{maxHeight:160,borderRadius:8,objectFit:"cover",marginBottom:8,maxWidth:"100%"}}/>
                            }
                            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
                              <span style={{fontSize:13,color:"#7c3aed"}}>{form.mediaFileType==="video"?"🎬":"🖼️"} {form.mediaFileName}</span>
                              <button className="btn" style={{background:"#fff0f0",color:"#ef4444",padding:"2px 8px",fontSize:11}} onClick={e=>{e.stopPropagation();setForm(f=>({...f,mediaFile:null,mediaFileName:"",mediaFileType:""}));}}>✕</button>
                            </div>
                          </div>
                        : <div>
                            <div style={{fontSize:26,marginBottom:4}}>🎬</div>
                            <div style={{fontSize:13,color:"#9d71ea",fontWeight:500}}>Clic para subir el archivo final</div>
                            <div style={{fontSize:11,color:"#c4b5fd",marginTop:2}}>MP4, MOV, AVI · JPG, PNG, WebP</div>
                          </div>
                      }
                    </div>
                    <input ref={mediaRef} type="file" accept="video/*,image/*" style={{display:"none"}} onChange={handleMedia}/>
                  </div>

                  <div style={{display:"flex",gap:10,justifyContent:"flex-end",paddingTop:8}}>
                    <button className="btn" onClick={()=>setModal(null)} style={{background:"#f5f3ff",color:"#7c3aed",padding:"10px 20px"}}>Cancelar</button>
                    <button className="btn" onClick={saveEvent} style={{background:"linear-gradient(135deg,#7c3aed,#db2877)",color:"white",padding:"10px 24px",opacity:(!form.title||!form.date)?0.5:1}}>
                      {modal.mode==="new"?"✨ Agregar":"Guardar cambios"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
