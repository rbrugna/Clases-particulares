document.addEventListener("DOMContentLoaded", async function () {
    // role protection: only allow alumnos here
    const role = localStorage.getItem('role');
    if (role !== 'alumno') {
        alert('Acceso restringido: esta página es solo para alumnos. Por favor ingresa como alumno.');
        window.location.href = 'index.html';
        return;
    }

    const form = document.getElementById("form-reserva");
    const nombreAlumno = document.getElementById("nombreAlumno");
    const materiaAlumno = document.getElementById("materiaAlumno");
    const indiceTurno = document.getElementById("indiceTurno");
    const fechaReserva = document.getElementById('fechaReserva');
    const horaSeleccionada = document.getElementById('horaSeleccionada');
    const diaSeleccionado = document.getElementById('diaSeleccionado');
    const seleccion = document.getElementById('seleccion');

    const BIN_URL = "https://api.jsonbin.io/v3/b/68f0f6a643b1c97be96b69df";
    const API_KEY = "$2a$10$/T.XxMX2A.Je1VsMGPe/0eAPVYhZMxoBFq3uITc43uPFDkEF8aNm6";
    let turnos = [];

    function nameFromNumber(n) {
        const arr = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
        return arr[n];
    }

    function mostrarMensaje(texto, tipo = "exito") {
        const mensaje = document.getElementById("mensaje");
        if (!mensaje) return;
        mensaje.textContent = texto;
        mensaje.className = `mensaje ${tipo} mostrar`;
        setTimeout(() => mensaje.classList.remove("mostrar"), 3000);
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

    async function cargarTurnos() {
        const res = await fetch(BIN_URL, { headers: { "X-Master-Key": API_KEY } });
        const data = await res.json();
        turnos = (data.record && data.record.turnos) ? data.record.turnos : [];
        window.__messages = (data.record && data.record.messages) ? data.record.messages : [];
        initCalendarUI();
    }

    function initCalendarUI() {
        const calendarEl = document.getElementById('calendar');
        const prevMonthBtn = document.getElementById('prevMonth');
        const nextMonthBtn = document.getElementById('nextMonth');
        const monthSelect = document.getElementById('monthSelect');
        const yearSelect = document.getElementById('yearSelect');
        const timesWrap = document.getElementById('timesWrap');
        const timesList = document.getElementById('timesList');
        const fechaSeleccionadaText = document.getElementById('fechaSeleccionadaText');

        if (!calendarEl) return;

        const today = new Date();
        let displayedMonth = today.getMonth();
        let displayedYear = today.getFullYear();

        // populate month/year selects
        const monthNames = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
        monthSelect.innerHTML = '';
        monthNames.forEach((m, i) => { const opt = document.createElement('option'); opt.value = i; opt.textContent = m; monthSelect.appendChild(opt); });

        yearSelect.innerHTML = '';
        const startYear = displayedYear - 5;
        for (let y = startYear; y <= displayedYear + 2; y++) { const opt = document.createElement('option'); opt.value = y; opt.textContent = y; yearSelect.appendChild(opt); }

        monthSelect.value = displayedMonth;
        yearSelect.value = displayedYear;

        function adjustMonth(delta) {
            displayedMonth += delta;
            if (displayedMonth < 0) { displayedMonth = 11; displayedYear -= 1; }
            if (displayedMonth > 11) { displayedMonth = 0; displayedYear += 1; }
            monthSelect.value = displayedMonth;
            yearSelect.value = displayedYear;
            renderCalendar();
        }

        prevMonthBtn.addEventListener('click', () => adjustMonth(-1));
        nextMonthBtn.addEventListener('click', () => adjustMonth(1));

        monthSelect.addEventListener('change', (e) => { displayedMonth = parseInt(e.target.value,10); renderCalendar(); });
        yearSelect.addEventListener('change', (e) => { displayedYear = parseInt(e.target.value,10); renderCalendar(); });

        function getISOWeekNumber(d) {
            const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
            // ISO week date weeks start on Monday, so correct the day number
            const dayNum = date.getUTCDay() || 7;
            date.setUTCDate(date.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
            const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1)/7);
            return weekNo;
        }

        function renderCalendar() {
            const firstOfMonth = new Date(displayedYear, displayedMonth, 1);
            const year = firstOfMonth.getFullYear();
            const month = firstOfMonth.getMonth();

            calendarEl.innerHTML = '';

            // header row: empty week label + weekdays
            const headerRow = document.createElement('div'); headerRow.className = 'calendar-grid';
            const weekLabel = document.createElement('div'); weekLabel.className = 'calendar-weeklabel'; weekLabel.textContent = 'Wk'; headerRow.appendChild(weekLabel);
            const weekDays = ['D','L','M','M','J','V','S'];
            weekDays.forEach(ch=>{ const h=document.createElement('div'); h.className='calendar-weekday'; h.style.textAlign='center'; h.textContent=ch; headerRow.appendChild(h); });
            calendarEl.appendChild(headerRow);

            const startDay = firstOfMonth.getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const weeks = Math.ceil((startDay + daysInMonth) / 7);

            for (let w = 0; w < weeks; w++) {
                const row = document.createElement('div'); row.className = 'calendar-grid';
                // compute the date of the Monday (or first day) of this week
                const weekStartIndex = w * 7 - startDay + 1; // day number in month
                let refDay = weekStartIndex;
                if (refDay < 1) refDay = 1;
                if (refDay > daysInMonth) refDay = daysInMonth;
                const refDate = new Date(year, month, refDay);
                const wkNo = getISOWeekNumber(refDate);

                const wkCell = document.createElement('div'); wkCell.className = 'calendar-weeknum'; wkCell.textContent = wkNo; row.appendChild(wkCell);

                for (let d = 0; d < 7; d++) {
                    const dayNumber = w * 7 + d - startDay + 1;
                    if (dayNumber < 1 || dayNumber > daysInMonth) {
                        const empty = document.createElement('div'); empty.className = 'calendar-cell'; empty.style.visibility = 'hidden'; row.appendChild(empty);
                        continue;
                    }

                    const cell = document.createElement('div'); cell.className = 'calendar-cell';
                    const dateObj = new Date(year, month, dayNumber);
                    const weekdayName = nameFromNumber(dateObj.getDay());

                    const byDate = turnos.filter(t => t.fecha && (new Date(t.fecha)).toDateString() === dateObj.toDateString() && !t.alumno);
                    const byWeekday = turnos.filter(t => !t.fecha && t.dia === weekdayName && !t.alumno);
                    if (byDate.length > 0 || byWeekday.length > 0) cell.classList.add('has-available');
                    if (new Date().toDateString() === dateObj.toDateString()) cell.classList.add('today');

                    cell.textContent = dayNumber;
                    cell.addEventListener('click', () => selectDate(dateObj));
                    row.appendChild(cell);
                }

                calendarEl.appendChild(row);
            }
        }

        function selectDate(dateObj) {
            fechaReserva.value = dateObj.toISOString();
            const weekdayName = nameFromNumber(dateObj.getDay());
            const wkNo = getISOWeekNumber(dateObj);
            // store week number in hidden input if present
            const wkInput = document.getElementById('weekNumber'); if (wkInput) wkInput.value = wkNo;
            fechaSeleccionadaText.textContent = `${weekdayName} ${dateObj.getDate()}/${dateObj.getMonth()+1}/${dateObj.getFullYear()} — Semana ${wkNo}`;

            const disponibles = turnos
                .map((t, idx) => ({...t, idx}))
                .filter(t => !t.alumno && ( (t.fecha && (new Date(t.fecha)).toDateString() === dateObj.toDateString()) || (!t.fecha && t.dia === weekdayName) ));

            timesList.innerHTML = '';
            if (disponibles.length === 0) {
                timesList.innerHTML = '<div>No hay horarios disponibles para esa fecha.</div>';
                timesWrap.style.display = 'block';
                return;
            }

            disponibles.forEach(d => {
                const btn = document.createElement('button');
                btn.className = 'btn btn-outline-primary';
                btn.textContent = d.hora;
                btn.dataset.index = d.idx;
                btn.addEventListener('click', function () {
                    indiceTurno.value = d.idx;
                    horaSeleccionada.value = d.hora;
                    diaSeleccionado.value = d.dia;
                    seleccion.textContent = `${d.dia} ${dateObj.getDate()}/${dateObj.getMonth()+1}/${dateObj.getFullYear()} - ${d.hora}`;
                    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
                timesList.appendChild(btn);
            });

            timesWrap.style.display = 'block';
        }

        renderCalendar();
    }

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const i = indiceTurno.value;
        const storedUser = localStorage.getItem('username');
        const nombre = (storedUser && storedUser.trim()) ? storedUser.trim() : nombreAlumno.value.trim();
        const materia = materiaAlumno.value.trim();

        if (i === "") {
            alert("Primero elegí un horario para reservar");
            return;
        }

        // mark reservation
        turnos[i].alumno = nombre;
        turnos[i].materia = materia;
        turnos[i].fecha = fechaReserva.value || null;
        if (turnos[i].fecha) {
            const d = new Date(turnos[i].fecha);
            turnos[i].diaNumero = d.getDate();
            const wkInput = document.getElementById('weekNumber');
            turnos[i].weekNumber = wkInput ? parseInt(wkInput.value,10) : getISOWeekNumber(d);
        } else {
            turnos[i].diaNumero = null;
            turnos[i].weekNumber = null;
        }

        await saveRecord();
        form.reset();
        initCalendarUI();
        mostrarMensaje(`Reserva confirmada para ${nombre} en ${materia}.`);
    });

    await cargarTurnos();
});
