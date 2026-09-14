const cliente = document.getElementById('id_cliente')
const condicion = document.getElementById('id_condicion')
const forma = document.getElementById('id_forma')
const item = document.getElementById('id_item')
const alertBox = document.getElementById('alert-box')
const addRow = document.getElementById('btn-add-row')
const cantidad = document.getElementById('input-cantidad')
const output = document.getElementById('total-general')
const tablaBody = document.getElementById('tabla-body')
const form = document.getElementById('venta-form')
const facturaModal = document.getElementById('factura-modal')
const facturaVenta = document.getElementById('factura-venta-info')
const facturaForm = document.getElementById('factura-form')
const documento = document.getElementById('id_tipo_documento')
const btnOmitir = document.getElementById('omitir-factura')

let idVentaPendiente = null
let listaItems = []
let detalleArray = []

async function clientes() {
    try {
        const respuesta = await fetchProtegido('clientes/lista')
        const listasCliente = await respuesta.json()
        if (!respuesta.ok) {
            throw new Error(listasCliente.error || 'No se pudieron cargar los clientes')
        }

        const opcionInicial = '<option value="" disabled selected>Seleccione un cliente</option>'
        const opciones = listasCliente
            .map(c => `<option value="${c.id_cliente}">${c.numero_documento} | ${c.nombre_razon_social}</option>`)
            .join('');

        cliente.innerHTML = opcionInicial + opciones;
    } catch (error) {
        console.error('Error al cargar los clientes:', error)
        mostrarAlerta(error.message, 'error')
    }
}

async function condicionesPago() {
    try {
        const respuesta = await fetchProtegido('ventas/condiciones_pago')
        if (!respuesta) return

        const datos = await respuesta.json()
        if (!respuesta.ok) throw new Error(datos.error || 'No se pudieron cargar las condiciones de pago')

        condicion.innerHTML = '<option value="" disabled selected>Seleccione una condicion</option>' + datos
            .map(item => `<option value="${item.id_condicion_pago}">${item.nombre_condicion}</option>`)
            .join('')
    } catch (error) {
        console.error('Error al cargar las condiciones de pago:', error)
        mostrarAlerta(error.message, 'error')
    }
}

async function formasPago() {
    try {
        const respuesta = await fetchProtegido('ventas/formas_pago')
        if (!respuesta) return

        const datos = await respuesta.json()
        if (!respuesta.ok) throw new Error(datos.error || 'No se pudieron cargar las formas de pago')

        forma.innerHTML = '<option value="" disabled selected>Seleccione una forma</option>' + datos
            .map(item => `<option value="${item.id_forma_pago}">${item.nombre_forma}</option>`)
            .join('')
    } catch (error) {
        console.error('Error al cargar las formas de pago:', error)
        mostrarAlerta(error.message, 'error')
    }
}

async function items() {
    try {
        const respuesta = await fetchProtegido('ventas/item')
        if (!respuesta) return

        const datos = await respuesta.json()
        if (!respuesta.ok) throw new Error(datos.error || 'No se pudieron cargar los items')

        listaItems = datos
        item.innerHTML = '<option value="" disabled selected>Seleccione una forma</option>' + datos
            .map(item => `<option value="${item.id_items}">${item.nombre_item}</option>`)
            .join('')
    } catch (error) {
        console.error('Error al cargar los items:', error)
        mostrarAlerta(error.message, 'error')
    }
}

addRow.addEventListener('click', ()=>{
    const id_item = Number(item.value)
    const seleccionCantidad = Number(cantidad.value)
    const seleccionItem = listaItems.find(i => i.id_items === id_item)

    if(!seleccionItem || !Number.isInteger(seleccionCantidad) || seleccionCantidad <= 0){
        mostrarAlerta('Debe tener al menos un item seleccionado y la cantidad debe ser mayor a 0')
        return
    }

    const detalle = detalleArray.find(dv => dv.id_item === id_item)

    if(detalle){
        detalle.cantidad += seleccionCantidad
        detalle.subtotal = detalle.cantidad * Number(detalle.precio_unit)
    }else{
        detalleArray.push({
            id_item: id_item,
            cantidad: seleccionCantidad,
            nombre: seleccionItem.nombre_item,
            precio_unit: seleccionItem.pventa_unit,
            subtotal: seleccionCantidad * Number(seleccionItem.pventa_unit)
        })
    }
    item.selectedIndex = 0
    cantidad.value = ''
    alertBox.classList.add('hidden')
    renderizarTabla()
})

function renderizarTabla(){
    tablaBody.innerHTML = ''
    let total = 0

    detalleArray.forEach((detalle, index)=>{
        total += detalle.subtotal
        const fila = document.createElement('tr')
        fila.innerHTML =`
        <td>${detalle.id_item}</td>
        <td>${detalle.precio_unit.toLocaleString('es-PY')}</td>
        <td>${detalle.cantidad}</td>
        <td>${detalle.subtotal.toLocaleString('es-PY')}</td>
        <td>
            <button type = "button" class = "btn-remove" onclick = eliminar(${index})>&times;</button>
        </td>
        `
        tablaBody.appendChild(fila)
    })

    output.textContent = `Gs. ${total.toLocaleString('es-PY')}`
}

window.eliminar = function(index){
    detalleArray.splice(index, 1)
    renderizarTabla()
}

form.addEventListener('submit', async(e)=>{
    e.preventDefault()

    if(!cliente || !condicion || !forma){
        mostrarAlerta('Cliente, Condicion y forma de pago NO pueden quedar vacios', 'error')
        return
    }

    if(detalleArray.length === 0){
        mostrarAlerta('No cargado ningun detalle', 'error')
    }
    try {
        const datos = await fetchProtegido('ventas/ventas_nueva', 'POST', {
            id_cliente: Number(cliente.value),
            id_condicion_pago: Number(condicion.value),
            id_forma_pago: Number(forma.value),
                detalle: detalleArray.map(detalle => ({
                    id_item: detalle.id_item,
                    cantidad: detalle.cantidad
            }))
        })     
        const resultado = await datos.json()  
        if(!datos.ok){
            throw new Error(resultado.error || 'Error al ejecutar una venta')
        } 

        idVentaPendiente = resultado.id_venta

        facturaVenta.textContent =
        `Venta ${idVentaPendiente} registrada. Generar factura`
        facturaModal.classList.remove('hidden')

        mostrarAlerta('Venta Realizada', 'exito')

        form.reset()
        detalleArray = []
        renderizarTabla()
    } catch (error) {
        console.error(error)
        mostrarAlerta('Problemas en el servidor', 'error')
    }
 
})

async function tiposDocumento() {
    try {
        const respuesta = await fetchProtegido('facturas/tipos')
        const datos = await respuesta.json()

        if (!respuesta.ok) {
            throw new Error(
                datos.error || 'No se pudieron cargar los documentos'
            )
        }

        documento.innerHTML =
            '<option value="" disabled selected>' +
            'Seleccione un documento' +
            '</option>' +
            datos.map(tipo =>
                `<option value="${tipo.id_tipo_documento}">
                    ${tipo.nombre}
                </option>`
            ).join('')
    } catch (error) {
        console.error(error)
        mostrarAlerta(error.message, 'error')
    }
}

facturaForm.addEventListener('submit', async(e)=>{
    e.preventDefault()

    try{
        const respuesta = await fetchProtegido('facturas/generar', 'POST',
            {id_venta: idVentaPendiente, id_tipo_documento: Number(documento.value)} 
        )

        const resultado = await respuesta.json()
        
        if(!respuesta.ok){
            throw new Error(resultado.error || 'No se pudo generar la factura')
        }

        cerrarModalFactura()
         mostrarAlerta(`Facturada generada con exito`, 'exito')
    }catch(error){
        console.error(error)
        mostrarAlerta(error.message, 'error')
    }
})

btnOmitir.addEventListener('click', cerrarModalFactura)

function cerrarModalFactura(){
    facturaModal.classList.add('hidden')
    facturaForm.reset()
    idVentaPendiente = null
}

function mostrarAlerta(mensaje, tipo = 'info') {
    alertBox.textContent = mensaje
    alertBox.className = `alert ${tipo}`    
    alertBox.classList.remove('hidden')
}

async function inicializar() {
    await clientes()
    await condicionesPago()
    await formasPago()
    await items()
    await tiposDocumento()
}
 document.addEventListener('DOMContentLoaded', inicializar)