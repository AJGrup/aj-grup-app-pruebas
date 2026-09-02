/* ═══════════════════════════════════════════════════════════════════════════
   App AJ Finances · 05 · Capturar — la única sección que crea

   Las otras cuatro enseñan lo que ya hay. Esta es la puerta de todo lo que
   entra al CRM desde la calle, y por eso decide si la app sirve para algo o
   es un visor. Tres puertas (actividad, lead, documento), y dentro la regla es
   dura: tres campos, y el tercero casi siempre opcional.

   Del mock «App Capturar.dc.html», sus ocho estados y sus cuatro respuestas:
     1 · mismo tamaño, distinto orden — el orden se aprende del oficio de cada
         uno; hacer una fila pequeña porque se usa menos la deja pareciendo rota
     2 · recientes arriba sin teclado, buscador debajo; con 62 nombres, tres
         letras bastan. Lista alfabética completa no: nadie recorre 62 con el pulgar
     3 · nota de voz sí, y es el tercer campo del lead. Conduciendo no se
         escribe. El audio se guarda tal cual: no se finge transcripción en el
         móvil, que sale mal justo con nombres y calles
     4 · vuelve donde estabas. Se captura en ráfaga; abrir lo creado la corta.
         En su lugar, tira de confirmación con «abrir» unos segundos
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var D = window.AJapp.datos, C = {};

  function H(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
    });
  }
  function ico(d, w) {
    return '<svg width="' + (w || 16) + '" height="' + (w || 16) + '" viewBox="0 0 16 16" fill="none" ' +
      'stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  }
  var IC = {
    foto:  '<rect x="2" y="4" width="12" height="9" rx="1.4"/><circle cx="8" cy="8.5" r="2.4"/><path d="M5.6 4V2.9h4.8V4"/>',
    lapiz: '<path d="M11.2 2.9a1.5 1.5 0 0 1 2.1 2.1L5.6 12.7l-2.9.8.8-2.9z"/>',
    embudo:'<path d="M2.6 3.2h10.8l-4.1 5v4.4l-2.6 1.2V8.2z"/>',
    doc:   '<path d="M9.2 2.6H5a1.2 1.2 0 0 0-1.2 1.2v8.4A1.2 1.2 0 0 0 5 13.4h6a1.2 1.2 0 0 0 1.2-1.2V5.6z"/><path d="M9.2 2.6v3h3"/><path d="M6.2 8.8h3.6M6.2 11h2.4"/>',
    flecha:'<path d="M6 3.6 10.4 8 6 12.4"/>',
    lupa:  '<circle cx="7.2" cy="7.2" r="4.2"/><path d="m13.4 13.4-3.2-3.2"/>',
    micro: '<rect x="6.1" y="2.2" width="3.8" height="7.4" rx="1.9"/><path d="M4 7.6a4 4 0 0 0 8 0M8 11.6v2.2"/>',
    check: '<path d="M13 4.8 6.4 11.4 3 8"/>'
  };

  /* ── la cola ────────────────────────────────────────────────────────────────
     Lo que se captura en la calle y todavía no ha subido. Que exista es lo que
     permite la promesa del mock: sin cobertura NADA aparece «subiendo» — todo
     dice «guardado, sube después», con su cuenta, y nada se pierde. */
  var LS_COLA = 'aj_app_cola_v1';
  function cola() {
    try { return JSON.parse(localStorage.getItem(LS_COLA) || '[]'); } catch (e) { return []; }
  }
  var _n = 0;
  function encolar(item) {
    var c = cola();
    item.at = Date.now();
    /* clave propia: es lo que ata la fila de la cola con el fichero guardado en
       IndexedDB. Sin ella la pantalla de «Más» no podría enseñar ni borrar uno
       suelto, y el fichero se quedaría huérfano al vaciar la cola. */
    item.k = 'm' + item.at + '-' + (++_n);
    c.push(item);
    try { localStorage.setItem(LS_COLA, JSON.stringify(c)); } catch (e) {}
    return c.length;
  }
  C.cola = cola;

  function hayRed() { return navigator.onLine !== false; }

  /* Recientes: con quién has hablado últimamente. Cuatro, tocables sin teclado
     — cubren el caso de pie, que es volver a la persona de la última hora. */
  function recientes() {
    var segs = [];
    try { segs = AJ.seguimientos.listar({}) || []; } catch (e) {}
    segs.sort(function (a, b) { return String(b.createdAt || '').localeCompare(String(a.createdAt || '')); });
    var vistos = {}, out = [], mapa = D.mapaPersonas();
    for (var i = 0; i < segs.length && out.length < 4; i++) {
      var pid = segs[i].personaId;
      if (!pid || vistos[pid] || !mapa[pid]) continue;
      vistos[pid] = 1; out.push({ id: pid, nombre: mapa[pid] });
    }
    return out;
  }

  /* ═══ el estado de la hoja ═══════════════════════════════════════════════ */
  var S = null;   // {paso, persona, tipo, texto, ...}

  C.abrir = function () {
    S = { paso: 'hoja' };
    pintar();
  };
  /* El acceso «Nota de voz» del Inicio: es el tercer campo del lead, así que
     abre el lead y arranca la grabación — no hay pantalla de voz aparte. */
  C.aVoz = function () {
    S.paso = 'lead'; pintar();
    setTimeout(grabarVoz, 80);
  };
  /* Buscar entra por aquí cuando no encuentra a nadie: lo tecleado ES el lead,
     así que la hoja abre por su puerta con el nombre ya puesto y solo falta el
     teléfono. Misma salida que el «no está · crear lead» de esta sección. */
  C.aLead = function (nombre) {
    S.paso = 'lead'; S.nombrePrevio = nombre || '';
    pintar();
    var n = document.getElementById('cap-nom');
    if (n && S.nombrePrevio) n.value = S.nombrePrevio;
  };
  function cerrar() { S = null; var e = document.getElementById('hoja-capturar'); if (e) e.remove(); }
  C.cerrar = cerrar;

  /* ── 01 · la hoja de las tres ───────────────────────────────────────────────
     Tres filas de 72 px, todas del mismo tamaño porque las tres son puertas y
     no un ranking. La «foto de propiedad» era de Inmo y se fue con la separación.
     El orden puede tocarse desde «Más». */
  var PUERTAS = {
    act:   ['lapiz', 'Actividad',         'Llamada, nota o WhatsApp de alguien'],
    lead:  ['embudo','Lead nuevo',        'Nombre y teléfono · entra en «nuevo»'],
    doc:   ['doc',   'Documento',         'Con la cámara, atado a su requisito']
  };
  function ordenPuertas() {
    var guardado = D.ajustes ? D.ajustes().ordenPuertas : null;
    if (guardado && guardado.length === 3) return guardado;
    return ['doc', 'act', 'lead'];
  }

  function vistaHoja() {
    var yo = D.yo();
    return '<div style="width:38px;height:4px;border-radius:2px;background:var(--borde);margin:0 auto 14px"></div>' +
      '<div style="display:flex;align-items:baseline;gap:10px">' +
        '<div class="serif" style="font-size:19px;font-weight:500;line-height:1.25">Capturar</div>' +
        '<span style="font-size:12px;color:var(--suave)">tu orden · ' + H(yo.nombre) + '</span></div>' +
      '<div style="display:flex;flex-direction:column;gap:8px;margin-top:15px">' +
      ordenPuertas().map(function (k) {
        var p = PUERTAS[k];
        return '<button data-cap="' + k + '" style="height:72px;border:1px solid var(--borde);border-radius:11px;' +
          'background:#fff;display:flex;align-items:center;gap:13px;padding:0 14px;text-align:left;width:100%">' +
          '<span style="width:42px;height:42px;border-radius:50%;background:#eef3fa;color:var(--accion);display:flex;' +
          'align-items:center;justify-content:center;flex-shrink:0">' + ico(IC[p[0]], 20) + '</span>' +
          '<span style="flex:1"><span style="display:block;font-size:15px;font-weight:500">' + H(p[1]) + '</span>' +
          '<span style="display:block;font-size:12.5px;color:var(--suave);margin-top:2px">' + H(p[2]) + '</span></span>' +
          '<span style="color:rgba(22,33,62,.35);flex-shrink:0">' + ico(IC.flecha) + '</span></button>';
      }).join('') + '</div>' +
      '<div style="font-size:12px;line-height:1.5;color:var(--suave);margin-top:13px">' +
      'Cada una cabe en tres campos. Lo que pide más se queda en la mesa.</div>';
  }

  /* ── 02+03 · lead nuevo ─────────────────────────────────────────────────────
     El teléfono no es un campo entre otros: 20 de las 62 personas del CRM no
     tienen número, y un lead sin teléfono nace muerto. Ocupa el sitio y el
     tamaño que le corresponde. El estado no se elige: nace en «nuevo». */
  function vistaLead() {
    var sinRed = !hayRed(), n = cola().length;
    return '<div style="width:38px;height:4px;border-radius:2px;background:var(--borde);margin:0 auto 14px"></div>' +
      '<div class="serif" style="font-size:19px;font-weight:500;line-height:1.25">Lead nuevo</div>' +
      '<div style="font-size:13px;color:var(--suave);margin-top:3px">Entra en «nuevo». Lo demás se rellena en la mesa.</div>' +

      '<div style="margin-top:15px"><div class="eyebrow">Nombre</div>' +
      '<input id="cap-nom" autocomplete="off" placeholder="Nombre y apellidos" style="width:100%;height:52px;padding:0 12px;' +
      'border:1px solid var(--borde);border-radius:8px;font-size:14.5px;font-family:inherit;color:var(--tinta);margin-top:9px"></div>' +

      '<div style="margin-top:14px">' +
      '<div class="eyebrow" style="color:var(--accion)">Teléfono · lo que hace que sirva</div>' +
      '<input id="cap-tel" type="tel" inputmode="tel" autocomplete="off" placeholder="600 00 00 00" ' +
      'style="width:100%;height:60px;padding:0 14px;border:1px solid var(--accion);border-radius:8px;' +
      'box-shadow:0 0 0 3px rgba(0,102,177,.12);font-family:var(--mono);font-size:19px;color:var(--tinta);margin-top:9px">' +
      '<div style="font-size:12px;line-height:1.5;color:var(--suave);margin-top:8px">' +
      '20 de las 62 personas del CRM no tienen número. Sin teléfono se puede guardar, pero nace muerto.</div></div>' +

      '<div style="margin-top:14px"><div class="eyebrow">De qué va · opcional</div>' +
      '<div style="display:flex;gap:8px;margin-top:9px">' +
      '<button data-cap="lead-texto" style="flex:1;height:48px;border:1px solid var(--borde);border-radius:8px;background:#fff;' +
      'font-size:13.5px;font-weight:500;color:rgba(22,33,62,.75)">Escribir</button>' +
      '<button data-cap="lead-voz" style="flex:1;height:48px;border:1px solid var(--borde);border-radius:8px;background:#fff;' +
      'color:rgba(22,33,62,.75);font-size:13.5px;font-weight:500;display:inline-flex;align-items:center;justify-content:center;gap:8px">' +
      ico(IC.micro, 18) + 'Nota de voz</button></div>' +
      '<div id="cap-extra"></div></div>' +

      (sinRed
        ? '<div style="margin-top:14px;background:#fff;border:1px solid var(--borde);border-left:3px solid var(--aviso);' +
          'border-radius:8px;overflow:hidden">' +
          '<div style="padding:12px 14px;font-size:13px;line-height:1.6;color:rgba(22,33,62,.7)">' +
          'Sin red no se comprueba si ya existe con ese número. Se guarda igual y el duplicado, si lo hay, ' +
          'se resuelve al subir.</div>' +
          (n ? '<div style="display:flex;align-items:center;gap:11px;padding:11px 14px;border-top:1px solid var(--sep);background:#f9fafd">' +
            '<span style="width:26px;height:26px;border-radius:8px;background:rgba(184,134,43,.1);color:var(--aviso);' +
            'display:flex;align-items:center;justify-content:center;flex-shrink:0">' + ico(IC.embudo, 14) + '</span>' +
            '<div style="flex:1;font-size:13px">' + n + ' cosa' + (n === 1 ? '' : 's') + ' esperando para subir' +
            '<div style="font-size:12px;color:var(--suave);margin-top:1px">Nada se ha perdido</div></div></div>' : '') +
          '</div>' : '') +

      (sinRed ? '<div style="font-size:12px;line-height:1.5;color:var(--suave);margin-top:12px">' +
        'Nada aparece «subiendo» mientras el chip diga sin conexión.</div>' : '') +

      /* El botón se ancla al fondo (sticky) para que el teclado no lo empuje
         fuera de la vista: la hoja auto-enfoca el nombre y el teclado sale de
         golpe; sin anclar, «Guardar» quedaba debajo del pliegue y había que
         buscarlo con scroll. El fondo blanco tapa el contenido que pasa detrás. */
      '<div style="position:sticky;bottom:0;background:#fff;padding-top:12px;margin-top:12px">' +
      '<button data-cap="lead-guardar" style="width:100%;height:48px;border:none;border-radius:8px;' +
      'background:var(--accion);color:#fff;font-size:15px;font-weight:500">' +
      (sinRed ? 'Guardar y subir cuando haya red' : 'Guardar lead') + '</button></div>';
  }

  /* ── 04 · actividad desde aquí ──────────────────────────────────────────────
     La hoja es la de la Agenda. Lo único nuevo es el paso de «con quién»:
     desde Capturar no hay cliente elegido todavía, así que va primero. */
  var TIPOS = [['llamada', 'Llamada'], ['nota', 'Nota'], ['whatsapp', 'WhatsApp']];
  var RAPIDAS = ['Le paso la oferta', 'No contesta', 'Pide precio'];

  function vistaActividad() {
    var p = S.persona;
    return '<div style="width:38px;height:4px;border-radius:2px;background:var(--borde);margin:0 auto 14px"></div>' +
      '<div class="serif" style="font-size:19px;font-weight:500;line-height:1.25">Registrar actividad</div>' +

      '<div style="margin-top:15px"><div class="eyebrow">Con quién</div>' +
      '<button data-cap="elegir-persona" style="width:100%;height:56px;padding:0 14px;border:1px solid var(--borde);' +
      'border-radius:8px;background:#fff;display:flex;align-items:center;gap:12px;text-align:left;margin-top:9px">' +
      (p ? '<span style="flex:1"><span style="display:block;font-size:14.5px">' + H(p.nombre) + '</span>' +
            '<span style="display:block;font-family:var(--mono);font-size:12px;color:var(--suave);margin-top:2px">' + H(p.id) + '</span></span>' +
            '<span style="font-size:13px;font-weight:500;color:var(--accion);flex-shrink:0">Cambiar</span>'
         : '<span style="flex:1;font-size:14.5px;color:var(--suave)">Elegir persona</span>' +
           '<span style="color:rgba(22,33,62,.35)">' + ico(IC.flecha) + '</span>') +
      '</button></div>' +

      '<div style="margin-top:14px"><div class="eyebrow">De qué tipo</div>' +
      '<div style="display:flex;gap:8px;margin-top:9px">' + TIPOS.map(function (t) {
        var on = (S.tipo || 'llamada') === t[0];
        return '<button data-cap="tipo:' + t[0] + '" style="flex:1;height:48px;border:1px solid ' +
          (on ? 'var(--accion)' : 'var(--borde)') + ';border-radius:8px;background:' +
          (on ? 'rgba(0,102,177,.08)' : '#fff') + ';color:' + (on ? 'var(--accion)' : 'rgba(22,33,62,.7)') +
          ';font-size:13.5px;font-weight:500">' + t[1] + '</button>';
      }).join('') + '</div></div>' +

      '<div style="margin-top:14px"><div class="eyebrow">Respuestas rápidas</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:9px">' + RAPIDAS.map(function (r) {
        return '<button data-cap="rapida:' + H(r) + '" style="height:48px;padding:0 14px;border:1px solid var(--borde);' +
          'border-radius:8px;background:#fff;color:rgba(22,33,62,.7);font-size:13.5px;font-weight:500">' + H(r) + '</button>';
      }).join('') + '</div></div>' +

      '<div style="margin-top:14px"><div class="eyebrow">La nota</div>' +
      '<textarea id="cap-txt" rows="2" placeholder="Qué ha pasado" style="width:100%;border:1px solid var(--borde);' +
      'border-radius:8px;padding:11px 12px;font-family:inherit;font-size:14px;color:var(--tinta);resize:none;margin-top:9px">' +
      H(S.texto || '') + '</textarea></div>' +

      '<button data-cap="act-guardar" style="width:100%;height:48px;margin-top:14px;border:none;border-radius:8px;' +
      'background:var(--accion);color:#fff;font-size:15px;font-weight:500">Registrar</button>';
  }

  /* ── 05 · eligiendo persona entre 62 ────────────────────────────────────────
     Las dos, y en este orden: recientes arriba sin teclado, buscador debajo. */
  function vistaPersona() {
    var q = (S.q || '').toLowerCase().trim();
    var todos = D.clientes();
    var hit = q ? todos.filter(function (c) {
      return (c.nombre || '').toLowerCase().indexOf(q) >= 0;
    }).slice(0, 8) : [];

    return '<div style="width:38px;height:4px;border-radius:2px;background:var(--borde);margin:0 auto 13px"></div>' +
      '<div style="height:52px;padding:0 12px;border:1px solid var(--accion);border-radius:8px;' +
      'box-shadow:0 0 0 3px rgba(0,102,177,.12);display:flex;align-items:center;gap:11px">' +
      '<span style="color:var(--accion);flex-shrink:0">' + ico(IC.lupa, 18) + '</span>' +
      '<input id="cap-q" autocomplete="off" placeholder="Tres letras bastan" value="' + H(S.q || '') + '" ' +
      'style="flex:1;border:none;outline:none;font-family:inherit;font-size:14.5px;color:var(--tinta);background:none">' +
      '<span style="font-family:var(--mono);font-size:12px;color:var(--suave);flex-shrink:0">' +
      (q ? hit.length + ' de ' + todos.length : todos.length) + '</span></div>' +

      (q ? '<div style="margin-top:14px"><div class="eyebrow">Coinciden</div>' +
        (hit.length
          ? '<div class="tarjeta" style="overflow:hidden;margin-top:8px">' + hit.map(function (c, i) {
              var ops = (c.operaciones || []).filter(function (o) { return !o.pendienteAsignacion && !o.archivado; });
              return '<div data-cap="persona:' + H(c.id) + '" style="display:flex;align-items:center;gap:12px;padding:11px 14px;' +
                'min-height:56px;cursor:pointer' + (i ? ';border-top:1px solid var(--sep)' : '') + '">' +
                '<div style="flex:1;min-width:0"><div style="font-size:14px">' + H(c.nombre) + '</div>' +
                '<div style="font-size:12.5px;color:var(--suave);margin-top:1px">' +
                H((ops.length ? (ops[0].estado || 'estudio') : 'Sin operación') + ' · ' + (c.telefono || 'sin teléfono')) +
                '</div></div><span style="color:rgba(22,33,62,.35)">' + ico(IC.flecha) + '</span></div>';
            }).join('') + '</div>'
          : '<div style="font-size:13px;color:var(--suave);margin-top:8px;line-height:1.5">Ninguno de los ' +
            todos.length + ' se llama así.</div>') + '</div>' : '') +

      '<div style="margin-top:14px"><div class="eyebrow">Recientes · sin escribir nada</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">' +
      (recientes().map(function (r) {
        return '<button data-cap="persona:' + H(r.id) + '" style="height:48px;padding:0 14px;border:1px solid var(--borde);' +
          'border-radius:8px;background:#fff;font-size:13.5px;font-weight:500;color:rgba(22,33,62,.75)">' + H(r.nombre) + '</button>';
      }).join('') || '<div style="font-size:13px;color:var(--suave);line-height:1.5">Todavía no has hablado con nadie desde aquí.</div>') +
      '</div></div>' +

      '<button data-cap="lead-desde-busqueda" style="width:100%;height:48px;margin-top:15px;border:1px solid var(--borde);' +
      'border-radius:8px;background:#fff;font-size:14.5px;font-weight:500;color:var(--accion)">' +
      'No está · crear lead' + (S.q ? ' con este nombre' : '') + '</button>';
  }


  /* ── 07+08 · documento ──────────────────────────────────────────────────────
     Con requisito entra archivado; sin requisito entra pendiente de confirmar.
     La misma regla del portal del cliente: nunca se pierde y nunca miente.

     C1 · un requisito no se cumple con una foto. `nominas` tiene cantidad 2 y
     por_titular true: con dos titulares son CUATRO documentos, no uno. Y 12 de
     los 26 requisitos son por titular, así que «de quién» identifica el
     EXPEDIENTE, no de quién es el papel — la nómina puede ser de Marc. De ahí
     salen las tres piezas: la fila enseña su avance, aparece el paso de «¿de
     qué titular?» cuando toca, y el botón dice lo que hace de verdad.

     C2 · y el enlace de abajo no lleva un número fijo: encargo son 18
     acumulados, no 14 —14 es documentación—. Se pregunta a la fase. */
  function vistaDocumento() {
    var p = S.persona, exp = null, fase = null;
    if (p) {
      var c = (D.clientes().filter(function (x) { return x.id === p.id; }) || [])[0];
      var ops = (c && c.operaciones || []).filter(function (o) { return !o.pendienteAsignacion && !o.archivado; });
      fase = ops.length ? (ops[0].estado || 'estudio') : null;
      exp = fase ? D.expediente(fase) : null;
    }
    var lista = (exp && exp.lista) || [];
    var sel = S.req || null;
    var elegido = sel ? (lista.filter(function (r) { return r.clave === sel; })[0] || null) : null;
    var titulares = (S.titulares || []);

    return '<div style="width:38px;height:4px;border-radius:2px;background:var(--borde);margin:0 auto 14px"></div>' +

      '<div style="display:flex;align-items:center;gap:12px">' +
      '<div style="width:56px;height:72px;border-radius:8px;background:#e7ebf2;display:flex;align-items:center;' +
      'justify-content:center;color:rgba(22,33,62,.4);flex-shrink:0">' + ico(IC.doc, 20) + '</div>' +
      '<div style="flex:1"><div class="serif" style="font-size:19px;font-weight:500;line-height:1.25">' +
      (S.doc ? H(S.doc.nombre) : 'Foto del documento') + '</div>' +
      '<div style="font-size:12.5px;color:var(--suave);margin-top:3px">' +
      (S.doc ? H(S.doc.detalle) : 'Todavía sin hacer') + '</div></div>' +
      '<button data-cap="doc-camara" style="height:48px;padding:0 14px;border:1px solid var(--borde);border-radius:8px;' +
      'background:#fff;font-size:13.5px;font-weight:500;color:var(--accion);flex-shrink:0">' +
      (S.doc ? 'Rehacer' : 'Hacer') + '</button></div>' +

      '<div style="margin-top:15px"><div class="eyebrow">De quién</div>' +
      '<button data-cap="elegir-persona" style="width:100%;height:52px;padding:0 14px;border:1px solid var(--borde);' +
      'border-radius:8px;background:#fff;display:flex;align-items:center;gap:12px;text-align:left;margin-top:9px">' +
      (p ? '<span style="flex:1;font-size:14.5px">' + H(p.nombre) + '</span>' +
           '<span style="font-family:var(--mono);font-size:12px;color:var(--suave)">' + H(p.id) + '</span>' +
           '<span style="font-size:13px;font-weight:500;color:var(--accion)">Cambiar</span>'
         : '<span style="flex:1;font-size:14.5px;color:var(--suave)">Elegir persona</span>' +
           '<span style="color:rgba(22,33,62,.35)">' + ico(IC.flecha) + '</span>') + '</button></div>' +

      '<div style="margin-top:14px">' +
      '<div style="display:flex;align-items:baseline;justify-content:space-between">' +
      '<span class="eyebrow">A qué requisito</span>' +
      (exp ? '<span style="font-family:var(--mono);font-size:11.5px;color:var(--suave)">' + exp.total + ' en esta fase</span>' : '') +
      '</div>' +
      '<div class="tarjeta" style="overflow:hidden;margin-top:9px">' +
      lista.slice(0, 2).map(function (r, i) {
        var on = sel === r.clave;
        var cuantos = r.cantidad * (r.porTitular ? Math.max(titulares.length, 1) : 1);
        return '<div data-cap="req:' + H(r.clave) + '" style="display:flex;align-items:center;gap:12px;padding:12px 14px;' +
          'min-height:56px;cursor:pointer' + (i ? ';border-top:1px solid var(--sep)' : '') +
          (on ? ';background:rgba(0,102,177,.06)' : '') + '">' +
          (on ? '<span style="width:20px;height:20px;border-radius:50%;background:var(--accion);color:#fff;display:flex;' +
                'align-items:center;justify-content:center;flex-shrink:0">' +
                '<svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" ' +
                'stroke-linecap="round" stroke-linejoin="round">' + IC.check + '</svg></span>'
              : '<span style="width:20px;height:20px;border-radius:50%;border:1px solid var(--borde);flex-shrink:0"></span>') +
          '<div style="flex:1;font-size:14px">' + H(r.nombre) +
          '<div style="font-size:12px;color:var(--suave);margin-top:1px">' +
          '0 / ' + cuantos + (r.porTitular ? ' · uno por titular' : '') + '</div></div></div>';
      }).join('') +
      '<div data-cap="req:" style="display:flex;align-items:center;gap:12px;padding:12px 14px;min-height:56px;cursor:pointer' +
      (lista.length ? ';border-top:1px solid var(--sep)' : '') + '">' +
      (sel === null || sel === ''
        ? '<span style="width:20px;height:20px;border-radius:50%;background:var(--accion);color:#fff;display:flex;' +
          'align-items:center;justify-content:center;flex-shrink:0"><svg width="12" height="12" viewBox="0 0 16 16" fill="none" ' +
          'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + IC.check + '</svg></span>'
        : '<span style="width:20px;height:20px;border-radius:50%;border:1px solid var(--borde);flex-shrink:0"></span>') +
      '<div style="flex:1;font-size:14px;color:rgba(22,33,62,.6)">Ninguno · no lo sé ahora</div></div>' +
      (exp && fase
        ? '<div data-cap="req-todos" style="padding:12px 14px;border-top:1px solid var(--sep);font-size:13px;' +
          'font-weight:500;color:var(--accion);cursor:pointer">Ver los ' + exp.total + ' de esta fase</div>'
        : '<div style="padding:12px 14px;border-top:1px solid var(--sep);font-size:12.5px;color:var(--suave);line-height:1.5">' +
          (p ? 'Sin sesión no se sabe qué requisitos pide esta fase.' : 'Elige de quién es y aparecen sus requisitos.') + '</div>') +
      '</div></div>' +

      /* C1 · el paso que faltaba: de quién es el papel, no de quién es el expediente */
      (elegido && elegido.porTitular
        ? '<div style="margin-top:14px"><div class="eyebrow">¿De qué titular?</div>' +
          '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:9px">' +
          (titulares.length ? titulares : [{ nombre: p ? p.nombre : 'Titular' }]).map(function (t, i) {
            var on = (S.titular || 0) === i;
            return '<button data-cap="tit:' + i + '" style="height:48px;padding:0 14px;border:1px solid ' +
              (on ? 'var(--accion)' : 'var(--borde)') + ';border-radius:8px;background:' +
              (on ? 'rgba(0,102,177,.08)' : '#fff') + ';color:' + (on ? 'var(--accion)' : 'rgba(22,33,62,.7)') +
              ';font-size:13.5px;font-weight:500">' + H(t.nombre) + '</button>';
          }).join('') + '</div>' +
          '<div style="font-size:12px;line-height:1.5;color:var(--suave);margin-top:8px">' +
          'Doce de los veintiséis requisitos son por titular. Quién es el dueño del expediente no dice de quién es el papel.</div></div>'
        : '') +

      (!elegido
        ? '<div style="margin-top:14px;background:#fff;border:1px solid var(--borde);border-left:3px solid var(--aviso);' +
          'border-radius:8px;padding:13px 14px">' +
          '<span style="display:inline-flex;align-items:center;gap:6px;padding:2px 10px;border-radius:11px;' +
          'background:rgba(184,134,43,.1);color:var(--aviso);font-size:11px;font-weight:500">' +
          '<span style="width:6px;height:6px;border-radius:50%;background:var(--aviso)"></span>pendiente de confirmar</span>' +
          '<div style="font-size:12.5px;line-height:1.6;color:rgba(22,33,62,.65);margin-top:7px">' +
          'Entra en su expediente pero sin contar como requisito cumplido. Aparece en la lista de pendientes de quien ' +
          'lleva la operación, que lo coloca desde la mesa en un toque. Es la misma regla del portal del cliente.</div></div>'
        : '') +

      '<button data-cap="doc-subir" style="width:100%;height:48px;margin-top:15px;border:none;border-radius:8px;' +
      'background:var(--accion);color:#fff;font-size:15px;font-weight:500">' +
      (elegido
        ? 'Subir 1 de ' + (elegido.cantidad * (elegido.porTitular ? Math.max(titulares.length, 1) : 1)) +
          ' · ' + H(elegido.nombre.toLowerCase())
        : 'Subir y dejarlo pendiente') + '</button>' +
      (!elegido ? '<div style="font-size:12px;line-height:1.5;color:var(--suave);margin-top:9px">' +
        'Mejor dentro y sin colocar que fuera y perdido. Lo que no se puede es que cuente por algo que no es.</div>' : '');
  }

  /* ═══ pintado ════════════════════════════════════════════════════════════ */
  function pintar() {
    if (!S) return;
    var cuerpo = S.paso === 'hoja' ? vistaHoja()
      : S.paso === 'lead' ? vistaLead()
      : S.paso === 'actividad' ? vistaActividad()
      : S.paso === 'persona' ? vistaPersona()
      : vistaDocumento();

    /* La regla del teclado, heredada de la Agenda: cabecera fija, cuerpo con
       scroll, botón dentro del flujo y franja del teclado reservada abajo. */
    /* Las hojas con campo de escribir (lead, persona, documento, actividad) se
       levantan sobre el teclado con --kb (ver app-shell.js) y se topan a 86vh
       menos el teclado; el resto (el menú) no lo necesita. `max-height:auto` era
       CSS inválido —no existe— y dejaba la hoja sin tope. */
    var tall = (S.paso === 'lead' || S.paso === 'persona' || S.paso === 'documento' || S.paso === 'actividad');
    var maxH = tall ? 'calc(86vh - var(--kb,0px))' : 'none';
    var html =
      '<div id="hoja-capturar" style="position:fixed;inset:0;z-index:60">' +
      '<div data-cap="fondo" style="position:absolute;inset:0;background:rgba(22,33,62,.42)"></div>' +
      '<div style="position:absolute;left:0;right:0;bottom:var(--kb,0px);max-height:' + maxH + ';background:#fff;' +
      'border-radius:13px 13px 0 0;box-shadow:0 -14px 40px rgba(22,33,62,.22);padding:16px 16px calc(24px + env(safe-area-inset-bottom));' +
      'overflow-y:auto;-webkit-overflow-scrolling:touch">' + cuerpo + '</div></div>';

    var v = document.getElementById('hoja-capturar');
    if (v) v.remove();
    document.body.insertAdjacentHTML('beforeend', html);
    var f = document.querySelector('#hoja-capturar #cap-nom, #hoja-capturar #cap-q, #hoja-capturar #cap-dir');
    if (f && S.paso !== 'hoja') setTimeout(function () { f.focus(); }, 40);
  }

  /* ── la tira de confirmación ────────────────────────────────────────────────
     Respuesta 4 del mock: se captura en ráfaga —dos fotos, una nota, un lead—
     y abrir lo creado corta la ráfaga. Así que se vuelve donde estabas y la
     tira ofrece «abrir» unos segundos: quien quiera entrar, entra. */
  function tira(texto, sub, alAbrir) {
    var id = 'tira-cap';
    var v = document.getElementById(id); if (v) v.remove();
    document.body.insertAdjacentHTML('beforeend',
      '<div id="' + id + '" style="position:fixed;left:12px;right:12px;top:calc(12px + env(safe-area-inset-top));z-index:70;' +
      'background:var(--tinta);border-radius:11px;padding:12px 14px;display:flex;align-items:center;gap:12px;' +
      'box-shadow:0 12px 32px rgba(22,33,62,.28)">' +
      '<span style="width:26px;height:26px;border-radius:50%;background:var(--exito);color:#fff;display:flex;' +
      'align-items:center;justify-content:center;flex-shrink:0"><svg width="15" height="15" viewBox="0 0 16 16" fill="none" ' +
      'stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + IC.check + '</svg></span>' +
      '<div style="flex:1;font-size:13px;line-height:1.45;color:#fff">' + H(texto) +
      '<div style="font-size:12px;color:rgba(255,255,255,.6);margin-top:2px">' + H(sub) + '</div></div>' +
      (alAbrir ? '<button data-cap="tira-abrir" style="height:48px;padding:0 14px;border:none;border-radius:8px;' +
        'background:#fff;color:var(--tinta);font-size:14px;font-weight:500">Abrir</button>' : '') + '</div>');
    if (alAbrir) document.getElementById(id).__abrir = alAbrir;
    setTimeout(function () { var e = document.getElementById(id); if (e) e.remove(); }, 6000);
  }

  /* ═══ acciones ═══════════════════════════════════════════════════════════ */
  function guardarLead() {
    var nom = (document.getElementById('cap-nom') || {}).value || '';
    var tel = (document.getElementById('cap-tel') || {}).value || '';
    nom = nom.trim();
    if (!nom) { alert('El nombre, al menos.'); return; }

    var lead = null;
    try {
      var datosLead = {};
      if (S.nota) datosLead.nota_captura = S.nota;
      /* la nota de voz viaja con el lead: su duración y la clave del audio ya
         guardado en el móvil, para que el CRM sepa que existe y de cuánto es. */
      if (S.voz) datosLead.nota_voz = { segundos: S.voz.segundos, ref_local: S.voz.k };
      lead = AJ.captacion.crear({
        tipo_lead: 'comprador_finanzas',   // app de Finances: el lead es de hipoteca
        nombre_completo: nom,
        telefono: tel.trim(),
        origen: 'manual',
        suite_destino: 'finances',
        datos: datosLead
      });
    } catch (e) { alert('No se ha podido guardar: ' + e.message); return; }

    if (!hayRed()) encolar({ que: 'lead', id: lead.id, nombre: nom });
    /* El flag de voz se lee ANTES de cerrar(): cerrar() pone S = null, y leer
       S.voz después reventaba («Cannot read properties of null») justo en el
       toast de confirmación — el lead SÍ se guardaba, pero sin aviso el usuario
       creía que no. Igual que guardarActividad captura `quien` antes de cerrar. */
    var conVoz = !!(S && S.voz);
    cerrar();
    tira('Lead creado · ' + nom,
         (hayRed() ? 'Sube al CRM' : 'Guardado · sube cuando haya red') + (conVoz ? ' · con nota de voz' : ''));
  }

  function guardarActividad() {
    if (!S.persona) { S.paso = 'persona'; pintar(); return; }
    var txt = ((document.getElementById('cap-txt') || {}).value || S.texto || '').trim();
    if (!txt) { alert('Sin nota no queda rastro de qué ha pasado.'); return; }
    var yo = D.yo();
    try {
      AJ.seguimientos.crear({
        entidadOrigen: 'persona', entidadId: S.persona.id,
        tipo: S.tipo || 'llamada', texto: txt,
        autorId: yo.nombre, autorNombre: yo.nombre,
        estado: 'realizada'
      });
    } catch (e) { alert('No se ha podido registrar: ' + e.message); return; }
    var quien = S.persona;
    cerrar();
    tira('Registrado · ' + quien.nombre, 'Sigue capturando si quieres', function () {
      window.AJapp.shell.ir('cliente', quien.id);
    });
  }

  /* La cámara de verdad: un input file con `capture`, que en el móvil abre la
     cámara y en el escritorio el explorador. Lo capturado va a la cola: sin
     sesión no hay dónde subirlo, y decirlo es mejor que fingir que subió.

     Y va A LA COLA EL FICHERO, no solo su nombre. Hasta el 30-ago esto apuntaba
     `{nombre, bytes}` y soltaba el `File`: el navegador lo recogía y la foto
     desaparecía, mientras la tira decía «guardada». Una foto de un piso que se
     hace una sola vez y no se puede repetir. Los bytes van a IndexedDB —
     localStorage no admite binario— con la misma clave que su fila. */
  /* Solo documentos: la cámara de fotos de propiedad se fue con la separación
     de Inmo. `que` se queda en 'documento' para la fila de la cola. */
  function abrirCamara(que, ref) {
    var i = document.createElement('input');
    i.type = 'file'; i.accept = 'image/*'; i.setAttribute('capture', 'environment');
    i.onchange = function () {
      var fs = Array.prototype.slice.call(i.files || []);
      if (!fs.length) return;
      fs.forEach(function (f) {
        var item = { que: que, ref: ref, nombre: f.name, bytes: f.size };
        encolar(item);
        D.medios.guardar(item.k, f, { ref: ref });
        /* Y una copia reducida, AHORA: reducir hay que hacerlo con el fichero
           delante; después ya no hay original que reducir. Si el navegador no
           puede, no pasa nada — queda la original y la app lo dice. */
        D.reducir(f).then(function (chica) {
          if (chica) D.medios.guardar(item.k + '-r', chica, { ref: ref, reducida: true,
                                                              nombre: f.name, de: item.k });
        });
      });
      S.doc = { nombre: fs.length > 1 ? fs.length + ' páginas' : 'Foto del documento',
                detalle: fs.length + ' página' + (fs.length > 1 ? 's' : '') + ' · ' +
                         (Math.round(fs.reduce(function (a, b) { return a + b.size; }, 0) / 1e5) / 10) + ' MB' };
      pintar();
    };
    i.click();
  }

  /* El nombre del documento sale del requisito elegido; sin requisito, «Documento». */
  function nombreReq() {
    if (!S.req || !S.persona) return 'Documento';
    var c = (D.clientes().filter(function (x) { return x.id === S.persona.id; }) || [])[0];
    var ops = (c && c.operaciones || []).filter(function (o) { return !o.pendienteAsignacion && !o.archivado; });
    var fase = ops.length ? (ops[0].estado || 'estudio') : null;
    var exp = fase ? D.expediente(fase) : null;
    var r = exp && exp.lista ? exp.lista.filter(function (x) { return x.clave === S.req; })[0] : null;
    return (r && r.nombre) || 'Documento';
  }

  /* La puerta «Documento» abre el ESCÁNER (05b): captura hoja a hoja, recorte
     manual y un PDF por documento. El Escáner solo produce el PDF; aquí se
     guarda en el móvil y se encola. Si el módulo no está, cae a la cámara suelta
     de antes —nada se rompe si el escáner falla al cargar. */
  function openEscaner() {
    if (!window.AJapp.escaner) { abrirCamara('documento', S.persona ? S.persona.id : null); return; }
    var dequien = S.persona ? String(S.persona.nombre || '').split(',')[0] : '';
    window.AJapp.escaner.abrir({
      nombre: nombreReq(), ref: S.persona ? S.persona.id : null, requisito: S.req || null,
      titular: S.titular || 0, dequien: dequien,
      onListo: function (blob, n, meta) {
        S.doc = { nombre: meta.nombre, detalle: n + ' hoja' + (n === 1 ? '' : 's') + ' · PDF · ' +
                  (Math.round(blob.size / 1e5) / 10) + ' MB', blob: blob, paginas: n };
        pintar();
      }
    });
  }

  function subirDocumento() {
    if (!S.persona) { S.paso = 'persona'; S.volverA = 'documento'; pintar(); return; }
    if (!S.doc || !S.doc.blob) { openEscaner(); return; }
    var item = { que: 'documento', ref: S.persona.id, requisito: S.req || null,
                 titular: S.titular || 0, nombre: S.doc.nombre, bytes: S.doc.blob.size, paginas: S.doc.paginas };
    encolar(item);
    /* el PDF armado va al almacén de medios con la clave que ata la fila de la cola */
    D.medios.guardar(item.k, S.doc.blob, { nombre: S.doc.nombre, ref: S.persona.id });
    var conReq = !!S.req;
    cerrar();
    tira(conReq ? 'Guardado y colocado' : 'Guardado · pendiente de confirmar',
         conReq ? 'Cuenta en su requisito' : 'Nadie lo ha perdido y no cuenta por lo que no es');
  }

  /* ═══ el clic ════════════════════════════════════════════════════════════ */
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-cap]');
    if (!t) return;
    var a = t.getAttribute('data-cap');
    e.preventDefault();

    if (a === 'fondo') return cerrar();
    if (a === 'tira-abrir') {
      var box = document.getElementById('tira-cap');
      if (box && box.__abrir) box.__abrir();
      if (box) box.remove();
      return;
    }
    if (!S) return;

    /* El defecto se pone en el ESTADO, no solo en el pintado: un botón que se
       ve elegido y un valor que está vacío es justo la mentira que esta app no
       se puede permitir. */
    if (a === 'act')   { S.paso = 'actividad'; S.tipo = S.tipo || 'llamada'; return pintar(); }
    if (a === 'lead')  { S.paso = 'lead'; return pintar(); }
    if (a === 'doc')   { S.paso = 'documento'; return pintar(); }

    if (a === 'elegir-persona') { S.volverA = S.paso; S.paso = 'persona'; S.q = ''; return pintar(); }
    if (a.indexOf('persona:') === 0) {
      var id = a.slice(8);
      var c = (D.clientes().filter(function (x) { return x.id === id; }) || [])[0];
      if (c) {
        S.persona = { id: c.id, nombre: c.nombre };
        S.titulares = ((c.operaciones || [])[0] || {}).titulares || [];
        S.titular = 0;
      }
      S.paso = S.volverA || 'actividad';
      return pintar();
    }
    if (a === 'lead-desde-busqueda') {
      S.paso = 'lead'; S.nombrePrevio = S.q || '';
      pintar();
      var n = document.getElementById('cap-nom');
      if (n && S.nombrePrevio) n.value = S.nombrePrevio;
      return;
    }

    if (a.indexOf('tipo:') === 0)   { S.texto = (document.getElementById('cap-txt') || {}).value || S.texto; S.tipo = a.slice(5); return pintar(); }
    if (a.indexOf('rapida:') === 0) { S.texto = a.slice(7); return pintar(); }
    if (a === 'act-guardar')        return guardarActividad();

    if (a === 'lead-texto') {
      var box = document.getElementById('cap-extra');
      if (box) box.innerHTML = '<textarea id="cap-nota" rows="2" placeholder="Dos líneas y ya" ' +
        'style="width:100%;border:1px solid var(--borde);border-radius:8px;padding:11px 12px;margin-top:8px;' +
        'font-family:inherit;font-size:14px;color:var(--tinta);resize:none"></textarea>';
      return;
    }
    if (a === 'lead-voz') return grabarVoz();
    if (a === 'lead-guardar') {
      var na = document.getElementById('cap-nota');
      if (na && na.value.trim()) S.nota = na.value.trim();
      return guardarLead();
    }

    if (a === 'doc-camara') return openEscaner();
    if (a.indexOf('req:') === 0)  { S.req = a.slice(4) || null; S.titular = 0; return pintar(); }
    if (a === 'req-todos')        { return pintar(); }
    if (a.indexOf('tit:') === 0)  { S.titular = parseInt(a.slice(4), 10) || 0; return pintar(); }
    if (a === 'doc-subir')        return subirDocumento();
  }, true);

  document.addEventListener('input', function (e) {
    if (!S || e.target.id !== 'cap-q') return;
    S.q = e.target.value;
    var pos = e.target.selectionStart;
    pintar();
    var n = document.getElementById('cap-q');
    if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} }
  });

  /* ── la nota de voz ─────────────────────────────────────────────────────────
     Respuesta 3 del mock: conduciendo no se escribe, se dicta. El audio se
     guarda TAL CUAL y se transcribe en la mesa — fingir una transcripción en
     el móvil sale mal justo con lo que importa: nombres y calles. */
  var rec = null, trozos = [];
  function grabarVoz() {
    if (!navigator.mediaDevices || !window.MediaRecorder) {
      alert('Este navegador no graba audio. Escribe la nota.');
      return;
    }
    if (rec && rec.state === 'recording') { rec.stop(); return; }
    navigator.mediaDevices.getUserMedia({ audio: true }).then(function (st) {
      trozos = []; rec = new MediaRecorder(st);
      var t0 = Date.now();
      rec.ondataavailable = function (ev) { trozos.push(ev.data); };
      rec.onstop = function () {
        st.getTracks().forEach(function (x) { x.stop(); });
        var seg = Math.round((Date.now() - t0) / 1000);
        /* El AUDIO se guarda, no se tira. Antes solo se apuntaba la duración y
           el blob de `trozos` se perdía: «Nota de voz · 0:12» sin nada guardado,
           la misma mentira que las fotos. Va a IndexedDB con su clave. */
        var blob = new Blob(trozos, { type: (rec && rec.mimeType) || 'audio/webm' });
        var k = 'voz' + Date.now();
        S.voz = { segundos: seg, k: k, bytes: blob.size };
        try { D.medios.guardar(k, blob, { nombre: 'nota-de-voz.webm' }); } catch (e) {}
        var b = document.querySelector('[data-cap="lead-voz"]');
        if (b) {
          b.style.borderColor = 'var(--accion)';
          b.style.background = 'rgba(0,102,177,.08)';
          b.style.color = 'var(--accion)';
          b.innerHTML = ico(IC.micro, 18) + 'Nota de voz · 0:' + (seg < 10 ? '0' : '') + seg;
        }
      };
      rec.start();
      var b = document.querySelector('[data-cap="lead-voz"]');
      if (b) b.innerHTML = ico(IC.micro, 18) + 'Grabando · toca para parar';
    }).catch(function () { alert('No se ha podido usar el micrófono.'); });
  }

  window.AJapp.capturar = C;
})();
