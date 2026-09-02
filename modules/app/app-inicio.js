/* ═══════════════════════════════════════════════════════════════════════════
   App AJ Finances · 01 · Inicio — port 1:1 de «App Inicio v2.dc.html»

   La v2 mantiene la columna única pero pone la MARCA en la cabecera: un
   monograma (reutiliza icono-192.png, no hay asset nuevo) + el eyebrow «AJ
   Finances · jueves 30, 9:50» + el nombre, y debajo UN TITULAR EN PALABRAS que
   resume el día. El titular es lo primero que se lee y cambia según el estado.

   Cuatro estados, no cuatro pantallas — es la misma pantalla según el día:
     · día con citas   — titular «N citas, y una sin cerrar»; Ahora + Te van a
                         llamar + Expedientes con huecos + Lo más viejo sin cerrar
     · día vacío       — titular «Hoy no tienes nada. Tres cosas que valen la
                         pena.»; propone en vez de esperar (urgente + adelantar)
     · cierre del día  — de 18:00 en adelante con algo sin cerrar: «Te queda una
                         por cerrar antes de irte» + Hoy has cerrado + Mañana
     · arranque        — splash marino #192571 (canon de marca, NO el marino del
                         mock) mientras baja el día; el único sitio donde manda
                         la marca. Reutiliza icono-192.png como marca.

   Divergencias honestas con el mock (todas a favor de no mentir):
     · el marino de marca es #192571 (spec de Armin), no el marino equivocado del mock
     · «Te van a llamar» y las propuestas se calculan de datos reales; no se
       inventan hora, banco ni motivo. Un bloque sin datos NO se dibuja
     · los accesos (Operaciones/Expedientes/Clientes) leen del almacén local y
       funcionan sin red — no se apagan sin cobertura
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var D = window.AJapp.datos;
  var H = function (s) { return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); };

  /* Los iconos del mock, tal cual: SVG 16×16, currentColor, trazo 1.4, cero
     emoji (ley L9). Una fila es de SVG o es de glifos, no de las dos cosas. */
  var IC = {
    llamar:'<path d="M13.4 11.2v1.9a1.2 1.2 0 0 1-1.3 1.2A11 11 0 0 1 2.5 5.3 1.2 1.2 0 0 1 3.7 4h1.9a1.2 1.2 0 0 1 1.2 1c.1.6.2 1.2.4 1.7a1.2 1.2 0 0 1-.3 1.3l-.8.8a9 9 0 0 0 3.4 3.4l.8-.8a1.2 1.2 0 0 1 1.3-.3c.5.2 1.1.3 1.7.4a1.2 1.2 0 0 1 1.1 1.2z"/>',
    whatsapp:'<path d="M13.6 7.7A5.4 5.4 0 0 1 8 13.1a5.7 5.7 0 0 1-2.4-.5L2.4 13.6l1-3.2A5.4 5.4 0 0 1 2.9 7.7 5.4 5.4 0 0 1 8.2 2.4a5.4 5.4 0 0 1 5.4 5.3z"/>',
    chevron:'<path d="M6 3.6 10.4 8 6 12.4"/>',
    casa:'<path d="M2.5 7.2 8 2.8l5.5 4.4V13a.6.6 0 0 1-.6.6H3.1a.6.6 0 0 1-.6-.6z"/><path d="M6.4 13.6V9.4h3.2v4.2"/>',
    edificio:'<rect x="3.2" y="2.6" width="9.6" height="11" rx="1"/><path d="M5.9 5.4h1.2M8.9 5.4h1.2M5.9 8h1.2M8.9 8h1.2M6.6 13.6v-2.8h2.8v2.8"/>',
    gente:'<circle cx="6.2" cy="6" r="2.4"/><path d="M2.4 13.4a3.9 3.9 0 0 1 7.6 0"/><path d="M11 4.1a2.4 2.4 0 0 1 0 4.5M12.2 13.4a3.6 3.6 0 0 0-1.4-2.9"/>',
    embudo:'<path d="M2.6 3.2h10.8l-4.1 5v4.4l-2.6 1.2V8.2z"/>',
    mas:'<circle cx="8" cy="8" r="5.6"/><path d="M8 5.4v5.2M5.4 8h5.2"/>',
    micro:'<rect x="6.1" y="2.2" width="3.8" height="7.4" rx="1.9"/><path d="M4 7.6a4 4 0 0 0 8 0M8 11.6v2.2"/>',
    barras:'<rect x="2.5" y="2.5" width="3" height="11" rx=".6"/><rect x="6.8" y="2.5" width="3" height="7.5" rx=".6"/><rect x="11.1" y="2.5" width="2.4" height="9.5" rx=".6"/>',
    doc:'<path d="M9.2 2.6H5a1.2 1.2 0 0 0-1.2 1.2v8.4A1.2 1.2 0 0 0 5 13.4h6a1.2 1.2 0 0 0 1.2-1.2V5.6z"/><path d="M9.2 2.6v3h3"/><path d="M6.2 8.8h3.6M6.2 11h2.4"/>',
    reloj:'<circle cx="8" cy="8" r="5.6"/><path d="M8 4.8V8l2.4 1.4"/>',
    candado:'<rect x="3.4" y="7" width="9.2" height="6.6" rx="1.2"/><path d="M5.6 7V5.2a2.4 2.4 0 0 1 4.8 0V7"/>'
  };
  function svg(n, t) { return '<svg width="' + (t||20) + '" height="' + (t||20) + '" viewBox="0 0 16 16" ' +
    'fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + IC[n] + '</svg>'; }

  /* Colores de tipo de actividad · canon §31.1. Visita es CIRUELA desde el
     30-ago: el ámbar volvió a ser solo aviso (ley L1) porque en esta misma
     pantalla convivía la píldora «visita» con el bloque «requiere atención». */
  var TIPO = {
    nota:{l:'Nota',c:'var(--nota)'}, llamada:{l:'Llamada',c:'var(--accion)'},
    cita:{l:'Cita',c:'var(--cita)'}, visita:{l:'Visita',c:'var(--visita)'},
    whatsapp:{l:'WhatsApp',c:'var(--exito)'}, email_enviado:{l:'Email',c:'var(--inmo)'},
    email_recibido:{l:'Email',c:'var(--inmo)'}, documento_enviado:{l:'Documento',c:'#3a6ea8'},
    evento_sistema:{l:'Sistema',c:'var(--sistema)'}
  };
  function tipo(k) { return TIPO[k] || TIPO.nota; }

  function pill(color, texto) {
    return '<span class="pill" style="background:color-mix(in srgb,' + color + ' 10%,transparent);color:' + color + '">' +
           '<span class="punto" style="background:' + color + '"></span>' + H(texto) + '</span>';
  }

  /* ── monograma · reutiliza el icono de la app, no hay asset nuevo ────────── */
  /* ── Sistema V15 · Suizo + calidez ──────────────────────────────────────────
     Papel cálido, cero tarjetas salvo la que eleva («Ahora»), capítulos abiertos
     por rúbrica de romanos en serif itálica navy, filas ruladas, cifras mono
     tabular. El monograma es un sello discreto arriba a la derecha. */
  function monograma(t) { t = t || 26;
    return '<img src="icono-192.png" alt="AJ" style="width:' + t + 'px;height:' + t + 'px;opacity:.85;flex-shrink:0">'; }

  var ROM = ['I','II','III','IV','V','VI'];
  /* cabecera de capítulo: rúbrica + label; el primero (Ahora/propuesta) sin
     filete inferior porque le sigue la card; los demás con filete. */
  function cap(n, label, opts) {
    opts = opts || {};
    var borde = opts.primero ? '' : 'padding-bottom:8px;border-bottom:1px solid var(--filete);';
    return '<div style="display:flex;align-items:baseline;gap:9px;' + borde + '">' +
      '<span class="rubrica">' + ROM[n] + '</span>' +
      '<div style="flex:1;min-width:0" class="eyebrow' + (opts.faint ? ' faint' : '') + '">' + H(label) + '</div>' +
      (opts.link ? '<span data-ir="' + H(opts.link[1]) + '" style="font-size:12.5px;font-weight:500;color:var(--accion)">' + H(opts.link[0]) + '</span>' : '') +
      '</div>';
  }
  function cuad(color) { return '<span style="width:7px;height:7px;background:' + color + ';flex-shrink:0"></span>'; }

  function titular(ag, modo, nProp) {
    var em = function (t, c) { return '<em style="font-style:italic;color:' + (c || 'var(--navy)') + '">' + H(t) + '</em>'; };
    var frase;
    if (modo === 'cierre') { var m = ag.vencidas.length;
      frase = 'Te queda ' + em(m === 1 ? 'una por cerrar' : m + ' por cerrar', 'var(--aviso)') + ' antes de irte.';
    } else if (ag.hoy.length) { var n = ag.hoy.length, v = ag.vencidas.length;
      frase = v ? (n === 1 ? 'Una cita' : n + ' citas') + ', y ' + (v === 1 ? 'una' : v) + ' de ayer ' + em('sin cerrar', 'var(--aviso)') + '.'
                : (n === 1 ? 'Una cita hoy.' : n + ' citas hoy.');
    } else if (nProp) {
      frase = 'Hoy no tienes nada. ' + em(nProp === 1 ? 'Una cosa que vale la pena.' : nProp + ' cosas que valen la pena.');
    } else frase = 'El día está libre.';
    return '<div class="serif" style="font-size:25px;font-weight:400;line-height:1.18;letter-spacing:-.01em;margin-top:13px;text-wrap:balance">' + frase + '</div>';
  }

  function cabecera(ag, yo, modo, nProp) {
    var nombre = String(yo.nombre || '').split(' ')[0] || '';
    return '<div style="display:flex;align-items:center;gap:12px">' +
        '<div style="flex:1;min-width:0">' +
          '<div class="eyebrow">' + H(D.fechaCorta() + ' · ' + D.horaAhora()) + '</div>' +
          (nombre ? '<div style="font-size:13.5px;color:var(--suave);margin-top:2px">' + H(nombre) + '</div>' : '') +
        '</div>' + monograma(26) + '</div>' +
      titular(ag, modo, nProp);
  }

  /* ── I · Ahora · la única card que eleva ─────────────────────────────────── */
  function proxima(ag) { var n = new Date().getHours();
    return ag.hoy.filter(function (a) { return !a.hora || a.hora >= String(n).padStart(2,'0') + ':00'; })[0] || ag.hoy[0]; }
  function dur(a) { var d = a.duracion_min || a.duracion || 0; if (!d) return '';
    return d % 60 === 0 ? (d / 60) + ' h' : (d >= 60 ? Math.floor(d/60) + ' h ' + (d%60) : d + ' min'); }
  function fueraDeHora() { var h = new Date().getHours(); return h >= 21 || h < 8; }

  function accionesAhora(a) {
    var ficha = a.personaId ? 'cliente:' + a.personaId : 'agenda';
    var tel = String(a.telefono || '').replace(/\D+/g, '');
    if (fueraDeHora()) return '<div style="display:flex;gap:8px;margin-top:14px">' +
        '<button class="b-secundario" style="flex:1" data-ir="' + ficha + '">Ver la ficha</button></div>' +
      '<div style="font-size:12px;line-height:1.5;color:var(--tenue);margin-top:9px">A esta hora no se llama a nadie: las acciones de contacto quedan fuera hasta las 8:00.</div>';
    var red = navigator.onLine !== false;
    var llamar = tel
      ? '<a href="tel:' + tel + '" class="b-primario" style="flex:1;text-decoration:none">' + svg('llamar',17) + 'Llamar</a>'
      : '<button class="b-primario" style="flex:1;opacity:.5;cursor:default" disabled>' + svg('llamar',17) + 'Sin teléfono</button>';
    var wapp = (tel && red)
      ? '<a href="https://wa.me/' + tel + '" class="b-secundario" style="width:48px;color:var(--exito);text-decoration:none;display:inline-flex;align-items:center;justify-content:center">' + svg('whatsapp',19) + '</a>'
      : '<button class="b-secundario" style="width:48px;color:var(--raya);opacity:.5;cursor:default" disabled>' + svg('whatsapp',19) + '</button>';
    return '<div style="display:flex;gap:8px;margin-top:14px">' + llamar + wapp +
        '<button class="b-secundario" style="flex:1" data-ir="' + ficha + '">Ficha</button></div>' +
      (tel && !red ? '<div style="font-size:12px;line-height:1.5;color:var(--tenue);margin-top:9px">Llamar funciona sin datos. WhatsApp no, y por eso queda apagado.</div>' : '');
  }

  function cardAhora(a, n) {
    var t = tipo(a.tipo), d = dur(a);
    return '<div>' + cap(n, 'Ahora · ' + (D.enCuanto(a.hora) || 'hoy'), { primero: true }) +
      '<div class="tarjeta sombra" style="padding:14px 15px;margin-top:9px">' +
        '<div style="display:flex;align-items:center;gap:10px">' +
          '<span class="mono" style="font-size:15px;font-weight:500">' + H(a.hora || '—') + '</span>' + cuad(t.c) +
          '<span class="mono" style="font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--suave)">' + H(t.l) + '</span>' +
          (d ? '<span class="mono" style="margin-left:auto;font-size:12px;color:var(--tenue)">' + H(d) + '</span>' : '') +
        '</div>' +
        '<div class="serif" style="font-size:19px;font-weight:500;line-height:1.2;margin-top:9px">' + H(a.texto || 'Sin descripción') + '</div>' +
        (a.quien ? '<div style="font-size:13px;color:var(--suave);margin-top:3px">' + H(a.quien) + '</div>' : '') +
        accionesAhora(a) + '</div></div>';
  }

  /* fila rulada estándar · izquierda con texto, derecha meta o botón */
  function rulada(izq, der, i, ultima) {
    return '<div style="display:flex;align-items:center;gap:12px;padding:12px 0;' +
      (ultima ? '' : 'border-bottom:1px solid var(--sep);') + '">' + izq + der + '</div>';
  }

  /* ── Te van a llamar (la cuota que preguntan) ────────────────────────────── */
  function teVanALlamar(n) {
    var q = D.paraPreguntar(); if (!q) return '';
    return '<div>' + cap(n, 'Te van a llamar', { faint: true }) +
      '<button data-ir="cliente:' + H(q.id) + '" style="width:100%;text-align:left;display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid var(--sep)">' +
        '<div style="flex:1;min-width:0"><div style="font-size:14.5px">' + H(q.nombre) + '</div>' +
        '<div style="font-size:12.5px;color:var(--suave);margin-top:2px">' + H(D.faseDe(q.estado)) + ' · su cuota sale ' + H(D.euros(q.cuota)) + '</div></div>' +
        '<span style="color:var(--tenue);flex-shrink:0">' + svg('chevron',15) + '</span></button></div>';
  }

  /* ── Expedientes con huecos ──────────────────────────────────────────────── */
  function expedientes(yo, n) {
    var h = D.expedientesConHuecos(3); if (!h.length) return '';
    var mio = yo.rol === 'agente';
    return '<div>' + cap(n, (mio ? 'Tus expedientes' : 'Expedientes') + ' con huecos · ' + h.length, { faint: true, link: ['Todos','expedientes'] }) +
      h.map(function (x, i) {
        return rulada(
          '<div style="flex:1;min-width:0"><div style="font-size:14px;line-height:1.4">' + H(x.texto) + '</div>' +
            (x.que ? '<div style="font-size:12.5px;color:var(--suave);margin-top:2px">' + H(x.que) + '</div>' : '') + '</div>',
          '<button class="b-chico" data-ir="cliente:' + H(x.id) + '">Pedir</button>', i, i === h.length - 1);
      }).join('') + '</div>';
  }

  /* ── Lo más viejo sin cerrar ─────────────────────────────────────────────── */
  function loMasViejo(ag, n) {
    var v = ag.vencidas; if (!v.length) return '';
    var viejo = v[0], t = tipo(viejo.tipo);
    var dias = Math.round((new Date(D.hoyISO()) - new Date(viejo.fecha)) / 864e5);
    var titulo = t.l + (viejo.quien ? ' a ' + viejo.quien : '');
    return '<div>' + cap(n, 'Lo más viejo sin cerrar', { faint: true }) +
      rulada(
        '<div style="flex:1;min-width:0"><div style="font-size:14.5px">' + H(titulo) + '</div>' +
          '<div style="font-size:12.5px;color:var(--suave);margin-top:2px">' + H(t.l + ' de ' + D.diaMes(viejo.fecha)) + ' · ¿se hizo?</div></div>',
        '<button class="b-chico" data-ir="agenda">Cerrar</button>', 0, v.length <= 1) +
      (v.length > 1
        ? rulada('<div style="flex:1;font-size:13px;color:var(--suave)">' + (v.length - 1) + ' más · la más vieja de hace <span class="mono" style="color:var(--aviso)">' + dias + ' días</span></div>',
                 '<span style="color:var(--tenue);flex-shrink:0">' + svg('chevron',15) + '</span>', 1, true)
        : '') + '</div>';
  }

  /* ── Después · el resto del día + el hueco dibujado ──────────────────────── */
  function despues(ag, n) {
    var luego = ag.hoy.slice(1); if (!luego.length) return '';
    return '<div>' + cap(n, 'Después', { faint: true, link: ['Toda la agenda','agenda'] }) +
      luego.map(function (a, i) { var t = tipo(a.tipo);
        return rulada(
          '<span class="mono" style="font-size:13px;width:42px;flex-shrink:0">' + H(a.hora || '—') + '</span>' + cuad(t.c) +
          '<div style="flex:1;min-width:0;font-size:14px">' + H(a.texto || t.l) + '</div>',
          '<span style="color:var(--tenue);flex-shrink:0">' + svg('chevron',15) + '</span>', i, i === luego.length - 1);
      }).join('') + '</div>';
  }

  /* ── día vacío · propuestas ──────────────────────────────────────────────── */
  function propuestasLista() {
    var out = [];
    D.urgente().forEach(function (u) { out.push({ dot: 'var(--aviso)', motivo: 'Requiere atención', titulo: u.texto, detalle: u.detalle, cta: u.cta || 'Ver', ir: u.ir }); });
    D.sePuedeAdelantar().forEach(function (s) { out.push({ dot: 'var(--accion)', motivo: 'Se puede adelantar', titulo: s.texto, detalle: s.detalle, cta: 'Abrir', ir: s.ir }); });
    return out.slice(0, 3);
  }
  function propPrimera(p, n) {
    return '<div>' + cap(n, p.motivo, { primero: true }) +
      '<div class="tarjeta sombra" style="padding:14px 15px;margin-top:9px">' +
        '<div class="serif" style="font-size:19px;font-weight:500;line-height:1.2">' + H(p.titulo) + '</div>' +
        (p.detalle ? '<div style="font-size:13px;line-height:1.55;color:var(--suave);margin-top:4px">' + H(p.detalle) + '</div>' : '') +
        '<div style="margin-top:14px"><button class="b-primario" style="width:100%" data-ir="' + H(p.ir) + '">' + H(p.cta) + '</button></div></div></div>';
  }
  function propResto(ps, n) {
    if (!ps.length) return '';
    return '<div>' + cap(n, 'Y ' + (ps.length === 1 ? 'una más' : ps.length + ' más') + ', si te sobra el día', { faint: true }) +
      ps.map(function (p, i) {
        return rulada(
          '<div style="flex:1;min-width:0"><div style="font-size:14.5px">' + H(p.titulo) + '</div>' +
            (p.detalle ? '<div style="font-size:12.5px;color:var(--suave);margin-top:2px">' + H(p.detalle) + '</div>' : '') + '</div>',
          '<span style="color:var(--tenue);flex-shrink:0">' + svg('chevron',15) + '</span>', i, i === ps.length - 1);
      }).join('') + '</div>';
  }
  function libreFooter() {
    return '<div style="display:flex;align-items:center;gap:10px;padding:12px 0;border-top:1px solid var(--filete);margin-top:auto">' +
      '<span class="serif" style="font-style:italic;font-size:13.5px;color:var(--navy)">el día entero libre</span>' +
      '<span style="flex:1"></span><span class="mono" style="font-size:11.5px;color:var(--tenue)">8–20</span>' +
      '<button class="b-chico" data-ir="agenda">Agenda</button></div>';
  }

  /* ── cierre del día ──────────────────────────────────────────────────────── */
  function cardCierre(ag, n) {
    var a = ag.vencidas[ag.vencidas.length - 1] || ag.vencidas[0], t = tipo(a.tipo);
    return '<div>' + cap(n, 'Sin cerrar', { primero: true }) +
      '<div class="tarjeta sombra" style="padding:14px 15px;margin-top:9px;border-left:3px solid var(--aviso)">' +
        '<div style="display:flex;align-items:center;gap:10px"><span class="mono" style="font-size:15px;font-weight:500">' + H(a.hora || '—') + '</span>' + cuad(t.c) +
          '<span class="mono" style="font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--suave)">' + H(t.l) + '</span></div>' +
        '<div class="serif" style="font-size:18px;font-weight:500;line-height:1.2;margin-top:8px">' + H(a.texto || 'Sin descripción') + '</div>' +
        '<div style="font-size:12.5px;color:var(--suave);margin-top:3px">¿Se hizo? Dos toques y una nota.</div>' +
        '<div style="margin-top:14px"><button class="b-primario" style="width:100%" data-ir="agenda">Cerrarla</button></div></div></div>';
  }
  function cierreDia(ag, yo) {
    var h = '', i = 0;
    h += cardCierre(ag, i++);
    var cerradas = D.cerradasHoy();
    if (cerradas.length) {
      h += '<div>' + cap(i++, 'Hoy has cerrado', { faint: true }) + cerradas.slice(0, 4).map(function (c, k) { var t = tipo(c.tipo);
        return rulada(cuad(t.c) + '<span style="flex:1;min-width:0;font-size:14px">' + H(t.l + (c.quien ? ' · ' + c.quien : '')) + '</span>',
          '<span class="mono" style="font-size:11.5px;color:var(--suave);flex-shrink:0">' + H(c.estado === 'no_realizada' ? 'no realizada' : 'hecha') + '</span>', k, k === Math.min(cerradas.length,4) - 1);
      }).join('') + '</div>';
    }
    var man = ag.manana.slice(0, 2);
    if (man.length) {
      h += '<div>' + cap(i++, 'Mañana, primera hora', { faint: true }) + man.map(function (a, k) { var t = tipo(a.tipo);
        return rulada('<span class="mono" style="font-size:13px;width:42px;flex-shrink:0">' + H(a.hora || '—') + '</span>' + cuad(t.c) +
          '<span style="flex:1;min-width:0;font-size:14px">' + H(a.texto || t.l) + '</span>', '', k, k === man.length - 1);
      }).join('') + '</div>';
    }
    return h;
  }

  /* ── sin cobertura ───────────────────────────────────────────────────────── */
  function bloqueSinCobertura(n) {
    if (navigator.onLine !== false) return '';
    var q = D.porSubir();
    return '<div>' + cap(n, 'Sin conexión', { faint: true }) +
      '<div class="tarjeta" style="border-left:3px solid var(--aviso);overflow:hidden;margin-top:8px">' +
        (q.length
          ? '<div style="padding:12px 14px 4px;font-size:13.5px">' + q.length + (q.length === 1 ? ' cambio espera' : ' cambios esperan') + ' para subir</div>' +
            q.slice(0, 3).map(function (x) {
              return '<div class="fila" style="min-height:44px"><span style="flex:1;min-width:0;font-size:13px">' +
                H(x.origen === 'runtime' ? 'Cambio sin subir' : (x.que === 'lead' ? 'Lead' : x.que === 'documento' ? 'Documento' : 'Fotos') + (x.nombre ? ' · ' + x.nombre : '')) + '</span>' +
                '<span class="mono" style="font-size:12px;color:var(--suave);flex-shrink:0">' + H(x.bytes ? D.megas(x.bytes) : D.haceCuanto(new Date(x.at || D.hoyISO()).toISOString())) + '</span></div>';
            }).join('') +
            '<button data-ir="mas" class="fila" style="width:100%;text-align:left;border-top:1px solid var(--sep);font-size:12.5px;color:var(--accion)">Verlo entero en Más</button>'
          : '<div style="padding:14px;font-size:13px;color:var(--suave);line-height:1.55">No hay nada esperando. Todo lo que has hecho ya está en el CRM.</div>') +
      '</div></div>';
  }
  function chipSubido() {
    if (navigator.onLine === false) { var n = D.porSubir().length; if (n) return pill('var(--aviso)', n + ' sin subir'); }
    return pill('var(--exito)', 'Todo subido');
  }

  /* ── primer arranque ─────────────────────────────────────────────────────── */
  function primerArranque(yo) {
    var pasos = [['Instala la app en la pantalla de inicio', 'Para que funcione sin cobertura'],
      ['Permite cámara y llamadas', 'Fotos de documentos y llamar de un toque'],
      ['Registra tu primer lead', 'Es la vía natural de entrada']];
    document.getElementById('cab').innerHTML =
      '<div style="display:flex;align-items:center;gap:12px"><div style="flex:1"><div class="eyebrow">AJ Finances</div></div>' + monograma(26) + '</div>' +
      '<div class="serif" style="font-size:25px;font-weight:400;line-height:1.15;margin-top:13px">Bienvenido, ' + H(String(yo.nombre).split(' ')[0]) + '</div>';
    return '<div style="font-size:13.5px;line-height:1.6;color:var(--suave)">Todavía no tienes nada asignado. En cuanto tengas tu primer cliente, esta pantalla se abrirá en él.</div>' +
      '<div>' + pasos.map(function (p, i) {
        return rulada('<span class="rubrica" style="font-size:14px;width:20px">' + ROM[i] + '</span>' +
          '<div style="flex:1;min-width:0"><div style="font-size:14px">' + H(p[0]) + '</div>' +
          '<div style="font-size:12.5px;color:var(--suave);margin-top:1px">' + H(p[1]) + '</div></div>', '', i, i === pasos.length - 1);
      }).join('') + '</div>' +
      (D.instalada() ? '' : '<button data-ir="mas" class="b-primario" style="width:100%">Instalar en el móvil</button>');
  }

  /* ── splash · marino de marca #192571 ────────────────────────────────────── */
  function splash() {
    return '<div id="aj-splash" style="position:fixed;inset:0;z-index:60;background:#192571;display:flex;flex-direction:column">' +
      '<div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;padding:0 40px">' +
        '<img src="icono-192.png" alt="AJ Finances" style="width:120px;height:120px;border-radius:0">' +
        '<div class="serif" style="font-size:19px;font-weight:300;font-style:italic;color:rgba(255,255,255,.72)">AJ Finances · Girona</div></div>' +
      '<div style="padding:0 40px 54px;display:flex;flex-direction:column;align-items:center;gap:14px">' +
        '<div style="width:120px;height:3px;background:rgba(255,255,255,.18);overflow:hidden"><div style="width:64px;height:3px;background:rgba(255,255,255,.75)"></div></div>' +
        '<div style="font-size:12.5px;color:rgba(255,255,255,.55)">Cargando ' + H(D.fechaCorta()) + '…</div></div></div>';
  }
  function mostrarSplash() { if (!document.getElementById('aj-splash')) document.body.insertAdjacentHTML('beforeend', splash()); }
  function quitarSplash() { var e = document.getElementById('aj-splash'); if (e) e.parentNode.removeChild(e); }

  /* ── accesos · etiquetas mono navy con filetes verticales ────────────────── */
  function accesos(yo) {
    var mio = yo.rol === 'agente';
    var A = [[mio ? 'Mis oper.' : 'Operaciones', 'operaciones'], ['Expedientes', 'expedientes'], [mio ? 'Mis clientes' : 'Clientes', 'clientes']];
    return '<div style="margin-top:auto;display:flex;border-top:1px solid var(--filete)">' + A.map(function (a, i) {
      return '<button data-ir="' + a[1] + '" style="flex:1;height:46px;border:none;' + (i ? 'border-left:1px solid var(--filete);' : '') +
        'background:none;font-family:\'IBM Plex Mono\',monospace;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--navy)">' + H(a[0]) + '</button>';
    }).join('') + '</div>';
  }

  /* ── la pantalla ─────────────────────────────────────────────────────────── */
  function pintar() {
    var yo = D.yo(), ag = D.agenda(), cuerpo = document.getElementById('cuerpo');
    var arr = D.arranque();
    if (arr === 'cargando') { mostrarSplash(); return; }
    quitarSplash();
    if (arr === 'primero') { cuerpo.innerHTML = primerArranque(yo) + accesos(yo); return; }

    var hora = new Date().getHours();
    var cierre = hora >= 18 && ag.vencidas.length > 0;

    if (cierre) {
      document.getElementById('cab').innerHTML = cabecera(ag, yo, 'cierre', 0);
      cuerpo.innerHTML = bloqueSinCobertura(0) + cierreDia(ag, yo) +
        '<div style="display:flex;justify-content:center;padding:2px 0">' + chipSubido() + '</div>' + accesos(yo);
      return;
    }

    if (ag.hoy.length) {
      document.getElementById('cab').innerHTML = cabecera(ag, yo, 'citas', 0);
      var caps = [], i = 0;
      var sc = bloqueSinCobertura(i); if (sc) { caps.push(sc); i++; }
      caps.push(cardAhora(proxima(ag), i++));
      var tv = teVanALlamar(i); if (tv) { caps.push(tv); i++; }
      var ex = expedientes(yo, i); if (ex) { caps.push(ex); i++; }
      var lv = loMasViejo(ag, i); if (lv) { caps.push(lv); i++; }
      var dp = despues(ag, i); if (dp) { caps.push(dp); i++; }
      cuerpo.innerHTML = caps.join('') + accesos(yo);
      return;
    }

    /* día vacío */
    var props = propuestasLista();
    document.getElementById('cab').innerHTML = cabecera(ag, yo, 'vacio', props.length);
    if (props.length) {
      var i2 = 0, out = '';
      var sc2 = bloqueSinCobertura(i2); if (sc2) { out += sc2; i2++; }
      out += propPrimera(props[0], i2++);
      out += propResto(props.slice(1), i2++);
      out += libreFooter() + accesos(yo);
      cuerpo.innerHTML = out;
    } else {
      cuerpo.innerHTML = bloqueSinCobertura(0) + libreFooter() + accesos(yo);
    }
  }

  window.AJapp.inicio = { pintar: pintar, svg: svg, pill: pill, tipo: tipo, H: H };
})();
