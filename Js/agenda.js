document.addEventListener("DOMContentLoaded", async function () {
    const form = document.getElementById("form-turno");
    const tabla = document.getElementById("tabla-turnos");
    const mensaje = document.getElementById("mensaje");

    const BIN_URL = "https://api.jsonbin.io/v3/b/68f01aecae596e708f15fbb5"; 
    const API_KEY = "68f01aecae596e708f15fbb5"; 
    let turnos = [];

    async function cargarTurnos() {
    const res = await fetch(BIN_URL, {
        headers: { "X-Master-Key": API_KEY }
    });
    const data = await res.json();
    turnos = data.record.turnos || [];
    mostrarTurnos();
    }

    async function guardarTurnos() {
    await fetch(BIN_URL, {
        method: "PUT",
        headers: {
        "Content-Type": "application/json",
        "X-Master-Key": API_KEY
        },
        body: JSON.stringify({ turnos })
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
        tabla.innerHTML += `
            <tr>
            <td>${t.dia}</td>
            <td>${t.hora}</td>
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

    await guardarTurnos();
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

        await guardarTurnos();
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
        await guardarTurnos();
        mostrarTurnos();
        mostrarMensaje("Horario eliminado correctamente", "error");
        }
    }
    });

    await cargarTurnos();
});
