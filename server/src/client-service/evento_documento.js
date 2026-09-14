
const documento = document.getElementById('documento')
const tipo_evento = document.getElementById('tipo_evento')
const motivo = document.getElementById('motivo')
const alert_box = document.getElementById('alert-box')
const form = document.getElementById('form-evento')
const tablaBody = document.getElementById('tabla-body')

async function evento_documento() {
    try {
        const respuesta = await fetchProtegido('evento/listar')
        const resultado = await respuesta.json()

        if(!respuesta.ok){
            throw new Error(resultado.error || 'Sin respuesta del servidor')
        }

        tablaBody.innerHTML = ''
        resultado.forEach(evento => {
            renderizarTabla(evento)
        });
    } catch (error) {
        mostrarAlerta(error.message, 'error')
        console.error(error)
    }    
}

async function documento_electronico() {
    try {
        const respuesta = await fetchProtegido('evento/documento')
        const resultado = await respuesta.json()

        if(!respuesta.ok){
            throw new Error(resultado.error || 'Sin respuesta del servidor')
        }

        documento.innerHTML = resultado
        .map(d =>
            `<option value= "${d.id_documento_electronico}">Venta: ${d.id_venta} | Fecha: ${d.fecha_emision}</option>`
        ).join('')

    } catch (error) {
        console.error(error)
        mostrarAlerta(error.message, 'error')
    }
}


async function tipo_evento_data() {
    try {
        const respuesta = await fetchProtegido('evento/tipos')
        const resultado = await respuesta.json()

        if(!respuesta.ok){
            throw new Error(resultado.error || 'Sin respuesta del servidor')
        }

        tipo_evento.innerHTML = resultado
        .map(d =>
            `<option value= "${d.id_tipo_evento}"> ${d.idescripcion}</option>`
        ).join('')
    } catch (error) {
        console.error(error)
        mostrarAlerta(error.message, 'error')
    }
}

form.addEventListener('submit', async(e)=>{
    e.preventDefault()

    const datos = [
        {elemento: documento, nombre: 'Documento Electronico'},
        {elemento: tipo_evento, nombre: 'Tipo de evento'}
    ]

    for(const campos of datos){
        if(!campos.elemento.value.trim()){
            alert(`El campo ${campos.nombre} es obligatorio`)
            campos.elemento.focus()
            return
        }
    }

    const evento ={
        id_documento_electronico: Number(documento.value),
        id_tipo_evento: Number(tipo_evento.value),
        motivo: motivo.value.trim(),
    }

    try{
        const respuesta = await fetchProtegido('evento/evento_asignar', 'POST', evento)

        const evento_documento = await respuesta.json()

        if(!respuesta.ok){
            throw new Error(evento_documento.error || 'Error al obtener datos')
        }

        mostrarAlerta('Cliente insertado con exito', 'exito')
        form.reset()
        await evento_documento()
        
    }catch(error){
        console.error(error)
    }
})

function renderizarTabla(evento){
    const fila = document.createElement('tr')

    fila.innerHTML = `
        <td>${evento.id_evento_documento}</td>
        <td>${evento.id_documento_electronico}</td>
        <td>${evento.idescripcion}</td>
        <td>${evento.motivo}</td>
        <td>${evento.fecha_evento}</td>  
    `
    tablaBody.appendChild(fila)
}

function mostrarAlerta(texto, tipo){
    alert_box.textContent = texto
    alert_box.className = tipo
    alert_box.classList.remove('hidden')
}
async function inicializar() {
    await evento_documento()
    await documento_electronico()
    await tipo_evento_data()
}


document.addEventListener('DOMContentLoaded', inicializar);