// Js/firebase-auth.js
import { auth, PROFESSOR_EMAIL } from './firebase-config.js';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const roleModalEl = document.getElementById('roleModal');
  if (!roleModalEl) return;

  const roleModal = new bootstrap.Modal(roleModalEl, { backdrop: 'static', keyboard: false });

  const asAlumno = document.getElementById('asAlumno');
  const asProfesora = document.getElementById('asProfesora');

  const alumnoWrap = document.getElementById('alumnoWrap');
  const alumnoUser = document.getElementById('alumnoUser');
  const btnLoginAlumno = document.getElementById('btnLoginAlumno');

  const pwdWrap = document.getElementById('pwdWrap');
  const pwd = document.getElementById('pwd');
  const btnLoginProf = document.getElementById('btnLoginProf');

  roleModal.show();

  asAlumno.addEventListener('click', () => {
    alumnoWrap.style.display = 'block';
    pwdWrap.style.display = 'none';
    alumnoUser.focus();
  });

  btnLoginAlumno.addEventListener('click', async () => {
    const name = alumnoUser.value.trim();
    const emailEl = document.getElementById('alumnoEmail');
    const pwdEl = document.getElementById('alumnoPwd');

    const email = emailEl ? emailEl.value.trim() : '';
    const password = pwdEl ? pwdEl.value : '';

    if (!name) return alert('Ingresá tu nombre');
    if (!email) return alert('Ingresá tu email');
    if (!password) return alert('Ingresá una contraseña');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      if (auth.currentUser && !auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName: name });
      }
    } catch (err) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
      } catch (e) {
        return alert('Error creando cuenta: ' + e.message);
      }
    }

    const u = auth.currentUser;
    const display = (u && (u.displayName || (u.email ? u.email.split('@')[0] : name))) || name;

    localStorage.setItem('role', 'alumno');
    localStorage.setItem('username', display);
    roleModal.hide();
    window.location.href = 'reservar.html';
  });

  asProfesora.addEventListener('click', () => {
    pwdWrap.style.display = 'block';
    alumnoWrap.style.display = 'none';
    pwd.focus();
  });

  btnLoginProf.addEventListener('click', async () => {
    const password = pwd.value;
    if (!password) return alert('Ingresá la contraseña');

    try {
      await signInWithEmailAndPassword(auth, PROFESSOR_EMAIL, password);
      localStorage.setItem('role', 'profesora');
      localStorage.removeItem('username');
      roleModal.hide();
      window.location.href = 'agenda.html';
    } catch (e) {
      alert('Error iniciando sesión como profesora: ' + e.message);
    }
  });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      const email = user.email || '';
      const display = user.displayName || email.split('@')[0];
      const role = (email === PROFESSOR_EMAIL) ? 'profesora' : (localStorage.getItem('role') || 'alumno');
      localStorage.setItem('username', display);
      localStorage.setItem('role', role);
    }
  });
});