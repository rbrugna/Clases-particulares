document.addEventListener("DOMContentLoaded",function() {
    const form=document.getElementById('form-turno');
    const tabla=document.getElementById("tabla-turnos");

    let indiceEdicion=null 

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
            const fila= `
                <tr>
                    <td>${t.dia}</td>
                    <td>${t.hora}</td>
                    <td>${t.materia || "-"}</td>
                    <td>${t.alumno || "-"}</td>
                    <td>
                        <button class='editar' data-index="${i}">Editar</button>
                        <button class='eliminar' data-index="${i}">Eliminar</button>
                    </td>
                </tr>
            `;
            tabla.innerHTML+=fila;
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
            alumno: null 
        };

        if (indiceEdicion!==null){
            turnos[indiceEdicion]=nuevoTurno;
            indiceEdicion=null;
        } else {
            turnos.push(nuevoTurno);
        }

        guardarEnLocalStorage();
        mostrarTurnos();

        form.reset();
    });

    tabla.addEventListener('click',function(event){
        const boton=event.target;
        
        // Si el boton tiene la clase editar
        if (boton.classList.contains('editar')){
            const index=boton.dataset.index; // lee el numero de fila
            const t=turnos[index];

            document.getElementById('dia').value =t.dia;
            document.getElementById('hora').value=t.hora;
            indiceEdicion=index 
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


