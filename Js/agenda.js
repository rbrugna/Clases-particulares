document.addEventListener("DOMContentLoaded",function() {
    let turnos = JSON.parse(localStorage.getItem("turnos")) || [];
    const form=document.getElementById('form-turno');
    const tabla=document.getElementById("tabla-turnos");

    function mostrarMensaje(texto,tipo="exito"){
        const mensaje=document.getElementById("mensaje");
        mensaje.textContent=texto;
        mensaje.className=`mensaje ${tipo} mostrar`;
        
        setTimeout(()=>{
            mensaje.classList.remove("mostrar");
        }, 3000);
    }

    function guardarEnLocalStorage(){
        localStorage.setItem("turnos",JSON.stringify(turnos));
    }

    function mostrarTurnos() {
        tabla.innerHTML='';

        if (turnos.length===0){
            tabla.innerHTML="<tr><td colspan='5'>No hay horarios cargados.</td></tr>";
            return ;
        }

        for (let i=0;i<turnos.length;i++){
            const t=turnos[i];

            if (t.editando){
                tabla.innerHTML+=`
                <tr>
                    <td>
                        <select id="dia-${i}">
                            <option value="Lunes" ${t.dia === "Lunes" ? "selected" : ""}>Lunes</option>
                            <option value="Martes" ${t.dia === "Martes" ? "selected" : ""}>Martes</option>
                            <option value="Miercoles" ${t.dia === "Miercoles" ? "selected" : ""}>Miercoles</option>
                            <option value="Jueves" ${t.dia === "Jueves" ? "selected" : ""}>Jueves</option>
                            <option value="Viernes" ${t.dia === "Viernes" ? "selected" : ""}>Viernes</option>
                        </select>
                    </td>
                    <td><input type="time" id="hora-${i}" value="${t.hora}"></td>
                    <td><input type='text' id="materia-${i}" value="${t.materia||""}"></td>
                    <td><input type='text' id="alumno-${i}" value="${t.alumno||""}"></td>
                    <td>
                        <button class="guardar" data-index="${i}">Guardar</button>
                        <button class="cancelar" data-index="${i}">Cancelar</button>
                    </td>
                </tr>`;
            } else{
                tabla.innerHTML+=`
                <tr>
                    <td>${t.dia}</td>
                    <td>${t.hora}</td>
                    <td>${t.materia || "-"}</td>
                    <td>${t.alumno || "-"}</td>
                    <td>
                        <button class='editar' data-index="${i}">Editar</button>
                        <button class='eliminar' data-index="${i}">Eliminar</button>
                    </td>
                </tr>`;
            }
        }
    }

    form.addEventListener("submit",function(event){
        event.preventDefault();

        const dia=document.getElementById("dia").value;
        const hora=document.getElementById('hora').value;

        const nuevoTurno={
            dia: dia,
            hora: hora,
            materia: null,
            alumno: null,
            editando: false,
        };
        turnos.push(nuevoTurno)

        guardarEnLocalStorage();
        mostrarTurnos();
        mostrarMensaje("Nuevo horario agregado correctamente");
        form.reset();
    });

    tabla.addEventListener('click',function(event){
        const boton=event.target;
        
        // Si el boton tiene la clase editar
        if (boton.classList.contains('editar')){
            const index=boton.dataset.index; // lee el numero de fila
            turnos[index].editando=true
            mostrarTurnos();
            return;
        }

        // Si el boton tiene la clase guardar
        if (boton.classList.contains('guardar')){
            const index=boton.dataset.index;

            const diaInput = document.getElementById(`dia-${index}`).value;
            const horaInput = document.getElementById(`hora-${index}`).value;
            const materiaInput=document.getElementById(`materia-${index}`).value.trim();
            const alumnoInput=document.getElementById(`alumno-${index}`).value.trim();

            turnos[index].dia = diaInput
            turnos[index].hora = horaInput
            turnos[index].materia = materiaInput;
            turnos[index].alumno = alumnoInput;
            turnos[index].editando = false;

            guardarEnLocalStorage();
            mostrarTurnos();
            mostrarMensaje("Horario actualizado con éxito");
            return;
        }

        // Si el boton tiene la clase cancelar
        if (boton.classList.contains("cancelar")){
            const index=boton.dataset.index;
            turnos[index].editando = false;
            mostrarTurnos();
            return;
        }

        // Si el boton tiene la clase eliminar
        if (boton.classList.contains('eliminar')){
            const index = boton.dataset.index;
            if (confirm("Seguro que quieres eliminar este horario?")){
                turnos.splice(index,1);
                guardarEnLocalStorage(); 
                mostrarTurnos();
                mostrarMensaje("Horario eliminado correctamente", "error");
            }
        }
    });
    mostrarTurnos();
});