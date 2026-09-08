const caja = document.getElementById('id_caja')
const selectDenominacion = document.getElementById('select-denominacion')
const output = document.getElementById('total-general')
const cantidad = document.getElementById('input-cantidad')
const addRow = document.getElementById('btn-add-row')
const alertBox = document.getElementById('alert-box')
let listaDenominaciones = []
let detalleArray = []
async function cajas() {
    try{
        const respuesta = await fetchProtegido('apertura_caja/cajas')
        if(!respuesta){
            return
        }
        const cajas = await respuesta.json()
        if(!respuesta.ok){
            throw new Error(cajas.error || 'No se pudieron cargar las cajas')
        }
        const select = document.getElementById('id_caja')

        select.innerHTML = cajas
            .map(c => `<option value="${c.id_caja}">${c.numero_caja}</option>`)
            .join('')
    }catch(error){
        console.error('Error al cargar las cajas:', error)
    }
}

async function cargarDenominaciones() {
    try {
        const respuesta = await fetchProtegido('apertura_caja/denominacion');
        if (!respuesta) return;

        listaDenominaciones = await respuesta.json();
        if (!respuesta.ok) throw new Error(listaDenominaciones.error || 'No se pudieron cargar las denominaciones');

        const opcionInicial = '<option value="" disabled selected>Seleccione denominación</option>';
        const opciones = listaDenominaciones
            .map(d => `<option value="${d.id_denominacion}" data-monto="${d.valor}">${d.valor} | ${d.simbolo} | ${d.nombre}</option>`)
            .join('');

        selectDenominacion.innerHTML = opcionInicial + opciones;
    } catch (error) {
        console.error('Error al cargar las denominaciones:', error);
        mostrarAlerta(error.message, 'error');
    }
}

addRow.addEventListener('click', ()=>{
    const id_denominacion = parseFloat(selectDenominacion.value)
    const vcantidad = parseFloat(cantidad.value)
    
    if(!id_denominacion || isNaN(vcantidad) || cantidad <= 0){
        mostrarAlerta('Seleccione una denominacion validad asi mismo una cantidad mayor a 0')
    }

    const selectdeno = selectDenominacion.options[selectDenominacion.selectedIndex]
    const monto = parseFloat(selectdeno.dataset.monto)
    const nombre = selectDenominacion.textContent

    const seleccionadosSUM = detalleArray.find(d => d.id_denominacion === id_denominacion)

    if(seleccionadosSUM){
        seleccionadosSUM.cantidad += cantidad
        seleccionadosSUM.total += seleccionadosSUM.cantidad * monto
    }else{
        detalleArray.push({
            id_denominacion,
            nombre,
            monto,
            cantidad,
            total: monto * cantidad 
        })
    }

    selectDenominacion.selectedIndex = 0
    cantidad.value = ''
    alertBox.classList.add('hidden')

    renderizarTabla()
})

async function inicializar() {
    await cajas()
    await cargarDenominaciones()
}

inicializar()