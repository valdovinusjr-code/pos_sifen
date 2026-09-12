import { Router } from "express";
import verificarToken from "../middleware/authToken.js";
import * as ventasEncabDetRouter from "../controllers/ventas_encab_detalles.controller.js";

const router = Router()

router.use(verificarToken)

router.get('/ventas_datos', ventasEncabDetRouter.listarVentas)
router.get('/IVA', ventasEncabDetRouter.listarIVA)
router.get('/item', ventasEncabDetRouter.listarItems)
router.get('/condiciones_pago', ventasEncabDetRouter.listarCondicionesPago)
router.get('/formas_pago', ventasEncabDetRouter.listarFormasPago)
router.post('/ventas_nueva', ventasEncabDetRouter.ventasEncabDet)

export default router