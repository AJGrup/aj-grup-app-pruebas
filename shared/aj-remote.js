/* ═══════════════════════════════════════════════════════════════════════════
   AJ GRUP CRM · OLA 0 · PASO 3 — AJ.remote v0.4.0 (fundación + cola PERSISTENTE + realtime + storage)

   Capa de acceso a Supabase SIN dependencias de build: usa fetch directo
   contra PostgREST + GoTrue (no requiere supabase-js; cero bundle).

   Arquitectura decidida en el playbook (frente 01):
   · La UI sigue siendo síncrona contra la caché local (localStorage) — la
     velocidad no cambia. AJ.remote es el canal asíncrono hacia Postgres.
   · Escrituras: cola optimista con reintento (eventos de estado guardando ·
     guardado · sin conexión · error para el indicador de la UI).
   · La migración Capa a Capa (empezando por personas) enchufará AJ.store a
     este módulo manteniendo la firma de las Capas.

   Carga: <script src="../../shared/supabase-config.js"></script>
          <script src="../../shared/aj-remote.js"></script>
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  if (typeof window === 'undefined') return;
  var CFG = window.AJ_SUPABASE || null;

  /* La sesión se guarda POR ENTORNO. Con una sola clave para los dos, entrabas
     en el laboratorio, volvías a producción y el CRM seguía mandando el pase
     del laboratorio: producción no lo reconoce, RLS devuelve cero filas, y la
     pantalla no dice «no tienes sesión» sino «no hay nada». Pasó de verdad el
     30-ago verificando una restauración: 27 fallos sobre una base intacta.

     Producción se queda sin sufijo a propósito, para no echar a nadie de la
     sesión que ya tiene abierta. */
  var LS_SESION = 'aj_sb_session_v1' +
    ((CFG && CFG.entorno && CFG.entorno !== 'produccion') ? ':' + CFG.entorno : '');

  /* Abrir el CRM con doble clic (file://) es una trampa silenciosa: el
     navegador da origen «null», Supabase rechaza la petición por CORS, y la
     app sigue funcionando contra su almacén local como si nada. Todo lo que
     escribas se queda en el portátil y no sube nunca. Encima el almacén de
     file:// es DISTINTO del de localhost, así que ni siquiera lo ves al abrir
     bien la página después.
     Pasó de verdad el 30-ago: un cliente creado que no existía en ningún sitio.
     Se avisa fuerte y una sola vez, y se deja seguir: en un piso sin red se
     trabaja igual, y el aviso ya dice qué pasa. */
  var ES_ARCHIVO = (typeof location !== 'undefined' && location.protocol === 'file:');
  if (ES_ARCHIVO && !window.__ajAvisoArchivo) {
    window.__ajAvisoArchivo = 1;
    console.warn('[AJ] Abierto como archivo (file://). NADA se guardará en el ' +
                 'servidor. Ábrelo por el servidor local para que sincronice.');
    try {
      var b = document.createElement('div');
      b.textContent = 'Abierto como archivo · nada se guarda en el servidor';
      b.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:2147483647;' +
        'background:#b8862b;color:#fff;font:500 13px/1.4 system-ui,sans-serif;' +
        'padding:9px 14px;text-align:center;';
      (document.body ? Promise.resolve() : new Promise(function (r) {
        document.addEventListener('DOMContentLoaded', r, { once: true });
      })).then(function () { document.body.appendChild(b); });
    } catch (e) { /* sin DOM, basta la consola */ }
  }

  /* ── sesión (GoTrue) ─────────────────────────────────────────────────── */
  function _leerSesion() {
    try { return JSON.parse(localStorage.getItem(LS_SESION) || 'null'); } catch (e) { return null; }
  }
  function _guardarSesion(s) {
    if (s) localStorage.setItem(LS_SESION, JSON.stringify(s));
    else localStorage.removeItem(LS_SESION);
    _emitir(s ? 'sesion' : 'logout');
  }
  function _sesionValida(s) {
    return !!(s && s.access_token && s.expires_at && (s.expires_at * 1000 - Date.now() > 60000));
  }

  async function _refrescar(s) {
    if (!s || !s.refresh_token) return null;
    var r = await fetch(CFG.url + '/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      headers: { apikey: CFG.publishableKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: s.refresh_token })
    });
    if (!r.ok) { _guardarSesion(null); return null; }
    var nueva = await r.json();
    _guardarSesion(nueva);
    return nueva;
  }

  async function _token() {
    var s = _leerSesion();
    if (!s) return null;
    if (!_sesionValida(s)) s = await _refrescar(s);
    return s ? s.access_token : null;
  }

  /* ── eventos de estado (para el indicador guardando/guardado/offline) ── */
  function _emitir(estado, detalle) {
    try {
      window.dispatchEvent(new CustomEvent('aj-remote-estado', { detail: { estado: estado, detalle: detalle || null } }));
    } catch (e) {}
  }

  /* ── REST (PostgREST) ────────────────────────────────────────────────── */
  async function _rest(metodo, ruta, body, extraHeaders) {
    if (!CFG) throw new Error('[AJ.remote] falta shared/supabase-config.js');
    var tk = await _token();
    var headers = Object.assign({
      apikey: CFG.publishableKey,
      Authorization: 'Bearer ' + (tk || CFG.publishableKey),
      'Content-Type': 'application/json',
      Prefer: 'return=representation'
    }, extraHeaders || {});
    var r = await fetch(CFG.url + '/rest/v1/' + ruta, {
      method: metodo, headers: headers,
      body: body != null ? JSON.stringify(body) : undefined
    });
    if (r.status === 204) return null;
    var data = null;
    try { data = await r.json(); } catch (e) {}
    if (!r.ok) {
      var msg = (data && (data.message || data.hint || data.code)) || ('HTTP ' + r.status);
      var err = new Error('[AJ.remote] ' + metodo + ' ' + ruta + ' → ' + msg);
      err.status = r.status; err.payload = data;
      throw err;
    }
    return data;
  }

  /* ── cola de escrituras optimista (reintento con backoff) ─────────────
     PERSISTENTE: sobrevive a recargas y cierres del navegador. Sin esto, lo
     capturado dentro de un piso sin cobertura se perdía al cerrar la pestaña
     — el caso de uso real de Armin y de la app móvil. Las promesas no se
     pueden serializar: las operaciones rehidratadas se reintentan sin
     callback (quien las encoló ya no está escuchando). */
  var _COLA_KEY = 'aj_remote_cola_v1';
  var _cola = [];
  var _procesando = false;

  function _colaGuardar() {
    try {
      localStorage.setItem(_COLA_KEY, JSON.stringify(_cola.map(function (op) {
        return { metodo: op.metodo, ruta: op.ruta, body: op.body, headers: op.headers,
                 intentos: op.intentos || 0, ts: op.ts || Date.now() };
      })));
    } catch (e) {}
  }
  function _colaLeer() {
    try {
      var g = JSON.parse(localStorage.getItem(_COLA_KEY) || '[]');
      return Array.isArray(g) ? g : [];
    } catch (e) { return []; }
  }
  function _colaRehidratar() {
    var g = _colaLeer();
    if (!g.length) return 0;
    /* delante de lo que se encole ahora: lo viejo se subió antes */
    _cola = g.concat(_cola);
    _emitir('pendiente', { pendientes: _cola.length, rehidratadas: g.length });
    return g.length;
  }

  async function _procesarCola() {
    if (_procesando) return;
    _procesando = true;
    while (_cola.length) {
      var op = _cola[0];
      try {
        _emitir('guardando', { pendientes: _cola.length });
        await _rest(op.metodo, op.ruta, op.body, op.headers);
        _cola.shift(); _colaGuardar();
        op.intentos = 0;
        if (op.resolve) op.resolve(true);
      } catch (e) {
        op.intentos = (op.intentos || 0) + 1;
        if (e.status && e.status >= 400 && e.status < 500) {
          /* error de datos/permisos: no reintentar a ciegas — sacar de la cola y avisar */
          _cola.shift(); _colaGuardar();
          _emitir('error', { mensaje: e.message, op: op.ruta });
          if (op.reject) op.reject(e);
          continue;
        }
        /* red / 5xx: backoff y reintento */
        _colaGuardar();
        _emitir('offline', { pendientes: _cola.length });
        _procesando = false;
        setTimeout(_procesarCola, Math.min(30000, 1000 * Math.pow(2, op.intentos)));
        return;
      }
    }
    _procesando = false;
    _emitir('guardado');
  }
  window.addEventListener('online', function () { if (_cola.length) _procesarCola(); });

  /* ── REALTIME (Phoenix sobre WebSocket, sin dependencias) ──────────────
     conectar(tablas, cb): abre el canal y suscribe postgres_changes de esas
     tablas (respeta RLS vía access_token). cb recibe {tabla, tipo, nueva,
     vieja} — o {tipo:'error'} si la suscripción falla (p. ej. tabla fuera de
     la publicación → aplicar migración 0005). Heartbeat 25s + reconexión con
     backoff; al reconectar se relee el token (cubre expiraciones). */
  var _rt = { ws: null, ref: 0, hb: null, tablas: [], cb: null, estado: 'off', reintentos: 0, manual: false };
  function _rtEnviar(o) { try { if (_rt.ws && _rt.ws.readyState === 1) _rt.ws.send(JSON.stringify(o)); } catch (e) {} }
  async function _rtAbrir() {
    var tk = await _token();
    if (!tk) { _rt.estado = 'sin-sesion'; return false; }
    var url = CFG.url.replace(/^http/, 'ws') + '/realtime/v1/websocket?apikey=' + CFG.publishableKey + '&vsn=1.0.0';
    var ws = new WebSocket(url);
    _rt.ws = ws; _rt.estado = 'conectando';
    ws.onopen = function () {
      _rt.estado = 'conectado'; _rt.reintentos = 0;
      _rtEnviar({ topic: 'realtime:ola0', event: 'phx_join', ref: String(++_rt.ref),
        payload: { access_token: tk, config: { broadcast: { self: false }, presence: { key: '' },
          postgres_changes: _rt.tablas.map(function (t) { return { event: '*', schema: 'public', table: t }; }) } } });
      clearInterval(_rt.hb);
      _rt.hb = setInterval(function () {
        _rtEnviar({ topic: 'phoenix', event: 'heartbeat', payload: {}, ref: String(++_rt.ref) });
      }, 25000);
    };
    ws.onmessage = function (ev) {
      var m; try { m = JSON.parse(ev.data); } catch (e) { return; }
      if (m.event === 'postgres_changes' && m.payload && m.payload.data) {
        var d = m.payload.data;
        if (_rt.cb) _rt.cb({ tabla: d.table, tipo: d.eventType || d.type,
          nueva: d.new || d.record || null, vieja: d.old || d.old_record || null });
      } else if (m.event === 'phx_reply' && m.payload && m.payload.status === 'error') {
        _rt.estado = 'error';
        if (_rt.cb) _rt.cb({ tabla: null, tipo: 'error', error: JSON.stringify(m.payload.response || {}) });
      } else if (m.event === 'system' && m.payload && m.payload.status === 'error') {
        if (_rt.cb) _rt.cb({ tabla: null, tipo: 'error', error: String(m.payload.message || 'error de sistema realtime') });
      }
    };
    ws.onclose = function () {
      clearInterval(_rt.hb);
      if (_rt.manual) { _rt.estado = 'off'; return; }
      _rt.estado = 'reconectando';
      setTimeout(_rtAbrir, Math.min(30000, 1000 * Math.pow(2, ++_rt.reintentos)));
    };
    ws.onerror = function () {};
    return true;
  }

  /* ── API pública ─────────────────────────────────────────────────────── */
  window.AJ = window.AJ || {};
  window.AJ.remote = {
    version: '0.4.0',
    configurado: function () { return !!CFG; },

    /* auth */
    login: async function (email, password) {
      var r = await fetch(CFG.url + '/auth/v1/token?grant_type=password', {
        method: 'POST',
        headers: { apikey: CFG.publishableKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email, password: password })
      });
      var data = await r.json();
      if (!r.ok) return { sesion: null, error: (data && (data.msg || data.error_description)) || 'Credenciales no válidas' };
      _guardarSesion(data);
      return { sesion: data, error: null };
    },
    logout: async function () {
      var tk = await _token();
      if (tk) {
        try {
          await fetch(CFG.url + '/auth/v1/logout', {
            method: 'POST', headers: { apikey: CFG.publishableKey, Authorization: 'Bearer ' + tk }
          });
        } catch (e) {}
      }
      _guardarSesion(null);
    },
    sesion: _leerSesion,
    usuarioActual: async function () {
      var tk = await _token();
      if (!tk) return null;
      var filas = await _rest('GET', 'usuarios?select=*&id=eq.' + _leerSesion().user.id);
      return (filas && filas[0]) || null;
    },

    /* repositorio genérico (las Capas construirán encima) */
    listar: function (tabla, query) {           // query estilo PostgREST: 'select=*&estado=eq.activo'
      return _rest('GET', tabla + '?' + (query || 'select=*'));
    },
    insertar: function (tabla, fila) {
      return _rest('POST', tabla, fila);
    },
    upsert: function (tabla, fila, clave) {
      return _rest('POST', tabla + '?on_conflict=' + (clave || 'id'), fila,
        { Prefer: 'resolution=merge-duplicates,return=representation' });
    },
    actualizar: function (tabla, filtro, cambios) {  // filtro: 'id=eq.<uuid>'
      return _rest('PATCH', tabla + '?' + filtro, cambios);
    },
    softDelete: function (tabla, filtro) {
      return _rest('PATCH', tabla + '?' + filtro, { deleted_at: new Date().toISOString() });
    },
    eliminar: function (tabla, filtro) {             // hard delete (tablas hijas de sync)
      return _rest('DELETE', tabla + '?' + filtro);
    },
    rpc: function (fn, args) {                       // funciones Postgres (ej. asignar_codigo)
      return _rest('POST', 'rpc/' + fn, args || {});
    },

    /* cola optimista: escribir sin bloquear la UI */
    encolar: function (metodo, ruta, body) {
      return new Promise(function (resolve, reject) {
        _cola.push({ metodo: metodo, ruta: ruta, body: body, resolve: resolve, reject: reject,
                     intentos: 0, ts: Date.now() });
        _colaGuardar();
        _procesarCola();
      });
    },
    pendientes: function () { return _cola.length; },
    /* qué hay pendiente de subir (para el indicador honesto de la app móvil) */
    pendientesDetalle: function () {
      return _cola.map(function (op) {
        return { metodo: op.metodo, tabla: String(op.ruta || '').split('?')[0],
                 intentos: op.intentos || 0, desde: op.ts || null };
      });
    },
    /* fuerza un intento (botón "reintentar" cuando vuelve la cobertura) */
    reintentar: function () { return _procesarCola(); },
    /* descarta la cola persistida (solo para diagnóstico/soporte) */
    vaciarCola: function () {
      _cola = [];
      try { localStorage.removeItem(_COLA_KEY); } catch (e) {}
      _emitir('guardado');
    },

    /* realtime */
    realtime: {
      conectar: function (tablas, cb) { _rt.tablas = tablas; _rt.cb = cb; _rt.manual = false; return _rtAbrir(); },
      desconectar: function () { _rt.manual = true; try { if (_rt.ws) _rt.ws.close(); } catch (e) {} clearInterval(_rt.hb); _rt.estado = 'off'; },
      estado: function () { return _rt.estado; }
    },

    /* storage */
    storageBucket: async function (id) {
      var tk = await _token();
      if (!tk) return { ok: false, error: 'sin sesión' };
      var r = await fetch(CFG.url + '/storage/v1/bucket/' + id, {
        headers: { apikey: CFG.publishableKey, Authorization: 'Bearer ' + tk } });
      var d = null; try { d = await r.json(); } catch (e) {}
      return r.ok ? { ok: true, bucket: d } : { ok: false, error: (d && d.message) || ('HTTP ' + r.status) };
    },
    /* sube un File/Blob a un bucket privado; devuelve {ok, path} */
    subirArchivo: async function (bucket, path, archivo) {
      var tk = await _token();
      if (!tk) return { ok: false, error: 'sin sesión' };
      var r = await fetch(CFG.url + '/storage/v1/object/' + bucket + '/' + path, {
        method: 'POST',
        headers: { apikey: CFG.publishableKey, Authorization: 'Bearer ' + tk,
                   'Content-Type': (archivo && archivo.type) || 'application/octet-stream',
                   'x-upsert': 'true' },
        body: archivo });
      var d = null; try { d = await r.json(); } catch (e) {}
      return r.ok ? { ok: true, path: path } : { ok: false, error: (d && d.message) || ('HTTP ' + r.status) };
    },
    /* URL firmada temporal para mostrar un objeto de bucket privado */
    firmarUrl: async function (bucket, path, segundos) {
      var tk = await _token();
      if (!tk) return null;
      var r = await fetch(CFG.url + '/storage/v1/object/sign/' + bucket + '/' + path, {
        method: 'POST',
        headers: { apikey: CFG.publishableKey, Authorization: 'Bearer ' + tk, 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresIn: segundos || 3600 }) });
      if (!r.ok) return null;
      var d = await r.json();
      return d && d.signedURL ? CFG.url + '/storage/v1' + d.signedURL : null;
    },

    /* rehidrata la cola persistida y la reintenta (lo llama el propio módulo
       al cargar; expuesto por si una vista quiere forzarlo tras el login) */
    recuperarCola: function () {
      var n = _colaRehidratar();
      if (n) _procesarCola();
      return n;
    },

    /* diagnóstico */
    ping: async function () {
      var r = await fetch(CFG.url + '/auth/v1/health', { headers: { apikey: CFG.publishableKey } });
      return r.ok;
    }
  };

  /* al cargar: si quedó trabajo sin subir (cierre de pestaña dentro de un piso
     sin cobertura), se recupera y se reintenta en cuanto haya red */
  try {
    var _pend = _colaRehidratar();
    if (_pend) setTimeout(_procesarCola, 1200);
  } catch (e) {}
})();
