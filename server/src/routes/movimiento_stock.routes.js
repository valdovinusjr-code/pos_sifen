import { Router } from "express";
import * as carga_inicial from "../controllers/movimiento_stock.controller.js";

const router = Router()

router.post('/carga_inicial', carga_inicial.asignar)

export default router