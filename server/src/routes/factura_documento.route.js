import { Router } from "express";
import verificarToken from "../middleware/authToken.js";
import * as facturasController from "../controllers/factura_documento.controller.js";

const router = Router()

router.use(verificarToken)

router.post('/generar', facturasController.asignar)
router.get('/tipos', facturasController.listarTiposDocumento)
export default router