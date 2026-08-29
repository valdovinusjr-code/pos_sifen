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