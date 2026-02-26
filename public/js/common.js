import { auth, db } from "./firebase.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-auth.js";
import { doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.4/firebase-firestore.js";

export function pad2(n){ return String(n).padStart(2,"0"); }
export function toISODate(y,m,d){ return `${y}-${pad2(m+1)}-${pad2(d)}`; }
export function fromISODate(iso){
  const [y,mm,dd] = iso.split("-").map(Number);
  return new Date(y, mm-1, dd);
}
export function monthTitle(date){
  const fmt = new Intl.DateTimeFormat("es-AR", { month:"long", year:"numeric" });
  const t = fmt.format(date);
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export function minutes(hhmm){
  const [h,m] = hhmm.split(":").map(Number);
  return h*60 + m;
}
export function hhmm(min){
  const h = Math.floor(min/60);
  const m = min%60;
  return `${pad2(h)}:${pad2(m)}`;
}
export function overlap(aStart,aEnd,bStart,bEnd){
  return Math.max(aStart,bStart) < Math.min(aEnd,bEnd);
}

export async function ensureUserProfile(uid, displayName){
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if(!snap.exists()){
    await setDoc(ref, { displayName: displayName || "", createdAt: new Date().toISOString() });
  }
}
export async function getMyRole(uid){
  const ref = doc(db, "roles", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data().role : null;
}

export function onAuth(cb){ return onAuthStateChanged(auth, cb); }
export async function logout(){ await signOut(auth); }

export function renderCalendarGrid(container, viewDate, selectedISO, metaResolver, onSelectISO){
  container.innerHTML = "";

  const dows = ["L","M","M","J","V","S","D"];
  for(const d of dows){
    const el = document.createElement("div");
    el.className = "day day--muted";
    el.style.minHeight = "42px";
    el.style.cursor = "default";
    el.innerHTML = `<div class="day__num">${d}</div>`;
    container.appendChild(el);
  }

  const y = viewDate.getFullYear();
  const m = viewDate.getMonth();
  const first = new Date(y,m,1);
  const last = new Date(y,m+1,0);
  const daysInMonth = last.getDate();
  const firstDow = (first.getDay() + 6) % 7;

  for(let i=0;i<firstDow;i++){
    const el = document.createElement("div");
    el.className = "day day--muted";
    el.style.cursor = "default";
    container.appendChild(el);
  }

  for(let d=1; d<=daysInMonth; d++){
    const iso = toISODate(y,m,d);
    const meta = metaResolver ? metaResolver(iso) : "";

    const el = document.createElement("div");
    el.className = "day";
    if(selectedISO === iso) el.classList.add("day--selected");
    if(meta?.includes("disp")) el.classList.add("day--hasSlots");
    if(meta?.includes("reserva")) el.classList.add("day--hasBookings");

    el.innerHTML = `
      <div class="day__num">${d}</div>
      <div class="day__meta">${meta || ""}</div>
    `;
    el.addEventListener("click", () => onSelectISO(iso));
    container.appendChild(el);
  }

  while(container.children.length % 7 !== 0){
    const el = document.createElement("div");
    el.className = "day day--muted";
    el.style.cursor = "default";
    container.appendChild(el);
  }
}