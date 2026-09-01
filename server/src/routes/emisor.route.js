import { Router } from "express";
import verificarToken from "../middleware/authToken.js";
import esAdmin from '../middleware/esAdmin.js';
import * as emisorRoute from "../controllers/emisor.controller.js";

const router = Router()

router.use(verificarToken)
router.use(esAdmin)

router.get('/:id/lista', emisorRoute.listar)
router.post('/crear', emisorRoute.asignar)

export default router