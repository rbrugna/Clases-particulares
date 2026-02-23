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
        tabla.innerHTML = "";

        const libres = turnos.filter((t) => !t.alumno);

        if (libres.length === 0) {
            tabla.innerHTML = '<tr><td colspan="3">No hay horarios disponibles.</td></tr>';
            return;
        }

        for (let i = 0; i < libres.length; i++) {
            const t = libres[i];
            const indexReal = turnos.indexOf(t);
            const fila = `
                <tr>
                    <td>${t.dia}</td>
                    <td>${t.hora}</td>
                    <td><button class="reservar" data-index="${indexReal}">Reservar</button></td>
                </tr>`;
            tabla.innerHTML += fila;
        }
    }

    tabla.addEventListener("click", function (event) {
        const boton = event.target;
        if (boton.classList.contains("reservar")) {
            const index = boton.dataset.index;
            indiceTurno.value = index; // guarda el índice para después

            // calcular la próxima fecha para el día de la semana correspondiente
            const turno = turnos[index];
            const fecha = nextDateForWeekday(turno.dia);
            fechaReserva.value = fecha.toISOString();
            horaSeleccionada.value = turno.hora;
            diaSeleccionado.value = turno.dia;
            seleccion.textContent = `${turno.dia} ${fecha.getDate()}/${fecha.getMonth()+1}/${fecha.getFullYear()} - ${turno.hora}`;

            form.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    });

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
