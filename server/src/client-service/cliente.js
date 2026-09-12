
const tipo_documento = document.getElementById('id-documento')
const tipo_contribuyente = document.getElementById('id-contribuyente')
const numero_documento = document.getElementById('numero-documento')
const razon_social = document.getElementById('razon-social')
const direccion = document.getElementById('direccion')
const telefono = document.getElementById('telefono')
const alert_box = document.getElementById('alert-box')
const form = document.getElementById('form-cliente')
const tablaBody = document.getElementById('tabla-body')

async function clientes() {
    try {
        const respuesta = await fetchProtegido('clientes/lista')
        const resultado = await respuesta.json()

        if(!respuesta.ok){
            throw new Error(resultado.error || 'Sin respuesta del servidor')
        }

        resultado.forEach(cliente => {
            renderizarTabla(cliente)
        });
    } catch (error) {
        mostrarAlerta(error.message, 'error')
    }
}
async function documento() {
    try {
        const respuesta = await fetchProtegido('clientes/documento')
        const data = await respuesta.json()
        if(!respuesta.ok){
            throw new Error(data.error || 'Sin acceso a la conexion')
        }
        
        const select = data
        .map(d =>
            `<option value= "${d.id_tipo_doc_identidad}">${d.descripcion}</option>`
        ).join('')

        tipo_documento.innerHTML = select
    } catch (error) {
        console.error(error)
    }
}

async function contribuyente() {
    try {
        const respuesta = await fetchProtegido('clientes/contribuyente')
        if(!respuesta) return

        const data = await respuesta.json()
        if(!respuesta.ok){
            throw new Error(data.error || 'Sin acceso a la conexion')
        }

        const opciones = data
        .map(c =>
            `<option value="${c.id_tipo_contribuyente}">${c.codigo} - ${c.descripcion}</option>`
        ).join('')

        tipo_contribuyente.innerHTML = opciones
    } catch (error) {
        console.error(error)
    }
}

form.addEventListener('submit', async(e)=>{
    e.preventDefault()

    const obligatorios = [
        {elemento: tipo_documento, nombre: 'Tipo de documento'},
        {elemento: tipo_contribuyente, nombre: 'Tipo de contribuyente'},
        {elemento: razon_social, nombre: 'Razon Social'},
        {elemento: numero_documento, nombre: 'Numero de documento'}
    ]

    for(const campos of obligatorios){
        if(!campos.elemento.value.trim()){
            alert(`El campo ${campos.nombre} es obligatorio`)
            campos.elemento.focus()
            return
        }
    }

    const clienteData ={
        id_tipo_doc_identidad: Number(tipo_documento.value),
        id_tipo_contribuyente: Number(tipo_contribuyente.value),
        nombre_razon_social: razon_social.value.trim(),
        numero_documento: numero_documento.value.trim(),
        direccion: direccion.value.trim(),
        telefono: telefono.value.trim()
    }

    try{
        const respuesta = await fetchProtegido('clientes/crear', 'POST', clienteData)

        const cliente_result = await respuesta.json()

        if(!respuesta.ok){
            throw new Error(cliente_result.error || 'Error al obtener datos')
        }

        mostrarAlerta('Cliente insertado con exito', 'exito')

        renderizarTabla(clienteData, cliente_result.cliente)
        form.reset()
        
    }catch(error){
        console.error(error)
    }
})

function renderizarTabla(cliente, id_cliente = cliente.id_cliente){
    const texto_documento = 
        tipo_documento.options[tipo_documento.selectedIndex].textContent
    
    const texto_contribuyente = 
        tipo_contribuyente.options[tipo_contribuyente.selectedIndex].textContent

    const fila = document.createElement('tr')

    fila.innerHTML = `
        <td>${id_cliente}</td>
        <td>${texto_documento}</td>
        <td>${cliente.numero_documento}</td>
        <td>${texto_contribuyente}</td>
        <td>${cliente.nombre_razon_social}</td>
        <td>${cliente.direccion}</td>
        <td>${cliente.telefono}</td>   
    `
    tablaBody.appendChild(fila)
}

function mostrarAlerta(texto, tipo){
    alert_box.textContent = texto
    alert_box.className = tipo
    alert_box.classList.remove('hidden')
}
async function inicializar() {
    await documento()
    await contribuyente()
    await clientes()
}


document.addEventListener('DOMContentLoaded', inicializar);