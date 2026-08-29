import { Router } from "express";
import verificarToken from "../middleware/authToken.js";
import * as aperturaCajaRouter from '../controllers/apertura_caja.controller.js'

const router = Router()
router.use(verificarToken)

router.post('/caja/abrir', aperturaCajaRouter.abrirCaja)
router.post('/caja/cerrar', aperturaCajaRouter.cajasAbiertas)

export default router