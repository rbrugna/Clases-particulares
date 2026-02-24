document.addEventListener("DOMContentLoaded", async function () {
    // role protection: only allow profesora here
    const role = localStorage.getItem('role');
    if (role !== 'profesora') {
        alert('Acceso restringido: esta página es para la profesora.');
        window.location.href = 'index.html';
        return;
    }
    const form = document.getElementById("form-turno");
    const tabla = document.getElementById("tabla-turnos");
    const mensaje = document.getElementById("mensaje");

    const BIN_URL = "https://api.jsonbin.io/v3/b/68f0f6a643b1c97be96b69df"; 
    const API_KEY = "$2a$10$/T.XxMX2A.Je1VsMGPe/0eAPVYhZMxoBFq3uITc43uPFDkEF8aNm6"; 
    let turnos = [];

    async function cargarTurnos() {
    const res = await fetch(BIN_URL, {
        headers: { "X-Master-Key": API_KEY }
    });
    const data = await res.json();
    turnos = data.record.turnos || [];
    // messages may exist
    window.__messages = data.record.messages || [];
    mostrarTurnos();
    // render professor calendar after loading
    try { renderProfessorCalendar(); } catch(e){ /* ignore if UI missing */ }
    }

    async function saveRecord() {
    const current = await (await fetch(BIN_URL, { headers: { "X-Master-Key": API_KEY } })).json();
    const record = current.record || {};
    record.turnos = turnos;
    record.messages = window.__messages || [];
    await fetch(BIN_URL, {
        method: "PUT",
        headers: {
        "Content-Type": "application/json",
        "X-Master-Key": API_KEY
        },
        body: JSON.stringify(record)
    });
    }

    function mostrarMensaje(texto, tipo = "exito") {
    mensaje.textContent = texto;
    mensaje.className = `mensaje ${tipo} mostrar`;
    setTimeout(() => mensaje.classList.remove("mostrar"), 3000);
    } 

    function mostrarTurnos() {
    tabla.innerHTML = "";

    if (turnos.length === 0) {
        tabla.innerHTML = "<tr><td colspan='5'>No hay horarios cargados.</td></tr>";
        return;
    }

    // Professor calendar rendering
    function nameFromNumber(n) {
        const arr = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
        return arr[n];
    }

    function renderProfessorCalendar() {
        const calendarEl = document.getElementById('calendarProf');
        const prev = document.getElementById('prevMonthProf');
        const next = document.getElementById('nextMonthProf');
        const monthSelect = document.getElementById('monthSelectProf');
        const yearSelect = document.getElementById('yearSelectProf');
        const mesAnio = document.getElementById('mesAnioProf');
        const timesWrap = document.getElementById('timesWrapProf');
        const timesList = document.getElementById('timesListProf');
        const fechaProfText = document.getElementById('fechaProfText');
        const nuevaHora = document.getElementById('nuevaHoraProf');
        const addBtn = document.getElementById('addTimeProf');

        if (!calendarEl) return;

        const today = new Date();
        let displayedMonth = today.getMonth();
        let displayedYear = today.getFullYear();

        // populate selectors
        const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        monthSelect.innerHTML = '';
        monthNames.forEach((m,i)=>{ const o=document.createElement('option'); o.value=i; o.textContent=m; monthSelect.appendChild(o); });
        monthSelect.value = displayedMonth;

        yearSelect.innerHTML = '';
        const startYear = displayedYear - 5;
        for (let y = startYear; y <= displayedYear + 2; y++) { const o=document.createElement('option'); o.value=y; o.textContent=y; yearSelect.appendChild(o); }
        yearSelect.value = displayedYear;

        function getISOWeekNumber(d) {
            const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            const dayNum = date.getUTCDay() || 7;
            date.setUTCDate(date.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
            return Math.ceil((((date - yearStart) / 86400000) + 1)/7);
        }

        function render() {
            const first = new Date(displayedYear, displayedMonth, 1);
            mesAnio.textContent = `${first.toLocaleString('es-ES',{month:'long'})} ${first.getFullYear()}`;
            calendarEl.innerHTML = '';

            // header row
            const headerRow = document.createElement('div'); headerRow.className = 'calendar-grid';
            const weekLabel = document.createElement('div'); weekLabel.className = 'calendar-weeklabel'; weekLabel.textContent = 'Wk'; headerRow.appendChild(weekLabel);
            ['D','L','M','M','J','V','S'].forEach(ch=>{ const h=document.createElement('div'); h.style.textAlign='center'; h.textContent=ch; headerRow.appendChild(h); });
            calendarEl.appendChild(headerRow);

            const startDay = first.getDay();
            const daysInMonth = new Date(first.getFullYear(), first.getMonth()+1, 0).getDate();
            const weeks = Math.ceil((startDay + daysInMonth) / 7);
            let selectedProfDate = null;

            for (let w = 0; w < weeks; w++) {
                const row = document.createElement('div'); row.className = 'calendar-grid';
                const weekStartIndex = w * 7 - startDay + 1;
                let refDay = weekStartIndex; if (refDay < 1) refDay = 1; if (refDay > daysInMonth) refDay = daysInMonth;
                const refDate = new Date(first.getFullYear(), first.getMonth(), refDay);
                const wkNo = getISOWeekNumber(refDate);

                const wkCell = document.createElement('div'); wkCell.className = 'calendar-weeknum'; wkCell.textContent = wkNo; row.appendChild(wkCell);

                for (let d = 0; d < 7; d++) {
                    const dayNumber = w * 7 + d - startDay + 1;
                    if (dayNumber < 1 || dayNumber > daysInMonth) { const empty=document.createElement('div'); empty.className='calendar-cell'; empty.style.visibility='hidden'; row.appendChild(empty); continue; }

                    const cell = document.createElement('div'); cell.className='calendar-cell';
                    const dateObj = new Date(first.getFullYear(), first.getMonth(), dayNumber);
                    const weekday = nameFromNumber(dateObj.getDay());
                    const byDate = turnos.filter(t => t.fecha && (new Date(t.fecha)).toDateString() === dateObj.toDateString());
                    const byWeekday = turnos.filter(t => !t.fecha && t.dia === weekday);
                    if (byDate.length>0 || byWeekday.length>0) cell.classList.add('has-available');
                    const now = new Date(); if (dateObj.toDateString() === now.toDateString()) cell.classList.add('today');

                    cell.textContent = dayNumber;
                    cell.addEventListener('click', ()=>{
                        selectedProfDate = dateObj;
                        const wk = getISOWeekNumber(dateObj);
                        fechaProfText.textContent = `${weekday} ${dayNumber}/${first.getMonth()+1}/${first.getFullYear()} — Semana ${wk}`;
                        timesList.innerHTML='';
                        const all = byDate.concat(byWeekday.map((t,idx)=> ({...t, idx: turnos.indexOf(t)})));
                        all.forEach(t=>{ const el=document.createElement('div'); el.textContent = `${t.hora} — ${t.alumno || 'Libre'}`; timesList.appendChild(el); });
                        timesWrap.style.display='block';
                    });
                    row.appendChild(cell);
                }

                // attach add button behavior outside cell creation
                // addBtn will use selectedProfDate when clicked
                calendarEl.appendChild(row);
            }

            addBtn.onclick = async ()=>{
                if (!selectedProfDate) return alert('Primero seleccioná una fecha en el calendario');
                const hora = nuevaHora.value;
                if(!hora) return alert('Elegí una hora');
                const weekday = nameFromNumber(selectedProfDate.getDay());
                const newTurno = { dia: weekday, hora, materia:null, alumno:null, editando:false, fecha: selectedProfDate.toISOString(), weekNumber: getISOWeekNumber(selectedProfDate) };
                turnos.push(newTurno);
                await saveRecord();
                render();
                mostrarTurnos();
                mostrarMensaje('Hora agregada para la fecha');
            };
        }

        prev.addEventListener('click', ()=>{ if (displayedMonth===0){ displayedMonth=11; displayedYear--; } else displayedMonth--; monthSelect.value=displayedMonth; yearSelect.value=displayedYear; render(); });
        next.addEventListener('click', ()=>{ if (displayedMonth===11){ displayedMonth=0; displayedYear++; } else displayedMonth++; monthSelect.value=displayedMonth; yearSelect.value=displayedYear; render(); });
        monthSelect.addEventListener('change', (e)=>{ displayedMonth = parseInt(e.target.value,10); render(); });
        yearSelect.addEventListener('change', (e)=>{ displayedYear = parseInt(e.target.value,10); render(); });
        render();
    }

    for (let i = 0; i < turnos.length; i++) {
        const t = turnos[i];

        if (t.editando) {
        tabla.innerHTML += `
            <tr>
            <td>
                <select id="dia-${i}">
                <option value="Lunes" ${t.dia === "Lunes" ? "selected" : ""}>Lunes</option>
                <option value="Martes" ${t.dia === "Martes" ? "selected" : ""}>Martes</option>
                <option value="Miércoles" ${t.dia === "Miércoles" ? "selected" : ""}>Miércoles</option>
                <option value="Jueves" ${t.dia === "Jueves" ? "selected" : ""}>Jueves</option>
                <option value="Viernes" ${t.dia === "Viernes" ? "selected" : ""}>Viernes</option>
                </select>
            </td>
            <td><input type="time" id="hora-${i}" value="${t.hora}"></td>
            <td><input type="text" id="materia-${i}" value="${t.materia || ""}"></td>
            <td><input type="text" id="alumno-${i}" value="${t.alumno || ""}"></td>
            <td>
                <button class="guardar" data-index="${i}">Guardar</button>
                <button class="cancelar" data-index="${i}">Cancelar</button>
            </td>
            </tr>`;
        } else {
        const fechaMostrar = t.fecha ? (() => { const d=new Date(t.fecha); return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}` })() : '-';
        tabla.innerHTML += `
            <tr>
            <td>${t.dia}</td>
            <td>${t.hora}</td>
            <td>${fechaMostrar}</td>
            <td>${t.materia || "-"}</td>
            <td>${t.alumno || "-"}</td>
            <td>
                <button class="editar" data-index="${i}">Editar</button>
                <button class="eliminar" data-index="${i}">Eliminar</button>
            </td>
            </tr>`;
        }
    }
    }

    form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const dia = document.getElementById("dia").value;
    const hora = document.getElementById("hora").value;

    turnos.push({
        dia,
        hora,
        materia: null,
        alumno: null,
        editando: false
    });

    await saveRecord();
    mostrarTurnos();
    mostrarMensaje("Nuevo horario agregado correctamente");
    form.reset();
    });

    tabla.addEventListener("click", async (event) => {
    const boton = event.target;
    const index = boton.dataset.index;

    if (boton.classList.contains("editar")) {
        turnos[index].editando = true;
        mostrarTurnos();
    }

    if (boton.classList.contains("guardar")) {
        turnos[index].dia = document.getElementById(`dia-${index}`).value;
        turnos[index].hora = document.getElementById(`hora-${index}`).value;
        turnos[index].materia = document.getElementById(`materia-${index}`).value.trim();
        turnos[index].alumno = document.getElementById(`alumno-${index}`).value.trim();
        turnos[index].editando = false;

        await saveRecord();
        mostrarTurnos();
        mostrarMensaje("Horario actualizado con éxito");
    }

    if (boton.classList.contains("cancelar")) {
        turnos[index].editando = false;
        mostrarTurnos();
    }

    if (boton.classList.contains("eliminar")) {
        if (confirm("¿Seguro que quieres eliminar este horario?")) {
        turnos.splice(index, 1);
        await saveRecord();
        mostrarTurnos();
        mostrarMensaje("Horario eliminado correctamente", "error");
        }
    }
    });

    await cargarTurnos();
});
