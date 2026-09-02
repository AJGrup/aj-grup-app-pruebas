/* ═══════════════════════════════════════════════════════════════════════════
   App AJ Finances · 02 · Agenda — port 1:1 de «App Agenda.dc-2.html»

   El mock lo dice en su titular y aquí se respeta: no es un calendario, es la
   máquina de cerrar. Por eso se ordena al revés de un calendario — arriba lo
   que hay que cerrar, luego lo que viene, y las horas vacías como sitio donde
   meter algo.

   Mes no entra, y es decisión del mock: con las actividades que hay, una
   cuadrícula sería una pantalla de huecos.

   Van dentro las tres correcciones anotadas en el brief:
     C1 · la hoja de cierre lleva scroll propio y el botón anclado. Medido: la
          hoja son ~707 px y el teclado del móvil se come entre 291 y 336 de
          los 844. Sin esto dejas de ver qué estado elegiste mientras escribes.
     C2 · la nota es obligatoria SOLO en «realizada» y «no realizada». En
          «anulada» no —hay test que lo fija— y al reabrir tampoco.
     C3 · «no realizada» no se pinta con el rojo de error: un cliente que no
          aparece no es un fallo del sistema, es información.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var D = window.AJapp.datos, I = window.AJapp.inicio;
  var H = I.H, svg = I.svg, pill = I.pill, tipo = I.tipo;
  var modo = 'dia';
  var mesRef = null, mesSel = null, equipo = false, semSel = null;   /* Agenda v2 · Mes + Equipo + Semana */

  /* ── respuestas rápidas · fijas por tipo y por estado, como decidió el mock.
     No aprenden el texto: una nota que se autoescribe con palabras de otro día
     es una nota falsa. */
  var RAPIDAS = {
    realizada: {
      llamada: ['Le paso la oferta', 'Pide precio', 'Queda en pensarlo'],
      cita:    ['Todo firmado', 'Falta documentación', 'Queda en revisarlo'],
      _:       ['Hecho', 'Queda pendiente de su respuesta']
    },
    no_realizada: {
      _: ['No se presentó', 'Avisó y la aplazó', 'No pude ir yo', 'No localizado']
    }
  };
  function rapidas(estado, t) {
    var g = RAPIDAS[estado]; if (!g) return [];
    return g[t] || g._ || [];
  }

  var NOMBRE_ESTADO = { realizada:'realizada', no_realizada:'no realizada',
                        anulada:'anulada', programada:'abierta' };
  function hayRed() { return navigator.onLine !== false; }

  /* ── 08 · cerrando sin cobertura ─────────────────────────────────────────
     Se dice qué va a pasar con lo que escribes —se guarda aquí y sube cuando
     haya red— y cuánto hay esperando ya. Nada dice «subiendo». */
  function sinCoberturaCerrando() {
    if (hayRed()) return '';
    var q = D.porSubir();
    return '<div class="tarjeta" style="padding:12px 13px;border-color:#e8dcc4;background:#fdfaf3">' +
      '<div style="font-size:12.5px;line-height:1.55;color:rgba(22,33,62,.72)">' +
        'Se guarda en el móvil y sube en cuanto haya red.' +
        (q.length ? ' Esperando: <strong style="font-weight:600">' + q.length +
          (q.length === 1 ? ' cosa' : ' cosas') + '</strong>.' : '') + '</div>' +
      (q.length ? '<div style="margin-top:8px">' + q.slice(0, 2).map(function (x) {
        return '<div style="display:flex;gap:8px;font-size:12px;color:var(--suave);padding:2px 0">' +
          '<span style="flex:1;min-width:0">' + H(x.origen === 'runtime' ? 'Cambio sin subir'
            : (x.que === 'lead' ? 'Lead' : x.que === 'documento' ? 'Documento' : 'Fotos') +
              (x.nombre ? ' · ' + x.nombre : '')) + '</span>' +
          '<span>' + H(x.bytes ? D.megas(x.bytes) : '') + '</span></div>';
      }).join('') + '</div>' : '') + '</div>';
  }

  /* ── la hoja de cierre ─────────────────────────────────────────────────── */
  var hoja = null;
  function cerrarHoja() { if (hoja) { hoja.remove(); hoja = null; } }

  function abrirCierre(act) {
    cerrarHoja();
    var estado = 'realizada', texto = '';
    hoja = document.createElement('div');
    hoja.style.cssText = 'position:fixed;inset:0;z-index:200;';
    document.body.appendChild(hoja);

    function pinta() {
      /* C2 · la etiqueta dice la verdad: obligatoria solo donde lo es */
      var obliga = (estado === 'realizada' || estado === 'no_realizada');
      var ops = [['realizada','Realizada','var(--exito)'],
                 ['no_realizada','No realizada','var(--tinta)'],   /* C3 · sin rojo de error */
                 ['anulada','Anulada','var(--tinta)'],
                 ['programada','Sigue abierta','var(--tinta)']];
      var rs = rapidas(estado, act.tipo);
      hoja.innerHTML =
        '<div data-cerrar="1" style="position:absolute;inset:0;background:rgba(22,33,62,.42)"></div>' +
        /* C1 · cabecera fija · cuerpo con scroll · botón anclado */
        '<div style="position:absolute;left:0;right:0;bottom:var(--kb,0px);max-height:calc(88dvh - var(--kb,0px));background:var(--sup);' +
        'border-radius:13px 13px 0 0;box-shadow:0 -14px 40px rgba(22,33,62,.22);display:flex;flex-direction:column">' +
          '<div style="padding:14px 16px 12px;flex-shrink:0">' +
            '<div style="width:38px;height:4px;border-radius:2px;background:var(--borde);margin:0 auto 13px"></div>' +
            '<div class="serif" style="font-size:19px;font-weight:500;line-height:1.25">Cerrar ' +
              H(tipo(act.tipo).l.toLowerCase()) + '</div>' +
            '<div style="font-size:13px;color:var(--suave);margin-top:3px">' +
              H((act.hora ? act.hora + ' · ' : '') + (act.quien || act.texto || '')) + '</div>' +
          '</div>' +
          '<div style="flex:1;overflow-y:auto;padding:0 16px;display:flex;flex-direction:column;gap:14px">' +
            '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' + ops.map(function (o) {
              var on = o[0] === estado;
              return '<button data-estado="' + o[0] + '" style="height:48px;border-radius:8px;font-size:14px;font-weight:500;' +
                (on ? 'border:1px solid ' + o[2] + ';background:color-mix(in srgb,' + o[2] + ' 9%,transparent);color:' + o[2]
                    : 'border:1px solid var(--borde);background:var(--sup);color:rgba(22,33,62,.7)') + '">' + o[1] + '</button>';
            }).join('') + '</div>' +
            (rs.length ? '<div><div class="eyebrow" style="margin-bottom:9px">Respuestas rápidas</div>' +
              '<div style="display:flex;flex-wrap:wrap;gap:8px">' + rs.map(function (r) {
                var on = texto === r;
                return '<button data-rapida="' + H(r) + '" style="height:48px;padding:0 14px;border-radius:8px;font-size:13.5px;font-weight:500;' +
                  (on ? 'border:1px solid var(--accion);background:rgba(0,102,177,.08);color:var(--accion)'
                      : 'border:1px solid var(--borde);background:var(--sup);color:rgba(22,33,62,.7)') + '">' + H(r) + '</button>';
              }).join('') + '</div></div>' : '') +
            sinCoberturaCerrando() +
            '<div><div class="eyebrow" style="margin-bottom:9px">Nota' + (obliga ? ' · obligatoria' : ' · si quieres') + '</div>' +
              '<textarea id="notaCierre" rows="3" placeholder="' + (obliga ? 'Qué pasó' : 'Opcional') + '" ' +
              'style="width:100%;border:1px solid var(--accion);border-radius:8px;box-shadow:0 0 0 3px rgba(0,102,177,.12);' +
              'padding:11px 12px;font:400 14.5px/1.55 inherit;color:var(--tinta);resize:none;outline:none">' + H(texto) + '</textarea>' +
            '</div>' +
          '</div>' +
          '<div style="flex-shrink:0;padding:12px 16px calc(env(safe-area-inset-bottom,0px) + 14px);' +
               'border-top:1px solid var(--sep);background:var(--sup)">' +
            /* Cerrar funciona SIEMPRE: es lo único que esta pantalla tiene que
               garantizar, y por eso no depende de la red. Avisar sí la necesita,
               así que se apaga y se dice (ley L8) en vez de fallar al pulsarlo. */
            (hayRed()
              ? '<div style="display:flex;gap:8px">' +
                (act.quien ? '<button data-avisar="1" class="b-secundario" style="flex:1">Avisar por WhatsApp</button>' : '') +
                '<button id="confirmaCierre" class="b-primario" style="flex:1.4">Cerrar como ' +
                  H(NOMBRE_ESTADO[estado]) + '</button></div>'
              : '<div style="display:flex;gap:8px">' +
                (act.quien ? '<button disabled class="b-secundario" style="flex:1;opacity:.5;cursor:default">' +
                  'Avisar por WhatsApp</button>' : '') +
                '<button id="confirmaCierre" class="b-primario" style="flex:1.4">Cerrar como ' +
                  H(NOMBRE_ESTADO[estado]) + '</button></div>' +
                (act.quien ? '<div style="font-size:11.5px;color:var(--tenue);margin-top:8px;text-align:center">' +
                  'Avisar necesita red: queda apagado hasta que vuelva.</div>' : '')) +
          '</div>' +
        '</div>';

      var ta = hoja.querySelector('#notaCierre');
      ta.addEventListener('input', function () { texto = ta.value; });
      hoja.querySelectorAll('[data-estado]').forEach(function (b) {
        b.onclick = function () { estado = b.getAttribute('data-estado'); pinta(); };
      });
      hoja.querySelectorAll('[data-rapida]').forEach(function (b) {
        b.onclick = function () { texto = b.getAttribute('data-rapida'); pinta();
          var t2 = hoja.querySelector('#notaCierre'); t2.focus(); t2.setSelectionRange(t2.value.length, t2.value.length); };
      });
      hoja.querySelector('[data-cerrar]').onclick = cerrarHoja;
      var av = hoja.querySelector('[data-avisar]');
      if (av) av.onclick = function () {
        var t = 'Hola ' + String(act.quien || '').split(' ')[0] + ', ' +
          (act.tipo === 'visita' ? 'sobre la visita' : 'sobre la cita') +
          (act.hora ? ' de las ' + act.hora : '') + ': ';
        window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank');
      };
      hoja.querySelector('#confirmaCierre').onclick = function () { confirmar(act, estado, texto); };
    }
    pinta();
  }

  function confirmar(act, estado, texto) {
    try {
      AJ.seguimientos.cambiarEstado(act.id, estado, texto.trim() ? { nota: texto.trim() } : undefined);
      cerrarHoja(); pintar();
    } catch (e) {
      /* El runtime es la autoridad sobre la nota, no esta pantalla: si dice que
         falta, se enseña su motivo en vez de adivinarlo aquí. */
      var ta = hoja && hoja.querySelector('#notaCierre');
      if (ta) { ta.style.borderColor = 'var(--error)'; ta.focus();
        ta.placeholder = 'Hace falta una nota para cerrar así'; }
    }
  }

  /* ── vista de día ──────────────────────────────────────────────────────── */
  function huecos(ag) {
    var ocupadas = ag.hoy.map(function (a) { return parseInt((a.hora || '0').slice(0, 2), 10); });
    var libres = [], ini = null;
    for (var h = 9; h <= 20; h++) {
      var lib = ocupadas.indexOf(h) < 0;
      if (lib && ini === null) ini = h;
      if ((!lib || h === 20) && ini !== null) {
        /* la jornada acaba a las 20:00: un hueco que llega a las 21 no es un
           hueco, es que se ha acabado el día */
        var fin = Math.min(lib ? h + 1 : h, 20);
        if (fin - ini >= 2) libres.push(String(ini).padStart(2,'0') + ':00 – ' + String(fin).padStart(2,'0') + ':00');
        ini = null;
      }
    }
    return libres.slice(0, 2);
  }

  /* ── Agenda v2 · la banda horaria (rejilla 8–20) ────────────────────────────
     El rediseño central de la v2: el día como una franja de horas con los
     bloques colocados por su hora, los huecos que se pueden tocar para agendar,
     y la línea roja de «ahora». Sustituye a la lista de huecos de texto. */
  var BH0 = 8, BH1 = 20, BPX = 24;   /* de 8:00 a 20:00, 24 px por hora */
  function horaF(hhmm) { var p = String(hhmm || '').split(':'); return (+p[0] || 0) + ((+p[1] || 0) / 60); }
  function fmtH(f) { var h = Math.floor(f + 1e-6), m = Math.round((f - h) * 60); return h + ':' + String(m).padStart(2, '0'); }
  function durH(a) { var d = a.duracion_min || a.duracion || 0; if (!d) d = a.tipo === 'llamada' ? 30 : 60; return d / 60; }
  function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

  function bandaHoras(citas) {
    var alto = (BH1 - BH0) * BPX;
    var lineas = '';
    for (var hh = BH0; hh <= BH1; hh++) {
      var top = (hh - BH0) * BPX;
      lineas += '<div style="position:absolute;left:40px;right:2px;top:' + top + 'px;height:1px;background:var(--sep)"></div>' +
        '<div class="mono" style="position:absolute;left:0;top:' + (top - 6) + 'px;width:34px;text-align:right;font-size:10px;color:var(--tenue)">' + hh + ':00</div>';
    }
    var cs = citas.filter(function (a) { return a.hora; })
      .map(function (a) { var sH = horaF(a.hora); return { a: a, s: sH, e: sH + durH(a) }; })
      .sort(function (x, y) { return x.s - y.s; });

    var bloques = cs.map(function (c) {
      var t = tipo(c.a.tipo);
      var top = clamp((c.s - BH0) * BPX, 0, alto);
      var hgt = Math.max(clamp((c.e - c.s) * BPX, 0, alto - top), 20);
      var ir = c.a.personaId ? 'cliente:' + c.a.personaId : 'agenda';
      return '<button data-ir="' + H(ir) + '" style="position:absolute;left:44px;right:4px;top:' + top + 'px;height:' + hgt + 'px;' +
        'background:color-mix(in srgb,' + t.c + ' 10%,#fff);border-left:2px solid ' + t.c + ';border-radius:6px;padding:4px 8px;' +
        'text-align:left;overflow:hidden">' +
        '<div style="font-size:12px;font-weight:500;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">' + H(t.l + ' · ' + (c.a.quien || c.a.texto || '')) + '</div>' +
        (hgt > 30 ? '<div class="mono" style="font-size:10.5px;color:var(--suave);margin-top:1px">' + H(fmtH(c.s) + ' – ' + fmtH(c.e)) + '</div>' : '') +
        '</button>';
    }).join('');

    /* huecos: de 8:00 al primero, entre citas, y del último a 20:00 */
    var huecosB = '', cur = BH0;
    function gap(a, b) {
      if (b - a < 0.5) return '';
      var top = (a - BH0) * BPX, hgt = (b - a) * BPX;
      return '<button data-hueco="' + String(Math.round(a)).padStart(2, '0') + ':00" ' +
        'style="position:absolute;left:44px;right:4px;top:' + top + 'px;height:' + hgt + 'px;border:1px dashed #d7dde8;border-radius:6px;' +
        'background:transparent;display:flex;align-items:center;justify-content:center;font-size:11.5px;color:var(--accion)">' +
        (hgt > 26 ? fmtH(a) + ' – ' + fmtH(b) + ' · toca para agendar' : '+') + '</button>';
    }
    cs.forEach(function (c) { if (c.s > cur + 0.25) huecosB += gap(cur, c.s); cur = Math.max(cur, c.e); });
    if (cur < BH1 - 0.25) huecosB += gap(cur, BH1);

    var ahora = new Date(), nf = ahora.getHours() + ahora.getMinutes() / 60, nowL = '';
    if (nf >= BH0 && nf <= BH1) {
      var nt = (nf - BH0) * BPX;
      nowL = '<div style="position:absolute;left:40px;right:2px;top:' + nt + 'px;height:1px;background:var(--error);z-index:3"></div>' +
        '<div style="position:absolute;left:37px;top:' + (nt - 3) + 'px;width:7px;height:7px;border-radius:50%;background:var(--error);z-index:3"></div>';
    }
    return '<div style="position:relative;height:' + alto + 'px;margin-bottom:4px">' + lineas + huecosB + bloques + nowL + '</div>';
  }

  function vistaDia(ag) {
    var h = bandaHoras(ag.hoy);
    if (ag.vencidas.length) {
      var v = ag.vencidas[0];
      h += '<div><div class="eyebrow" style="color:var(--aviso);margin-bottom:8px">Sin cerrar · ' +
        (ag.vencidas.length > 1 ? ag.vencidas.length : 'de ' + D.diaMes(v.fecha)) + '</div>' +
        '<div class="tarjeta" style="border-left:3px solid var(--aviso);padding:13px 14px;display:flex;align-items:center;gap:12px">' +
        '<div style="flex:1;min-width:0"><div style="font-size:14px">' + H(tipo(v.tipo).l + ' · ' + (v.texto || '')) + '</div>' +
        '<div style="font-size:12.5px;color:var(--suave);margin-top:2px">' + H(D.diaMes(v.fecha) + (v.quien ? ' · ' + v.quien : '')) + '</div></div>' +
        '<button class="b-primario" style="height:48px;padding:0 16px;font-size:14px" data-cerrar-act="' + H(v.id) + '">Cerrar</button></div>' +
        (ag.vencidas.length > 1 ? '<button class="b-secundario" style="width:100%;margin-top:8px" data-ver="atrasado">Ver las ' +
          ag.vencidas.length + ' sin cerrar</button>' : '') + '</div>';
    }
    if (ag.hoy.length) {
      h += '<div><div class="eyebrow" style="margin-bottom:8px">Hoy</div><div class="tarjeta sombra" style="overflow:hidden">' +
        ag.hoy.map(function (a, i) {
          var t = tipo(a.tipo), prim = i === 0;
          return '<div style="' + (prim ? 'background:#f9fafd;' : '') + (i ? 'border-top:1px solid var(--sep);' : '') + '">' +
            '<div class="fila" style="min-height:' + (prim ? '56px' : '52px') + '">' +
              '<span class="hora">' + H(a.hora || '—') + '</span>' +
              '<span class="punto" style="width:8px;height:8px;background:' + t.c + ';flex-shrink:0"></span>' +
              '<span style="flex:1;min-width:0"><span style="display:block;font-size:14px' + (prim ? ';font-weight:500' : '') + '">' +
                H(a.texto || t.l) + '</span>' +
              (a.quien ? '<span style="display:block;font-size:12.5px;color:var(--suave);margin-top:1px">' + H(a.quien) + '</span>' : '') +
              '</span></div>' +
            (prim ? '<div style="display:flex;gap:8px;padding:0 14px 14px">' +
              '<button class="b-primario" style="flex:1;font-size:14px" data-cerrar-act="' + H(a.id) + '">Cerrar</button>' +
              (a.telefono ? '<a href="tel:' + H(String(a.telefono).replace(/\D+/g,'')) + '" class="b-secundario" style="width:48px;color:var(--accion);text-decoration:none;display:inline-flex;align-items:center;justify-content:center">' + svg('llamar',20) + '</a>' : '') +
              '</div>' : '') + '</div>';
        }).join('') + '</div></div>';
    }
    /* día vacío · la que más se verá, con trabajo propio (brief §3) */
    if (!ag.hoy.length && !ag.vencidas.length) {
      var ad = D.sePuedeAdelantar();
      h += '<div><div class="eyebrow" style="margin-bottom:8px">Hace días que no se les llama</div>' +
        '<div class="tarjeta sombra" style="overflow:hidden">' + (ad.length ? ad.map(function (x, i) {
          return '<button class="fila" data-ir="' + H(x.ir) + '" style="width:100%;text-align:left;' +
                 (i ? 'border-top:1px solid var(--sep);' : '') + '"><span style="flex:1"><span style="display:block;font-size:14px">' +
                 H(x.texto) + '</span><span style="display:block;font-size:12.5px;color:var(--suave);margin-top:1px">' +
                 H(x.detalle) + '</span></span><span style="color:var(--raya)">' + svg('chevron',16) + '</span></button>';
        }).join('') : '<div style="padding:18px 16px;font-size:13.5px;color:var(--suave)">Nada pendiente. Buen momento para captar.</div>') +
        '</div></div>';
    }
    h += '<div style="margin-top:auto;display:flex;gap:8px">' +
      '<button class="b-primario" style="flex:1" data-ver="agendar">Agendar</button></div>';
    return h;
  }

  /* ── 06 · agendar · tres campos ──────────────────────────────────────────
     Cuándo, con quién y de qué tipo. Lo demás son valores por defecto, y se
     DECLARAN debajo en vez de esconderse en un formulario largo: la regla de
     los tres campos de esta app se cumple diciendo lo que se supone, no
     callándolo.

     Hasta hoy el botón «Agendar» llevaba a Capturar, que abre la hoja de las
     cuatro puertas: se podía cerrar una cita pero no crear una, que es la mitad
     de una agenda. */
  /* Finances agenda cita y llamada. «Visita» era de Inmo; una actividad antigua
     de tipo visita se sigue mostrando, pero desde aquí ya no se crea. */
  var TIPOS_AG = [['cita','Cita'], ['llamada','Llamada']];
  var HORAS = ['10:00', '12:00', '17:00'];
  var nueva = null;

  function abrirAgendar() {
    nueva = { tipo: 'cita', persona: null, dia: 'manana', hora: '12:00', q: '', dur: 60, durManual: false };
    pintarAgendar();
  }
  function diaISO(k) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(k)) return k;   /* fecha exacta (hueco del Mes) */
    var d = new Date();
    if (k === 'manana') d.setDate(d.getDate() + 1);
    if (k === 'otro') d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  }
  function nombreDia(k) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(k)) {
      var d = new Date(k);
      return ['dom','lun','mar','mié','jue','vie','sáb'][d.getDay()] + ' ' + d.getDate();
    }
    return k === 'hoy' ? 'hoy' : k === 'manana' ? 'mañana' : 'otro día';
  }

  /* ── 07 · choque de horario ──────────────────────────────────────────────
     Avisa, ofrece la alternativa, y el botón de agendar SIGUE VIVO: dos cosas
     a la misma hora pasan de verdad —una cita y una llamada— y esta app captura,
     no filtra (§4.2). El único gate del sistema es el de arras. */
  function choque() {
    var ag = D.agenda(), iso = diaISO(nueva.dia);
    var mismo = ag.hoy.concat(ag.manana, ag.futuro).filter(function (a) {
      return a.fecha === iso && a.hora === nueva.hora;
    })[0];
    if (!mismo) return null;
    var libres = huecos(ag).filter(function (h) { return h.indexOf(nueva.hora) < 0; });
    return { con: mismo, libres: libres.slice(0, 2) };
  }

  function pintarAgendar() {
    var ch = choque(), iso = diaISO(nueva.dia);
    var elegido = nueva.persona;
    var candidatos = nueva.q
      ? D.clientes().filter(function (c) {
          return D.normalizar(c.nombre).indexOf(D.normalizar(nueva.q)) >= 0;
        }).slice(0, 4)
      : [];

    document.getElementById('cuerpo').innerHTML =
      '<div><div class="eyebrow" style="margin-bottom:9px">De qué tipo</div>' +
      '<div style="display:flex;gap:8px">' + TIPOS_AG.map(function (t) {
        var on = nueva.tipo === t[0];
        return '<button data-ag-tipo="' + t[0] + '" style="flex:1;height:48px;border-radius:8px;font-size:14px;' +
          'font-weight:500;' + (on ? 'border:1px solid var(--accion);background:var(--accion);color:#fff'
            : 'border:1px solid var(--borde);background:var(--sup);color:rgba(22,33,62,.7)') + '">' +
          t[1] + '</button>';
      }).join('') + '</div></div>' +

      '<div><div class="eyebrow" style="margin-bottom:9px">Con quién</div>' +
      (elegido
        ? '<button data-ag-quitar="1" class="fila tarjeta" style="width:100%;text-align:left">' +
          '<span style="flex:1;min-width:0"><span style="display:block;font-size:14px">' + H(elegido.nombre) + '</span>' +
          '<span class="mono" style="display:block;font-size:12px;color:var(--suave);margin-top:1px">' +
            H(elegido.id) + '</span></span>' +
          '<span style="font-size:12.5px;color:var(--accion)">Cambiar</span></button>'
        : '<input id="ag-q" autocomplete="off" placeholder="Tres letras bastan" value="' + H(nueva.q) + '" ' +
          'style="width:100%;height:52px;padding:0 12px;border:1px solid var(--accion);border-radius:8px;' +
          'box-shadow:0 0 0 3px rgba(0,102,177,.12);font-size:14.5px;font-family:inherit;color:var(--tinta)">' +
          (candidatos.length ? '<div class="tarjeta" style="overflow:hidden;margin-top:8px">' +
            candidatos.map(function (c, i) {
              return '<button data-ag-persona="' + H(c.id) + '" class="fila" style="width:100%;text-align:left' +
                (i ? ';border-top:1px solid var(--sep)' : '') + '">' +
                '<span style="flex:1;font-size:14px">' + H(c.nombre) + '</span>' +
                '<span class="mono" style="font-size:12px;color:var(--suave)">' + H(c.id) + '</span></button>';
            }).join('') + '</div>' : '')) + '</div>' +

      '<div><div class="eyebrow" style="margin-bottom:9px">Cuándo</div>' +
      '<div style="display:flex;gap:8px">' + [['hoy','Hoy'],['manana','Mañana'],['otro','Otro día']].map(function (d) {
        var on = nueva.dia === d[0];
        return '<button data-ag-dia="' + d[0] + '" style="flex:1;height:48px;border-radius:8px;font-size:14px;' +
          'font-weight:500;' + (on ? 'border:1px solid var(--accion);background:var(--accion);color:#fff'
            : 'border:1px solid var(--borde);background:var(--sup);color:rgba(22,33,62,.7)') + '">' +
          d[1] + '</button>';
      }).join('') + '</div>' +
      '<div style="display:flex;gap:8px;margin-top:8px">' + HORAS.map(function (h) {
        var on = nueva.hora === h;
        return '<button data-ag-hora="' + h + '" class="mono" style="flex:1;height:48px;border-radius:8px;' +
          'font-size:14px;font-weight:500;' + (on ? 'border:1px solid var(--accion);background:var(--accion);color:#fff'
            : 'border:1px solid var(--borde);background:var(--sup);color:rgba(22,33,62,.7)') + '">' +
          h + '</button>';
      }).join('') + '</div></div>' +

      '<div><div class="eyebrow" style="margin-bottom:9px">Cuánto dura</div>' +
      '<div style="display:flex;gap:8px">' + [[15,"15'"],[30,"30'"],[60,'1 h'],[90,'1 h 30']].map(function (d) {
        var on = nueva.dur === d[0];
        return '<button data-ag-dur="' + d[0] + '" style="flex:1;height:48px;border-radius:8px;font-size:13.5px;font-weight:500;' +
          (on ? 'border:1px solid var(--accion);background:rgba(0,102,177,.08);color:var(--accion)'
              : 'border:1px solid var(--borde);background:var(--sup);color:rgba(22,33,62,.7)') + '">' + d[1] + '</button>';
      }).join('') + '</div></div>' +

      (ch ? '<div class="tarjeta" style="padding:13px 14px;border-color:#e8dcc4;background:#fdfaf3">' +
        '<div style="font-size:13.5px;font-weight:500;color:var(--aviso)">Ya tienes algo a las ' + H(nueva.hora) + '</div>' +
        '<div style="font-size:12.5px;line-height:1.55;color:rgba(22,33,62,.7);margin-top:5px">' +
          H(tipo(ch.con.tipo).l + ' · ' + (ch.con.texto || '') + (ch.con.quien ? ' con ' + ch.con.quien : '')) +
          '. Puedes agendar las dos: aquí se avisa, no se bloquea.</div>' +
        (ch.libres.length ? '<div style="display:flex;gap:8px;margin-top:10px">' + ch.libres.map(function (l) {
          var h = l.split(' ')[0];
          return '<button data-ag-hora="' + H(h) + '" class="b-chico" style="flex:1">' + H(h) + ' libre</button>';
        }).join('') + '</div>' : '') + '</div>' : '') +

      /* los supuestos, declarados */
      '<div style="font-size:12px;line-height:1.6;color:var(--suave)">' +
      'Una hora por defecto, media si es llamada; sin aviso previo. El recordatorio ' +
      'se cambia después desde la ficha.</div>' +

      '<div style="margin-top:auto"><button data-ag-guardar="1" class="b-primario" style="width:100%"' +
      (elegido ? '' : ' disabled') + ' style="width:100%' + (elegido ? '' : ';opacity:.5;cursor:default') + '">' +
      'Agendar ' + H(TIPOS_AG.filter(function (t) { return t[0] === nueva.tipo; })[0][1].toLowerCase()) +
      ' · ' + nombreDia(nueva.dia) + ' ' + H(nueva.hora) +
      (ch ? ' igualmente' : '') + '</button></div>';

    var q = document.getElementById('ag-q');
    if (q) q.addEventListener('input', function () {
      nueva.q = q.value; var pos = q.selectionStart; pintarAgendar();
      var e2 = document.getElementById('ag-q');
      if (e2) { e2.focus(); try { e2.setSelectionRange(pos, pos); } catch (x) {} }
    });
  }

  function guardarAgendada() {
    if (!nueva || !nueva.persona) return;
    try {
      AJ.seguimientos.crear({
        entidadOrigen: 'persona', entidadId: nueva.persona.id, personaId: nueva.persona.id,
        tipo: nueva.tipo, texto: (nueva.tipo === 'cita' ? 'Cita' : 'Llamada') +
          ' con ' + nueva.persona.nombre,
        fecha: diaISO(nueva.dia), hora: nueva.hora, duracion_min: nueva.dur || 45,
        estado: 'programada', autorId: 'app', autorNombre: D.yo().nombre
      });
      nueva = null; sub = 'dia'; pintar();
    } catch (e) {
      console.warn('[app] no se ha podido agendar:', e.message);
      alert('No se ha podido agendar: ' + e.message);
    }
  }

  /* ── vista de semana · siete filas, no siete columnas ──────────────────── */
  /* ── Agenda v2 · Semana · rejilla de 7 columnas por hora ────────────────────
     La semana (lun–dom) como columnas de horas 8–20 con los bloques colocados;
     tocar un día lo selecciona y su detalle —con los botones de Cerrar— sale
     debajo. Reutiliza el reloj de la banda del Día. */
  function lunesDe(iso) { var d = new Date(iso); var off = (d.getDay() + 6) % 7; d.setDate(d.getDate() - off); return d; }
  function isoDe(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  function vistaSemana(ag) {
    var hoyISO = D.hoyISO();
    var lun = lunesDe(hoyISO);
    var dias = [], todas = ag.hoy.concat(ag.manana, ag.futuro, ag.vencidas);
    for (var i = 0; i < 7; i++) { var d = new Date(lun.getTime() + i * 864e5); dias.push(isoDe(d)); }
    if (!semSel || dias.indexOf(semSel) < 0) semSel = hoyISO;
    var DIA = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    var pxH = 18, alto = (BH1 - BH0) * pxH;

    /* cabecera de días · tocable */
    var cab = '<div style="display:grid;grid-template-columns:26px repeat(7,1fr);margin-bottom:6px">' +
      '<div></div>' + dias.map(function (iso, di) {
        var d = new Date(iso), esHoy = iso === hoyISO, sel = iso === semSel;
        return '<button data-sem-dia="' + iso + '" style="display:flex;flex-direction:column;align-items:center;gap:1px;padding:4px 0;border-radius:8px;' +
          (sel ? 'background:var(--accion);color:#fff;' : esHoy ? 'color:var(--accion);font-weight:600;' : 'color:var(--tinta);') + '">' +
          '<span style="font-size:9.5px;font-weight:600;letter-spacing:.04em;opacity:.75">' + DIA[di] + '</span>' +
          '<span style="font-size:13px">' + d.getDate() + '</span></button>';
      }).join('') + '</div>';

    /* líneas de hora + etiquetas */
    var lineas = '';
    for (var hh = BH0; hh <= BH1; hh += 2) {
      var top = (hh - BH0) * pxH;
      lineas += '<div style="position:absolute;left:26px;right:0;top:' + top + 'px;height:1px;background:var(--sep)"></div>' +
        '<div class="mono" style="position:absolute;left:0;top:' + (top - 5) + 'px;width:22px;text-align:right;font-size:9px;color:var(--tenue)">' + hh + '</div>';
    }
    /* columnas con bloques */
    var cols = dias.map(function (iso) {
      var cs = todas.filter(function (a) { return a.fecha === iso && a.hora; });
      var blocks = cs.map(function (a) {
        var s0 = horaF(a.hora), s1 = s0 + durH(a), t = tipo(a.tipo);
        var top = clamp((s0 - BH0) * pxH, 0, alto), hgt = Math.max(clamp((s1 - s0) * pxH, 0, alto - top), 12);
        return '<div style="position:absolute;left:1px;right:1px;top:' + top + 'px;height:' + hgt + 'px;background:' + t.c + ';opacity:.85;border-radius:3px"></div>';
      }).join('');
      return '<div data-sem-dia="' + iso + '" style="position:relative;border-left:1px solid var(--sep)' + (iso === semSel ? ';background:rgba(0,102,177,.05)' : '') + '">' + blocks + '</div>';
    }).join('');
    var ahora = new Date(), nf = ahora.getHours() + ahora.getMinutes() / 60, nowL = '';
    if (nf >= BH0 && nf <= BH1) { var nt = (nf - BH0) * pxH; nowL = '<div style="position:absolute;left:26px;right:0;top:' + nt + 'px;height:1px;background:var(--error);z-index:3"></div>'; }
    var grid = '<div style="position:relative;height:' + alto + 'px">' + lineas +
      '<div style="display:grid;grid-template-columns:26px repeat(7,1fr);position:absolute;inset:0"><div></div>' + cols + '</div>' + nowL + '</div>';

    /* detalle del día seleccionado, con Cerrar */
    var det = todas.filter(function (a) { return a.fecha === semSel; })
      .sort(function (a, b) { return String(a.hora || '99').localeCompare(String(b.hora || '99')); });
    var dSel = new Date(semSel);
    var detalle = '<div style="margin-top:14px"><div class="eyebrow" style="margin-bottom:8px">' +
      H(['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'][dSel.getDay()] + ' ' + dSel.getDate() + (semSel === hoyISO ? ' · hoy' : '')) +
      (det.length ? ' · ' + det.length : '') + '</div>' +
      (det.length
        ? '<div class="tarjeta" style="overflow:hidden">' + det.map(function (a, i) {
            var t = tipo(a.tipo), pas = a.fecha < hoyISO;
            return '<div style="display:flex;align-items:center;gap:11px;padding:11px 13px;' + (i ? 'border-top:1px solid var(--sep);' : '') + '">' +
              '<span class="mono" style="font-size:12.5px;width:40px;flex-shrink:0">' + H(a.hora || '—') + '</span>' +
              '<span class="punto" style="width:8px;height:8px;background:' + t.c + ';flex-shrink:0"></span>' +
              '<span style="flex:1;min-width:0;font-size:13.5px">' + H(a.texto || t.l) + (a.quien ? ' · ' + H(a.quien) : '') + '</span>' +
              '<button class="b-chico" data-cerrar-act="' + H(a.id) + '">Cerrar</button></div>';
          }).join('') + '</div>'
        : '<button data-hueco="10:00" data-sem-hueco="' + semSel + '" class="tarjeta" style="width:100%;text-align:center;padding:16px;font-size:13px;color:var(--suave)">Nada ese día. Toca para agendar.</button>') + '</div>';

    return cab + grid + detalle;
  }

  /* ── 09 · atrasado ────────────────────────────────────────────────────────
     La misma pantalla para dos y para veinte, y lo que cambia lo decide el
     atasco, no una opción:
       · 1-2 · las dos enteras, sin grupos ni contadores. Agrupar dos es teatro
       · 3-8 · dos grupos con su cuenta —«esta semana» y «más de una semana»—
               y sigue cabiendo todo
       · 9+  · el grupo viejo se pliega a «ver las N restantes» y se enciende el
               cierre en bloque. Nada se esconde: se resume y se puede abrir
     El cierre en bloque pide UNA nota para todas, que es la única salida
     honesta para lo que ya no se recuerda — y por eso anula, no da por hecha. */
  var abiertoViejo = false;
  function filaVencida(a, i) {
    var t = tipo(a.tipo);
    return '<div class="fila" style="' + (i ? 'border-top:1px solid var(--sep);' : '') + '">' +
      '<span class="punto" style="width:8px;height:8px;background:' + t.c + ';flex-shrink:0"></span>' +
      '<div style="flex:1;min-width:0"><div style="font-size:14px">' + H(t.l + ' · ' + (a.texto || '')) + '</div>' +
      '<div style="font-size:12.5px;color:var(--suave);margin-top:1px">' + H(D.diaMes(a.fecha)) +
        (a.quien ? ' · ' + H(a.quien) : '') + ' · hace ' + a.dias + ' día' + (a.dias === 1 ? '' : 's') + '</div></div>' +
      '<button class="b-primario" style="height:48px;padding:0 16px;font-size:14px" data-cerrar-act="' +
        H(a.id) + '">Cerrar</button></div>';
  }
  function grupo(titulo, filas, plegado) {
    if (!filas.length) return '';
    var ver = plegado ? filas.slice(0, 2) : filas;
    return '<div style="margin-bottom:14px"><div class="eyebrow" style="margin-bottom:8px">' +
      H(titulo) + ' · ' + filas.length + '</div>' +
      '<div class="tarjeta sombra" style="overflow:hidden">' + ver.map(filaVencida).join('') + '</div>' +
      (plegado && filas.length > 2
        ? '<button data-abrir-viejo="1" class="b-secundario" style="width:100%;margin-top:8px">' +
          'Ver las ' + (filas.length - 2) + ' restantes</button>' : '') + '</div>';
  }

  function vistaAtrasado(ag) {
    var v = ag.vencidas, n = v.length;
    if (!n) return '<div class="tarjeta" style="padding:20px 18px">' +
      '<div style="font-size:14px;font-weight:500">No queda nada sin cerrar</div>' +
      '<div style="font-size:13px;color:var(--suave);margin-top:6px;line-height:1.55">' +
      'La agenda dice la verdad.</div></div>' +
      '<div style="margin-top:auto"><button class="b-secundario" style="width:100%" data-ver="dia">Volver al día</button></div>';

    var cuerpo;
    if (n <= 2) {
      cuerpo = '<div><div class="eyebrow" style="margin-bottom:8px">' +
        (n === 1 ? 'La que hay' : 'Las dos, enteras') + '</div>' +
        '<div class="tarjeta sombra" style="overflow:hidden">' + v.map(filaVencida).join('') + '</div>' +
        '<div style="font-size:12px;line-height:1.5;color:var(--tenue);margin-top:9px">' +
        'Con dos no hay grupos ni contadores: dos filas y dos botones. Agrupar dos cosas es teatro.</div></div>';
    } else {
      var semana = v.filter(function (a) { return a.dias <= 7; });
      var viejas = v.filter(function (a) { return a.dias > 7; });
      var plegar = n >= 9 && !abiertoViejo;
      cuerpo = grupo('Esta semana', semana, false) + grupo('Más de una semana', viejas, plegar);
    }

    /* Apagado con pocas, porque cerrarlas de una en una cuesta menos. Desde
       nueve se enciende: es cuando cerrar una a una deja de ser razonable. */
    var enBloque = n >= 9;
    return cuerpo +
      '<div style="margin-top:auto;display:flex;flex-direction:column;gap:8px">' +
      (enBloque
        ? '<button data-anular-bloque="1" style="width:100%;height:48px;border:1px solid var(--aviso);' +
          'border-radius:8px;background:transparent;color:var(--aviso);font-size:14px;font-weight:500">' +
          'Anular las ' + v.filter(function (a) { return a.dias > 7; }).length + ' más viejas de golpe</button>' +
          '<div style="font-size:11.5px;line-height:1.5;color:var(--tenue);text-align:center">' +
          'Pide una sola nota para todas: es la única salida honesta para lo que ya no se recuerda.</div>'
        : '') +
      '<button class="b-secundario" style="width:100%" data-ver="dia">Volver al día</button></div>';
  }

  /* Una nota para todas, y anular —no dar por hechas—: de lo que pasó hace tres
     semanas no se puede afirmar nada. */
  function anularEnBloque(ag) {
    var viejas = ag.vencidas.filter(function (a) { return a.dias > 7; });
    if (!viejas.length) return;
    var cap = document.createElement('div');
    cap.style.cssText = 'position:fixed;inset:0;z-index:200';
    cap.innerHTML = '<div data-cerrar="1" style="position:absolute;inset:0;background:rgba(22,33,62,.42)"></div>' +
      '<div style="position:absolute;left:0;right:0;bottom:0;background:var(--sup);border-radius:13px 13px 0 0;' +
        'box-shadow:0 -14px 40px rgba(22,33,62,.22);padding:16px 16px calc(env(safe-area-inset-bottom,0px) + 16px)">' +
        '<div style="width:38px;height:4px;border-radius:2px;background:var(--borde);margin:0 auto 14px"></div>' +
        '<div class="serif" style="font-size:19px;font-weight:500">Anular ' + viejas.length + ' de golpe</div>' +
        '<div style="font-size:13px;line-height:1.6;color:var(--suave);margin-top:7px">' +
          'Las de más de una semana. Se anulan, no se dan por hechas: de lo que pasó hace ' +
          'tanto no se puede afirmar nada.</div>' +
        '<div class="eyebrow" style="margin:14px 0 8px">Nota · una para todas</div>' +
        '<textarea id="notaBloque" rows="3" placeholder="Por qué se quedaron sin cerrar" ' +
          'style="width:100%;border:1px solid var(--accion);border-radius:8px;box-shadow:0 0 0 3px rgba(0,102,177,.12);' +
          'padding:11px 12px;font:400 14.5px/1.55 inherit;color:var(--tinta);resize:none;outline:none"></textarea>' +
        '<button id="bloqueOk" class="b-primario" style="width:100%;margin-top:14px">Anular las ' +
          viejas.length + '</button>' +
        '<button data-cerrar="1" class="b-secundario" style="width:100%;margin-top:8px">Cancelar</button>' +
      '</div>';
    document.body.appendChild(cap);
    cap.querySelectorAll('[data-cerrar]').forEach(function (b) { b.onclick = function () { cap.remove(); }; });
    cap.querySelector('#bloqueOk').onclick = function () {
      var ta = cap.querySelector('#notaBloque'), nota = (ta.value || '').trim();
      if (!nota) { ta.style.borderColor = 'var(--error)'; ta.placeholder = 'Hace falta una nota'; ta.focus(); return; }
      var fallos = 0;
      viejas.forEach(function (a) {
        try { AJ.seguimientos.cambiarEstado(a.id, 'anulada', { nota: nota }); } catch (e) { fallos++; }
      });
      cap.remove(); abiertoViejo = false; pintar();
      if (fallos) console.warn('[app] no se pudieron anular ' + fallos + ' de ' + viejas.length);
    };
  }

  /* ── pintar ────────────────────────────────────────────────────────────── */
  var sub = 'dia';
  /* ── Agenda v2 · vista MES · la cuadrícula del mes ──────────────────────────
     No sustituye a la máquina de cerrar (Día/Semana): la complementa para el
     que necesita el mapa del mes. Tocar un día lo abre debajo; tocar un hueco
     de ese día crea la cita a esa hora (misma regla que Semana). El Equipo es
     sólo para admin: el mes por persona, con lo que cada uno tiene y lo que le
     queda sin cerrar. */
  /* Fecha LOCAL, no la UTC de hoyISO(): el calendario tiene que cuadrar con la
     cabecera (fechaLarga, local). new Date('YYYY-MM-DD') parsea en UTC y de
     madrugada cae un día antes; por eso los meses se comparan por prefijo de
     string, nunca reparseando la fecha. */
  function hoyLocalISO() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function ymDe(ref) { return ref.getFullYear() + '-' + String(ref.getMonth() + 1).padStart(2, '0'); }
  function todasDelMes(ag, ref) {
    var ym = ymDe(ref);
    return ag.hoy.concat(ag.manana, ag.futuro, ag.vencidas).filter(function (a) {
      return String(a.fecha || '').slice(0, 7) === ym;
    });
  }
  function iniciales(nombre) {
    var p = String(nombre || '?').trim().split(/[\s,]+/).filter(Boolean);
    return ((p[0] || '?')[0] + (p[1] ? p[1][0] : '')).toUpperCase();
  }
  var MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

  function vistaMes(ag) {
    if (!mesRef) { var h = new Date(); mesRef = new Date(h.getFullYear(), h.getMonth(), 1); }
    if (equipo && (D.yo().rol === 'admin')) return vistaEquipo(ag);

    var y = mesRef.getFullYear(), m = mesRef.getMonth();
    var primero = new Date(y, m, 1), diasMes = new Date(y, m + 1, 0).getDate();
    var offset = (primero.getDay() + 6) % 7;        // lunes primero
    var cosas = todasDelMes(ag, mesRef), amDia = {}, pmDia = {}, sinCerrarDia = {};
    var hoyISO = hoyLocalISO();
    cosas.forEach(function (a) {
      if ((a.hora || '') < '14:00') amDia[a.fecha] = (amDia[a.fecha] || 0) + 1; else pmDia[a.fecha] = (pmDia[a.fecha] || 0) + 1;
      if (a.fecha < hoyISO) sinCerrarDia[a.fecha] = true;   // programada en el pasado = sin cerrar
    });

    var cab = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">' +
      '<div class="serif" style="font-size:20px;font-weight:500">' + H(MESES[m].charAt(0).toUpperCase() + MESES[m].slice(1)) + ' ' + y + '</div>' +
      '<div style="display:flex;gap:6px">' +
        '<button data-mes-nav="-1" style="width:38px;height:38px;border:1px solid var(--borde);border-radius:8px;background:var(--sup);color:var(--suave)">‹</button>' +
        '<button data-mes-nav="1" style="width:38px;height:38px;border:1px solid var(--borde);border-radius:8px;background:var(--sup);color:var(--suave)">›</button>' +
        (D.yo().rol === 'admin'
          ? '<div style="display:inline-flex;border:1px solid var(--borde);border-radius:8px;overflow:hidden;height:38px">' +
              '<button data-equipo="0" style="padding:0 12px;font-size:12.5px;font-weight:500;background:var(--accion);color:#fff">Mías</button>' +
              '<button data-equipo="1" style="padding:0 12px;font-size:12.5px;font-weight:500;background:var(--sup);color:var(--accion)">Equipo</button></div>'
          : '') +
      '</div></div>';

    var head = '<div style="display:grid;grid-template-columns:repeat(7,1fr);margin-bottom:4px">' +
      ['L','M','X','J','V','S','D'].map(function (d) {
        return '<div style="text-align:center;font-size:10px;font-weight:600;letter-spacing:.06em;color:var(--tenue)">' + d + '</div>';
      }).join('') + '</div>';

    var celdas = '';
    for (var i = 0; i < offset; i++) celdas += '<div></div>';
    for (var dia = 1; dia <= diasMes; dia++) {
      var iso = y + '-' + String(m + 1).padStart(2, '0') + '-' + String(dia).padStart(2, '0');
      var esHoy = iso === hoyISO, sel = iso === mesSel;
      var am = amDia[iso] || 0, pm = pmDia[iso] || 0, sc = sinCerrarDia[iso];
      var barCol = sel ? '#fff' : (sc ? 'var(--aviso)' : 'var(--accion)');
      var barras = (am || pm)
        ? '<span style="display:flex;gap:2px;height:5px">' +
            (am ? '<span style="width:9px;height:3px;border-radius:2px;background:' + barCol + '"></span>' : '<span style="width:9px"></span>') +
            (pm ? '<span style="width:9px;height:3px;border-radius:2px;background:' + (sel ? '#fff' : '#5b5bd6') + '"></span>' : '<span style="width:9px"></span>') +
          '</span>'
        : '<span style="height:5px"></span>';
      celdas += '<button data-mes-dia="' + iso + '" style="aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;border-radius:9px;' +
        (sel ? 'background:var(--accion);color:#fff;' : esHoy ? 'background:rgba(0,102,177,.09);color:var(--accion);font-weight:600;' : 'color:var(--tinta);') + '">' +
        '<span style="font-size:13.5px">' + dia + '</span>' + barras +
      '</button>';
    }
    var grid = '<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:3px">' + celdas + '</div>';

    /* el día elegido, debajo */
    var abajo = '';
    if (mesSel) {
      var deldia = cosas.filter(function (a) { return a.fecha === mesSel; })
        .sort(function (a, b) { return String(a.hora || '99').localeCompare(String(b.hora || '99')); });
      var ps = mesSel.split('-'); var dsel = new Date(+ps[0], +ps[1] - 1, +ps[2]);
      abajo = '<div style="margin-top:16px"><div class="eyebrow" style="margin-bottom:8px">' +
        H(['dom','lun','mar','mié','jue','vie','sáb'][dsel.getDay()] + ' ' + dsel.getDate() + (mesSel === hoyISO ? ' · hoy' : '')) +
        (deldia.length ? ' · ' + deldia.length : '') + '</div>' +
        (deldia.length
          ? '<div class="tarjeta" style="overflow:hidden">' + deldia.map(function (a, i) {
              var t = tipo(a.tipo);
              return '<div style="display:flex;align-items:center;gap:11px;padding:11px 13px;' + (i ? 'border-top:1px solid var(--sep);' : '') + '">' +
                '<span class="mono" style="font-size:12.5px;width:40px;flex-shrink:0">' + H(a.hora || '—') + '</span>' +
                '<span class="punto" style="width:8px;height:8px;background:' + t.c + ';flex-shrink:0"></span>' +
                '<span style="flex:1;min-width:0;font-size:13.5px">' + H(a.texto || t.l) + (a.quien ? ' · ' + H(a.quien) : '') + '</span></div>';
            }).join('') + '</div>'
          : '<button data-mes-hueco="' + mesSel + '" class="tarjeta" style="width:100%;text-align:center;padding:16px;font-size:13px;color:var(--suave)">' +
            'Nada ese día. Toca para agendar algo.</button>');
    } else {
      var ahoraM = new Date(), esPasado = (y < ahoraM.getFullYear()) || (y === ahoraM.getFullYear() && m < ahoraM.getMonth());
      if (esPasado) {
        var r = D.resumenMes(ymDe(mesRef));
        abajo = '<div style="margin-top:16px"><div class="eyebrow" style="margin-bottom:8px">Lo que pasó en ' + H(MESES[m]) + '</div>' +
          '<div class="tarjeta" style="overflow:hidden">' +
            '<div class="fila"><span style="flex:1;font-size:13.5px">Realizadas</span><span class="mono" style="font-size:14px;font-weight:500;color:var(--exito)">' + r.realizadas + '</span></div>' +
            '<div class="fila" style="border-top:1px solid var(--sep)"><span style="flex:1;font-size:13.5px">No realizadas</span><span class="mono" style="font-size:14px;font-weight:500;color:var(--error)">' + r.noRealizadas + '</span></div>' +
            (r.total ? '<div class="fila" style="border-top:1px solid var(--sep)"><span style="flex:1;font-size:13.5px">Se cerraron el mismo día</span><span class="mono" style="font-size:14px;font-weight:500">' + r.mismoDia + ' de ' + r.total + '</span></div>' : '') +
          '</div></div>';
      } else {
        abajo = '<div style="margin-top:14px;font-size:12px;line-height:1.5;color:var(--tenue);text-align:center">Toca un día para verlo.</div>';
      }
    }
    return cab + head + grid + abajo;
  }

  /* ── Equipo · sólo admin · el mes por persona ─────────────────────────────── */
  function vistaEquipo(ag) {
    var y = mesRef.getFullYear(), m = mesRef.getMonth();
    var segs = [];
    var ym = ymDe(mesRef);
    try { segs = (AJ.seguimientos.listar({}) || []).filter(function (s) {
      return (s.estado || 'programada') === 'programada' && String(s.fecha || '').slice(0, 7) === ym;
    }); } catch (e) {}
    var porPersona = {}, total = 0;
    segs.forEach(function (s) {
      var a = s.autorNombre || 'Sin asignar';
      (porPersona[a] = porPersona[a] || { n: 0 }).n++; total++;
    });
    var vencidas = 0, hoyISO = hoyLocalISO();
    try { vencidas = (AJ.seguimientos.listar({}) || []).filter(function (s) {
      return (s.estado || 'programada') === 'programada' && s.fecha && s.fecha < hoyISO;
    }).length; } catch (e) {}
    var filas = Object.keys(porPersona).sort(function (a, b) { return porPersona[b].n - porPersona[a].n; });

    var cab = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
      '<div class="serif" style="font-size:20px;font-weight:500">' + H(MESES[m].charAt(0).toUpperCase() + MESES[m].slice(1)) + ' ' + y + '</div>' +
      '<div style="display:inline-flex;border:1px solid var(--borde);border-radius:8px;overflow:hidden;height:38px">' +
        '<button data-equipo="0" style="padding:0 12px;font-size:12.5px;font-weight:500;background:var(--sup);color:var(--accion)">Mías</button>' +
        '<button data-equipo="1" style="padding:0 12px;font-size:12.5px;font-weight:500;background:var(--accion);color:#fff">Equipo</button></div></div>' +
      '<div style="font-size:12.5px;color:var(--suave);margin-bottom:12px">' + total + ' cita' + (total === 1 ? '' : 's') + ' · ' + filas.length + ' persona' + (filas.length === 1 ? '' : 's') + '</div>';

    var lista = '<div><div class="eyebrow" style="margin-bottom:8px">Por persona</div>' +
      '<div class="tarjeta" style="overflow:hidden">' + (filas.length ? filas.map(function (nom, i) {
        return '<div style="display:flex;align-items:center;gap:11px;padding:12px 14px;' + (i ? 'border-top:1px solid var(--sep);' : '') + '">' +
          '<span style="width:32px;height:32px;border-radius:50%;background:rgba(0,102,177,.1);color:var(--accion);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:600;flex-shrink:0">' + H(iniciales(nom)) + '</span>' +
          '<span style="flex:1;font-size:14px">' + H(nom) + '</span>' +
          '<span class="mono" style="font-size:13.5px;font-weight:500">' + porPersona[nom].n + '</span></div>';
      }).join('') : '<div style="padding:16px;font-size:13px;color:var(--suave)">Nadie tiene citas este mes.</div>') + '</div></div>';

    var pie = '<div style="margin-top:14px;font-size:12.5px;color:' + (vencidas ? 'var(--aviso)' : 'var(--suave)') + ';text-align:center">' +
      (vencidas ? vencidas + ' sin cerrar en todo el equipo' : 'Nada sin cerrar en todo el equipo') + '</div>';
    return cab + lista + pie;
  }

  function pintar() {
    var ag = D.agenda();
    var porSubir = hayRed() ? 0 : D.porSubir().length;
    var chip = porSubir ? pill('var(--aviso)', porSubir + ' sin subir')
             : ag.vencidas.length ? pill('var(--aviso)', ag.vencidas.length + ' sin cerrar')
             : pill('var(--exito)', 'al día');
    if (sub === 'agendar') {
      document.getElementById('cab').innerHTML =
        '<div style="display:flex;align-items:center;gap:11px">' +
        '<button data-ver="dia" style="width:30px;height:30px;margin-left:-6px;color:var(--suave);' +
        'display:flex;align-items:center;justify-content:center;transform:rotate(180deg)">' +
        svg('chevron', 18) + '</button>' +
        '<div><div class="eyebrow">Agenda</div>' +
        '<div class="serif" style="font-size:21px;font-weight:500;line-height:1.1;margin-top:2px">Agendar</div>' +
        '</div></div>';
      return;
    }
    document.getElementById('cab').innerHTML =
      (sub === 'atrasado'
        ? '<div class="eyebrow" style="color:var(--aviso)">Sin cerrar</div>' +
          '<div class="serif" style="font-size:23px;font-weight:500;line-height:1.1;margin-top:2px">' +
          ag.vencidas.length + ' actividad' + (ag.vencidas.length === 1 ? '' : 'es') + '</div>'
        : '<div style="display:flex;align-items:flex-end;justify-content:space-between;gap:12px">' +
          '<div><div class="eyebrow">' + H(D.fechaLarga()) + '</div>' +
          '<div class="serif" style="font-size:23px;font-weight:500;line-height:1.1;margin-top:3px">Agenda</div></div>' + chip + '</div>' +
          '<div style="display:flex;gap:6px;margin-top:13px">' +
          [['dia','Día'],['semana','Semana'],['mes','Mes']].map(function (m) {
            var on = modo === m[0];
            return '<button data-modo="' + m[0] + '" style="flex:1;height:48px;border-radius:8px;font-size:14px;font-weight:500;' +
              (on ? 'border:1px solid var(--accion);background:var(--accion);color:#fff'
                  : 'border:1px solid var(--borde);background:var(--sup);color:rgba(22,33,62,.7)') + '">' + m[1] + '</button>';
          }).join('') + '</div>');
    if (sub === 'agendar') { if (!nueva) abrirAgendar(); else pintarAgendar(); return; }
    document.getElementById('cuerpo').innerHTML =
      sub === 'atrasado' ? vistaAtrasado(ag) : (modo === 'mes' ? vistaMes(ag) : modo === 'semana' ? vistaSemana(ag) : vistaDia(ag));
  }

  document.addEventListener('click', function (e) {
    var m = e.target.closest('[data-modo]');
    if (m) { modo = m.getAttribute('data-modo'); sub = 'dia'; pintar(); return; }
    var mn = e.target.closest('[data-mes-nav]');
    if (mn) { var paso = parseInt(mn.getAttribute('data-mes-nav'), 10);
      if (!mesRef) { var hh = new Date(D.hoyISO()); mesRef = new Date(hh.getFullYear(), hh.getMonth(), 1); }
      mesRef = new Date(mesRef.getFullYear(), mesRef.getMonth() + paso, 1); mesSel = null; pintar(); return; }
    var md = e.target.closest('[data-mes-dia]');
    if (md) { mesSel = md.getAttribute('data-mes-dia'); pintar(); return; }
    var sd = e.target.closest('[data-sem-dia]');
    if (sd) { semSel = sd.getAttribute('data-sem-dia'); pintar(); return; }
    var sh = e.target.closest('[data-sem-hueco]');
    if (sh) { sub = 'agendar'; abrirAgendar(); nueva.dia = sh.getAttribute('data-sem-hueco'); nueva.hora = '10:00'; document.getElementById('cab').innerHTML = ''; pintar(); return; }
    var eq = e.target.closest('[data-equipo]');
    if (eq) { equipo = eq.getAttribute('data-equipo') === '1'; pintar(); return; }
    var mh = e.target.closest('[data-mes-hueco]');
    if (mh) { sub = 'agendar'; abrirAgendar(); nueva.dia = mh.getAttribute('data-mes-hueco'); document.getElementById('cab').innerHTML = ''; pintar(); return; }
    var v = e.target.closest('[data-ver]');
    if (v) {
      sub = v.getAttribute('data-ver');
      if (sub !== 'agendar') nueva = null;
      pintar(); return;
    }
    var g;
    if ((g = e.target.closest('[data-ag-tipo]')))  { nueva.tipo = g.getAttribute('data-ag-tipo'); if (!nueva.durManual) nueva.dur = nueva.tipo === 'llamada' ? 30 : 60; pintarAgendar(); return; }
    if ((g = e.target.closest('[data-ag-dia]')))   { nueva.dia  = g.getAttribute('data-ag-dia');  pintarAgendar(); return; }
    if ((g = e.target.closest('[data-ag-hora]')))  { nueva.hora = g.getAttribute('data-ag-hora'); pintarAgendar(); return; }
    if ((g = e.target.closest('[data-ag-dur]')))   { nueva.dur = +g.getAttribute('data-ag-dur'); nueva.durManual = true; pintarAgendar(); return; }
    if ((g = e.target.closest('[data-ag-persona]'))) {
      var pid = g.getAttribute('data-ag-persona');
      nueva.persona = D.clientes().filter(function (x) { return x.id === pid; })[0] || null;
      nueva.q = ''; pintarAgendar(); return;
    }
    if (e.target.closest('[data-ag-quitar]'))  { nueva.persona = null; pintarAgendar(); return; }
    if (e.target.closest('[data-ag-guardar]')) { guardarAgendada(); return; }
    if ((g = e.target.closest('[data-hueco]'))) {
      sub = 'agendar'; abrirAgendar();
      nueva.dia = 'hoy'; nueva.hora = g.getAttribute('data-hueco');
      document.getElementById('cab').innerHTML = ''; pintar(); return;
    }
    if (e.target.closest('[data-abrir-viejo]')) { abiertoViejo = true; pintar(); return; }
    if (e.target.closest('[data-anular-bloque]')) { anularEnBloque(D.agenda()); return; }
    var c = e.target.closest('[data-cerrar-act]');
    if (c) {
      var id = c.getAttribute('data-cerrar-act'), ag = D.agenda();
      var act = ag.hoy.concat(ag.vencidas, ag.futuro).filter(function (a) { return a.id === id; })[0];
      if (act) abrirCierre(act);
    }
  });

  window.AJapp.agenda = {
    pintar: function () { sub = 'dia'; nueva = null; pintar(); },
    /* agendar es una sub-vista, no una sección: se entra por el botón del día o
       por un hueco. Se expone para poder llegar desde fuera —y para poder
       pintarla en los tests sin fingir un clic. */
    /* las tres sub-vistas por su nombre: día · semana · atrasado · agendar.
       Es el mismo contrato que ya usan los `data-ver` de dentro. */
    ver: function (s) { sub = s === 'semana' ? 'dia' : s; if (s === 'semana') modo = 'semana'; nueva = null; pintar(); },
    agendar: function (hora) {
      sub = 'agendar'; abrirAgendar();
      if (hora) { nueva.dia = 'hoy'; nueva.hora = hora; }
      pintar();
    }
  };
})();
