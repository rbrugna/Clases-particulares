document.addEventListener("DOMContentLoaded",function() {
    const form=document.getElementById('form-turno');
    const tabla=document.getElementById("tabla-turnos");
    const extraCampos=document.getElementById("extraCampos");
    const materiaInput=document.getElementById("materia");
    const alumnoInput=document.getElementById("alumno");

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
        const materia=materiaInput.value.trim();
        const alumno=alumnoInput.value.trim();

        if (indiceEdicion!==null){
            //editando
            const t = turnos[indiceEdicion];
            t.dia = dia;
            t.hora = hora;

            if (extraCampos.style.display==="block"){
                t.materia =materia || t.materia;
                t.alumno = alumno || t.alumno;
            }

            indiceEdicion=null;
            extraCampos.style.display='none';
        }else {
            const nuevoTurno={
                dia: dia,
                hora: hora,
                materia: null,
                alumno: null 
            };

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
            materiaInput.value=t.materia || "";
            alumnoInput.value = t.alumno || "";

            indiceEdicion=index 
            extraCampos.style.display="block";
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


