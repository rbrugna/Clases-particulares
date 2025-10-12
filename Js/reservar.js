document.addEventListener("DOMContentLoaded", function(){
    const tabla=document.getElementById("tabla-reservas");
    const form=document.getElementById("form-reserva");
    const nombreAlumno=document.getElementById("nombreAlumno");
    const materiaAlumno=document.getElementById("materiaAlumno");
    const indiceTurno=document.getElementById("indiceTurno");

    let turnos= JSON.parse(localStorage.getItem("turnos")) || [];

    function guardarEnLocalStorage(){
        localStorage.setItem("turnos",JSON.stringify(turnos));
    }

    function mostrarTurnosDisponibles(){
        tabla.innerHTML="";

        const libres=turnos.filter(t=>!t.alumno);

        if (libres.length ===0){
            tabla.innerHTML='<tr><td colspan="3">No hay horarios disponibles.</td></tr>';
            return;
        }

        for (let i=0; i<libres.length;i++){
            const t=libres[i];
            const indexReal=turnos.indexOf(t) //posicion real
            const fila=`
            <tr>
                <td>${t.dia}</td>
                <td>${t.hora}</td>
                <td><button class="reservar" data-index="${indexReal}">Reservar</button></td>
                </tr>
                `;
                tabla.innerHTML+=fila;
        }
    }

    tabla.addEventListener("click",function (event){
        const boton=event.target;
        if (boton.classList.contains("reservar")){
            const index = boton.dataset.index;
            indiceTurno.value=index //guarda indice oculto para despues
            alert('Completa tu nombre y la materia');
        }
    });

    form.addEventListener('submit',function(event){
        event.preventDefault();

        const i= indiceTurno.value;
        const nombre=nombreAlumno.value.trim();
        const materia=materiaAlumno.value.trim();

        if (i===""){
            alert("Primero elegi un horario para reservar");
            return;
        }

        turnos[i].alumno=nombre;
        turnos[i].materia=materia;
        guardarEnLocalStorage();

        alert(`Reserva confirmada para ${nombre} en ${materia}.`);
        form.reset();
        mostrarTurnosDisponibles();
    });

    mostrarTurnosDisponibles();
})