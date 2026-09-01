import { Router } from "express";
import verificarToken from "../middleware/authToken.js";
import * as clientesRoute from "../controllers/clientes.controller.js";

const router = Router()

router.use(verificarToken)

router.get('/:id/lista', clientesRoute.listar)
router.post('/crear', clientesRoute.asignar)

export default router