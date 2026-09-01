import { Router } from "express";
import verificarToken from "../middleware/authToken.js";
import * as itemsRoutes from "../controllers/items.controller.js";

const router = Router()

router.use(verificarToken)

router.get('/:id/items_registros', itemsRoutes.listar)
router.post('/items_ingreso', itemsRoutes.asignar)

export default router