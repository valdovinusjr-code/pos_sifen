console.log('EL ARCHIVO SE CARGO')

const caja = document.getElementById('id_caja')
const selectDenominacion = document.getElementById('select-denominacion')
const output = document.getElementById('total-general')
const cantidad = document.getElementById('input-cantidad')
const addRow = document.getElementById('btn-add-row')
const alertBox = document.getElementById('alert-box')
const tablaBody = document.getElementById('tabla-body')
const form = document.getElementById('apertura-form')

let listaDenominaciones = []
let detalleArray = []

async function cajas() {
    try {
        const respuesta = await fetchProtegido('apertura_caja/cajas')
        if (!respuesta) return;

        const listaCajas = await respuesta.json()
        if (!respuesta.ok) {
            throw new Error(listaCajas.error || 'No se pudieron cargar las cajas')
        }

        const opcionInicial = '<option value="" disabled selected>Seleccione una caja</option>'
        const opciones = listaCajas
            .map(c => `<option value="${c.id_caja}">Caja N° ${c.numero_caja}</option>`)
            .join('');

        caja.innerHTML = opcionInicial + opciones;
    } catch (error) {
        console.error('Error al cargar las cajas:', error)
        mostrarAlerta(error.message, 'error')
    }
}

async function cargarDenominaciones() {
    try {
        const respuesta = await fetchProtegido('apertura_caja/denominacion')
        if (!respuesta) return;

        listaDenominaciones = await respuesta.json();
        if (!respuesta.ok) throw new Error(listaDenominaciones.error || 'No se pudieron cargar las denominaciones')

        const opcionInicial = '<option value="" disabled selected>Seleccione denominación</option>'
        const opciones = listaDenominaciones
            .map(d => `<option value="${d.id_denominacion}" data-monto="${d.valor}">${d.valor} | ${d.simbolo} | ${d.nombre}</option>`)
            .join('')

        selectDenominacion.innerHTML = opcionInicial + opciones
    } catch (error) {
        console.error('Error al cargar las denominaciones:', error)
        mostrarAlerta(error.message, 'error')
    }
}

addRow.addEventListener('click', () => {
    const id_denominacion = parseInt(selectDenominacion.value)
    const vcantidad = parseInt(cantidad.value)
    
    if (!id_denominacion || isNaN(vcantidad) || vcantidad <= 0) {
        mostrarAlerta('Seleccione una denominación válida y una cantidad mayor a 0', 'error')
        return
    }

    const selectdeno = selectDenominacion.options[selectDenominacion.selectedIndex]
    const monto = parseFloat(selectdeno.dataset.monto) || 0
    const nombre = selectdeno.textContent

    const seleccionadosSUM = detalleArray.find(d => d.id_denominacion === id_denominacion)

    if (seleccionadosSUM) {
        seleccionadosSUM.cantidad += vcantidad
        seleccionadosSUM.total = seleccionadosSUM.cantidad * monto
    } else {
        detalleArray.push({
            id_denominacion,
            nombre,
            monto,
            cantidad: vcantidad,
            total: monto * vcantidad 
        })
    }

    selectDenominacion.selectedIndex = 0
    cantidad.value = ''
    alertBox.classList.add('hidden')

    renderizarTabla()
})

function renderizarTabla() {
    tablaBody.innerHTML = ''
    let total_apertura = 0
    
    detalleArray.forEach((item, index) => {
        total_apertura += item.total
        const fila = document.createElement('tr')
        fila.innerHTML = `
            <td>${item.nombre}</td>
            <td>${item.cantidad}</td>
            <td>Gs. ${item.total.toLocaleString('es-PY')}</td>
            <td>
                <button type="button" class="btn-remove" onclick="eliminaritem(${index})" title="Eliminar">&times;</button>
            </td>
        `
        tablaBody.appendChild(fila)
    })
    output.textContent = `Gs. ${total_apertura.toLocaleString('es-PY')}`
}

window.eliminaritem = function(index) {
    detalleArray.splice(index, 1)
    renderizarTabla()
}

form.addEventListener('submit', async (e) => {
    e.preventDefault()
    console.log('SUBMIT DISPARADO')
    const id_caja = parseInt(caja.value)

    if (!id_caja) {
        mostrarAlerta('No hay ninguna caja seleccionada', 'error')
        return;
    }

    if (detalleArray.length === 0) {
        mostrarAlerta('Debe haber al menos una denominación seleccionada', 'error')
        return;
    }

    const detalle = detalleArray.map(d => ({
        id_denominacion: d.id_denominacion,
        cantidad: d.cantidad
    }))

    try {

        const respuesta = await fetchProtegido('apertura_caja/caja/abrir', 'POST', { 
            id_caja, 
            detalles: detalle
        })

        if (!respuesta) return

        const datos = await respuesta.json()

        if (!respuesta.ok) {
            throw new Error(datos.error || datos.mensaje || 'Error al abrir la caja')
        }

        mostrarAlerta(`Caja abierta exitosamente con ID: ${datos.id_apertura_caja}`, 'success')

        form.reset()
        detalleArray = []
        renderizarTabla()

    } catch (error) {
        console.error('Error al abrir la caja:', error)
        mostrarAlerta(error.message, 'error')
    }
})

function mostrarAlerta(mensaje, tipo = 'info') {
    alertBox.textContent = mensaje
    alertBox.className = `alert ${tipo}`    
    alertBox.classList.remove('hidden')
}

async function inicializar() {
    await cajas()
    await cargarDenominaciones()
}

document.addEventListener('DOMContentLoaded', inicializar);