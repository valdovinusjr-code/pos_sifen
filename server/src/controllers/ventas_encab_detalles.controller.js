import pool from "../config/db.js";

export const listarVentas = async(req, res)=>{
    try{
        const sql = 
        `
        SELECT
        dv.id_det_ventas,
        dv.id_item,
        dv.cantidad,
        dv.precio_unit,
        dv.id_porc_iva,
        dv.subtotal,
        c.id_cliente AS id_cliente,
        c.nombre_razon_social,
        c.numero_documento,
        f.id_forma_pago,
        f.nombre_forma,
        cd.id_condicion_pago,
        cd.nombre_condicion
        FROM venta.detalle_ventas dv
        JOIN venta.encab_ventas ev ON dv.id_encab_ventas = ev.id_encab_ventas
        JOIN venta.cliente c ON ev.id_cliente = c.id_cliente
        JOIN catalogos.forma_pago f ON ev.id_forma_pago = f.id_forma_pago
        JOIN catalogos.condicion_pago cd ON ev.id_condicion_pago = cd.id_condicion_pago
        `

        const {rows} = await pool.query(sql)

        if(rows.length === 0){
            return res.status(404).json({error: 'el contribuyente no existe'})
        }

        res.status(200).json(rows)
    }catch(error){
        console.error(error)
        res.status(500).json({error: 'Problemas en el servidor'})
    }
}

export const listarCondicionesPago = async(req, res)=>{
    try{
        const {rows} = await pool.query(`
            SELECT id_condicion_pago, nombre_condicion
            FROM catalogos.condicion_pago
            ORDER BY id_condicion_pago
        `)

        if(rows.length === 0){
            return res.status(404).json({error: 'No existen condiciones de pago'})
        }

        res.status(200).json(rows)
    }catch(error){
        console.error(error)
        res.status(500).json({error: 'Problemas en el servidor'})
    }
}

export const listarItems = async(req, res)=>{
    try{
        const {rows} = await pool.query(`
            SELECT id_items,
            id_categoria_items, 
            id_marcas_items, 
            id_seccion_items, 
            id_grupo_items, 
            nombre_item, 
            pventa_unit, 
            pventa_may, 
            pventa_unit_liqui, 
            id_porc_iva, 
            servicios, 
            activo
	        FROM inventario.items;
        `)

        if(rows.length === 0){
            return res.status(404).json({error: 'No existen items'})
        }

        res.status(200).json(rows)
    }catch(error){
        console.error(error)
        res.status(500).json({error: 'Problemas en el servidor'})
    }
}

export const listarFormasPago = async(req, res)=>{
    try{
        const {rows} = await pool.query(`
            SELECT id_forma_pago, nombre_forma
            FROM catalogos.forma_pago
            ORDER BY id_forma_pago
        `)

        if(rows.length === 0){
            return res.status(404).json({error: 'No existen formas de pago'})
        }

        res.status(200).json(rows)
    }catch(error){
        console.error(error)
        res.status(500).json({error: 'Problemas en el servidor'})
    }
}

export const listarIVA = async(req, res)=>{
    try{
        const {rows} = await pool.query(`
            SELECT id_porc_iva, porcentaje
            FROM catalogos.porc_iva
            ORDER BY id_porc_iva
        `)

        if(rows.length === 0){
            return res.status(404).json({error: 'Sin acceso al IVA'})
        }

        res.status(200).json(rows)
    }catch(error){
        console.error(error)
        res.status(500).json({error: 'Problemas en el servidor'})
    }
}

export const ventasEncabDet = async(req, res)=>{
    const {id_cliente, id_condicion_pago, id_forma_pago, detalle} = req.body
    if(!id_cliente || !id_condicion_pago || !id_forma_pago || !Array.isArray(detalle) || detalle.length === 0){
        return res.status(400).json({error: "los campos de detalles no pueden quedar vacios"})
    }

    if(!Number.isInteger(Number(id_cliente)) || Number(id_cliente) <= 0){
        return res.status(400).json({error: 'cliente invalido'})
    }

    if(!Number.isInteger(Number(id_condicion_pago)) || Number(id_condicion_pago) <= 0){
        return res.status(400).json({error: 'condicion de pago invalida'})
    }

    if(!Number.isInteger(Number(id_forma_pago)) || Number(id_forma_pago) <= 0){
        return res.status(400).json({error: 'forma de pago invalida'})
    }
    const cliente = await pool.connect()
    
    try{
        await cliente.query('BEGIN')
        const {rows: apertura_caja} = await cliente.query
        (`
        SELECT id_apertura_caja FROM caja.apertura_caja WHERE id_usuario = $1 
        AND id_apertura_caja NOT IN (SELECT id_apertura_caja FROM caja.cierre_caja)    
        `, [req.usuario.id_usuario])

        if(apertura_caja.length === 0){
            await cliente.query('ROLLBACK')
            return res.status(400).json({error: 'la caja esta cerrada'})
        }

        const caja_abierta = apertura_caja[0].id_apertura_caja

        const {rows: encab_ventas} = await cliente.query(   
            `INSERT INTO venta.encab_ventas(id_apertura_caja, id_cliente, id_condicion_pago, id_forma_pago) VALUES($1, $2, $3, $4) RETURNING id_encab_ventas`,
            [caja_abierta, id_cliente, id_condicion_pago, id_forma_pago]
        )

        const id_encab = encab_ventas[0].id_encab_ventas

        
        for(const items of detalle){
            const {rows: precio_porciva} = await cliente.query(
                `SELECT pventa_unit, id_porc_iva FROM inventario.items WHERE id_items = $1`, [items.id_item]
            )

            const precio_unit = precio_porciva[0].pventa_unit
            const id_porc_iva = precio_porciva[0].id_porc_iva
            
            await cliente.query(`
                INSERT INTO venta.detalle_ventas(id_encab_ventas, id_item, cantidad, precio_unit, id_porc_iva)
                VALUES($1, $2, $3, $4, $5)
                `, [id_encab, items.id_item, items.cantidad, precio_unit, id_porc_iva] )
        }

        const {rows: totalRows} = await cliente.query(`SELECT total FROM venta.encab_ventas WHERE id_encab_ventas = $1`, [id_encab])
        
        const {rows: nombre_cliente_rows} = await cliente.query(`SELECT c.nombre_razon_social FROM venta.encab_ventas JOIN venta.cliente c ON encab_ventas.id_cliente = c.id_cliente WHERE id_encab_ventas = $1`, [id_encab])

        const total = totalRows[0].total
        const nombre_cliente = nombre_cliente_rows[0].nombre_razon_social

        await cliente.query('COMMIT')
        res.status(201).json({
            id_venta: id_encab,
            total: total,
            cliente: nombre_cliente
        })
    }catch(error){
        await cliente.query('ROLLBACK')
        if(error.code === 'P0001'){
            return res.status(409).json(error.message)
        }
        console.error(error)
        res.status(500).json({error: 'Problemas en el acceso a la base de datos'})
    }finally{
        cliente.release()
    }
}