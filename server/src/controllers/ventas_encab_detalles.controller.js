import pool from "../config/db.js";

export const ventasEncabDet = async(req, res)=>{
    const {id_cliente, id_condicion_pago, id_forma_pago, detalle} = req.body
    if(!id_cliente || !id_condicion_pago || !id_forma_pago || !Array.isArray(detalle) || detalle.length === 0){
        return res.status(400).json({error: "los campos de detalles no pueden quedar vacios"})
    }

    const cliente = await pool.connect()

    cliente.on('notice', (msg) => {
        console.log('NOTICE BD:', msg.message);
    });
    
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