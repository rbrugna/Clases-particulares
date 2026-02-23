// Chat using Firebase Firestore (modular SDK) - uses shared firebase-config
import { db, auth, PROFESSOR_EMAIL } from './firebase-config.js';
import {
  collection, query, where, orderBy,
  onSnapshot, addDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Determine authenticated user via Firebase Auth when possible
  let role = localStorage.getItem('role');
  let username = localStorage.getItem('username');

  onAuthStateChanged(auth, (user) => {
    if (user) {
      username = user.displayName || user.email.split('@')[0];
      // if user email matches professor, set role
      if (user.email === PROFESSOR_EMAIL) role = 'profesora';
      else role = 'alumno';
      localStorage.setItem('username', username);
      localStorage.setItem('role', role);
    }
  });
  const root = document.getElementById('chatRoot');

  if (!role) { alert('Debes entrar como alumno o profesora'); window.location.href='index.html'; return; }

  // Helper: build chat UI for a participant
  function buildThread(participant) {
    const container = document.createElement('div'); container.className='p-3';
    const list = document.createElement('div'); list.style.maxHeight='60vh'; list.style.overflow='auto';
    const form = document.createElement('div'); form.className='mt-3';

    const textarea = document.createElement('textarea'); textarea.className='form-control'; textarea.rows=3; textarea.placeholder='Escribir mensaje...';
    const sendBtn = document.createElement('button'); sendBtn.className='btn btn-primary mt-2'; sendBtn.textContent='Enviar';
    form.appendChild(textarea); form.appendChild(sendBtn);
    container.appendChild(list); container.appendChild(form);

    // Realtime listener for this participant
    const q = query(collection(db,'messages'), where('participant','==',participant), orderBy('ts'));
    const unsubscribe = onSnapshot(q, snap => {
      list.innerHTML='';
      snap.forEach(doc => {
        const m = doc.data();
        const b = document.createElement('div');
        b.className = (m.authorUser === username) ? 'text-end mb-2' : 'text-start mb-2';
        const bubble = document.createElement('div'); bubble.className='chat-bubble';
        bubble.style.background = (m.authorUser === username) ? '#e9f6ff' : '#fff3b0';
        bubble.innerHTML = `<strong>${m.author}</strong><div>${m.text}</div><small class="text-muted">${new Date(m.ts?.toDate ? m.ts.toDate() : m.ts).toLocaleString()}</small>`;
        b.appendChild(bubble);
        list.appendChild(b);
      });
      list.scrollTop = list.scrollHeight;
    });

    sendBtn.addEventListener('click', async () => {
      const text = textarea.value.trim(); if(!text) return;
      const author = role === 'profesora' ? 'Profesora Cynthia' : username;
      const authorUser = role === 'profesora' ? 'profesora' : username;
      const authorEmail = (auth && auth.currentUser && auth.currentUser.email) ? auth.currentUser.email : null;
      await addDoc(collection(db,'messages'), { participant, author, authorUser, authorEmail, text, ts: serverTimestamp() });
      textarea.value = '';
    });

    return { el: container, unsubscribe };
  }

  if (role === 'profesora') {
    // professor: list participants and show thread when clicked
    const participantsSet = new Set();
    const qAll = query(collection(db,'messages'), orderBy('ts'));
    const left = document.createElement('div'); left.className='chat-left p-2';
    const right = document.createElement('div'); right.className='chat-right p-2';
    left.innerHTML = '<h5>Conversaciones</h5>';
    root.appendChild(left); root.appendChild(right);

    // Listen all messages to get participants list in realtime
    onSnapshot(qAll, snap => {
      participantsSet.clear();
      snap.forEach(doc => { const d = doc.data(); if (d.participant) participantsSet.add(d.participant); });
      left.innerHTML = '<h5>Conversaciones</h5>';
      participantsSet.forEach(p => {
        const btn = document.createElement('button'); btn.className='btn btn-outline-secondary mb-2 w-100'; btn.textContent = p;
        btn.addEventListener('click', async () => {
          right.innerHTML='';
          const thread = buildThread(p);
          right.appendChild(thread.el);
        });
        left.appendChild(btn);
      });
    });

  } else {
    // alumno: show only their thread
    if (!username) { alert('Necesitas iniciar sesión como alumno'); window.location.href='index.html'; return; }
    const thread = buildThread(username);
    root.appendChild(thread.el);
  }
});
