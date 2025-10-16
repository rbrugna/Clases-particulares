document.addEventListener("DOMContentLoaded", async function () {
    const tabla = document.getElementById("tabla-reservas");
    const form = document.getElementById("form-reserva");
    const nombreAlumno = document.getElementById("nombreAlumno");
    const materiaAlumno = document.getElementById("materiaAlumno");
    const indiceTurno = document.getElementById("indiceTurno");

    const BIN_URL = "https://api.jsonbin.io/v3/b/68f0f6a643b1c97be96b69df"; 
    const API_KEY = "$2a$10$/T.XxMX2A.Je1VsMGPe/0eAPVYhZMxoBFq3uITc43uPFDkEF8aNm6"; 
    let turnos = [];

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

        await guardarTurnos();
        form.reset();
        mostrarTurnosDisponibles();
        mostrarMensaje(`Reserva confirmada para ${nombre} en ${materia}.`);
    });

    await cargarTurnos();
});
