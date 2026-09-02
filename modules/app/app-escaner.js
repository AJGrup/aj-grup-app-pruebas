/* ═══════════════════════════════════════════════════════════════════════════
   App AJ Finances · 05b · Escáner de documentos — port realista F1 de
   «App Escaner.dc.html»

   Escanear no es hacer fotos: es un PDF por documento, atado a su requisito.
   El mock enseña siete estados; esta es la VERSIÓN REALISTA F1 que decidió
   Jonatan, y por eso hay tres cosas que el mock propone y aquí NO se fingen:

     · Sin detección automática de bordes (nada de OpenCV en el móvil). El
       recorte es SIEMPRE MANUAL: cuatro esquinas que se arrastran. Fingir un
       «hoja detectada» que falla la mitad de las veces es peor que pedir el
       recorte a mano, que tarda tres segundos y no miente.
     · El PDF se arma con un ENSAMBLADOR JPEG→PDF propio (~100 líneas, sin
       dependencias). Se pidió jsPDF, pero vendorizar 200 KB que no se pueden
       bajar sin red es peor negocio que embeber cada hoja como un XObject
       /DCTDecode —que es exactamente lo que jsPDF hace con las imágenes—. El
       PDF resultante lo abre cualquier visor. Si algún día se quiere jsPDF de
       verdad, este ensamblador se sustituye sin tocar el resto.
     · Sin cobertura NADA dice «subiendo»: el PDF se hace y se guarda en el
       móvil, y la cola de Capturar lo sube cuando haya red (estado 07).

   El Escáner solo PRODUCE el PDF; guardarlo y encolarlo es de Capturar, que
   ya tiene la cola y el almacén de medios. Se comunica por `onListo(blob, n)`.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var D = window.AJapp.datos, I = window.AJapp.inicio;
  var H = I.H, svg = I.svg;

  var S = null;   // { nombre, ref, requisito, titular, onListo, paginas:[{jpeg,w,h,thumb}], edit }

  /* ── el ensamblador JPEG → PDF ──────────────────────────────────────────────
     Un PDF mínimo válido: catálogo → páginas → por hoja, un objeto Page + un
     XObject imagen (/DCTDecode = el JPEG tal cual) + un stream de contenido que
     lo dibuja a tamaño de página (A4, encajado conservando proporción). Tabla
     xref al final. Nada de compresión extra: el JPEG ya está comprimido. */
  function construirPDF(paginas) {
    var A4 = { w: 595.28, h: 841.89 };            // puntos, 72 dpi
    var objetos = [];                             // cada uno: string o Uint8Array (bytes crudos)
    function texto(s) { return s; }

    /* Cabeceras de objeto que se resuelven al final con sus offsets. */
    var partes = [];                              // {n, cuerpo:(string|bytes), esBytes}
    function push(n, cuerpo, esBytes) { partes.push({ n: n, cuerpo: cuerpo, esBytes: !!esBytes }); }

    var nObjs = 2 + paginas.length * 3;           // catálogo + pages + (page+img+content)*n
    var idPages = 2;
    var kids = [];
    var siguiente = 3;

    paginas.forEach(function (p) {
      var idImg = siguiente++, idPage = siguiente++, idCont = siguiente++;
      kids.push(idPage);
      /* Encaje conservando proporción dentro del A4, centrado. */
      var esc = Math.min(A4.w / p.w, A4.h / p.h);
      var dw = p.w * esc, dh = p.h * esc;
      var ox = (A4.w - dw) / 2, oy = (A4.h - dh) / 2;
      var cont = 'q\n' + dw.toFixed(2) + ' 0 0 ' + dh.toFixed(2) + ' ' + ox.toFixed(2) + ' ' + oy.toFixed(2) + ' cm\n/Im0 Do\nQ\n';
      push(idImg, '<< /Type /XObject /Subtype /Image /Width ' + p.w + ' /Height ' + p.h +
        ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + p.bytes.length + ' >>\nstream\n', false, );
      // el objeto imagen lleva cuerpo texto + bytes + "endstream endobj"; se marca aparte
      partes[partes.length - 1].imgBytes = p.bytes;
      push(idPage, '<< /Type /Page /Parent ' + idPages + ' 0 R /MediaBox [0 0 ' + A4.w.toFixed(2) + ' ' + A4.h.toFixed(2) +
        '] /Resources << /XObject << /Im0 ' + idImg + ' 0 R >> >> /Contents ' + idCont + ' 0 R >>');
      push(idCont, '<< /Length ' + cont.length + ' >>\nstream\n' + cont + 'endstream');
    });

    push(1, '<< /Type /Catalog /Pages ' + idPages + ' 0 R >>');
    push(idPages, '<< /Type /Pages /Kids [' + kids.map(function (k) { return k + ' 0 R'; }).join(' ') + '] /Count ' + kids.length + ' >>');

    partes.sort(function (a, b) { return a.n - b.n; });

    /* Serializar a bytes, guardando offsets para la xref. */
    var enc = new TextEncoder();
    var chunks = [], offset = 0, offsets = {};
    function add(u8) { chunks.push(u8); offset += u8.length; }
    add(new Uint8Array([0x25,0x50,0x44,0x46,0x2D,0x31,0x2E,0x34,0x0A,0x25,0xE2,0xE3,0xCF,0xD3,0x0A]));  // %PDF-1.4 + marcador binario, bytes crudos (TextEncoder rompería los 0xFF)
    partes.forEach(function (o) {
      offsets[o.n] = offset;
      add(enc.encode(o.n + ' 0 obj\n' + o.cuerpo));
      if (o.imgBytes) { add(o.imgBytes); add(enc.encode('\nendstream\nendobj\n')); }
      else { add(enc.encode('\nendobj\n')); }
    });
    var xrefOff = offset;
    var total = partes.length + 1;
    var xref = 'xref\n0 ' + total + '\n0000000000 65535 f \n';
    for (var i = 1; i < total; i++) {
      xref += ('0000000000' + (offsets[i] || 0)).slice(-10) + ' 00000 n \n';
    }
    xref += 'trailer\n<< /Size ' + total + ' /Root 1 0 R >>\nstartxref\n' + xrefOff + '\n%%EOF';
    add(enc.encode(xref));
    return new Blob(chunks, { type: 'application/pdf' });
  }

  /* dataURL JPEG → Uint8Array de los bytes crudos del JPEG */
  function jpegBytes(dataUrl) {
    var b64 = dataUrl.split(',')[1];
    var bin = atob(b64);
    var u8 = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    return u8;
  }

  /* ── el overlay ─────────────────────────────────────────────────────────── */
  function cerrar() { var e = document.getElementById('esc-cap'); if (e) e.remove(); S = null; }
  function cap() {
    var e = document.getElementById('esc-cap');
    if (!e) { e = document.createElement('div'); e.id = 'esc-cap';
      e.style.cssText = 'position:fixed;inset:0;z-index:220;background:var(--fondo,#f4f6fa);display:flex;flex-direction:column';
      document.body.appendChild(e); }
    return e;
  }

  /* ── captura · una hoja con la cámara (o galería) ───────────────────────── */
  function capturarHoja() {
    var i = document.createElement('input');
    i.type = 'file'; i.accept = 'image/*'; i.setAttribute('capture', 'environment');
    i.onchange = function () {
      var f = (i.files || [])[0];
      if (!f) { if (!S.paginas.length) cerrar(); else pintarLista(); return; }
      var url = URL.createObjectURL(f);
      var img = new Image();
      img.onload = function () { URL.revokeObjectURL(url); pintarRecorte(img); };
      img.onerror = function () { URL.revokeObjectURL(url); alert('No se pudo leer la foto.'); pintarLista(); };
      img.src = url;
    };
    i.click();
  }

  /* ── 04 · recorte MANUAL · cuatro esquinas que se arrastran ─────────────────
     Rectángulo de recorte con cuatro tiradores. Arrastrar una esquina mueve esa
     esquina (sigue siendo rectángulo). «Automático» = la hoja entera, no un
     borde detectado que no existe. Al confirmar, se recorta a resolución
     original (tope 1600 px de lado largo) y se guarda como JPEG. */
  function pintarRecorte(img) {
    var e = cap();
    var VW = Math.min(window.innerWidth, 390);
    var maxLienzo = VW - 24;
    var esc = Math.min(maxLienzo / img.width, (window.innerHeight - 220) / img.height, 1);
    var cw = Math.round(img.width * esc), ch = Math.round(img.height * esc);
    e.innerHTML =
      '<div style="padding:44px 16px 12px;flex-shrink:0">' +
        '<div style="display:flex;align-items:center;gap:12px">' +
          '<button id="esc-cancelar" style="color:var(--suave)">' + svg('chevron',20) + '</button>' +
          '<div><div class="eyebrow">Recortar · ajusta las esquinas</div>' +
          '<div class="serif" style="font-size:19px;font-weight:500;margin-top:1px">' +
            H(S.nombre || 'Documento') + ' · hoja ' + (S.paginas.length + 1) + '</div></div></div></div>' +
      '<div style="flex:1;display:flex;align-items:center;justify-content:center;overflow:hidden;padding:0 12px">' +
        '<div id="esc-marco" style="position:relative;width:' + cw + 'px;height:' + ch + 'px;touch-action:none">' +
          '<canvas id="esc-lienzo" width="' + cw + '" height="' + ch + '" style="display:block;border-radius:8px"></canvas>' +
        '</div></div>' +
      '<div style="flex-shrink:0;padding:12px 16px calc(env(safe-area-inset-bottom,0px) + 16px);background:#fff;border-top:1px solid var(--sep)">' +
        '<div style="display:flex;gap:8px;margin-bottom:9px">' +
          '<button id="esc-auto" class="b-secundario" style="flex:1">Toda la hoja</button>' +
          '<button id="esc-rehacer" class="b-secundario" style="flex:1">Rehacer la foto</button></div>' +
        '<button id="esc-recortar" class="b-primario" style="width:100%">Recortar y añadir</button></div>';

    var lienzo = document.getElementById('esc-lienzo'), ctx = lienzo.getContext('2d');
    var m = 0.06;
    var rect = { x0: cw * m, y0: ch * m, x1: cw * (1 - m), y1: ch * (1 - m) };
    function dibuja() {
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, 0, 0, cw, ch);
      ctx.fillStyle = 'rgba(22,33,62,.45)';
      ctx.fillRect(0, 0, cw, rect.y0);
      ctx.fillRect(0, rect.y1, cw, ch - rect.y1);
      ctx.fillRect(0, rect.y0, rect.x0, rect.y1 - rect.y0);
      ctx.fillRect(rect.x1, rect.y0, cw - rect.x1, rect.y1 - rect.y0);
      ctx.strokeStyle = '#0066B1'; ctx.lineWidth = 2;
      ctx.strokeRect(rect.x0, rect.y0, rect.x1 - rect.x0, rect.y1 - rect.y0);
      [[rect.x0,rect.y0],[rect.x1,rect.y0],[rect.x1,rect.y1],[rect.x0,rect.y1]].forEach(function (c) {
        ctx.fillStyle = '#0066B1'; ctx.beginPath(); ctx.arc(c[0], c[1], 9, 0, 7); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(c[0], c[1], 4, 0, 7); ctx.fill();
      });
    }
    dibuja();
    var drag = null;
    function esquina(x, y) {
      var cs = [['x0','y0'],['x1','y0'],['x1','y1'],['x0','y1']];
      for (var k = 0; k < 4; k++) {
        if (Math.abs(x - rect[cs[k][0]]) < 22 && Math.abs(y - rect[cs[k][1]]) < 22) return cs[k];
      }
      return null;
    }
    function pos(ev) { var r = lienzo.getBoundingClientRect(); var t = ev.touches ? ev.touches[0] : ev;
      return { x: t.clientX - r.left, y: t.clientY - r.top }; }
    lienzo.addEventListener('pointerdown', function (ev) { var p = pos(ev); drag = esquina(p.x, p.y); });
    lienzo.addEventListener('pointermove', function (ev) {
      if (!drag) return; ev.preventDefault(); var p = pos(ev);
      rect[drag[0]] = Math.max(0, Math.min(cw, p.x)); rect[drag[1]] = Math.max(0, Math.min(ch, p.y));
      dibuja();
    });
    window.addEventListener('pointerup', function () { drag = null; });

    document.getElementById('esc-cancelar').onclick = function () { S.paginas.length ? pintarLista() : cerrar(); };
    document.getElementById('esc-rehacer').onclick = function () { capturarHoja(); };
    document.getElementById('esc-auto').onclick = function () {
      rect = { x0: 0, y0: 0, x1: cw, y1: ch }; dibuja();
    };
    document.getElementById('esc-recortar').onclick = function () {
      /* ordenar por si se cruzaron las esquinas */
      var sx0 = Math.min(rect.x0, rect.x1), sx1 = Math.max(rect.x0, rect.x1);
      var sy0 = Math.min(rect.y0, rect.y1), sy1 = Math.max(rect.y0, rect.y1);
      var fx = img.width / cw, fy = img.height / ch;
      var rx = sx0 * fx, ry = sy0 * fy, rw = (sx1 - sx0) * fx, rh = (sy1 - sy0) * fy;
      if (rw < 8 || rh < 8) { alert('El recorte es demasiado pequeño.'); return; }
      /* tope 1600 px de lado largo, como el resto de la app */
      var tope = 1600, k = Math.min(1, tope / Math.max(rw, rh));
      var ow = Math.max(1, Math.round(rw * k)), oh = Math.max(1, Math.round(rh * k));
      var off = document.createElement('canvas'); off.width = ow; off.height = oh;
      off.getContext('2d').drawImage(img, rx, ry, rw, rh, 0, 0, ow, oh);
      var jpeg = off.toDataURL('image/jpeg', 0.82);
      S.paginas.push({ jpeg: jpeg, w: ow, h: oh, bytes: jpegBytes(jpeg), thumb: jpeg });
      pintarLista();
    };
  }

  /* ── 06 · la lista de hojas · reordenar, añadir, guardar ────────────────── */
  function pintarLista() {
    var e = cap();
    var n = S.paginas.length;
    var offline = navigator.onLine === false;
    e.innerHTML =
      '<div style="padding:44px 16px 12px;flex-shrink:0">' +
        '<div style="display:flex;align-items:center;gap:12px">' +
          '<button id="esc-salir" style="color:var(--suave)">' + svg('chevron',20) + '</button>' +
          '<div style="flex:1"><div class="eyebrow">Listo para guardar</div>' +
          '<div class="serif" style="font-size:20px;font-weight:500;margin-top:1px">' +
            H(S.nombre || 'Documento') + ' · ' + n + ' hoja' + (n === 1 ? '' : 's') + '</div></div></div>' +
        (S.requisito ? '<div style="font-size:12.5px;color:var(--suave);margin-top:8px">Tapa el hueco «' + H(S.nombre) + '»' +
          (S.dequien ? ' · ' + H(S.dequien) : '') + '</div>' : '') + '</div>' +
      '<div style="flex:1;overflow-y:auto;padding:4px 16px 8px">' +
        '<div style="display:flex;flex-direction:column;gap:9px">' + S.paginas.map(function (p, i) {
          return '<div style="display:flex;align-items:center;gap:11px;background:#fff;border:1px solid var(--sep);border-radius:11px;padding:9px 11px">' +
            '<img src="' + p.thumb + '" style="width:44px;height:56px;object-fit:cover;border-radius:6px;flex-shrink:0">' +
            '<span style="flex:1;font-size:13.5px">Hoja ' + (i + 1) + '</span>' +
            '<button data-esc-sube="' + i + '" ' + (i === 0 ? 'disabled' : '') + ' style="width:38px;height:38px;color:' + (i === 0 ? 'var(--raya)' : 'var(--accion)') + '">▲</button>' +
            '<button data-esc-baja="' + i + '" ' + (i === n - 1 ? 'disabled' : '') + ' style="width:38px;height:38px;color:' + (i === n - 1 ? 'var(--raya)' : 'var(--accion)') + '">▼</button>' +
            '<button data-esc-borra="' + i + '" style="width:38px;height:38px;color:var(--error)">' + svg('mas',16) + '</button>' +
          '</div>';
        }).join('') + '</div>' +
        '<button id="esc-anadir" class="b-secundario" style="width:100%;margin-top:12px">' + svg('mas',18) + 'Añadir hoja</button>' +
        (offline ? '<div style="margin-top:12px;background:#fff;border:1px solid var(--sep);border-left:3px solid var(--aviso);border-radius:11px;padding:12px 14px;font-size:12.5px;line-height:1.55;color:rgba(22,33,62,.7)">' +
          'Sin cobertura aquí. El PDF se hace y se guarda en el móvil; la cola lo sube cuando haya red. Nada se pierde.</div>' : '') +
      '</div>' +
      '<div style="flex-shrink:0;padding:12px 16px calc(env(safe-area-inset-bottom,0px) + 16px);background:#fff;border-top:1px solid var(--sep)">' +
        '<button id="esc-guardar" class="b-primario" style="width:100%"' + (n ? '' : ' disabled') + '>' +
          (offline ? 'Guardar · sube cuando haya red' : 'Guardar el PDF') + '</button>' +
        '<button id="esc-guardar-otro" class="b-secundario" style="width:100%;margin-top:8px"' + (n ? '' : ' disabled') + '>Guardar y escanear otro</button></div>';

    document.getElementById('esc-salir').onclick = function () {
      if (!n || confirm('¿Descartar las hojas escaneadas?')) cerrar();
    };
    document.getElementById('esc-anadir').onclick = capturarHoja;
    e.querySelectorAll('[data-esc-sube]').forEach(function (b) { b.onclick = function () {
      var i = +b.getAttribute('data-esc-sube'); if (i > 0) { var t = S.paginas[i-1]; S.paginas[i-1] = S.paginas[i]; S.paginas[i] = t; pintarLista(); } }; });
    e.querySelectorAll('[data-esc-baja]').forEach(function (b) { b.onclick = function () {
      var i = +b.getAttribute('data-esc-baja'); if (i < n-1) { var t = S.paginas[i+1]; S.paginas[i+1] = S.paginas[i]; S.paginas[i] = t; pintarLista(); } }; });
    e.querySelectorAll('[data-esc-borra]').forEach(function (b) { b.onclick = function () {
      var i = +b.getAttribute('data-esc-borra'); S.paginas.splice(i, 1); n ? pintarLista() : capturarHoja(); if (!S.paginas.length) capturarHoja(); }; });
    document.getElementById('esc-guardar').onclick = function () { guardar(false); };
    document.getElementById('esc-guardar-otro').onclick = function () { guardar(true); };
  }

  function guardar(otro) {
    if (!S.paginas.length) return;
    var blob;
    try { blob = construirPDF(S.paginas); }
    catch (e) { alert('No se pudo armar el PDF: ' + e.message); return; }
    var nombre = (S.nombre || 'documento').replace(/[^\w\sáéíóúñ.-]/gi, '').trim() + '.pdf';
    var meta = { nombre: nombre, paginas: S.paginas.length, ref: S.ref, requisito: S.requisito || null, titular: S.titular || 0 };
    var cb = S.onListo, seguir = otro;
    if (cb) cb(blob, S.paginas.length, meta);
    if (seguir) { S.paginas = []; capturarHoja(); }
    else cerrar();
  }

  /* ── API pública ────────────────────────────────────────────────────────────
     abrir({ nombre, ref, requisito, titular, dequien, onListo(blob, nPaginas, meta) })
     El Escáner solo produce el PDF; Capturar lo guarda y lo encola. */
  window.AJapp.escaner = {
    abrir: function (opts) {
      S = { nombre: (opts && opts.nombre) || 'Documento', ref: opts && opts.ref,
            requisito: opts && opts.requisito, titular: (opts && opts.titular) || 0,
            dequien: opts && opts.dequien, onListo: opts && opts.onListo, paginas: [] };
      cap();
      capturarHoja();
    },
    construirPDF: construirPDF   // expuesto para test
  };
})();
