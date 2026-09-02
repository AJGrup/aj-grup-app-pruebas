/* ═══════════════════════════════════════════════════════════════════════════
   AJ GRUP CRM · OLA 0 · PASO 3 — AJ.sync v0.1.0 (piloto: Capa PERSONAS)

   Puente localStorage ↔ Postgres para la primera Capa migrada. Regla del
   doble período: LOCAL ES LA FUENTE DE VERDAD; Supabase es el espejo que se
   va llenando. `bajar` sirve para verificación y para el corte final.

   · Mapeadores PUROS local↔row (testeables en node, cero red).
   · subirPersonas(): upsert masivo por uuid + hijos (embudos, residencia)
     + nivelado del contador AJ-P en servidor (evita colisiones futuras).
   · bajarPersonas(): lectura completa para comparar (checklist de recuentos).
   · compararPersonas(): resumen local vs remoto para la verificación.

   Requiere en navegador: supabase-config.js + aj-remote.js. En node solo se
   usan los mapeadores (los métodos de red comprueban AJ.remote).
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var root = (typeof window !== 'undefined') ? window : globalThis;
  root.AJ = root.AJ || {};

  var IDIOMAS = ['es', 'ca', 'en', 'fr'];
  var ROLES = ['cliente_finances', 'comprador_inmo', 'vendedor_inmo', 'propietario',
    'colaborador', 'agente_finances', 'agente_inmo', 'supervisor'];
  var ORIGENES_RGPD = ['recomendacion', 'web', 'portal', 'campana', 'oficina', 'colaborador', 'otro'];
  var EMBUDOS = ['cliente_finances', 'comprador_inmo', 'vendedor_inmo', 'propietario', 'colaborador'];
  var VINCULOS = ['inquilino', 'propietario', 'otro'];

  /* Potenciales pasó de 2 etapas a 4 el 30-ago-2026: las dos nuevas van delante
     porque el trabajo de llamar —y de volver a llamar— no tenía dónde vivir. */
  var FASES_OP = ['primer_contacto', 'segundo_contacto', 'estudio', 'documentacion',
    'encargo', 'enviado_banco', 'paga_y_senal',
    'arras', 'tasacion', 'FEIN', 'firma', 'perdido', 'descartado'];
  var ESTADO_LEGACY = { escriturada: 'firma', pendiente_firma: 'firma' };
  var TASACIONES = ['no_realizada', 'ok', 'ok_estado', 'ko'];
  var ORIGENES_OP = ['directo', 'agente', 'empresa'];
  var ENTIDADES_SEG = ['operacion_finances', 'comprador_inmo', 'captacion_inmo',
    'visita_inmo', 'propiedad_inmo', 'persona'];
  var TIPOS_SEG = ['nota', 'llamada', 'cita', 'visita', 'whatsapp', 'email_enviado',
    'email_recibido', 'documento_enviado', 'evento_sistema'];
  var ESTADOS_SEG = ['programada', 'realizada', 'no_realizada', 'anulada'];
  var MESES = { enero: 1, febrero: 2, marzo: 3, abril: 4, mayo: 5, junio: 6, julio: 7,
    agosto: 8, septiembre: 9, octubre: 10, noviembre: 11, diciembre: 12 };

  function _uuid() {
    if (root.AJ && root.AJ.id && typeof root.AJ.id.uuid === 'function') return root.AJ.id.uuid();
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
  function _s(v) { var t = (v == null) ? '' : String(v).trim(); return t || null; }
  function _enum(v, lista, porDefecto) { return lista.indexOf(v) >= 0 ? v : porDefecto; }
  function _iso(v) {
    if (v == null || v === '') return new Date().toISOString();
    if (typeof v === 'number') return new Date(v).toISOString();       // epoch ms legacy
    return String(v);
  }

  /* ── DINERO: euros (string/number en formatos ES) → CÉNTIMOS enteros ──
     Convención documentada: un único punto seguido de EXACTAMENTE 3 dígitos
     es separador de miles ('5.500' = 5.500,00 €); en cualquier otro caso el
     último separador (',' o '.') es el decimal. Contexto hipotecario: no hay
     importes con 3 decimales. */
  function eurosACents(v) {
    if (v == null) return null;
    if (typeof v === 'number') { return isNaN(v) ? null : Math.round(v * 100); }
    var s = String(v).trim().replace(/€/g, '').replace(/\s+/g, '');
    if (!s) return null;
    var neg = s.charAt(0) === '-'; if (neg) s = s.slice(1);
    var tieneP = s.indexOf('.') >= 0, tieneC = s.indexOf(',') >= 0;
    if (tieneP && tieneC) {
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) s = s.replace(/\./g, '').replace(',', '.');
      else s = s.replace(/,/g, '');
    } else if (tieneC) {
      s = s.replace(',', '.');
    } else if (tieneP) {
      var partes = s.split('.');
      if (partes.length > 2 || (partes.length === 2 && partes[1].length === 3 && partes[0].length > 0)) {
        s = partes.join('');                                            // miles
      }
    }
    var n = parseFloat(s);
    if (isNaN(n)) return null;
    return (neg ? -1 : 1) * Math.round(n * 100);
  }
  function centsAEuros(c) { return c == null ? null : c / 100; }

  /* mes previsto de cobro legacy ('Julio') → date (día 1, año en curso) */
  function _mesADate(v) {
    var t = _s(v); if (!t) return null;
    if (/^\d{4}-\d{2}-\d{2}/.test(t)) return t.slice(0, 10);
    var n = MESES[t.toLowerCase()];
    if (!n) return null;
    var y = new Date().getFullYear();
    return y + '-' + String(n).padStart(2, '0') + '-01';
  }

  /* ── ctx de usuarios: ids legacy ('admin','camilo','armin') ↔ uuid Auth ──
     Se construye desde la tabla usuarios (por nombre, minúsculas). */
  function construirCtx(usuariosRows) {
    var porLegacy = {}, porUuid = {};
    (usuariosRows || []).forEach(function (u) {
      var legacy = (u.rol === 'admin' && u.sociedad_principal === 'ambas') ? 'admin'
        : String(u.nombre || '').toLowerCase();
      porLegacy[legacy] = u.id;
      porLegacy[String(u.nombre || '').toLowerCase()] = u.id;
      porUuid[u.id] = legacy;
    });
    return { porLegacy: porLegacy, porUuid: porUuid };
  }
  function _agenteAUuid(v, ctx) {
    if (!v) return null;
    if (/^[0-9a-f]{8}-/.test(String(v))) return v;               // ya es uuid
    return (ctx && ctx.porLegacy && ctx.porLegacy[String(v).toLowerCase()]) || null;
  }
  function _agenteALegacy(v, ctx) {
    if (!v) return null;
    return (ctx && ctx.porUuid && ctx.porUuid[v]) || v;           // si no se conoce, deja el uuid
  }

  /* ── MAPEADOR persona local → fila Postgres ── */
  function mapPersonaLocalARow(p, ctx) {
    var dir = p.direccion;
    var dirObj = (dir && typeof dir === 'object') ? dir : null;
    var rgpd = (p.rgpd && typeof p.rgpd === 'object') ? p.rgpd : {};
    var esJ = p.type === 'juridica';
    return {
      id: p.uuid || _uuid(),
      codigo: p.id || null,                       // AJ-P-NNN (la BD lo exige único)
      type: esJ ? 'juridica' : 'fisica',
      nombre: _s(p.nombre) || '—',
      dni: _s(p.dni), cif: _s(p.cif), representante: _s(p.representante),
      telefono: _s(p.telefono), email: _s(p.email),
      fecha_nacimiento: _s(p.fechaNacimiento),
      fecha_constitucion: _s(p.fechaConstitucion),
      idioma: _enum(p.idioma, IDIOMAS, 'es'),
      empresa: _s(p.empresa),
      referencia_interna: _s(p.referenciaInterna),
      agente_captacion_id: _agenteAUuid(p.agenteCaptacionId || p.agentId, ctx),
      dir_calle: dirObj ? _s(dirObj.calle) : _s(dir),   // legacy: dirección como texto plano
      dir_numero: dirObj ? _s(dirObj.numero) : null,
      dir_puerta: dirObj ? _s(dirObj.puerta) : null,
      dir_poblacion: dirObj ? _s(dirObj.poblacion) : null,
      dir_cp: dirObj ? _s(dirObj.codigoPostal) : null,
      dir_provincia: (dirObj && _s(dirObj.provincia)) || 'Girona',
      dir_pais: (dirObj && _s(dirObj.pais)) || 'España',
      roles: (Array.isArray(p.roles) ? p.roles : []).filter(function (r) { return ROLES.indexOf(r) >= 0; }),
      rgpd_origen_dato: _enum(rgpd.origenDato, ORIGENES_RGPD, null),
      rgpd_consentimiento: !!rgpd.consentimientoComunicaciones,
      rgpd_fecha_consent: _s(rgpd.fechaConsentimiento),
      requiere_verificacion_datos: !!p.requiere_verificacion_datos,
      notas: _s(p.notas), notas_comerciales: _s(p.notasComerciales),
      created_at: _s(p.createdAt) || new Date().toISOString(),
      updated_at: _s(p.updatedAt) || new Date().toISOString()
    };
  }

  /* ── MAPEADOR fila Postgres → persona local ── */
  function mapRowAPersonaLocal(row, ctx) {
    return {
      id: row.codigo,
      uuid: row.id,
      type: row.type || 'fisica',
      nombre: row.nombre || '',
      dni: row.dni || null, cif: row.cif || null, representante: row.representante || null,
      telefono: row.telefono || null, email: row.email || null,
      fechaNacimiento: row.fecha_nacimiento || null,
      fechaConstitucion: row.fecha_constitucion || null,
      idioma: _enum(row.idioma, IDIOMAS, 'es'),
      empresa: row.empresa || null,
      referenciaInterna: row.referencia_interna || null,
      agenteCaptacionId: _agenteALegacy(row.agente_captacion_id, ctx),
      direccion: {
        calle: row.dir_calle || '', numero: row.dir_numero || '', puerta: row.dir_puerta || '',
        poblacion: row.dir_poblacion || '', codigoPostal: row.dir_cp || '',
        provincia: row.dir_provincia || 'Girona', pais: row.dir_pais || 'España'
      },
      roles: Array.isArray(row.roles) ? row.roles.slice() : [],
      rgpd: {
        origenDato: row.rgpd_origen_dato || null,
        consentimientoComunicaciones: !!row.rgpd_consentimiento,
        fechaConsentimiento: row.rgpd_fecha_consent || null
      },
      requiere_verificacion_datos: !!row.requiere_verificacion_datos,
      notas: row.notas || '', notasComerciales: row.notas_comerciales || '',
      embudos: [], residencia: null,               // los rellena bajarPersonas() con los hijos
      createdAt: row.created_at, updatedAt: row.updated_at
    };
  }

  /* ── hijos: embudos y residencia ── */
  function mapEmbudoLocalARow(e, personaUuid, ctx) {
    return {
      persona_id: personaUuid,
      embudo: _enum(e.embudo, EMBUDOS, 'cliente_finances'),
      /* 'descartado' entra aquí el 28-ago: sin él, un comprador que Finances
         descarta volvía de la nube como 'activo' — o sea, como si lo
         gestionáramos. La lista blanca callaba el dato en vez de fallar. */
      estado: _enum(e.estado, ['activo', 'ganado', 'perdido', 'pausa', 'descartado'], 'activo'),
      desde: _s(e.desde) || new Date().toISOString(),
      hasta: _s(e.hasta),
      agente_id: _agenteAUuid(e.agenteId, ctx),
      notas: _s(e.notas)
    };
  }
  function mapRowAEmbudoLocal(row, ctx) {
    return { embudo: row.embudo, estado: row.estado, desde: row.desde, hasta: row.hasta || null,
      agenteId: _agenteALegacy(row.agente_id, ctx), notas: row.notas || null };
  }
  function mapResidenciaLocalARow(r, personaUuid) {
    return {
      persona_id: personaUuid,
      ref_catastral: _s(r.refCatastral),
      direccion_canonica: _s(r.direccionCanonica),
      vinculo: _enum(r.vinculo, VINCULOS, 'inquilino'),
      desde: _s(r.desde) || new Date().toISOString().slice(0, 10)
    };
  }
  function mapRowAResidenciaLocal(row) {
    return { refCatastral: row.ref_catastral, direccionCanonica: row.direccion_canonica,
      vinculo: row.vinculo, desde: row.desde };
  }

  /* ── MAPEADOR operación local → fila Postgres ──
     OJO: fein_fecha_vencimiento NO se envía (columna GENERADA +10d en BD).
     es_lead SÍ se envía: el trigger del servidor lo corrige para fases
     activas y lo respeta en perdido/descartado (clasificación histórica). */
  function mapOperacionLocalARow(op, ctx) {
    var fein = op.fein || {};
    var estado = ESTADO_LEGACY[op.estado] || op.estado;
    return {
      id: op.uuid || _uuid(),
      codigo: _s(op.codigo),                    // null → subir() lo omite y la BD asigna AJ-F-NNN
      estado: _enum(estado, FASES_OP, 'estudio'),
      /* cuándo entró en esta fase (0025): sin esto los umbrales del §4.7 no se
         pueden calcular. Si el local no lo trae, la BD lo sella sola. */
      fecha_estado_cambio: _s(op.fechaEstadoCambio) || null,
      es_lead: !!op.esLead,
      en_embudo: op.enEmbudo !== false,
      archivado: !!op.archivado,
      entidad_bancaria: _s(op.entidad),
      precio_compra_cents: eurosACents(op.precioCompra),
      importe_cents: eurosACents(op.importe),
      honorarios_cents: eurosACents(op.honorarios) || 0,
      fecha_entrada: _s(op.fecha) || new Date().toISOString().slice(0, 10),
      fecha_firma_prevista: _s(op.fechaFirma),
      fecha_cobro_prevista: _mesADate(op.fechaCobro),
      tasacion: _enum(op.tasacion, TASACIONES, null),
      vida: !!op.vida, sialp: !!op.sialp,
      tipo_origen: _enum(op.tipoOrigen, ORIGENES_OP, 'directo'),
      colaborador_nombre: _s(op.colaborador),
      pct_colaborador: parseFloat(op.pctColaborador) || 0,
      agente_operacion_id: _agenteAUuid(op.agenteOperacion || op.agenteFin, ctx),
      cobrada: !!op.cobrada,
      fecha_cobro_real: _s(op.fechaCobroReal),
      fein_recibida: !!fein.recibida,
      fein_fecha_recepcion: _s(fein.fechaRecepcion),
      fein_referencia: _s(fein.referencia),
      created_at: _iso(op.createdAt),
      updated_at: _iso(op.updatedAt)
    };
  }

  /* titulares[] de la op → filas operacion_titulares (personaId AJ-P-NNN → uuid) */
  function mapTitularesARows(op, personasPorCodigo, avisos) {
    var out = [];
    var lista = (Array.isArray(op.titulares) && op.titulares.length) ? op.titulares : [];
    for (var i = 0; i < lista.length && out.length < 3; i++) {
      var t = lista[i];
      var uuid = t.personaId ? personasPorCodigo[t.personaId] : null;
      if (!uuid) {
        if (avisos) avisos.push('op ' + (op.codigo || op.id) + ': titular "' + (t.nombre || '?') + '" sin ficha de persona — omitido');
        continue;
      }
      out.push({ operacion_id: op.uuid, persona_id: uuid,
        rol: out.length === 0 ? 'titular' : 'cotitular', orden: out.length });
    }
    return out;
  }

  /* ── a qué apunta un seguimiento ────────────────────────────────────────────
     `entidadId` guarda el identificador LOCAL de aquello a lo que cuelga: el
     `op_1771…` de una operación, el `AJ-P-014` de una persona, el `AJ-CL-003`
     de una captación. En el servidor esas entidades viven por uuid, así que
     subir el identificador local deja el enlace roto — y roto está: 123
     seguimientos apuntan a un `op_…` contra un `operaciones.id` que es uuid.

     El descuido tiene nombre: el mapa `op.id → op.uuid` YA se construía para
     las oportunidades, y a este mapeador nunca se le pasó. La línea de al lado,
     `persona_id`, sí traducía; por eso los de persona están bien.

     Lo que no se puede resolver —comprador_inmo y visita_inmo viven en
     colecciones que hoy no se suben— se deja tal cual y SE CUENTA. Un enlace
     que no se puede hacer se dice; callarlo es el fallo que estamos corrigiendo. */
  var _ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  function _resolverEntidadSeg(s, mapas) {
    var v = s.entidadId == null ? '' : String(s.entidadId);
    if (!v) return { id: '', resuelto: true };
    if (_ES_UUID.test(v)) return { id: v, resuelto: true };   // ya traducido: idempotente
    var m = ({
      operacion_finances: mapas.ops,
      persona:            mapas.personas,
      captacion_inmo:     mapas.captacion,
      propiedad_inmo:     mapas.propiedades
    })[s.entidadOrigen];
    if (m && m[v]) return { id: m[v], resuelto: true };
    return { id: v, resuelto: false, origen: s.entidadOrigen || 'persona' };
  }

  /* Los mapas de identificador local → uuid, todos de una vez. */
  function _mapasEntidadSeg(personas, personasPorCodigo) {
    /* Una operación se puede nombrar de tres formas y las tres aparecen en
       `entidadId` según la época del dato: por su CÓDIGO humano (`AJ-F-011`,
       que es lo que guardan los 143 seguimientos de este CRM), por su `id`
       local —que hoy YA es el uuid— y por el `op_1771…` de los seeds viejos.
       Se indexan las tres: costó una reparación en falso indexar solo por id,
       que en las operaciones es el uuid y por tanto no traducía nada. */
    var ops = {};
    (personas || []).forEach(function (p) {
      (p.operaciones || []).forEach(function (op) {
        if (!op.uuid) return;
        if (op.id) ops[op.id] = op.uuid;
        if (op.codigo) ops[op.codigo] = op.uuid;
      });
    });
    var deStore = function (clave) {
      var m = {};
      _leerStore(clave).forEach(function (x) {
        if (!x.uuid) return;
        if (x.id) m[x.id] = x.uuid;
        if (x.codigo) m[x.codigo] = x.uuid;
      });
      return m;
    };
    return {
      ops: ops,
      personas: personasPorCodigo || {},
      captacion: deStore('aj_captacion'),
      propiedades: deStore('aj_inmo_propiedades')
    };
  }

  /* ── MAPEADOR seguimiento local → fila Postgres (tolerante con seeds
        antiguos sin uuid/personaId/system/resultados) ── */
  function mapSeguimientoLocalARow(s, ctx, personasPorCodigo, mapas, sinResolver) {
    return {
      id: s.uuid || _uuid(),
      codigo: _s(s.id),                          // null → subir() lo omite y la BD asigna AJ-S-NNN
      entidad_origen: _enum(s.entidadOrigen, ENTIDADES_SEG, 'persona'),
      entidad_id: (function () {
        var r = _resolverEntidadSeg(s, mapas || {});
        if (!r.resuelto && sinResolver) sinResolver.push(r.origen);
        return r.id;
      })(),
      persona_id: (s.personaId && personasPorCodigo[s.personaId]) || null,
      tipo: _enum(s.tipo, TIPOS_SEG, 'nota'),
      texto: _s(s.texto) || '—',
      autor_usuario_id: _agenteAUuid(s.autorId, ctx),
      autor_nombre: _s(s.autorNombre),
      fecha: _s(s.fecha) || new Date().toISOString().slice(0, 10),
      hora: _s(s.hora),
      duracion_min: parseInt(s.duracion_min, 10) || 0,
      estado: _enum(s.estado, ESTADOS_SEG, 'realizada'),
      agendado: !!s.agendado_bool,
      resultados: Array.isArray(s.resultados) ? s.resultados : [],
      system: !!s.system,
      created_at: _iso(s.createdAt),
      updated_at: _iso(s.updatedAt)
    };
  }

  /* ── operaciones de red (navegador) ── */
  function _remote() {
    if (!(root.AJ && root.AJ.remote)) throw new Error('[AJ.sync] AJ.remote no cargado');
    return root.AJ.remote;
  }
  function _leerLocales() {
    if (root.AJ && root.AJ.store && typeof root.AJ.store.get === 'function') {
      return root.AJ.store.get('aj_personas', []) || [];
    }
    try { return JSON.parse(root.localStorage.getItem('aj_personas') || '[]'); } catch (e) { return []; }
  }
  /* persistir con fallback: la página piloto no carga aj-core (sin AJ.store) */
  function _persistir(clave, valor) {
    try {
      if (root.AJ && root.AJ.store && typeof root.AJ.store.set === 'function') { root.AJ.store.set(clave, valor); return; }
    } catch (e) {}
    try { root.localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) {}
  }

  async function cargarCtx() {
    var rows = await _remote().listar('usuarios', 'select=id,nombre,rol,sociedad_principal');
    return construirCtx(rows);
  }

  async function nivelarContador(prefijo, objetivo) {
    var R = _remote();
    if (!objetivo || objetivo < 1) return 0;
    try {
      /* una sola llamada (migración 0004) — solo puede SUBIR el contador */
      return await R.rpc('nivelar_contador', { p_prefijo: prefijo, p_minimo: objetivo });
    } catch (e) {
      if (e && e.status === 404) return null;   // 0004 sin aplicar → el caller lo avisa
      throw e;
    }
  }

  function _maxCodigo(lista, prefijo) {
    var max = 0, re = new RegExp('^' + prefijo + '-(\\d+)$');
    lista.forEach(function (x) { var m = re.exec(x || ''); if (m) max = Math.max(max, parseInt(m[1], 10)); });
    return max;
  }
  function _personasPorCodigo(personas) {
    var mapa = {};
    personas.forEach(function (p) { if (p.id && p.uuid) mapa[p.id] = p.uuid; });
    return mapa;
  }
  function _sinCodigo(row) { var r = {}; Object.keys(row).forEach(function (k) { if (k !== 'codigo') r[k] = row[k]; }); return r; }

  /* ── OPERACIONES: subir (upsert por uuid + titulares espejo + backfill de
        códigos AJ-F asignados por el servidor hacia el local) ── */
  async function subirOperaciones() {
    var R = _remote();
    var ctx = await cargarCtx();
    var personas = _leerLocales();
    var avisos = [];
    /* asegurar uuid en personas y en ops (idempotencia) */
    var mutado = false;
    personas.forEach(function (p) {
      if (!p.uuid) { p.uuid = _uuid(); mutado = true; }
      (p.operaciones || []).forEach(function (op) { if (!op.uuid) { op.uuid = _uuid(); mutado = true; } });
    });
    var porCodigo = _personasPorCodigo(personas);
    var ops = [];
    personas.forEach(function (p) {
      (p.operaciones || []).forEach(function (op) {
        if (!Array.isArray(op.titulares) || !op.titulares.length) {
          op.titulares = [{ personaId: p.id, nombre: p.nombre, dni: p.dni || null, rol: 'titular' }];
          mutado = true;
        }
        ops.push(op);
      });
    });
    var nTit = 0;
    for (var i = 0; i < ops.length; i++) {
      var op = ops[i];
      var row = mapOperacionLocalARow(op, ctx);
      await R.upsert('operaciones', row.codigo ? row : _sinCodigo(row), 'id');
      await R.eliminar('operacion_titulares', 'operacion_id=eq.' + op.uuid);
      var tits = mapTitularesARows(op, porCodigo, avisos);
      if (tits.length) { await R.insertar('operacion_titulares', tits); nTit += tits.length; }
    }
    /* backfill: códigos AJ-F asignados por el servidor → visibles en el CRM local */
    var remotas = await R.listar('operaciones', 'select=id,codigo&deleted_at=is.null');
    var codigoPorUuid = {};
    (remotas || []).forEach(function (r) { codigoPorUuid[r.id] = r.codigo; });
    var backfill = 0;
    ops.forEach(function (op) {
      if (!op.codigo && codigoPorUuid[op.uuid]) { op.codigo = codigoPorUuid[op.uuid]; mutado = true; backfill++; }
    });
    if (mutado) _persistir('aj_personas', personas);
    var contador = await nivelarContador('AJ-F', _maxCodigo(ops.map(function (o) { return o.codigo; }), 'AJ-F'));
    return { subidas: ops.length, titulares: nTit, codigosAsignados: backfill, contador: contador, avisos: avisos };
  }

  /* ── OPERACIONES: comparar con foco en CÉNTIMOS (el punto delicado) ── */
  async function compararOperaciones() {
    var R = _remote();
    var personas = _leerLocales();
    var locales = [];
    personas.forEach(function (p) { (p.operaciones || []).forEach(function (op) { locales.push(op); }); });
    var remotas = await R.listar('operaciones', 'select=*&deleted_at=is.null');
    var titRemotos = await R.listar('operacion_titulares', 'select=operacion_id,persona_id,rol');
    var titPorOp = {};
    (titRemotos || []).forEach(function (t) { (titPorOp[t.operacion_id] = titPorOp[t.operacion_id] || []).push(t); });
    var porUuid = {};
    (remotas || []).forEach(function (r) { porUuid[r.id] = r; });
    var faltan = [], difieren = [], dinero = [];
    locales.forEach(function (op) {
      var r = op.uuid ? porUuid[op.uuid] : null;
      var etiqueta = op.codigo || op.id;
      if (!r) { faltan.push(etiqueta); return; }
      var difs = [];
      var estadoEsperado = _enum(ESTADO_LEGACY[op.estado] || op.estado, FASES_OP, 'estudio');
      if (r.estado !== estadoEsperado) difs.push('estado(' + r.estado + '≠' + estadoEsperado + ')');
      if (r.es_lead !== !!op.esLead && ['perdido', 'descartado'].indexOf(r.estado) >= 0) difs.push('es_lead');
      if ((r.entidad_bancaria || '') !== (_s(op.entidad) || '')) difs.push('entidad');
      if (r.fein_recibida !== !!(op.fein && op.fein.recibida)) difs.push('fein');
      /* céntimos: local euros → cents esperados vs lo que hay en Postgres */
      [['honorarios', 'honorarios_cents'], ['importe', 'importe_cents'], ['precioCompra', 'precio_compra_cents']]
        .forEach(function (par) {
          var esperado = eurosACents(op[par[0]]);
          if (par[1] === 'honorarios_cents' && esperado == null) esperado = 0;
          var real = r[par[1]];
          var ok = String(esperado) === String(real);
          dinero.push({ op: etiqueta, campo: par[0], local: op[par[0]] == null ? '' : String(op[par[0]]),
            esperadoCents: esperado, remotoCents: real, ok: ok });
          if (!ok) difs.push(par[0] + '(' + real + '≠' + esperado + ')');
        });
      var nTitLocal = Math.min(3, (op.titulares || []).filter(function (t) { return t.personaId; }).length);
      var nTitRemoto = (titPorOp[op.uuid] || []).length;
      if (nTitLocal !== nTitRemoto) difs.push('titulares(' + nTitRemoto + '≠' + nTitLocal + ')');
      if (difs.length) difieren.push({ op: etiqueta, campos: difs });
    });
    var dineroOK = dinero.every(function (d) { return d.ok; });
    return { locales: locales.length, remotas: (remotas || []).length, faltanEnRemoto: faltan,
      difieren: difieren, dinero: dinero, dineroOK: dineroOK,
      ok: !faltan.length && !difieren.length && dineroOK };
  }

  /* ── SEGUIMIENTOS ── */
  function _leerSeguimientosLocales() {
    if (root.AJ && root.AJ.store && typeof root.AJ.store.get === 'function') {
      return root.AJ.store.get('aj_seguimientos', []) || [];
    }
    try { return JSON.parse(root.localStorage.getItem('aj_seguimientos') || '[]'); } catch (e) { return []; }
  }
  async function subirSeguimientos() {
    var R = _remote();
    var ctx = await cargarCtx();
    var personas = _leerLocales();
    var porCodigo = _personasPorCodigo(personas);
    var segs = _leerSeguimientosLocales();
    var mutado = false;
    /* self-heal: si el remoto ya tiene una fila con ese código, adoptar su uuid.

       Antes esto solo actuaba cuando el local NO tenía uuid, y esa mitad de
       regla reventaba la subida: dos navegadores del mismo CRM asignan uuids
       distintos al mismo `AJ-S-NNN`, así que el local llegaba con uuid propio,
       no colisionaba por `id` —el upsert va por ahí— y colisionaba por
       `codigo`, que es único en la base: «duplicate key value violates unique
       constraint seguimientos_codigo_key».

       Manda el CÓDIGO, no el uuid: es la identidad humana del seguimiento y no
       se recicla nunca (J1), así que mismo código es el mismo registro. Adoptar
       el uuid del servidor conserva su identidad y deja que el contenido local
       lo actualice por encima; forzar el uuid local obligaría a borrar la fila
       de arriba, que es justo lo que no se hace con datos reales. */
    var remotosPrevios = await R.listar('seguimientos', 'select=id,codigo');
    var uuidPorCodigo = {};
    (remotosPrevios || []).forEach(function (r) { if (r.codigo) uuidPorCodigo[r.codigo] = r.id; });
    var realineados = 0;
    segs.forEach(function (s) {
      var delServidor = s.id ? uuidPorCodigo[s.id] : null;
      if (delServidor && s.uuid !== delServidor) {
        s.uuid = delServidor; realineados++; mutado = true;
      }
      if (!s.uuid) { s.uuid = _uuid(); mutado = true; }
    });
    if (mutado) _persistir('aj_seguimientos', segs);
    /* dos lotes: los que ya traen código y los que no. A los segundos se les
       omite el campo para que sea la base de datos quien lo asigne, y por eso no
       pueden ir en la misma petición que los primeros. */
    var mapas = _mapasEntidadSeg(personas, porCodigo);
    var sinResolver = [];
    var conCodigo = [], sinCodigo = [];
    segs.forEach(function (x) {
      var row = mapSeguimientoLocalARow(x, ctx, porCodigo, mapas, sinResolver);
      if (row.codigo) conCodigo.push(row); else sinCodigo.push(_sinCodigo(row));
    });
    if (conCodigo.length) await _upsertLote('seguimientos', conCodigo, 'id');
    if (sinCodigo.length) await _upsertLote('seguimientos', sinCodigo, 'id');
    var contador = await nivelarContador('AJ-S', _maxCodigo(segs.map(function (s) { return s.id; }), 'AJ-S'));
    /* Lo que no se pudo enlazar, dicho por tipo y no escondido en un total. */
    var porOrigen = {};
    sinResolver.forEach(function (o) { porOrigen[o] = (porOrigen[o] || 0) + 1; });
    return { subidas: segs.length, contador: contador, realineados: realineados,
             sinEnlazar: sinResolver.length, sinEnlazarPorOrigen: porOrigen };
  }
  async function compararSeguimientos() {
    var R = _remote();
    var segs = _leerSeguimientosLocales();
    var remotos = await R.listar('seguimientos', 'select=id,codigo,tipo,estado,fecha,agendado');
    var porUuid = {};
    (remotos || []).forEach(function (r) { porUuid[r.id] = r; });
    var faltan = [], difieren = [];
    segs.forEach(function (s) {
      var r = s.uuid ? porUuid[s.uuid] : null;
      if (!r) { faltan.push(s.id || '(sin id)'); return; }
      var difs = [];
      if (r.tipo !== _enum(s.tipo, TIPOS_SEG, 'nota')) difs.push('tipo');
      if (r.estado !== _enum(s.estado, ESTADOS_SEG, 'realizada')) difs.push('estado');
      if (r.fecha !== s.fecha) difs.push('fecha');
      if (r.agendado !== !!s.agendado_bool) difs.push('agendado');
      if (difs.length) difieren.push({ seg: s.id, campos: difs });
    });
    return { locales: segs.length, remotos: (remotos || []).length, faltanEnRemoto: faltan,
      difieren: difieren, ok: !faltan.length && !difieren.length };
  }

  /* ── REALTIME · seguimiento remoto → local (mapeador inverso completo:
        los seguimientos son la única entidad que se APLICA en vivo durante el
        doble período — el resto avisa y pide recarga; el merge total llega
        con el corte, cuando la fuente de verdad pasa al servidor) ── */
  function mapRowASeguimientoLocal(row, ctx, codigoPorUuidPersona) {
    return {
      id: row.codigo,
      uuid: row.id,
      entidadOrigen: row.entidad_origen,
      entidadId: row.entidad_id,
      personaId: (row.persona_id && codigoPorUuidPersona && codigoPorUuidPersona[row.persona_id]) || null,
      tipo: row.tipo, texto: row.texto,
      autorId: _agenteALegacy(row.autor_usuario_id, ctx),
      autorNombre: row.autor_nombre || null,
      fecha: row.fecha,
      hora: row.hora ? String(row.hora).slice(0, 5) : null,   // '10:00:00' → '10:00'
      duracion_min: row.duracion_min || 0,
      estado: row.estado,
      agendado_bool: !!row.agendado,
      resultados: Array.isArray(row.resultados) ? row.resultados : [],
      system: !!row.system,
      createdAt: row.created_at, updatedAt: row.updated_at
    };
  }

  /* merge aditivo por uuid en aj_seguimientos: INSERT añade · UPDATE
     reemplaza · DELETE quita. Nunca borra lo local que el remoto no conozca. */
  async function aplicarSeguimientoRemoto(evt) {
    var segs = _leerSeguimientosLocales();
    if (evt.tipo === 'DELETE') {
      var idDel = evt.vieja && evt.vieja.id;
      if (!idDel) return { accion: 'ignorado' };
      var antes = segs.length;
      segs = segs.filter(function (s) { return s.uuid !== idDel; });
      if (segs.length === antes) return { accion: 'ignorado' };
      _persistir('aj_seguimientos', segs);
      return { accion: 'eliminado' };
    }
    var row = evt.nueva;
    if (!row || !row.id) return { accion: 'ignorado' };
    var ctx = await cargarCtx();
    var personas = _leerLocales();
    var codigoPorUuid = {};
    personas.forEach(function (p) { if (p.uuid && p.id) codigoPorUuid[p.uuid] = p.id; });
    var local = mapRowASeguimientoLocal(row, ctx, codigoPorUuid);
    var idx = -1;
    for (var i = 0; i < segs.length; i++) if (segs[i].uuid === row.id) { idx = i; break; }
    if (idx >= 0) { segs[idx] = Object.assign({}, segs[idx], local); _persistir('aj_seguimientos', segs); return { accion: 'actualizado', seg: local }; }
    segs.push(local);
    _persistir('aj_seguimientos', segs);
    return { accion: 'insertado', seg: local };
  }

  /* ═══════════════════════════════════════════════════════════════════════
     CAPAS RESTANTES (mismo molde): captación · pedidos · propiedades ·
     titularidades · oportunidades. Mapeadores puros + subirResto/compararResto.
     ═══════════════════════════════════════════════════════════════════════ */

  var CAP_ESTADOS = ['nuevo', 'contactando', 'contactado', 'cualificando', 'listo_promover',
    'promovido', 'descartado', 'en_pausa'];
  var CAP_TIPOS = ['comprador_inmo', 'vendedor_inmo', 'comprador_finanzas', 'compraventa'];
  var CAP_SUITES = ['inmo', 'finances', 'ambas'];
  var CAP_ORIGENES = ['meta_ads', 'manual', 'referido', 'web', 'otro'];
  var PED_ESTADOS = ['activo', 'cerrado_compra', 'cerrado_descartado', 'pausado'];
  var PED_ORIGENES = ['hoja_pedido_inmo', 'hoja_pedido_finances', 'manual'];
  var PROP_TIPOS = ['piso', 'casa', 'local', 'oficina', 'terreno', 'garaje', 'trastero'];
  var PROP_OCUPACION = ['vacio', 'alquilado', 'ocupado_propietario'];
  var PROP_CALEFACCION = ['ninguna', 'gas_natural', 'gasoil', 'electrica', 'bomba_calor', 'otra'];
  var PROP_CONSERVACION = ['a_reformar', 'buen_estado', 'reformado', 'nuevo'];
  var TIT_ROLES = ['propietario', 'usufructuario', 'nudo_propietario', 'cotitular_sin_propiedad'];
  var TIT_TITULOS = ['compraventa', 'herencia', 'donacion', 'permuta', 'otra'];
  var OPP_TIPOS = ['piso_libre', 'venta_probable'];
  var OPP_ESTADOS = ['nueva', 'gestionada', 'descartada'];

  /* agente "flexible": legacy ('admin'/'camilo') o AJ-P-NNN (pedidos usan persona
     del agente) → uuid de usuarios, resolviendo por nombre si hace falta */
  function _agenteFlex(v, ctx, personasLocales) {
    var directo = _agenteAUuid(v, ctx);
    if (directo) return directo;
    if (/^AJ-P-\d+$/.test(String(v || '')) && Array.isArray(personasLocales)) {
      var per = null;
      for (var i = 0; i < personasLocales.length; i++) if (personasLocales[i].id === v) { per = personasLocales[i]; break; }
      if (per && per.nombre) return (ctx.porLegacy && ctx.porLegacy[String(per.nombre).toLowerCase()]) || null;
    }
    return null;
  }
  function _leerStore(clave) {
    if (root.AJ && root.AJ.store && typeof root.AJ.store.get === 'function') {
      return root.AJ.store.get(clave, []) || [];
    }
    try { return JSON.parse(root.localStorage.getItem(clave) || '[]'); } catch (e) { return []; }
  }

  function mapCaptacionLocalARow(c, ctx, personasPorCodigo, capUuidPorLocalId) {
    return {
      id: c.uuid || _uuid(),
      codigo: _s(c.id),
      origen: _enum(c.origen, CAP_ORIGENES, 'manual'),
      source_id: _s(c.source_id),
      fecha_captacion: _iso(c.fecha_captacion || c.created_at),
      meta: (c.meta && typeof c.meta === 'object') ? c.meta : {},
      nombre_completo: _s(c.nombre_completo) || '—',
      telefono: _s(c.telefono), email: _s(c.email),
      requiere_revision_nombre: !!c.requiere_revision_nombre,
      tipo_lead: _enum(c.tipo_lead, CAP_TIPOS, 'comprador_finanzas'),
      suite_destino: _enum(c.suite_destino, CAP_SUITES, 'finances'),
      datos: (c.datos && typeof c.datos === 'object') ? c.datos : {},
      estado: _enum(c.estado, CAP_ESTADOS, 'nuevo'),
      motivo_descarte: _s(c.motivo_descarte),
      motivo_descarte_notas: _s(c.motivo_descarte_notas),
      agente_asignado_id: _agenteAUuid(c.agente_asignado_id, ctx),
      fecha_pausa_hasta: _s(c.fecha_pausa_hasta),
      leads_relacionados: Array.isArray(c.leads_relacionados) ? c.leads_relacionados : [],
      desdoblado_en: Array.isArray(c.desdoblado_en) ? c.desdoblado_en : [],
      desdoblado_de: (c.desdoblado_de && capUuidPorLocalId && capUuidPorLocalId[c.desdoblado_de]) || null,
      promovido_en: c.promovido_en ? _iso(c.promovido_en) : null,
      promovido_a_persona_id: (c.promovido_a_persona_id && personasPorCodigo[c.promovido_a_persona_id]) || null,
      promovido_a_operacion_id: null,     /* D11 doble-write deferido: se resuelve en el corte */
      promovido_por_agente_id: _agenteAUuid(c.promovido_por_agente_id, ctx),
      created_at: _iso(c.created_at), updated_at: _iso(c.updated_at),
      deleted_at: c.deleted_at ? _iso(c.deleted_at) : null
    };
  }

  function mapPedidoLocalARow(p, ctx, personasPorCodigo, personasLocales, avisos) {
    var personaUuid = p.personaId ? personasPorCodigo[p.personaId] : null;
    if (!personaUuid) {
      if (avisos) avisos.push('pedido ' + (p.id || '?') + ': persona ' + (p.personaId || '(vacía)') + ' sin ficha — omitido');
      return null;
    }
    return {
      id: p.uuid || _uuid(),
      codigo: _s(p.id),
      persona_id: personaUuid,
      agente_id: _agenteFlex(p.agenteId, ctx, personasLocales),
      estado: _enum(p.estado, PED_ESTADOS, 'activo'),
      preferencias: (p.preferencias && typeof p.preferencias === 'object') ? p.preferencias : {},
      origen_creacion: _enum(p.origen_creacion, PED_ORIGENES, 'manual'),
      notas: _s(p.notas),
      cruces: Array.isArray(p.cruces_propiedad_ids) ? p.cruces_propiedad_ids : [],
      created_at: _iso(p.created_at || p.fecha_creacion), updated_at: _iso(p.updated_at),
      deleted_at: p.deleted_at ? _iso(p.deleted_at) : null
    };
  }

  function mapPropiedadLocalARow(pr, avisos) {
    var d = pr.direccion || {};
    var c = pr.caracteristicas || {};
    var ref = _s(pr.refCatastral);
    if (ref) {
      ref = ref.toUpperCase().replace(/\s+/g, '');
      if (!/^[A-Z0-9]{20}$/.test(ref)) {
        if (avisos) avisos.push('propiedad ' + (pr.id || '?') + ': refCatastral "' + pr.refCatastral + '" no válida (20 chars) — se sube sin ella');
        ref = null;
      }
    }
    return {
      id: pr.uuid || _uuid(),
      codigo: _s(pr.id),
      ref_catastral: ref,
      dir_calle: _s(d.calle) || '—',
      dir_numero: _s(d.numero) || 's/n',
      dir_puerta: _s(d.puerta), dir_escalera: _s(d.escalera),
      dir_poblacion: _s(d.poblacion) || 'Girona',
      dir_cp: _s(d.codigoPostal) || '00000',
      dir_provincia: _s(d.provincia) || 'Girona',
      dir_pais: _s(d.pais) || 'España',
      lat: (pr.coordenadas && typeof pr.coordenadas.lat === 'number') ? pr.coordenadas.lat : null,
      lng: (pr.coordenadas && typeof pr.coordenadas.lng === 'number') ? pr.coordenadas.lng : null,
      tipo: _enum(c.tipo, PROP_TIPOS, 'piso'),
      m2_utiles: parseFloat(c.metrosCuadradosUtiles != null ? c.metrosCuadradosUtiles : c.metrosCuadrados) || null,
      m2_construidos: parseFloat(c.metrosCuadradosConstruidos) || null,
      habitaciones: parseInt(c.habitaciones, 10) || null,
      banos: parseInt(c['baños'] != null ? c['baños'] : c.banos, 10) || null,
      ano_construccion: parseInt(c['añoConstruccion'] != null ? c['añoConstruccion'] : c.anoConstruccion, 10) || null,
      planta: _s(c.planta),
      ascensor: c.ascensor == null ? null : !!c.ascensor,
      terraza: c.terraza == null ? null : !!c.terraza,
      parking: c.parking == null ? null : !!c.parking,
      trastero: c.trastero == null ? null : !!c.trastero,
      aire_acondicionado: c.aireAcondicionado == null ? null : !!c.aireAcondicionado,
      calefaccion: _enum(c.calefaccion, PROP_CALEFACCION, 'ninguna'),
      estado_conservacion: _enum(c.estadoConservacion, PROP_CONSERVACION, 'buen_estado'),
      certificado_energetico: _s(c.certificadoEnergetico) || 'no_disponible',
      estado_ocupacion: _enum(pr.estadoOcupacion, PROP_OCUPACION, 'vacio'),
      captacion_origen_id: _s(pr.captacionOrigenId),
      notas: _s(pr.notas),
      created_at: _iso(pr.createdAt || pr.created_at), updated_at: _iso(pr.updatedAt || pr.updated_at)
    };
  }

  function mapTitularidadLocalARow(t, propsPorCodigo, personasPorCodigo, avisos) {
    var propUuid = t.propiedadId ? propsPorCodigo[t.propiedadId] : null;
    var perUuid = t.personaId ? personasPorCodigo[t.personaId] : null;
    if (!propUuid || !perUuid) {
      if (avisos) avisos.push('titularidad ' + (t.id || '?') + ': ' + (!propUuid ? ('propiedad ' + t.propiedadId) : ('persona ' + t.personaId)) + ' sin ficha — omitida');
      return null;
    }
    return {
      id: t.uuid || _uuid(),
      codigo: _s(t.id),
      propiedad_id: propUuid,
      persona_id: perUuid,
      porcentaje: (t.porcentaje == null || t.porcentaje === '') ? null : parseFloat(t.porcentaje),
      rol: _enum(t.rol, TIT_ROLES, 'propietario'),
      titulo_adquisicion: _enum(t.tituloAdquisicion, TIT_TITULOS, 'compraventa'),
      desde: _s(t.desde) || new Date().toISOString().slice(0, 10),
      hasta: _s(t.hasta),
      notas: _s(t.notas),
      created_at: _iso(t.createdAt || t.created_at), updated_at: _iso(t.updatedAt || t.updated_at)
    };
  }

  function mapOportunidadLocalARow(o, personasPorCodigo, opsUuidPorLocalId) {
    return {
      tipo: _enum(o.tipo, OPP_TIPOS, 'piso_libre'),
      estado: _enum(o.estado, OPP_ESTADOS, 'nueva'),
      clave: _s(o.key || o.clave) || ('sin-clave-' + (o.id || _uuid())),
      persona_id: (o.personaId && personasPorCodigo[o.personaId]) || null,
      persona_nombre: _s(o.personaNombre),
      ref_catastral: _s(o.refCatastral),
      direccion_canonica: _s(o.direccionCanonica),
      operacion_id: (o.opId && opsUuidPorLocalId && opsUuidPorLocalId[o.opId]) || null,
      fase_detectada: _s(o.faseDetectada),
      created_at: _iso(o.creadaEn || o.createdAt), updated_at: _iso(o.actualizadaEn || o.updatedAt)
    };
  }

  /* ── subida del RESTO de Capas (mismo molde: uuid persistente + upsert +
        omisión de codigo cuando la BD debe asignarlo + nivelado) ── */
  async function subirResto() {
    var R = _remote();
    var ctx = await cargarCtx();
    var personas = _leerLocales();
    var porCodigo = _personasPorCodigo(personas);
    var avisos = [];
    var res = { captacion: 0, pedidos: 0, propiedades: 0, titularidades: 0, oportunidades: 0, avisos: avisos };

    /* mapa de ops locales → uuid (para oportunidades.operacion_id) */
    var opsUuid = {};
    personas.forEach(function (p) { (p.operaciones || []).forEach(function (op) { if (op.uuid) opsUuid[op.id] = op.uuid; }); });

    /* CAPTACIÓN (dos pasadas: primero uuids, luego desdoblado_de) */
    var caps = _leerStore('aj_captacion');
    var mut = false;
    caps.forEach(function (c) { if (!c.uuid) { c.uuid = _uuid(); mut = true; } });
    if (mut) _persistir('aj_captacion', caps);
    var capUuidPorLocalId = {};
    caps.forEach(function (c) { if (c.id) capUuidPorLocalId[c.id] = c.uuid; });
    for (var i = 0; i < caps.length; i++) {
      var rowC = mapCaptacionLocalARow(caps[i], ctx, porCodigo, capUuidPorLocalId);
      await R.upsert('captacion', rowC.codigo ? rowC : _sinCodigo(rowC), 'id');
      res.captacion++;
    }
    await nivelarContador('AJ-CL', _maxCodigo(caps.map(function (c) { return c.id; }), 'AJ-CL'));

    /* PEDIDOS */
    var peds = _leerStore('aj_pedidos');
    mut = false;
    peds.forEach(function (p) { if (!p.uuid) { p.uuid = _uuid(); mut = true; } });
    if (mut) _persistir('aj_pedidos', peds);
    for (var j = 0; j < peds.length; j++) {
      var rowP = mapPedidoLocalARow(peds[j], ctx, porCodigo, personas, avisos);
      if (!rowP) continue;
      await R.upsert('pedidos', rowP.codigo ? rowP : _sinCodigo(rowP), 'id');
      res.pedidos++;
    }
    await nivelarContador('AJ-PD', _maxCodigo(peds.map(function (p) { return p.id; }), 'AJ-PD'));

    /* PROPIEDADES (uuid ya existe en Capa 9; defensivo por si falta) */
    var props = _leerStore('aj_inmo_propiedades');
    mut = false;
    props.forEach(function (p) { if (!p.uuid) { p.uuid = _uuid(); mut = true; } });
    if (mut) _persistir('aj_inmo_propiedades', props);
    var propsPorCodigo = {};
    props.forEach(function (p) { if (p.id && p.uuid) propsPorCodigo[p.id] = p.uuid; });
    for (var k = 0; k < props.length; k++) {
      var rowPr = mapPropiedadLocalARow(props[k], avisos);
      await R.upsert('propiedades', rowPr.codigo ? rowPr : _sinCodigo(rowPr), 'id');
      res.propiedades++;
    }
    await nivelarContador('AJ-IP', _maxCodigo(props.map(function (p) { return p.id; }), 'AJ-IP'));

    /* TITULARIDADES (FKs a propiedades+personas; R2/R3 vigilan en servidor) */
    var tits = _leerStore('aj_inmo_titularidades');
    mut = false;
    tits.forEach(function (t) { if (!t.uuid) { t.uuid = _uuid(); mut = true; } });
    if (mut) _persistir('aj_inmo_titularidades', tits);
    for (var m = 0; m < tits.length; m++) {
      var rowT = mapTitularidadLocalARow(tits[m], propsPorCodigo, porCodigo, avisos);
      if (!rowT) continue;
      await R.upsert('titularidades', rowT.codigo ? rowT : _sinCodigo(rowT), 'id');
      res.titularidades++;
    }
    await nivelarContador('AJ-IT', _maxCodigo(tits.map(function (t) { return t.id; }), 'AJ-IT'));

    /* OPORTUNIDADES (upsert por CLAVE única — la detección local es la fuente) */
    var opps = _leerStore('aj_oportunidades');
    for (var n = 0; n < opps.length; n++) {
      await R.upsert('oportunidades', mapOportunidadLocalARow(opps[n], porCodigo, opsUuid), 'clave');
      res.oportunidades++;
    }
    return res;
  }

  /* comparación del resto: recuentos + faltantes por uuid/clave */
  async function compararResto() {
    var R = _remote();
    var out = {};
    async function cmp(nombre, clave, tabla, keyLocal, keyRemota, filtroVivos) {
      var locales = _leerStore(clave);
      var remotos = await R.listar(tabla, 'select=' + keyRemota + (filtroVivos ? '&deleted_at=is.null' : ''));
      var setR = {};
      (remotos || []).forEach(function (r) { setR[r[keyRemota]] = true; });
      var faltan = [];
      locales.forEach(function (l) { var v = l[keyLocal]; if (v && !setR[v]) faltan.push(l.id || v); });
      out[nombre] = { local: locales.length, remoto: (remotos || []).length, faltan: faltan };
    }
    await cmp('captacion', 'aj_captacion', 'captacion', 'uuid', 'id', true);
    await cmp('pedidos', 'aj_pedidos', 'pedidos', 'uuid', 'id', true);
    await cmp('propiedades', 'aj_inmo_propiedades', 'propiedades', 'uuid', 'id', true);
    await cmp('titularidades', 'aj_inmo_titularidades', 'titularidades', 'uuid', 'id', false);
    await cmp('oportunidades', 'aj_oportunidades', 'oportunidades', 'key', 'clave', false);
    out.ok = Object.keys(out).every(function (k) { return k === 'ok' || out[k].faltan.length === 0; });
    return out;
  }

  /* ── Reglas del servidor: comprobación en vivo con fila temporal ──
     1) trigger es_lead: mando estado=encargo con es_lead=true a propósito →
        el servidor debe corregir a false; en estudio → true; en perdido →
        conserva. 2) FEIN vencimiento generado +10 días. Limpia al acabar. */
  async function verificarReglasServidor() {
    var R = _remote();
    var id = _uuid();
    var checks = [];
    await R.upsert('operaciones', { id: id, estado: 'encargo', es_lead: true,
      fecha_entrada: '2026-07-01', fein_recibida: true, fein_fecha_recepcion: '2026-06-18',
      honorarios_cents: 0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, 'id');
    var f1 = (await R.listar('operaciones', 'select=es_lead,fein_fecha_vencimiento,codigo&id=eq.' + id))[0] || {};
    checks.push({ regla: 'trigger es_lead corrige encargo+true → false', ok: f1.es_lead === false });
    checks.push({ regla: 'FEIN vencimiento generado 2026-06-18 → 2026-06-28', ok: f1.fein_fecha_vencimiento === '2026-06-28' });
    checks.push({ regla: 'código AJ-F asignado por el servidor (' + (f1.codigo || '—') + ')', ok: /^AJ-F-\d+$/.test(f1.codigo || '') });
    await R.actualizar('operaciones', 'id=eq.' + id, { estado: 'estudio' });
    var f2 = (await R.listar('operaciones', 'select=es_lead&id=eq.' + id))[0] || {};
    checks.push({ regla: 'estudio → es_lead true', ok: f2.es_lead === true });
    await R.actualizar('operaciones', 'id=eq.' + id, { estado: 'perdido' });
    var f3 = (await R.listar('operaciones', 'select=es_lead&id=eq.' + id))[0] || {};
    checks.push({ regla: 'perdido conserva clasificación (true)', ok: f3.es_lead === true });
    await R.eliminar('operacion_titulares', 'operacion_id=eq.' + id);
    await R.eliminar('operaciones', 'id=eq.' + id);
    return { ok: checks.every(function (c) { return c.ok; }), checks: checks };
  }

  /* PostgREST acepta lotes, y hasta ahora se le hablaba de uno en uno: subir 62
     personas y 154 seguimientos costaba unos 400 viajes y 25 segundos. Se
     agrupa. Los trozos son por prudencia —una petición gigante es frágil y una
     URL con 200 uuids dentro también—, no por límite conocido. */
  var LOTE_FILAS = 200, LOTE_IDS = 50;

  function _trozos(lista, tam) {
    var out = [];
    for (var i = 0; i < lista.length; i += tam) out.push(lista.slice(i, i + tam));
    return out;
  }
  async function _upsertLote(tabla, filas, clave) {
    var t = _trozos(filas, LOTE_FILAS);
    for (var i = 0; i < t.length; i++) await _remote().upsert(tabla, t[i], clave || 'id');
    return filas.length;
  }
  async function _insertarLote(tabla, filas) {
    var t = _trozos(filas, LOTE_FILAS);
    for (var i = 0; i < t.length; i++) await _remote().insertar(tabla, t[i]);
    return filas.length;
  }
  async function _eliminarPorPersonas(tabla, uuids) {
    var t = _trozos(uuids, LOTE_IDS);
    for (var i = 0; i < t.length; i++) {
      await _remote().eliminar(tabla, 'persona_id=in.(' + t[i].join(',') + ')');
    }
  }

  async function subirPersonas() {
    var R = _remote();
    var ctx = await cargarCtx();
    var locales = _leerLocales();
    if (!locales.length) return { subidas: 0, embudos: 0, residencias: 0, contador: 0 };

    /* asegurar uuid local persistente (idempotencia del upsert) */
    var conUuid = locales.map(function (p) { if (!p.uuid) p.uuid = _uuid(); return p; });
    _persistir('aj_personas', conUuid);

    /* Lo que se borró en el servidor NO vuelve por la puerta de atrás.
       Sin esto, un portátil que todavía tenga la persona en local la resucita
       en el siguiente upsert: el mapeador manda deleted_at en null porque en
       local no existe ese campo. Pasó con las 13 personas de prueba borradas
       el 30-ago, y es la misma clase de fallo que resucitaba personas desde
       aj_ops. Se pregunta primero y se respeta la decisión del servidor. */
    var enterrados = {};
    try {
      (await R.listar('personas', 'select=id&deleted_at=not.is.null') || [])
        .forEach(function (r) { enterrados[r.id] = 1; });
    } catch (e) { /* si no se puede preguntar, se sube todo: es el de siempre */ }

    var rows = conUuid.map(function (p) { return mapPersonaLocalARow(p, ctx); })
                      .filter(function (r) { return !enterrados[r.id]; });
    if (rows.length) await R.upsert('personas', rows, 'id');

    /* hijos: sustitución completa (el push es espejo del local). Se borra lo de
       TODAS las personas de una tacada y se reinserta, en vez de dos borrados y
       dos inserciones por cabeza. */
    var uuids = conUuid.map(function (p) { return p.uuid; });
    var embudos = [], residencias = [];
    conUuid.forEach(function (p) {
      (Array.isArray(p.embudos) ? p.embudos : []).forEach(function (e) {
        embudos.push(mapEmbudoLocalARow(e, p.uuid, ctx));
      });
      if (p.residencia && typeof p.residencia === 'object') {
        residencias.push(mapResidenciaLocalARow(p.residencia, p.uuid));
      }
    });
    await _eliminarPorPersonas('persona_embudos', uuids);
    await _eliminarPorPersonas('residencias', uuids);
    var nEmb = embudos.length ? await _insertarLote('persona_embudos', embudos) : 0;
    var nRes = residencias.length ? await _insertarLote('residencias', residencias) : 0;

    /* nivelar contador AJ-P del servidor con el máximo local */
    var maxN = 0;
    conUuid.forEach(function (p) {
      var m = /^AJ-P-(\d+)$/.exec(p.id || ''); if (m) maxN = Math.max(maxN, parseInt(m[1], 10));
    });
    var contador = maxN ? await nivelarContador('AJ-P', maxN) : 0;

    return { subidas: rows.length, embudos: nEmb, residencias: nRes, contador: contador };
  }

  async function bajarPersonas() {
    var R = _remote();
    var ctx = await cargarCtx();
    var rows = await R.listar('personas', 'select=*&deleted_at=is.null&order=codigo');
    var embudos = await R.listar('persona_embudos', 'select=*');
    var residencias = await R.listar('residencias', 'select=*&hasta=is.null');
    var porPersona = {};
    (embudos || []).forEach(function (e) { (porPersona[e.persona_id] = porPersona[e.persona_id] || []).push(e); });
    var resPorPersona = {};
    (residencias || []).forEach(function (r) { resPorPersona[r.persona_id] = r; });
    return (rows || []).map(function (row) {
      var p = mapRowAPersonaLocal(row, ctx);
      p.embudos = (porPersona[row.id] || []).map(function (e) { return mapRowAEmbudoLocal(e, ctx); });
      p.residencia = resPorPersona[row.id] ? mapRowAResidenciaLocal(resPorPersona[row.id]) : null;
      return p;
    });
  }

  /* Verificación del doble período: recuentos + diferencias campo a campo */
  async function compararPersonas() {
    var locales = _leerLocales();
    var remotas = await bajarPersonas();
    var porCodigo = {};
    remotas.forEach(function (p) { porCodigo[p.id] = p; });
    var faltan = [], difieren = [];
    var CAMPOS = ['nombre', 'dni', 'telefono', 'email', 'type', 'idioma'];
    locales.forEach(function (l) {
      var r = porCodigo[l.id];
      if (!r) { faltan.push(l.id); return; }
      var difs = CAMPOS.filter(function (c) { return String(l[c] || '') !== String(r[c] || ''); });
      if ((l.roles || []).slice().sort().join(',') !== (r.roles || []).slice().sort().join(',')) difs.push('roles');
      if (difs.length) difieren.push({ codigo: l.id, campos: difs });
    });
    return { locales: locales.length, remotas: remotas.length, faltanEnRemoto: faltan, difieren: difieren,
      ok: faltan.length === 0 && difieren.length === 0 && locales.length <= remotas.length };
  }


  /* ══════════════════════════════════════════════════════════════════════════
     BAJADA — de Supabase al CRM local

     Hasta aquí la sincronización era de un solo sentido: el navegador subía y
     Supabase recibía. Eso hace que el CRM enseñe lo que hay en ESE navegador:
     hoy, con 62 personas y 42 operaciones arriba, un portátil recién abierto
     muestra una persona y una operación. Armin y Jonatan no ven lo mismo.

     La regla de fusión es deliberadamente conservadora: nunca se pierde trabajo
     local. Lo que solo está arriba se añade; lo que está en los dos lados gana
     por fecha de modificación; y lo que solo está aquí se queda esperando a que
     la subida lo lleve. Ningún borrado se propaga hacia abajo.
     ══════════════════════════════════════════════════════════════════════════ */

  /* La FEIN vence a los 10 días naturales de recibirse (§4.6). El servidor no
     guarda el vencimiento porque es derivable, así que se recalcula al bajar. */
  function _vencimientoFein(fechaRecepcion) {
    if (!fechaRecepcion) return null;
    var d = new Date(String(fechaRecepcion).slice(0, 10) + 'T00:00:00');
    if (isNaN(d.getTime())) return null;
    d.setDate(d.getDate() + 10);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function mapRowAOperacionLocal(row, ctx) {
    return {
      id: row.id, uuid: row.id, codigo: row.codigo || null,
      estado: row.estado, esLead: !!row.es_lead, enEmbudo: row.en_embudo !== false,
      fechaEstadoCambio: row.fecha_estado_cambio || null,
      archivado: !!row.archivado,
      entidad: row.entidad_bancaria || null,
      precioCompra: centsAEuros(row.precio_compra_cents),
      importe: centsAEuros(row.importe_cents),
      honorarios: centsAEuros(row.honorarios_cents),
      fecha: row.fecha_entrada || null,
      fechaFirma: row.fecha_firma_prevista || null,
      fechaCobro: row.fecha_cobro_prevista || null,
      tasacion: row.tasacion || null,
      vida: !!row.vida, sialp: !!row.sialp,
      tipoOrigen: row.tipo_origen || 'directo',
      colaborador: row.colaborador_nombre || null,
      pctColaborador: row.pct_colaborador || 0,
      agenteOperacion: _agenteALegacy(row.agente_operacion_id, ctx),
      cobrada: !!row.cobrada,
      fechaCobroReal: row.fecha_cobro_real || null,
      fein: {
        recibida: !!row.fein_recibida,
        fechaRecepcion: row.fein_fecha_recepcion || null,
        fechaVencimiento: _vencimientoFein(row.fein_fecha_recepcion),
        referencia: row.fein_referencia || null
      },
      titulares: [],
      createdAt: row.created_at, updatedAt: row.updated_at
    };
  }

  /* Las operaciones viven arriba como tabla propia y aquí embebidas en la
     persona (modelo dual M-033, vigente hasta que se corte). Se devuelven ya
     agrupadas por el código de su titular principal, que es como las quiere el
     CRM local. */
  async function bajarOperaciones() {
    var R = _remote();
    var ctx = await cargarCtx();
    var rows = await R.listar('operaciones', 'select=*&deleted_at=is.null&order=codigo');
    var tits = await R.listar('operacion_titulares', 'select=*&order=orden');
    var personas = await R.listar('personas', 'select=id,codigo,nombre,dni&deleted_at=is.null');

    var personaPorUuid = {};
    (personas || []).forEach(function (p) { personaPorUuid[p.id] = p; });

    var titsPorOp = {};
    (tits || []).forEach(function (t) { (titsPorOp[t.operacion_id] = titsPorOp[t.operacion_id] || []).push(t); });

    var ops = [], porPersona = {}, huerfanas = [];
    (rows || []).forEach(function (row) {
      var op = mapRowAOperacionLocal(row, ctx);
      op.titulares = (titsPorOp[row.id] || []).map(function (t) {
        var p = personaPorUuid[t.persona_id];
        return { personaId: p ? p.codigo : null, nombre: p ? p.nombre : null,
                 dni: p ? (p.dni || null) : null, rol: t.rol };
      }).filter(function (t) { return t.personaId; });
      ops.push(op);
      var duenyo = op.titulares[0];
      if (!duenyo) { huerfanas.push(op.codigo || op.uuid); return; }
      (porPersona[duenyo.personaId] = porPersona[duenyo.personaId] || []).push(op);
    });
    return { ops: ops, porPersona: porPersona, huerfanas: huerfanas };
  }

  async function bajarSeguimientos() {
    var R = _remote();
    var ctx = await cargarCtx();
    /* los seguimientos no se borran, se anulan: la tabla no tiene deleted_at */
    var rows = await R.listar('seguimientos', 'select=*&order=fecha');
    var personas = await R.listar('personas', 'select=id,codigo&deleted_at=is.null');
    var codigoPorUuid = {};
    (personas || []).forEach(function (p) { codigoPorUuid[p.id] = p.codigo; });
    return (rows || []).map(function (row) { return mapRowASeguimientoLocal(row, ctx, codigoPorUuid); });
  }

  /* Gana el más reciente. Sin fecha de modificación no hay forma de decidir, y
     ante la duda se respeta lo local: es donde alguien pudo escribir sin red. */
  function _remotoEsMasNuevo(local, remoto) {
    var l = local && local.updatedAt, r = remoto && remoto.updatedAt;
    if (!r) return false;
    if (!l) return true;
    return new Date(r).getTime() > new Date(l).getTime();
  }

  function _fusionar(locales, remotos, claveDe, alFusionar) {
    var porClave = {}, informe = { anadidos: 0, actualizados: 0, intactos: 0 };
    locales.forEach(function (x) { var k = claveDe(x); if (k) porClave[k] = x; });
    remotos.forEach(function (r) {
      var k = claveDe(r);
      if (!k) return;
      var l = porClave[k];
      if (!l) { locales.push(r); porClave[k] = r; informe.anadidos++; return; }
      if (_remotoEsMasNuevo(l, r)) {
        alFusionar ? alFusionar(l, r) : Object.keys(r).forEach(function (c) { l[c] = r[c]; });
        informe.actualizados++;
      } else informe.intactos++;
    });
    return informe;
  }

  function _maxDe(lista, campo, prefijo) {
    var re = new RegExp('^' + prefijo + '-(\\d+)$'), max = 0;
    lista.forEach(function (x) { var m = re.exec(String((campo ? x[campo] : x) || '')); if (m) max = Math.max(max, parseInt(m[1], 10)); });
    return max;
  }

  function _subirContador(sociedad, hasta) {
    if (!(root.AJ && root.AJ.id && root.AJ.id.reiniciarContador)) return null;
    var actual = root.AJ.id.ultimoCodigo(sociedad) || 0;
    if (hasta <= actual) return actual;
    root.AJ.id.reiniciarContador(sociedad, hasta);
    return hasta;
  }

  function _nivelarLocales(personas, seguimientos, captacion, pedidos, inmo) {
    var ops = [];
    personas.forEach(function (p) { (p.operaciones || []).forEach(function (o) { ops.push(o.codigo); }); });
    return {
      personas:     _subirContador('personas',     _maxDe(personas, 'id', 'AJ-P')),
      finances:     _subirContador('finances',     _maxDe(ops, null, 'AJ-F')),
      seguimientos: _subirContador('seguimientos', _maxDe(seguimientos, 'id', 'AJ-S')),
      captacion:    _subirContador('captacion',    _maxDe(captacion || [], 'id', 'AJ-CL')),
      pedidos:      _subirContador('pedidos',      _maxDe(pedidos || [], 'id', 'AJ-PD')),
      inmoOperaciones: _subirContador('inmoOperaciones', _maxDe(inmo.operaciones || [], 'id', 'AJ-IO')),
      inmoFincas:      _subirContador('inmoFincas',      _maxDe(inmo.fincas || [], 'id', 'AJ-IF')),
      inbox:           _subirContador('inbox',           _maxDe(inmo.inbox || [], 'id', 'AJ-IB'))
    };
  }

  function _codigosRepetidos(personas, seguimientos) {
    var out = [];
    function revisar(lista, etiqueta) {
      var visto = {};
      lista.forEach(function (x) {
        var c = x.id, u = x.uuid || null;
        if (!c) return;
        if (visto[c] && visto[c] !== u) out.push({ entidad: etiqueta, codigo: c });
        else visto[c] = u;
      });
    }
    revisar(personas, 'persona');
    revisar(seguimientos, 'seguimiento');
    var ops = [];
    personas.forEach(function (p) { (p.operaciones || []).forEach(function (o) { if (o.codigo) ops.push({ id: o.codigo, uuid: o.uuid }); }); });
    revisar(ops, 'operacion');
    return out;
  }



  /* ══════════════════════════════════════════════════════════════════════════
     INMO — operaciones, fincas y el inbox de portales

     Las tablas ya existían desde la migración 0001; lo que faltaba era el
     sincronismo, y unas cuantas columnas que las entidades ganaron después
     (migración 0017). Sin esto, el shell de Inmo compartía las personas pero su
     trabajo propio no salía del portátil de Armin.
     ══════════════════════════════════════════════════════════════════════════ */

  var OPSINMO_ESTADOS = ['pendiente_valorar','valorado','encargo_vigente','promesa_compra',
    'arras','pendiente_firma','en_gestion','en_visita','paga_y_senal','firma',
    'retirada','perdido','cierre_alquiler'];
  var OPSINMO_TIPOS = ['venta','compra','alquiler'];
  var INBOX_CANALES = ['idealista','fotocasa_pro','habitaclia','email_portal'];
  var INBOX_ESTADOS = ['nuevo','en_revision','contactado','cualificado','convertido','descartado'];
  var FINCA_TIPOS = ['urbana','rustica','industrial'];

  function mapOpInmoLocalARow(op, ctx, personasPorCodigo, propiedadesPorCodigo, avisos) {
    var personaUuid = op.personaId ? personasPorCodigo[op.personaId] : null;
    var propiedadUuid = op.propiedadId ? propiedadesPorCodigo[op.propiedadId] : null;
    if (!personaUuid || !propiedadUuid) {
      if (avisos) avisos.push('operación Inmo ' + (op.id || '?') + ': '
        + (!personaUuid ? 'persona ' + (op.personaId || '(vacía)') + ' sin ficha' : 'propiedad ' + (op.propiedadId || '(vacía)') + ' sin ficha')
        + ' — omitida');
      return null;                       // la tabla exige las dos: mejor omitir que romper
    }
    return {
      id: op.uuid || _uuid(),
      codigo: _s(op.id),
      sociedad: 'inmo',
      tipo: _enum(op.tipo, OPSINMO_TIPOS, 'venta'),
      estado: _enum(op.estado, OPSINMO_ESTADOS, 'pendiente_valorar'),
      es_lead: !!op.esLead,
      persona_id: personaUuid,
      propiedad_id: propiedadUuid,
      agente_id: _agenteAUuid(op.agenteId, ctx),
      precio_propuesto_cents: eurosACents(op.precio_propuesto),
      precio_cerrado_cents: eurosACents(op.precio_cerrado),
      alquiler_mensual_cents: eurosACents(op.alquiler_mensual),
      arras_cobradas: !!op.arras_cobradas,
      fecha_cierre: _s(op.fecha_cierre),
      notas: _s(op.notas),
      created_at: _iso(op.created_at || op.fecha_creacion), updated_at: _iso(op.updated_at),
      deleted_at: op.deleted_at ? _iso(op.deleted_at) : null
    };
  }

  function mapRowAOpInmoLocal(row, ctx, codigoPorUuidPersona, codigoPorUuidPropiedad) {
    return {
      id: row.codigo, uuid: row.id,
      tipo: row.tipo, estado: row.estado, esLead: !!row.es_lead,
      personaId: (row.persona_id && codigoPorUuidPersona && codigoPorUuidPersona[row.persona_id]) || null,
      propiedadId: (row.propiedad_id && codigoPorUuidPropiedad && codigoPorUuidPropiedad[row.propiedad_id]) || null,
      agenteId: _agenteALegacy(row.agente_id, ctx),
      precio_propuesto: centsAEuros(row.precio_propuesto_cents),
      precio_cerrado: centsAEuros(row.precio_cerrado_cents),
      alquiler_mensual: centsAEuros(row.alquiler_mensual_cents),
      arras_cobradas: !!row.arras_cobradas,
      fecha_creacion: row.created_at, fecha_cierre: row.fecha_cierre || null,
      notas: row.notas || '',
      created_at: row.created_at, updated_at: row.updated_at, deleted_at: row.deleted_at || null
    };
  }

  /* La finca es el edificio; sus unidades son cada puerta. Arriba viven en dos
     tablas porque una finca tiene muchas unidades; aquí, embebidas. */
  function mapFincaLocalARow(f) {
    var d = f.direccion || {}, c = f.coordenadas || {};
    return {
      id: f.uuid || _uuid(),
      codigo: _s(f.id),
      ref_catastral: _s(f.refCatastral),
      dir_calle: _s(d.calle), dir_numero: _s(d.numero),
      dir_poblacion: _s(d.poblacion), dir_cp: _s(d.codigoPostal || d.cp),
      dir_provincia: _s(d.provincia) || 'Girona',
      lat: (typeof c.lat === 'number') ? c.lat : null,
      lng: (typeof c.lng === 'number') ? c.lng : null,
      superficie_m2: (typeof f.superficie === 'number') ? f.superficie : null,
      tipo: _enum(f.tipo, FINCA_TIPOS, 'urbana'),
      uso: _s(f.uso), uso_label: _s(f.usoLabel),
      num_viviendas: (typeof f.numViviendas === 'number') ? f.numViviendas : null,
      anio_construccion: (typeof f.anioConstruccion === 'number') ? f.anioConstruccion : null,
      num_plantas: (typeof f.numPlantas === 'number') ? f.numPlantas : null,
      fuente: _s(f.fuente), fecha_ingesta: f.fechaIngesta ? _iso(f.fechaIngesta) : null,
      fecha_consulta: f.fechaConsulta ? _iso(f.fechaConsulta) : null,
      created_at: _iso(f.created_at), updated_at: _iso(f.updated_at),
      deleted_at: f.deleted_at ? _iso(f.deleted_at) : null
    };
  }

  function mapUnidadesARows(finca, propiedadesPorCodigo) {
    return (finca.unidades || []).map(function (u) {
      return {
        finca_id: finca.uuid,
        ref_catastral: _s(u.refCatastral),
        tipo: _s(u.tipo) || 'otro',
        planta: _s(u.planta), puerta: _s(u.puerta), escalera: _s(u.escalera),
        superficie_m2: (typeof u.superficie === 'number') ? u.superficie : null,
        uso: _s(u.uso), uso_label: _s(u.usoLabel),
        anio_construccion: (typeof u.anioConstruccion === 'number') ? u.anioConstruccion : null,
        construcciones: Array.isArray(u.construcciones) ? u.construcciones : [],
        propiedad_id: (u.propiedadId && propiedadesPorCodigo && propiedadesPorCodigo[u.propiedadId]) || null
      };
    });
  }

  function mapRowAFincaLocal(row, unidades, codigoPorUuidPropiedad) {
    return {
      id: row.codigo, uuid: row.id,
      refCatastral: row.ref_catastral || null,
      direccion: { calle: row.dir_calle || null, numero: row.dir_numero || null,
        poblacion: row.dir_poblacion || null, codigoPostal: row.dir_cp || null,
        provincia: row.dir_provincia || null },
      coordenadas: (row.lat != null && row.lng != null) ? { lat: row.lat, lng: row.lng } : null,
      superficie: row.superficie_m2 != null ? Number(row.superficie_m2) : null,
      tipo: row.tipo, uso: row.uso || null, usoLabel: row.uso_label || null,
      numViviendas: row.num_viviendas, anioConstruccion: row.anio_construccion,
      numPlantas: row.num_plantas,
      fuente: row.fuente || null, fechaIngesta: row.fecha_ingesta || null,
      fechaConsulta: row.fecha_consulta || null,
      propiedades: [],
      unidades: (unidades || []).map(function (u) {
        return { refCatastral: u.ref_catastral, tipo: u.tipo || 'otro',
          planta: u.planta, puerta: u.puerta, escalera: u.escalera,
          superficie: u.superficie_m2 != null ? Number(u.superficie_m2) : null,
          uso: u.uso || null, usoLabel: u.uso_label || null,
          anioConstruccion: u.anio_construccion,
          construcciones: Array.isArray(u.construcciones) ? u.construcciones : [],
          propiedadId: (u.propiedad_id && codigoPorUuidPropiedad && codigoPorUuidPropiedad[u.propiedad_id]) || null };
      }),
      numUnidades: (unidades || []).length,
      created_at: row.created_at, updated_at: row.updated_at, deleted_at: row.deleted_at || null
    };
  }

  /* El inbox guarda al cliente potencial anidado aquí y plano arriba. */
  function mapInboxLocalARow(e, ctx, personasPorCodigo, propiedadesPorCodigo) {
    var cp = e.cliente_potencial || {};
    return {
      id: e.uuid || _uuid(),
      codigo: _s(e.id),
      sociedad: 'inmo',
      canal: _enum(e.canal, INBOX_CANALES, 'email_portal'),
      tipo: e.tipo || null,
      ts_recepcion: _iso(e.ts_recepcion),
      nombre: _s(cp.nombre) || '—',
      telefono: _s(cp.telefono), email: _s(cp.email),
      mensaje_original: _s(cp.mensaje_original),
      propiedad_interes_id: (e.propiedad_interes_id && propiedadesPorCodigo
        && propiedadesPorCodigo[e.propiedad_interes_id]) || null,
      estado: _enum(e.estado, INBOX_ESTADOS, 'nuevo'),
      motivo_descarte: _s(e.motivo_descarte),
      suite_destino: (e.suite_destino_canonico === 'finances') ? 'finances' : 'inmo',
      analista_asignado_id: _agenteAUuid(e.analista_asignado_id, ctx),
      promovido_a_persona_id: (e.promovido_a_persona_id && personasPorCodigo[e.promovido_a_persona_id]) || null,
      promovido_por_agente_id: _agenteAUuid(e.promovido_por_agente_id, ctx),
      ts_promocion: e.ts_promocion ? _iso(e.ts_promocion) : null,
      source_id: _s(e.source_id),
      payload_original: e.payload_original || null,
      created_at: _iso(e.created_at), updated_at: _iso(e.updated_at),
      deleted_at: e.deleted_at ? _iso(e.deleted_at) : null
    };
  }

  function mapRowAInboxLocal(row, ctx, codigoPorUuidPersona, codigoPorUuidPropiedad) {
    return {
      id: row.codigo, uuid: row.id,
      canal: row.canal, tipo: row.tipo || null,
      ts_recepcion: row.ts_recepcion,
      cliente_potencial: { nombre: row.nombre || '', telefono: row.telefono || null,
        email: row.email || null, mensaje_original: row.mensaje_original || '' },
      propiedad_interes_id: (row.propiedad_interes_id && codigoPorUuidPropiedad
        && codigoPorUuidPropiedad[row.propiedad_interes_id]) || null,
      estado: row.estado, motivo_descarte: row.motivo_descarte || null,
      suite_destino_canonico: row.suite_destino || 'inmo',
      analista_asignado_id: _agenteALegacy(row.analista_asignado_id, ctx),
      promovido_a_persona_id: (row.promovido_a_persona_id && codigoPorUuidPersona
        && codigoPorUuidPersona[row.promovido_a_persona_id]) || null,
      promovido_por_agente_id: _agenteALegacy(row.promovido_por_agente_id, ctx),
      ts_promocion: row.ts_promocion || null,
      source_id: row.source_id || null,
      payload_original: row.payload_original || null,
      created_at: row.created_at, updated_at: row.updated_at, deleted_at: row.deleted_at || null
    };
  }

  /* ── el resto de entidades ─────────────────────────────────────────────────
     Captación y pedidos también viven arriba. Son pocos registros hoy (3 y 1),
     pero un equipo nuevo tampoco los veía, y los pedidos son las preferencias
     de búsqueda del comprador: perderlos de vista es perder por qué se le
     enseñó un piso y no otro. */

  function mapRowACaptacionLocal(row, ctx, codigoPorUuidPersona, codigoPorUuidCap) {
    return {
      id: row.codigo, uuid: row.id,
      origen: row.origen, source_id: row.source_id || null,
      fecha_captacion: row.fecha_captacion || null,
      meta: row.meta || {},
      nombre_completo: row.nombre_completo || '',
      telefono: row.telefono || null, email: row.email || null,
      requiere_revision_nombre: !!row.requiere_revision_nombre,
      tipo_lead: row.tipo_lead, suite_destino: row.suite_destino,
      datos: row.datos || {},
      estado: row.estado,
      motivo_descarte: row.motivo_descarte || null,
      motivo_descarte_notas: row.motivo_descarte_notas || null,
      agente_asignado_id: _agenteALegacy(row.agente_asignado_id, ctx),
      fecha_pausa_hasta: row.fecha_pausa_hasta || null,
      leads_relacionados: Array.isArray(row.leads_relacionados) ? row.leads_relacionados : [],
      desdoblado_en: Array.isArray(row.desdoblado_en) ? row.desdoblado_en : [],
      desdoblado_de: (row.desdoblado_de && codigoPorUuidCap && codigoPorUuidCap[row.desdoblado_de]) || null,
      promovido_en: row.promovido_en || null,
      promovido_a_persona_id: (row.promovido_a_persona_id && codigoPorUuidPersona
        && codigoPorUuidPersona[row.promovido_a_persona_id]) || null,
      promovido_por_agente_id: _agenteALegacy(row.promovido_por_agente_id, ctx),
      created_at: row.created_at, updated_at: row.updated_at
    };
  }

  function mapRowAPedidoLocal(row, ctx, codigoPorUuidPersona) {
    return {
      id: row.codigo, uuid: row.id,
      personaId: (row.persona_id && codigoPorUuidPersona && codigoPorUuidPersona[row.persona_id]) || null,
      agenteId: _agenteALegacy(row.agente_id, ctx),
      estado: row.estado,
      preferencias: row.preferencias || {},
      origen_creacion: row.origen_creacion,
      notas: row.notas || null,
      cruces_propiedad_ids: Array.isArray(row.cruces) ? row.cruces : [],
      created_at: row.created_at, updated_at: row.updated_at
    };
  }

  async function bajarResto() {
    var R = _remote();
    var ctx = await cargarCtx();
    var personas = await R.listar('personas', 'select=id,codigo&deleted_at=is.null');
    var codigoPorUuidPersona = {};
    (personas || []).forEach(function (p) { codigoPorUuidPersona[p.id] = p.codigo; });

    var caps = await R.listar('captacion', 'select=*&deleted_at=is.null&order=codigo');
    var codigoPorUuidCap = {};
    (caps || []).forEach(function (c) { codigoPorUuidCap[c.id] = c.codigo; });

    var peds = await R.listar('pedidos', 'select=*&deleted_at=is.null&order=codigo');

    return {
      captacion: (caps || []).map(function (c) { return mapRowACaptacionLocal(c, ctx, codigoPorUuidPersona, codigoPorUuidCap); }),
      pedidos: (peds || []).map(function (p) { return mapRowAPedidoLocal(p, ctx, codigoPorUuidPersona); })
    };
  }


  /* mapa código→uuid de propiedades, que las tres entidades de Inmo necesitan
     para apuntar a la propiedad correcta */
  async function _propiedadesPorCodigo() {
    var R = _remote();
    var rows = await R.listar('propiedades', 'select=id,codigo&deleted_at=is.null');
    var out = {};
    (rows || []).forEach(function (p) { out[p.codigo] = p.id; });
    return out;
  }

  /* La 0017 añade columnas que estos mapeos ya usan. Si todavía no está
     aplicada, Postgres se queja de una columna que no existe: mejor decir qué
     falta que devolver un error críptico y dejar a quien mire pensando que se
     le han perdido datos. */
  function _sinMigracion0017(e) {
    var m = String((e && e.message) || '');
    /* dos formas de decir lo mismo: PostgREST habla de su caché de esquema
       ("Could not find the 'x' column of 'y'") y Postgres del SQL en crudo
       ("column x does not exist"). Se cubren las dos. */
    return /could not find the '.*' column of/i.test(m) || /column .* does not exist/i.test(m);
  }

  async function subirInmo() {
    var R = _remote();
    var ctx = await cargarCtx();
    var personas = _leerLocales();
    var porCodigo = _personasPorCodigo(personas);
    var propPorCodigo = await _propiedadesPorCodigo();
    var avisos = [];
    var res = { operaciones: 0, fincas: 0, unidades: 0, inbox: 0, avisos: avisos };

    /* OPERACIONES INMO — exigen persona Y propiedad; sin una de las dos se omite */
    var ops = _leerStore('aj_inmo_operaciones');
    var mut = false;
    ops.forEach(function (o) { if (!o.uuid) { o.uuid = _uuid(); mut = true; } });
    if (mut) _persistir('aj_inmo_operaciones', ops);
    for (var i = 0; i < ops.length; i++) {
      var rowO = mapOpInmoLocalARow(ops[i], ctx, porCodigo, propPorCodigo, avisos);
      if (!rowO) continue;
      await R.upsert('operaciones_inmo', rowO.codigo ? rowO : _sinCodigo(rowO), 'id');
      res.operaciones++;
    }
    await nivelarContador('AJ-IO', _maxCodigo(ops.map(function (o) { return o.id; }), 'AJ-IO'));

    /* FINCAS + sus unidades. Las unidades se reemplazan enteras: son la foto de
       catastro de esa finca, no un histórico que haya que conservar. */
    var fincas = _leerStore('aj_inmo_fincas');
    mut = false;
    fincas.forEach(function (f) { if (!f.uuid) { f.uuid = _uuid(); mut = true; } });
    if (mut) _persistir('aj_inmo_fincas', fincas);
    for (var j = 0; j < fincas.length; j++) {
      var rowF = mapFincaLocalARow(fincas[j]);
      await R.upsert('fincas', rowF.codigo ? rowF : _sinCodigo(rowF), 'id');
      res.fincas++;
      await R.eliminar('finca_unidades', 'finca_id=eq.' + fincas[j].uuid);
      var uds = mapUnidadesARows(fincas[j], propPorCodigo);
      if (uds.length) { await R.insertar('finca_unidades', uds); res.unidades += uds.length; }
    }
    await nivelarContador('AJ-IF', _maxCodigo(fincas.map(function (f) { return f.id; }), 'AJ-IF'));

    /* INBOX */
    var inbox = _leerStore('aj_inbox');
    mut = false;
    inbox.forEach(function (e) { if (!e.uuid) { e.uuid = _uuid(); mut = true; } });
    if (mut) _persistir('aj_inbox', inbox);
    for (var k = 0; k < inbox.length; k++) {
      var rowI = mapInboxLocalARow(inbox[k], ctx, porCodigo, propPorCodigo);
      await R.upsert('inbox', rowI.codigo ? rowI : _sinCodigo(rowI), 'id');
      res.inbox++;
    }
    await nivelarContador('AJ-IB', _maxCodigo(inbox.map(function (e) { return e.id; }), 'AJ-IB'));

    return res;
  }

  /* envoltorio con el aviso claro */
  async function subirInmoSeguro() {
    try { return await subirInmo(); }
    catch (e) {
      if (_sinMigracion0017(e)) {
        var err = new Error('falta aplicar la migración 0017 (columnas nuevas de Inmo) — '
          + 'lo compartido sí se ha sincronizado; lo propio de Inmo espera a ese SQL');
        err.migracionPendiente = '0017';
        throw err;
      }
      throw e;
    }
  }

  async function bajarInmo() {
    var R = _remote();
    var ctx = await cargarCtx();
    var personas = await R.listar('personas', 'select=id,codigo&deleted_at=is.null');
    var props = await R.listar('propiedades', 'select=id,codigo&deleted_at=is.null');
    var codPersona = {}, codPropiedad = {};
    (personas || []).forEach(function (p) { codPersona[p.id] = p.codigo; });
    (props || []).forEach(function (p) { codPropiedad[p.id] = p.codigo; });

    var ops = await R.listar('operaciones_inmo', 'select=*&deleted_at=is.null&order=codigo');
    var fincas = await R.listar('fincas', 'select=*&order=codigo');
    var unidades = await R.listar('finca_unidades', 'select=*');
    var inbox = await R.listar('inbox', 'select=*&deleted_at=is.null&order=codigo');

    var udsPorFinca = {};
    (unidades || []).forEach(function (u) { (udsPorFinca[u.finca_id] = udsPorFinca[u.finca_id] || []).push(u); });

    return {
      operaciones: (ops || []).map(function (o) { return mapRowAOpInmoLocal(o, ctx, codPersona, codPropiedad); }),
      fincas: (fincas || []).map(function (f) { return mapRowAFincaLocal(f, udsPorFinca[f.id] || [], codPropiedad); }),
      inbox: (inbox || []).map(function (e) { return mapRowAInboxLocal(e, ctx, codPersona, codPropiedad); })
    };
  }

  /* Trae lo de arriba y lo funde con lo de aquí. No escribe nada en Supabase:
     si algo local no está arriba, se queda para que lo suba subirX(). */
  async function restaurar() {
    var R = _remote();
    if (!R || !R.sesion || !R.sesion()) throw new Error('[ajSync] restaurar: hace falta sesión');

    var informe = { personas: null, operaciones: null, seguimientos: null, huerfanas: [] };

    /* 1 · personas, con sus embudos y su residencia */
    var locales = _leerLocales();
    var remotas = await bajarPersonas();
    informe.personas = _fusionar(locales, remotas, function (p) { return p.uuid || p.id; },
      function (l, r) {
        Object.keys(r).forEach(function (c) {
          if (c === 'operaciones') return;          // las trae el paso 2, no las pisa
          l[c] = r[c];
        });
      });

    /* 2 · operaciones, que aquí viven dentro de su persona */
    var bajada = await bajarOperaciones();
    informe.huerfanas = bajada.huerfanas;
    var porCodigo = {};
    locales.forEach(function (p) { porCodigo[p.id] = p; });
    var opsInf = { anadidos: 0, actualizados: 0, intactos: 0, sinPersona: 0 };
    Object.keys(bajada.porPersona).forEach(function (cod) {
      var p = porCodigo[cod];
      if (!p) { opsInf.sinPersona += bajada.porPersona[cod].length; return; }
      p.operaciones = p.operaciones || [];
      var r = _fusionar(p.operaciones, bajada.porPersona[cod], function (o) { return o.uuid || o.id; });
      opsInf.anadidos += r.anadidos; opsInf.actualizados += r.actualizados; opsInf.intactos += r.intactos;
    });
    informe.operaciones = opsInf;
    _persistir('aj_personas', locales);

    /* 3 · seguimientos, que sí son tabla propia también aquí */
    var segLocales = (root.AJ && root.AJ.store) ? (root.AJ.store.get('aj_seguimientos', []) || []) : [];
    var segRemotos = await bajarSeguimientos();
    informe.seguimientos = _fusionar(segLocales, segRemotos, function (s) { return s.uuid || s.id; });
    _persistir('aj_seguimientos', segLocales);

    /* 3.bis · captación y pedidos */
    var resto = await bajarResto();
    var capLocales = (root.AJ && root.AJ.store) ? (root.AJ.store.get('aj_captacion', []) || []) : [];
    var pedLocales = (root.AJ && root.AJ.store) ? (root.AJ.store.get('aj_pedidos', []) || []) : [];
    informe.captacion = _fusionar(capLocales, resto.captacion, function (c) { return c.uuid || c.id; });
    informe.pedidos   = _fusionar(pedLocales, resto.pedidos,   function (p) { return p.uuid || p.id; });
    _persistir('aj_captacion', capLocales);
    _persistir('aj_pedidos', pedLocales);

    /* 3.ter · lo propio de Inmo: operaciones, fincas con sus unidades, e inbox */
    var inmo = await bajarInmo();
    var opsInmoLocales = (root.AJ && root.AJ.store) ? (root.AJ.store.get('aj_inmo_operaciones', []) || []) : [];
    var fincasLocales  = (root.AJ && root.AJ.store) ? (root.AJ.store.get('aj_inmo_fincas', []) || []) : [];
    var inboxLocales   = (root.AJ && root.AJ.store) ? (root.AJ.store.get('aj_inbox', []) || []) : [];
    informe.opsInmo = _fusionar(opsInmoLocales, inmo.operaciones, function (o) { return o.uuid || o.id; });
    informe.fincas  = _fusionar(fincasLocales,  inmo.fincas,      function (f) { return f.uuid || f.id; });
    informe.inbox   = _fusionar(inboxLocales,   inmo.inbox,       function (e) { return e.uuid || e.id; });
    _persistir('aj_inmo_operaciones', opsInmoLocales);
    _persistir('aj_inmo_fincas', fincasLocales);
    _persistir('aj_inbox', inboxLocales);

    /* 4 · poner los contadores por encima de lo que ya existe arriba.
       Sin esto, un equipo que abre con el almacén vacío empieza a numerar
       desde cero y reparte códigos que en Supabase ya son de otra persona:
       así apareció un AJ-P-010 que era dos personas distintas a la vez. La
       regla J1 dice que un número pertenece a un único registro para siempre. */
    informe.contadores = _nivelarLocales(locales, segLocales, capLocales, pedLocales,
      { operaciones: opsInmoLocales, fincas: fincasLocales, inbox: inboxLocales });

    /* 5 · si aun así hay códigos repartidos entre dos registros, se avisa: no se
       renombra solo, porque el código viaja en titulares y seguimientos y quien
       decide quién se queda con él es una persona. */
    informe.codigosRepetidos = _codigosRepetidos(locales, segLocales);

    /* 6 · y lo que arriba está enterrado, aquí también. Va AL FINAL para que
       cuente sobre el estado ya fusionado y no sobre el de antes. */
    try { informe.enterrados = await enterrarBorradosArriba(); }
    catch (e) { informe.enterrados = { error: e.message }; }

    return informe;
  }

  /* ── bajar las lápidas ───────────────────────────────────────────────────────
     Un borrado no viajaba hacia abajo. `restaurar()` fusiona lo que hay arriba
     y deja intacto lo que solo está aquí — decisión correcta, porque «no está
     arriba» casi siempre significa «todavía sin subir»—. Pero entonces borras
     algo en un equipo y en los demás sigue apareciendo para siempre.

     La cura no es borrar lo ausente: es preguntar por lo que el servidor dice
     que está MUERTO. `deleted_at not is null` es una afirmación, no una
     ausencia, y esa distinción es toda la seguridad de esta función. Es la
     simétrica del guardarraíl que la subida ya tenía para no resucitar nada.

     Donde no hay lápida no se toca nada: `seguimientos` y `titularidades` se
     borran en duro, así que ahí «no está» y «aún no ha subido» son lo mismo y
     adivinar sería perder trabajo. Queda dicho para que no parezca un olvido. */
  var TUMBAS = [
    { tabla: 'personas',         clave: 'aj_personas' },
    { tabla: 'operaciones',      clave: 'aj_personas', dentroDe: 'operaciones' },
    { tabla: 'captacion',        clave: 'aj_captacion' },
    { tabla: 'pedidos',          clave: 'aj_pedidos' },
    { tabla: 'propiedades',      clave: 'aj_inmo_propiedades' },
    { tabla: 'operaciones_inmo', clave: 'aj_inmo_operaciones' },
    { tabla: 'inbox',            clave: 'aj_inbox' }
  ];

  async function enterrarBorradosArriba() {
    var R = _remote();
    if (!R || !R.sesion || !R.sesion()) throw new Error('[ajSync] enterrar: hace falta sesión');
    var informe = { enterrados: 0, porTabla: {}, detalle: [], arrastrados: {},
                    sinLapida: ['seguimientos', 'titularidades'] };

    for (var i = 0; i < TUMBAS.length; i++) {
      var t = TUMBAS[i], muertos = {};
      try {
        (await R.listar(t.tabla, 'select=id,codigo&deleted_at=not.is.null&limit=5000') || [])
          .forEach(function (r) { muertos[r.id] = r.codigo || r.id; });
      } catch (e) { continue; }                 // tabla sin deleted_at o sin permiso: se salta
      if (!Object.keys(muertos).length) continue;

      var lista = _leerStore(t.clave), tocado = false, n = 0;
      /* Al enterrar una persona se van con ella sus operaciones, que viven
         dentro. Contarlas aparte: si el informe dice «13 enterrados» y además
         desaparecen 3 operaciones sin nombrarlas, el informe miente por
         omisión — y es el silencio que estamos quitando de todas partes. */
      if (!t.dentroDe && t.clave === 'aj_personas') {
        var hijasQueSeVan = 0;
        lista.forEach(function (p) {
          if (p.uuid && muertos[p.uuid]) hijasQueSeVan += (p.operaciones || []).length;
        });
        if (hijasQueSeVan) informe.arrastrados.operaciones =
          (informe.arrastrados.operaciones || 0) + hijasQueSeVan;
      }
      if (t.dentroDe) {
        lista.forEach(function (p) {
          var hijos = p[t.dentroDe] || [];
          var quedan = hijos.filter(function (h) { return !(h.uuid && muertos[h.uuid]); });
          if (quedan.length !== hijos.length) {
            hijos.forEach(function (h) {
              if (h.uuid && muertos[h.uuid]) informe.detalle.push(t.tabla + ' ' + muertos[h.uuid]);
            });
            n += hijos.length - quedan.length;
            p[t.dentroDe] = quedan; tocado = true;
          }
        });
      } else {
        var quedan = lista.filter(function (x) { return !(x.uuid && muertos[x.uuid]); });
        if (quedan.length !== lista.length) {
          lista.forEach(function (x) {
            if (x.uuid && muertos[x.uuid]) informe.detalle.push(t.tabla + ' ' + muertos[x.uuid]);
          });
          n = lista.length - quedan.length;
          lista = quedan; tocado = true;
        }
      }
      if (tocado) { _persistir(t.clave, lista); informe.porTabla[t.tabla] = n; informe.enterrados += n; }
    }
    return informe;
  }

  root.AJ.sync = {
    version: '0.7.0',
    /* mapeadores puros (tests de contrato) */
    construirCtx: construirCtx,
    mapPersonaLocalARow: mapPersonaLocalARow,
    mapRowAPersonaLocal: mapRowAPersonaLocal,
    mapEmbudoLocalARow: mapEmbudoLocalARow,
    mapRowAEmbudoLocal: mapRowAEmbudoLocal,
    mapResidenciaLocalARow: mapResidenciaLocalARow,
    mapRowAResidenciaLocal: mapRowAResidenciaLocal,
    mapOperacionLocalARow: mapOperacionLocalARow,
    mapTitularesARows: mapTitularesARows,
    mapSeguimientoLocalARow: mapSeguimientoLocalARow,
    _resolverEntidadSeg: _resolverEntidadSeg,
    _mapasEntidadSeg: _mapasEntidadSeg,
    mapCaptacionLocalARow: mapCaptacionLocalARow,
    mapPedidoLocalARow: mapPedidoLocalARow,
    mapPropiedadLocalARow: mapPropiedadLocalARow,
    mapTitularidadLocalARow: mapTitularidadLocalARow,
    mapOportunidadLocalARow: mapOportunidadLocalARow,
    mapRowASeguimientoLocal: mapRowASeguimientoLocal,
    aplicarSeguimientoRemoto: aplicarSeguimientoRemoto,
    /* dinero (el punto delicado — céntimos) */
    eurosACents: eurosACents,
    centsAEuros: centsAEuros,
    /* red */
    cargarCtx: cargarCtx,
    subirPersonas: subirPersonas,
    bajarPersonas: bajarPersonas,
    bajarOperaciones: bajarOperaciones,
    bajarSeguimientos: bajarSeguimientos,
    bajarResto: bajarResto,
    subirInmo: subirInmoSeguro,
    subirInmoDirecto: subirInmo,
    bajarInmo: bajarInmo,
    enterrarBorradosArriba: enterrarBorradosArriba,
    _TUMBAS: TUMBAS,
    mapRowACaptacionLocal: mapRowACaptacionLocal,
    mapRowAPedidoLocal: mapRowAPedidoLocal,
    mapOpInmoLocalARow: mapOpInmoLocalARow,
    mapRowAOpInmoLocal: mapRowAOpInmoLocal,
    mapFincaLocalARow: mapFincaLocalARow,
    mapUnidadesARows: mapUnidadesARows,
    mapRowAFincaLocal: mapRowAFincaLocal,
    mapInboxLocalARow: mapInboxLocalARow,
    mapRowAInboxLocal: mapRowAInboxLocal,
    mapRowAOperacionLocal: mapRowAOperacionLocal,
    restaurar: restaurar,
    compararPersonas: compararPersonas,
    subirOperaciones: subirOperaciones,
    compararOperaciones: compararOperaciones,
    subirSeguimientos: subirSeguimientos,
    compararSeguimientos: compararSeguimientos,
    subirResto: subirResto,
    compararResto: compararResto,
    verificarReglasServidor: verificarReglasServidor,
    nivelarContador: nivelarContador
  };
})();
