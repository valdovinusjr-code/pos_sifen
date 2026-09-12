const cliente = document.getElementById('id_cliente')
const condicion = document.getElementById('id_condicion')
const iva = document.getElementById('id_iva')

let listaItems = []
let detalleArray = []

async function clientes() {
    try {
        const respuesta = await fetchProtegido('ventas/ventas_nuevas')
        if (!respuesta) return;

        const listasCliente = await respuesta.json()
        if (!respuesta.ok) {
            throw new Error(listasCliente.error || 'No se pudieron cargar los clientes')
        }

        const opcionInicial = '<option value="" disabled selected>Seleccione un cliente</option>'
        const opciones = listasCliente
            .map(c => `<option value="${c.id_caja}">Caja N° ${c.numero_caja}</option>`)
            .join('');

        cliente.innerHTML = opcionInicial + opciones;
    } catch (error) {
        console.error('Error al cargar los clientes:', error)
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
