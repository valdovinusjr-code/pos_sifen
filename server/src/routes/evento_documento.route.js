import { Router } from "express";
import verificarToken from "../middleware/authToken.js";
import * as eventoRoute from "../controllers/evento_documento.controller.js";

const router = Router()

router.use(verificarToken)

router.post('/evento_asignar', eventoRoute.asignar)

export default router