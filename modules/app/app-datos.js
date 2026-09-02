/* ═══════════════════════════════════════════════════════════════════════════
   App AJ Finances · de dónde salen los números

   Una sola capa entre las vistas y el CRM. Las vistas no tocan localStorage ni
   inventan cálculos: piden lo que necesitan y lo pintan. Así el port es 1:1 con
   el mock y lo que cambia con los datos reales queda aquí, a la vista.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var D = {};

  /* Fecha LOCAL, no UTC: toISOString() da la fecha en UTC y de madrugada (hora
     de Madrid) cae un día antes que el calendario del usuario, descuadrando qué
     es "hoy" en toda la agenda. Se construye a mano desde las partes locales. */
  function isoLocal(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function hoy() { return isoLocal(new Date()); }
  function maniana() { return isoLocal(new Date(Date.now() + 864e5)); }

  /* ── quién eres ─────────────────────────────────────────────────────────────
     El mock enseña dos órdenes de accesos, Armin y Jonatan, con el mismo
     diseño. Aquí se resuelve una vez y las vistas solo preguntan. */
  /* El nombre y el rol están en `usuarios`, no en el correo: los dos admins
     usan `girona@` y partir el correo daba «girona» en el saludo. Se guarda la
     tabla la primera vez que hay sesión y luego se tira de la copia. */
  var LS_YO = 'aj_app_usuarios_v1';

  D.refrescarUsuarios = function () {
    if (!D.yo().haySesion || !window.AJ || !AJ.remote) return Promise.resolve(null);
    return AJ.remote.listar('usuarios', 'select=id,email,nombre,rol,sociedad_principal,modo_visibilidad,activo&limit=50')
      .then(function (r) {
        if (!Array.isArray(r) || !r.length) return null;
        try { localStorage.setItem(LS_YO, JSON.stringify(r)); } catch (e) {}
        D.marcarSync();
        return r;
      })
      /* Que falle se DICE. Este catch se tragaba un «column usuarios.sociedad
         does not exist» y el saludo se quedaba en «girona» sin que nada lo
         explicara: un error mudo cuesta más que uno ruidoso. */
      .catch(function (e) { console.warn('[app] usuarios no se han podido leer:', e.message); return null; });
  };

  D.yo = function () {
    var s = null;
    try { s = (window.AJ && AJ.remote && AJ.remote.sesion && AJ.remote.sesion()) || null; } catch (e) {}
    var correo = (s && s.user && s.user.email) || '';
    var fila = null;
    try {
      fila = (JSON.parse(localStorage.getItem(LS_YO) || '[]') || []).filter(function (u) {
        return (u.email || '').toLowerCase() === correo.toLowerCase();
      })[0] || null;
    } catch (e) {}
    /* Esta es la app de AJ FINANCES. La de Inmo se hará aparte (consultan cosas
       distintas). Por eso la sociedad es SIEMPRE 'finances': antes esto bifurcaba
       por `sociedad_principal` y arrastraba ramas Inmo por todas las vistas
       (accesos, copys, tipo «visita» por defecto, puerta de propiedad…). Fijarla
       aquí apaga esas ramas de raíz; el resto es limpiar el código muerto. */
    return {
      id: (s && s.user && s.user.id) || null,
      correo: correo || '',
      nombre: (fila && fila.nombre) || (correo ? correo.split('@')[0] : 'AJ Finances'),
      rol: (fila && fila.rol) || null,
      sociedad: 'finances',
      haySesion: !!s
    };
  };

  /* ── clientes y operaciones ─────────────────────────────────────────────────
     La verdad local es `aj_personas`, con las operaciones DENTRO de cada
     persona: el CRM las guarda ahí con AJ.personas.actualizar(id,{operaciones}).
     `aj_clientes` es el legado que se migra al abrir el CRM, y en un equipo
     recién llegado tiene una fila mientras personas tiene sesenta y dos. Leer
     de ahí era ver el uno por ciento del CRM y no notarlo. */
  D.clientes = function () {
    var out = [];
    try { out = (AJ.personas.listar({}) || []).slice(); } catch (e) {}
    if (out.length) return out;
    /* red de seguridad: si aún no hay personas, el legado es mejor que nada */
    try { return AJ.store.get('aj_clientes') || []; } catch (e) { return []; }
  };

  D.operaciones = function () {
    var out = [];
    D.clientes().forEach(function (c) {
      (c.operaciones || []).forEach(function (op) {
        if (op.pendienteAsignacion || op.archivado) return;
        out.push({
          id: op.id, codigo: op.codigo || null,
          cliente: c.nombre, clienteId: c.id, telefono: c.telefono || '',
          estado: op.estado || 'estudio',
          esLead: op.esLead || ['estudio', 'documentacion'].indexOf(op.estado) >= 0,
          entidad: op.entidad || '', importe: op.importe || '',
          honorarios: op.honorarios || '', fein: op.fein || null
        });
      });
    });
    return out;
  };

  /* ── la agenda ──────────────────────────────────────────────────────────────
     «Programada» y con fecha. Lo de hoy, lo de después y lo que se quedó atrás:
     son las tres cosas que pide la pantalla de Inicio del mock. */
  D.agenda = function () {
    var segs = [];
    try { segs = AJ.seguimientos.listar({}) || []; } catch (e) {}
    var h = hoy();
    var prog = segs.filter(function (s) { return (s.estado || 'realizada') === 'programada' && s.fecha; });
    var conQuien = D.mapaPersonas();
    /* teléfono de cada persona, para que la card «Ahora» pueda llamar de verdad
       en vez de un botón que no hace nada */
    var telDe = {};
    try { (AJ.personas.listar({}) || []).forEach(function (p) { telDe[p.id] = p.telefono || ''; }); } catch (e) {}
    function vestir(s) {
      return {
        id: s.id, tipo: s.tipo || 'nota', hora: (s.hora || '').slice(0, 5),
        texto: s.texto || '', fecha: s.fecha,
        personaId: s.personaId || null,
        duracion_min: s.duracion_min || s.duracion || 0,
        quien: conQuien[s.personaId] || s.autorNombre || '',
        telefono: telDe[s.personaId] || '',
        dias: Math.round((new Date(h) - new Date(s.fecha)) / 864e5)
      };
    }
    return {
      hoy: prog.filter(function (s) { return s.fecha === h; }).map(vestir)
             .sort(function (a, b) { return (a.hora || '99').localeCompare(b.hora || '99'); }),
      manana: prog.filter(function (s) { return s.fecha === maniana(); }).map(vestir),
      futuro: prog.filter(function (s) { return s.fecha > h; }).map(vestir)
                .sort(function (a, b) { return a.fecha.localeCompare(b.fecha); }),
      vencidas: prog.filter(function (s) { return s.fecha < h; }).map(vestir)
                  .sort(function (a, b) { return a.fecha.localeCompare(b.fecha); })
    };
  };

  D.mapaPersonas = function () {
    var m = {};
    try { (AJ.personas.listar({}) || []).forEach(function (p) { m[p.id] = p.nombre; }); } catch (e) {}
    return m;
  };

  /* ── lo que urge ────────────────────────────────────────────────────────────
     El mock enseña dos o tres líneas con su acción al lado. Salen de cosas que
     el CRM ya sabe y no dice: citas pasadas sin cerrar y FEINs con sus diez
     días de ley (§4.3). Nada inventado. */
  D.urgente = function () {
    var out = [];
    D.agenda().vencidas.slice(0, 3).forEach(function (a) {
      out.push({
        texto: (a.tipo === 'visita' ? 'Visita' : a.tipo === 'cita' ? 'Cita' : 'Actividad') +
               ' del ' + D.diaMes(a.fecha) + ' sin cerrar',
        detalle: (a.quien ? a.quien + ' · ' : '') + '¿se hizo?',
        cta: 'Cerrar', ir: 'agenda'
      });
    });
    D.operaciones().forEach(function (o) {
      var f = o.fein;
      if (f && f.recibida && f.fechaRecepcion) {
        var quedan = 10 - Math.round((new Date(hoy()) - new Date(f.fechaRecepcion)) / 864e5);
        if (quedan <= 10 && quedan > -30) out.push({
          texto: 'FEIN de ' + o.cliente,
          detalle: quedan > 0 ? 'Quedan ' + quedan + ' de los 10 días de ley' : 'Caducada hace ' + (-quedan) + ' días',
          cta: 'Ver', ir: 'cliente:' + o.clienteId
        });
      }
    });
    return out;
  };

  /* ── el día limpio ──────────────────────────────────────────────────────────
     El brief 01 lo dice y los datos lo confirman: es el día normal, no el caso
     raro. Así que tiene contenido propio, no un hueco. Sale de lo que ya
     medimos: gente sin tocar y expedientes sin empezar. */
  D.sePuedeAdelantar = function () {
    var out = [], m = {};
    try {
      (AJ.seguimientos.listar({}) || []).forEach(function (s) {
        var f = (s.fecha || '').slice(0, 10);
        if (s.personaId && f && (!m[s.personaId] || f > m[s.personaId])) m[s.personaId] = f;
      });
    } catch (e) {}
    var sinTocar = 0;
    try {
      (AJ.personas.listar({}) || []).forEach(function (p) { if (!m[p.id]) sinTocar++; });
    } catch (e) {}
    if (sinTocar) out.push({
      n: sinTocar, texto: sinTocar + ' clientes sin contactar',
      detalle: 'Nunca se les ha registrado nada', ir: 'clientes'
    });
    var leads = D.operaciones().filter(function (o) { return o.esLead && o.estado !== 'descartado'; });
    if (leads.length) out.push({
      n: leads.length, texto: leads.length + ' en clientes potenciales',
      detalle: 'Esperando estudio o documentación', ir: 'leads'
    });
    return out;
  };

  /* ── el expediente ──────────────────────────────────────────────────────────
     Los requisitos viven SOLO en Supabase, así que la app se los guarda la
     primera vez que hay sesión y luego tira de la copia. Sin copia no se
     inventa un número: se dice que no se sabe, que es lo honesto y además es
     lo que evita repetir el error del mock —que puso 14 en todas las fases
     cuando el acumulado real es 6 · 14 · 18 · 21 · 22 · 23 · 26—. */
  var LS_REQ = 'aj_app_requisitos_v1';
  var ORDEN = ['estudio','documentacion','encargo','encargo_vigente','enviado_banco','tasacion','FEIN','arras'];

  D.refrescarRequisitos = function () {
    if (!D.yo().haySesion || !window.AJ || !AJ.remote) return Promise.resolve(null);
    return AJ.remote.listar('expediente_requisitos', /* `vigencia_meses` hace falta para saber si un papel que está subido sigue
   valiendo: una nómina de marzo subida en julio sigue siendo de marzo. */
        'select=clave,nombre,desde_fase,cantidad,por_titular,vigencia_meses,activo&limit=200')
      .then(function (r) {
        if (!Array.isArray(r) || !r.length) return null;
        try { localStorage.setItem(LS_REQ, JSON.stringify({ at: Date.now(), req: r })); } catch (e) {}
        D.marcarSync();
        return r;
      })
      .catch(function (e) { console.warn('[app] requisitos:', e.message); return null; });
  };

  D.requisitos = function () {
    try {
      var c = JSON.parse(localStorage.getItem(LS_REQ) || 'null');
      return (c && c.req) || null;
    } catch (e) { return null; }
  };

  /* Cuántos hacen falta en esa fase. Acumulado: los sin fase se piden siempre,
     y cada fase suma los suyos a los de las anteriores. */
  D.expediente = function (fase) {
    var req = D.requisitos();
    if (!req) return null;                       // no se sabe, y se dice
    var i = ORDEN.indexOf(fase);
    var hacenFalta = req.filter(function (r) {
      if (r.activo === false) return false;
      if (!r.desde_fase) return true;
      var j = ORDEN.indexOf(r.desde_fase);
      return j < 0 || (i >= 0 && j <= i);
    });
    return {
      total: hacenFalta.length,
      lista: hacenFalta.map(function (r) {
        return { clave: r.clave, nombre: r.nombre || r.clave,
                 cantidad: r.cantidad || 1, porTitular: !!r.por_titular };
      })
    };
  };

  /* ── la cuota del escenario preferido ───────────────────────────────────────
     Es el número que te preguntan por teléfono, y el que la Ficha 360 y el
     cuadre ponen en grande. Vive en estudio_escenarios.cuota_cents del que
     tiene `preferido`.

     Medido el 30-ago: hay 12 escenarios, los 12 marcados preferido, y NINGUNO
     con la cuota calculada. Así que hoy este bloque cae siempre en el respaldo.
     Se deja escrito porque el día que se calculen, esto ya funciona. */
  var LS_CUO = 'aj_app_cuotas_v1';

  D.refrescarCuotas = function () {
    if (!D.yo().haySesion || !window.AJ || !AJ.remote) return Promise.resolve(null);
    return Promise.all([
      AJ.remote.listar('estudios', 'select=id,persona_id&limit=300'),
      AJ.remote.listar('estudio_escenarios', 'select=estudio_id,preferido,cuota_cents&limit=300')
    ]).then(function (r) {
      var dePersona = {}, m = {};
      (r[0] || []).forEach(function (e) { dePersona[e.id] = e.persona_id; });
      (r[1] || []).forEach(function (x) {
        if (!x.preferido || !x.cuota_cents) return;
        var p = dePersona[x.estudio_id];
        if (p) m[p] = Math.round(x.cuota_cents / 100);
      });
      try { localStorage.setItem(LS_CUO, JSON.stringify(m)); } catch (e) {}
      D.marcarSync();
      return m;
    }).catch(function (e) { console.warn('[app] cuotas:', e.message); return null; });
  };

  D.cuotaDe = function (personaUuid) {
    try {
      var m = JSON.parse(localStorage.getItem(LS_CUO) || 'null');
      return (m && m[personaUuid]) || null;
    } catch (e) { return null; }
  };

  /* Lo que esa persona tiene subido. También del servidor; sin sesión, cero
     conocido — que no es lo mismo que cero documentos. */
  D.documentosDe = function (personaId) {
    /* Distingue «no hay copia de documentos» (null = no se sabe) de «la copia
       existe y esta persona no tiene ninguno» ([] = cero subidos, que es un
       expediente con TODO por pedir). Antes las dos daban null y por eso las
       fichas sin un solo papel no aparecían en «expedientes con huecos». */
    try {
      var c = JSON.parse(localStorage.getItem('aj_app_docs_v1') || 'null');
      if (!c) return null;                 // sin copia: no se sabe
      return c[personaId] || [];           // con copia: lo que tenga, o cero
    } catch (e) { return null; }
  };

  D.diaMes = function (iso) {
    if (!iso) return '';
    var M = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    var d = new Date(iso);
    return d.getDate() + '-' + M[d.getMonth()];
  };
  D.fechaLarga = function () {
    var DI = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
    var ME = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    var d = new Date();
    return DI[d.getDay()] + ' ' + d.getDate() + ' de ' + ME[d.getMonth()];
  };
  D.enCuanto = function (hora) {
    if (!hora) return '';
    var n = new Date(), p = hora.split(':');
    var min = (+p[0] * 60 + (+p[1] || 0)) - (n.getHours() * 60 + n.getMinutes());
    if (min < 0) return 'hace ' + Math.abs(min) + ' min';
    if (min < 60) return 'en ' + min + ' min';
    return 'en ' + Math.round(min / 60) + ' h';
  };
  /* Cabecera v2 · «jueves 30» (día en minúscula) y «9:50». Se calculan aquí y
     no en la vista para que el eyebrow del Inicio no reimplemente el calendario. */
  D.fechaCorta = function () {
    var DI = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    var d = new Date();
    return DI[d.getDay()] + ' ' + d.getDate();
  };
  D.horaAhora = function () {
    var d = new Date();
    return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
  };

  /* Cierre del día (Inicio v2 · estado 03): lo que se ha CERRADO hoy —realizada
     o no_realizada—, para el bloque «Hoy has cerrado». Es lo contrario de la
     agenda, que solo mira lo «programada»; aquí miramos lo ya resuelto. Sin
     copia de seguimientos el bloque no aparece: cero cerradas conocidas no es
     lo mismo que cero cerradas. */
  /* Resumen de un mes (YYYY-MM) para el «mes pasado»: lo que se hizo, no lo que
     queda. Realizadas/no realizadas y cuántas se cerraron el mismo día (fecha de
     la actividad == día en que se registró su cierre, aprox. por createdAt). */
  D.resumenMes = function (ym) {
    var segs = [];
    try { segs = AJ.seguimientos.listar({}) || []; } catch (e) { return { realizadas: 0, noRealizadas: 0, total: 0, mismoDia: 0 }; }
    var enMes = segs.filter(function (s) { return String(s.fecha || '').slice(0, 7) === ym; });
    var real = 0, no = 0, mismo = 0;
    enMes.forEach(function (s) {
      var e = s.estado || 'programada';
      if (e === 'realizada') real++;
      else if (e === 'no_realizada') no++;
      if ((e === 'realizada' || e === 'no_realizada') && s.updatedAt && String(s.updatedAt).slice(0, 10) === (s.fecha || '')) mismo++;
    });
    return { realizadas: real, noRealizadas: no, total: real + no, mismoDia: mismo };
  };

  D.cerradasHoy = function () {
    var h = hoy(), mapa = D.mapaPersonas(), segs = [];
    try { segs = AJ.seguimientos.listar({}) || []; } catch (e) { return []; }
    return segs.filter(function (s) {
      return (s.fecha || '').slice(0, 10) === h &&
             ['realizada', 'no_realizada'].indexOf(s.estado || 'realizada') >= 0;
    }).sort(function (a, b) {
      return String(b.hora || '').localeCompare(String(a.hora || ''));
    }).map(function (s) {
      return { id: s.id, tipo: s.tipo || 'nota', hora: (s.hora || '').slice(0, 5),
               texto: s.texto || 'Actividad', quien: mapa[s.personaId] || '',
               personaId: s.personaId || null, estado: s.estado || 'realizada' };
    });
  };

  D.hoyISO = hoy;

  /* ═══ 06 · BUSCAR · el motor ════════════════════════════════════════════════
     Un solo campo que busca a la vez personas, operaciones, notas, códigos y
     teléfonos. Aquí está el motor; la vista solo pinta lo que esto devuelve.

     NI UN NÚMERO DE ESTA SECCIÓN VA ESCRITO A MANO, y es deliberado: las dos
     correcciones del brief nacieron justo de eso —el mock decía «las 40
     actividades de las dos últimas semanas» cuando eran 10, y «tus 9 clientes»
     cuando eran 7—. Un número a mano nace correcto y envejece mintiendo, y
     esta es precisamente la pantalla cuyo único trabajo es declarar el alcance
     con honestidad. Es la misma lección que ya está escrita en D.expediente.
     ─────────────────────────────────────────────────────────────────────────── */

  D.normalizar = function (s) {
    s = String(s == null ? '' : s).toLowerCase();
    /* Sin acentos: quien teclea de pie escribe «nuria», no «Núria». */
    try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) {}
    return s;
  };
  function digitos(s) { return String(s == null ? '' : s).replace(/\D+/g, ''); }
  D.digitos = digitos;

  /* El mock escribe «655 12 88 90». La Capa 3 agrupa los móviles 3-3-3 —
     «655 128 890»— y es la que usan los otros seis módulos, así que manda ella:
     que el mismo número se lea distinto en la app y en el CRM confunde más de
     lo que ordena un espacio. */
  D.telefono = function (s) {
    try { return (AJ.format && AJ.format.telefono) ? AJ.format.telefono(s) : String(s || ''); }
    catch (e) { return String(s || ''); }
  };

  /* Los códigos humanos del CRM (§6.1): AJ-P persona · AJ-F operación Finances ·
     AJ-I operación Inmo · AJ-IP propiedad · AJ-IT titularidad · AJ-S actividad ·
     AJ-CL lead · AJ-PD pedido. Los prefijos largos van primero en la alternancia
     o «AJ-IP-012» se leería como AJ-I. */
  var RX_CODIGO = /^aj[-\s]?(ip|it|io|ib|cl|pd|p|f|i|s)[-\s]?(\d{1,6})$/i;
  function pad3(n) { n = String(n); return n.length >= 3 ? n : ('00' + n).slice(-3); }

  function opsDe(persona) {
    return (persona.operaciones || []).filter(function (o) {
      return !o.pendienteAsignacion && !o.archivado;
    });
  }

  /* Cuánto abarca la búsqueda. Todo contado, nada supuesto: es lo que la
     pantalla enseña cuando no hay cobertura y cuando no hay resultados, y si
     ese número miente el mecanismo de honestidad es lo que falla. */
  D.alcance = function () {
    var per = D.clientes(), ops = D.operaciones(), seg = [];
    try { seg = AJ.seguimientos.listar({}) || []; } catch (e) {}
    var conTel = per.filter(function (p) { return digitos(p.telefono).length >= 6; }).length;
    var corte = new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10);
    return {
      personas: per.length, operaciones: ops.length, notas: seg.length,
      conTelefono: conTel, sinTelefono: per.length - conTel,
      /* C1 · el mock declaraba 40 y eran 10. Ahora se cuentan las que hay. */
      notasRecientes: seg.filter(function (s) { return (s.fecha || '') >= corte; }).length,
      dias: 14, desde: corte
    };
  };

  /* C2 · «tus N clientes». El denominador NO se calcula filtrando por agente:
     es el tamaño del almacén local, y por eso sale bien solo. Desde la tanda 1
     de permisos las personas llevan RLS, así que a Camilo solo le baja lo suyo
     y `D.clientes().length` YA es «lo que puede ver». Contarlo de otra forma
     sería inventar un total que el servidor no le habría dado nunca. */
  D.soloLoTuyo = function () { return D.yo().rol === 'agente'; };

  /* ¿La lleva quien está mirando? Se usa para el estado «lo ve Camilo y no es
     suyo»: con permisos encendidos, la regla R-P3 hace que veas al titular de
     TU operación aunque lo captara otro, así que esta ficha existe de verdad y
     tiene que decir lo que se puede y lo que no. */
  D.esMia = function (persona) {
    return esMia(persona || {}, D.miClaveAgente(), D.yo().id);
  };
  D.quienLaLleva = function (persona) {
    var a = (persona && (persona.agenteCaptacionId || persona.agentId)) || null;
    if (!a) return null;
    try {
      var u = (JSON.parse(localStorage.getItem(LS_YO) || '[]') || []).filter(function (x) {
        var clave = (x.rol === 'admin' && x.sociedad_principal === 'ambas')
          ? 'admin' : String(x.nombre || '').toLowerCase();
        return x.id === a || D.mismaClave(a, clave, x.id);
      })[0];
      if (u) return u.nombre;
    } catch (e) {}
    /* sin la tabla no se inventa un nombre: se dice la clave que hay */
    return a === 'admin' ? null : String(a).charAt(0).toUpperCase() + String(a).slice(1);
  };

  /* El puente Inmo ↔ Finances se retiró: es la app de Finances.
     La sinergia cross-sociedad vivirá en el CRM y, si procede, en la app de Inmo. */

  function resolverCodigo(cod, per, ops) {
    var i, o;
    for (i = 0; i < per.length; i++) if (String(per[i].id || '').toUpperCase() === cod) {
      o = opsDe(per[i])[0];
      return { clase: 'persona', codigo: per[i].id, titulo: per[i].nombre,
               que: 'Persona', detalle: o ? faseDe(o.estado) : 'Sin operación',
               telefono: per[i].telefono || '', ir: 'cliente:' + per[i].id,
               cta: 'Ir a la ficha' };
    }
    for (i = 0; i < ops.length; i++) if (String(ops[i].codigo || '').toUpperCase() === cod) {
      return { clase: 'operacion', codigo: ops[i].codigo, titulo: ops[i].cliente,
               que: 'Operación de Finances', detalle: detalleOp(ops[i]),
               telefono: ops[i].telefono || '', ir: 'cliente:' + ops[i].clienteId,
               cta: 'Ir a la operación' };
    }
    var seg = [];
    try { seg = AJ.seguimientos.listar({}) || []; } catch (e) {}
    for (i = 0; i < seg.length; i++) if (String(seg[i].id || '').toUpperCase() === cod) {
      return { clase: 'actividad', codigo: seg[i].id, titulo: seg[i].texto || 'Actividad',
               que: 'Actividad', detalle: (seg[i].tipo || 'nota') + ' · ' + D.diaMes(seg[i].fecha),
               ir: 'agenda', cta: 'Ver en la agenda' };
    }
    return null;
  }

  /* La fase en palabras. El embudo canónico §4.7 con los nombres que se dicen
     en voz alta, que es lo que cabe en una fila de 56 px. */
  var FASE = {
    estudio: 'En estudio', documentacion: 'Documentación', encargo: 'Encargo',
    enviado_banco: 'En el banco', paga_y_senal: 'Paga y señal', 'paga_y_señal': 'Paga y señal',
    arras: 'Arras', tasacion: 'Tasación', FEIN: 'FEIN recibida', fein: 'FEIN recibida',
    firma: 'Listo para firma', perdido: 'Perdida', descartado: 'Descartado'
  };
  function faseDe(e) { return FASE[e] || FASE[String(e || '').toLowerCase()] || (e || 'En estudio'); }
  D.faseDe = faseDe;

  /* Lo mínimo para DECIDIR sin entrar (§4 del brief). La cuota es lo primero
     que se pregunta por teléfono, pero hoy no está calculada en ninguno de los
     escenarios, así que cuando no se sabe se dice la entidad y no un número
     verosímil. */
  function detalleOp(o) {
    var partes = [faseDe(o.estado)];
    var cuota = null;
    try { cuota = D.cuotaDe(o.clienteUuid || o.clienteId); } catch (e) {}
    if (cuota) partes.push(AJ.format ? AJ.format.moneda(cuota) + '/mes' : cuota + ' €/mes');
    else if (o.entidad) partes.push(o.entidad);
    return partes.join(' · ');
  }

  function porTelefono(dig, per) {
    return per.filter(function (p) {
      var t = digitos(p.telefono);
      return t.length >= 6 && t.slice(-dig.length) === dig;
    });
  }

  /* «¿Querías decir?» sin librería de parecidos: cada palabra tecleada tiene
     que ser el principio de alguna palabra del nombre. «Sergi Bosc» encuentra
     «Sergi Bosch Riu», que es el caso del mock, y no encuentra ruido. */
  function porPalabras(n, per) {
    var trozos = n.split(/\s+/).filter(Boolean);
    if (!trozos.length) return [];
    return per.filter(function (p) {
      var partes = D.normalizar(p.nombre).split(/\s+/);
      return trozos.every(function (t) {
        return partes.some(function (x) { return x.indexOf(t) === 0; });
      });
    }).slice(0, 4);
  }

  D.buscar = function (q) {
    q = String(q || '').trim();
    var r = { q: q, tipo: 'vacio', personas: [], operaciones: [], notas: [],
              destino: null, opciones: [], sugerencias: [], alcance: D.alcance() };
    if (!q) return r;

    var per = D.clientes(), ops = D.operaciones();

    /* 1 · Un código no se busca: se va. Hay una sola respuesta posible, así que
       una lista de uno sería un paso de más. */
    var m = q.match(RX_CODIGO);
    if (m) {
      r.tipo = 'codigo';
      r.destino = resolverCodigo('AJ-' + m[1].toUpperCase() + '-' + pad3(m[2]), per, ops);
      return r;
    }

    /* 2 · Dígitos sueltos: «14» es ambiguo y se PREGUNTA, no se adivina. Y las
       opciones no son una lista fija: se ofrecen solo las que existen de
       verdad, así que nunca propone una operación que no hay. */
    if (/^\d{1,9}$/.test(q)) {
      var destinos = [];
      ['AJ-P-', 'AJ-F-'].forEach(function (pre) {
        var d = resolverCodigo(pre + pad3(q), per, ops);
        if (d) destinos.push(d);
      });
      /* Dos dígitos ya se ofrecen como teléfono: es el «···14» del mock. No
         se enseñan los resultados, se enseña la OPCIÓN — con uno solo la
         lista sería media cartera y eso no ayuda a nadie. */
      var tel = q.length >= 2 ? porTelefono(q, per) : [];
      if (destinos.length + (tel.length ? 1 : 0) > 1) {
        r.tipo = 'numero';
        r.opciones = destinos.slice();
        if (tel.length) r.opciones.push({
          clase: 'telefono', codigo: '···' + q, titulo: 'Buscar teléfonos que acaben en ' + q,
          detalle: tel.length + (tel.length === 1 ? ' número' : ' números'), n: tel.length
        });
        return r;
      }
      if (destinos.length === 1) { r.tipo = 'codigo'; r.destino = destinos[0]; return r; }
      if (tel.length) { r.tipo = 'telefono'; r.personas = tel; return r; }
      /* ni código ni teléfono: que siga como texto, por si el número está
         escrito dentro de una nota */
    }

    /* 3 · Texto. Personas primero porque con esta cartera esto es un buscador
       de gente, y dentro de personas manda dónde cae la coincidencia: quien
       EMPIEZA por lo tecleado va arriba. La métrica de la pantalla es cuántas
       búsquedas acaban en un toque, así que el orden es lo que más importa. */
    var n = D.normalizar(q);
    r.tipo = 'texto';
    r.personas = per.filter(function (p) { return D.normalizar(p.nombre).indexOf(n) >= 0; })
      .sort(function (a, b) {
        var ia = D.normalizar(a.nombre).indexOf(n), ib = D.normalizar(b.nombre).indexOf(n);
        return ia !== ib ? ia - ib : String(a.nombre).localeCompare(String(b.nombre), 'es');
      });
    r.operaciones = ops.filter(function (o) {
      return D.normalizar(o.cliente).indexOf(n) >= 0 ||
             D.normalizar(o.codigo).indexOf(n) >= 0 ||
             D.normalizar(o.entidad).indexOf(n) >= 0;
    });

    /* Dentro de las notas, sí: es donde está lo que se dijo de verdad
       (respuesta 1 del mock). Y se enseña la FRASE, no solo el nombre —
       buscar «Sabadell» tiene que devolver la llamada. */
    var seg = [], mapa = D.mapaPersonas();
    try { seg = AJ.seguimientos.listar({}) || []; } catch (e) {}
    r.notas = seg.filter(function (s) { return D.normalizar(s.texto).indexOf(n) >= 0; })
      .sort(function (a, b) { return String(b.fecha || '').localeCompare(String(a.fecha || '')); })
      .slice(0, 8)
      .map(function (s) {
        return { id: s.id, tipo: s.tipo || 'nota', fecha: s.fecha, hora: (s.hora || '').slice(0, 5),
                 texto: s.texto || '', quien: mapa[s.personaId] || '', personaId: s.personaId || null,
                 estado: s.estado || 'realizada' };
      });

    if (!r.personas.length && !r.operaciones.length && !r.notas.length) {
      r.tipo = 'nada';
      r.sugerencias = porPalabras(n, per);
    }
    return r;
  };

  /* Campo vacío: lo último que tocaste, y nada más. Ni accesos ni sugerencias
     inventadas — el lanzador ya es el Inicio (respuesta 2 del mock).
     Una cita o una visita SON la cosa que tocaste; las demás son el rastro de
     haber tocado a alguien o a una operación, así que la fila es su sujeto. */
  D.recientesTocados = function (limite) {
    var seg = [];
    try { seg = (AJ.seguimientos.listar({}) || []).slice(); } catch (e) {}
    seg.sort(function (a, b) {
      return String(b.createdAt || b.fecha || '').localeCompare(String(a.createdAt || a.fecha || ''));
    });
    var mapa = D.mapaPersonas(), porOp = {}, out = [], visto = {};
    D.operaciones().forEach(function (o) { porOp[o.id] = o; if (o.codigo) porOp[o.codigo] = o; });
    var per = {};
    D.clientes().forEach(function (c) { per[c.id] = c; });

    for (var i = 0; i < seg.length && out.length < (limite || 5); i++) {
      var s = seg[i], cuando = D.haceCuanto(s.createdAt || s.fecha), fila = null, k = null;
      if (s.tipo === 'cita' || s.tipo === 'visita') {
        k = 'S:' + s.id;
        fila = { clase: 'actividad', tipo: s.tipo, id: s.id,
                 titulo: (s.tipo === 'visita' ? 'Visita' : 'Cita') + (s.texto ? ' · ' + s.texto : ''),
                 detalle: (s.estado === 'realizada' ? 'Cerrada ' + cuando
                          : s.estado === 'programada' ? 'Programada · ' + D.diaMes(s.fecha) : cuando) +
                          (mapa[s.personaId] ? ' · ' + mapa[s.personaId] : ''),
                 ir: 'agenda' };
      } else if (s.entidadOrigen === 'operacion_finances' && porOp[s.entidadId]) {
        var o = porOp[s.entidadId];
        k = 'O:' + (o.codigo || o.id);
        fila = { clase: 'operacion', id: o.codigo || o.id,
                 titulo: (o.codigo ? o.codigo + ' · ' : '') + o.cliente,
                 detalle: faseDe(o.estado) + ' · ' + cuando, ir: 'cliente:' + o.clienteId };
      } else if (s.personaId && per[s.personaId]) {
        var c = per[s.personaId], op = opsDe(c)[0];
        k = 'P:' + c.id;
        fila = { clase: 'persona', id: c.id, titulo: c.nombre,
                 detalle: (op ? faseDe(op.estado) : 'Sin operación') + ' · ' + cuando,
                 ir: 'cliente:' + c.id };
      }
      if (!fila || visto[k]) continue;
      visto[k] = 1; out.push(fila);
    }
    return out;
  };

  D.haceCuanto = function (iso) {
    if (!iso) return '';
    var t = new Date(iso).getTime();
    if (!t || isNaN(t)) return '';
    var min = Math.round((Date.now() - t) / 60000);
    if (min < 1) return 'ahora mismo';
    if (min < 60) return 'hace ' + min + ' min';
    var h = Math.round(min / 60);
    if (h < 24) return 'hace ' + h + ' h';
    var d = Math.round(h / 24);
    if (d === 1) return 'ayer';
    if (d < 7) return 'hace ' + d + ' días';
    return 'el ' + D.diaMes(String(iso).slice(0, 10));
  };

  /* ═══ 07 · MÁS · quién soy, qué puedo, y cómo está el aparato ═══════════════

     Tres bloques que se leen distintos, y ni uno de sus números viene de una
     constante: el alcance se cuenta, los megas se miden y la cola se abre.
     ─────────────────────────────────────────────────────────────────────────── */

  /* ── mi clave de agente ────────────────────────────────────────────────────
     En el almacén local las personas guardan `agenteCaptacionId` en formato
     legado, no el uuid: `construirCtx` de aj-sync escribe 'admin' para el admin
     de las dos sociedades y el nombre en minúsculas para el resto. Para saber
     cuáles llevo yo hay que traducir mi sesión a esa misma clave, o el contador
     saldría a cero y parecería que no llevo a nadie. */
  D.miClaveAgente = function () {
    var yo = D.yo();
    if (!yo.haySesion) return null;
    var fila = null;
    try {
      fila = (JSON.parse(localStorage.getItem(LS_YO) || '[]') || []).filter(function (u) {
        return u.id === yo.id;
      })[0] || null;
    } catch (e) {}
    if (!fila) return null;
    return (fila.rol === 'admin' && fila.sociedad_principal === 'ambas')
      ? 'admin' : String(fila.nombre || '').toLowerCase();
  };

  /* El agente de una persona viene escrito de tres formas distintas según de
     dónde bajó la fila: el uuid, la clave que fabrica `construirCtx` —el nombre
     entero en minúsculas, «camilo restrepo»— y las claves legadas cortas del
     localStorage de antes, «camilo» o «camilo_2». Comparar solo con una dejaba
     a Camilo sin ninguna persona suya y le pintaba la ficha de «no la llevas tú»
     encima de sus propios clientes. */
  function esMia(p, clave, uuid) {
    var a = p.agenteCaptacionId || p.agentId || null;
    if (!a) return false;
    a = String(a).toLowerCase();
    if (uuid && a === String(uuid).toLowerCase()) return true;
    if (!clave) return false;
    if (a === clave) return true;
    var primero = clave.split(' ')[0];
    return a === primero || a.indexOf(primero + '_') === 0;
  }
  D.mismaClave = function (valorAgente, clave, uuid) {
    return esMia({ agenteCaptacionId: valorAgente }, clave, uuid);
  };

  /* Qué veo y qué llevo. Los tres números salen del mismo sitio y por eso
     cuadran entre ellos: `visibles` es el almacén local, que desde la tanda 1
     de permisos ya viene filtrado por el servidor. A un agente no le baja lo
     que no es suyo, así que sus «visibles» y sus «mías» coinciden — y eso es un
     hecho medido, no una regla escrita aquí. */
  D.alcanceUsuario = function () {
    var per = D.clientes(), yo = D.yo(), clave = D.miClaveAgente();
    var mias = per.filter(function (p) { return esMia(p, clave, yo.id); }).length;
    var sinAgente = per.filter(function (p) { return !(p.agenteCaptacionId || p.agentId); });
    return {
      mias: mias, visibles: per.length,
      sinAgente: sinAgente.length, sinAgenteNombres: sinAgente.slice(0, 5).map(function (p) { return p.nombre; }),
      esAdmin: yo.rol === 'admin', rol: yo.rol
    };
  };

  /* ── los medios capturados ─────────────────────────────────────────────────
     Hasta hoy la cola apuntaba el NOMBRE y el TAMAÑO de cada foto y dejaba
     morir el fichero: el `File` del input se perdía en cuanto el navegador
     recogía basura. La tira decía «guardada» y no había nada guardado, que es
     justo lo que esta app no puede hacer (regla 3: nada miente sobre lo que ha
     pasado). Y se veía en cuanto se dibujaba la pantalla de la cola, que existe
     precisamente para contar la verdad de lo que espera.

     localStorage no admite binario, así que van a IndexedDB. Aquí no se suben:
     subirlas necesita Storage y una tabla de documentos que todavía no están
     enchufadas en la app. Lo que se arregla hoy es que NO SE PIERDAN. */
  var IDB_NOMBRE = 'aj-app', IDB_ALMACEN = 'medios', _idb = null;

  function abrirIDB() {
    if (_idb) return Promise.resolve(_idb);
    return new Promise(function (ok, mal) {
      if (!window.indexedDB) return mal(new Error('sin IndexedDB'));
      var r = indexedDB.open(IDB_NOMBRE, 1);
      r.onupgradeneeded = function () {
        if (!r.result.objectStoreNames.contains(IDB_ALMACEN)) r.result.createObjectStore(IDB_ALMACEN, { keyPath: 'k' });
      };
      r.onsuccess = function () { _idb = r.result; ok(_idb); };
      r.onerror = function () { mal(r.error); };
    });
  }
  function conAlmacen(modo, fn) {
    return abrirIDB().then(function (db) {
      return new Promise(function (ok, mal) {
        var tx = db.transaction(IDB_ALMACEN, modo), st = tx.objectStore(IDB_ALMACEN), res;
        res = fn(st);
        tx.oncomplete = function () { ok(res && res.result !== undefined ? res.result : res); };
        tx.onerror = function () { mal(tx.error); };
      });
    });
  }

  D.medios = {
    /* el fichero de verdad, con su clave, para que la cola no mienta */
    guardar: function (k, fichero, extra) {
      extra = extra || {};
      return conAlmacen('readwrite', function (st) {
        return st.put({ k: k, nombre: extra.nombre || fichero.name || '', tipo: fichero.type,
                        bytes: fichero.size, at: Date.now(), datos: fichero,
                        /* `ref` ata el fichero a su propiedad; `reducida` separa
                           la copia de 1.600 px de la original */
                        ref: extra.ref || null, reducida: !!extra.reducida, de: extra.de || null });
      }).catch(function (e) { console.warn('[app] el medio no se ha podido guardar:', e.message); return null; });
    },
    listar: function () {
      return conAlmacen('readonly', function (st) { return st.getAll(); })
        .catch(function (e) { console.warn('[app] medios:', e.message); return []; });
    },
    borrar: function (k) {
      return conAlmacen('readwrite', function (st) { return st.delete(k); })
        .catch(function () { return null; });
    },
    vaciar: function () {
      return conAlmacen('readwrite', function (st) { return st.clear(); })
        .catch(function () { return null; });
    }
  };

  /* ── el aparato ────────────────────────────────────────────────────────────
     Los megas se MIDEN. El mock dice 18 MB y 21,8 MB; el número de verdad
     depende de lo que haya, así que se suma lo que ocupa cada cosa. */
  D.bytesAlmacen = function () {
    var n = 0;
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        n += (k.length + (localStorage.getItem(k) || '').length) * 2;   // UTF-16
      }
    } catch (e) {}
    return n;
  };

  D.instalada = function () {
    try {
      return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
             navigator.standalone === true;
    } catch (e) { return false; }
  };

  /* La última vez que esta app habló con el servidor. No existía en ningún
     sitio —ni aj-sync ni aj-remote la guardaban— así que la app se la apunta
     cuando una lectura remota sale bien. Sin apunte se dice que no se sabe, y
     no un «hace un momento» de adorno. */
  var LS_SYNC = 'aj_app_ultima_sync_v1';
  D.marcarSync = function () { try { localStorage.setItem(LS_SYNC, String(Date.now())); } catch (e) {} };
  D.ultimaSync = function () {
    try { var v = +localStorage.getItem(LS_SYNC); return v || null; } catch (e) { return null; }
  };

  /* Todo lo que espera para subir, de las DOS colas que hay:
     · la del runtime (`AJ.remote`), que son escrituras ya hechas esperando red
     · la de la app (`aj_app_cola_v1`), que es lo capturado en la calle
     Se enseñan juntas porque para quien mira son la misma cosa: trabajo suyo
     que todavía no está en el CRM. */
  D.porSubir = function () {
    var out = [];
    try {
      (JSON.parse(localStorage.getItem('aj_app_cola_v1') || '[]') || []).forEach(function (x) {
        out.push({ k: x.k || null, que: x.que, nombre: x.nombre || '', ref: x.ref || x.id || '',
                   bytes: x.bytes || 0, at: x.at || 0, origen: 'app' });
      });
    } catch (e) {}
    try {
      (AJ.remote.pendientesDetalle() || []).forEach(function (x) {
        out.push({ k: null, que: 'cambio', nombre: x.tabla, ref: '', bytes: 0,
                   at: x.desde || 0, intentos: x.intentos || 0, origen: 'runtime' });
      });
    } catch (e) {}
    return out.sort(function (a, b) { return b.at - a.at; });
  };

  /* ── los cuatro ajustes, y ni uno más ──────────────────────────────────────
     La regla del brief: si un ajuste no cambia nada que importe en la calle, no
     está. Quedan dos que se guardan (preguntar al colgar · orden de Capturar);
     el modo oscuro sigue al sistema y no gasta interruptor, y la ayuda no es
     una pantalla. */
  var LS_AJU = 'aj_app_ajustes_v1';
  D.ajustes = function () {
    var a = {};
    try { a = JSON.parse(localStorage.getItem(LS_AJU) || '{}') || {}; } catch (e) {}
    return { preguntarAlColgar: a.preguntarAlColgar !== false, ordenPuertas: a.ordenPuertas || null };
  };
  D.guardarAjuste = function (clave, valor) {
    var a = D.ajustes(); a[clave] = valor;
    try { localStorage.setItem(LS_AJU, JSON.stringify(a)); } catch (e) {}
    return a;
  };

  /* Euros sin decimales, que es como se dicen en voz alta dentro de un piso:
     «ochenta mil veinticinco». Los céntimos aquí solo estorban. */
  D.euros = function (n, conSigno) {
    n = Math.round(nm(n));
    var s = String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return (n < 0 ? '−' : (conSigno && n > 0 ? '+' : '')) + s + ' €';
  };
  /* Los decimales de un porcentaje financiero NO se recortan: «2,5 %» y
     «80 %» se leen como aproximaciones, y un tipo de interés no lo es. Un
     LTV es «80,0 %» y un TIN es «2,50 %». */
  D.pct = function (n, dec) {
    if (n == null) return '—';
    return nm(n).toFixed(dec == null ? 1 : dec).replace('.', ',') + ' %';
  };

  D.megas = function (bytes) {
    if (!bytes) return '0 KB';
    if (bytes < 1024 * 900) return Math.round(bytes / 1024) + ' KB';
    return (Math.round(bytes / 1048576 * 10) / 10).toString().replace('.', ',') + ' MB';
  };

  /* ═══ 08 · CUADRE · los números que se hacen dentro del piso ════════════════

     El cuadre tiene 36 campos y casi todos son RESULTADO: se tocan cuatro o
     cinco y el resto se recalcula. Aquí está el cálculo; la vista solo pinta.

     Las fórmulas NO se reinventan: son las de `AJ.finanzas`, que es el motor
     con tests que usan los simuladores y la Ficha 360. Lo que sí se hace aquí
     es componerlas bien —en particular la cuota del tramo variable, que sale
     del saldo pendiente y no del principal entero (ver abajo)—.
     ─────────────────────────────────────────────────────────────────────────── */

  /* Los 13 del bloque `gastos` no son 13 gastos. Son CUATRO costes, DOS
     momentos de la entrada y SIETE parámetros, mezclados en el mismo saco.
     En una pantalla grande se disimula; en 390 px hay que separarlos de raíz,
     que es lo que hace la pantalla: «lo que muevo» arriba, «lo que sale» abajo. */
  var CQ_COSTES     = ['notaria', 'tasacion', 'honorarios', 'seguro_vida'];
  var CQ_ENTRADA    = ['arras', 'aportacion_firma'];
  var CQ_PARAMETROS = ['tin_fijo', 'plazo_fijo', 'euribor', 'diferencial', 'plazo_total',
                       'ingresos', 'prestamos'];
  D.CQ_BLOQUES = { costes: CQ_COSTES, entrada: CQ_ENTRADA, parametros: CQ_PARAMETROS };

  var LS_CQ = 'aj_app_cuadres_v1';

  D.refrescarCuadres = function () {
    if (!D.yo().haySesion || !window.AJ || !AJ.remote) return Promise.resolve(null);
    return AJ.remote.listar('cuadres',
        'select=*&deleted_at=is.null&order=updated_at.desc&limit=200')
      .then(function (r) {
        if (!Array.isArray(r)) return null;
        try { localStorage.setItem(LS_CQ, JSON.stringify({ at: Date.now(), filas: r })); } catch (e) {}
        D.marcarSync();
        return r;
      })
      .catch(function (e) { console.warn('[app] cuadres:', e.message); return null; });
  };

  /* Guardar la edición de titulares (reparto % + tipo de ITP) de un cuadre.
     A diferencia de tocar la hipoteca —que es simulación de sesión, «qué pasaría
     si», y no se persiste—, el reparto y el ITP son DATOS REALES del cliente: se
     corrigen y se guardan. Escribe el fila local (para que la app lo refleje sin
     esperar red) y empuja a Supabase; sin cobertura queda local y sube luego. */
  D.guardarTitularesCuadre = function (cuadreId, titulares) {
    /* titulares: [{nombre, compra_pct, itp_pct}] en el formato crudo del fila */
    var caja = null;
    try { caja = JSON.parse(localStorage.getItem(LS_CQ) || 'null'); } catch (e) {}
    if (caja && caja.filas) {
      for (var i = 0; i < caja.filas.length; i++) {
        if (caja.filas[i] && caja.filas[i].id === cuadreId) {
          caja.filas[i].titulares = titulares;
          caja.filas[i].updated_at = new Date().toISOString();
          break;
        }
      }
      try { localStorage.setItem(LS_CQ, JSON.stringify(caja)); } catch (e) {}
    }
    if (cuadreId && window.AJ && AJ.remote && AJ.remote.actualizar) {
      try { AJ.remote.actualizar('cuadres', 'id=eq.' + cuadreId, { titulares: titulares }); } catch (e) {}
    }
    return true;
  };

  function cqFilas() {
    try {
      var c = JSON.parse(localStorage.getItem(LS_CQ) || 'null');
      return (c && c.filas) || [];
    } catch (e) { return []; }
  }

  /* De la fila de Supabase (céntimos + jsonb) al modelo de la hoja (euros).
     Mismos nombres que usa la Ficha 360, para que quien salte de una a otra
     reconozca los campos. */
  D.cuadreDesdeFila = function (c) {
    c = c || {};
    var g = (c.gastos || []).reduce(function (a, x) { a[x.clave] = x.importe_cents / 100; return a; }, {});
    return {
      id: c.id || null, codigo: c.codigo || null, personaUuid: c.persona_id || null,
      nombre: c.nombre || null, entidad: c.entidad || null,
      tipo: c.tipo || 'compra', vigente: !!c.vigente, idioma: c.idioma || 'es',
      pvp: c.pvp_cents ? c.pvp_cents / 100 : 0,
      hipoteca: c.hipoteca_cents ? c.hipoteca_cents / 100 : 0,
      capitalDisponible: c.capital_disponible_cents ? c.capital_disponible_cents / 100 : 0,
      arras: g.arras || 0, aportacionFirma: g.aportacion_firma || 0,
      notaria: g.notaria != null ? g.notaria : 0, tasacion: g.tasacion != null ? g.tasacion : 0,
      honorarios: g.honorarios != null ? g.honorarios : 0, seguroVida: g.seguro_vida != null ? g.seguro_vida : 0,
      tinFijo: g.tin_fijo || 0, plazoFijo: g.plazo_fijo || 0,
      euribor: g.euribor || 0, diferencial: g.diferencial || 0,
      plazoTotal: g.plazo_total || 30,
      ingresos: g.ingresos || 0, prestamos: g.prestamos || 0,
      /* Una subrogación necesita saber qué paga HOY, y el esquema no tiene
         columna para eso. Va en el propio jsonb `gastos`, que la migración
         define como «parte flexible»: no hace falta migración, y la Ficha 360
         ignora las claves que no conoce sin romperse. */
      cuotaActual: g.cuota_actual || 0,
      titulares: (c.titulares || []).map(function (t) {
        return { nombre: t.nombre, compra: t.compra_pct, itp: t.itp_pct };
      }),
      gastosExtra: (c.gastos_extra || []).map(function (x) {
        return { concepto: x.concepto, importe: x.importe_cents / 100 };
      }),
      /* `manual` se lee y se escribe como {campo: valor}, igual que la Ficha
         360: cambiar la forma aquí pintaría «[object Object]» allí. Por eso el
         mock dice «lo puso Jonatan hoy» y la app solo dice «Calculado X €»:
         el modelo no guarda quién ni cuándo por campo. */
      ov: c.manual || {}
    };
  };

  D.cuadresDe = function (personaUuid) {
    return cqFilas().filter(function (f) { return f.persona_id === personaUuid; })
      .map(D.cuadreDesdeFila);
  };
  D.cuadre = function (id) {
    var f = cqFilas().filter(function (x) { return x.id === id; })[0];
    return f ? D.cuadreDesdeFila(f) : null;
  };

  function nm(v) { v = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(v) ? v : 0; }

  /* Saldo que queda tras `meses` pagos, sistema francés. Es lo que hace que la
     cuota del tramo variable sea la de verdad: a los diez años no se debe el
     principal entero, se deben 158.077 de los 212.000. Amortizar el principal
     entero a veinte años da una cuota que no es la suya en ningún tramo. */
  function saldoTras(capital, tinPct, plazoAnios, meses) {
    var i = nm(tinPct) / 100 / 12, N = Math.round(nm(plazoAnios) * 12), m = Math.round(meses);
    if (!capital || !N || m <= 0) return capital;
    if (m >= N) return 0;
    if (i <= 0) return capital * (1 - m / N);
    var f = Math.pow(1 + i, m);
    var cuota = capital * i / (1 - Math.pow(1 + i, -N));
    return Math.max(0, capital * f - cuota * (f - 1) / i);
  }
  D.saldoTras = saldoTras;

  function cuota(capital, tinPct, plazoAnios) {
    if (!capital || !plazoAnios || !tinPct) return 0;
    try {
      if (window.AJ && AJ.finanzas) return Math.round(AJ.finanzas.cuotaMensual(Math.round(capital * 100), tinPct, plazoAnios) / 100);
    } catch (e) {}
    var i = nm(tinPct) / 100 / 12, N = Math.round(nm(plazoAnios) * 12);
    return Math.round(capital * i / (1 - Math.pow(1 + i, -N)));
  }
  D.cuotaMensual = cuota;

  /* El cálculo entero. Todo lo que la pantalla enseña sale de aquí, y lo que
     está en `ov` (puesto a mano) gana al cálculo — que es lo que significa
     `manual{}` en el modelo. */
  D.calcularCuadre = function (c) {
    if (!c) return null;
    var v = function (k) { return c.ov && c.ov[k] != null ? nm(c.ov[k]) : nm(c[k]); };
    var esSubro = c.tipo === 'subrogacion';

    if (esSubro) {
      /* Sin entrada, sin ITP y sin gastos de compra: no se compra nada. Cambia
         la pregunta —de «cuánto pones» a «cuánto te ahorras»— y con ella la
         cifra protagonista. El esqueleto es el mismo. */
      var pend = v('hipoteca'), anios = v('plazoTotal'), tin = v('tinFijo');
      var nueva = c.ov && c.ov.cuotaFija != null ? nm(c.ov.cuotaFija) : cuota(pend, tin, anios);
      var hoy = v('cuotaActual');
      var ahorroMes = hoy && nueva ? hoy - nueva : 0;
      var ahorroVida = Math.round(ahorroMes * Math.round(anios * 12));
      var coste = v('honorarios') + v('notaria') + v('tasacion') + v('seguroVida') +
                  (c.gastosExtra || []).reduce(function (a, g) { return a + nm(g.importe); }, 0);
      var conceptos = [['honorarios','Honorarios AJ'],['notaria','Notaría y registro'],
                       ['tasacion','Tasación'],['seguroVida','Seguro de vida']]
        .filter(function (k) { return v(k[0]); }).length + (c.gastosExtra || []).length;
      return {
        subrogacion: true,
        pendiente: pend, anios: anios, tin: tin,
        cuotaHoy: hoy, cuotaNueva: nueva,
        ahorroMes: ahorroMes, ahorroVida: ahorroVida,
        costeCambio: coste, costeConceptos: conceptos,
        ahorroNeto: ahorroVida - coste,
        mesesRecupera: ahorroMes > 0 ? Math.ceil(coste / ahorroMes) : null,
        end: v('ingresos') && nueva ? Math.round((nueva + v('prestamos')) / v('ingresos') * 1000) / 10 : null,
        manuales: Object.keys(c.ov || {})
      };
    }

    var pvp = v('pvp'), hip = v('hipoteca');
    /* ITP efectivo: la suma ponderada del tipo de cada titular por su parte de
       compra. Por eso el impuesto no se puede calcular con un porcentaje único
       —una pareja al 50/50 puede tener el general y el reducido— y por eso los
       titulares tienen que estar en la pantalla. */
    var tits = c.titulares || [];
    var itpEf = tits.reduce(function (a, t) { return a + nm(t.compra) / 100 * nm(t.itp); }, 0);
    var itp = c.ov && c.ov.itp != null ? nm(c.ov.itp) : Math.round(pvp * itpEf / 100);
    var extras = (c.gastosExtra || []).reduce(function (a, g) { return a + nm(g.importe); }, 0);
    var gastosCierre = v('notaria') + v('tasacion') + v('honorarios') + v('seguroVida') + extras;
    var entrada = Math.max(0, pvp - hip);

    /* LA CIFRA PROTAGONISTA · entrada + impuesto + gastos de cierre.
       OJO: NO es lo mismo que `aportacion_total_cents` de la Ficha 360, que
       resta las arras y la aportación en firma y contesta «cuánto queda por
       poner». Aquí se contesta la pregunta del piso —«¿cuánto dinero tengo que
       tener yo?»— y para eso la entrada cuenta entera, la haya pagado ya o no.
       Divergencia anotada en el brief (§13 · C6): las dos cifras son legítimas
       y tienen el mismo nombre en sitios distintos, y eso hay que cerrarlo. */
    var aportacion = entrada + itp + gastosCierre;
    var tiene = v('capitalDisponible');
    var hueco = tiene ? aportacion - tiene : null;

    var plazoT = v('plazoTotal') || 30, plazoF = v('plazoFijo') || 0;
    var tinF = v('tinFijo'), tinV = v('euribor') + v('diferencial');
    var cuotaF = c.ov && c.ov.cuotaFija != null ? nm(c.ov.cuotaFija) : cuota(hip, tinF, plazoT);
    var cuotaV = null;
    if (c.ov && c.ov.cuotaVariable != null) cuotaV = nm(c.ov.cuotaVariable);
    else if (hip && tinV) {
      /* el tramo variable amortiza el SALDO tras los años de fijo, no el
         principal entero: es lo que separa una calculadora de una maqueta */
      var saldo = plazoF ? saldoTras(hip, tinF, plazoT, plazoF * 12) : hip;
      cuotaV = cuota(Math.round(saldo), tinV, plazoT - plazoF);
    }
    var ing = v('ingresos'), pres = v('prestamos');
    var cuotaMax = c.ov && c.ov.cuotaMax != null ? nm(c.ov.cuotaMax)
                 : (ing ? Math.round(ing * 0.35 - pres) : null);
    var ref = Math.max(cuotaF || 0, cuotaV || 0);

    return {
      subrogacion: false,
      pvp: pvp, hipoteca: hip, entrada: entrada,
      itp: itp, itpEf: itpEf, gastosCierre: gastosCierre, extras: extras,
      aportacion: aportacion, tiene: tiene, hueco: hueco,
      arras: v('arras'), aportacionFirma: v('aportacionFirma'),
      cuotaFija: cuotaF, cuotaVariable: cuotaV, cuotaMax: cuotaMax,
      tinFijo: tinF, tinVariable: tinV, plazoFijo: plazoF, plazoTotal: plazoT,
      ltv: pvp ? Math.round(hip / pvp * 1000) / 10 : null,
      end: ing && ref ? Math.round((ref + pres) / ing * 1000) / 10 : null,
      ingresos: ing || 0, prestamos: pres || 0,
      manuales: Object.keys(c.ov || {}),
      titulares: tits.map(function (t) {
        return { nombre: t.nombre, compra: nm(t.compra), itp: nm(t.itp),
                 importe: Math.round(pvp * nm(t.compra) / 100 * nm(t.itp) / 100) };
      })
    };
  };

  /* Cuánto sale con OTRO porcentaje de financiación. Es la comparación que
     sostiene la conversación del piso —«¿y si pedimos el 90?»— y por eso vive
     dentro de la hoja de tocar la hipoteca, no en una pantalla aparte. */
  D.cuadreCon = function (c, hipotecaNueva) {
    var copia = {};
    for (var k in c) if (Object.prototype.hasOwnProperty.call(c, k)) copia[k] = c[k];
    copia.hipoteca = hipotecaNueva;
    /* la hipoteca la manda el usuario: si había una cuota puesta a mano deja de
       valer, porque es de otro préstamo */
    var ov = {};
    for (var j in (c.ov || {})) if (['cuotaFija','cuotaVariable'].indexOf(j) < 0) ov[j] = c.ov[j];
    copia.ov = ov;
    return D.calcularCuadre(copia);
  };

  /* Lo mínimo para empezar en el piso: un precio. Todo lo demás son supuestos
     DECLARADOS —que se enseñan, no se esconden— con los datos de su ficha. */
  D.cuadreNuevo = function (persona, precio) {
    var ing = 0, pres = 0, cap = 0;
    var op = ((persona && persona.operaciones) || []).filter(function (o) {
      return !o.pendienteAsignacion && !o.archivado;
    })[0];
    return {
      id: null, codigo: null, personaUuid: (persona && persona.uuid) || null,
      tipo: 'compra', vigente: false, idioma: 'es',
      entidad: (op && op.entidad) || null,
      pvp: nm(precio), hipoteca: Math.round(nm(precio) * 0.8),
      capitalDisponible: cap,
      arras: 0, aportacionFirma: 0,
      notaria: 2400, tasacion: 400, honorarios: 3975, seguroVida: 375,
      tinFijo: 2.5, plazoFijo: 10, euribor: 2.15, diferencial: 0.89, plazoTotal: 30,
      ingresos: ing, prestamos: pres, cuotaActual: 0,
      titulares: [{ nombre: (persona && persona.nombre) || '', compra: 100, itp: 10 }],
      gastosExtra: [], ov: {}, esNuevo: true
    };
  };

  /* ═══ EXPEDIENTES · qué falta de verdad ═════════════════════════════════════
     `D.documentosDe` leía una caché que NO ESCRIBÍA NADIE, así que devolvía
     siempre null y toda la app decía «no se sabe». Los datos sí existen:
     `documentos` guarda `requisito_clave`, `fecha_documento` y `titular_orden`,
     y `expediente_requisitos` guarda `vigencia_meses`. Con eso «faltan 2, 1
     caducado» se calcula, que es lo que pide el Inicio de Finances.
     ─────────────────────────────────────────────────────────────────────────── */
  var LS_DOC = 'aj_app_docs_v1';

  D.refrescarDocumentos = function () {
    if (!D.yo().haySesion || !window.AJ || !AJ.remote) return Promise.resolve(null);
    return AJ.remote.listar('documentos',
        'select=persona_id,requisito_clave,fecha_documento,titular_orden,created_at' +
        '&deleted_at=is.null&requisito_clave=not.is.null&limit=1000')
      .then(function (r) {
        if (!Array.isArray(r)) return null;
        var m = {};
        r.forEach(function (d) {
          if (!d.persona_id) return;
          (m[d.persona_id] = m[d.persona_id] || []).push({
            clave: d.requisito_clave, fecha: d.fecha_documento || (d.created_at || '').slice(0, 10),
            titular: d.titular_orden || null
          });
        });
        try { localStorage.setItem(LS_DOC, JSON.stringify(m)); } catch (e) {}
        D.marcarSync();
        return m;
      })
      .catch(function (e) { console.warn('[app] documentos:', e.message); return null; });
  };

  /* Qué le falta a esta persona en su fase, y qué se le ha caducado.
     Devuelve null cuando NO SE SABE —sin copia de documentos— porque cero
     documentos conocidos no es lo mismo que cero documentos. */
  D.huecosDe = function (persona) {
    var op = ((persona && persona.operaciones) || []).filter(function (o) {
      return !o.pendienteAsignacion && !o.archivado;
    })[0];
    if (!op) return null;
    var req = D.expediente(op.estado);
    if (!req) return null;                         // sin catálogo no se inventa
    var subidos = D.documentosDe(persona.uuid || persona.id);
    if (subidos == null) return null;              // sin copia, no se sabe

    var catalogo = D.requisitos() || [];
    var porClave = {};
    catalogo.forEach(function (r) { porClave[r.clave] = r; });
    var titulares = Math.max(1, ((op.titulares || []).length) || 1);
    var hoy = new Date();

    var faltan = 0, caducados = 0, nombres = [];
    req.lista.forEach(function (r) {
      var hacenFalta = (r.cantidad || 1) * (r.porTitular ? titulares : 1);
      var mios = subidos.filter(function (d) { return d.clave === r.clave; });
      /* un documento con vigencia y fecha vieja NO cuenta como entregado: está
         ahí, pero el banco no lo acepta */
      var meses = porClave[r.clave] && porClave[r.clave].vigencia_meses;
      var vivos = mios.filter(function (d) {
        if (!meses || !d.fecha) return true;
        var f = new Date(d.fecha);
        return (hoy - f) / 2629800000 < meses;      // ~1 mes
      });
      caducados += mios.length - vivos.length;
      if (vivos.length < hacenFalta) {
        faltan += hacenFalta - vivos.length;
        if (nombres.length < 2) nombres.push(r.nombre);
      }
    });
    return { faltan: faltan, caducados: caducados, nombres: nombres, total: req.total };
  };

  /* Los expedientes que tienen huecos, para el bloque del Inicio. Solo los que
     de verdad se saben: si no hay copia de documentos no se enseña una lista
     de todos como si a todos les faltara todo. */
  D.expedientesConHuecos = function (limite) {
    var out = [];
    D.clientes().forEach(function (p) {
      var h = D.huecosDe(p);
      if (!h || (!h.faltan && !h.caducados)) return;
      out.push({
        id: p.id, nombre: p.nombre, faltan: h.faltan, caducados: h.caducados,
        que: h.nombres.join(' · '),
        texto: p.nombre + ' · ' + (h.faltan ? (h.faltan === 1 ? 'falta 1' : 'faltan ' + h.faltan) : '') +
               (h.faltan && h.caducados ? ', ' : '') +
               (h.caducados ? h.caducados + ' caducado' + (h.caducados === 1 ? '' : 's') : '')
      });
    });
    return out.sort(function (a, b) { return (b.faltan + b.caducados) - (a.faltan + a.caducados); })
              .slice(0, limite || 3);
  };

  /* «Lo que te van a preguntar»: la cuota del que va a llamar. No es un ranking
     inventado — es quien tiene operación viva y cuota sabida, por orden de
     última actividad. Si de nadie se sabe la cuota, el bloque no se dibuja:
     es la misma regla que en la ficha del cliente. */
  D.paraPreguntar = function () {
    var ultima = {};
    try {
      (AJ.seguimientos.listar({}) || []).forEach(function (s) {
        var f = (s.fecha || '').slice(0, 10);
        if (s.personaId && f && (!ultima[s.personaId] || f > ultima[s.personaId])) ultima[s.personaId] = f;
      });
    } catch (e) {}
    var cand = [];
    D.clientes().forEach(function (p) {
      var op = (p.operaciones || []).filter(function (o) {
        return !o.pendienteAsignacion && !o.archivado &&
               ['perdido', 'descartado'].indexOf(o.estado) < 0;
      })[0];
      if (!op) return;
      var cuota = D.cuotaDe(p.uuid || p.id);
      if (!cuota) return;
      cand.push({ id: p.id, nombre: p.nombre, telefono: p.telefono || '',
                  estado: op.estado, cuota: cuota, cuando: ultima[p.id] || '' });
    });
    cand.sort(function (a, b) { return String(b.cuando).localeCompare(String(a.cuando)); });
    return cand[0] || null;
  };

  /* ── el primer arranque, y cómo se distingue de estar cargando ─────────────
     Las dos pantallas se ven igual —no hay nada— y significan lo contrario. Lo
     que las separa es si esta app ha hablado alguna vez con el servidor. */
  D.arranque = function () {
    var vacio = !D.clientes().length;
    if (!vacio) return 'normal';
    if (D.yo().haySesion && !D.ultimaSync()) return 'cargando';
    return 'primero';
  };

  /* Una copia de 1.600 px del lado largo. Si el navegador no puede —sin canvas,
     sin createImageBitmap— NO se inventa: se devuelve null y la app dice que
     solo tiene la original. */
  D.reducir = function (fichero, lado) {
    lado = lado || 1600;
    return new Promise(function (ok) {
      try {
        var img = new Image(), url = URL.createObjectURL(fichero);
        img.onload = function () {
          try {
            var e = Math.min(1, lado / Math.max(img.width, img.height));
            if (e >= 1) { URL.revokeObjectURL(url); return ok(null); }   // ya es pequeña
            var c = document.createElement('canvas');
            c.width = Math.round(img.width * e); c.height = Math.round(img.height * e);
            c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
            c.toBlob(function (b) { URL.revokeObjectURL(url); ok(b || null); }, 'image/jpeg', 0.82);
          } catch (e2) { URL.revokeObjectURL(url); ok(null); }
        };
        img.onerror = function () { URL.revokeObjectURL(url); ok(null); };
        img.src = url;
      } catch (e) { ok(null); }
    });
  };

  /* La política de subida: reducidas ya con datos, u originales esperando al
     wifi. Es una decisión VISIBLE, no magia, y se guarda. */
  D.politicaFotos = function () {
    var a = D.ajustes();
    return a.fotos === 'wifi' ? 'wifi' : 'datos';
  };

  /* ═══ LA SUBIDA · lo que la app llevaba prometiendo a medias ════════════════

     Hasta hoy las fotos y los documentos se capturaban, se guardaban en el
     móvil y ahí se quedaban: tres pantallas decían «esperando a que haya dónde
     subirlos». Ya lo hay, y estaba montado desde el principio —el bucket
     privado `documentos`, `AJ.remote.subirArchivo`, la tabla con `storage_path`
     y, desde la tanda 2, sus políticas—. Lo que faltaba era usarlo.

     Dos pasos por fichero y en este orden: primero el archivo al bucket,
     después la fila en la tabla. Si el archivo falla no queda una fila que
     apunta a nada; si falla la fila, el archivo se sube encima la próxima vez
     (`x-upsert`), que es barato y no deja huérfanos visibles.
     ─────────────────────────────────────────────────────────────────────────── */

  var BUCKET = 'documentos';

  /* El nombre va dentro de la ruta del bucket, así que fuera acentos, espacios
     y todo lo que no sea seguro en una URL. */
  function limpiar(nombre) {
    var n = String(nombre || 'archivo');
    try { n = n.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch (e) {}
    n = n.replace(/[^a-zA-Z0-9._-]+/g, '-').replace(/^-+|-+$/g, '').slice(-60);
    return n || 'archivo';
  }


  /* De la fila de la cola a lo que entiende la tabla. Devuelve null cuando no
     se puede resolver a qué cuelga: subir un archivo que después nadie podrá
     encontrar es peor que dejarlo esperando. */
  function destinoDe(item) {
    var ref = String(item.ref || item.id || '');
    if (/^AJ-P-/.test(ref)) {
      var per = D.clientes().filter(function (p) { return p.id === ref; })[0];
      if (!per || !per.uuid) return null;
      return { carpeta: 'personas', uuid: per.uuid,
               fila: { entidad_origen: 'persona', entidad_id: per.uuid, persona_id: per.uuid,
                       requisito_clave: item.requisito || null,
                       /* Capturar guarda el ÍNDICE del titular (0, 1, 2) y la
                          columna guarda su ORDEN (1, 2, 3). Sin la suma, el
                          documento del primer titular se subía sin dueño —el 0
                          es falso— y el del segundo llegaba desplazado. Y esto
                          importa de verdad: 12 de los 26 requisitos son por
                          titular, así que un papel mal atribuido cuenta en el
                          expediente de quien no es. */
                       titular_orden: item.titular == null ? null
                         : Math.min(3, Math.max(1, (+item.titular || 0) + 1)),
                       categoria: item.requisito ? null : 'otro' } };
    }
    /* La subida de fotos de propiedad (AJ-IP-) se fue con Inmo: en la app de
       Finances la cola solo lleva documentos de personas. */
    return null;
  }

  function colaLeer() {
    try { return JSON.parse(localStorage.getItem('aj_app_cola_v1') || '[]') || []; } catch (e) { return []; }
  }
  function colaGuardar(c) {
    try { localStorage.setItem('aj_app_cola_v1', JSON.stringify(c)); } catch (e) {}
  }
  /* Quitar un ítem de la cola (p.ej. uno que falló al subir y se va a rehacer):
     borra su fila y su fichero de medios para no dejar huérfanos. */
  D.quitarDeCola = function (k) {
    colaGuardar(colaLeer().filter(function (x) { return x.k !== k; }));
    if (window.AJapp && D.medios) { D.medios.borrar(k); D.medios.borrar(k + '-r'); }
    return true;
  }

  /* Qué versión del fichero sube ahora mismo, según la decisión que el usuario
     dejó tomada en la pantalla de fotos. No es magia: es su elección. */
  function versionASubir(k, medios, forzarOriginal) {
    var orig = medios.filter(function (m) { return m.k === k; })[0] || null;
    var red  = medios.filter(function (m) { return m.k === k + '-r'; })[0] || null;
    if (forzarOriginal) return orig ? { m: orig, calidad: 'original' } : (red ? { m: red, calidad: 'reducida' } : null);
    if (D.politicaFotos() === 'datos' && red) return { m: red, calidad: 'reducida' };
    if (D.politicaFotos() === 'wifi' && !forzarOriginal) return null;   // espera a que se pulse
    return orig ? { m: orig, calidad: 'original' } : (red ? { m: red, calidad: 'reducida' } : null);
  }

  /* La pasada. Devuelve SIEMPRE un resumen con su motivo, para que la pantalla
     pueda decir por qué no ha subido nada en vez de quedarse callada. */
  D.subirMedios = function (opciones) {
    opciones = opciones || {};
    if (!D.yo().haySesion) return Promise.resolve({ subidos: 0, fallos: 0, motivo: 'sin sesión' });
    if (navigator.onLine === false) return Promise.resolve({ subidos: 0, fallos: 0, motivo: 'sin red' });
    if (!window.AJ || !AJ.remote) return Promise.resolve({ subidos: 0, fallos: 0, motivo: 'sin runtime' });

    return D.medios.listar().then(function (medios) {
      var cola = colaLeer();
      var conArchivo = cola.filter(function (x) { return x.que !== 'lead' && x.k; });
      if (!conArchivo.length) return { subidos: 0, fallos: 0, motivo: 'nada que subir' };

      var subidos = 0, fallos = 0, esperando = 0;
      var cadena = Promise.resolve();

      conArchivo.forEach(function (item) {
        cadena = cadena.then(function () {
          var v = versionASubir(item.k, medios || [], opciones.originales);
          if (!v || !v.m || !v.m.datos) { esperando++; return null; }
          var dest = destinoDe(item);
          if (!dest) { esperando++; return null; }

          var ruta = dest.carpeta + '/' + dest.uuid + '/' + item.k + '-' + limpiar(item.nombre);
          return AJ.remote.subirArchivo(BUCKET, ruta, v.m.datos).then(function (r) {
            if (!r || !r.ok) throw new Error((r && r.error) || 'no se pudo subir');
            var fila = {};
            for (var key in dest.fila) fila[key] = dest.fila[key];
            fila.nombre = item.nombre || 'Archivo';
            fila.storage_path = ruta;
            fila.mime = v.m.tipo || null;
            fila.tamano_bytes = v.m.bytes || null;
            fila.origen = 'subido';
            fila.estado = 'archivado';
            return AJ.remote.insertar('documentos', fila);
          }).then(function () {
            subidos++;
            /* solo se borra del móvil cuando la fila ya está: si se borrara
               antes y fallara la fila, la foto se habría perdido de verdad */
            var quitar = [item.k];
            if (v.calidad === 'original') quitar.push(item.k + '-r');
            return Promise.all(quitar.map(function (k) { return D.medios.borrar(k); }))
              .then(function () {
                var c = colaLeer().filter(function (x) { return x.k !== item.k; });
                colaGuardar(c);
              });
          }).catch(function (e) {
            fallos++;
            /* el fallo se APUNTA en su fila, que es lo que permite que la
               pantalla diga «falló · reintentar» en vez de callarse */
            var c = colaLeer();
            c.forEach(function (x) {
              if (x.k === item.k) { x.intentos = (x.intentos || 0) + 1; x.error = e.message; }
            });
            colaGuardar(c);
            console.warn('[app] no ha subido ' + item.k + ':', e.message);
            return null;
          });
        });
      });

      return cadena.then(function () {
        if (subidos) D.refrescarDocumentos();
        return { subidos: subidos, fallos: fallos, esperando: esperando,
                 motivo: subidos ? null
                       : fallos ? 'han fallado'
                       : esperando ? (D.politicaFotos() === 'wifi'
                            ? 'esperan al wifi' : 'sin poder resolver a qué cuelgan')
                       : 'nada que subir' };
      });
    }).catch(function (e) {
      console.warn('[app] la subida no ha podido arrancar:', e.message);
      return { subidos: 0, fallos: 0, motivo: e.message };
    });
  };

  /* Se intenta al arrancar y cada vez que vuelve la red. No se avisa de que se
     está subiendo si no se está subiendo: la pasada solo corre cuando hay
     sesión y hay red, y si no, devuelve el motivo. */
  D.arrancarSubida = function () {
    var pasando = false;
    function pasada() {
      if (pasando) return;
      pasando = true;
      D.subirMedios().then(function (r) {
        pasando = false;
        if (r && r.subidos) {
          try { window.dispatchEvent(new CustomEvent('aj-app-subido', { detail: r })); } catch (e) {}
        }
      });
    }
    try { window.addEventListener('online', pasada); } catch (e) {}
    setTimeout(pasada, 1500);   // deja que el arranque pinte antes
    return pasada;
  };

  /* ═══ LA SUBIDA DE EDICIONES · lo que la app hacía a medias ═════════════════

     La app bajaba datos al entrar y subía los ficheros capturados, pero NO
     subía las ediciones: cerrar una cita, crear un lead, agendar, registrar una
     visita, cambiar la ocupación. Se guardaban en el móvil y no llegaban al
     CRM. Es exactamente lo que esta app no puede hacer —dejarte creer que algo
     pasó cuando no salió del teléfono—.

     Se replica el mecanismo del CRM (_push/_dirty con debounce): tras cada
     escritura de una clave sincronizable, se programa una subida 2,5 s después
     —agrupa ráfagas de guardado— que sube personas + operaciones + seguimientos
     + resto, en orden. `AJ.store.set` es el ÚNICO camino de escritura, así que
     envolverlo una vez captura toda mutación, presente y futura.
     ─────────────────────────────────────────────────────────────────────────── */

  var _pushTimer = null, _pushRunning = false, _pushDirty = false, _bajando = false;
  /* las tablas que la subida cubre; escribir en otra clave (caché de la app,
     ajustes) no dispara nada */
  var CLAVES_SYNC = ['aj_personas', 'aj_seguimientos', 'aj_captacion', 'aj_pedidos'];

  function _emitirSync(estado, detalle) {
    try { window.dispatchEvent(new CustomEvent('aj-app-sync', { detail: { estado: estado, detalle: detalle || null } })); }
    catch (e) {}
  }

  D.programarSubida = function () {
    /* durante la bajada NO se sube: restaurar() escribe aj_personas y eso
       dispararía una subida redundante en bucle corto */
    if (_bajando) return;
    if (!D.yo().haySesion || navigator.onLine === false || !window.AJ || !AJ.sync) return;
    if (typeof setTimeout !== 'function') return;
    clearTimeout(_pushTimer);
    _pushTimer = setTimeout(_push, 2500);
  };

  function _push() {
    if (_pushRunning) { _pushDirty = true; return; }
    if (!D.yo().haySesion || navigator.onLine === false || !window.AJ || !AJ.sync) return;
    _pushRunning = true;
    _emitirSync('guardando');
    /* Cada tabla sube INDEPENDIENTE. Antes iban en cadena y un fallo en la
       primera abortaba las demás: con el bug de los triggers de aislamiento en
       `personas` (server-side, del CRM), eso impedía subir hasta los
       seguimientos —que sí funcionan—. Ahora un fallo en una no tapa a las
       otras, y se dice cuáles fallaron. El orden se mantiene (personas antes,
       porque las operaciones cuelgan de ellas) pero sin barrera dura. */
    var fallos = [];
    function paso(nombre, fn) {
      return Promise.resolve().then(fn).catch(function (e) {
        fallos.push(nombre + ': ' + e.message);
        console.warn('[app] no subió ' + nombre + ':', e.message);
      });
    }
    paso('personas', function () { return AJ.sync.subirPersonas(); })
      .then(function () { return paso('operaciones', function () { return AJ.sync.subirOperaciones(); }); })
      .then(function () { return paso('seguimientos', function () { return AJ.sync.subirSeguimientos(); }); })
      .then(function () { return paso('resto', function () { return AJ.sync.subirResto ? AJ.sync.subirResto() : null; }); })
      .then(function () {
        _emitirSync(fallos.length ? 'error' : 'guardado', fallos.join(' · ') || null);
        _pushRunning = false;
        if (_pushDirty) { _pushDirty = false; _push(); }
      });
  }

  /* La bajada, envuelta para marcar el flag y para que shell/login la llamen
     por un solo sitio. */
  D.restaurar = function () {
    if (!window.AJ || !AJ.sync || !AJ.sync.restaurar) return Promise.resolve(null);
    _bajando = true;
    return AJ.sync.restaurar().then(function (inf) { _bajando = false; return inf; })
      .catch(function (e) { _bajando = false; throw e; });
  };

  /* El hook, una sola vez: envuelve AJ.store.set para programar la subida tras
     escribir una tabla sincronizable. Y dos redes: al ocultar la app se fuerza
     la subida pendiente (no esperar al debounce si te vas), y al volver la red
     se reintenta. */
  (function engancharSubida() {
    /* Solo en un navegador de verdad. En los tests, cada archivo carga esto en
       un `vm` que comparte `global.AJ`, así que envolver `AJ.store.set` aquí se
       filtraría a otros archivos y los rompería. Sin `document` ni timers no se
       engancha nada. */
    if (typeof document === 'undefined' || typeof setTimeout !== 'function') return;
    if (!window.AJ || !AJ.store || AJ.store._appHookSubida) return;
    var origSet = AJ.store.set;
    AJ.store.set = function (k, v) {
      var r = origSet.call(AJ.store, k, v);
      if (CLAVES_SYNC.indexOf(k) >= 0) D.programarSubida();
      return r;
    };
    AJ.store._appHookSubida = true;
    try {
      document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') { clearTimeout(_pushTimer); _push(); }
      });
      window.addEventListener('online', function () { D.programarSubida(); });
    } catch (e) {}
  })();

  window.AJapp = window.AJapp || {};
  window.AJapp.datos = D;
})();
