// Js/utils.js
export function dayNameFromNumber(n) {
  const arr = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
  return arr[n];
}

export function getISOWeekNumber(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
}

export function showToast(texto, tipo = "exito") {
  const mensaje = document.getElementById("mensaje");
  if (!mensaje) return;
  mensaje.textContent = texto;
  mensaje.className = `mensaje ${tipo} mostrar`;
  setTimeout(() => mensaje.classList.remove("mostrar"), 3000);
}