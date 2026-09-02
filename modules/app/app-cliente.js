/* ═══════════════════════════════════════════════════════════════════════════
   App AJ Finances · 03 · Cliente — port 1:1 de «App Cliente v2.dc.html»

   La v2 deja de ser un scroll único y pasa a PORTADA + APARTADOS: la portada
   es un menú (quién es, la operación, y una fila por apartado con su pista de
   estado), y cada apartado se abre en su propia pantalla con vuelta atrás.

   Apartados: Portada · Operación · Expediente · Finanzas · Datos · Historial.
   PEDIDOS SE APARCA (decisión Jonatan): no se lista ni se construye todavía;
   pedidos es una entidad de Inmo (preferencias de búsqueda), no de Finances.

   Se conservan las tres correcciones del brief v1:
     C1 · los requisitos del expediente son ACUMULADOS por fase, y si no se
          sabe, se dice; no se inventa un número.
     C2 · la tira de después de la llamada no puede saber la duración: solo
          aparece si la llamada salió de aquí, y sin minutos.
     C3 · llamar y escribir son el mismo permiso.

   Divergencias honestas con el mock: los campos que el modelo NO guarda hoy
   (ingresos/contrato/hijos/estado civil POR TITULAR, fechas por fase, ofertas
   de bancos) no se dibujan con cifras inventadas — se muestran los que hay y
   se calla lo que no. Un apartado sin dato dice qué falta, no un hueco.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var D = window.AJapp.datos, I = window.AJapp.inicio;
  var H = I.H, svg = I.svg, pill = I.pill, tipo = I.tipo;
  var actual = null, apart = 'portada';

  var FASE = {
    primer_contacto:'Primer contacto', segundo_contacto:'Segundo contacto',
    estudio:'En estudio', documentacion:'Documentación', encargo:'Encargo',
    enviado_banco:'En el banco', paga_y_senal:'Paga y señal', arras:'Arras',
    tasacion:'Tasación', FEIN:'FEIN recibida', firma:'Firma',
    perdido:'Perdida', descartado:'Descartado'
  };

  function persona(id) {
    var c = D.clientes().filter(function (x) { return x.id === id; })[0];
    if (!c) return null;
    var ops = (c.operaciones || []).filter(function (o) { return !o.pendienteAsignacion && !o.archivado; });
    var viva = ops.filter(function (o) { return ['perdido','descartado','firma'].indexOf(o.estado) < 0; })[0] || ops[0] || null;
    var segs = [];
    try {
      segs = (AJ.seguimientos.listar({}) || []).filter(function (s) {
        return s.personaId === id || s.entidadId === id;
      }).sort(function (a, b) { return String(b.fecha||'').localeCompare(String(a.fecha||'')); });
    } catch (e) {}
    return { c: c, op: viva, ops: ops, segs: segs };
  }

  /* ── cabeceras ──────────────────────────────────────────────────────────────
     Portada: nombre + fase + quién la lleva + acciones de contacto (C3).
     Sub-apartado: vuelta atrás + «Nombre · apartado». */
  var ROM = ['I','II','III','IV','V','VI'];
  function cap(n, label, opts) {
    opts = opts || {};
    return '<div style="display:flex;align-items:baseline;gap:9px;' + (opts.primero ? '' : 'padding-bottom:8px;border-bottom:1px solid var(--filete);') + '">' +
      '<span class="rubrica">' + ROM[n] + '</span>' +
      '<div style="flex:1;min-width:0" class="eyebrow' + (opts.faint ? ' faint' : '') + '">' + H(label) + '</div>' +
      (opts.link ? '<span data-apart="' + H(opts.link[1]) + '" style="font-size:12.5px;font-weight:500;color:var(--accion)">' + H(opts.link[0]) + '</span>' : '') +
      '</div>';
  }

  /* ── V15 · cabecera portada · banda navy a sangre (gesto ritual) ─────────── */
  function cabPortada(p) {
    var fase = p.op ? (FASE[p.op.estado] || p.op.estado) : 'sin operación';
    var dias = p.segs.length ? Math.round((new Date(D.hoyISO()) - new Date(p.segs[0].fecha)) / 864e5) : null;
    return '<div style="display:flex;align-items:center;gap:12px;height:34px">' +
        '<button data-ir="clientes" style="color:rgba(255,255,255,.7);flex-shrink:0;margin-left:-6px">' + svg('chevron',20) + '</button>' +
        '<div style="flex:1;min-width:0">' +
          '<span style="font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.6)">' + H('Cliente · ' + (p.op && p.op.codigo ? p.op.codigo : p.c.id)) + '</span></div>' +
        '<img src="icono-192.png" alt="AJ" style="width:26px;height:26px;opacity:.95;flex-shrink:0">' +
      '</div>' +
      '<div class="serif" style="font-size:26px;font-weight:500;letter-spacing:-.015em;line-height:1.1;margin-top:12px;color:#fff;text-wrap:balance">' + H(p.c.nombre) + '</div>' +
      '<div style="display:flex;align-items:baseline;gap:9px;margin-top:7px">' +
        '<span class="serif" style="font-style:italic;font-size:15px;color:rgba(255,255,255,.82)">' + H(fase) + '</span>' +
        '<span style="flex:1;height:1px;background:rgba(255,255,255,.22)"></span>' +
        (dias != null ? '<span class="mono" style="font-size:11.5px;color:rgba(255,255,255,.6)">' + dias + ' d</span>' : '') +
      '</div>';
  }
  function cabSub(p, titulo) {
    return '<div style="display:flex;align-items:center;gap:12px">' +
      '<button data-volver="1" style="color:var(--suave);flex-shrink:0;margin-left:-6px">' + svg('chevron',20) + '</button>' +
      '<div style="flex:1;min-width:0">' +
        '<div class="eyebrow">' + H(titulo) + '</div>' +
        '<div class="serif" style="font-size:20px;font-weight:500;line-height:1.15;margin-top:2px">' + H(p.c.nombre) + '</div>' +
      '</div></div>';
  }

  /* ── portada · I · La operación (resumen + cifras en columnas) ───────────── */
  function colFig(label, valor) {
    return '<div style="flex:1;padding:11px 12px 0;border-left:1px solid var(--sep)">' +
      '<div class="mono" style="font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--tenue)">' + H(label) + '</div>' +
      '<div class="mono" style="font-size:16px;margin-top:4px">' + valor + '</div></div>';
  }
  function opCard(p) {
    if (!p.op) return bloqueOrigen(p);
    var o = p.op;
    var cq = (function () { var l = []; try { l = D.cuadresDe(p.c.uuid) || []; } catch (e) {} return l.filter(function (x) { return x.vigente; })[0] || l[0] || null; })();
    var k = cq ? D.calcularCuadre(cq) : null;
    var linea = [o.producto, o.entidad].filter(Boolean).join(' · ') || (o.entidad || '');
    var cols = '';
    if (o.precioCompra) cols += colFig('Compra', H(D.euros(o.precioCompra).replace(' €','')));
    if (o.importe) cols += colFig('Hipoteca', H(D.euros(o.importe).replace(' €','')));
    if (k && (k.cuotaFija || k.cuotaVariable)) cols += colFig('Cuota',
      H(k.cuotaFija ? String(k.cuotaFija) : '') + (k.cuotaVariable ? '<span style="color:var(--tenue)">/</span>' + k.cuotaVariable : ''));
    /* la primera columna no lleva filete izquierdo */
    cols = cols.replace('border-left:1px solid var(--sep)', 'border-left:none');
    return '<div>' + cap(0, 'La operación', { primero: true }) +
      '<button data-apart="operacion" style="width:100%;text-align:left;display:flex;align-items:flex-start;gap:9px;padding:11px 0 0">' +
        '<div style="flex:1;min-width:0">' +
          (o.producto ? '<div class="serif" style="font-size:19px;font-weight:500;line-height:1.2">' + H(o.producto) + '</div>' : '') +
          (linea || o.codigo ? '<div style="font-size:13px;color:var(--suave);margin-top:2px">' + H(o.entidad ? o.entidad + ' · ' + (o.codigo || '') : (o.codigo || '')) + '</div>' : '') +
        '</div><span style="color:var(--tenue);flex-shrink:0;padding-top:3px">' + svg('chevron',16) + '</span></button>' +
      (cols ? '<div style="display:flex;margin-top:16px;border-top:1px solid var(--sep)">' + cols + '</div>' : '') +
      '</div>';
  }

  /* ── portada · II · Su ficha (filas numeradas con su estado) ─────────────── */
  function filaFicha(num, ap, label, hint, hintCol) {
    return '<button data-apart="' + ap + '" style="width:100%;text-align:left;display:flex;align-items:center;gap:13px;padding:13px 0;border-bottom:1px solid var(--sep)">' +
      '<span class="mono" style="font-size:11px;color:var(--navy);width:18px;flex-shrink:0">' + num + '</span>' +
      '<span style="flex:1;min-width:0;font-size:15px">' + H(label) + '</span>' +
      (hint ? '<span class="mono" style="font-size:11.5px;color:' + (hintCol || 'var(--suave)') + '">' + H(hint) + '</span>' : '') +
      '<span style="color:var(--tenue);flex-shrink:0">' + svg('chevron',15) + '</span></button>';
  }
  function menuApartados(p) {
    var filas = '';
    /* 01 Operación */
    if (p.op) {
      var pos = -1; LADDER.forEach(function (l, i) { if (l[1].indexOf(p.op.estado) >= 0) pos = i; });
      filas += filaFicha('01', 'operacion', 'Operación', pos >= 0 ? 'fase ' + (pos + 1) + ' de ' + LADDER.length : null, 'var(--suave)');
    }
    /* 02 Expediente */
    if (p.op) {
      var e = D.expediente(p.op.estado), tiene = D.documentosDe(p.c.id);
      var hechos = tiene == null ? null : tiene.length, total = e ? e.total : null;
      var faltan = (hechos == null || total == null) ? null : Math.max(0, total - hechos);
      filas += filaFicha('02', 'expediente', 'Expediente',
        total == null ? 'con sesión' : (faltan ? faltan + ' huecos' : 'completo'),
        faltan ? 'var(--aviso)' : 'var(--suave)');
    }
    /* 03 Finanzas */
    var cq = (function () { var l = []; try { l = D.cuadresDe(p.c.uuid) || []; } catch (e) {} return l.filter(function (x) { return x.vigente; })[0] || l[0] || null; })();
    var k = cq ? D.calcularCuadre(cq) : null;
    filas += filaFicha('03', 'finanzas', 'Finanzas', k && k.end != null ? k.end + ' %' : (D.cuotaDe(p.c.uuid || p.c.id) ? 'con estudio' : 'sin estudio'), 'var(--suave)');
    /* 04 Datos */
    var sinNif = (p.op && p.op.titulares || []).filter(function (t) { return !t.dni; });
    var nT = (p.op && p.op.titulares || []).length;
    filas += filaFicha('04', 'datos', 'Datos',
      sinNif.length ? 'falta NIF' : (nT ? nT + (nT === 1 ? ' titular' : ' titulares') : 'contacto'),
      sinNif.length ? 'var(--aviso)' : 'var(--suave)');
    /* 05 Historial */
    filas += filaFicha('05', 'historial', 'Historial', p.segs.length ? String(p.segs.length) : '0', 'var(--suave)');

    return '<div>' + cap(1, 'Su ficha', { faint: true }) + filas + '</div>';
  }

  /* ── portada · el pie con las acciones de contacto ───────────────────────── */
  function pieContacto(p) {
    var tel = (p.c.telefono || '').trim();
    var ult = p.segs[0];
    var cuando = ult ? (ult.fecha === D.hoyISO() ? 'hoy' : 'el ' + D.diaMes(ult.fecha)) : null;
    var meta = ult ? (tipo(ult.tipo).l.toLowerCase() + (ult.duracion_min ? ' · ' + (ult.duracion_min >= 60 ? Math.round(ult.duracion_min/60) + ' h' : ult.duracion_min + ' min') : '')) : '';
    var acciones = tel
      ? '<a href="tel:' + H(tel.replace(/\s/g,'')) + '" data-llamada="1" class="b-primario" style="flex:1;text-decoration:none">' + svg('llamar',18) + 'Llamar</a>' +
        '<a href="https://wa.me/' + H(tel.replace(/[^0-9]/g,'')) + '" target="_blank" rel="noopener" class="b-secundario" style="width:50px;color:var(--exito);display:inline-flex;align-items:center;justify-content:center;text-decoration:none">' + svg('whatsapp',19) + '</a>' +
        '<button class="b-secundario" style="flex:1" data-accion="registrar">Apuntar</button>'
      : '<button class="b-primario" style="flex:1" data-accion="anadir-telefono">' + svg('mas',18) + 'Añadir teléfono</button>' +
        '<button class="b-secundario" style="flex:1" data-accion="registrar">Apuntar</button>';
    return '<div style="margin-top:auto">' +
      (cuando ? '<div style="display:flex;align-items:center;gap:9px;padding:11px 0;border-top:1px solid var(--filete)">' +
        '<span class="serif" style="font-style:italic;font-size:13.5px;color:var(--navy)">última vez, ' + H(cuando) + '</span>' +
        '<span style="flex:1"></span><span class="mono" style="font-size:11.5px;color:var(--tenue)">' + H(meta) + '</span></div>' : '') +
      '<div style="display:flex;gap:9px">' + acciones + '</div></div>';
  }

  /* ── APARTADO · Operación ───────────────────────────────────────────────── */
  var LADDER = [
    ['Primer contacto', ['primer_contacto','segundo_contacto']],
    ['Estudio', ['estudio','documentacion']],
    ['Encargo firmado', ['encargo']],
    ['En el banco', ['enviado_banco','paga_y_senal','arras','tasacion']],
    ['FEIN y firma', ['FEIN','firma']]
  ];
  function apOperacion(p) {
    if (!p.op) return '<div class="tarjeta" style="padding:16px">Esta persona no tiene operación abierta.</div>';
    var o = p.op;
    var pos = -1;
    LADDER.forEach(function (l, i) { if (l[1].indexOf(o.estado) >= 0) pos = i; });

    /* Está esperando · sin narrativa inventada: la fase y qué la desbloquea */
    var esperando = '<div class="tarjeta sombra" style="padding:15px 16px;border-left:3px solid var(--aviso)">' +
      '<div class="eyebrow" style="color:var(--aviso)">Está en</div>' +
      '<div class="serif" style="font-size:19px;font-weight:500;margin-top:6px">' + H(FASE[o.estado] || o.estado) + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:13px">' +
        '<button class="b-primario" style="flex:1" data-accion="registrar">' + svg('mas',18) + 'Apuntar novedad</button>' +
      '</div></div>';

    /* Las fases · escalera canónica, la actual marcada. Fechas solo donde se saben. */
    var fechas = {};
    if (o.fechaFirma) fechas[4] = o.fechaFirma;
    if (o.fein && o.fein.fechaRecepcion) fechas[4] = fechas[4] || o.fein.fechaRecepcion;
    var escalera = '<div><div class="eyebrow" style="margin-bottom:8px">Las fases</div>' +
      '<div class="tarjeta" style="overflow:hidden">' + LADDER.map(function (l, i) {
        var estado = i < pos ? 'hecha' : i === pos ? 'ahora' : 'pendiente';
        var col = estado === 'ahora' ? 'var(--accion)' : estado === 'hecha' ? 'var(--exito)' : 'var(--raya)';
        return '<div style="display:flex;align-items:center;gap:11px;padding:11px 14px;' + (i ? 'border-top:1px solid var(--sep);' : '') + '">' +
          '<span style="width:9px;height:9px;border-radius:50%;background:' + col + ';flex-shrink:0"></span>' +
          '<span style="flex:1;font-size:13.5px;' + (estado === 'ahora' ? 'font-weight:600' : estado === 'pendiente' ? 'color:var(--suave)' : '') + '">' + H(l[0]) + '</span>' +
          (fechas[i] ? '<span class="mono" style="font-size:11.5px;color:var(--tenue)">' + H(D.diaMes(fechas[i])) + '</span>' :
            estado === 'ahora' ? '<span style="font-size:11.5px;color:var(--accion)">ahora</span>' : '') +
        '</div>';
      }).join('') + '</div></div>';

    /* Los números · de la operación y del cuadre vigente */
    var cq = (function () { var l = []; try { l = D.cuadresDe(p.c.uuid) || []; } catch (e) {} return l.filter(function (x) { return x.vigente; })[0] || l[0] || null; })();
    var k = cq ? D.calcularCuadre(cq) : null;
    var numeros = [];
    if (o.precioCompra || o.importe) numeros.push(['Compra · hipoteca',
      [o.precioCompra ? D.euros(o.precioCompra) : null, o.importe ? D.euros(o.importe) : null].filter(Boolean).join(' · ')]);
    if (k && (k.cuotaFija || k.cuotaVariable)) numeros.push(['Cuota',
      [k.cuotaFija ? D.euros(k.cuotaFija) : null, k.cuotaVariable ? D.euros(k.cuotaVariable) : null].filter(Boolean).join(' y ')]);
    if (o.honorarios) numeros.push(['Honorarios AJ', D.euros(o.honorarios)]);
    var numerosH = numeros.length ? '<div><div class="eyebrow" style="margin-bottom:8px">Los números</div>' +
      '<div class="tarjeta" style="overflow:hidden">' + numeros.map(function (n, i) {
        return '<div class="fila" style="' + (i ? 'border-top:1px solid var(--sep)' : '') + '">' +
          '<span style="flex:1;font-size:13px;color:var(--suave)">' + H(n[0]) + '</span>' +
          '<span class="mono" style="font-size:13.5px;font-weight:500">' + H(n[1]) + '</span></div>';
      }).join('') + '</div></div>' : '';

    var pie = '<div style="margin-top:auto;display:flex;gap:8px">' +
      '<button class="b-secundario" style="flex:1" data-ir="cuadre:' + H(p.c.id) + '">' + svg('barras',18) + 'Ver el cuadre</button>' +
      '<button class="b-secundario" style="flex:1" data-cambiar-fase="' + H(o.id) + '">Cambiar de fase</button></div>';

    return esperando + escalera + numerosH + pie;
  }

  /* ── APARTADO · Expediente ──────────────────────────────────────────────── */
  function apExpediente(p) {
    var cuerpo = bloqueExpediente(p) ||
      '<div class="tarjeta" style="padding:16px">Sin operación no hay expediente.</div>';
    return cuerpo +
      '<div style="margin-top:auto"><button class="b-secundario" style="width:100%" data-ir="capturar">' +
      svg('doc',18) + 'Subir un documento con la cámara</button></div>';
  }

  /* ── APARTADO · Finanzas · se LEE, el estudio se abre aparte ─────────────── */
  function apFinanzas(p) {
    var cuota = bloqueCuota(p);
    var cq = (function () { var l = []; try { l = D.cuadresDe(p.c.uuid) || []; } catch (e) {} return l.filter(function (x) { return x.vigente; })[0] || l[0] || null; })();
    var k = cq ? D.calcularCuadre(cq) : null;
    var extra = '';
    if (k) {
      var filas = [];
      if (k.tiene != null || k.aportacion != null) filas.push(['Tiene que poner',
        (k.aportacion != null ? D.euros(k.aportacion) : '—') + (k.hueco > 0 ? ' · faltan ' + D.euros(k.hueco) : (k.hueco != null ? ' · le llega' : ''))]);
      if (k.end != null) filas.push(['Endeudamiento', k.end + ' %']);
      if (k.ltv != null) filas.push(['Financiación', k.ltv + ' %']);
      if (filas.length) extra = '<div><div class="eyebrow" style="margin-bottom:8px">El estudio</div>' +
        '<div class="tarjeta" style="overflow:hidden">' + filas.map(function (f, i) {
          return '<div class="fila" style="' + (i ? 'border-top:1px solid var(--sep)' : '') + '">' +
            '<span style="flex:1;font-size:13px;color:var(--suave)">' + H(f[0]) + '</span>' +
            '<span class="mono" style="font-size:13.5px;font-weight:500">' + H(f[1]) + '</span></div>';
        }).join('') + '</div></div>';
    }
    /* Escenarios · cada cuadre de la persona es un escenario (distinto LTV/precio).
       Se enseñan los dos primeros (el vigente arriba) y se dice cuántos más hay;
       tocar uno lo abre. Dato real, no inventado. */
    var lista = []; try { lista = D.cuadresDe(p.c.uuid) || []; } catch (e) {}
    lista = lista.slice().sort(function (a, b) { return (b.vigente ? 1 : 0) - (a.vigente ? 1 : 0); });
    var esc = '';
    if (lista.length) {
      var muestra = lista.slice(0, 2), mas = lista.length - muestra.length;
      esc = '<div><div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px">' +
        '<span class="eyebrow">Escenarios · ' + lista.length + '</span></div>' +
        '<div class="tarjeta" style="overflow:hidden">' + muestra.map(function (cu, i) {
          var kk = D.calcularCuadre(cu);
          var det = kk.subrogacion ? 'se ahorra ' + D.euros(kk.ahorroNeto)
                  : 'pone ' + D.euros(kk.aportacion) + (kk.cuotaFija ? ' · ' + D.euros(kk.cuotaFija) + '/mes' : '');
          return '<button data-ir="cuadre:' + H(p.c.id) + '" style="width:100%;text-align:left;display:flex;align-items:center;gap:11px;padding:12px 14px;' +
            (i ? 'border-top:1px solid var(--sep);' : '') + '">' +
            '<span style="flex:1;min-width:0">' +
              '<span style="display:block;font-size:13.5px;font-weight:500">' + H((kk.ltv != null ? kk.ltv + ' % financiado' : (cu.codigo || 'Escenario ' + (i + 1)))) + '</span>' +
              '<span style="display:block;font-size:12px;color:var(--suave);margin-top:1px">' + H(det) + '</span></span>' +
            (cu.vigente ? pill('var(--exito)', 'vigente') : '') +
            '<span style="color:var(--raya);flex-shrink:0">' + svg('chevron',16) + '</span></button>';
        }).join('') + (mas > 0 ? '<div style="padding:10px 14px;border-top:1px solid var(--sep);font-size:12.5px;color:var(--suave)">' + mas + ' más</div>' : '') +
        '</div></div>';
    }

    var nota = '<div style="font-size:12px;line-height:1.55;color:var(--tenue);text-align:center;padding:2px 8px">' +
      'Aquí no se toca ningún número: para mover algo, se abre el estudio. Los bancos y sus ofertas viven en el CRM.</div>';
    var pie = '<div style="margin-top:auto"><button class="b-primario" style="width:100%" data-ir="' +
      (cq ? 'cuadre:' : 'cuadre-nuevo:') + H(p.c.id) + '">' + svg('barras',18) + 'Abrir el estudio completo</button></div>';
    return cuota + extra + esc + nota + pie;
  }

  /* ── APARTADO · Datos ───────────────────────────────────────────────────── */
  function apDatos(p) {
    var cq = (function () { var l = []; try { l = D.cuadresDe(p.c.uuid) || []; } catch (e) {} return l.filter(function (x) { return x.vigente; })[0] || l[0] || null; })();
    var k = cq ? D.calcularCuadre(cq) : null;
    var out = '';

    /* Falta el NIF · qué titular no tiene DNI (del propio op.titulares). Es el
       dato que más frena una firma, así que se avisa arriba con un «Pedirlo». */
    var sinNif = (p.op && p.op.titulares || []).filter(function (t) { return !t.dni; });
    if (sinNif.length) {
      out += '<div class="tarjeta" style="padding:13px 14px;border-left:3px solid var(--aviso);display:flex;align-items:center;gap:11px">' +
        '<div style="flex:1;min-width:0;font-size:13.5px;line-height:1.4">Falta el NIF de ' +
          H(sinNif.map(function (t) { return String(t.nombre || 'un titular').split(' ')[0]; }).join(' y ')) + '</div>' +
        '<button class="b-chico" data-accion="pedir-docs">Pedirlo</button></div>';
    }

    /* Quién firma · reparto e ITP del cuadre vigente; sin cuadre, al menos los
       titulares que la operación ya conoce (nombre y rol), sin % ni ITP. Con
       cuadre, cada titular es TOCABLE y abre el editor de ITP (el mismo del
       Cuadre): el reparto y el ITP se editan aquí, como dice el mock. */
    var firmantes = (k && k.titulares && k.titulares.length) ? k.titulares
      : (p.op && p.op.titulares || []).map(function (t) { return { nombre: t.nombre, rol: t.rol, compra: null, itp: null }; });
    var editable = !!(cq && cq.id && k && k.titulares && k.titulares.length);
    if (firmantes.length) {
      out += '<div><div class="eyebrow" style="margin-bottom:8px">Quién firma' + (editable ? ' · el reparto y el ITP se editan' : '') + '</div>' +
        '<div class="tarjeta" style="overflow:hidden">' + firmantes.map(function (t, i) {
          var fila = '<div style="display:flex;align-items:baseline;gap:8px">' +
              '<span style="flex:1;font-size:13.5px;font-weight:500">' + H(t.nombre || 'Titular ' + (i + 1)) + '</span>' +
              (t.compra != null ? '<span class="mono" style="font-size:12.5px;color:var(--suave)">compra el ' + H(t.compra) + ' %</span>'
                                 : (t.rol ? '<span style="font-size:12px;color:var(--suave)">' + H(t.rol) + '</span>' : '')) +
              (editable ? '<span style="color:var(--raya);flex-shrink:0">' + svg('chevron',15) + '</span>' : '') +
            '</div>' +
            (t.itp != null ? '<div style="font-size:12px;color:var(--tenue);margin-top:2px">' + (t.itp >= 10 ? 'Tipo general · ' : 'Reducido · ') + H(t.itp) + ' %</div>' : '');
          return editable
            ? '<button data-editar-itp="' + H(cq.id) + '" style="width:100%;text-align:left;padding:11px 14px;' + (i ? 'border-top:1px solid var(--sep);' : '') + '">' + fila + '</button>'
            : '<div style="padding:11px 14px;' + (i ? 'border-top:1px solid var(--sep);' : '') + '">' + fila + '</div>';
        }).join('') + '</div></div>';
    }

    /* Lo que sí guarda el modelo del cliente. Lo que no (ingresos/contrato/hijos
       por titular) no se dibuja con cifras inventadas. */
    var rgpd = p.c.rgpd || {};
    var nac = p.c.fechaNacimiento ? String(p.c.fechaNacimiento).slice(0, 4) : null;
    var contacto = [
      ['Teléfono', p.c.telefono ? D.telefono(p.c.telefono) : 'no consta'],
      ['Email', p.c.email || 'no consta'],
      nac ? ['Nacimiento', nac] : null,
      rgpd.fechaConsentimiento ? ['Consentimiento RGPD', 'firmado el ' + D.diaMes(rgpd.fechaConsentimiento)] :
        ['Consentimiento RGPD', rgpd.consentimientoComunicaciones ? 'dado' : 'sin registrar']
    ].filter(Boolean);
    out += '<div><div class="eyebrow" style="margin-bottom:8px">Contacto y consentimiento</div>' +
      '<div class="tarjeta" style="overflow:hidden">' + contacto.map(function (f, i) {
        return '<div class="fila" style="' + (i ? 'border-top:1px solid var(--sep)' : '') + '">' +
          '<span style="flex:1;font-size:13px;color:var(--suave)">' + H(f[0]) + '</span>' +
          '<span style="font-size:13.5px">' + H(f[1]) + '</span></div>';
      }).join('') + '</div></div>';

    out += '<div style="margin-top:auto">' +
      (p.c.telefono ? '' : '<button class="b-primario" style="width:100%;margin-bottom:8px" data-accion="anadir-telefono">' +
        svg('mas',18) + 'Añadir teléfono</button>') +
      '<div style="font-size:11.5px;line-height:1.55;color:var(--tenue);text-align:center">' +
      'Los ingresos, el contrato y los hijos por titular se editan en el estudio del CRM.</div></div>';
    return out;
  }

  /* ── APARTADO · Historial · agrupado por día ────────────────────────────── */
  var histTope = 8;
  function apHistorial(p) {
    if (!p.segs.length) return '<div class="tarjeta" style="padding:16px;color:var(--suave)">Todavía no hay actividad registrada.</div>';
    var todos = p.segs, mostrados = todos.slice(0, histTope), resto = todos.length - mostrados.length;
    var dias = {};
    mostrados.forEach(function (s) { (dias[s.fecha] = dias[s.fecha] || []).push(s); });
    var claves = Object.keys(dias).sort(function (a, b) { return b.localeCompare(a); });
    var out = '';
    claves.forEach(function (f) {
      out += '<div><div class="eyebrow" style="margin-bottom:8px">' + H(rotuloDia(f)) + '</div>' +
        '<div class="tarjeta" style="overflow:hidden">' + dias[f].map(function (s, i) {
          var t = tipo(s.tipo), auto = s.system || s.autorId === 'sistema';
          return '<div style="padding:11px 14px;' + (i ? 'border-top:1px solid var(--sep);' : '') + (auto ? 'opacity:.7' : '') + '">' +
            '<div style="display:flex;align-items:center;gap:9px">' +
              '<span style="width:8px;height:8px;border-radius:50%;background:' + t.c + ';flex-shrink:0"></span>' +
              '<span style="flex:1;font-size:13.5px;' + (auto ? 'color:var(--suave)' : '') + '">' + H(s.texto || t.l) + '</span>' +
            '</div>' +
            (s.hora || s.autorNombre ? '<div style="font-size:11.5px;color:var(--tenue);margin-top:3px;padding-left:17px">' +
              H([s.hora, auto ? 'automático' : s.autorNombre].filter(Boolean).join(' · ')) + '</div>' : '') +
          '</div>';
        }).join('') + '</div></div>';
    });
    if (resto > 0) out += '<button data-hist-mas="1" class="b-secundario" style="width:100%">Ver ' + resto + ' más</button>';
    out += '<div style="margin-top:' + (resto > 0 ? '10px' : 'auto') + '"><button class="b-primario" style="width:100%" data-accion="registrar">' +
      svg('mas',18) + 'Registrar lo que ha pasado</button></div>';
    return out;
  }
  function rotuloDia(f) {
    if (f === D.hoyISO()) return 'Hoy';
    var ayer = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    if (f === ayer) return 'Ayer';
    var DI = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
    var d = new Date(f);
    return DI[d.getDay()] + ' ' + d.getDate() + ' de ' + ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][d.getMonth()];
  }

  /* ── bloques reutilizados de la v1 (intactos en su lógica honesta) ──────── */
  function bloqueCuota(p) {
    var cuota = D.cuotaDe(p.c.uuid || p.c.id);
    var imp = p.op && p.op.importe;
    if (cuota) return '<div class="tarjeta sombra" style="padding:15px 16px">' +
      '<div class="eyebrow">Cuota · escenario preferido</div>' +
      '<div style="display:flex;align-items:baseline;gap:8px;margin-top:7px">' +
        '<span class="serif mono" style="font-size:26px;font-weight:500;line-height:1">' + H(AJ.format.moneda(cuota)) + '</span>' +
        '<span style="font-size:12.5px;color:var(--suave)">al mes</span></div>' +
      (imp ? '<div style="display:flex;align-items:baseline;gap:10px;margin-top:9px;padding-top:11px;border-top:1px solid var(--sep);' +
        'font-size:12.5px;color:var(--tenue)">' + H((p.op.entidad ? p.op.entidad + ' · ' : '') + AJ.format.moneda(imp)) + '</div>' : '') +
      '</div>';
    if (imp) return '<div class="tarjeta sombra" style="padding:15px 16px">' +
      '<div class="eyebrow">Operación</div>' +
      '<div style="display:flex;align-items:baseline;gap:8px;margin-top:7px">' +
        '<span class="serif mono" style="font-size:26px;font-weight:500;line-height:1">' + H(AJ.format.moneda(imp)) + '</span>' +
        (p.op.entidad ? '<span style="font-size:12.5px;color:var(--suave)">' + H(p.op.entidad) + '</span>' : '') +
      '</div>' +
      '<div style="font-size:12px;color:var(--tenue);margin-top:9px;padding-top:10px;border-top:1px solid var(--sep)">' +
      'La cuota aparece aquí en cuanto el estudio tenga un escenario con su número.</div></div>';
    return '<div class="tarjeta" style="padding:15px 16px">' +
      '<div class="eyebrow">Cuota</div>' +
      '<div style="font-size:14px;color:rgba(22,33,62,.6);margin-top:7px;line-height:1.5">' +
      'Todavía sin estudio. La cuota aparece aquí en cuanto haya un escenario preferido.</div></div>';
  }

  function bloqueExpediente(p) {
    if (!p.op) return '';
    var e = D.expediente(p.op.estado);
    if (!e) return '<div class="tarjeta" style="padding:15px 16px">' +
      '<div class="eyebrow">Expediente</div>' +
      '<div style="font-size:13.5px;line-height:1.6;color:rgba(22,33,62,.6);margin-top:7px">' +
      'No se sabe desde aquí: los requisitos viven en el servidor y este equipo ' +
      'todavía no tiene copia. Entra con tu cuenta y se guarda para la próxima.</div></div>';
    var tiene = D.documentosDe(p.c.id);
    var hechos = tiene == null ? null : tiene.length;
    var faltan = hechos == null ? e.total : Math.max(0, e.total - hechos);
    var pct = hechos == null ? 0 : Math.round(hechos / e.total * 100);
    return '<div><div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px">' +
      '<span class="eyebrow">Expediente · fase ' + H((FASE[p.op.estado]||p.op.estado).toLowerCase()) + '</span>' +
      '<span class="mono" style="font-size:11.5px;color:var(--tenue)">' +
        (hechos == null ? '? / ' + e.total : hechos + ' / ' + e.total) + '</span></div>' +
      '<div class="tarjeta" style="overflow:hidden">' +
        '<div style="padding:13px 14px 12px">' +
          '<div style="display:flex;gap:3px;height:8px">' +
            (pct ? '<span style="flex:' + pct + ';background:var(--exito);border-radius:4px"></span>' : '') +
            '<span style="flex:' + (100 - pct) + ';background:#eef1f6;border-radius:4px"></span></div>' +
          '<div style="font-size:12.5px;color:rgba(22,33,62,.6);margin-top:9px">' +
            (hechos == null
              ? 'Hacen falta ' + e.total + ' en esta fase · lo subido se cuenta con sesión'
              : faltan ? 'Faltan ' + faltan + ' de los ' + e.total + ' de esta fase' : 'Nada que pedirle') +
          '</div></div>' +
        (faltan ? '<div style="padding:11px 14px;border-top:1px solid var(--sep)">' +
          '<button class="b-secundario" style="width:100%;border-color:var(--accion);background:rgba(0,102,177,.08);color:var(--accion)" ' +
          'data-accion="pedir-docs">Pedirle ' + (faltan === e.total ? 'los ' + e.total : 'los ' + faltan) + ' por WhatsApp</button></div>' : '') +
      '</div></div>';
  }

  function bloqueOrigen(p) {
    var alta = (p.c.createdAt || '').slice(0, 10);
    return '<div class="tarjeta sombra" style="padding:15px 16px">' +
      '<div class="eyebrow" style="margin-bottom:11px">De dónde salió</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px;font-size:13.5px;line-height:1.5">' +
        fila('Alta', alta ? D.diaMes(alta) + (p.c.agentName ? ' · ' + p.c.agentName : '') : '—') +
        fila('Actividad', p.segs.length ? p.segs.length + ' registrada' + (p.segs.length===1?'':'s') : 'Ninguna, nunca') +
      '</div>' +
      '<div style="font-size:13.5px;line-height:1.55;color:rgba(22,33,62,.7);margin-top:14px;padding-top:13px;border-top:1px solid var(--sep)">' +
      'No tiene operación abierta, así que no hay fase, ni cuota, ni expediente. No es un error: ' +
      'es una persona que existe y con la que no se ha hecho nada.</div>' +
      '<div style="margin-top:12px"><button class="b-primario" style="width:100%" data-accion="registrar">' +
      svg('mas',18) + 'Abrir operación · apuntar</button></div></div>';
  }
  function fila(k, v) {
    return '<div style="display:flex;gap:12px"><span style="width:74px;flex-shrink:0;font-size:9.5px;font-weight:600;' +
      'letter-spacing:.08em;text-transform:uppercase;color:var(--tenue);padding-top:3px">' + H(k) + '</span>' +
      '<span style="flex:1">' + H(v) + '</span></div>';
  }

  /* ── C2 · la tira de después de la llamada ──────────────────────────────── */
  var salioDeAqui = null;
  function armarTira() {
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-llamada]');
      if (a) salioDeAqui = { id: actual, t: Date.now() };
    });
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState !== 'visible' || !salioDeAqui) return;
      if (Date.now() - salioDeAqui.t < 4000) return;
      var id = salioDeAqui.id; salioDeAqui = null;
      if (id !== actual) return;
      tira(id);
    });
  }
  function tira(id) {
    if (document.getElementById('tiraLlamada')) return;
    if (D.ajustes && D.ajustes().preguntarAlColgar === false) return;
    var p = persona(id); if (!p) return;
    var d = document.createElement('div');
    d.id = 'tiraLlamada';
    d.style.cssText = 'position:fixed;left:12px;right:12px;bottom:calc(env(safe-area-inset-bottom,0px) + 88px);' +
      'z-index:150;background:var(--tinta);border-radius:11px;padding:12px 14px;display:flex;align-items:center;gap:12px;' +
      'box-shadow:0 12px 32px rgba(22,33,62,.28)';
    d.innerHTML = '<div style="flex:1;font-size:13px;line-height:1.45;color:#fff">¿Registras la llamada a ' +
      H(String(p.c.nombre).split(' ')[0]) + '?</div>' +
      '<button id="tiraSi" style="height:48px;padding:0 14px;border-radius:8px;background:#fff;color:var(--tinta);font-size:14px;font-weight:500">Registrar</button>' +
      '<button id="tiraNo" style="height:48px;padding:0 12px;border-radius:8px;color:rgba(255,255,255,.7);font-size:13.5px;font-weight:500">Luego</button>';
    document.body.appendChild(d);
    d.querySelector('#tiraNo').onclick = function () { d.remove(); };
    d.querySelector('#tiraSi').onclick = function () { d.remove(); registrar(id, 'llamada'); };
    setTimeout(function () { if (d.parentNode) d.remove(); }, 20000);
  }

  /* ── registrar · la regla del teclado ───────────────────────────────────── */
  function registrar(id, tipoPre) {
    var p = persona(id); if (!p) return;
    var t = tipoPre || 'llamada', texto = '';
    var cap = document.createElement('div');
    cap.style.cssText = 'position:fixed;inset:0;z-index:200';
    document.body.appendChild(cap);
    function pinta() {
      cap.innerHTML = '<div data-cerrar="1" style="position:absolute;inset:0;background:rgba(22,33,62,.42)"></div>' +
        '<div style="position:absolute;left:0;right:0;bottom:var(--kb,0px);max-height:calc(88dvh - var(--kb,0px));background:var(--sup);' +
        'border-radius:13px 13px 0 0;box-shadow:0 -14px 40px rgba(22,33,62,.22);display:flex;flex-direction:column">' +
          '<div style="padding:14px 16px 12px;flex-shrink:0">' +
            '<div style="width:38px;height:4px;border-radius:2px;background:var(--borde);margin:0 auto 13px"></div>' +
            '<div class="serif" style="font-size:19px;font-weight:500;line-height:1.25">Registrar actividad</div>' +
            '<div style="font-size:13px;color:var(--suave);margin-top:3px">' + H(p.c.nombre) + '</div></div>' +
          '<div style="flex:1;overflow-y:auto;padding:0 16px;display:flex;flex-direction:column;gap:14px">' +
            '<div><div class="eyebrow" style="margin-bottom:9px">De qué tipo</div>' +
            '<div style="display:flex;gap:8px">' + [['llamada','Llamada'],['nota','Nota'],['whatsapp','WhatsApp']].map(function (o) {
              var on = o[0] === t;
              return '<button data-tipo="' + o[0] + '" style="flex:1;height:48px;border-radius:8px;font-size:13.5px;font-weight:500;' +
                (on ? 'border:1px solid var(--accion);background:rgba(0,102,177,.08);color:var(--accion)'
                    : 'border:1px solid var(--borde);background:var(--sup);color:rgba(22,33,62,.7)') + '">' + o[1] + '</button>';
            }).join('') + '</div></div>' +
            '<div><div class="eyebrow" style="margin-bottom:9px">Qué pasó</div>' +
            '<textarea id="txtReg" rows="4" placeholder="En dos líneas" style="width:100%;border:1px solid var(--accion);' +
            'border-radius:8px;box-shadow:0 0 0 3px rgba(0,102,177,.12);padding:11px 12px;font:400 14.5px/1.55 inherit;' +
            'color:var(--tinta);resize:none;outline:none">' + H(texto) + '</textarea></div>' +
          '</div>' +
          '<div style="flex-shrink:0;padding:12px 16px calc(env(safe-area-inset-bottom,0px) + 14px);' +
               'border-top:1px solid var(--sep);background:var(--sup)">' +
            '<button id="guardaReg" class="b-primario" style="width:100%">Guardar</button></div>' +
        '</div>';
      cap.querySelector('#txtReg').addEventListener('input', function (ev) { texto = ev.target.value; });
      cap.querySelectorAll('[data-tipo]').forEach(function (b) {
        b.onclick = function () { t = b.getAttribute('data-tipo'); pinta(); };
      });
      cap.querySelector('[data-cerrar]').onclick = function () { cap.remove(); };
      cap.querySelector('#guardaReg').onclick = function () {
        try {
          AJ.seguimientos.crear({
            entidadOrigen: p.op ? 'operacion_finances' : 'persona',
            entidadId: p.op ? p.op.id : p.c.id, personaId: p.c.id,
            tipo: t, texto: texto.trim() || tipo(t).l,
            fecha: D.hoyISO(), estado: 'realizada',
            autorId: 'admin', autorNombre: D.yo().nombre
          });
          cap.remove(); pintar(actual, apart);
        } catch (e) {
          var ta = cap.querySelector('#txtReg');
          ta.style.borderColor = 'var(--error)'; ta.placeholder = e.message; ta.focus();
        }
      };
    }
    pinta();
  }

  /* ── 08 · lo ve alguien que no la lleva ─────────────────────────────────── */
  function fichaAjena(p) {
    var quien = D.quienLaLleva(p.c);
    var op = p.op;
    var filas = [['Teléfono', p.c.telefono ? D.telefono(p.c.telefono) : 'no consta'],
                 ['Fase', op ? D.faseDe(op.estado) : 'sin operación'],
                 ['La lleva', quien || 'sin asignar']];
    return '<div class="tarjeta" style="padding:15px 16px;border-left:3px solid var(--aviso)">' +
        '<div style="font-size:13px;line-height:1.6;color:rgba(22,33,62,.72)">' +
        'Esta operación no la llevas tú. Puedes llamarla si te busca, pero no ves su expediente ' +
        'ni escribes en su historial. Pedirle documentos lo hace quien la lleva.</div></div>' +
      '<div><div class="eyebrow" style="margin-bottom:8px">Lo que sí ves</div>' +
      '<div class="tarjeta" style="overflow:hidden">' + filas.map(function (f, i) {
        return '<div class="fila" style="' + (i ? 'border-top:1px solid var(--sep)' : '') + '">' +
          '<span style="flex:1;font-size:13px;color:var(--suave)">' + H(f[0]) + '</span>' +
          '<span style="font-size:13.5px">' + H(f[1]) + '</span></div>';
      }).join('') + '</div>' +
      (quien ? '<button data-avisar-duenio="' + H(quien) + '" class="b-secundario" ' +
        'style="width:100%;margin-top:8px">Avisar a ' + H(String(quien).split(' ')[0]) + '</button>' : '') +
      '</div>' +
      '<div><div class="eyebrow" style="margin-bottom:8px">Expediente y actividad</div>' +
      '<div class="tarjeta" style="padding:15px 16px;opacity:.55">' +
        '<div style="display:flex;align-items:center;gap:9px">' +
          '<span style="color:var(--raya)">' + svg('candado', 15) + '</span>' +
          '<span style="font-size:13.5px">No disponible con tu permiso</span></div></div></div>' +
      '<div style="margin-top:auto">' +
        '<button disabled class="b-primario" style="width:100%;opacity:.5;cursor:default">' +
          svg('mas', 18) + 'Registrar actividad</button>' +
        '<div style="font-size:11.5px;line-height:1.55;color:var(--tenue);margin-top:9px;text-align:center">' +
        'Apagado, no escondido: si algún día la llevas tú, el botón ya sabes dónde está.</div></div>';
  }

  /* ── pintar · portada o apartado ────────────────────────────────────────── */
  /* ── Cambiar de fase · muta op.estado y sincroniza esLead (C-M033-2) ─────────
     El agente mueve la operación por su embudo desde el móvil. La fase vive en
     cliente.operaciones[]; se persiste con AJ.personas.actualizar (dispara la
     subida). esLead sigue a la fase: potenciales→true, operación→false; perdido
     y descartado no la tocan. */
  var FASES_LEAD = ['primer_contacto', 'segundo_contacto', 'estudio', 'documentacion'];
  var FASES_OP = ['encargo', 'enviado_banco', 'paga_y_senal', 'arras', 'tasacion', 'FEIN', 'firma'];
  function cambiarFase(opId) {
    var p = persona(actual); if (!p) return;
    var op = (p.c.operaciones || []).filter(function (o) { return o.id === opId; })[0];
    if (!op) return;
    var cap = document.createElement('div'); cap.style.cssText = 'position:fixed;inset:0;z-index:200';
    document.body.appendChild(cap);
    function grupo(titulo, keys) {
      return '<div style="margin-bottom:6px"><div class="eyebrow" style="margin:8px 2px 6px">' + titulo + '</div>' +
        '<div class="tarjeta" style="overflow:hidden">' + keys.map(function (k, i) {
          var on = op.estado === k;
          return '<button data-fase="' + k + '" style="width:100%;text-align:left;display:flex;align-items:center;gap:10px;padding:12px 14px;' +
            (i ? 'border-top:1px solid var(--sep);' : '') + (on ? 'background:rgba(0,102,177,.06);' : '') + '">' +
            '<span style="width:8px;height:8px;border-radius:50%;background:' + (on ? 'var(--accion)' : 'var(--raya)') + ';flex-shrink:0"></span>' +
            '<span style="flex:1;font-size:14px' + (on ? ';font-weight:600;color:var(--accion)' : '') + '">' + H(FASE[k] || k) + '</span>' +
            (on ? '<span style="font-size:11.5px;color:var(--accion)">ahora</span>' : '') + '</button>';
        }).join('') + '</div></div>';
    }
    cap.innerHTML = '<div data-cerrar="1" style="position:absolute;inset:0;background:rgba(22,33,62,.42)"></div>' +
      '<div style="position:absolute;left:0;right:0;bottom:var(--kb,0px);max-height:88dvh;background:var(--sup);border-radius:13px 13px 0 0;' +
      'box-shadow:0 -14px 40px rgba(22,33,62,.22);display:flex;flex-direction:column">' +
        '<div style="padding:14px 16px 4px;flex-shrink:0"><div style="width:38px;height:4px;border-radius:2px;background:var(--borde);margin:0 auto 13px"></div>' +
          '<div class="serif" style="font-size:19px;font-weight:500">Cambiar de fase</div>' +
          '<div style="font-size:12.5px;color:var(--suave);margin-top:2px">' + H(op.codigo || '') + ' · ' + H(p.c.nombre) + '</div></div>' +
        '<div style="flex:1;overflow-y:auto;padding:4px 16px calc(env(safe-area-inset-bottom,0px) + 16px)">' +
          grupo('Cliente potencial', FASES_LEAD) + grupo('Operación', FASES_OP) + grupo('Salida', ['perdido', 'descartado']) +
        '</div></div>';
    cap.querySelector('[data-cerrar]').onclick = function () { cap.remove(); };
    cap.querySelectorAll('[data-fase]').forEach(function (b) {
      b.onclick = function () {
        var k = b.getAttribute('data-fase');
        op.estado = k;
        if (FASES_LEAD.indexOf(k) >= 0) op.esLead = true;
        else if (FASES_OP.indexOf(k) >= 0) op.esLead = false;
        op.updatedAt = new Date().toISOString();
        try { AJ.personas.actualizar(p.c.id, { operaciones: p.c.operaciones }); } catch (e) {}
        cap.remove(); pintar(actual, 'operacion');
      };
    });
  }

  function apartadoBody(p) {
    if (apart === 'operacion') return apOperacion(p);
    if (apart === 'expediente') return apExpediente(p);
    if (apart === 'finanzas') return apFinanzas(p);
    if (apart === 'datos') return apDatos(p);
    if (apart === 'historial') return apHistorial(p);
    /* portada */
    return opCard(p) + menuApartados(p) + pieContacto(p);
  }
  var TITULO_AP = { operacion:'Operación', expediente:'Expediente', finanzas:'Finanzas', datos:'Datos', historial:'Historial' };

  function pintar(id, ap) {
    if (id && id !== actual) apart = 'portada';   /* cambiar de cliente vuelve a la portada */
    actual = id || actual;
    if (ap !== undefined) apart = ap;
    var p = persona(actual);
    if (!p) { document.getElementById('cuerpo').innerHTML =
      '<div class="tarjeta" style="padding:20px">Esa ficha ya no está.</div>'; return; }

    if (D.soloLoTuyo() && !D.esMia(p.c)) {
      var cabA = document.getElementById('cab'); cabA.style.background = 'var(--navy)'; cabA.style.borderBottomColor = 'var(--navy)';
      cabA.innerHTML = cabPortada(p);
      document.getElementById('cuerpo').innerHTML = fichaAjena(p);
      return;
    }

    var cab = document.getElementById('cab');
    if (apart === 'portada') { cab.style.background = 'var(--navy)'; cab.style.borderBottomColor = 'var(--navy)'; }
    else { cab.style.background = ''; cab.style.borderBottomColor = ''; }
    cab.innerHTML = apart === 'portada' ? cabPortada(p) : cabSub(p, TITULO_AP[apart] || '');
    document.getElementById('cuerpo').innerHTML = apartadoBody(p);
  }

  /* ── eventos ────────────────────────────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var vol = e.target.closest('[data-volver]');
    if (vol && actual) { pintar(actual, 'portada'); return; }

    var ei = e.target.closest('[data-editar-itp]');
    if (ei && actual) { window.AJapp.cuadre.editarTitulares(ei.getAttribute('data-editar-itp'), function () { pintar(actual, 'datos'); }); return; }

    var cf = e.target.closest('[data-cambiar-fase]');
    if (cf && actual) { cambiarFase(cf.getAttribute('data-cambiar-fase')); return; }

    if (e.target.closest('[data-hist-mas]') && actual) { histTope += 20; pintar(actual, 'historial'); return; }

    var ap = e.target.closest('[data-apart]');
    if (ap && actual) { pintar(actual, ap.getAttribute('data-apart')); return; }

    var av = e.target.closest('[data-avisar-duenio]');
    if (av) {
      var p2 = persona(actual);
      var t = 'Hola ' + String(av.getAttribute('data-avisar-duenio')).split(' ')[0] +
        ', me ha llamado ' + ((p2 && p2.c.nombre) || 'un cliente tuyo') + ': ';
      window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank');
      return;
    }
    var a = e.target.closest('[data-accion="registrar"]');
    if (a && actual) { registrar(actual); return; }
    var pd = e.target.closest('[data-accion="pedir-docs"]');
    if (pd && actual) { pedirDocs(actual); return; }
    var at = e.target.closest('[data-accion="anadir-telefono"]');
    if (at && actual) { anadirTelefono(actual); return; }
    var f = e.target.closest('[data-ficha]');
    if (f) window.AJapp.shell.ir('cliente:' + f.getAttribute('data-ficha'));
  });
  armarTira();

  function pedirDocs(id) {
    var p = persona(id); if (!p || !p.op) return;
    var e = D.expediente(p.op.estado);
    var tel = (p.c.telefono || '').replace(/\D+/g, '');
    var nombre = String(p.c.nombre || '').split(',').pop().trim().split(' ')[0] || 'hola';
    var t = 'Hola ' + nombre + ', para seguir con tu operación necesitaríamos:';
    if (e && e.lista && e.lista.length) {
      e.lista.forEach(function (r) {
        t += '\n· ' + r.nombre + (r.cantidad > 1 ? ' (x' + r.cantidad + ')' : '') +
             (r.porTitular ? ' — de cada titular' : '');
      });
      t += '\n\nCuando puedas, me los pasas por aquí. Gracias.';
    } else {
      t += '\n(te digo el detalle en un momento). Gracias.';
    }
    var url = tel ? 'https://wa.me/' + tel + '?text=' + encodeURIComponent(t)
                  : 'https://wa.me/?text=' + encodeURIComponent(t);
    window.open(url, '_blank');
  }

  function anadirTelefono(id) {
    var p = persona(id); if (!p) return;
    var val = window.prompt('Teléfono de ' + String(p.c.nombre || '').split(',')[0]);
    if (val == null) return;
    var limpio = String(val).replace(/[^\d+ ]/g, '').trim();
    if (limpio.replace(/\D/g, '').length < 6) return;
    try { AJ.personas.actualizar(p.c.id, { telefono: limpio }); pintar(id, apart); }
    catch (e) { console.warn('[app] no se pudo guardar el teléfono:', e.message); }
  }

  window.AJapp.cliente = { pintar: pintar };
})();
