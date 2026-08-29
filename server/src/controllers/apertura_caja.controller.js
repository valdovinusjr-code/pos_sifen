import pool from "../config/db.js";

export const abrirCaja = async(req, res) => {
    const {id_caja, detalles} = req.body
    
    if(!id_caja || !Array.isArray(detalles) || detalles.length === 0){
        return res.status(400).json({error: 'el identificador de la caja y detaalles no debe estar vacios'})
    }
    const cliente = await pool.connect()
    try{    
        await cliente.query('BEGIN')
        
        const {rows: apertura_cajas_abiertas} = await cliente.query(`
            SELECT id_apertura_caja 
            FROM caja.apertura_caja 
            WHERE id_usuario = $1 AND id_apertura_caja 
            NOT IN (SELECT id_apertura_caja FROM caja.cierre_caja)
            `,
            [req.usuario.id_usuario]
        )
        if(apertura_cajas_abiertas.length > 0){
            await cliente.query('ROLLBACK')
            return res.status(409).json({error: 'La caja sigue abierta, cierre la caja o continue su uso'})
        }

        const {rows: apertura_de_caja} = await cliente.query(`
            INSERT INTO caja.apertura_caja 
            (id_usuario, id_caja) 
            VALUES($1, $2)
            RETURNING id_apertura_caja
            `, [req.usuario.id_usuario, id_caja])

        const caja_abierta = apertura_de_caja[0].id_apertura_caja

        for(const item of detalles){
            await cliente.query(`INSERT INTO caja.apertura_detalle(id_apertura_caja, id_denominacion, cantidad)
                VALUES($1, $2, $3)`, [caja_abierta, item.id_denominacion, item.cantidad])
        }

        await cliente.query('COMMIT')
        res.status(201).json({
            message: 'Apertura de caja exitosa',
            id_apertura_caja: caja_abierta
        })
    }catch(error){
        await cliente.query('ROLLBACK')
        console.error(error)
        res.status(500).json({error: 'Problema al abrir la caja'})
    }finally{
        cliente.release()
    }
}

export const cajasAbiertas = async (req, res) => {
    const {detalle} = req.body

    if(!Array.isArray(detalle) || detalle.length === 0){
        return res.status(400).json({error: 'el id de la apertura de caja y el detalle no pueden estar vacios'})
    }

    const cliente = await pool.connect()

    try{
        await cliente.query('BEGIN')
        const {rows: caja_abierta} = await cliente.query(`
            SELECT id_apertura_caja FROM caja.apertura_caja 
            WHERE id_usuario = $1 AND id_apertura_caja 
            NOT IN(SELECT id_apertura_caja FROM caja.cierre_caja)
            `, [req.usuario.id_usuario])

        if(caja_abierta.length === 0){
            await cliente.query('ROLLBACK')
            return res.status(404).json({error: 'La caja sigue cerrada'})
        }

        const id_caja_abierta = caja_abierta[0].id_apertura_caja

        const {rows: ventas_totales} = await cliente.query(`
            SELECT COALESCE(SUM(total), 0) AS total_ventas FROM venta.encab_ventas 
            WHERE id_apertura_caja = $1 
            AND id_forma_pago = (SELECT id_forma_pago FROM catalogos.forma_pago WHERE nombre_forma ILIKE 'Efectivo')`
            , [id_caja_abierta])

        const total_efectivo_ventas = Number(ventas_totales[0].total_ventas)

        const {rows: fondo_inicial} = await cliente.query(
            `SELECT COALESCE(SUM(ad.cantidad * d.valor), 0) AS fondo_inicial 
            FROM caja.apertura_detalle ad JOIN catalogos.denominacion d ON ad.id_denominacion = d.id_denominacion
            WHERE ad.id_apertura_caja = $1 `, [id_caja_abierta]
        )

        const fondo_caja_apertura = Number(fondo_inicial[0].fondo_inicial)

        const monto_esperado = total_efectivo_ventas + fondo_caja_apertura

        const {rows: cerrar_caja} = await cliente.query(
            `INSERT INTO caja.cierre_caja(id_apertura_caja, monto_esperado) VALUES($1, $2) RETURNING id_cierre_caja`
            , [id_caja_abierta, monto_esperado])
        
        const  id_cierre = cerrar_caja[0].id_cierre_caja

        for(const items of detalle){
            await cliente.query(`INSERT INTO caja.arqueo_detalle (id_denominacion, cantidad, id_cierre_caja) VALUES($1, $2, $3) RETURNING id_arqueo_detalle`, [items.id_denominacion, items.cantidad, id_cierre])
        }

        const {rows: monto_final} = await cliente.query(`
            SELECT COALESCE(SUM(ad.cantidad * d.valor), 0) AS monto_real FROM caja.arqueo_detalle ad JOIN catalogos.denominacion d 
            ON ad.id_denominacion = d.id_denominacion WHERE ad.id_cierre_caja = $1 
            `, [id_cierre])

        const monto_real = Number(monto_final[0].monto_real)

        const diferencia = monto_esperado - monto_real 

        await cliente.query('COMMIT')
        res.status(201).json({
            monto_esperado: monto_esperado,
            monto_real: monto_real,
            diferencia: diferencia
        })
    }catch(error){
        await cliente.query('ROLLBACK')
        console.error(error)
        res.status(500).json({error: 'problemas en el servidor'})
    }finally{
        cliente.release()
    }
}