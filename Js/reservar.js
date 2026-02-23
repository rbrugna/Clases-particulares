document.addEventListener("DOMContentLoaded", async function () {
    // role protection: only allow alumnos here
    const role = localStorage.getItem('role');
    if (role !== 'alumno') {
        alert('Acceso restringido: esta página es solo para alumnos. Por favor ingresa como alumno.');
        window.location.href = 'index.html';
        return;
    }
    const tabla = document.getElementById("tabla-reservas");
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

    function weekdayNumberFromName(name) {
        const m = {
            'Domingo': 0,
            'Lunes': 1,
            'Martes': 2,
            'Miércoles': 3,
            'Miercoles': 3,
            'Jueves': 4,
            'Viernes': 5,
            'Sábado': 6,
            'Sabado': 6
        };
        return m[name] ?? 1;
    }

    function nextDateForWeekday(name) {
        const target = weekdayNumberFromName(name);
        const today = new Date();
        const todayNum = today.getDay();
        let delta = (target - todayNum + 7) % 7;
        // If the target is today, keep today (student is booking next available instance)
        const result = new Date(today);
        result.setDate(today.getDate() + delta);
        result.setHours(0,0,0,0);
        return result;
    }

    function mostrarMensaje(texto, tipo = "exito") {
        const mensaje = document.getElementById("mensaje");
        if (!mensaje) return;
        mensaje.textContent = texto;
        mensaje.className = `mensaje ${tipo} mostrar`;
        setTimeout(() => mensaje.classList.remove("mostrar"), 3000);
    }

    async function cargarTurnos() {
        const res = await fetch(BIN_URL, {
            headers: { "X-Master-Key": API_KEY },
        });
        const data = await res.json();
        turnos = data.record.turnos || [];
        mostrarTurnosDisponibles();
        }

    async function guardarTurnos() {
        await fetch(BIN_URL.replace("/latest", ""), { // sacamos /latest para escribir
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "X-Master-Key": API_KEY,
            },
            body: JSON.stringify({ turnos }),
        });
        }

    function mostrarTurnosDisponibles() {
        // Hide legacy table and render calendar UI instead
        if (tabla) tabla.style.display = 'none';
        // calendar elements
        const calendarEl = document.getElementById('calendar');
        const prevMonthBtn = document.getElementById('prevMonth');
        const nextMonthBtn = document.getElementById('nextMonth');
        const mesAnio = document.getElementById('mesAnio');
        const timesWrap = document.getElementById('timesWrap');
        const timesList = document.getElementById('timesList');
        const fechaSeleccionadaText = document.getElementById('fechaSeleccionadaText');

        let currentMonthOffset = 0;

        function nameFromNumber(n) {
            const arr = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
            return arr[n];
        }

        function renderCalendar() {
            const today = new Date();
            const firstOfMonth = new Date(today.getFullYear(), today.getMonth() + currentMonthOffset, 1);
            const year = firstOfMonth.getFullYear();
            const month = firstOfMonth.getMonth();

            mesAnio.textContent = `${firstOfMonth.toLocaleString('es-ES', { month: 'long' })} ${year}`;

            calendarEl.innerHTML = '';
            const weekDays = ['D','L','M','M','J','V','S'];
            const header = document.createElement('div');
            header.className = 'd-flex gap-2 mb-2';
            for (let wd of weekDays) {
                const h = document.createElement('div');
                h.style.width = '40px';
                h.style.textAlign = 'center';
                h.textContent = wd;
                header.appendChild(h);
            }
            calendarEl.appendChild(header);

            const startDay = firstOfMonth.getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();

            const grid = document.createElement('div');
            grid.className = 'd-flex flex-wrap';

            for (let i = 0; i < startDay; i++) {
                const empty = document.createElement('div');
                empty.style.width = '40px';
                empty.style.height = '40px';
                grid.appendChild(empty);
            }

            for (let d = 1; d <= daysInMonth; d++) {
                const cell = document.createElement('button');
                cell.className = 'btn btn-light';
                cell.style.width = '40px';
                cell.style.height = '40px';
                const dateObj = new Date(year, month, d);
                const weekdayName = nameFromNumber(dateObj.getDay());

                const disponibles = turnos.filter(t => !t.alumno && t.dia === weekdayName);
                if (disponibles.length > 0) {
                    cell.classList.add('btn-primary');
                    cell.classList.remove('btn-light');
                    cell.style.color = 'white';
                }

                cell.textContent = d;
                cell.dataset.iso = dateObj.toISOString();
                cell.dataset.weekday = weekdayName;

                cell.addEventListener('click', function () {
                    selectDate(dateObj);
                });

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
                .filter(t => !t.alumno && t.dia === weekdayName);

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
                    seleccion.textContent = `${d.dia} ${dateObj.getDate()}/${dateObj.getMonth()+1}/${dateObj.getFullYear()} - ${d.hora}`;
                    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
                timesList.appendChild(btn);
            });

            timesWrap.style.display = 'block';
        }

        prevMonthBtn.addEventListener('click', function () {
            currentMonthOffset -= 1;
            renderCalendar();
        });
        nextMonthBtn.addEventListener('click', function () {
            currentMonthOffset += 1;
            renderCalendar();
        });

        // initial render
        renderCalendar();
    }
    // legacy table click handler removed; calendar handles selection now

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const i = indiceTurno.value;
        const nombre = nombreAlumno.value.trim();
        const materia = materiaAlumno.value.trim();

        if (i === "") {
            alert("Primero elegí un horario para reservar");
            return;
        }

        turnos[i].alumno = nombre;
        turnos[i].materia = materia;
        // save computed reservation date and day number
        turnos[i].fecha = fechaReserva.value || null; // ISO string
        if (turnos[i].fecha) {
            const d = new Date(turnos[i].fecha);
            turnos[i].diaNumero = d.getDate();
        } else {
            turnos[i].diaNumero = null;
        }

        await guardarTurnos();
        form.reset();
        mostrarTurnosDisponibles();
        mostrarMensaje(`Reserva confirmada para ${nombre} en ${materia}.`);
    });

    await cargarTurnos();
});
