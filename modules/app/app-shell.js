/* ═══════════════════════════════════════════════════════════════════════════
   App AJ Finances · el armazón

   La barra de cinco del mock, el enrutado, y el aviso de que nada sube. Nada
   más: cada sección se pinta sola.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var I = window.AJapp.inicio, D = window.AJapp.datos;
  var vista = 'inicio';

  var A = window.AJapp.agenda;
  var NAV = [
    ['inicio','Inicio','casa'], ['agenda','Agenda','calendario'],
    ['capturar','','mas'], ['buscar','Buscar','lupa'], ['mas','Más','menu']
  ];
  var EXTRA = {
    calendario:'<rect x="2.6" y="3.6" width="10.8" height="10" rx="1.2"/><path d="M5.6 2.4v2.4M10.4 2.4v2.4M2.6 6.8h10.8"/>',
    lupa:'<circle cx="7.2" cy="7.2" r="4.2"/><path d="m13.4 13.4-3.2-3.2"/>',
    menu:'<path d="M2.8 4.6h10.4M2.8 8h10.4M2.8 11.4h10.4"/>'
  };
  function ico(n, t) {
    if (EXTRA[n]) return '<svg width="' + t + '" height="' + t + '" viewBox="0 0 16 16" fill="none" stroke="currentColor" ' +
      'stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + EXTRA[n] + '</svg>';
    return I.svg(n, t);
  }

  function barra() {
    document.getElementById('barra').innerHTML = NAV.map(function (n) {
      if (n[0] === 'capturar')
        return '<button class="nav-capturar" data-ir="capturar">' + ico('mas', 24) + '</button>';
      return '<button class="nav' + (vista === n[0] ? ' on' : '') + '" data-ir="' + n[0] + '">' +
             ico(n[2], 22) + '<span>' + n[1] + '</span></button>';
    }).join('');
  }

  /* Sin sesión no sube nada · misma lección que la píldora del CRM: un estado
     que cuesta trabajo no se pinta como si fuera neutro. */
  function avisoSesion() {
    if (D.yo().haySesion || document.getElementById('avisoSesion')) return;
    var b = document.createElement('button');
    b.id = 'avisoSesion';
    b.textContent = 'Sin sesión · toca para entrar';
    b.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:99;border:none;width:100%;' +
      'background:#b8862b;color:#fff;font:500 12.5px/1.4 inherit;padding:calc(env(safe-area-inset-top,0px) + 7px) 14px 7px;';
    /* antes abría una herramienta del CRM que no está en el bundle de la app
       (404 en el móvil). Ahora abre el login, que es lo que de verdad hace
       falta cuando no hay sesión. */
    b.onclick = function () { window.AJapp.login.abrir(); };
    document.body.appendChild(b);
    document.getElementById('cab').style.paddingTop = 'calc(env(safe-area-inset-top,0px) + 44px)';
  }

  function noHecho(que) {
    var c = document.getElementById('cuerpo');
    c.innerHTML = '<div class="tarjeta" style="padding:22px 20px;margin-top:8px">' +
      '<div class="serif" style="font-size:19px;font-weight:500;line-height:1.3">' + I.H(que) + '</div>' +
      '<div style="font-size:13.5px;line-height:1.6;color:rgba(22,33,62,.6);margin-top:8px">' +
      'Diseñada y aprobada, todavía sin portar. Se construye después de Inicio, ' +
      'Agenda y Cliente, que es la app útil con los datos que ya hay.</div></div>';
    document.getElementById('cab').innerHTML =
      '<div class="eyebrow">AJ Finances</div><div class="serif" style="font-size:23px;font-weight:500;margin-top:3px">' + I.H(que) + '</div>';
  }

  function ir(destino) {
    var id = null;
    if (/^cliente:/.test(destino)) { id = destino.slice(8); destino = 'cliente'; }
    /* El cuadre se abre SOBRE un cliente: sin saber de quién son los números
       no hay cuadre que valga. `cuadre:<id>` abre el suyo, `cuadre-nuevo:<id>`
       empieza uno en el piso. */
    if (/^cuadre:/.test(destino)) { window.AJapp.cuadre.abrirDe(destino.slice(7)); vista = 'cuadre'; barra(); return; }
    if (/^cuadre-nuevo:/.test(destino)) { window.AJapp.cuadre.nuevo(destino.slice(13)); vista = 'cuadre'; barra(); return; }
    /* Capturar no es una vista: es una hoja que se abre encima de donde estés,
       porque se captura en ráfaga y volver donde estabas es la respuesta 4 del
       mock. La barra no cambia de pestaña. */
    if (destino === 'capturar') { window.AJapp.capturar.abrir(); return; }
    /* La nota de voz del Inicio entra por la misma puerta: es el tercer campo
       del lead, no una sección aparte. */
    if (destino === 'voz') { window.AJapp.capturar.abrir(); window.AJapp.capturar.aVoz(); return; }
    vista = destino;
    document.getElementById('cuerpo').scrollTop = 0;
    /* El modo presentación del cuadre esconde la barra. Si se sale de ahí por
       cualquier otro camino, la barra vuelve: dejarla escondida encerraría al
       usuario en una pantalla sin salida. */
    document.getElementById('barra').style.display = '';
    /* el navy de la cabecera de cliente es inline y persiste: se resetea aquí
       para que cualquier otra pantalla arranque sobre papel. */
    var _cab = document.getElementById('cab'); if (_cab) { _cab.style.background = ''; _cab.style.borderBottomColor = ''; }
    if (destino === 'inicio') I.pintar();
    else if (destino === 'agenda') window.AJapp.agenda.pintar();
    else if (destino === 'cliente' && id) window.AJapp.cliente.pintar(id);
    else if (destino === 'buscar') window.AJapp.buscar.pintar();
    else if (destino === 'mas') window.AJapp.mas.pintar();
    else if (destino === 'clientes') listaClientes();
    else if (destino === 'operaciones') listaOperaciones();
    else if (destino === 'leads') listaLeads();
    else if (destino === 'expedientes') listaExpedientes();
    else noHecho({ agenda:'Agenda', cliente:'Ficha de cliente' }[destino] || 'Sección');
    barra();
  }

  /* La lista existe para poder LLEGAR a una ficha. La pantalla de Clientes con
     sus filtros es otra cosa y no está diseñada todavía: esto es el puente
     mínimo, y se dice que lo es. */
  function listaClientes() {
    var cli = D.clientes().slice().sort(function (a, b) {
      return String(a.nombre||'').localeCompare(String(b.nombre||''), 'es');
    });
    document.getElementById('cab').innerHTML =
      '<div class="eyebrow">AJ Finances</div><div class="serif" style="font-size:23px;font-weight:500;line-height:1.1;margin-top:3px">' +
      'Clientes <span style="font-size:15px;color:var(--tenue)">· ' + cli.length + '</span></div>';
    document.getElementById('cuerpo').innerHTML =
      '<div class="tarjeta" style="overflow:hidden">' + cli.map(function (c, i) {
        var ops = (c.operaciones || []).filter(function (o) { return !o.pendienteAsignacion && !o.archivado; });
        return '<button data-ir="cliente:' + I.H(c.id) + '" class="fila" style="width:100%;text-align:left;' +
          (i ? 'border-top:1px solid var(--sep);' : '') + '">' +
          '<span style="flex:1;min-width:0"><span style="display:block;font-size:14px">' + I.H(c.nombre) + '</span>' +
          '<span style="display:block;font-size:12.5px;color:var(--suave);margin-top:1px">' +
          I.H(c.telefono || 'sin teléfono') + (ops.length ? ' · ' + ops.length + ' op.' : '') + '</span></span>' +
          '<span style="color:var(--raya);flex-shrink:0">' + I.svg('chevron',16) + '</span></button>';
      }).join('') + '</div>';
  }

  /* Molde de lista-puente: cabecera + tarjeta con filas que llevan a una ficha.
     Es el mismo patrón que la lista de clientes; existe para LLEGAR al detalle,
     no es la pantalla con filtros (esa se diseñará). */
  function listaSimple(titulo, n, filas, vacio) {
    document.getElementById('cab').innerHTML =
      '<div class="eyebrow">AJ Finances</div><div class="serif" style="font-size:23px;font-weight:500;' +
      'line-height:1.1;margin-top:3px">' + I.H(titulo) +
      (n ? ' <span style="font-size:15px;color:var(--tenue)">· ' + n + '</span>' : '') + '</div>';
    document.getElementById('cuerpo').innerHTML = filas.length
      ? '<div class="tarjeta" style="overflow:hidden">' + filas.map(function (f, i) {
          return '<button data-ir="' + I.H(f.ir) + '" class="fila" style="width:100%;text-align:left;' +
            (i ? 'border-top:1px solid var(--sep);' : '') + '">' +
            '<span style="flex:1;min-width:0"><span style="display:block;font-size:14px">' + I.H(f.titulo) + '</span>' +
            '<span style="display:block;font-size:12.5px;color:var(--suave);margin-top:1px">' + I.H(f.sub) + '</span></span>' +
            '<span style="color:var(--raya);flex-shrink:0">' + I.svg('chevron', 16) + '</span></button>';
        }).join('') + '</div>'
      : '<div class="tarjeta" style="padding:22px 20px"><div style="font-size:14px;font-weight:500">' +
        I.H(vacio.titulo) + '</div><div style="font-size:13px;line-height:1.55;color:var(--suave);margin-top:6px">' +
        I.H(vacio.detalle) + '</div></div>';
  }

  function listaOperaciones() {
    var ops = D.operaciones().filter(function (o) {
      return !o.esLead && ['perdido', 'descartado'].indexOf(o.estado) < 0;
    }).sort(function (a, b) { return String(a.cliente||'').localeCompare(String(b.cliente||''), 'es'); });
    listaSimple('Operaciones', ops.length, ops.map(function (o) {
      return { ir: 'cliente:' + o.clienteId,
               titulo: (o.codigo ? o.codigo + ' · ' : '') + o.cliente,
               sub: D.faseDe(o.estado) + (o.entidad ? ' · ' + o.entidad : '') };
    }), { titulo: 'No hay operaciones activas',
          detalle: 'Aparecen aquí en cuanto un cliente potencial firma el encargo.' });
  }

  function listaLeads() {
    var leads = D.operaciones().filter(function (o) {
      return o.esLead && ['perdido', 'descartado'].indexOf(o.estado) < 0;
    }).sort(function (a, b) { return String(a.cliente||'').localeCompare(String(b.cliente||''), 'es'); });
    listaSimple('Clientes potenciales', leads.length, leads.map(function (o) {
      return { ir: 'cliente:' + o.clienteId, titulo: o.cliente,
               sub: D.faseDe(o.estado) + ' · ' + (o.telefono || 'sin teléfono') };
    }), { titulo: 'Ningún cliente potencial',
          detalle: 'Aquí van los que están en estudio o documentación, antes de firmar el encargo.' });
  }

  function listaExpedientes() {
    var h = D.expedientesConHuecos(999);
    listaSimple('Expedientes', h.length, h.map(function (x) {
      return { ir: 'cliente:' + x.id, titulo: x.nombre,
               sub: (x.faltan ? (x.faltan === 1 ? 'falta 1' : 'faltan ' + x.faltan) : '') +
                    (x.faltan && x.caducados ? ', ' : '') +
                    (x.caducados ? x.caducados + ' caducado' + (x.caducados === 1 ? '' : 's') : '') +
                    (x.que ? ' · ' + x.que : '') };
    }), { titulo: 'Ningún expediente con huecos',
          detalle: D.requisitos() ? 'Todos los expedientes activos están al día.'
                                  : 'No se sabe hasta que se descarguen los requisitos con sesión.' });
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-ir]');
    if (b) { ir(b.getAttribute('data-ir')); return; }
    /* Antes había aquí un alert cazatodo para cualquier [data-accion]. Era un
       placeholder de cuando la ficha no existía y disparaba ENCIMA de las
       acciones ya construidas (saltaba «registrar» a la vez que se abría la
       hoja). Cada acción la maneja su módulo; lo que no, no hace ruido. */
  });

  /* ── la altura del teclado, para que las hojas no se descoloquen ──────────
     Las hojas (registrar actividad, lead) son position:fixed con el
     botón anclado a bottom:0. En iOS —y sobre todo en la PWA instalada— el
     teclado NO encoge el viewport de layout, solo el visual: el botón se queda
     pegado al fondo, detrás del teclado, y al enfocar el campo la hoja entera
     se desplaza hacia arriba y «Guardar» aparece descolocado. La cura estándar:
     medir el teclado con visualViewport y exponerlo como --kb; las hojas se
     levantan con bottom:var(--kb). Sin teclado --kb=0px → idéntico a antes, y
     si no hay visualViewport (navegadores viejos) tampoco pasa nada. */
  (function () {
    var vv = window.visualViewport;
    if (!vv) return;
    function ajusta() {
      var kb = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop));
      document.documentElement.style.setProperty('--kb', kb + 'px');
    }
    vv.addEventListener('resize', ajusta);
    vv.addEventListener('scroll', ajusta);
    ajusta();
  })();

  window.AJapp.shell = { ir: ir };
  I.pintar(); barra(); avisoSesion();

  if (!D.yo().haySesion) {
    /* recién instalada, sin sesión: no hay nada que enseñar hasta entrar, así
       que se abre el login directamente en vez de un Inicio vacío. */
    window.AJapp.login.abrir();
  } else {
    /* con sesión: baja la cartera y la agenda como hace el CRM al arrancar
       (AJ.sync.restaurar), sin bloquear el pintado, y repinta al terminar. */
    D.refrescarUsuarios().then(function () { I.pintar(); });
    D.refrescarRequisitos(); D.refrescarCuotas(); D.refrescarCuadres();
    D.refrescarDocumentos().then(function () { if (vista === 'inicio') I.pintar(); });
    D.restaurar()
      .then(function () { if (vista === 'inicio') I.pintar(); })
      .catch(function (e) { console.warn('[app] bajada al arrancar:', e.message); });
  }
  /* Lo capturado en la calle sube solo: al arrancar y cada vez que vuelve la
     red. Antes se quedaba en el móvil para siempre. */
  D.arrancarSubida();
  window.addEventListener('aj-app-subido', function () { if (vista === 'inicio') I.pintar(); });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(function(){});
})();
