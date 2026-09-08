import { Router } from "express";
import verificarToken from "../middleware/authToken.js";
import * as timbradoRoute from "../controllers/timbrados.controller.js";

const router = Router()

router.use(verificarToken)

router.post('/crear', timbradoRoute.asignar)

export default router