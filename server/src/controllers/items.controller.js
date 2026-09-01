import pool from "../config/db.js";

export const listar = async(req, res)=>{
    try{
        const id = Number(req.params.id)
        if(!Number.isInteger(id) || id <= 0){
            return res.status(400).json({error: 'identificador invalido'})
        }
        const sql = 
        `
        SELECT 
        categoria_descrip, marcas_descrip,
        grupo_descrip, seccion_descrip,
        nombre_item, pventa_unit,
        pventa_may, pventa_unit_liqui,
        porcentaje, servicios, activo
        FROM inventario.items JOIN inventario.categorias_items
        ON items.id_categoria_items = categorias_items.id_categoria_items
        JOIN inventario.marcas_items ON inventario.items.id_marcas_items = marcas_items.id_marcas_items
        JOIN inventario.grupos_items ON inventario.items.id_grupo_items = grupos_items.id_grupo_items
        JOIN inventario.seccion_ubicacionitems ON inventario.items.id_seccion_items = seccion_ubicacionitems.id_seccion_items
        JOIN catalogos.porc_iva ON inventario.items.id_porc_iva = porc_iva.id_porc_iva
        WHERE id_items = $1
        `

        const {rows} = await pool.query(sql, [id])

        if(rows.length === 0){
            return res.status(404).json({error: 'el item no existe'})
        }

        res.status(200).json({
            message: 'Item encontrado',
            item: rows[0]
        })
    }catch(error){
        console.error(error)
        res.status(500).json({error: 'Problemas en el servidor'})
    }
}

export const asignar = async(req, res)=>{
    try{
        const {id_categoria_items, id_marcas_items, id_seccion_items, id_grupo_items, nombre_item, pventa_unit, pventa_may = null, pventa_unit_liqui = null, id_porc_iva} = req.body
        if(
            id_categoria_items === null|| 
            id_categoria_items === undefined|| 

            id_marcas_items === null|| 
            id_marcas_items === undefined|| 
            
            id_seccion_items === null|| 
            id_seccion_items === undefined|| 
            
            id_grupo_items === null || 
            id_grupo_items === undefined || 
            
            !nombre_item || 
            !pventa_unit || 
            !pventa_may || 
            !pventa_unit_liqui || 
            id_porc_iva === null|| 
            id_porc_iva === undefined
        )
            {
                return res.status(400).json({error: 'Todos los campos son obligatorios'})
            }
        const sql = 
        `
        INSERT INTO inventario.items 
        (id_categoria_items,
        id_marcas_items,
        id_seccion_items,
        id_grupo_items,
        nombre_item,
        pventa_unit,
        pventa_may,
        pventa_unit_liqui,
        id_porc_iva)
        VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id_items
        `

        const {rows} = await pool.query(sql, [id_categoria_items, id_marcas_items, id_seccion_items, id_grupo_items, nombre_item, pventa_unit, pventa_may, pventa_unit_liqui, id_porc_iva])

        res.status(201).json({
            message: 'Ingreso exitoso',
            item: rows[0].id_items
        })
    }catch(error){
        console.error(error)
        res.status(500).json({error: 'Problemas en el servidor'})
    }
}