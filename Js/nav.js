// Js/nav.js
import { auth, PROFESSOR_EMAIL } from './firebase-config.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';

function renderNav(role, username) {
  const nav = document.getElementById('mainNav');
  if (!nav) return;

  if (role === 'alumno') {
    nav.innerHTML = `
      <a href="index.html">Inicio</a>
      <a href="reservar.html">Reservar</a>
      <a href="chat.html">Mensajes</a>
      <a href="#" id="logout">Cerrar sesión (${username || 'Alumno'})</a>
    `;
  } else if (role === 'profesora') {
    nav.innerHTML = `
      <a href="index.html">Inicio</a>
      <a href="agenda.html">Agenda</a>
      <a href="chat.html">Mensajes</a>
      <a href="#" id="logout">Cerrar sesión</a>
    `;
  } else {
    nav.innerHTML = `
      <a href="index.html">Inicio</a>
      <a href="reservar.html">Reservar</a>
    `;
  }

  const logout = document.getElementById('logout');
  if (logout) {
    logout.addEventListener('click', async (e) => {
      e.preventDefault();
      localStorage.removeItem('role');
      localStorage.removeItem('username');
      try { await signOut(auth); } catch {}
      window.location.href = 'index.html';
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderNav(localStorage.getItem('role'), localStorage.getItem('username'));

  onAuthStateChanged(auth, (user) => {
    if (!user) {
      renderNav(null, null);
      return;
    }
    const username = user.displayName || user.email.split('@')[0];
    const role = (user.email === PROFESSOR_EMAIL) ? 'profesora' : 'alumno';
    localStorage.setItem('username', username);
    localStorage.setItem('role', role);
    renderNav(role, username);
  });
});