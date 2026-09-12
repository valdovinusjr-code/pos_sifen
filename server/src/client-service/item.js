const categorias = document.getElementById('categoria')
const marcas = document.getElementById('marca')
const secciones = document.getElementById('seccion')
const grupos = document.getElementById('grupo')
const alertbox = document.getElementById('alert-box')
const form = document.getElementById('form-item')
const nombre = document.getElementById('nombre-item')
const preciounit = document.getElementById('pventa-unit')
const preciomay = document.getElementById('pventa-may')
const precioliqui = document.getElementById('pventa-unit-liqui')
const iva = document.getElementById('iva')
const tbody = document.getElementById('tabla-body')

async function items() {
    try {
        const respuesta = await fetchProtegido('items/items_registros')
        const resultado = await respuesta.json()
        if(!respuesta.ok){
            throw new Error(resultado.error || 'Error al obtener items')
        }

        tbody.innerHTML = ''
        resultado.forEach(item => {
            renderizarTabla(item)
        });
    } catch (error) {
        console.log(error)
        mostrarAlerta(error.message, 'error')
    }
}
async function categoria_item() {
    try{
        const respuesta = await fetchProtegido('items/items_registros')
        const resultado = await respuesta.json()
        if(!respuesta.ok){
            throw new Error(resultado.error || 'Error al obtener items')
        }

        categorias.innerHTML = resultado
            .map(c => `<option value="${c.id_categoria}">${c.categoria_descrip}</option>`)
            .join('')
    }catch(error){
        console.error(error)
        mostrarAlerta("Problemas al conectar con categoria" , 'error')
    }
}

async function marca_item() {
    try{
        const respuesta = await fetchProtegido('items/items_registros')
        const resultado = await respuesta.json()
        if(!respuesta.ok){
            throw new Error(resultado.error || 'Error al obtener items')
        }

        marcas.innerHTML = resultado
            .map(c => `<option value="${c.id_marca}">${c.marcas_descrip}</option>`)
            .join('')
    }catch(error){
        console.error(error)
        mostrarAlerta("Problemas al conectar con marcas" , 'error')
    }
}

async function seccion_item() {
    try{
        const respuesta = await fetchProtegido('items/items_registros')
        const resultado = await respuesta.json()
        if(!respuesta.ok){
            throw new Error(resultado.error || 'Error al obtener items')
        }

        secciones.innerHTML = resultado
            .map(c => `<option value="${c.id_seccion}">${c.seccion_descrip}</option>`)
            .join('')
    }catch(error){
        console.error(error)
        mostrarAlerta("Problemas al conectar con secciones" , 'error')
    }
}

async function grupo_item() {
    try{
        const respuesta = await fetchProtegido('items/items_registros')
        const resultado = await respuesta.json()
        if(!respuesta.ok){
            throw new Error(resultado.error || 'Error al obtener items')
        }

        grupos.innerHTML = resultado
            .map(c => `<option value="${c.id_grupo}">${c.grupo_descrip}</option>`)
            .join('')
    }catch(error){
        console.error(error)
        mostrarAlerta("Problemas al conectar con grupo" , 'error')
    }
}

async function iva_item() {
    try{
        const respuesta = await fetchProtegido('items/items_registros')
        const resultado = await respuesta.json()
        if(!respuesta.ok){
            throw new Error(resultado.error || 'Error al obtener items')
        }

        iva.innerHTML = resultado
            .map(c => `<option value="${c.porc_iva}">${c.porcentaje}</option>`)
            .join('')
    }catch(error){
        console.error(error)
        mostrarAlerta("Problemas al conectar con iva" , 'error')
    }
}

form.addEventListener('submit', async(e)=>{
    e.preventDefault()

    const campos = [
        {elemento: categorias, nombre: 'Categorias item'},
        {elemento: marcas, nombre: 'Marcas item'},
        {elemento: grupos, nombre: 'Grupos item'},
        {elemento: secciones, nombre: 'Secciones item'},
        {elemento: iva, nombre: 'Porcentaje IVA'},
        {elemento: nombre, nombre: 'Nombre item'},
        {elemento: preciounit, nombre: 'Precio UNI item'},
        {elemento: preciomay, nombre: 'Precio MAY item'},
        {elemento: precioliqui, nombre: 'Precio LIQ item'}
    ]

    for(const item of campos){
        if(!item.elemento.value.trim()){
            mostrarAlerta(`El campo ${item.nombre} No puede quedar vacio`, 'error')
            item.elemento.focus()
            return
        }
    }

    const itemDATA = {
        id_categoria_items: Number(categorias.value),
        id_marcas_items: Number(marcas.value),
        id_seccion_items: Number(secciones.value),
        id_grupo_items: Number(grupos.value),
        id_porc_iva: Number(iva.value),
        nombre_item: nombre.value.trim(),
        pventa_unit: Number(preciounit.value.trim()),
        pventa_may: Number(preciomay.value.trim()),
        pventa_unit_liqui: Number(precioliqui.value.trim())
    }

    try{
        const respuesta = await fetchProtegido('items/items_ingreso', 'POST', itemDATA)
        const resultado = await respuesta.json()

        if(!respuesta.ok){
            throw new Error(resultado.error || 'Error al cargar datos')
        }

        mostrarAlerta('Ingreso de Item exitoso', 'exito')


        form.reset()
        await items()
        
    }catch(error){
        console.error(error)
        mostrarAlerta(error.message, 'error')
    }
})

function renderizarTabla(item){
    const tr = document.createElement('tr')

    tr.innerHTML = `
    <td>${item.id_items}</td>
    <td>${item.categoria_descrip}</td>
    <td>${item.marcas_descrip}</td>
    <td>${item.grupo_descrip}</td>
    <td>${item.seccion_descrip}</td>
    <td>${item.porcentaje}</td>
    <td>${item.nombre_item}</td>
    <td>${item.pventa_unit}</td>
    <td>${item.pventa_may}</td>
    <td>${item.pventa_unit_liqui}</td>
    `
    tbody.appendChild(tr)
}
function mostrarAlerta(texto, tipo) {
    alertbox.textContent = texto
    alertbox.className = tipo
    alertbox.classList.remove('hidden')
}

async function inicializar(){
    Promise.all([
        categoria_item(),
        marca_item(),
        seccion_item(),
        grupo_item(),
        iva_item(),
        items()
    ])
}

document.addEventListener('DOMContentLoaded', inicializar)
