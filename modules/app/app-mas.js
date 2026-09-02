/* ═══════════════════════════════════════════════════════════════════════════
   App AJ Finances · 07 · Más — la sección que triunfa si no se abre

   Cierra la serie. Su métrica es no hacer falta: si la gente entra aquí a
   menudo, es que algo que debería estar resuelto en las otras seis no lo está.
   Por eso no es un cajón, son tres bloques que se leen distintos —quién soy y
   qué puedo · cómo está el aparato · lo poquísimo que se ajusta— y caben sin
   scroll.

   Del mock «App Mas.dc.html», sus seis estados y sus cuatro respuestas:
     1 · el selector de sociedad va arriba, en la identidad — NO PORTADO, ver C3
     2 · modo oscuro sí, interruptor no: sigue al sistema y ya está. Un ajuste
         menos en el cajón, que es la única forma de que el cajón siga corto
     3 · borrar lo descargado sí, con la cola por delante: borrar y cerrar
         sesión son la misma clase de riesgo y llevan el mismo aviso
     4 · la ayuda no es una pantalla: cada sección se explica sola, y aquí solo
         hay «avisar a soporte» con la versión y la sesión ya escritas

   La regla de la sección: si un ajuste no cambia nada que importe en la calle,
   no está aquí. El cajón de sastre es donde mueren las apps.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var D = window.AJapp.datos, I = window.AJapp.inicio, M = {};
  var H = I.H;

  /* La línea de diseño a la que pertenece esta app. Se sube a mano cuando la
     serie cambie de línea; va escrita en el pie y viaja en el aviso a soporte,
     que es lo único para lo que sirve un número de versión en un móvil. */
  var VERSION = '13.4';

  function ico(d, w) {
    return '<svg width="' + (w || 16) + '" height="' + (w || 16) + '" viewBox="0 0 16 16" fill="none" ' +
      'stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' + d + '</svg>';
  }
  var IC = {
    check:  '<path d="M13 4.8 6.4 11.4 3 8"/>',
    cruz:   '<path d="M4.4 4.4l7.2 7.2M11.6 4.4l-7.2 7.2"/>',
    flecha: '<path d="M6 3.6 10.4 8 6 12.4"/>',
    nube:   '<path d="M4.6 12.4a2.8 2.8 0 0 1 .3-5.6 3.7 3.7 0 0 1 7-1 2.9 2.9 0 0 1-.5 6.6z"/><path d="m2.4 2.4 11.2 11.2"/>',
    subir:  '<path d="M8 12.6V3.4M4.6 6.8 8 3.4l3.4 3.4"/>',
    aviso:  '<path d="M8 2.6 14 13H2z"/><path d="M8 6.6v3M8 11.2v.1"/>',
    movil:  '<rect x="4.4" y="1.8" width="7.2" height="12.4" rx="1.4"/><path d="M7 12.4h2"/>',
    caja:   '<path d="M2.6 5.4 8 2.6l5.4 2.8v5.2L8 13.4l-5.4-2.8z"/><path d="M2.6 5.4 8 8.2l5.4-2.8M8 8.2v5.2"/>',
    salir:  '<path d="M6 13.4H3.6a1 1 0 0 1-1-1V3.6a1 1 0 0 1 1-1H6"/><path d="M10 11.2 13.4 8 10 4.8M13.4 8H6"/>',
    wapp:   '<path d="M13.6 7.7A5.4 5.4 0 0 1 8 13.1a5.7 5.7 0 0 1-2.4-.5L2.4 13.6l1-3.2A5.4 5.4 0 0 1 2.9 7.7 5.4 5.4 0 0 1 8.2 2.4a5.4 5.4 0 0 1 5.4 5.3z"/>',
    papel:  '<path d="M3.4 4.6h9.2M6.4 4.6V3.2h3.2v1.4M4.6 4.6l.6 8.2h5.6l.6-8.2"/>'
  };

  var vista = 'mas';     // mas · cola · descargado

  function eyebrow(t) { return '<div class="eyebrow" style="margin-bottom:8px">' + H(t) + '</div>'; }

  /* «1 actividades» no lo dice nadie, y estas cifras se leen de pie. */
  function plural(n, uno, muchos) { return n + ' ' + (n === 1 ? uno : (muchos || uno + 's')); }

  function cabecera(titulo, atras) {
    document.getElementById('cab').innerHTML = atras
      ? '<div style="display:flex;align-items:center;gap:12px">' +
        '<button data-mas="volver" style="width:32px;height:32px;margin-left:-6px;color:var(--suave);' +
        'display:flex;align-items:center;justify-content:center;transform:rotate(180deg)">' + ico(IC.flecha, 18) + '</button>' +
        '<div><div class="eyebrow">AJ Finances</div>' +
        '<div class="serif" style="font-size:21px;font-weight:500;line-height:1.1;margin-top:2px">' + H(titulo) + '</div></div></div>'
      : '<div class="eyebrow">AJ Finances</div><div class="serif" style="font-size:23px;font-weight:500;margin-top:3px">' +
        H(titulo) + '</div>';
  }

  /* ── 1 · quién soy ─────────────────────────────────────────────────────────
     Ya no hay selector de sociedad: esta es la app de Finances y la de Inmo se
     hace aparte (consultan cosas distintas). El mock lo proponía, pero su propia
     corrección C2 avisaba de que vaciaba la app al cambiar a una sociedad sin
     datos. Con las apps separadas el problema desaparece. */
  function tarjetaIdentidad(yo) {
    return '<div class="tarjeta" style="padding:17px 17px 15px">' +
      '<div style="display:flex;align-items:flex-start;gap:12px">' +
        '<div style="flex:1;min-width:0">' +
          '<div class="serif" style="font-size:19px;font-weight:500;line-height:1.2">' + H(yo.nombre) + '</div>' +
          '<div style="font-size:12.5px;color:var(--suave);margin-top:3px">' +
            H(yo.correo || (yo.rol ? (yo.rol === 'admin' ? 'Administrador' : 'Agente') + ' · Finances'
              : 'Sin sesión')) + '</div>' +
        '</div>' +
        (yo.rol ? '<span class="pill" style="background:#eef3fa;color:var(--accion);flex-shrink:0">' +
          H(yo.rol) + '</span>' : '') +
      '</div></div>';
  }

  /* ── 2 · tu alcance ────────────────────────────────────────────────────────
     Nadie tiene que descubrir su permiso topando con botones apagados. Los
     números se cuentan del almacén local; ninguno viene escrito. */
  function bloqueAlcance(a) {
    /* Sin sesión no se sabe el rol, así que tampoco el alcance. Pintar la
       tarjeta de un agente por defecto diría «llevas 11» cuando las tuyas son
       cero: exactamente la clase de número plausible que esta app no inventa. */
    if (!a.rol) return eyebrow('Tu alcance') +
      '<div class="tarjeta" style="padding:17px;margin-bottom:14px">' +
        '<div style="font-size:14px;font-weight:500">Sin sesión no se sabe tu alcance</div>' +
        '<div style="font-size:12.5px;line-height:1.6;color:var(--suave);margin-top:6px">' +
          'Este equipo tiene ' + plural(a.visibles, 'persona') + ' guardada' +
          (a.visibles === 1 ? '' : 's') + ', pero quién las lleva y qué puedes ver lo dice ' +
          'el servidor. Entra para verlo.</div>' +
      '</div>';
    if (!a.esAdmin) return alcanceAgente(a);

    var fichas = [
      [a.mias, 'personas llevas tú', 'de las ' + a.visibles + ' del sistema'],
      [a.visibles, 'ves, por ser admin', 'Un agente solo ve las suyas']
    ];
    /* Las «de nadie» se enseñan como lo que son, con nombre propio y su regla
       sin decidir. Pero si no hay ninguna NO se dibuja un cero: tras el reparto
       de permisos la bandeja quedó vacía, y una ficha que dice «0 no son de
       nadie» inventa un problema resuelto. Vuelve sola el día que haya una. */
    if (a.sinAgente) fichas.push([a.sinAgente, 'no son de nadie', 'Sin agente asignado · regla sin decidir']);

    return eyebrow('Tu alcance') +
      '<div class="tarjeta" style="overflow:hidden;margin-bottom:14px">' +
      fichas.map(function (f, i) {
        return '<div style="display:flex;align-items:center;gap:14px;padding:13px 15px' +
          (i ? ';border-top:1px solid var(--sep)' : '') + '">' +
          '<span class="serif mono" style="font-size:25px;font-weight:400;min-width:44px;' +
            (f[1] === 'no son de nadie' ? 'color:var(--aviso)' : '') + '">' + f[0] + '</span>' +
          '<span style="flex:1;min-width:0">' +
            '<span style="display:block;font-size:13.5px">' + H(f[1]) + '</span>' +
            '<span style="display:block;font-size:12px;color:var(--suave);margin-top:1px">' + H(f[2]) + '</span>' +
          '</span></div>';
      }).join('') +
      '<div style="display:flex;align-items:center;gap:9px;padding:11px 15px;border-top:1px solid var(--sep);' +
        'background:var(--sep);font-size:12.5px;color:var(--suave)">' +
        '<span style="color:var(--raya)">' + ico(IC.aviso, 14) + '</span>' +
        'Los permisos se cambian desde el escritorio. Aquí se leen.</div>' +
      '</div>';
  }

  /* Para un agente el alcance se lee entero: lo que puede y lo que no, y a
     quién le pide lo que no puede. Y sus «visibles» y sus «mías» coinciden
     porque el servidor no le baja lo demás — así que se dice así, y no como
     dos números distintos que confundirían. */
  function alcanceAgente(a) {
    var admin = nombreAdmin();
    var puede = [
      [true,  'Consultar tus ' + a.mias + ' y registrar su actividad'],
      [true,  'Capturar leads y documentos'],
      [false, 'Ver clientes de otros agentes']
    ];
    return eyebrow('Tu alcance') +
      '<div class="tarjeta" style="overflow:hidden;margin-bottom:14px">' +
        '<div style="display:flex;align-items:center;gap:14px;padding:13px 15px">' +
          '<span class="serif mono" style="font-size:25px;min-width:44px">' + a.mias + '</span>' +
          '<span style="flex:1"><span style="display:block;font-size:13.5px">personas llevas tú</span>' +
          /* Lo normal es que coincidan, porque el servidor no le baja lo demás.
             Si NO coinciden se dice el número de verdad en vez de la frase
             bonita: significa que está bajando algo que no es suyo. */
          '<span style="display:block;font-size:12px;color:var(--suave);margin-top:1px">' +
            (a.mias === a.visibles ? 'Y son las ' + a.mias + ' que ves'
                                   : 'de las ' + a.visibles + ' que te bajan') + '</span></span></div>' +
        '<div style="border-top:1px solid var(--sep);padding:12px 15px 14px">' +
          '<div class="eyebrow" style="margin-bottom:9px">Qué puedes hacer</div>' +
          puede.map(function (p) {
            return '<div style="display:flex;align-items:flex-start;gap:9px;padding:4px 0;font-size:13px;line-height:1.45;' +
              (p[0] ? '' : 'color:var(--suave)') + '">' +
              '<span style="flex-shrink:0;margin-top:1px;color:' + (p[0] ? 'var(--exito)' : 'var(--raya)') + '">' +
                ico(p[0] ? IC.check : IC.cruz, 14) + '</span>' + H(p[1]) + '</div>';
          }).join('') +
        '</div>' +
        '<div style="display:flex;align-items:center;gap:10px;padding:11px 15px;border-top:1px solid var(--sep);' +
          'background:var(--sep)">' +
          '<span style="flex:1;font-size:12.5px;color:var(--suave)">Lo que necesites de otro cliente, se lo pides a ' +
            H(admin) + '</span>' +
          '<button data-mas="soporte" class="b-chico" style="flex-shrink:0">Avisar</button></div>' +
      '</div>';
  }

  function nombreAdmin() {
    try {
      var u = (JSON.parse(localStorage.getItem('aj_app_usuarios_v1') || '[]') || [])
        .filter(function (x) { return x.rol === 'admin' && x.activo !== false; });
      if (u.length) return String(u[0].nombre || '').split(' ')[0];
    } catch (e) {}
    return 'un administrador';   // sin la tabla no se inventa un nombre
  }

  /* ── 3 · el aparato ────────────────────────────────────────────────────────
     C1 · «40 actividades · dos últimas semanas» son las que hay. Es la misma
     corrección que ya se aplicó en Buscar y que a esta pantalla llegó a medias.
     Aparece dos veces —aquí y en la pantalla de descargado— y las dos se
     cuentan: se mantiene la regla de catorce días, que es la que Buscar
     declara, y se corrige el número, que es lo que el brief pedía. */
  function bloqueAparato(ap, A) {
    var filas = [];

    filas.push(ap.pendientes.length
      ? ['pendiente', ap.pendientes.length + (ap.pendientes.length === 1 ? ' cosa sin subir' : ' cosas sin subir'),
         ap.red ? 'Suben solas' : 'sin conexión', 'cola']
      : ['ok', 'Todo subido', ap.desde || 'sin apuntar todavía', null]);

    if (ap.instalada) filas.push(['ok', 'Instalada en la pantalla de inicio', '', null]);

    filas.push(['ir', 'Descargado para sin cobertura',
      plural(A.personas, 'persona') + ' · ' + plural(A.notasRecientes, 'actividad', 'actividades') +
      ' · ' + D.megas(ap.bytes), 'descargado']);

    return eyebrow('El aparato') +
      '<div class="tarjeta" style="overflow:hidden;margin-bottom:14px">' +
      filas.map(function (f, i) {
        var color = f[0] === 'ok' ? 'var(--exito)' : f[0] === 'pendiente' ? 'var(--aviso)' : 'var(--raya)';
        var etiqueta = f[0] === 'ok' ? IC.check : f[0] === 'pendiente' ? IC.subir : IC.caja;
        return '<' + (f[3] ? 'button data-mas="' + f[3] + '"' : 'div') +
          ' class="fila" style="width:100%;text-align:left' + (i ? ';border-top:1px solid var(--sep)' : '') + '">' +
          '<span style="color:' + color + ';flex-shrink:0">' + ico(etiqueta, 17) + '</span>' +
          '<span style="flex:1;min-width:0">' +
            '<span style="display:block;font-size:13.5px">' + H(f[1]) + '</span>' +
            (f[2] ? '<span style="display:block;font-size:12px;color:var(--suave);margin-top:1px">' +
              H(f[2]) + '</span>' : '') + '</span>' +
          (f[3] ? '<span style="color:var(--raya);flex-shrink:0">' + ico(IC.flecha) + '</span>' : '') +
          '</' + (f[3] ? 'button' : 'div') + '>';
      }).join('') + '</div>';
  }

  /* ── 04 · sin instalar · el estado que más gente tendrá el primer día ────── */
  function bloqueSinInstalar() {
    var pierde = [
      'Sin cobertura no tendrás nada: hoy es lo que más falla dentro de los pisos',
      'No hay avisos de cita ni de documento caducado',
      'La barra del navegador te come 60 px de pantalla'
    ];
    return '<div class="tarjeta" style="padding:17px;margin-bottom:14px;border-color:#e8dcc4;background:#fdfaf3">' +
      '<div style="display:flex;align-items:center;gap:9px">' +
        '<span style="color:var(--aviso)">' + ico(IC.movil, 17) + '</span>' +
        '<span class="serif" style="font-size:17px;font-weight:500">Estás en el navegador</span></div>' +
      '<div style="font-size:13px;line-height:1.6;color:rgba(22,33,62,.72);margin-top:8px">' +
        'Funciona, pero a medias. Instalarla es tocar «compartir» y «añadir a inicio»: ' +
        'son dos toques y no hay que descargar nada.</div>' +
      '<div style="margin-top:12px">' + pierde.map(function (p) {
        return '<div style="display:flex;align-items:flex-start;gap:9px;padding:4px 0;font-size:12.5px;line-height:1.5;' +
          'color:rgba(22,33,62,.72)"><span style="flex-shrink:0;margin-top:1px;color:var(--raya)">' +
          ico(IC.cruz, 13) + '</span>' + H(p) + '</div>';
      }).join('') + '</div>' +
      '<button data-mas="instalar" class="b-primario" style="width:100%;margin-top:13px">Cómo instalarla · 2 toques</button>' +
      '<div style="margin-top:12px;padding-top:12px;border-top:1px solid #e8dcc4">' +
        '<div class="eyebrow" style="margin-bottom:6px">Mientras tanto sí funciona</div>' +
        '<div style="font-size:12.5px;line-height:1.6;color:var(--suave)">' +
          'Consultar, llamar y capturar con red. La cámara y el WhatsApp del teléfono.</div>' +
      '</div></div>';
  }

  /* ── 4 · lo que se ajusta · y nada más ──────────────────────────────────── */
  function bloqueAjustes(aj) {
    return eyebrow('Lo que se ajusta · y nada más') +
      '<div class="tarjeta" style="overflow:hidden;margin-bottom:14px">' +
        interruptor('preguntarAlColgar', 'Preguntar al colgar una llamada',
                    'La tira que aparece al volver de llamar', aj.preguntarAlColgar) +
        '<button data-mas="puertas" class="fila" style="width:100%;text-align:left;border-top:1px solid var(--sep)">' +
          '<span style="flex:1;min-width:0">' +
            '<span style="display:block;font-size:13.5px">Orden de las puertas de Capturar</span>' +
            '<span style="display:block;font-size:12px;color:var(--suave);margin-top:1px">' +
              H(textoPuertas()) + '</span></span>' +
          '<span style="color:var(--raya);flex-shrink:0">' + ico(IC.flecha) + '</span></button>' +
        '<button data-mas="soporte" class="fila" style="width:100%;text-align:left;border-top:1px solid var(--sep)">' +
          '<span style="color:var(--exito);flex-shrink:0">' + ico(IC.wapp, 17) + '</span>' +
          '<span style="flex:1;min-width:0">' +
            '<span style="display:block;font-size:13.5px">Avisar a soporte</span>' +
            '<span style="display:block;font-size:12px;color:var(--suave);margin-top:1px">' +
              'Abre WhatsApp con versión y sesión</span></span>' +
          '<span style="color:var(--raya);flex-shrink:0">' + ico(IC.flecha) + '</span></button>' +
      '</div>';
  }

  function interruptor(clave, titulo, detalle, on) {
    return '<button data-mas="alternar:' + clave + '" class="fila" style="width:100%;text-align:left">' +
      '<span style="flex:1;min-width:0">' +
        '<span style="display:block;font-size:13.5px">' + H(titulo) + '</span>' +
        '<span style="display:block;font-size:12px;color:var(--suave);margin-top:1px">' + H(detalle) + '</span></span>' +
      /* un valor encendido es SIEMPRE el azul de acción, nunca el ámbar (ley L1) */
      '<span style="width:42px;height:25px;border-radius:13px;flex-shrink:0;position:relative;' +
        'background:' + (on ? 'var(--accion)' : 'var(--borde)') + ';transition:background 160ms">' +
        '<span style="position:absolute;top:3px;left:' + (on ? '20px' : '3px') + ';width:19px;height:19px;' +
        'border-radius:50%;background:#fff;transition:left 160ms cubic-bezier(.23,1,.32,1)"></span></span></button>';
  }

  var NOMBRE_PUERTA = { doc: 'Documento', act: 'actividad', lead: 'lead' };
  function ordenActual() {
    var g = D.ajustes().ordenPuertas;
    if (g && g.length === 3) return g;
    return ['doc', 'act', 'lead'];
  }
  function textoPuertas() {
    return ordenActual().map(function (k, i) {
      var n = NOMBRE_PUERTA[k] || k;
      return i ? n : n.charAt(0).toUpperCase() + n.slice(1);
    }).join(' · ');
  }

  /* ── 5 · cerrar sesión ─────────────────────────────────────────────────────
     Fácil de encontrar y difícil de pulsar sin querer: al final, con borde rojo
     y sin relleno, y siempre por una hoja que dice qué se pierde. */
  function botonSalir(yo) {
    if (!yo.haySesion) return '';
    return '<button data-mas="salir" style="width:100%;height:48px;border:1px solid var(--error);' +
      'border-radius:8px;background:transparent;color:var(--error);font-size:14.5px;font-weight:500;' +
      'display:flex;align-items:center;justify-content:center;gap:8px">' +
      ico(IC.salir, 17) + 'Cerrar sesión</button>';
  }

  /* ── el entorno · alineado con el sistema del CRM ─────────────────────────
     El CRM tiene dos entornos (produccion · laboratorio) con AJ.entorno; la app
     los USA, no inventa los suyos. Producción son los datos de verdad;
     laboratorio es el sandbox para probar sin tocar nada real. Cambiar recarga
     (lo hace la propia config). */
  function bloqueEntorno() {
    var ent = null, actual = 'produccion';
    try { ent = window.AJ && AJ.entorno; actual = (window.AJ_SUPABASE && window.AJ_SUPABASE.entorno) || 'produccion'; } catch (e) {}
    if (!ent) return '';
    var esProd = actual === 'produccion';
    return eyebrow('Entorno') +
      '<div class="tarjeta" style="overflow:hidden;margin-bottom:14px' + (esProd ? '' : ';border-color:#e8dcc4') + '">' +
        '<div style="display:flex;align-items:center;gap:10px;padding:13px 15px">' +
          '<span class="punto" style="width:9px;height:9px;background:' + (esProd ? 'var(--error)' : 'var(--aviso)') + '"></span>' +
          '<span style="flex:1;min-width:0"><span style="display:block;font-size:13.5px;font-weight:500">' +
            (esProd ? 'Producción · datos reales' : ((window.AJ_SUPABASE.nombre || 'Laboratorio') + ' · pruebas')) + '</span>' +
          '<span style="display:block;font-size:12px;color:var(--suave);margin-top:1px">' +
            (esProd ? 'Lo que hagas aquí cuenta de verdad.' : 'Un sandbox: nada de esto es real.') + '</span></span>' +
        '</div>' +
        '<div style="display:flex;gap:8px;padding:0 15px 14px">' +
          seg('produccion', 'Producción', esProd) + seg('laboratorio', 'Laboratorio', !esProd) +
        '</div>' +
      '</div>';
  }
  function seg(e, txt, on) {
    return '<button data-mas="entorno:' + e + '" style="flex:1;height:44px;border-radius:8px;font-size:13.5px;' +
      'font-weight:500;' + (on ? 'border:1px solid var(--accion);background:var(--accion);color:#fff'
        : 'border:1px solid var(--borde);background:var(--sup);color:rgba(22,33,62,.7)') + '">' + H(txt) + '</button>';
  }

  function pie(ap) {
    var nombre = (window.AJ_SUPABASE && window.AJ_SUPABASE.nombre) || '';
    var esProd = (window.AJ_SUPABASE && window.AJ_SUPABASE.entorno) === 'produccion';
    return '<div style="text-align:center;font-size:11.5px;color:var(--tenue);padding:14px 0 4px">v' + VERSION +
      (nombre && !esProd ? ' · ' + nombre : '') +
      (ap.instalada ? ' · el modo oscuro sigue al sistema' : ' · navegador') + '</div>';
  }

  /* ═══ la pantalla ═════════════════════════════════════════════════════════ */
  function pintarMas() {
    var yo = D.yo(), a = D.alcanceUsuario(), A = D.alcance(), aj = D.ajustes();
    var ap = { pendientes: D.porSubir(), instalada: D.instalada(), bytes: D.bytesAlmacen(),
               red: navigator.onLine !== false,
               desde: D.ultimaSync() ? D.haceCuanto(new Date(D.ultimaSync()).toISOString()) : '' };
    cabecera('Más', false);
    document.getElementById('cuerpo').innerHTML =
      tarjetaIdentidad(yo) +
      '<div>' + bloqueAlcance(a) + '</div>' +
      (ap.instalada ? '' : bloqueSinInstalar()) +
      '<div>' + bloqueAparato(ap, A) + '</div>' +
      '<div>' + bloqueEntorno() + '</div>' +
      '<div>' + bloqueAjustes(aj) + '</div>' +
      botonSalir(yo) + pie(ap);
  }

  /* ── 02 · la cola, con detalle ─────────────────────────────────────────────
     Si no hay red, NADA dice «subiendo». La regla se respeta también aquí, que
     es donde más tienta romperla. */
  var NOMBRE_QUE = { lead:'Lead', documento:'Documento', cambio:'Cambio' };
  var NOMBRE_TABLA = { seguimientos:'Actividad', personas:'Cliente', operaciones:'Operación',
                       captacion:'Lead', operacion_titulares:'Titulares' };

  function tituloFila(x) {
    return x.origen === 'runtime'
      ? (NOMBRE_TABLA[x.nombre] || x.nombre) + ' · cambio sin subir'
      : (NOMBRE_QUE[x.que] || x.que) + (x.nombre ? ' · ' + x.nombre : '');
  }

  function pintarCola() {
    var q = D.porSubir(), red = navigator.onLine !== false;
    var bytes = q.reduce(function (n, x) { return n + (x.bytes || 0); }, 0);
    var conPeso = q.filter(function (x) { return x.bytes; }).length;
    cabecera('Por subir', true);

    document.getElementById('cuerpo').innerHTML = !q.length
      ? '<div class="tarjeta" style="padding:22px 18px;text-align:center">' +
          '<div style="color:var(--exito);display:flex;justify-content:center;margin-bottom:9px">' + ico(IC.check, 24) + '</div>' +
          '<div style="font-size:15px;font-weight:500">No hay nada esperando</div>' +
          '<div style="font-size:13px;color:var(--suave);margin-top:6px;line-height:1.55">' +
          'Todo lo que has hecho está en el CRM.</div></div>'
      : '<div class="tarjeta" style="padding:17px;margin-bottom:14px">' +
          '<div style="display:flex;align-items:baseline;gap:9px">' +
            '<span class="serif mono" style="font-size:32px;font-weight:400">' + q.length + '</span>' +
            '<span style="font-size:13.5px;color:var(--suave)">cosas esperando</span>' +
            (red ? '' : '<span class="pill" style="margin-left:auto;background:color-mix(in srgb,var(--aviso) 12%,transparent);' +
              'color:var(--aviso)"><span class="punto" style="background:var(--aviso)"></span>sin conexión</span>') +
          '</div>' +
          (conPeso ? '<div class="mono" style="font-size:12.5px;color:var(--suave);margin-top:2px">' +
            D.megas(bytes) + ' en ' + conPeso + (conPeso === 1 ? ' fichero' : ' ficheros') + '</div>' : '') +
          '<div style="font-size:12.5px;line-height:1.6;color:rgba(22,33,62,.7);margin-top:9px">' +
            (red
              ? 'Guardadas en el móvil. Suben solas: primero los cambios y después los ficheros.'
              : 'Guardadas en el móvil. Nada está subiendo porque no hay red: en cuanto la haya, ' +
                'empiezan solas.') + '</div>' +
        '</div>' +

        eyebrow('Una a una') +
        '<div class="tarjeta" style="overflow:hidden;margin-bottom:14px">' +
        q.map(function (x, i) {
          var titulo = tituloFila(x);
          /* Desde que la subida existe, un fichero SÍ puede fallar — antes no,
             porque nada lo intentaba. Cuando falla se dice y se puede rehacer. */
          var det = x.origen === 'runtime'
            ? (x.intentos ? 'Reintentado ' + x.intentos + (x.intentos === 1 ? ' vez' : ' veces') : 'Sube en cuanto haya red')
            : x.error
              ? 'Falló · ' + x.error
              : [D.haceCuanto(new Date(x.at || Date.now()).toISOString()),
                 x.bytes ? D.megas(x.bytes) : null,
                 x.ref ? x.ref : null].filter(Boolean).join(' · ');
          return '<div class="fila" style="' + (i ? 'border-top:1px solid var(--sep)' : '') + '">' +
            '<span style="color:' + (x.error ? 'var(--error)' : 'var(--raya)') + ';flex-shrink:0">' +
              ico(x.bytes ? IC.movil : IC.subir, 16) + '</span>' +
            '<span style="flex:1;min-width:0">' +
              '<span style="display:block;font-size:13.5px">' + H(titulo) + '</span>' +
              '<span style="display:block;font-size:12px;color:var(--suave);margin-top:1px">' + H(det) + '</span>' +
            '</span>' +
            /* la que falló no se reintenta sola: se pide rehacer la foto */
            (x.error && x.k ? '<button data-mas="rehacer:' + H(x.k) + '" class="b-chico" style="flex-shrink:0">Rehacer</button>' : '') +
            '</div>';
        }).join('') + '</div>' +

        /* L8 · sin red el botón no puede hacer su trabajo, así que se apaga y
           se dice por qué. Y sube lo que de verdad se puede subir: los cambios
           del runtime. Las fotos esperan a que exista dónde ponerlas, y eso se
           escribe en vez de fingir un botón que las suba. */
        (red
          ? '<button data-mas="subir" class="b-primario" style="width:100%">Subir ahora</button>'
          : '<button disabled class="b-secundario" style="width:100%;opacity:.5;cursor:default">' +
            'Subir ahora · se enciende con cobertura</button>') +
        '<div style="font-size:12px;line-height:1.55;color:var(--suave);margin-top:9px;text-align:center">' +
          (red ? 'Sube solo al abrir la app y cuando vuelve la red. Este botón fuerza la pasada ' +
                 'y manda las fotos en su tamaño original.'
               : 'Guardadas en el móvil. En cuanto haya red, suben solas.') + '</div>';
  }

  /* ── 06 · qué hay descargado ──────────────────────────────────────────────── */
  function pintarDescargado() {
    var A = D.alcance(), bytes = D.bytesAlmacen(), t = D.ultimaSync();
    cabecera('Descargado', true);
    document.getElementById('cuerpo').innerHTML =
      '<div class="tarjeta" style="padding:17px;margin-bottom:14px">' +
        '<div style="display:flex;align-items:baseline;gap:9px">' +
          '<span class="serif mono" style="font-size:32px;font-weight:400">' + D.megas(bytes) + '</span>' +
          '<span style="font-size:12.5px;color:var(--suave)">' +
            (t ? 'actualizado ' + D.haceCuanto(new Date(t).toISOString()) : 'sin apuntar todavía') + '</span></div>' +
        '<div style="font-size:12.5px;line-height:1.6;color:rgba(22,33,62,.7);margin-top:9px">' +
          'Esto es exactamente lo que funciona dentro de un piso sin cobertura, y lo que alcanza ' +
          'Buscar cuando no hay red.</div>' +
      '</div>' +

      eyebrow('Qué está y qué no') +
      '<div class="tarjeta" style="overflow:hidden;margin-bottom:14px">' +
      [[true,  plural(A.personas, 'persona') + ', con teléfono y fase'],
       /* C1 · el número se cuenta; la regla de catorce días es la que declara Buscar */
       [true,  plural(A.notasRecientes, 'actividad', 'actividades') + ' · dos últimas semanas'],
       [false, 'Documentos y notas más viejas']
      ].map(function (f, i) {
        return '<div class="fila" style="' + (i ? 'border-top:1px solid var(--sep)' : '') +
          (f[0] ? '' : ';color:var(--suave)') + '">' +
          '<span style="flex-shrink:0;color:' + (f[0] ? 'var(--exito)' : 'var(--raya)') + '">' +
            ico(f[0] ? IC.check : IC.cruz, 15) + '</span>' +
          '<span style="flex:1;font-size:13.5px">' + H(f[1]) + '</span></div>';
      }).join('') + '</div>' +

      '<button data-mas="refrescar" class="b-secundario" style="width:100%">Refrescar ahora</button>' +
      '<div style="font-size:12px;line-height:1.55;color:var(--suave);margin:9px 0 18px;text-align:center">' +
        'Se refresca solo al abrir la app con red. Refrescar a mano es para antes de entrar en una zona mala.</div>' +

      '<button data-mas="borrar" style="width:100%;height:48px;border:1px solid var(--error);border-radius:8px;' +
        'background:transparent;color:var(--error);font-size:14.5px;font-weight:500;display:flex;' +
        'align-items:center;justify-content:center;gap:8px">' + ico(IC.papel, 16) + 'Borrar lo descargado</button>' +
      '<div style="font-size:12px;line-height:1.55;color:var(--suave);margin-top:9px;text-align:center">' +
        'Para un móvil que se presta o se devuelve. Si hay cosas sin subir, avisa antes — ' +
        'igual que cerrar sesión.</div>';
  }

  /* ── 05 · la hoja del aviso ────────────────────────────────────────────────
     Borrar y cerrar sesión son la misma clase de riesgo y llevan el mismo
     aviso. La salida buena va primero; la destructiva va última, escrita con lo
     que hace y sin relleno de color. */
  function hojaRiesgo(accion) {
    var q = D.porSubir();
    var esSalir = accion === 'salir';
    var cap = document.createElement('div');
    cap.id = 'hoja-mas';
    cap.style.cssText = 'position:fixed;inset:0;z-index:200';
    /* Mismo título que en la lista de la cola: «Documento de Nómina de Núria»
       lleva dos «de» y se lee peor que «Documento · Nómina de Núria». */
    var resumen = q.slice(0, 4).map(function (x) {
      return tituloFila(x) + (x.bytes ? ' · ' + D.megas(x.bytes) : '');
    });
    cap.innerHTML = '<div data-mas="cerrar-hoja" style="position:absolute;inset:0;background:rgba(22,33,62,.42)"></div>' +
      '<div style="position:absolute;left:0;right:0;bottom:0;background:var(--sup);border-radius:13px 13px 0 0;' +
        'box-shadow:0 -14px 40px rgba(22,33,62,.22);padding:16px 16px calc(env(safe-area-inset-bottom,0px) + 16px)">' +
        '<div style="width:38px;height:4px;border-radius:2px;background:var(--borde);margin:0 auto 14px"></div>' +
        '<div class="serif" style="font-size:19px;font-weight:500;line-height:1.25">' +
          (q.length ? 'Tienes ' + q.length + (q.length === 1 ? ' cosa sin subir' : ' cosas sin subir')
                    : (esSalir ? '¿Cerrar sesión?' : '¿Borrar lo descargado?')) + '</div>' +
        '<div style="font-size:13px;line-height:1.6;color:var(--suave);margin-top:8px">' +
          (q.length
            ? 'Si ' + (esSalir ? 'cierras sesión' : 'lo borras') + ' ahora, se borran del móvil y no llegan al CRM. ' +
              'No hay manera de recuperarlas.'
            : (esSalir ? 'No hay nada pendiente, así que no se pierde nada.'
                       : 'Se vuelve a descargar solo la próxima vez que abras la app con red.')) + '</div>' +
        (resumen.length ? '<div style="margin-top:12px;padding:11px 13px;background:var(--sep);border-radius:9px">' +
          resumen.map(function (r) {
            return '<div style="font-size:12.5px;line-height:1.6;color:rgba(22,33,62,.75)">· ' + H(r) + '</div>';
          }).join('') +
          (q.length > 4 ? '<div style="font-size:12px;color:var(--suave);margin-top:4px">y ' + (q.length - 4) +
            ' más</div>' : '') + '</div>' : '') +

        '<div style="display:flex;flex-direction:column;gap:9px;margin-top:16px">' +
          (q.length ? '<button data-mas="cerrar-hoja" class="b-primario" style="width:100%">' +
            'Quedarme y subirlas primero</button>' : '') +
          '<button data-mas="cerrar-hoja" class="b-secundario" style="width:100%">Cancelar</button>' +
          '<button data-mas="' + (esSalir ? 'salir-confirmar' : 'borrar-confirmar') + '" ' +
            'style="width:100%;height:48px;border:1px solid var(--error);border-radius:8px;background:transparent;' +
            'color:var(--error);font-size:14.5px;font-weight:500">' +
            (esSalir ? (q.length ? 'Cerrar sesión y perderlas' : 'Cerrar sesión')
                     : (q.length ? 'Borrar y perderlas' : 'Borrar lo descargado')) + '</button>' +
        '</div></div>';
    document.body.appendChild(cap);
  }
  function cerrarHoja() { var e = document.getElementById('hoja-mas'); if (e) e.remove(); }

  /* ── el orden de las cuatro puertas ────────────────────────────────────────
     Se aprende del oficio de cada uno, pero tiene que poder tocarse. Se cambia
     subiendo una puerta de posición: es lo que cabe en un móvil sin arrastrar. */
  function hojaPuertas() {
    var orden = ordenActual().slice();
    var cap = document.createElement('div');
    cap.id = 'hoja-mas';
    cap.style.cssText = 'position:fixed;inset:0;z-index:200';
    function pinta() {
      cap.innerHTML = '<div data-mas="cerrar-hoja" style="position:absolute;inset:0;background:rgba(22,33,62,.42)"></div>' +
        '<div style="position:absolute;left:0;right:0;bottom:0;background:var(--sup);border-radius:13px 13px 0 0;' +
          'box-shadow:0 -14px 40px rgba(22,33,62,.22);padding:16px 16px calc(env(safe-area-inset-bottom,0px) + 16px)">' +
          '<div style="width:38px;height:4px;border-radius:2px;background:var(--borde);margin:0 auto 14px"></div>' +
          '<div class="serif" style="font-size:19px;font-weight:500">Orden de las puertas</div>' +
          '<div style="font-size:13px;color:var(--suave);margin-top:6px;line-height:1.5">' +
            'La primera es la que más usas. Las cuatro siguen siendo del mismo tamaño.</div>' +
          '<div class="tarjeta" style="overflow:hidden;margin-top:14px">' +
          orden.map(function (k, i) {
            var n = NOMBRE_PUERTA[k] || k;
            return '<div class="fila" style="' + (i ? 'border-top:1px solid var(--sep)' : '') + '">' +
              '<span class="mono" style="width:18px;color:var(--tenue);font-size:12.5px;flex-shrink:0">' + (i + 1) + '</span>' +
              '<span style="flex:1;font-size:14px">' + H(n.charAt(0).toUpperCase() + n.slice(1)) + '</span>' +
              (i ? '<button data-sube="' + i + '" class="b-chico" style="flex-shrink:0">Subir</button>' : '') +
              '</div>';
          }).join('') + '</div>' +
          '<button data-mas="cerrar-hoja" class="b-primario" style="width:100%;margin-top:14px">Listo</button>' +
        '</div>';
      cap.querySelectorAll('[data-sube]').forEach(function (b) {
        b.onclick = function () {
          var i = +b.getAttribute('data-sube');
          var t = orden[i]; orden[i] = orden[i - 1]; orden[i - 1] = t;
          D.guardarAjuste('ordenPuertas', orden);
          pinta();
        };
      });
    }
    pinta();
    document.body.appendChild(cap);
  }

  /* ── avisar a soporte ──────────────────────────────────────────────────────
     La ayuda no es una pantalla: abre WhatsApp con la versión y la sesión ya
     escritas, que es lo único que hace falta saber para poder ayudar. */
  function soporte() {
    var yo = D.yo(), q = D.porSubir();
    var t = 'Hola, soy ' + yo.nombre + ' desde la app de AJ Finances.\n' +
      'Versión v' + VERSION + ' · ' + (D.instalada() ? 'instalada' : 'navegador') +
      ' · ' + (yo.haySesion ? 'con sesión' : 'sin sesión') +
      (q.length ? ' · ' + q.length + ' sin subir' : '') + '\n\nLo que pasa: ';
    window.open('https://wa.me/?text=' + encodeURIComponent(t), '_blank');
  }

  function pintar() {
    if (vista === 'cola') return pintarCola();
    if (vista === 'descargado') return pintarDescargado();
    pintarMas();
  }

  document.addEventListener('click', function (e) {
  /* Instalar la PWA es manual en iOS (no hay beforeinstallprompt fiable): se
     explican los dos toques en vez de fingir un botón de instalación del sistema. */
  function instruccionesInstalar() {
    var cap = document.createElement('div'); cap.style.cssText = 'position:fixed;inset:0;z-index:200';
    document.body.appendChild(cap);
    cap.innerHTML = '<div data-cerrar-inst="1" style="position:absolute;inset:0;background:rgba(22,33,62,.42)"></div>' +
      '<div style="position:absolute;left:0;right:0;bottom:0;background:var(--sup);border-radius:13px 13px 0 0;padding:16px 16px calc(env(safe-area-inset-bottom,0px) + 18px);box-shadow:0 -14px 40px rgba(22,33,62,.22)">' +
        '<div style="width:38px;height:4px;border-radius:2px;background:var(--borde);margin:0 auto 14px"></div>' +
        '<div class="serif" style="font-size:19px;font-weight:500">Instalarla · 2 toques</div>' +
        '<div style="margin-top:12px;display:flex;flex-direction:column;gap:12px">' +
          [['1', 'Toca «Compartir»', 'el icono del cuadrado con la flecha hacia arriba, abajo en Safari'],
           ['2', 'Toca «Añadir a pantalla de inicio»', 'y confirma. Aparece como una app más, y ya funciona sin cobertura']].map(function (p) {
            return '<div style="display:flex;align-items:flex-start;gap:11px">' +
              '<span style="width:26px;height:26px;border-radius:50%;background:#eef3fa;color:var(--accion);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600;flex-shrink:0">' + p[0] + '</span>' +
              '<span style="flex:1"><span style="display:block;font-size:14px;font-weight:500">' + p[1] + '</span>' +
              '<span style="display:block;font-size:12.5px;color:var(--suave);margin-top:1px">' + p[2] + '</span></span></div>';
          }).join('') + '</div>' +
        '<button data-cerrar-inst="1" class="b-secundario" style="width:100%;margin-top:16px">Entendido</button>' +
      '</div>';
    cap.querySelectorAll('[data-cerrar-inst]').forEach(function (el) { el.onclick = function () { cap.remove(); }; });
  }

    var b = e.target.closest('[data-mas]');
    if (!b) return;
    var a = b.getAttribute('data-mas');

    if (a === 'cerrar-hoja')  { cerrarHoja(); return; }
    if (a === 'volver')       { vista = 'mas'; pintar(); return; }
    if (a === 'cola')         { vista = 'cola'; pintar(); return; }
    if (a === 'descargado')   { vista = 'descargado'; pintar(); return; }
    if (a === 'puertas')      { hojaPuertas(); return; }
    if (a === 'soporte')      { soporte(); return; }
    if (a === 'instalar')     { instruccionesInstalar(); return; }
    if (a.indexOf('rehacer:') === 0) {
      /* la que falló al subir se descarta y se vuelve a capturar: no se reintenta sola */
      D.quitarDeCola(a.slice(8));
      pintar();
      if (window.AJapp.capturar) window.AJapp.capturar.abrir();
      return;
    }
    if (a.indexOf('entorno:') === 0) {
      var destino = a.slice(8);
      try {
        var actual = (window.AJ_SUPABASE && window.AJ_SUPABASE.entorno) || 'produccion';
        if (destino === actual) return;
        /* cambiar de entorno recarga (lo hace la config); cada entorno tiene su
           sesión, así que al recargar entrarás de nuevo en el nuevo */
        if (destino === 'produccion') AJ.entorno.salir(); else AJ.entorno.usar(destino);
      } catch (x) { console.warn('[app] cambio de entorno:', x.message); }
      return;
    }
    if (a === 'salir')        { hojaRiesgo('salir'); return; }
    if (a === 'borrar')       { hojaRiesgo('borrar'); return; }

    if (a.indexOf('alternar:') === 0) {
      var clave = a.slice(9);
      D.guardarAjuste(clave, !D.ajustes()[clave]);
      pintar(); return;
    }
    if (a === 'subir') {
      try { AJ.remote.reintentar(); } catch (x) { console.warn('[app] reintentar:', x.message); }
      /* y los ficheros, que hasta el 30-ago no subían a ningún sitio */
      b.disabled = true; b.textContent = 'Subiendo…';
      D.subirMedios({ originales: true }).then(function (r) {
        pintar();
        if (!r.subidos && r.motivo) console.warn('[app] no ha subido nada:', r.motivo);
      });
      return;
    }
    if (a === 'refrescar') {
      Promise.all([D.refrescarUsuarios(), D.refrescarRequisitos(), D.refrescarCuotas()])
        .then(function () { pintar(); });
      return;
    }
    if (a === 'salir-confirmar') {
      cerrarHoja();
      limpiar().then(function () {
        try { return AJ.remote.logout(); } catch (x) { return null; }
      }).then(function () { location.reload(); });
      return;
    }
    if (a === 'borrar-confirmar') {
      cerrarHoja();
      limpiar().then(function () { vista = 'mas'; pintar(); });
      return;
    }
  });

  /* Lo descargado y lo capturado, fuera. La sesión NO se toca aquí: de eso se
     encarga quien llama, porque borrar y cerrar sesión son dos cosas y solo una
     de las dos te echa. */
  function limpiar() {
    var claves = [];
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var k = localStorage.key(i);
        if (k.indexOf('aj_') === 0 && k !== 'aj_sb_session_v1') claves.push(k);
      }
      claves.forEach(function (k) { localStorage.removeItem(k); });
    } catch (e) {}
    return D.medios.vaciar().catch(function () { return null; });
  }

  window.AJapp.mas = { pintar: function () { vista = 'mas'; pintar(); }, version: VERSION };
})();
