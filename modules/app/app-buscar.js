/* ═══════════════════════════════════════════════════════════════════════════
   App AJ Finances · 06 · Buscar — la red de seguridad

   Cuando el Inicio no te ha puesto delante lo que buscabas, vienes aquí. Por
   eso las dos métricas son la misma moneda: cada visita a Buscar es un caso
   que el Inicio no resolvió.

   Del mock «App Buscar.dc.html», sus siete estados y sus cuatro respuestas:
     1 · sí, dentro de las notas — es donde está lo que se dijo de verdad, y va
         como grupo propio y último, con la FRASE y no solo el nombre
     2 · con el campo vacío, lo último que tocaste y nada más: ni accesos ni
         sugerencias inventadas, que el lanzador ya es el Inicio
     3 · la voz vive DENTRO del campo, no como botón aparte
     4 · agrupar basta; el filtro por tipo llega cuando un grupo pase de veinte

   Las tres reglas que decide esta sección:
     · un código no se busca, se VA — una respuesta posible, así que el
       destino con su botón grande en vez de una lista de uno
     · un grupo vacío no se dibuja — «Propiedades · 0» en todas las búsquedas
       del año que viene enseña a saltarse la pantalla. Aparece el día que haya
       cartera, y ese día no hay que tocar nada
     · sin cobertura se declara el alcance, para que nadie confunda «no está
       bajado» con «no existe»
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var D = window.AJapp.datos, I = window.AJapp.inicio, B = {};
  var H = I.H;

  function ico(d, w) {
    return '<svg width="' + (w || 16) + '" height="' + (w || 16) + '" viewBox="0 0 16 16" fill="none" ' +
      'stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  }
  var IC = {
    lupa:   '<circle cx="7.2" cy="7.2" r="4.2"/><path d="m13.4 13.4-3.2-3.2"/>',
    micro:  '<rect x="6.1" y="2.2" width="3.8" height="7.4" rx="1.9"/><path d="M4 7.6a4 4 0 0 0 8 0M8 11.6v2.2"/>',
    flecha: '<path d="M6 3.6 10.4 8 6 12.4"/>',
    llamar: '<path d="M13.4 11.2v1.9a1.2 1.2 0 0 1-1.3 1.2A11 11 0 0 1 2.5 5.3 1.2 1.2 0 0 1 3.7 4h1.9a1.2 1.2 0 0 1 1.2 1c.1.6.2 1.2.4 1.7a1.2 1.2 0 0 1-.3 1.3l-.8.8a9 9 0 0 0 3.4 3.4l.8-.8a1.2 1.2 0 0 1 1.3-.3c.5.2 1.1.3 1.7.4a1.2 1.2 0 0 1 1.1 1.2z"/>',
    borrar: '<circle cx="8" cy="8" r="5.6"/><path d="M6 6l4 4M10 6l-4 4"/>',
    nube:   '<path d="M4.6 12.4a2.8 2.8 0 0 1 .3-5.6 3.7 3.7 0 0 1 7-1 2.9 2.9 0 0 1-.5 6.6z"/><path d="m2.4 2.4 11.2 11.2"/>',
    mas:    '<circle cx="8" cy="8" r="5.6"/><path d="M8 5.4v5.2M5.4 8h5.2"/>'
  };

  /* El estado vive aquí y no en el DOM: el campo NO se vuelve a pintar en cada
     tecla. Repintar la cabecera destruiría el <input>, y con él el foco y el
     cursor — en una pantalla que es teclear, eso la rompe. Así que la cabecera
     se dibuja una vez y en cada tecla solo se refrescan el contador y el
     cuerpo. */
  var Q = '';
  var forzarTelefono = null;   // «buscar teléfonos que acaben en 14» ya elegido

  function enRed() { return navigator.onLine !== false; }

  /* Resalta en negrita la parte tecleada, sin acentos de por medio: quien
     escribe «nuria» tiene que ver la N de «Núria» en negrita igual. */
  function marcar(texto, q) {
    texto = String(texto == null ? '' : texto);
    if (!q) return H(texto);
    var i = D.normalizar(texto).indexOf(D.normalizar(q));
    if (i < 0) return H(texto);
    return H(texto.slice(0, i)) + '<strong style="font-weight:600">' +
           H(texto.slice(i, i + q.length)) + '</strong>' + H(texto.slice(i + q.length));
  }

  function eyebrow(t, n) {
    return '<div class="eyebrow" style="margin-bottom:8px">' + H(t) +
           (n == null ? '' : ' · ' + n) + '</div>';
  }

  /* ── la cabecera: el campo, y nada más ─────────────────────────────────────
     Cabecera fija · cuerpo con scroll · sin botón anclado, porque aquí no hay
     nada que confirmar. La regla del teclado de los cimientos, aplicada.

     El mock no dibuja barra inferior y explica por qué: «la tapa el teclado».
     En código la barra SE DEJA: con el teclado abierto el sistema la tapa sola
     —que es justo lo que el mock reservaba con su franja de 291-336 px— y con
     el teclado cerrado quitarla dejaría al usuario encerrado en la pantalla.
     Dibujar el hueco del teclado a mano sería fingir un teclado que ya existe. */
  function cabecera() {
    var vacio = !Q;
    document.getElementById('cab').innerHTML =
      '<div id="bq" style="height:52px;padding:0 12px;border:1px solid var(--accion);border-radius:8px;' +
      'box-shadow:0 0 0 3px rgba(0,102,177,.12);display:flex;align-items:center;gap:11px;background:#fff">' +
        '<span style="color:var(--accion);flex-shrink:0">' + ico(IC.lupa, 18) + '</span>' +
        '<input id="bq-i" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" ' +
          'placeholder="Nombre, código o teléfono" value="' + H(Q) + '" ' +
          'style="flex:1;min-width:0;border:none;outline:none;font-family:inherit;font-size:14.5px;' +
          'color:var(--tinta);background:none">' +
        '<span id="bq-fin" style="flex-shrink:0;display:flex;align-items:center;gap:10px">' + finDelCampo(vacio) + '</span>' +
      '</div>';

    var i = document.getElementById('bq-i');
    i.addEventListener('input', function () { Q = i.value; forzarTelefono = null; refrescar(); });
    /* En el móvil, «buscar» del teclado solo debe cerrarlo: la lista ya está. */
    i.addEventListener('keydown', function (e) { if (e.key === 'Enter') i.blur(); });
    setTimeout(function () { try { i.focus(); } catch (e) {} }, 30);
  }

  /* Con el campo vacío, el micro. Tecleando, el contador y la cruz de borrar.
     El micro solo aparece si el navegador sabe dictar: un botón que no puede
     hacer su trabajo no se enseña (ley L8). */
  function haySpeech() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }
  function finDelCampo(vacio) {
    if (vacio) {
      return haySpeech()
        ? '<button id="bq-voz" style="color:var(--accion);padding:4px">' + ico(IC.micro, 18) + '</button>' : '';
    }
    var r = B.ultimo || D.buscar(Q);
    return '<span class="mono" style="font-size:12px;color:var(--suave)">' + contador(r) + '</span>' +
           '<button id="bq-x" style="color:var(--raya);padding:4px">' + ico(IC.borrar, 16) + '</button>';
  }

  /* ── el contador ───────────────────────────────────────────────────────────
     C3 · el mock lo escribe de dos formas distintas: en el estado 02 pone
     «5 de 62» sumando personas + operaciones + notas, y en el 07 pone «1 de 9»
     contando solo personas (su grupo tiene una, y hay otra en notas). Las dos
     no pueden ser la misma regla.

     Manda la del 07, porque es la que su propio texto defiende: «el total que
     se enseña es el que se puede ver, si dijera 62 la pantalla estaría
     mintiendo». Así que el contador es PERSONAS ENCONTRADAS de PERSONAS EN LAS
     QUE SE BUSCA — un «N de M» donde las dos mitades cuentan lo mismo. En una
     búsqueda por teléfono el denominador son los números que hay, que es en lo
     que de verdad se está buscando.

     Y el denominador no filtra por agente a mano: es el tamaño del almacén
     local, que desde la tanda 1 de permisos ya viene filtrado por el servidor.
     A Camilo le baja lo suyo, así que su «de M» sale bien sin código extra. */
  function contador(r) {
    if (r.tipo === 'telefono') return r.personas.length + ' de ' + r.alcance.conTelefono;
    if (r.tipo === 'codigo' || r.tipo === 'numero') return '';
    return r.personas.length + ' de ' + r.alcance.personas;
  }

  function refrescar() {
    var r = B.ultimo = forzarTelefono
      ? porTelefonoForzado(forzarTelefono)
      : D.buscar(Q);
    var fin = document.getElementById('bq-fin');
    if (fin) fin.innerHTML = finDelCampo(!Q);
    document.getElementById('cuerpo').innerHTML = cuerpo(r);
    document.getElementById('cuerpo').scrollTop = 0;
  }

  function porTelefonoForzado(dig) {
    var r = D.buscar(dig);
    if (r.tipo === 'telefono') return r;
    /* el usuario eligió «teléfonos que acaben en N» entre las opciones */
    var per = D.clientes().filter(function (p) {
      var t = D.digitos(p.telefono);
      return t.length >= 6 && t.slice(-dig.length) === dig;
    });
    return { q: dig, tipo: 'telefono', personas: per, operaciones: [], notas: [],
             destino: null, opciones: [], sugerencias: [], alcance: D.alcance() };
  }

  /* ═══ el cuerpo, estado por estado ═════════════════════════════════════════ */
  function cuerpo(r) {
    var partes = [];
    if (!enRed()) partes.push(bloqueSinCobertura(r));

    if (r.tipo === 'vacio')          partes.push(ultimoQueTocaste());
    else if (r.tipo === 'codigo')    partes.push(destino(r));
    else if (r.tipo === 'numero')    partes.push(numeroAmbiguo(r));
    else if (r.tipo === 'telefono')  partes.push(porTelefono(r));
    else if (r.tipo === 'nada')      partes.push(sinResultados(r));
    else                             partes.push(grupos(r));

    if (r.tipo !== 'vacio' && D.soloLoTuyo()) partes.push(pieDeAlcance(r));
    return partes.join('');
  }

  /* ── 01 · campo vacío · la que más se ve ────────────────────────────────── */
  function ultimoQueTocaste() {
    var filas = D.recientesTocados(5);
    if (!filas.length) {
      return '<div class="tarjeta" style="padding:20px 18px">' +
        '<div style="font-size:14px;font-weight:500">Todavía no has tocado nada</div>' +
        '<div style="font-size:13px;line-height:1.55;color:var(--suave);margin-top:6px">' +
        'Aquí irá apareciendo lo último, en orden de cuándo. Mientras tanto, ' +
        'escribe un nombre, un código o los últimos dígitos de un teléfono.</div></div>';
    }
    return eyebrow('Lo último que tocaste') +
      '<div class="tarjeta" style="overflow:hidden">' +
      filas.map(function (f, i) {
        return '<button data-ir="' + H(f.ir) + '" class="fila" style="width:100%;text-align:left' +
          (i ? ';border-top:1px solid var(--sep)' : '') + '">' +
          '<span style="flex:1;min-width:0">' +
            '<span style="display:block;font-size:14px">' + H(f.titulo) + '</span>' +
            '<span style="display:block;font-size:12.5px;color:var(--suave);margin-top:1px">' +
              H(f.detalle) + '</span></span>' +
          '<span style="color:var(--raya);flex-shrink:0">' + ico(IC.flecha) + '</span></button>';
      }).join('') + '</div>';
  }

  /* ── 02 · tecleando · varios tipos ──────────────────────────────────────────
     Personas primero, luego operaciones, y las notas al final con la frase que
     coincide. Un grupo vacío no se dibuja. */
  function grupos(r) {
    var out = [];
    if (r.personas.length) out.push(grupoPersonas(r));
    if (r.operaciones.length) out.push(grupoOperaciones(r));
    if (r.notas.length) out.push(grupoNotas(r));
    /* La regla escrita para cuando crezca: si un grupo pasa de veinte, «ver los
       N» y ahí sí entra el filtro dentro del grupo. Con esta cartera no llega. */
    return out.join('');
  }

  function filaPersona(p, q, i) {
    var ops = (p.operaciones || []).filter(function (o) { return !o.pendienteAsignacion && !o.archivado; });
    var tel = p.telefono || '';
    return '<div class="fila" style="' + (i ? 'border-top:1px solid var(--sep)' : '') + '">' +
      '<button data-ir="cliente:' + H(p.id) + '" style="flex:1;min-width:0;text-align:left">' +
        '<span style="display:block;font-size:14px">' + marcar(p.nombre, q) + '</span>' +
        '<span style="display:block;font-size:12.5px;color:var(--suave);margin-top:1px">' +
          H((ops.length ? D.faseDe(ops[0].estado) : 'Sin operación') + ' · ' + (tel ? p.id : 'sin teléfono')) +
        '</span></button>' +
      /* Llamar está en la FILA: si buscas a alguien porque te está llamando,
         entrar a la ficha para pulsar «llamar» es un paso de más. Y quien no
         tiene número lo dice antes de entrar — hoy son muchos. */
      (tel
        ? '<a href="tel:' + H(D.digitos(tel)) + '" style="width:38px;height:38px;border-radius:50%;' +
          'background:#eef3fa;color:var(--accion);display:flex;align-items:center;justify-content:center;' +
          'flex-shrink:0">' + ico(IC.llamar, 17) + '</a>'
        : '<span style="color:var(--raya);flex-shrink:0">' + ico(IC.flecha) + '</span>') +
      '</div>';
  }

  function grupoPersonas(r) {
    return eyebrow('Personas', r.personas.length) +
      '<div class="tarjeta" style="overflow:hidden;margin-bottom:14px">' +
      r.personas.slice(0, 20).map(function (p, i) { return filaPersona(p, r.q, i); }).join('') +
      '</div>';
  }

  function grupoOperaciones(r) {
    return eyebrow('Operaciones', r.operaciones.length) +
      '<div class="tarjeta" style="overflow:hidden;margin-bottom:14px">' +
      r.operaciones.slice(0, 20).map(function (o, i) {
        return '<button data-ir="cliente:' + H(o.clienteId) + '" class="fila" style="width:100%;text-align:left' +
          (i ? ';border-top:1px solid var(--sep)' : '') + '">' +
          '<span style="flex:1;min-width:0">' +
            '<span style="display:block;font-size:14px">' +
              (o.codigo ? '<span class="mono">' + marcar(o.codigo, r.q) + '</span> · ' : '') +
              marcar(o.cliente, r.q) + '</span>' +
            '<span style="display:block;font-size:12.5px;color:var(--suave);margin-top:1px">' +
              H(D.faseDe(o.estado) + (o.entidad ? ' · ' + o.entidad : '')) + '</span></span>' +
          '<span style="color:var(--raya);flex-shrink:0">' + ico(IC.flecha) + '</span></button>';
      }).join('') + '</div>';
  }

  function grupoNotas(r) {
    return eyebrow('En notas de actividad', r.notas.length) +
      '<div style="display:flex;flex-direction:column;gap:8px">' +
      r.notas.map(function (s) {
        var t = I.tipo(s.tipo);
        return '<button data-ir="' + (s.personaId ? 'cliente:' + H(s.personaId) : 'agenda') + '" ' +
          'class="tarjeta" style="padding:12px 14px;text-align:left;width:100%">' +
          '<span style="display:flex;align-items:center;gap:8px">' +
            '<span style="font-size:12.5px;font-weight:500;color:' + t.c + '">' + H(t.l) + '</span>' +
            '<span style="font-size:12.5px;color:var(--suave)">· ' +
              H(s.hora ? s.hora + ' del ' + D.diaMes(s.fecha) : D.diaMes(s.fecha)) + '</span>' +
            '<span class="mono" style="margin-left:auto;font-size:11px;color:var(--tenue)">' + H(s.id) + '</span>' +
          '</span>' +
          /* la FRASE donde aparece el término, no solo el nombre: buscar
             «Sabadell» tiene que devolver la llamada */
          '<span style="display:block;font-size:13.5px;line-height:1.5;color:rgba(22,33,62,.78);margin-top:6px">«' +
            marcar(s.texto, r.q) + '»</span>' +
          (s.quien ? '<span style="display:block;font-size:12px;color:var(--suave);margin-top:5px">' +
            H(s.quien) + '</span>' : '') +
          '</button>';
      }).join('') + '</div>';
  }

  /* ── 03 · un código es un destino ───────────────────────────────────────── */
  function destino(r) {
    var d = r.destino;
    if (!d) {
      return '<div class="tarjeta" style="padding:20px 18px">' +
        '<div style="font-size:14px;font-weight:500">Ese código no existe todavía</div>' +
        '<div style="font-size:13px;line-height:1.55;color:var(--suave);margin-top:6px">' +
        'Se ha buscado ' + H(r.q.toUpperCase()) + ' entre ' + r.alcance.personas + ' personas, ' +
        r.alcance.operaciones + ' operaciones y ' + r.alcance.notas + ' actividades. ' +
        'Los códigos no se reciclan, así que si te lo han dictado puede que esté escrito de otra forma.</div></div>';
    }
    return '<div class="eyebrow" style="margin-bottom:8px">Es un código · destino único</div>' +
      '<div class="tarjeta" style="padding:18px 18px 16px">' +
        '<div style="font-size:12px;color:var(--suave)">' + H(d.que) + '</div>' +
        '<div class="serif" style="font-size:21px;font-weight:500;line-height:1.25;margin-top:4px">' +
          H(d.titulo) + '</div>' +
        (d.detalle ? '<div style="font-size:13px;color:var(--suave);margin-top:5px">' + H(d.detalle) + '</div>' : '') +
        '<div class="mono" style="font-size:11.5px;color:var(--tenue);margin-top:9px">' + H(d.codigo) + '</div>' +
        '<button data-ir="' + H(d.ir) + '" class="b-primario" style="width:100%;margin-top:15px">' +
          H(d.cta) + '</button>' +
      '</div>';
  }

  /* ── 03b · el número suelto no se adivina ────────────────────────────────── */
  function numeroAmbiguo(r) {
    return '<div style="font-size:13.5px;line-height:1.6;color:rgba(22,33,62,.7);margin-bottom:12px">' +
      'Si tecleas solo «' + H(r.q) + '» no se adivina: hay más de una cosa que puede ser.</div>' +
      '<div class="tarjeta" style="overflow:hidden">' +
      r.opciones.map(function (o, i) {
        return '<button ' + (o.clase === 'telefono'
            ? 'data-tel="' + H(r.q) + '"' : 'data-ir="' + H(o.ir) + '"') +
          ' class="fila" style="width:100%;text-align:left' + (i ? ';border-top:1px solid var(--sep)' : '') + '">' +
          '<span style="flex:1;min-width:0">' +
            '<span class="mono" style="display:block;font-size:13px;color:var(--accion)">' + H(o.codigo) + '</span>' +
            '<span style="display:block;font-size:13.5px;margin-top:2px">' + H(o.titulo) + '</span>' +
            (o.detalle ? '<span style="display:block;font-size:12.5px;color:var(--suave);margin-top:1px">' +
              H(o.detalle) + '</span>' : '') + '</span>' +
          '<span style="color:var(--raya);flex-shrink:0">' + ico(IC.flecha) + '</span></button>';
      }).join('') + '</div>';
  }

  /* ── 04 · un teléfono · últimos dígitos ─────────────────────────────────── */
  function porTelefono(r) {
    var A = r.alcance;
    return eyebrow('Termina en ' + r.q) +
      (r.personas.length
        ? '<div style="display:flex;flex-direction:column;gap:8px">' + r.personas.map(function (p) {
            var ops = (p.operaciones || []).filter(function (o) { return !o.pendienteAsignacion && !o.archivado; });
            return '<div class="tarjeta" style="padding:15px 16px">' +
              '<div style="font-size:15px;font-weight:500">' + H(p.nombre) + '</div>' +
              '<div class="mono" style="font-size:13px;color:var(--accion);margin-top:3px">' + H(D.telefono(p.telefono)) + '</div>' +
              '<div style="font-size:12.5px;color:var(--suave);margin-top:3px">' +
                H(ops.length ? D.faseDe(ops[0].estado) : 'Sin operación') + '</div>' +
              '<div style="display:flex;gap:8px;margin-top:13px">' +
                '<a href="tel:' + H(D.digitos(p.telefono)) + '" class="b-primario" style="flex:1;text-decoration:none">' +
                  ico(IC.llamar, 17) + 'Llamar</a>' +
                '<button data-ir="cliente:' + H(p.id) + '" class="b-secundario" style="flex:1">Abrir ficha</button>' +
              '</div></div>';
          }).join('') + '</div>'
        : '<div class="tarjeta" style="padding:18px 16px;font-size:13.5px;line-height:1.55;color:var(--suave)">' +
          'Ningún número acaba en ' + H(r.q) + '.</div>') +
      /* el alcance, dicho y no dejado a adivinar */
      '<div style="font-size:12.5px;line-height:1.6;color:var(--suave);margin-top:12px">' +
      'Busca en los ' + A.conTelefono + ' números que hay. Las otras ' + A.sinTelefono +
      ' personas del CRM no tienen teléfono, así que por aquí no aparecerán nunca.</div>';
  }

  /* ── 05 · sin resultados · con salida ───────────────────────────────────── */
  function sinResultados(r) {
    var A = r.alcance;
    return '<div class="tarjeta" style="padding:20px 18px">' +
        '<div class="serif" style="font-size:18px;font-weight:500;line-height:1.3">No hay nadie que se llame así</div>' +
        '<div style="font-size:13px;line-height:1.6;color:var(--suave);margin-top:8px">' +
          'Se ha buscado en ' + A.personas + ' personas, ' + A.operaciones + ' operaciones y ' +
          A.notas + ' notas. Si te acaba de dar el número, lo suyo es crearlo ahora.</div>' +
        /* la misma salida que ya da Capturar: lo tecleado se convierte en el
           lead, con el nombre puesto */
        '<button data-lead="' + H(r.q) + '" class="b-primario" style="width:100%;margin-top:15px">' +
          ico(IC.mas, 18) + 'Crear lead «' + H(r.q) + '»</button>' +
        '<div style="font-size:12px;color:var(--tenue);margin-top:8px;text-align:center">' +
          'El nombre ya va puesto: solo falta el teléfono.</div>' +
      '</div>' +
      (r.sugerencias.length
        ? '<div style="margin-top:14px">' + eyebrow('¿Querías decir?') +
          '<div class="tarjeta" style="overflow:hidden">' + r.sugerencias.map(function (p, i) {
            var roles = (p.roles || []).indexOf('colaborador') >= 0 ? 'Colaborador · no es cliente'
                      : ((p.operaciones || []).length ? D.faseDe(p.operaciones[0].estado) : 'Sin operación');
            return '<button data-ir="cliente:' + H(p.id) + '" class="fila" style="width:100%;text-align:left' +
              (i ? ';border-top:1px solid var(--sep)' : '') + '">' +
              '<span style="flex:1;min-width:0"><span style="display:block;font-size:14px">' + H(p.nombre) + '</span>' +
              '<span style="display:block;font-size:12.5px;color:var(--suave);margin-top:1px">' + H(roles) + '</span></span>' +
              '<span style="color:var(--raya);flex-shrink:0">' + ico(IC.flecha) + '</span></button>';
          }).join('') + '</div></div>'
        : '');
  }

  /* ── 06 · sin cobertura · alcance declarado ─────────────────────────────────
     «No bajado» no es «no existe», así que se dice cuánto hay bajado. Los dos
     números se CUENTAN (C1: el mock declaraba 40 actividades de las dos últimas
     semanas y son bastantes menos) — si el número que declara el alcance está
     inflado, el mecanismo de honestidad es justo lo que miente. */
  function bloqueSinCobertura(r) {
    var A = r.alcance;
    return '<div class="tarjeta" style="padding:14px 15px;border-color:#e8dcc4;background:#fdfaf3;margin-bottom:14px">' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<span style="color:var(--aviso)">' + ico(IC.nube, 16) + '</span>' +
        '<span style="font-size:13px;font-weight:500;color:var(--aviso)">Buscando solo en lo descargado</span></div>' +
      '<div style="font-size:12.5px;line-height:1.6;color:rgba(22,33,62,.7);margin-top:7px">' +
        A.personas + ' personas y las ' + A.notasRecientes + ' actividades de las dos últimas semanas ' +
        'están en el móvil. Las notas más viejas y los documentos, no.</div>' +
      /* L8: lo que no se puede hacer se apaga y se explica, nunca un botón que
         falla. Sin red no hay «buscar en todo» que valga. */
      '<button disabled class="b-secundario" style="width:100%;margin-top:11px;opacity:.5;cursor:default">' +
        'Buscar en todo · necesita cobertura</button>' +
      '</div>';
  }

  /* ── 07 · lo ve Camilo ──────────────────────────────────────────────────────
     Lo que no lleva él no aparece: ni como fila apagada ni como hueco. Y se
     dice cuánto, porque un contador que dijera 62 estaría mintiendo sobre lo
     que hay detrás. El número sale del almacén local, que el servidor ya filtró. */
  function pieDeAlcance(r) {
    return '<div style="font-size:12.5px;line-height:1.6;color:var(--suave);margin-top:14px">' +
      'Buscas en tus ' + r.alcance.personas + ' clientes y en sus notas. ' +
      'Los del resto del equipo no salen — ni como fila apagada ni como hueco: si no es tuyo, no está.</div>';
  }

  /* ── dictado · dentro del campo ────────────────────────────────────────────
     Dictar «Núria Ferrer» es más rápido que teclearlo de pie. Lo que diga el
     teléfono entra como texto tecleado y se busca igual: no hay pantalla de voz. */
  function dictar() {
    var R = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!R) return;
    var rec = new R();
    rec.lang = 'es-ES'; rec.interimResults = false; rec.maxAlternatives = 1;
    var caja = document.getElementById('bq');
    if (caja) caja.style.boxShadow = '0 0 0 3px rgba(0,102,177,.30)';
    rec.onresult = function (e) {
      Q = (e.results[0][0].transcript || '').trim();
      var i = document.getElementById('bq-i');
      if (i) i.value = Q;
      refrescar();
    };
    rec.onerror = function (e) { console.warn('[app] dictado:', e.error); };
    rec.onend = function () { if (caja) caja.style.boxShadow = '0 0 0 3px rgba(0,102,177,.12)'; };
    try { rec.start(); } catch (e) { console.warn('[app] dictado no arranca:', e.message); }
  }

  /* ── clics propios de la sección ──────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    if (!document.getElementById('bq')) return;      // no estamos en Buscar
    if (e.target.closest('#bq-voz')) { dictar(); return; }
    if (e.target.closest('#bq-x')) {
      Q = ''; forzarTelefono = null;
      var i = document.getElementById('bq-i');
      if (i) { i.value = ''; try { i.focus(); } catch (x) {} }
      refrescar(); return;
    }
    var t = e.target.closest('[data-tel]');
    if (t) { forzarTelefono = t.getAttribute('data-tel'); refrescar(); return; }
    var l = e.target.closest('[data-lead]');
    if (l) {
      /* la salida honesta del mock: lo tecleado ES el lead. Se abre Capturar
         por su puerta de lead con el nombre ya puesto. */
      window.AJapp.capturar.abrir();
      window.AJapp.capturar.aLead(l.getAttribute('data-lead'));
      return;
    }
  });

  window.AJapp.buscar = {
    pintar: function () { Q = ''; forzarTelefono = null; B.ultimo = null; cabecera(); refrescar(); },
    /* para los tests: el motor y el contador, sin DOM de por medio */
    contador: contador, marcar: marcar
  };
})();
