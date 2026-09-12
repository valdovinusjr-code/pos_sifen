import { Router } from "express";
import verificarToken from "../middleware/authToken.js";
import * as clientesRoute from "../controllers/clientes.controller.js";

const router = Router()

router.use(verificarToken)

router.get('/lista', clientesRoute.listar)
router.get('/documento', clientesRoute.listarDocumentos)
router.get('/contribuyente', clientesRoute.listarContribuyente)
router.post('/crear', clientesRoute.asignar)

export default router