// Js/guard.js
import { auth, PROFESSOR_EMAIL } from './firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';

export function requireRole(requiredRole) {
  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        alert('Tenés que iniciar sesión.');
        window.location.href = 'index.html';
        return;
      }
      const actualRole = (user.email === PROFESSOR_EMAIL) ? 'profesora' : 'alumno';
      if (actualRole !== requiredRole) {
        alert('Acceso restringido.');
        window.location.href = 'index.html';
        return;
      }
      resolve(user);
    });
  });
}