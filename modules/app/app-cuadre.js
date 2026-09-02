/* ═══════════════════════════════════════════════════════════════════════════
   App AJ Finances · 08 · Cuadre — los números que se hacen dentro del piso

   El caso, tal cual: estás en el piso y el cliente pregunta lo de siempre —
   «¿y cuánto dinero tengo que tener yo?». El portátil está en la oficina, así
   que hoy la respuesta es «te lo mando esta tarde», y esa tarde es donde se
   enfría la operación. Con esto: se hacen los números delante, se gira el
   móvil, y se le manda antes de salir del portal. Ver · tocar · mandar.

   Esta es la sección que afinó el principio de la app. Los cimientos excluían
   «cuadrar números» del móvil y era un error: hacer números delante del
   cliente ES trabajo de campo. De ahí «administrar no, responder sí».

   Un cuadre tiene 36 campos y meterlos como formulario en 390 px es imposible
   y además equivocado: de esos 36 casi todos son RESULTADO. Se tocan cinco y
   el resto se recalcula. Por eso la pantalla se parte en dos de raíz:
   LO QUE MUEVO arriba, LO QUE SALE debajo.

   Del mock «App Cuadre.dc-4.html», sus once estados y sus correcciones. El
   estado 11 «Ingresos y préstamos» se porta AGREGADO (ingresos, préstamos y
   endeudamiento de los dos, en el desglose); el desglose POR TITULAR del mock
   —neto, nº de pagas y cada préstamo— no lo guarda el cuadre, es dato del
   estudio del CRM, y por eso se dice en vez de inventarse:
     C1 · el ITP entra como fila propia, no dentro de «gastos»: son 19.875 de
          los 80.025 y esconderlo dejaba la cifra protagonista corta
     C2 · dos tramos, no una cuota. Una media sería una cuota que no es la
          suya en ningún tramo
     C3 · necesita y tiene, en la misma línea. La resta se hace en la pantalla,
          no en la cabeza del comercial
     C4 · titulares con su ITP: los dos tipos distintos son la razón de que el
          impuesto no se pueda calcular con un porcentaje único
     C5 · la entrada no es un gasto. Se separa en sus dos momentos
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var D = window.AJapp.datos, I = window.AJapp.inicio, Q = {};
  var H = I.H;

  function ico(d, w) {
    return '<svg width="' + (w || 16) + '" height="' + (w || 16) + '" viewBox="0 0 16 16" fill="none" ' +
      'stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  }
  var IC = {
    flecha:  '<path d="M6 3.6 10.4 8 6 12.4"/>',
    lapiz:   '<path d="M11.2 2.9a1.5 1.5 0 0 1 2.1 2.1L5.6 12.7l-2.9.8.8-2.9z"/>',
    volver:  '<path d="M10 3.6 5.6 8 10 12.4"/>',
    ojo:     '<path d="M1.6 8S4 3.4 8 3.4 14.4 8 14.4 8 12 12.6 8 12.6 1.6 8 1.6 8z"/><circle cx="8" cy="8" r="1.9"/>',
    enviar:  '<path d="M14 2 7.2 8.8M14 2l-4.4 12-2.4-5.2L2 6.4z"/>',
    candado: '<rect x="3.4" y="7" width="9.2" height="6.6" rx="1.2"/><path d="M5.6 7V5.2a2.4 2.4 0 0 1 4.8 0V7"/>',
    check:   '<path d="M13 4.8 6.4 11.4 3 8"/>',
    deshacer:'<path d="M3.4 7.4h6.2a3 3 0 0 1 0 6H6.6"/><path d="M5.8 4.6 3.2 7.4l2.6 2.8"/>',
    wapp:    '<path d="M13.6 7.7A5.4 5.4 0 0 1 8 13.1a5.7 5.7 0 0 1-2.4-.5L2.4 13.6l1-3.2A5.4 5.4 0 0 1 2.9 7.7 5.4 5.4 0 0 1 8.2 2.4a5.4 5.4 0 0 1 5.4 5.3z"/>',
    enlace:  '<path d="M6.6 9.4a2.6 2.6 0 0 0 3.8.3l2-2a2.6 2.6 0 0 0-3.7-3.7l-1.1 1.1"/><path d="M9.4 6.6a2.6 2.6 0 0 0-3.8-.3l-2 2a2.6 2.6 0 0 0 3.7 3.7l1.1-1.1"/>'
  };

  /* El estado. `c` es el cuadre que se está mirando y `k` su cálculo; se
     recalcula entero en cada toque porque cuesta microsegundos y así nunca
     hay dos números de dos momentos distintos en la misma pantalla. */
  var c = null, vista = 'cuadre', hoja = null, idioma = 'es', personaId = null;

  function calc() { return D.calcularCuadre(c); }
  function eu(n, s) { return D.euros(n, s); }

  /* ── la cabecera ─────────────────────────────────────────────────────────── */
  function cabecera(titulo, sub, atras) {
    document.getElementById('cab').innerHTML =
      '<div style="display:flex;align-items:center;gap:11px">' +
        (atras ? '<button data-cq="' + H(atras) + '" style="width:30px;height:30px;margin-left:-6px;color:var(--suave);' +
          'display:flex;align-items:center;justify-content:center">' + ico(IC.volver, 18) + '</button>' : '') +
        '<div style="flex:1;min-width:0">' +
          '<div class="eyebrow">' + H(titulo) + '</div>' +
          '<div class="serif" style="font-size:20px;font-weight:500;line-height:1.15;margin-top:2px">' +
            H(sub) + '</div></div>' +
        (c && c.tipo !== 'compra'
          ? '<span class="pill" style="background:#eef3fa;color:var(--accion);flex-shrink:0">' + H(c.tipo) + '</span>' : '') +
      '</div>';
  }

  /* ── LA CIFRA PROTAGONISTA ────────────────────────────────────────────────
     Grande, arriba, y siempre visible mientras se manosean los números de
     abajo: que se vea moverse al tocar es medio diseño. Va con su contexto
     mínimo —las dos cuotas, el LTV y el endeudamiento—, que son los que dicen
     si la operación pasa o no pasa.

     C3 · y con «tiene» al lado. La resta se hace aquí, no en la cabeza del
     comercial: «le faltan 14.025 €» es la frase de la reunión. */
  function cifra(k) {
    if (k.subrogacion) return cifraSubrogacion(k);
    var hueco = k.hueco;
    return '<div class="tarjeta" style="padding:16px 17px 15px">' +
      '<div class="eyebrow">Tiene que poner</div>' +
      '<div class="serif" style="font-size:38px;font-weight:400;line-height:1.05;margin-top:3px;' +
        'font-variant-numeric:tabular-nums">' + eu(k.aportacion) + '</div>' +
      (k.tiene
        ? '<div style="font-size:13px;line-height:1.5;margin-top:6px">' +
            '<span style="color:var(--suave)">Tiene ' + eu(k.tiene) + '</span>' +
            '<span style="color:var(--raya)"> · </span>' +
            (hueco > 0
              ? '<span style="color:var(--aviso);font-weight:500">le faltan ' + eu(hueco) + '</span>'
              : '<span style="color:var(--exito);font-weight:500">le sobran ' + eu(-hueco) + '</span>') +
          '</div>'
        : '<div style="font-size:12.5px;color:var(--tenue);margin-top:6px">No consta cuánto tiene</div>') +
      cinta(k) + '</div>';
  }

  /* C2 · dos tramos del mismo tamaño, no una media. El techo previsto va con
     el variable, donde se puede mirar sin asustar: es el número del banco, no
     el de la conversación. */
  function cinta(k) {
    var cel = [];
    if (k.cuotaFija) cel.push(['Fijo ' + (k.plazoFijo ? k.plazoFijo + ' a' : ''), eu(k.cuotaFija), null]);
    if (k.cuotaVariable) cel.push(['Variable', eu(k.cuotaVariable),
      k.cuotaMax ? 'techo ' + eu(k.cuotaMax) : null]);
    if (k.ltv != null) cel.push(['LTV', D.pct(k.ltv), null]);
    if (k.end != null) cel.push(['Endeud.', D.pct(k.end), null]);
    return '<div style="display:flex;gap:1px;margin:14px -17px -15px;background:var(--sep);' +
      'border-top:1px solid var(--sep)">' +
      cel.map(function (x) {
        return '<div style="flex:1;background:var(--sup);padding:9px 10px 10px;min-width:0">' +
          '<div style="font-size:10px;color:var(--tenue);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' +
            H(x[0]) + '</div>' +
          '<div class="mono" style="font-size:14px;font-weight:500;margin-top:2px">' + H(x[1]) + '</div>' +
          (x[2] ? '<div style="font-size:10px;color:var(--tenue);margin-top:1px">' + H(x[2]) + '</div>' : '') +
          '</div>';
      }).join('') + '</div>';
  }

  function cifraSubrogacion(k) {
    return '<div class="tarjeta" style="padding:16px 17px 15px">' +
      '<div class="eyebrow">Se ahorra</div>' +
      '<div class="serif" style="font-size:38px;font-weight:400;line-height:1.05;margin-top:3px;' +
        'font-variant-numeric:tabular-nums;color:var(--exito)">' + eu(k.ahorroNeto) + '</div>' +
      '<div style="font-size:13px;line-height:1.5;margin-top:6px;color:var(--suave)">' +
        'En los ' + k.anios + ' años que le quedan<span style="color:var(--raya)"> · </span>' +
        '<span style="color:var(--tinta);font-weight:500">' + eu(k.ahorroMes) + ' menos al mes</span></div>' +
      '<div style="display:flex;gap:1px;margin:14px -17px -15px;background:var(--sep);border-top:1px solid var(--sep)">' +
        [['Paga hoy', eu(k.cuotaHoy)], ['Pagaría', eu(k.cuotaNueva)],
         ['Pendiente', eu(k.pendiente)], ['Endeud.', D.pct(k.end)]].map(function (x) {
          return '<div style="flex:1;background:var(--sup);padding:9px 10px 10px;min-width:0">' +
            '<div style="font-size:10px;color:var(--tenue)">' + H(x[0]) + '</div>' +
            '<div class="mono" style="font-size:14px;font-weight:500;margin-top:2px">' + H(x[1]) + '</div></div>';
        }).join('') + '</div></div>';
  }

  /* ── LO QUE MUEVO ─────────────────────────────────────────────────────────
     Cinco filas, porque cada tramo agrupa su tipo con su plazo: la unidad que
     se toca es el tramo, no el campo suelto. El ITP no está aquí a propósito —
     se mueve cambiando el tipo de un titular, que es donde de verdad se decide. */
  function loQueMuevo(k) {
    var filas = k.subrogacion
      ? [['hipoteca',  'Capital pendiente', eu(k.pendiente), null],
         ['plazoTotal','Años que quedan',   String(k.anios), null],
         ['tinFijo',   'Tipo nuevo',        D.pct(k.tin, 2), 'Fijo, todo el plazo'],
         ['honorarios','Honorarios AJ',     eu(c.honorarios), null]]
      : [['pvp',       'Precio',            eu(k.pvp), null],
         ['hipoteca',  'Hipoteca',          eu(k.hipoteca), null],
         ['tinFijo',   'Tramo fijo',        D.pct(k.tinFijo, 2),
            'Los ' + k.plazoFijo + ' primeros años'],
         ['tinVar',    'Tramo variable',    D.pct(k.tinVariable, 2),
            'Después, hasta el año ' + k.plazoTotal + ' · eur. ' +
            String(c.euribor).replace('.', ',') + ' + ' + String(c.diferencial).replace('.', ',')],
         ['honorarios','Honorarios AJ',     eu(c.honorarios), null]];

    return '<div class="eyebrow" style="margin-bottom:8px">Lo que muevo</div>' +
      '<div class="tarjeta" style="overflow:hidden;margin-bottom:14px">' +
      filas.map(function (f, i) {
        var manual = c.ov && c.ov[f[0]] != null;
        return '<button data-tocar="' + f[0] + '" class="fila" style="width:100%;text-align:left' +
          (i ? ';border-top:1px solid var(--sep)' : '') +
          (manual ? ';background:rgba(184,134,43,.05)' : '') + '">' +
          '<span style="flex:1;min-width:0">' +
            '<span style="display:block;font-size:13.5px">' + H(f[1]) + '</span>' +
            (f[3] ? '<span style="display:block;font-size:11.5px;color:var(--suave);margin-top:1px">' +
              H(f[3]) + '</span>' : '') + '</span>' +
          '<span class="mono" style="font-size:14.5px;font-weight:500;flex-shrink:0' +
            (manual ? ';color:var(--aviso)' : '') + '">' + H(f[2]) + '</span>' +
          '<span style="color:var(--raya);flex-shrink:0">' + ico(IC.lapiz, 14) + '</span></button>';
      }).join('') + '</div>';
  }

  /* ── LO QUE SALE ──────────────────────────────────────────────────────────
     C1 + C5 · la entrada en sus dos momentos, el impuesto como fila propia, y
     los gastos de cierre. Tres cosas legibles que suman la cifra de arriba —
     no un saco de seis conceptos con el impuesto escondido dentro. */
  function loQueSale(k) {
    if (k.subrogacion) return salidaSubrogacion(k);
    var filas = [];
    if (k.arras) filas.push(['Arras · ya pagadas', eu(k.arras), null]);
    if (k.aportacionFirma) filas.push(['Aportación en firma', eu(k.aportacionFirma), null]);
    if (!k.arras && !k.aportacionFirma) filas.push(['Entrada', eu(k.entrada), null]);
    filas.push(['ITP · ' + k.titulares.map(function (t) { return D.pct(t.itp, 0); }).join(' y '),
                eu(k.itp), 'desglose']);
    filas.push(['Notaría, tasación, honorarios, seguro', eu(k.gastosCierre), 'desglose']);

    return '<div class="eyebrow" style="margin-bottom:8px">Lo que sale · suma ' + eu(k.aportacion) + '</div>' +
      '<div class="tarjeta" style="overflow:hidden;margin-bottom:14px">' +
      filas.map(function (f, i) {
        var ir = f[2];
        return '<' + (ir ? 'button data-cq="desglose"' : 'div') + ' class="fila" style="width:100%;text-align:left' +
          (i ? ';border-top:1px solid var(--sep)' : '') + '">' +
          '<span style="flex:1;min-width:0;font-size:13.5px">' + H(f[0]) + '</span>' +
          '<span class="mono" style="font-size:14px;flex-shrink:0">' + H(f[1]) + '</span>' +
          (ir ? '<span style="color:var(--raya);flex-shrink:0">' + ico(IC.flecha, 14) + '</span>' : '') +
          '</' + (ir ? 'button' : 'div') + '>';
      }).join('') + '</div>';
  }

  function salidaSubrogacion(k) {
    return '<div class="eyebrow" style="margin-bottom:8px">Lo que sale</div>' +
      '<div class="tarjeta" style="overflow:hidden;margin-bottom:14px">' +
      [['Ahorro en toda la vida', eu(k.ahorroVida), 'var(--exito)'],
       ['Coste de cambiar · ' + k.costeConceptos, eu(-k.costeCambio), null],
       ['Se recupera en', k.mesesRecupera ? k.mesesRecupera + ' meses' : '—', null]
      ].map(function (f, i) {
        return '<div class="fila" style="' + (i ? 'border-top:1px solid var(--sep)' : '') + '">' +
          '<span style="flex:1;font-size:13.5px">' + H(f[0]) + '</span>' +
          '<span class="mono" style="font-size:14px' + (f[2] ? ';color:' + f[2] : '') + '">' + H(f[1]) + '</span></div>';
      }).join('') + '</div>' +
      '<div style="font-size:12.5px;line-height:1.6;color:var(--suave);margin-bottom:14px">' +
      'No hay entrada, ni ITP, ni titulares con su tipo: no se compra nada. Lo que queda es el ' +
      'mismo esqueleto con otra pregunta.</div>';
  }

  /* ── 03 · lo puesto a mano ────────────────────────────────────────────────
     Un número forzado no puede parecerse a uno calculado, y tiene que poder
     devolverse al cálculo. Es lo que significa `manual{}` en el modelo, sacado
     a la superficie. */
  var ETIQ = { pvp:'Precio', hipoteca:'Hipoteca', tinFijo:'Tramo fijo', tinVar:'Tramo variable',
               honorarios:'Honorarios AJ', notaria:'Notaría, registro y gestoría', tasacion:'Tasación',
               seguroVida:'Seguro de vida', itp:'ITP', cuotaFija:'Cuota tramo fijo',
               cuotaVariable:'Cuota tramo variable', plazoTotal:'Plazo', capitalDisponible:'Capital que tiene' };

  function aMano(k) {
    var ms = k.manuales;
    if (!ms.length) return '';
    /* cuánto de la cifra grande no sale del cálculo: es el dato que hace
       honesta la pantalla cuando hay números forzados */
    var limpio = {}; for (var key in c) limpio[key] = c[key];
    limpio.ov = {};
    var kl = D.calcularCuadre(limpio);
    var delta = k.subrogacion ? null : Math.abs(kl.aportacion - k.aportacion);

    return '<div class="eyebrow" style="margin-bottom:8px;color:var(--aviso)">Puestos a mano · ' + ms.length + '</div>' +
      (delta ? '<div style="font-size:12.5px;color:var(--suave);margin-bottom:8px">' +
        eu(delta) + ' de esta cifra no salen del cálculo.</div>' : '') +
      '<div class="tarjeta" style="overflow:hidden;border-left:3px solid var(--aviso);margin-bottom:10px">' +
      ms.map(function (m, i) {
        return '<div class="fila" style="' + (i ? 'border-top:1px solid var(--sep)' : '') + '">' +
          '<span style="flex:1;min-width:0">' +
            '<span style="display:block;font-size:13.5px">' + H(ETIQ[m] || m) + '</span>' +
            '<span style="display:block;font-size:11.5px;color:var(--suave);margin-top:1px">Calculado ' +
              H(valorCalculado(m, kl)) + '</span></span>' +
          '<span class="mono" style="font-size:14px;color:var(--aviso);flex-shrink:0">' +
            H(muestraValor(m, c.ov[m])) + '</span></div>';
      }).join('') + '</div>' +
      '<button data-cq="devolver" class="b-secundario" style="width:100%;margin-bottom:14px">' +
      ico(IC.deshacer, 15) + ' Devolver ' + (ms.length === 1 ? 'el número' : 'los ' + ms.length) + ' al cálculo</button>';
  }
  function valorCalculado(campo, kl) {
    var m = { pvp:kl.pvp, hipoteca:kl.hipoteca, honorarios:c.honorarios, notaria:c.notaria,
              tasacion:c.tasacion, seguroVida:c.seguroVida, itp:kl.itp,
              cuotaFija:kl.cuotaFija, cuotaVariable:kl.cuotaVariable };
    if (campo === 'tinFijo') return D.pct(kl.tinFijo, 2);
    if (campo === 'tinVar')  return D.pct(kl.tinVariable, 2);
    return m[campo] != null ? eu(m[campo]) : '—';
  }
  function muestraValor(campo, v) {
    return (campo === 'tinFijo' || campo === 'tinVar') ? D.pct(v, 2) : eu(v);
  }

  /* ── los otros cinco tipos ───────────────────────────────────────────────
     El modelo admite siete —compra, subrogación, ampliación, reunificación,
     autopromoción, no residente y otro—, que son los siete productos de §4.1.
     Aquí hay dos construidos. Los otros cinco NO se pintan con el esqueleto de
     la compra: una ampliación no tiene entrada ni ITP, y enseñarle a un cliente
     una «aportación total» calculada como si comprara sería un número inventado
     con toda la pinta de ser verdad. Se dice, y se ofrece lo único honesto:
     mirarlo en la mesa. Hoy los 7 cuadres del sistema son de compra. */
  var HECHOS = ['compra', 'subrogacion'];
  function noHecho() {
    cabecera((c.codigo || 'Cuadre') + ' · cuadre', nombrePersona(), 'salir');
    document.getElementById('cuerpo').innerHTML =
      '<div class="tarjeta" style="padding:20px 18px">' +
        '<div class="serif" style="font-size:19px;font-weight:500;line-height:1.3">Este cuadre es de ' +
          H(c.tipo) + '</div>' +
        '<div style="font-size:13.5px;line-height:1.6;color:rgba(22,33,62,.65);margin-top:8px">' +
          'En el móvil están hechos la compra y la subrogación. Una ' + H(c.tipo) + ' no tiene ' +
          'entrada ni impuesto de transmisión, así que pintarla con el esqueleto de una compra ' +
          'daría una cifra inventada con toda la pinta de ser verdad.</div>' +
        '<div style="font-size:12.5px;line-height:1.6;color:var(--suave);margin-top:10px">' +
          'Se ve entero en la ficha del cliente, en el ordenador.</div>' +
      '</div>';
  }

  /* ── la pantalla principal ───────────────────────────────────────────────── */
  function pintarCuadre() {
    if (HECHOS.indexOf(c.tipo) < 0) return noHecho();
    var k = calc();
    cabecera((c.codigo || 'Cuadre nuevo') + ' · cuadre', nombrePersona(), 'salir');
    document.getElementById('cuerpo').innerHTML =
      cifra(k) +
      '<div>' + loQueMuevo(k) + '</div>' +
      '<div>' + aMano(k) + loQueSale(k) + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:auto">' +
        '<button data-cq="mandar" class="b-primario" style="flex:1">' + ico(IC.enviar, 17) + ' Mandárselo</button>' +
        '<button data-cq="presentar" class="b-secundario" style="flex:1">' + ico(IC.ojo, 17) + ' Enseñárselo</button>' +
      '</div>';
  }

  function nombrePersona() {
    if (c && c.nombrePersona) return c.nombrePersona;
    var p = (D.clientes() || []).filter(function (x) { return x.uuid === c.personaUuid; })[0];
    var n = (p && p.nombre) || 'Cliente';
    var t = (c.titulares || []).length;
    return t > 1 ? n + ' · ' + t + ' titulares' : n;
  }

  /* ── 05 · el desglose · de dónde sale ─────────────────────────────────────
     C4 + C5 · el impuesto POR TITULAR —los dos tipos distintos son la razón de
     que no se pueda calcular con un porcentaje único— y luego la entrada con
     sus dos momentos y los cuatro costes. Tres bloques, no un saco de seis:
     llamar «gastos» a los 60.150 € haría leer al cliente que la operación le
     cuesta eso, cuando 53.000 son su propia entrada. */
  function pintarDesglose() {
    if (HECHOS.indexOf(c.tipo) < 0) return noHecho();
    var k = calc();
    cabecera('Cuadre', 'De dónde sale', 'cuadre');
    var ahorro = null;
    if (k.titulares.length > 1) {
      var general = Math.round(k.pvp * Math.max.apply(null, k.titulares.map(function (t) { return t.itp; })) / 100);
      if (general > k.itp) ahorro = general - k.itp;
    }
    document.getElementById('cuerpo').innerHTML =
      '<div class="tarjeta" style="padding:16px 17px">' +
        '<div class="eyebrow">La aportación entera</div>' +
        '<div class="serif" style="font-size:32px;font-weight:400;margin-top:3px;' +
          'font-variant-numeric:tabular-nums">' + eu(k.aportacion) + '</div></div>' +

      '<div>' +
      '<div class="eyebrow" style="margin-bottom:8px">ITP por titular · ' + eu(k.itp) +
        (ahorro ? ', el reducido ahorra ' + eu(ahorro) : '') + '</div>' +
      '<div class="tarjeta" style="overflow:hidden;margin-bottom:14px">' +
      (k.titulares.length ? k.titulares.map(function (t, i) {
        return '<button data-titular="' + i + '" class="fila" style="width:100%;text-align:left' +
          (i ? ';border-top:1px solid var(--sep)' : '') + '">' +
          '<span style="flex:1;min-width:0">' +
            '<span style="display:block;font-size:13.5px">' + H(t.nombre || 'Titular ' + (i + 1)) +
              ' · ' + D.pct(t.compra, 0) + '</span>' +
            '<span style="display:block;font-size:11.5px;color:var(--suave);margin-top:1px">' +
              H(t.itp >= 10 ? 'Tipo general · ' + D.pct(t.itp, 0) : 'Reducido · ' + D.pct(t.itp, 0)) + '</span></span>' +
          '<span class="mono" style="font-size:14px;flex-shrink:0">' + eu(t.importe) + '</span>' +
          '<span style="color:var(--raya);flex-shrink:0">' + ico(IC.lapiz, 14) + '</span></button>';
      }).join('')
        : '<div style="padding:16px;font-size:13px;color:var(--suave)">Sin titulares en el cuadre, ' +
          'así que el impuesto no se puede repartir. Añádelos desde la ficha.</div>') + '</div></div>' +

      /* la entrada NO es un gasto: son sus dos momentos */
      '<div><div class="eyebrow" style="margin-bottom:8px">La entrada · ' + eu(k.entrada) + '</div>' +
      '<div class="tarjeta" style="overflow:hidden;margin-bottom:14px">' +
      linea('Arras · ya pagadas', k.arras) + linea('Aportación en firma', k.aportacionFirma) +
      '</div></div>' +

      '<div><div class="eyebrow" style="margin-bottom:8px">Los cuatro gastos · ' + eu(k.gastosCierre) + '</div>' +
      '<div class="tarjeta" style="overflow:hidden;margin-bottom:14px">' +
      linea('Honorarios AJ', c.honorarios) + linea('Notaría, registro, gestoría', c.notaria) +
      linea('Tasación', c.tasacion) + linea('Seguro de vida', c.seguroVida) +
      (c.gastosExtra || []).map(function (g) { return linea(g.concepto, g.importe); }).join('') +
      '</div></div>' +

      /* Estado 11 del mock (dc-4) · «Ingresos y préstamos». La cabecera AGREGADA
         —lo que entra, lo que sale y el endeudamiento de los dos— sí se sabe y
         se enseña. El desglose POR TITULAR del mock (neto, nº de pagas y cada
         préstamo con sus meses) NO lo guarda el cuadre: son datos del estudio
         del CRM. Se dice, no se inventa. Solo aparece si hay ingresos cargados. */
      (k.ingresos ?
        '<div><div class="eyebrow" style="margin-bottom:8px">Ingresos y préstamos</div>' +
        '<div class="tarjeta" style="overflow:hidden">' +
          linea('Ingresos netos · al mes', k.ingresos) +
          linea('Préstamos que pagan · al mes', k.prestamos) +
          '<div class="fila" style="border-top:1px solid var(--sep)">' +
            '<span style="flex:1;font-size:13.5px">Endeudamiento' + (k.titulares.length > 1 ? ' de los dos' : '') + '</span>' +
            '<span class="mono" style="font-size:14px;color:' + (k.end != null && k.end < 35 ? 'var(--exito)' : 'var(--aviso)') + '">' +
              (k.end != null ? D.pct(k.end) + (k.end < 35 ? ' · por debajo del 35' : ' · pasa del 35') : '—') + '</span></div>' +
        '</div>' +
        '<div style="font-size:11.5px;color:var(--tenue);margin-top:7px;margin-bottom:14px;line-height:1.5">' +
        'El desglose por titular —neto, nº de pagas y cada préstamo— se lleva en el estudio del CRM.</div></div>'
      : '') +

      '<button data-cq="cuadre" class="b-secundario" style="width:100%;margin-top:auto">Volver al cuadre</button>';
  }
  var _n = 0;
  function linea(t, v) {
    if (!v) return '';
    return '<div class="fila" style="' + (_n++ % 99 ? 'border-top:1px solid var(--sep)' : '') + '">' +
      '<span style="flex:1;font-size:13.5px">' + H(t) + '</span>' +
      '<span class="mono" style="font-size:14px">' + eu(v) + '</span></div>';
  }

  /* ── 04 · modo presentación · el móvil girado al cliente ──────────────────
     Sin barra, sin notas, sin fase. No porque el cuadre tenga secretos —los
     honorarios de AJ van dentro y está bien, son parte de lo que paga— sino
     porque lo que hay ALREDEDOR sí: las notas del comercial, la fase de la
     operación, lo que se dijo en la última llamada.

     Y congelado: tocar delante del cliente es potente y también peligroso. La
     llave está a la vista, así que se puede descongelar mirándolo. */
  function pintarPresentacion() {
    if (HECHOS.indexOf(c.tipo) < 0) { vista = 'cuadre'; return noHecho(); }
    var k = calc();
    var barra = document.getElementById('barra');
    if (barra) barra.style.display = 'none';
    document.getElementById('cab').innerHTML =
      '<div style="display:flex;align-items:center;gap:10px">' +
        '<span style="flex:1;font-size:12px;color:var(--suave)">AJ Grup Finances · ' + H(hoyLargo()) + '</span>' +
        '<span class="pill" style="background:var(--sep);color:var(--suave)">' +
          ico(IC.candado, 12) + 'congelado</span></div>';

    document.getElementById('cuerpo').innerHTML = (k.subrogacion
      ? '<div><div class="eyebrow">Lo que os ahorráis</div>' +
        '<div class="serif" style="font-size:44px;font-weight:300;line-height:1.02;margin-top:4px;' +
          'font-variant-numeric:tabular-nums;color:var(--exito)">' + eu(k.ahorroNeto) + '</div>' +
        '<div style="font-size:13px;color:var(--suave);margin-top:6px">' + eu(k.ahorroMes) +
          ' menos al mes durante ' + k.anios + ' años</div></div>'
      : '<div><div class="eyebrow">Lo que tenéis que poner</div>' +
        '<div class="serif" style="font-size:44px;font-weight:300;line-height:1.02;margin-top:4px;' +
          'font-variant-numeric:tabular-nums">' + eu(k.aportacion) + '</div>' +
        '<div style="font-size:13px;color:var(--suave);margin-top:6px">' +
          (c.nombre ? H(c.nombre) + ' · ' : '') + eu(k.pvp) + '</div></div>' +
        '<div class="tarjeta" style="overflow:hidden">' +
          linea('Entrada' + (k.arras ? ' · ' + eu(k.arras) + ' en arras' : ''), k.entrada) +
          linea('Impuesto · ITP', k.itp) +
          linea('Gastos y honorarios', k.gastosCierre) +
          linea('Hipoteca del banco', k.hipoteca) +
        '</div>') +

      '<div><div class="eyebrow" style="margin-bottom:8px">Y cada mes</div>' +
      '<div class="tarjeta" style="overflow:hidden">' +
      (k.subrogacion
        ? tramo(eu(k.cuotaNueva), 'En vez de ' + eu(k.cuotaHoy), 'fijo al ' + D.pct(k.tin, 2))
        : tramo(eu(k.cuotaFija), 'Los ' + k.plazoFijo + ' primeros años', 'fijo al ' + D.pct(k.tinFijo, 2)) +
          (k.cuotaVariable ? tramo(eu(k.cuotaVariable), 'Después, hasta el año ' + k.plazoTotal,
            'euríbor + ' + String(c.diferencial).replace('.', ',')) : '')) +
      '</div></div>' +

      '<div style="display:flex;gap:8px;margin-top:auto">' +
        '<button data-cq="salir-presentacion" class="b-secundario" style="flex:1">Salir</button>' +
        '<button data-cq="editar" class="b-secundario" style="flex:1">Editar</button>' +
        '<button data-cq="mandar" class="b-primario" style="flex:1.4">Mandárselo</button></div>';
  }
  function tramo(cifra, cuando, detalle) {
    return '<div style="display:flex;align-items:center;gap:14px;padding:13px 15px;border-top:1px solid var(--sep)">' +
      '<span class="serif" style="font-size:23px;font-weight:500;min-width:74px;font-variant-numeric:tabular-nums">' +
        H(cifra) + '</span>' +
      '<span style="flex:1;min-width:0"><span style="display:block;font-size:13px">' + H(cuando) + '</span>' +
      '<span style="display:block;font-size:11.5px;color:var(--suave);margin-top:1px">' + H(detalle) + '</span></span></div>';
  }
  function hoyLargo() {
    var M = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
    var d = new Date();
    return d.getDate() + ' ' + M[d.getMonth()] + ' ' + d.getFullYear();
  }

  /* ── 02 · tocando un número ──────────────────────────────────────────────
     Regla del teclado de la serie: cabecera fija, cuerpo con scroll, botón
     anclado. Y la cifra grande arriba MOVIÉNDOSE, que es medio diseño.

     Aquí vive la comparación (C3): al subir al 90 %, el «le faltan» desaparece
     delante del cliente, y eso hay que verlo al mismo tiempo que se toca. */
  var PCT = [70, 80, 90];
  function abrirTocar(campo) {
    hoja = { campo: campo, valor: valorDe(campo) };
    pintarHojaTocar();
  }
  function valorDe(campo) {
    if (campo === 'tinVar') return c.ov && c.ov.tinVar != null ? c.ov.tinVar : (c.euribor + c.diferencial);
    return c.ov && c.ov[campo] != null ? c.ov[campo] : c[campo];
  }
  function esPct(campo) { return campo === 'tinFijo' || campo === 'tinVar'; }

  function pintarHojaTocar() {
    var previo = { pvp: c.pvp, hipoteca: c.hipoteca }, campo = hoja.campo;
    var sim = {}; for (var key in c) sim[key] = c[key];
    var ov = {}; for (var j in (c.ov || {})) ov[j] = c.ov[j];
    /* la simulación tiene que hacer lo MISMO que aplicar(), o la cifra que se
       ve mientras tecleas no sería la que queda al confirmar */
    if (FORMULA.indexOf(campo) >= 0) ov[campo] = hoja.valor;
    else if (campo === 'tinVar') sim.diferencial = Math.round((hoja.valor - c.euribor) * 1000) / 1000;
    else sim[campo] = hoja.valor;
    sim.ov = ov;
    var k = D.calcularCuadre(sim), base = calc();

    var caja = document.getElementById('hoja-cq') || document.createElement('div');
    caja.id = 'hoja-cq';
    caja.style.cssText = 'position:fixed;inset:0;z-index:200;display:flex;flex-direction:column';
    caja.innerHTML =
      '<div data-cq="cerrar-hoja" style="flex:1;background:rgba(22,33,62,.42)"></div>' +
      '<div style="background:var(--sup);border-radius:0;box-shadow:0 -14px 40px rgba(22,33,62,.22);' +
        'padding:15px 16px calc(env(safe-area-inset-bottom,0px) + 15px);flex-shrink:0">' +
        '<div style="width:38px;height:4px;border-radius:0;background:var(--boton);margin:0 auto 13px"></div>' +
        /* la cifra protagonista sigue arriba y se mueve al teclear */
        '<div class="eyebrow">' + (k.subrogacion ? 'Se ahorra' : 'Tiene que poner') + '</div>' +
        '<div style="display:flex;align-items:baseline;gap:10px;margin-top:2px">' +
          '<span class="serif" style="font-size:30px;font-weight:400;font-variant-numeric:tabular-nums">' +
            eu(k.subrogacion ? k.ahorroNeto : k.aportacion) + '</span>' +
          (diferencia(base, k)) + '</div>' +
        (k.tiene && !k.subrogacion
          ? '<div style="font-size:12.5px;margin-top:4px">' +
            '<span style="color:var(--suave)">Tiene ' + eu(k.tiene) + ' · </span>' +
            (k.hueco > 0 ? '<span style="color:var(--aviso);font-weight:500">le faltan ' + eu(k.hueco) + '</span>'
                         : '<span style="color:var(--exito);font-weight:500">le sobran ' + eu(-k.hueco) + '</span>') +
            '</div>' : '') +

        '<div style="display:flex;align-items:center;gap:10px;margin-top:15px">' +
          '<span style="flex:1;font-size:13px;color:var(--suave)">' + H(ETIQ[campo] || campo) + '</span>' +
          '<input id="cq-in" inputmode="decimal" value="' + H(String(hoja.valor)) + '" ' +
            'style="width:150px;text-align:right;border:1px solid var(--accion);border-radius:8px;' +
            'box-shadow:0 0 0 3px rgba(0,102,177,.12);height:52px;padding:0 11px;font-family:var(--mono);' +
            'font-size:19px;color:var(--tinta);background:none;outline:none">' +
          '<span style="font-size:14px;color:var(--suave);width:14px">' + (esPct(campo) ? '%' : '€') + '</span>' +
        '</div>' +

        (campo === 'hipoteca' && previo.pvp ? atajos(previo.pvp) : '') +
        (campo === 'hipoteca' && previo.pvp ? comparar(base, k, previo) : '') +

        '<button data-cq="aplicar" class="b-primario" style="width:100%;margin-top:15px">' +
          'Dejar en ' + (esPct(campo) ? D.pct(hoja.valor, 2) : eu(hoja.valor)) + '</button>' +
        (c.ov && c.ov[campo] != null
          ? '<button data-cq="devolver-uno" class="b-secundario" style="width:100%;margin-top:8px">' +
            'Devolver al cálculo</button>' : '') +
      '</div>';
    if (!caja.parentNode) document.body.appendChild(caja);
    var i = document.getElementById('cq-in');
    i.addEventListener('input', function () {
      hoja.valor = parseFloat(String(i.value).replace(',', '.')) || 0;
      pintarHojaTocar();
    });
    setTimeout(function () { try { i.focus(); i.setSelectionRange(i.value.length, i.value.length); } catch (e) {} }, 30);
  }
  function diferencia(a, b) {
    var d = (b.subrogacion ? b.ahorroNeto - a.ahorroNeto : b.aportacion - a.aportacion);
    if (!d) return '';
    return '<span class="mono" style="font-size:13.5px;color:' + (d < 0 ? 'var(--exito)' : 'var(--aviso)') + '">' +
      (d < 0 ? '−' : '+') + eu(Math.abs(d)) + '</span>';
  }
  function atajos(pvp) {
    return '<div style="display:flex;gap:8px;margin-top:11px">' + PCT.map(function (p) {
      var v = Math.round(pvp * p / 100), on = v === hoja.valor;
      return '<button data-pct="' + p + '" style="flex:1;height:44px;border-radius:8px;font-size:14px;font-weight:500;' +
        (on ? 'border:1px solid var(--accion);background:var(--accion);color:#fff'
            : 'border:1px solid var(--borde);background:var(--sup);color:rgba(22,33,62,.7)') + '">' + p + ' %</button>';
    }).join('') + '</div>';
  }
  /* La comparación es una FRASE, no dos columnas: en 390 px dos columnas son
     ilegibles. Y con dos tramos hay dos diferencias, así que se dan las dos —
     decir «paga 110 € más» sin decir en cuál es media respuesta. */
  function comparar(base, k, previo) {
    if (k.hipoteca === base.hipoteca) return '';
    var dPone = base.aportacion - k.aportacion;
    var dFijo = (k.cuotaFija || 0) - (base.cuotaFija || 0);
    var dVar  = (k.cuotaVariable || 0) - (base.cuotaVariable || 0);
    var ltvBase = base.ltv;
    return '<div style="font-size:12.5px;line-height:1.6;color:rgba(22,33,62,.72);margin-top:11px;' +
      'padding:11px 12px;background:var(--sep);border-radius:9px">' +
      'Frente al ' + D.pct(ltvBase, 0) + ': pone ' + eu(Math.abs(dPone)) + (dPone > 0 ? ' menos' : ' más') +
      ', paga ' + eu(Math.abs(dFijo)) + (dFijo > 0 ? ' más' : ' menos') + ' en el tramo fijo y ' +
      eu(Math.abs(dVar)) + ' en el variable' +
      (k.tiene ? (k.hueco <= 0 ? ', y le llega el dinero que tiene.' : ', y le siguen faltando ' + eu(k.hueco) + '.') : '.') +
      '</div>';
  }

  /* ── 06 · mandárselo ─────────────────────────────────────────────────────
     Enlace primero, PDF con el mismo tamaño. El idioma se decide mirando al
     cliente, así que es una elección al mandar y no un ajuste escondido. */
  function abrirMandar() {
    var k = calc();
    idioma = c.idioma || 'es';
    var caja = document.createElement('div');
    caja.id = 'hoja-cq';
    caja.style.cssText = 'position:fixed;inset:0;z-index:200';
    function pinta() {
      caja.innerHTML = '<div data-cq="cerrar-hoja" style="position:absolute;inset:0;background:rgba(22,33,62,.42)"></div>' +
        '<div style="position:absolute;left:0;right:0;bottom:0;background:var(--sup);border-radius:13px 13px 0 0;' +
          'box-shadow:0 -14px 40px rgba(22,33,62,.22);padding:16px 16px calc(env(safe-area-inset-bottom,0px) + 16px)">' +
          '<div style="width:38px;height:4px;border-radius:2px;background:var(--borde);margin:0 auto 14px"></div>' +
          '<div class="serif" style="font-size:19px;font-weight:500">Mandarle el cuadre</div>' +
          '<div style="font-size:12.5px;color:var(--suave);margin-top:5px">' +
            (k.subrogacion ? eu(k.ahorroNeto) + ' de ahorro · ' + eu(k.cuotaNueva) + ' al mes'
                           : eu(k.aportacion) + ' · ' + eu(k.cuotaFija) + ' y ' + eu(k.cuotaVariable) + ' al mes') +
            ' · a ' + H(aQuien()) + '</div>' +

          '<div class="eyebrow" style="margin:15px 0 8px">En qué idioma</div>' +
          '<div style="display:flex;gap:8px">' +
          [['ca','Català'],['es','Castellano']].map(function (l) {
            var on = idioma === l[0];
            /* un valor elegido es SIEMPRE el azul de acción, nunca el ámbar */
            return '<button data-idioma="' + l[0] + '" style="flex:1;height:48px;border-radius:8px;font-size:14px;' +
              'font-weight:500;' + (on ? 'border:1px solid var(--accion);background:var(--accion);color:#fff'
                : 'border:1px solid var(--borde);background:var(--sup);color:rgba(22,33,62,.7)') + '">' + l[1] + '</button>';
          }).join('') + '</div>' +

          '<div style="display:flex;flex-direction:column;gap:8px;margin-top:14px">' +
            camino('enlace', IC.enlace, 'Enlace del portal',
                   'Un toque · siempre la última versión · se puede retirar') +
            camino('pdf', IC.wapp, 'PDF por WhatsApp',
                   'Lo que reenvía a su gestor o a su padre') +
          '</div>' +
          '<div style="font-size:11.5px;line-height:1.6;color:var(--suave);margin-top:12px">' +
            'Van los dos tramos y el ITP de cada titular. Los honorarios de AJ también: son parte de lo ' +
            'que paga, y esconderlos aquí solo aplaza la conversación.</div>' +
        '</div>';
      caja.querySelectorAll('[data-idioma]').forEach(function (b) {
        b.onclick = function () { idioma = b.getAttribute('data-idioma'); pinta(); };
      });
    }
    pinta();
    document.body.appendChild(caja);
  }
  function camino(k, icono, titulo, det) {
    return '<button data-camino="' + k + '" class="fila tarjeta" style="width:100%;text-align:left;padding:13px 14px">' +
      '<span style="color:var(--accion);flex-shrink:0">' + ico(icono, 18) + '</span>' +
      '<span style="flex:1;min-width:0">' +
        '<span style="display:block;font-size:14px;font-weight:500">' + H(titulo) + '</span>' +
        '<span style="display:block;font-size:11.5px;color:var(--suave);margin-top:1px">' + H(det) + '</span></span>' +
      '<span style="color:var(--raya);flex-shrink:0">' + ico(IC.flecha, 14) + '</span></button>';
  }
  function aQuien() {
    var t = (c.titulares || []).map(function (x) { return String(x.nombre || '').split(' ')[0]; }).filter(Boolean);
    if (!t.length) return 'su cliente';
    return t.length === 1 ? t[0] : t.slice(0, -1).join(', ') + ' y ' + t[t.length - 1];
  }

  /* ── 08 · marcarlo como el vigente ───────────────────────────────────────
     Hay siete cuadres en el sistema y ninguno marcado. El campo existe —«la
     hoja que vale hoy», uno por persona— y no lo rellena nadie. Se pregunta AL
     MANDAR, no al guardar: hasta que el cliente lo tiene delante, ningún
     cuadre es el bueno. */
  function abrirVigente(camino) {
    var otros = D.cuadresDe(c.personaUuid).filter(function (x) { return x.id && x.id !== c.id; });
    var caja = document.createElement('div');
    caja.id = 'hoja-cq';
    caja.style.cssText = 'position:fixed;inset:0;z-index:200';
    caja.innerHTML = '<div data-cq="cerrar-hoja" style="position:absolute;inset:0;background:rgba(22,33,62,.42)"></div>' +
      '<div style="position:absolute;left:0;right:0;bottom:0;background:var(--sup);border-radius:13px 13px 0 0;' +
        'box-shadow:0 -14px 40px rgba(22,33,62,.22);padding:16px 16px calc(env(safe-area-inset-bottom,0px) + 16px)">' +
        '<div style="width:38px;height:4px;border-radius:2px;background:var(--borde);margin:0 auto 14px"></div>' +
        '<div style="display:flex;align-items:center;gap:8px;color:var(--exito)">' + ico(IC.check, 16) +
          '<span style="font-size:13px;font-weight:500">' +
          (camino === 'pdf' ? 'PDF preparado' : 'Enlace enviado') + '</span></div>' +
        '<div style="font-size:12px;color:var(--suave);margin-top:3px">A ' + H(aQuien()) + ', en ' +
          (idioma === 'ca' ? 'català' : 'castellano') + '</div>' +
        '<div class="serif" style="font-size:19px;font-weight:500;margin-top:14px">¿Es este el cuadre que vale hoy?</div>' +
        '<div style="font-size:12.5px;line-height:1.6;color:var(--suave);margin-top:6px">' +
          (otros.length
            ? nombreCorto() + ' tiene ' + (otros.length + 1) + ' cuadres y ninguno marcado. El que marques es el ' +
              'que sale en su ficha, en el portal y en los avisos.'
            : 'El que marques es el que sale en su ficha, en el portal y en los avisos.') + '</div>' +
        (otros.length ? '<div class="eyebrow" style="margin:13px 0 8px">Los otros quedan como histórico</div>' +
          '<div class="tarjeta" style="overflow:hidden">' + otros.slice(0, 3).map(function (o, i) {
            var ko = D.calcularCuadre(o);
            return '<div class="fila" style="' + (i ? 'border-top:1px solid var(--sep)' : '') + '">' +
              '<span style="flex:1;min-width:0;font-size:13px">' + H(o.nombre || o.codigo || 'Cuadre') + '</span>' +
              '<span class="mono" style="font-size:13px;color:var(--suave)">' +
                eu(ko.subrogacion ? ko.ahorroNeto : ko.aportacion) + '</span></div>';
          }).join('') + '</div>' : '') +
        '<button data-cq="vigente-si" class="b-primario" style="width:100%;margin-top:15px">Sí, este es el que vale</button>' +
        '<button data-cq="cerrar-hoja" class="b-secundario" style="width:100%;margin-top:8px">Ahora no</button>' +
        '<div style="font-size:11.5px;line-height:1.55;color:var(--tenue);margin-top:11px;text-align:center">' +
          'Se pregunta al mandar, no al guardar: hasta que el cliente lo tiene delante, ningún cuadre es «el bueno».</div>' +
      '</div>';
    document.body.appendChild(caja);
  }
  /* Los nombres se guardan «Apellidos, Nombre», así que el primer trozo es el
     apellido: para hablarle de tú hace falta lo de después de la coma. */
  function nombreCorto() {
    var n = String(nombrePersona()).split(' · ')[0];
    return (n.indexOf(',') >= 0 ? n.split(',')[1] : n).trim().split(' ')[0] || n;
  }

  /* ── 07 · nuevo desde cero, en el piso ───────────────────────────────────
     Un campo: el precio. Todo lo demás son supuestos DECLARADOS —se enseñan,
     no se esconden— porque un supuesto escondido es un número inventado. */
  function pintarNuevo() {
    var p = (D.clientes() || []).filter(function (x) { return x.id === personaId || x.uuid === personaId; })[0];
    cabecera('Cuadre nuevo', (p && p.nombre) || 'Cliente', 'salir');
    var borrador = c || D.cuadreNuevo(p, '');
    var k = borrador.pvp ? D.calcularCuadre(borrador) : null;
    document.getElementById('cuerpo').innerHTML =
      '<div class="eyebrow">¿De qué precio hablamos?</div>' +
      '<div style="display:flex;align-items:center;gap:10px;margin-top:9px">' +
        '<input id="cq-precio" inputmode="numeric" placeholder="198.000" value="' +
          (borrador.pvp || '') + '" style="flex:1;height:60px;border:1px solid var(--accion);border-radius:9px;' +
          'box-shadow:0 0 0 3px rgba(0,102,177,.12);padding:0 13px;font-family:var(--mono);font-size:24px;' +
          'color:var(--tinta);background:none;outline:none">' +
        '<span style="font-size:18px;color:var(--suave)">€</span></div>' +

      '<div><div class="eyebrow" style="margin-bottom:8px">Se empieza suponiendo esto · no son campos</div>' +
      '<div class="tarjeta" style="overflow:hidden">' +
      supuesto('Hipoteca al 80 %', k ? eu(k.hipoteca) : '—') +
      supuesto('Mixta · ' + borrador.plazoFijo + ' años fijos y ' + (borrador.plazoTotal - borrador.plazoFijo) +
               ' variables', 'tarifa de hoy') +
      supuesto('ITP · ' + (borrador.titulares.length === 1 ? '1 titular al tipo general'
                            : borrador.titulares.length + ' titulares'), k ? eu(k.itp) : '—') +
      supuesto('Gastos y honorarios', 'estándar') +
      supuesto('Ingresos y capital de su ficha',
               borrador.ingresos || borrador.capitalDisponible
                 ? eu(borrador.ingresos) + ' · ' + eu(borrador.capitalDisponible)
                 : 'no constan') +
      '</div></div>' +

      '<button data-cq="ver-numeros" class="b-primario" style="width:100%;margin-top:auto"' +
        (borrador.pvp ? '' : ' disabled style="width:100%;margin-top:auto;opacity:.5;cursor:default"') +
        '>Ver los números</button>';

    c = borrador;
    var i = document.getElementById('cq-precio');
    i.addEventListener('input', function () {
      c.pvp = parseFloat(String(i.value).replace(/[^\d]/g, '')) || 0;
      c.hipoteca = Math.round(c.pvp * 0.8);
      var pos = i.selectionStart; pintarNuevo();
      var e = document.getElementById('cq-precio');
      if (e) { e.focus(); try { e.setSelectionRange(pos, pos); } catch (x) {} }
    });
    setTimeout(function () { try { i.focus(); } catch (e) {} }, 30);
  }
  function supuesto(t, v) {
    return '<div class="fila"><span style="flex:1;font-size:13px">' + H(t) + '</span>' +
      '<span class="mono" style="font-size:13px;color:var(--suave)">' + H(v) + '</span></div>';
  }

  /* ── pintar y clics ──────────────────────────────────────────────────────── */
  function pintar() {
    var barra = document.getElementById('barra');
    if (barra && vista !== 'presentacion') barra.style.display = '';
    if (vista === 'presentacion') return pintarPresentacion();
    if (vista === 'desglose')     return pintarDesglose();
    if (vista === 'nuevo')        return pintarNuevo();
    pintarCuadre();
  }
  function cerrarHoja() { var e = document.getElementById('hoja-cq'); if (e) e.remove(); hoja = null; }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-tocar]');
    if (t && c) { abrirTocar(t.getAttribute('data-tocar')); return; }
    var p = e.target.closest('[data-pct]');
    if (p && hoja) { hoja.valor = Math.round(c.pvp * +p.getAttribute('data-pct') / 100); pintarHojaTocar(); return; }
    var cm = e.target.closest('[data-camino]');
    if (cm) { var via = cm.getAttribute('data-camino'); cerrarHoja(); abrirVigente(via); return; }
    var ti = e.target.closest('[data-titular]');
    if (ti) { abrirEditorTitulares(); return; }

    var b = e.target.closest('[data-cq]');
    if (!b) return;
    var a = b.getAttribute('data-cq');
    if (a === 'cerrar-hoja')  { cerrarHoja(); return; }
    if (a === 'cuadre')       { vista = 'cuadre'; pintar(); return; }
    if (a === 'desglose')     { vista = 'desglose'; pintar(); return; }
    if (a === 'presentar')    { vista = 'presentacion'; pintar(); return; }
    if (a === 'salir-presentacion' || a === 'editar') { vista = 'cuadre'; pintar(); return; }
    if (a === 'mandar')       { abrirMandar(); return; }
    if (a === 'salir')        { salir(); return; }
    if (a === 'ver-numeros')  { vista = 'cuadre'; pintar(); return; }
    if (a === 'aplicar') {
      aplicar(hoja.campo, hoja.valor); cerrarHoja(); pintar(); return;
    }
    if (a === 'devolver-uno') { delete c.ov[hoja.campo]; cerrarHoja(); pintar(); return; }
    if (a === 'devolver')     { c.ov = {}; pintar(); return; }
    if (a === 'vigente-si')   { marcarVigente(); return; }
  });

  /* Qué campos son «fórmula» y qué son dato. La lista NO es una opinión de esta
     pantalla: es exactamente la que usa la Ficha 360 (`CQ_FORMULA`), porque
     `manual{}` es el mismo jsonb en las dos. Meter aquí `tin_fijo` marcaría
     como «puesto a mano» un campo que allí es un dato normal, y la Ficha
     pintaría una insignia de override sobre algo que no lo es.

     Un dato se cambia; una fórmula se SOBRESCRIBE y queda marcada. */
  var FORMULA = ['itp', 'capital', 'cuotaFija', 'cuotaVariable', 'cuotaMax'];
  function aplicar(campo, valor) {
    c.ov = c.ov || {};
    if (FORMULA.indexOf(campo) >= 0) { c.ov[campo] = valor; return; }
    /* El tipo del tramo variable no es un campo: es euríbor + diferencial. El
       euríbor lo pone el mercado, así que lo que se mueve es el diferencial —
       que además es lo que de verdad se negocia con el banco. */
    if (campo === 'tinVar') { c.diferencial = Math.round((valor - c.euribor) * 1000) / 1000; return; }
    c[campo] = valor;
  }

  function marcarVigente() {
    c.vigente = true;
    cerrarHoja();
    if (c.id && window.AJ && AJ.remote) {
      /* la cola de AJ.remote se encarga de que salga en cuanto haya red: sin
         cobertura no se dice que se ha guardado, se guarda y se dice */
      AJ.remote.actualizar
        ? AJ.remote.actualizar('cuadres', 'id=eq.' + c.id, { vigente: true })
        : null;
    }
    pintar();
  }

  function salir() {
    var barra = document.getElementById('barra');
    if (barra) barra.style.display = '';
    if (personaId) window.AJapp.shell.ir('cliente:' + personaId);
    else window.AJapp.shell.ir('inicio');
  }

  /* ── estado 10 · «el ITP sí se toca» · editor de titulares ──────────────────
     El reparto (% de compra) y el tipo de ITP (general 10 % / reducido 5 %) son
     DATOS REALES del cliente, no simulación: se corrigen aquí y se GUARDAN
     (D.guardarTitularesCuadre escribe el fila y empuja a Supabase). El reparto
     tiene que sumar 100 % para poder guardar —la regla R2 de titularidades—. */
  function abrirEditorTitulares(onGuardado) {
    if (!c || !(c.titulares || []).length) { alert('Este cuadre no tiene titulares que repartir.'); return; }
    var tits = c.titulares.map(function (t) { return { nombre: t.nombre, compra: nmv(t.compra), itp: nmv(t.itp) }; });
    var cap = document.createElement('div'); cap.id = 'editT-cap';
    cap.style.cssText = 'position:fixed;inset:0;z-index:220';
    document.body.appendChild(cap);

    function importe(t) { return Math.round(c.pvp * (t.compra || 0) / 100 * (t.itp || 0) / 100); }
    function suma() { return Math.round(tits.reduce(function (a, t) { return a + (t.compra || 0); }, 0) * 10) / 10; }
    function totalITP() { return tits.reduce(function (a, t) { return a + importe(t); }, 0); }

    function refrescar() {
      var s = suma(), ok = s === 100;
      tits.forEach(function (t, i) {
        var im = cap.querySelector('#et-im-' + i); if (im) im.textContent = eu(importe(t));
        cap.querySelectorAll('[data-itp-tit="' + i + '"]').forEach(function (b) {
          var on = (+b.getAttribute('data-itp-val')) === t.itp;
          b.style.cssText = baseBtn + (on ? 'border:none;background:var(--navy);color:#fff'
                                          : 'border:1px solid var(--boton);background:none;color:var(--suave)');
        });
      });
      var sm = cap.querySelector('#et-suma'); if (sm) { sm.textContent = tits.map(function (t) { return (t.compra || 0); }).join(' + ') + ' = ' + s + ' %'; sm.style.color = ok ? 'var(--exito)' : 'var(--aviso)'; }
      var to = cap.querySelector('#et-total'); if (to) to.textContent = eu(totalITP());
      var cm = cap.querySelector('#et-comp'); if (cm) cm.textContent = eu(tits.reduce(function (a, t) { return a + Math.round(c.pvp * (t.compra || 0) / 100 * 10 / 100); }, 0));
      var g = cap.querySelector('#et-guardar'); if (g) { g.disabled = !ok; g.style.opacity = ok ? '1' : '.5'; }
    }
    var baseBtn = 'flex:1;height:44px;border-radius:0;font-size:13px;font-weight:500;letter-spacing:.02em;';

    function pinta() {
      cap.innerHTML = '<div data-editt="fondo" style="position:absolute;inset:0;background:rgba(22,33,62,.42)"></div>' +
        '<div style="position:absolute;left:0;right:0;bottom:var(--kb,0px);max-height:calc(90dvh - var(--kb,0px));background:var(--sup);' +
        'border-radius:0;box-shadow:0 -14px 40px rgba(22,33,62,.22);display:flex;flex-direction:column">' +
          '<div style="padding:14px 16px 10px;flex-shrink:0">' +
            '<div style="width:38px;height:4px;border-radius:0;background:var(--boton);margin:0 auto 13px"></div>' +
            '<div class="serif" style="font-size:19px;font-weight:500;line-height:1.25">El impuesto de los dos</div>' +
            '<div style="font-size:12.5px;color:var(--suave);margin-top:3px">Sobre ' + eu(c.pvp) + ' · cada uno paga por su parte</div></div>' +
          '<div style="flex:1;overflow-y:auto;padding:0 16px;display:flex;flex-direction:column;gap:12px">' +
            tits.map(function (t, i) {
              return '<div style="background:#fbfcfe;border:1px solid var(--sep);border-radius:0;padding:12px 13px">' +
                '<div style="display:flex;align-items:baseline;justify-content:space-between;gap:8px">' +
                  '<span style="font-size:14px;font-weight:500">' + H(t.nombre || 'Titular ' + (i + 1)) + '</span>' +
                  '<span id="et-im-' + i + '" class="mono" style="font-size:13.5px;color:var(--suave)">' + eu(importe(t)) + '</span></div>' +
                '<div style="display:flex;align-items:center;gap:8px;margin-top:10px">' +
                  '<span style="font-size:12.5px;color:var(--suave)">Compra el</span>' +
                  '<input data-compra-tit="' + i + '" type="number" inputmode="decimal" min="0" max="100" value="' + t.compra + '" ' +
                    'style="width:64px;height:40px;border:none;border-bottom:1px solid var(--tinta);border-radius:0;padding:0 4px;font:500 16px/1 IBM Plex Mono,monospace;color:var(--tinta);text-align:center;background:none">' +
                  '<span style="font-size:13px">%</span></div>' +
                '<div style="display:flex;gap:7px;margin-top:9px">' +
                  '<button data-itp-tit="' + i + '" data-itp-val="10" style="' + baseBtn + '">General · 10 %</button>' +
                  '<button data-itp-tit="' + i + '" data-itp-val="5" style="' + baseBtn + '">Reducido · 5 %</button>' +
                '</div></div>';
            }).join('') +
            '<div style="display:flex;align-items:center;justify-content:space-between;font-size:12.5px;padding:2px 2px">' +
              '<span style="color:var(--suave)">Reparto · suma 100 %</span>' +
              '<span id="et-suma" class="mono" style="font-weight:500"></span></div>' +
            '<div style="display:flex;align-items:baseline;justify-content:space-between;font-size:13.5px;padding:8px 2px 0;border-top:1px solid var(--tinta)">' +
              '<span style="font-weight:500">Impuesto total</span>' +
              '<span id="et-total" class="mono" style="font-size:18px;font-weight:600"></span></div>' +
            '<div style="display:flex;align-items:baseline;gap:9px;padding:5px 2px 4px">' +
              '<span class="serif" style="font-style:italic;font-size:13px;color:var(--navy)">con los dos al general</span>' +
              '<span style="flex:1;height:1px;background:var(--filete)"></span>' +
              '<span id="et-comp" class="mono" style="font-size:12.5px;color:var(--suave)"></span></div>' +
          '</div>' +
          '<div style="flex-shrink:0;padding:12px 16px calc(env(safe-area-inset-bottom,0px) + 14px);border-top:1px solid var(--sep);background:var(--sup)">' +
            '<button id="et-guardar" class="b-primario" style="width:100%">Guardar en el cuadre</button></div>' +
        '</div>';
      cap.querySelector('[data-editt="fondo"]').onclick = function () { cap.remove(); };
      cap.querySelectorAll('[data-compra-tit]').forEach(function (inp) {
        inp.addEventListener('input', function () { tits[+inp.getAttribute('data-compra-tit')].compra = nmv(inp.value); refrescar(); });
      });
      cap.querySelectorAll('[data-itp-tit]').forEach(function (b) {
        b.onclick = function () { tits[+b.getAttribute('data-itp-tit')].itp = +b.getAttribute('data-itp-val'); refrescar(); };
      });
      cap.querySelector('#et-guardar').onclick = function () {
        if (suma() !== 100) return;
        /* en memoria para que el desglose lo refleje ya */
        c.titulares = tits.map(function (t) { return { nombre: t.nombre, compra: t.compra, itp: t.itp }; });
        /* y persistido (fila local + Supabase) en el formato crudo del cuadro */
        if (c.id) D.guardarTitularesCuadre(c.id, tits.map(function (t) { return { nombre: t.nombre, compra_pct: t.compra, itp_pct: t.itp }; }));
        cap.remove();
        if (onGuardado) onGuardado(); else pintar();
      };
      refrescar();
    }
    pinta();
  }

  function nmv(v) { v = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(v) ? v : 0; }

  window.AJapp.cuadre = {
    /* abrir(cuadreId) · abrirDe(personaId) · nuevo(personaId) · editarTitulares(cuadreId, cb) */
    editarTitulares: function (cuadreId, onGuardado) {
      var prev = c;
      c = D.cuadre(cuadreId);
      if (!c) { c = prev; alert('No se ha encontrado el cuadre.'); return; }
      abrirEditorTitulares(function () { c = prev; if (onGuardado) onGuardado(); });
    },
    abrir: function (id) {
      c = D.cuadre(id); vista = 'cuadre'; hoja = null;
      if (!c) { window.AJapp.shell.ir('inicio'); return; }
      personaId = personaDe(c);
      pintar();
    },
    abrirDe: function (pid) {
      personaId = pid;
      var p = (D.clientes() || []).filter(function (x) { return x.id === pid; })[0];
      var lista = p ? D.cuadresDe(p.uuid) : [];
      /* el vigente primero, y si ninguno lo es —que es lo que pasa hoy en los
         siete del sistema— el más reciente */
      c = lista.filter(function (x) { return x.vigente; })[0] || lista[0] || null;
      if (!c) { vista = 'nuevo'; c = null; pintar(); return; }
      vista = 'cuadre'; pintar();
    },
    nuevo: function (pid) { personaId = pid; c = null; vista = 'nuevo'; pintar(); }
  };
  function personaDe(cq) {
    var p = (D.clientes() || []).filter(function (x) { return x.uuid === cq.personaUuid; })[0];
    return p ? p.id : null;
  }
})();
