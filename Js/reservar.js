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

        function renderCalendar() {
            const firstOfMonth = new Date(displayedYear, displayedMonth, 1);
            const year = firstOfMonth.getFullYear();
            const month = firstOfMonth.getMonth();

            calendarEl.innerHTML = '';
            const header = document.createElement('div'); header.className='d-flex gap-2 mb-2';
            ['D','L','M','M','J','V','S'].forEach(ch=>{ const h=document.createElement('div'); h.style.width='48px'; h.style.textAlign='center'; h.textContent=ch; header.appendChild(h); });
            calendarEl.appendChild(header);

            const startDay = firstOfMonth.getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const grid = document.createElement('div'); grid.className='calendar-grid';

            for (let i = 0; i < startDay; i++) { const e=document.createElement('div'); e.className='calendar-cell'; e.style.visibility='hidden'; grid.appendChild(e); }

            for (let d = 1; d <= daysInMonth; d++) {
                const cell = document.createElement('div'); cell.className='calendar-cell';
                const dateObj = new Date(year, month, d);
                const weekdayName = nameFromNumber(dateObj.getDay());

                // availability: by exact fecha or by weekday slots
                const byDate = turnos.filter(t => t.fecha && (new Date(t.fecha)).toDateString() === dateObj.toDateString() && !t.alumno);
                const byWeekday = turnos.filter(t => !t.fecha && t.dia === weekdayName && !t.alumno);
                if (byDate.length > 0 || byWeekday.length > 0) cell.classList.add('has-available');
                if (new Date().toDateString() === dateObj.toDateString()) cell.classList.add('today');

                cell.textContent = d;
                cell.addEventListener('click', () => selectDate(dateObj));
                grid.appendChild(cell);
            }

            calendarEl.appendChild(grid);
        }

        function selectDate(dateObj) {
            fechaReserva.value = dateObj.toISOString();
            const weekdayName = nameFromNumber(dateObj.getDay());
            fechaSeleccionadaText.textContent = `${weekdayName} ${dateObj.getDate()}/${dateObj.getMonth()+1}/${dateObj.getFullYear()}`;

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
        } else {
            turnos[i].diaNumero = null;
        }

        await saveRecord();
        form.reset();
        initCalendarUI();
        mostrarMensaje(`Reserva confirmada para ${nombre} en ${materia}.`);
    });

    await cargarTurnos();
});
