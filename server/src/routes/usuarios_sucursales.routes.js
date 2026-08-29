import { Router } from "express";
import esAdmin from "../middleware/esAdmin.js";
import verificarToken from "../middleware/authToken.js";
import * as usuarioSucursal from '../controllers/usuarioSucursal.controller.js'
const router = Router()

router.use(verificarToken)
router.use(esAdmin)

router.get('/:id/sucursales', usuarioSucursal.listar)
router.post('/:id/sucursales', usuarioSucursal.asignar)
router.delete('/:id/sucursales/id_sucursal', usuarioSucursal.quitar)

export default router