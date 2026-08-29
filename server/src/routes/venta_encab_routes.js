import { Router } from "express";
import verificarToken from "../middleware/authToken.js";
import * as ventasEncabDetRouter from "../controllers/ventas_encab_detalles.controller.js";

const router = Router()

router.use(verificarToken)

router.post('/ventas', ventasEncabDetRouter.ventasEncabDet)