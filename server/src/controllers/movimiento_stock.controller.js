import pool from "../config/db.js";

export const asignar = async(req, res)=>{
    try{
        const {id_item, id_sucursal, cantidad} = req.body
        if(
            id_item === null || id_item === undefined ||
            id_sucursal === null || id_sucursal === undefined ||
            !cantidad
        ){
            return res.status(400).json({error: 'Todos los campos son obligatorios'})
        }

        const {rows: entrada_item} = await pool.query(`
            SELECT id_tipo_movimiento FROM catalogos.tipo_movimiento WHERE descripcion ILIKE 'compra'
            `)
        if(entrada_item.length === 0){
            return res.status(404).json({error: 'el tipo de movimiento seleccionado no existe'})
        }

        const tipo_movimiento = entrada_item[0].id_tipo_movimiento

        const {rows: carga_inicial} = await pool.query(
            `INSERT INTO inventario.movimiento_stock(id_item, id_tipo_movimiento, id_sucursal, cantidad) VALUES($1, $2, $3, $4) RETURNING id_movimiento_stock, id_item, id_sucursal, cantidad`,
        [id_item, tipo_movimiento, id_sucursal, cantidad])

        res.status(201).json({
            message: "Carga inicial exitosa",
            movimiento: carga_inicial[0]
        })
    }catch(error){
        console.error(error)
        res.status(500).json({error: 'Problemas en el servidor'})
    }
}