
import cors from 'cors';
import express from 'express';
import usuariosRoute from '../routes/usuarios.js'
import usuarioSucursalRoute from '../routes/usuarios_sucursales.routes.js'
import aperturaCajaRoute from '../routes/apertura_caja.route.js'
const app = express()
const PUERTO = 3000

app.use(cors())
app.use(express.json())

app.use('/usuarios', usuariosRoute);
app.use('/usuarios_sucursales', usuarioSucursalRoute)
app.use('/apertura_caja', aperturaCajaRoute)
app.listen(PUERTO, ()=>{
    console.log(`Servidor levantado en http://localhost:${PUERTO}`)
})