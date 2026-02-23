document.addEventListener('DOMContentLoaded', async () => {
  const BIN_URL = 'https://api.jsonbin.io/v3/b/68f0f6a643b1c97be96b69df';
  const API_KEY = '$2a$10$/T.XxMX2A.Je1VsMGPe/0eAPVYhZMxoBFq3uITc43uPFDkEF8aNm6';

  const role = localStorage.getItem('role');
  const username = localStorage.getItem('username') || null;

  const root = document.getElementById('chatRoot');

  async function load() {
    const res = await fetch(BIN_URL, { headers: { 'X-Master-Key': API_KEY } });
    const data = await res.json();
    return data.record || {};
  }

  async function save(record) {
    await fetch(BIN_URL.replace('/latest',''), {
      method: 'PUT', headers: { 'Content-Type':'application/json','X-Master-Key':API_KEY }, body: JSON.stringify(record)
    });
  }

  const data = await load();
  const messages = data.messages || [];

  function renderStudentThread(student) {
    const thread = messages.filter(m => m.participant === student);
    const container = document.createElement('div');
    container.className = 'p-3';
    const list = document.createElement('div');
    list.style.maxHeight = '50vh'; list.style.overflow = 'auto';
    thread.forEach(m => {
      const b = document.createElement('div');
      b.className = m.authorUser === student ? 'text-end mb-2' : 'text-start mb-2';
      b.innerHTML = `<div class="d-inline-block p-2 rounded" style="background:${m.authorUser===student? '#e9f6ff':'#fff3b0'}">` +
        `<strong>${m.author}</strong><br>${m.text}<br><small class="text-muted">${new Date(m.ts).toLocaleString()}</small>` +
        `</div>`;
      list.appendChild(b);
    });
    container.appendChild(list);

    const form = document.createElement('div');
    form.className = 'mt-3';
    form.innerHTML = `
      <textarea id="msgText" class="form-control" rows="3" placeholder="Escribir mensaje..."></textarea>
      <div class="text-end mt-2"><button id="sendBtn" class="btn btn-primary">Enviar</button></div>
    `;
    container.appendChild(form);

    container.querySelector('#sendBtn').addEventListener('click', async () => {
      const text = container.querySelector('#msgText').value.trim();
      if (!text) return alert('Escribí un mensaje');
      const author = role === 'profesora' ? 'Profesora Cynthia' : username;
      const authorUser = role === 'profesora' ? 'profesora' : username;
      const msg = { author, authorUser, text, ts: new Date().toISOString(), participant: student };
      messages.push(msg);
      data.messages = messages;
      await save(data);
      container.querySelector('#msgText').value = '';
      root.innerHTML = '';
      init();
    });

    return container;
  }

  async function init() {
    root.innerHTML = '';
    if (role === 'profesora') {
      // list participants (students)
      const participants = Array.from(new Set(messages.map(m => m.participant))).filter(Boolean);
      const wrap = document.createElement('div');
      wrap.className = 'd-flex gap-3';
      const list = document.createElement('div'); list.style.minWidth='180px';
      list.className = 'p-2';
      list.innerHTML = '<h5>Conversaciones</h5>';
      participants.forEach(p => {
        const btn = document.createElement('button');
        btn.className = 'btn btn-outline-secondary mb-2 w-100';
        btn.textContent = p;
        btn.addEventListener('click', () => {
          right.innerHTML = '';
          right.appendChild(renderStudentThread(p));
        });
        list.appendChild(btn);
      });
      const right = document.createElement('div'); right.className='flex-grow-1 p-2';
      wrap.appendChild(list); wrap.appendChild(right);
      root.appendChild(wrap);
      if (participants.length>0) right.appendChild(renderStudentThread(participants[0]));
    } else if (role === 'alumno') {
      if (!username) { alert('Necesitas iniciar sesión como alumno'); window.location.href='index.html'; return; }
      const threadEl = renderStudentThread(username);
      root.appendChild(threadEl);
    } else {
      alert('Acceso denegado'); window.location.href='index.html';
    }
  }

  await init();
});
