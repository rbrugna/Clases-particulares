import { auth, db } from "./firebase.js";
import {
  signInWithEmailAndPassword,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";

import {
  doc, getDoc, setDoc, updateDoc,
  collection, query, where, onSnapshot,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

import { getMyRole, logout, monthTitle, renderCalendarGrid, fromISODate } from "./common.js";

const els = {
  authCard: document.getElementById("authCard"),
  appCard: document.getElementById("appCard"),
  email: document.getElementById("email"),
  password: document.getElementById("password"),
  btnLogin: document.getElementById("btnLogin"),
  authMsg: document.getElementById("authMsg"),
  btnLogout: document.getElementById("btnLogout"),

  prevMonth: document.getElementById("prevMonth"),
  nextMonth: document.getElementById("nextMonth"),
  monthTitle: document.getElementById("monthTitle"),
  calendarGrid: document.getElementById("calendarGrid"),
  selectedDate: document.getElementById("selectedDate"),

  blockStart: document.getElementById("blockStart"),
  blockEnd: document.getElementById("blockEnd"),
  btnAddBlock: document.getElementById("btnAddBlock"),

  blocksList: document.getElementById("blocksList"),
  blocksEmpty: document.getElementById("blocksEmpty"),

  dayBookings: document.getElementById("dayBookings"),
  dayBookingsEmpty: document.getElementById("dayBookingsEmpty")
};

let viewDate = new Date();
let selectedISO = null;
let unsubBookings = null;

function todayISO(){
  const d = new Date();
  const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
  return `${y}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
}

// (solo para setear una vez si querés) -> mejor hacerlo manual en Firestore roles/{uid}
async function ensureTeacherRole(uid){
  const ref = doc(db, "roles", uid);
  const snap = await getDoc(ref);
  if(!snap.exists()){
    await setDoc(ref, { role: "teacher" });
  }
}

async function getBlocks(dateISO){
  const ref = doc(db, "availability", dateISO);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data().blocks || []) : [];
}

async function setBlocks(dateISO, blocks){
  const ref = doc(db, "availability", dateISO);
  const snap = await getDoc(ref);
  if(!snap.exists()){
    await setDoc(ref, { blocks, updatedAt: serverTimestamp() });
  }else{
    await updateDoc(ref, { blocks, updatedAt: serverTimestamp() });
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
      await renderBlocks();
      listenDayBookings();
    }
  );
}

async function renderBlocks(){
  els.blocksList.innerHTML = "";
  els.blocksEmpty.textContent = "";

  if(!selectedISO){
    els.blocksEmpty.textContent = "Seleccioná un día.";
    return;
  }

  const blocks = await getBlocks(selectedISO);
  if(blocks.length === 0){
    els.blocksEmpty.textContent = "No hay bloques cargados.";
    return;
  }

  blocks.forEach((b, idx) => {
    const row = document.createElement("div");
    row.className = "slot";
    row.innerHTML = `
      <div>
        <div class="slot__time">${b.start} → ${b.end}</div>
        <div class="small muted">Bloque disponible</div>
      </div>
      <button class="btn btn--ghost">Eliminar</button>
    `;
    row.querySelector("button").addEventListener("click", async () => {
      const next = blocks.filter((_,i)=>i!==idx);
      await setBlocks(selectedISO, next);
      await renderBlocks();
    });
    els.blocksList.appendChild(row);
  });
}

function listenDayBookings(){
  if(unsubBookings) unsubBookings();

  if(!selectedISO){
    els.dayBookingsEmpty.textContent = "Seleccioná un día.";
    return;
  }

  const qy = query(collection(db, "bookings"), where("date","==",selectedISO));
  unsubBookings = onSnapshot(qy, (snap) => {
    const arr = snap.docs.map(d => ({ id:d.id, ...d.data() }))
      .sort((a,b)=>a.start.localeCompare(b.start));

    els.dayBookings.innerHTML = "";
    els.dayBookingsEmpty.textContent = arr.length ? "" : "No hay reservas ese día.";

    for(const b of arr){
      const row = document.createElement("div");
      row.className = "slot";
      row.innerHTML = `
        <div>
          <div class="slot__time">${b.start} → ${b.end} • ${b.durationMin} min</div>
          <div class="small muted">${b.studentName || "Alumno"} • ${b.subject} • Estado: ${b.status}</div>
        </div>
        <button class="btn btn--ghost" ${b.status!=="active"?"disabled":""}>Cancelar</button>
      `;
      row.querySelector("button").addEventListener("click", async () => {
        if(!confirm("¿Cancelar esta reserva?")) return;
        await updateDoc(doc(db,"bookings",b.id), {
          status: "canceled",
          canceledAt: new Date().toISOString(),
          canceledBy: "teacher"
        });
      });
      els.dayBookings.appendChild(row);
    }
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

els.btnLogout.addEventListener("click", logout);
els.prevMonth.addEventListener("click", () => { viewDate.setMonth(viewDate.getMonth()-1); drawCalendar(); });
els.nextMonth.addEventListener("click", () => { viewDate.setMonth(viewDate.getMonth()+1); drawCalendar(); });

els.btnAddBlock.addEventListener("click", async () => {
  if(!selectedISO) return alert("Seleccioná un día.");
  const start = els.blockStart.value;
  const end = els.blockEnd.value;
  if(!start || !end) return alert("Completá inicio y fin.");
  if(end <= start) return alert("El fin debe ser mayor al inicio.");

  const blocks = await getBlocks(selectedISO);
  blocks.push({ start, end });
  blocks.sort((a,b)=>a.start.localeCompare(b.start));
  await setBlocks(selectedISO, blocks);

  els.blockStart.value = "";
  els.blockEnd.value = "";
  await renderBlocks();
});

onAuthStateChanged(auth, async (user) => {
  if(!user){
    els.authCard.style.display = "block";
    els.appCard.style.display = "none";
    return;
  }

  const role = await getMyRole(user.uid);
  if(role !== "teacher"){
    try {
      // crear el rol de profesora en el primer login
      await ensureTeacherRole(user.uid);
      els.authMsg.textContent = "✅ Rol creado. Recarga la página.";
      await logout();
    } catch(e) {
      els.authMsg.textContent = `Error al crear rol: ${e.message}`;
      await logout();
    }
    return;
  }

  els.authCard.style.display = "none";
  els.appCard.style.display = "block";

  if(!selectedISO) selectedISO = todayISO();
  drawCalendar();
  await renderBlocks();
  listenDayBookings();
});