import pool from "../config/db.js";

export const calcularDV = (valor) => {
    const numero = valor.split('').map(Number)
    let peso = 2
    let suma = 0
    
    for(let i = numero.length - 1; i >= 0; i--){
        suma += numero[i] * peso
        peso ++

        if(peso > 11) peso = 2
    }

    const modulo = suma % 11
    const dv = 11 -modulo
    
    if(dv === 11) return 0
    if(dv === 10) return 0

    return dv
}

export const listarTiposDocumento = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT id_tipo_documento, nombre
            FROM catalogos.tipo_documento
            ORDER BY id_tipo_documento
        `)

        res.status(200).json(rows)
    } catch (error) {
        console.error(error)
        res.status(500).json({
            error: 'No se pudieron cargar los tipos de documento'
        })
    }
}

export const listarFacturas = async (req, res) => {
    try {
        const { rows } = await pool.query(`
            SELECT id_documento_electronico, id_venta, v.fecha_hora, d.id_tipo_documento, d.nombre, t.id_timbrado, t.numero, cdc, numero_documento, ed.id_estado_documento, ed.idescripcion,fecha_emision, xml_payload
            FROM facturacion.documento_electronico de JOIN venta.encab_ventas v ON 
            de.id_venta = v.id_encab_ventas JOIN catalogos.tipo_documento d ON
            d.id_tipo_documento = de.id_tipo_documento JOIN facturacion.timbrado t ON
            de.id_timbrado = t.id_timbrado JOIN catalogos.estado_documento ed ON
            de.id_estado_documento = ed.id_estado_documento
	        ;
        `)

        res.status(200).json(rows)
    } catch (error) {
        console.error(error)
        res.status(500).json({
            error: 'No se pudieron cargar las facturas'
        })
    }
}

export const asignar = async(req, res) => {
    const {id_venta, id_tipo_documento} =req.body

    if(id_venta === null || id_venta === undefined || id_tipo_documento === null || id_tipo_documento === undefined){
        return res.status(400).json({error: 'todos los campos son obligatorios'})
    }

    const cliente = await pool.connect()

    try{
        await cliente.query('BEGIN')

        const {rows: id_ventas} = await cliente.query
        (`SELECT 
            ev.id_encab_ventas, ev.total, ev.id_cliente, 
            e.id_emisor, e.numero_documento AS emisor_code, 
            s.codigo AS sucursal_code, 
            pe.id_punto_exp, pe.codigo AS punto_exp_code, 
            ev.fecha_hora AS fecha_venta,  
            t.id_timbrado
            FROM venta.encab_ventas ev JOIN caja.apertura_caja ON
            ev.id_apertura_caja = apertura_caja.id_apertura_caja
            JOIN caja.cajas ON apertura_caja.id_caja = cajas.id_caja 
            JOIN catalogos.punto_expedicion pe ON cajas.id_punto_exp = pe.id_punto_exp
            JOIN catalogos.sucursales s ON pe.id_sucursal = s.id_sucursal 
            JOIN facturacion.emisor e ON e.id_emisor = 1 
            JOIN facturacion.timbrado t ON t.id_emisor = e.id_emisor AND t.activo = true
            WHERE ev.id_encab_ventas = $1
            `
            , [id_venta])

            if(id_ventas.length === 0){
                await cliente.query('ROLLBACK')
                return res.status(404).json({error: 'La venta no existe'})
            }

            const ventas = id_ventas[0]

            const {rows: numeracion_factura} = await cliente.query(`
                UPDATE facturacion.numeracion_documento
                SET numero_actual = numero_actual + 1
                WHERE id_punto_expedicion = $1 AND  id_tipo_documento = $2 RETURNING numero_actual
                `, [ventas.id_punto_exp, id_tipo_documento])
            
            if(numeracion_factura.length === 0){
                await cliente.query('ROLLBACK')
                return res.status(404).json({error: 'No hay numeracion configurada para este punto de expedicion'})
            }

            const numeracion = numeracion_factura[0].numero_actual

            const numero_documento = String(id_tipo_documento).padStart(2, "0"); 
            const rucSinGuion = String(ventas.emisor_code).split('-')[0].trim();
            const ruc_emisor = rucSinGuion.padStart(8, "0");
            const codigo_ruc = String(calcularDV(ruc_emisor));                   
            const sucursal = String(ventas.sucursal_code).padStart(3, "0");      
            const punto_expedicion = String(ventas.punto_exp_code).padStart(3, "0"); 
            const factura_numero = String(numeracion).padStart(7, "0");         
            const contribuyente = "1";                                           

            const fechaObj = new Date(ventas.fecha_venta);
            const fecha_emision = `${fechaObj.getFullYear()}${String(fechaObj.getMonth() + 1).padStart(2, '0')}${String(fechaObj.getDate()).padStart(2, '0')}`; // 8 d.

            const tipo_emision = "1";                                           
            const numero_aleatorio = String(Math.floor(Math.random() * 900000000) + 100000000); 

            const cdcsinDV = numero_documento + ruc_emisor + codigo_ruc + sucursal + punto_expedicion + factura_numero + contribuyente + fecha_emision + tipo_emision + numero_aleatorio;

            const cdcDv = String(calcularDV(cdcsinDV));

            const CDC = cdcsinDV + cdcDv;

            const xml_payload = 
            {
                CDC,
                fecha : ventas.fecha_venta,
                emisor: {id: ventas.id_emisor, ruc: ventas.emisor_code},
                cliente: {id: ventas.id_cliente},
                total: ventas.total
            }

            const {rows: documento} = await cliente.query
            (`
            INSERT INTO facturacion.documento_electronico
            (id_venta, id_tipo_documento, id_timbrado, cdc, numero_documento, id_estado_documento, xml_payload)    
            VALUES
            ($1, $2, $3, $4, $5, 1, $6) RETURNING id_documento_electronico
            `,
            [id_venta, id_tipo_documento, ventas.id_timbrado, CDC, numeracion, JSON.stringify(xml_payload)]
            )

            await cliente.query('COMMIT')
            res.status(201).json({
                message: 'documento generado',
                id_documento_electronico: documento.id_documento_electronico
            })

    }catch(error){
        await cliente.query('ROLLBACK')
        console.error(error)
        return res.status(500).json({ error: 'Problema al generar el documento' })
    }finally{
        cliente.release()
    }
}

