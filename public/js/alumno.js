import { auth, db, fx } from "./firebase.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import {
  collection, doc, getDoc, setDoc, addDoc,
  query, where, onSnapshot, updateDoc,
  serverTimestamp, getDocs
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

import { httpsCallable } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-functions.js";

import {
  ensureUserProfile, getMyRole, logout,
  monthTitle, renderCalendarGrid, fromISODate,
  minutes, hhmm, overlap
} from "./common.js";

const els = {
  authCard: document.getElementById("authCard"),
  appCard: document.getElementById("appCard"),
  displayName: document.getElementById("displayName"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  btnLogin: document.getElementById("btnLogin"),
  btnRegister: document.getElementById("btnRegister"),
  authMsg: document.getElementById("authMsg"),
  btnLogout: document.getElementById("btnLogout"),

  prevMonth: document.getElementById("prevMonth"),
  nextMonth: document.getElementById("nextMonth"),
  monthTitle: document.getElementById("monthTitle"),
  calendarGrid: document.getElementById("calendarGrid"),

  selectedDate: document.getElementById("selectedDate"),
  duration: document.getElementById("duration"),
  subject: document.getElementById("subject"),
  slotsList: document.getElementById("slotsList"),
  slotsEmpty: document.getElementById("slotsEmpty"),

  myBookings: document.getElementById("myBookings"),
  myBookingsEmpty: document.getElementById("myBookingsEmpty")
};

let viewDate = new Date();
let selectedISO = null;
let currentUser = null;

function todayISO(){
  const d = new Date();
  const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
  return `${y}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}

async function ensureRoleStudent(uid){
  const roleRef = doc(db, "roles", uid);
  const snap = await getDoc(roleRef);
  if(!snap.exists()){
    await setDoc(roleRef, { role: "student" });
  }
}

async function loadAvailability(dateISO){
  const ref = doc(db, "availability", dateISO);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data().blocks || []) : [];
}

async function loadActiveBookingsForDate(dateISO){
  const qy = query(
    collection(db, "bookings"),
    where("date", "==", dateISO),
    where("status", "==", "active")
  );
  const snap = await getDocs(qy);
  return snap.docs.map(d => ({ id:d.id, ...d.data() }));
}

function computeSlots(blocks, bookings, durationMin){
  const step = 30; // cada 30 min
  const out = [];

  const busy = bookings.map(b => ({ s: minutes(b.start), e: minutes(b.end) }));

  for(const bl of blocks){
    const bs = minutes(bl.start);
    const be = minutes(bl.end);

    for(let start = bs; start + durationMin <= be; start += step){
      const end = start + durationMin;
      const collides = busy.some(x => overlap(start,end,x.s,x.e));
      if(!collides) out.push({ start: hhmm(start), end: hhmm(end) });
    }
  }
  return out;
}

async function renderSlots(){
  els.slotsList.innerHTML = "";
  els.slotsEmpty.textContent = "";

  if(!selectedISO){
    els.slotsEmpty.textContent = "Seleccioná un día.";
    return;
  }

  const durationMin = Number(els.duration.value);
  const subj = els.subject.value.trim();
  if(!subj){
    els.slotsEmpty.textContent = "Escribí la materia/tema para reservar.";
  }

  const blocks = await loadAvailability(selectedISO);
  const bookings = await loadActiveBookingsForDate(selectedISO);

  const possible = computeSlots(blocks, bookings, durationMin);

  if(possible.length === 0){
    els.slotsEmpty.textContent = "No hay horarios disponibles para esa duración.";
    return;
  }

  for(const s of possible){
    const row = document.createElement("div");
    row.className = "slot";
    row.innerHTML = `
      <div>
        <div class="slot__time">${s.start} → ${s.end}</div>
        <div class="small muted">Disponible</div>
      </div>
      <button class="btn">Reservar</button>
    `;
    row.querySelector("button").addEventListener("click", async () => {
      const subject = els.subject.value.trim();
      if(!subject) return alert("Poné la materia/tema.");

      const userSnap = await getDoc(doc(db,"users",currentUser.uid));
      const studentName = userSnap.exists() ? (userSnap.data().displayName || "") : "";

      await addDoc(collection(db, "bookings"), {
        date: selectedISO,
        start: s.start,
        end: s.end,
        durationMin,
        subject,
        studentUid: currentUser.uid,
        studentName,
        status: "active",
        createdAt: serverTimestamp()
      });

      // WhatsApp (no rompe la reserva si falla)
      try{
        const notify = httpsCallable(fx, "notifyTeacherWhatsApp");
        await notify({ date: selectedISO, start: s.start, end: s.end, durationMin, subject });
      }catch(e){
        console.warn("WhatsApp notify failed:", e?.message);
      }

      alert("✅ Reserva confirmada.");
    });

    els.slotsList.appendChild(row);
  }
}

function drawCalendar(){
  els.monthTitle.textContent = monthTitle(viewDate);
  renderCalendarGrid(
    els.calendarGrid,
    viewDate,
    selectedISO,
    () => "",
    async (iso) => {
      selectedISO = iso;
      const d = fromISODate(iso);
      const fmt = new Intl.DateTimeFormat("es-AR",{ weekday:"long", day:"2-digit", month:"long" });
      const t = fmt.format(d);
      els.selectedDate.textContent = t.charAt(0).toUpperCase() + t.slice(1);
      await renderSlots();
    }
  );
}

function listenMyBookings(){
  const qy = query(collection(db, "bookings"), where("studentUid","==",currentUser.uid));
  onSnapshot(qy, (snap) => {
    const arr = snap.docs
      .map(d => ({ id:d.id, ...d.data() }))
      .sort((a,b) => (a.date+a.start).localeCompare(b.date+b.start));

    els.myBookings.innerHTML = "";
    els.myBookingsEmpty.textContent = arr.length ? "" : "Aún no tenés reservas.";

    for(const b of arr){
      const row = document.createElement("div");
      row.className = "slot";
      row.innerHTML = `
        <div>
          <div class="slot__time">${b.date} • ${b.start} → ${b.end}</div>
          <div class="small muted">${b.subject} • ${b.durationMin} min • Estado: ${b.status}</div>
        </div>
        <button class="btn btn--ghost" ${b.status !== "active" ? "disabled" : ""}>Cancelar</button>
      `;
      row.querySelector("button").addEventListener("click", async () => {
        if(!confirm("¿Cancelar esta reserva?")) return;
        await updateDoc(doc(db,"bookings",b.id), {
          status: "canceled",
          canceledAt: new Date().toISOString(),
          canceledBy: "student"
        });
      });
      els.myBookings.appendChild(row);
    }

    if(selectedISO) renderSlots();
  });
}

els.btnLogin.addEventListener("click", async () => {
  try{
    await signInWithEmailAndPassword(auth, els.email.value.trim(), els.password.value);
    els.authMsg.textContent = "";
  }catch(e){
    els.authMsg.textContent = e.message;
  }
});

els.btnRegister.addEventListener("click", async () => {
  try{
    const name = els.displayName.value.trim();
    if(!name) return alert("Poné tu nombre y apellido.");
    const cred = await createUserWithEmailAndPassword(auth, els.email.value.trim(), els.password.value);
    await ensureUserProfile(cred.user.uid, name);
    await ensureRoleStudent(cred.user.uid);
    els.authMsg.textContent = "✅ Cuenta creada.";
  }catch(e){
    els.authMsg.textContent = e.message;
  }
});

els.btnLogout.addEventListener("click", logout);
els.prevMonth.addEventListener("click", () => { viewDate.setMonth(viewDate.getMonth()-1); drawCalendar(); });
els.nextMonth.addEventListener("click", () => { viewDate.setMonth(viewDate.getMonth()+1); drawCalendar(); });
els.duration.addEventListener("change", renderSlots);

onAuthStateChanged(auth, async (user) => {
  if(!user){
    els.authCard.style.display = "block";
    els.appCard.style.display = "none";
    return;
  }
  currentUser = user;

  const role = await getMyRole(user.uid);
  if(role !== "student"){
    els.authMsg.textContent = "Tu cuenta no es de alumno/a.";
    return;
  }

  els.authCard.style.display = "none";
  els.appCard.style.display = "block";

  if(!selectedISO){
    selectedISO = todayISO();
    els.selectedDate.textContent = selectedISO;
  }
  drawCalendar();
  listenMyBookings();
  await renderSlots();
});