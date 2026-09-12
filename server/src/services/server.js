
import cors from 'cors';
import express from 'express';
import usuariosRoute from '../routes/usuarios.js'
import usuarioSucursalRoute from '../routes/usuarios_sucursales.routes.js'
import aperturaCajaRoute from '../routes/apertura_caja.route.js'
import clienteRoute from '../routes/cliente.route.js'
import itemsRoute from '../routes/items.routes.js'
import ventasEncabDet from '../routes/venta_encab.routes.js';
import movimientoCarga from '../../src/routes/movimiento_stock.routes.js'
import emisorRoute from '../../src/routes/emisor.route.js'
import timbradoRoute from '../../src/routes/timbrados.route.js'
import eventoRoute from '../../src/routes/evento_documento.route.js'

const app = express()
const PUERTO = 3000

app.use(cors({
    origin: 'http://127.0.0.1:5500',
    credentials: true
}))

app.use(express.json())

app.use('/usuarios', usuariosRoute);
app.use('/usuarios_sucursales', usuarioSucursalRoute)
app.use('/apertura_caja', aperturaCajaRoute)
app.use('/items', itemsRoute)
app.use('/clientes', clienteRoute)
app.use('/ventas', ventasEncabDet)
app.use('/movimiento_stock', movimientoCarga)
app.use('/emisor', emisorRoute)
app.use('/timbrado', timbradoRoute)
app.use('/evento', eventoRoute)

app.listen(PUERTO, ()=>{
    console.log(`Servidor levantado en http://localhost:${PUERTO}`)
})