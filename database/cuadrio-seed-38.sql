USE cuadrio;

INSERT INTO cliente (cliente_id, despacho_id, razon_social, giro, tipo_persona, rfc, regimen, contador_id, situacion) VALUES
(6,1,'Hacienda Xcanatún Eventos SA de CV','Eventos y Hospitalidad','PM','HXE0806176GO','General de Ley Personas Morales',1,'Al corriente'),
(7,1,'Ferretería El Cenote SA de CV','Ferretería y Materiales','PM','FCX18101852P','General de Ley Personas Morales',2,'Al corriente'),
(8,1,'Transportes Uxmal SA de CV','Transporte de Carga','PM','TUX051003HSG','General de Ley Personas Morales',1,'Al corriente'),
(9,1,'Restaurante Los Almendros del Centro SA de CV','Restaurantes','PM','RAC1901275UN','General de Ley Personas Morales',2,'Al corriente'),
(10,1,'Clínica Dental Sonrisa Maya SC','Servicios Odontológicos','PM','CDS170512WY6','General de Ley Personas Morales',1,'Al corriente'),
(11,1,'Distribuidora Henequén SA de CV','Distribución de Abarrotes','PM','DHX071211F98','General de Ley Personas Morales',2,'Al corriente'),
(12,1,'Agencia de Viajes Chichén Tours SA de CV','Turismo','PM','AVC140515JTB','General de Ley Personas Morales',1,'Al corriente'),
(13,1,'Papelería Kukulcán SA de CV','Papelería y Oficina','PM','PKX1606151FZ','General de Ley Personas Morales',2,'Al corriente'),
(14,1,'Lavandería Express Itzimná SA de CV','Servicios de Lavandería','PM','LEI20021465Z','General de Ley Personas Morales',1,'Al corriente'),
(15,1,'Carnicería La Yucateca SA de CV','Alimentos y Carnes','PM','CYX130719467','General de Ley Personas Morales',2,'Por vencer'),
(16,1,'Laboratorio Clínico Dzibilchaltún SA de CV','Servicios de Salud','PM','LCD051008ID7','General de Ley Personas Morales',1,'Al corriente'),
(17,1,'Inmobiliaria Costa Maya SA de CV','Bienes Raíces','PM','ICM08122014J','General de Ley Personas Morales',2,'Al corriente'),
(18,1,'Gimnasio Poder Maya SA de CV','Deportes y Acondicionamiento','PM','GPM200428H34','General de Ley Personas Morales',1,'Al corriente'),
(19,1,'Estudio Creativo Cenote Azul SA de CV','Diseño y Publicidad','PM','ECC130913T96','General de Ley Personas Morales',2,'Al corriente'),
(20,1,'Pescadería Puerto Progreso SA de CV','Pesca y Mariscos','PM','PPP200714MSR','General de Ley Personas Morales',1,'Al corriente'),
(21,1,'Hotel Boutique Casa Mérida SA de CV','Hospedaje','PM','HBC050105375','General de Ley Personas Morales',2,'Al corriente'),
(22,1,'Academia de Inglés Kinich SC','Educación','PM','AIK160409536','General de Ley Personas Morales',1,'Al corriente'),
(23,1,'Materiales Yaxché SA de CV','Materiales para Construcción','PM','MYX200718CSU','General de Ley Personas Morales',2,'Al corriente'),
(24,1,'Cafetería Kaan SA de CV','Panaderías y Cafeterías','PM','CKX1902156Q2','General de Ley Personas Morales',1,'En mora'),
(25,1,'Farmacia San Cristóbal SA de CV','Farmacias','PM','FSC1007274ER','General de Ley Personas Morales',2,'Al corriente'),
(26,1,'Herrería Ukum SA de CV','Herrería y Metalmecánica','PM','HUX200604M0J','General de Ley Personas Morales',1,'Al corriente'),
(27,1,'Software Peninsular Tech SA de CV','Desarrollo de Software','PM','SPT190103A28','General de Ley Personas Morales',2,'Al corriente'),
(28,1,'Agropecuaria Sac-Nicté SA de CV','Agricultura y Ganadería','PM','ASN071026MPH','General de Ley Personas Morales',1,'Al corriente'),
(29,1,'Joyería Itzamná SA de CV','Joyería','PM','JIX060909WJA','General de Ley Personas Morales',2,'Por vencer'),
(30,1,'Servicios de Limpieza Brillo Maya SA de CV','Servicios de Limpieza','PM','SLB1511195I8','General de Ley Personas Morales',1,'Al corriente'),
(31,1,'Floristería Xunán SA de CV','Floricultura','PM','FXX120819I6S','General de Ley Personas Morales',2,'Al corriente'),
(32,1,'Panificadora Santa Lucía SA de CV','Panaderías y Cafeterías','PM','PSL070722KIT','General de Ley Personas Morales',1,'Al corriente'),
(33,1,'Transportes Turísticos Zazil SA de CV','Transporte Turístico','PM','TTZ180726J7M','General de Ley Personas Morales',2,'Por vencer'),
(34,1,'Arq. Fernando Pech Canul','Servicios de Arquitectura','PF','FPCX770104YED','RESICO Persona Física',3,'Al corriente'),
(35,1,'Lic. Andrea Chan Moo','Servicios Legales','PF','ACMX910621WBB','RESICO Persona Física',2,'Al corriente'),
(36,1,'Dra. Rosa Várguez Tun','Servicios Médicos','PF','RVTX810811T2U','RESICO Persona Física',3,'Al corriente'),
(37,1,'Ing. Jorge Canché Uc','Consultoría en Ingeniería','PF','JCUX680815KJ7','Actividades Empresariales y Profesionales',2,'Al corriente'),
(38,1,'Marisol Euán Poot','Estética y Belleza','PF','MEPX710720V3O','Actividades Empresariales y Profesionales',3,'Al corriente');

INSERT INTO obligacion (cliente_id, nombre, fecha_vencimiento) VALUES
(6,'ISR Provisional','2026-11-08'),
(7,'ISR Provisional','2026-11-07'),
(8,'Nómina e IMSS Quincenal','2026-11-10'),
(9,'Nómina e IMSS Quincenal','2026-11-07'),
(10,'Nómina e IMSS Quincenal','2026-11-05'),
(11,'DIOT y Retenciones','2026-11-11'),
(12,'Nómina e IMSS Quincenal','2026-11-10'),
(13,'IVA Mensual CFDI 4.0','2026-11-11'),
(14,'DIOT y Retenciones','2026-11-16'),
(15,'IVA Mensual CFDI 4.0','2026-11-16'),
(16,'ISR Provisional','2026-11-06'),
(17,'IVA Mensual CFDI 4.0','2026-11-04'),
(18,'Nómina e IMSS Quincenal','2026-11-13'),
(19,'DIOT y Retenciones','2026-11-09'),
(20,'ISR Provisional','2026-11-03'),
(21,'DIOT y Retenciones','2026-11-16'),
(22,'ISR Provisional','2026-11-08'),
(23,'ISR Provisional','2026-11-04'),
(24,'DIOT y Retenciones','2026-11-11'),
(25,'ISR Provisional','2026-11-12'),
(26,'DIOT y Retenciones','2026-11-12'),
(27,'DIOT y Retenciones','2026-11-13'),
(28,'ISR Provisional','2026-11-04'),
(29,'DIOT y Retenciones','2026-11-04'),
(30,'Nómina e IMSS Quincenal','2026-11-05'),
(31,'IVA Mensual CFDI 4.0','2026-11-13'),
(32,'IVA Mensual CFDI 4.0','2026-11-15'),
(33,'DIOT y Retenciones','2026-11-14'),
(34,'Declaración RESICO','2026-11-15'),
(35,'Declaración RESICO','2026-11-05'),
(36,'Declaración RESICO','2026-11-13'),
(37,'IVA Mensual CFDI 4.0','2026-11-11'),
(38,'DIOT y Retenciones','2026-11-07');

INSERT INTO estado_documental (cliente_id, docs_validados, docs_requeridos, estado) VALUES
(6,8,8,'En revisión OCR'),
(7,3,3,'Listo p/ dispersión'),
(8,5,5,'100% Validado'),
(9,4,4,'100% Validado'),
(10,6,6,'100% Validado'),
(11,4,4,'100% Validado'),
(12,5,5,'100% Validado'),
(13,4,4,'100% Validado'),
(14,8,8,'100% Validado'),
(15,5,7,'Faltan 2 documentos'),
(16,8,8,'100% Validado'),
(17,8,8,'100% Validado'),
(18,7,7,'100% Validado'),
(19,5,5,'100% Validado'),
(20,3,3,'Listo p/ dispersión'),
(21,4,4,'100% Validado'),
(22,8,8,'100% Validado'),
(23,6,6,'100% Validado'),
(24,3,5,'2 pendientes de subir'),
(25,4,4,'En revisión OCR'),
(26,3,3,'Listo p/ dispersión'),
(27,6,6,'100% Validado'),
(28,6,6,'En revisión OCR'),
(29,5,7,'Faltan 2 documentos'),
(30,6,6,'100% Validado'),
(31,4,4,'100% Validado'),
(32,6,6,'100% Validado'),
(33,4,5,'Falta 1 XML egreso'),
(34,5,5,'100% Validado'),
(35,4,4,'100% Validado'),
(36,8,8,'100% Validado'),
(37,6,6,'100% Validado'),
(38,8,8,'100% Validado');

INSERT INTO cobro (cliente_id, concepto, monto, fecha_vencimiento, pagado) VALUES
(8,'Honorarios septiembre',2500.00,'2026-10-05',1),
(11,'Honorarios octubre',3200.00,'2026-11-04',0),
(11,'Honorarios septiembre',4800.00,'2026-10-05',1),
(13,'Honorarios septiembre',2500.00,'2026-10-05',1),
(16,'Honorarios septiembre',4800.00,'2026-10-05',1),
(17,'Honorarios octubre',2500.00,'2026-11-11',0),
(22,'Honorarios septiembre',4800.00,'2026-10-05',1),
(23,'Honorarios octubre',3200.00,'2026-11-06',0),
(24,'Honorarios y recargos',12300.00,'2026-09-15',0),
(27,'Honorarios octubre',9800.00,'2026-11-07',0),
(27,'Honorarios septiembre',2500.00,'2026-10-05',1),
(31,'Honorarios octubre',4800.00,'2026-11-09',0),
(32,'Honorarios octubre',9800.00,'2026-11-02',0),
(33,'Honorarios octubre',3200.00,'2026-11-14',0),
(37,'Honorarios septiembre',2500.00,'2026-10-05',1),
(38,'Honorarios octubre',9800.00,'2026-11-07',0),
(38,'Honorarios septiembre',4800.00,'2026-10-05',1);

-- ---------- Vistas actualizadas (reemplazan a la anterior) ----------
-- "Hoy" para el chatbot = fecha de operación de la pantalla.
CREATE OR REPLACE VIEW v_hoy AS
SELECT CAST(valor AS DATE) AS hoy FROM parametro WHERE clave = 'fecha_operacion';

CREATE OR REPLACE VIEW v_directorio_clientes AS
SELECT
  c.cliente_id, c.razon_social, c.giro, c.tipo_persona, c.rfc, c.regimen, c.situacion,
  ct.nombre AS contador, ct.puesto AS puesto_contador,
  (SELECT o.nombre FROM obligacion o
    WHERE o.cliente_id = c.cliente_id AND o.presentada = 0
    ORDER BY o.fecha_vencimiento LIMIT 1) AS proxima_obligacion,
  (SELECT MIN(o.fecha_vencimiento) FROM obligacion o
    WHERE o.cliente_id = c.cliente_id AND o.presentada = 0) AS fecha_proxima_obligacion,
  DATEDIFF((SELECT MIN(o.fecha_vencimiento) FROM obligacion o
             WHERE o.cliente_id = c.cliente_id AND o.presentada = 0),
           (SELECT hoy FROM v_hoy)) AS dias_para_vencer,
  ed.docs_validados, ed.docs_requeridos, ed.estado AS estado_documental,
  COALESCE((SELECT SUM(b.monto) FROM cobro b
    WHERE b.cliente_id = c.cliente_id AND b.pagado = 0), 0) AS saldo_pendiente,
  COALESCE((SELECT SUM(b.monto) FROM cobro b
    WHERE b.cliente_id = c.cliente_id AND b.pagado = 0
      AND b.fecha_vencimiento < (SELECT hoy FROM v_hoy)), 0) AS saldo_vencido,
  COALESCE((SELECT MAX(DATEDIFF((SELECT hoy FROM v_hoy), b.fecha_vencimiento)) FROM cobro b
    WHERE b.cliente_id = c.cliente_id AND b.pagado = 0
      AND b.fecha_vencimiento < (SELECT hoy FROM v_hoy)), 0) AS dias_mora
FROM cliente c
JOIN contador ct ON ct.contador_id = c.contador_id
LEFT JOIN estado_documental ed ON ed.cliente_id = c.cliente_id
WHERE c.activo = 1;

-- ---------- Verificación: debe dar 38 / 32 / 4 / 2 / 4 / 2 ----------
-- SELECT COUNT(*) AS total,
--   SUM(situacion='Al corriente') AS al_corriente,
--   SUM(situacion='Por vencer')   AS por_vencer,
--   SUM(situacion='En mora')      AS en_mora,
--   SUM(dias_para_vencer BETWEEN 0 AND 5) AS vencimientos_urgentes,
--   SUM(saldo_vencido > 0)        AS con_saldo_vencido
-- FROM v_directorio_clientes;
