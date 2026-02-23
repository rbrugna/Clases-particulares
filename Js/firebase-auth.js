// Firebase Auth integration for login/signup (uses shared firebase-config)
import { auth, PROFESSOR_EMAIL } from './firebase-config.js';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const roleModalEl = document.getElementById('roleModal');
  const roleModal = new bootstrap.Modal(roleModalEl, { backdrop: 'static', keyboard: false });
  const asAlumno = document.getElementById('asAlumno');
  const asProfesora = document.getElementById('asProfesora');
  const alumnoWrap = document.getElementById('alumnoWrap');
  const alumnoUser = document.getElementById('alumnoUser');
  const btnLoginAlumno = document.getElementById('btnLoginAlumno');
  const pwdWrap = document.getElementById('pwdWrap');
  const pwd = document.getElementById('pwd');
  const btnLoginProf = document.getElementById('btnLoginProf');

  // show modal
  roleModal.show();

  asAlumno.addEventListener('click', () => {
    alumnoWrap.style.display = 'block';
    alumnoUser.focus();
  });

  btnLoginAlumno.addEventListener('click', async () => {
    const name = alumnoUser.value.trim();
    if (!name) return alert('Ingresá tu nombre (se usará como usuario)');

    // ask for email+password via prompt (simple flow)
    const email = prompt('Ingresá tu email (se usará para crear cuenta):');
    if (!email) return;
    const password = prompt('Elegí una contraseña segura:');
    if (!password) return;

    try {
      // Try sign in first
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      // if user not found, create new
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(cred.user, { displayName: name });
      } catch (e) {
        return alert('Error creando cuenta: ' + e.message);
      }
    }

    // on success, set localStorage and redirect
    const u = auth.currentUser;
    const display = u.displayName || name || u.email.split('@')[0];
    localStorage.setItem('role', 'alumno');
    localStorage.setItem('username', display);
    roleModal.hide();
    window.location.href = 'reservar.html';
  });

  asProfesora.addEventListener('click', () => {
    pwdWrap.style.display = 'block';
    pwd.focus();
  });

  btnLoginProf.addEventListener('click', async () => {
    const password = pwd.value || prompt('Ingresá la contraseña de profesora:');
    if (!password) return;
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

  // If user already signed in (persisted), sync localStorage and redirect
  onAuthStateChanged(auth, (user) => {
    if (user) {
      const email = user.email || '';
      const display = user.displayName || email.split('@')[0];
      const role = (email === PROFESSOR_EMAIL) ? 'profesora' : localStorage.getItem('role') || 'alumno';
      localStorage.setItem('username', display);
      localStorage.setItem('role', role);
    }
  });
});
