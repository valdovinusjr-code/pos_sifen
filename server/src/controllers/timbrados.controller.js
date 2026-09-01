import pool from "../config/db.js";

export const asignar = async(req, res)=>{
    const {id_emisor, numero, fecha_inicio, fecha_vencimiento} = req.body

    if(
        id_emisor == null || id_emisor === undefined ||
        !numero || 
        fecha_inicio === null || fecha_inicio === undefined ||
        fecha_vencimiento === null || fecha_vencimiento === undefined
    )
    {
        return res.status(400).json({error: 'Todos los campos son obligatorios'})
    }

    const cliente = await pool.connect()

    try{
        await cliente.query('BEGIN')
        
        await cliente.query(`
            UPDATE timbrados SET activo = false WHERE activo = true AND fecha_vencimiento < CURRENT_DATE
        `)

        const {rows: nuevo_timbrado} = await cliente.query(`
            INSERT INTO timbrados(id_emisor, numero, fecha_inicio, fecha_vencimiento) VALUES($1, $2, $3, $4) RETURNING id_timbrado`,
            [id_emisor, numero, fecha_inicio, fecha_vencimiento])

        await cliente.query(`COMMIT`)
        res.status(201).json({
            message: 'Timbrado generado exitosamente',
            id_timbrado: nuevo_timbrado[0].id_timbrado
        })
    }catch(error){
        await cliente.query('ROLLBACK')
        if(error.code === '23505'){
            return res.status('409').json({error: 'El numero ya fue usado, ingrese uno nuevo'})
        }
        res.status(500).json({error: 'Problemas en la base de datos'})
    }finally{
        cliente.release()
    }
}