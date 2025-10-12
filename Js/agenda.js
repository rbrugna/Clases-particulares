document.addEventListener("DOMContentLoaded",function() {
    const form=document.getElementById('form-turno');
    const tabla=document.getElementById("tabla-turnos");

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
                    <td>${t.dia}</td>
                    <td>${t.hora}</td>
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
            const materiaInput=document.getElementById(`materia-${index}`).value.trim();
            const alumnoInput=document.getElementById(`alumno-${index}`).value.trim();

            turnos[index].materia = materiaInput;
            turnos[index].alumno = alumnoInput;
            turnos[index].editando = false;

            guardarEnLocalStorage();
            mostrarTurnos();
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
            }
        }
    });
    mostrarTurnos();
});