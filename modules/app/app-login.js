/* ═══════════════════════════════════════════════════════════════════════════
   App AJ Finances · Login — la puerta que faltaba

   No estaba en la serie de mocks: las ocho pantallas asumían sesión, porque en
   el Mac se entraba por la consola. En el móvil no hay consola, así que sin
   esto la app instalada es un cascarón sin datos. Es infraestructura, no una
   sección de diseño; se construye mínima y on-brand (V14, Plex, azul de marca).

   Email + contraseña contra Supabase (`AJ.remote.login`). Al entrar, baja los
   datos con `AJ.sync.restaurar()` —que es lo que hace el CRM al arrancar— y
   recarga: así el arranque normal vuelve a correr ya con sesión y con datos.
   ═══════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';
  var D = window.AJapp.datos, C = {};
  var cargando = false, error = null, fase = '';

  function cerrar() { var e = document.getElementById('hoja-login'); if (e) e.remove(); }

  C.abrir = function () { cargando = false; error = null; pintar(); };

  function pintar() {
    cerrar();
    var cap = document.createElement('div');
    cap.id = 'hoja-login';
    cap.style.cssText = 'position:fixed;inset:0;z-index:300;background:var(--canvas);' +
      'display:flex;flex-direction:column;overflow-y:auto;' +
      'padding:calc(env(safe-area-inset-top,0px) + 8vh) 22px calc(env(safe-area-inset-bottom,0px) + 24px)';
    cap.innerHTML =
      '<div style="width:100%;max-width:360px;margin:0 auto;display:flex;flex-direction:column">' +
        // el logo real, el propio icono de la app
        '<img src="icono-192.png" alt="AJ Finances" width="66" height="66" ' +
          'style="border-radius:15px;align-self:flex-start;box-shadow:0 4px 14px rgba(25,37,113,.22)">' +
        '<div class="serif" style="font-size:30px;font-weight:400;line-height:1.1;margin-top:20px">Entra a AJ Finances</div>' +
        '<div style="font-size:13.5px;line-height:1.6;color:var(--suave);margin-top:8px">' +
          'Con tu cuenta del CRM. Al entrar se descarga tu cartera y tu agenda para llevarlas ' +
          'en el móvil.</div>' +

        '<div style="margin-top:26px">' +
          '<div class="eyebrow" style="margin-bottom:7px">Correo</div>' +
          '<input id="log-email" type="email" inputmode="email" autocomplete="username" ' +
            'autocapitalize="off" autocorrect="off" placeholder="tu@ajgrup.cat" ' +
            'style="width:100%;height:54px;padding:0 14px;border:1px solid var(--borde);border-radius:9px;' +
            'font-size:16px;font-family:inherit;color:var(--tinta);background:var(--sup);outline:none">' +
        '</div>' +
        '<div style="margin-top:14px">' +
          '<div class="eyebrow" style="margin-bottom:7px">Contraseña</div>' +
          '<input id="log-pass" type="password" autocomplete="current-password" placeholder="••••••••" ' +
            'style="width:100%;height:54px;padding:0 14px;border:1px solid var(--borde);border-radius:9px;' +
            'font-size:16px;font-family:inherit;color:var(--tinta);background:var(--sup);outline:none">' +
        '</div>' +

        (error
          ? '<div style="display:flex;align-items:flex-start;gap:8px;margin-top:14px;font-size:13px;' +
            'line-height:1.5;color:var(--error)"><span style="flex-shrink:0;margin-top:1px">' +
            '<svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" ' +
            'stroke-width="1.4" stroke-linecap="round"><path d="M8 2.6 14 13H2z"/><path d="M8 6.6v3M8 11.2v.1"/>' +
            '</svg></span>' + esc(error) + '</div>'
          : '') +

        '<button id="log-entrar" class="b-primario" style="width:100%;height:54px;margin-top:22px"' +
          (cargando ? ' disabled style="width:100%;height:54px;margin-top:22px;opacity:.6;cursor:default"' : '') + '>' +
          (cargando ? esc(fase || 'Entrando…') : 'Entrar') + '</button>' +

        '<div style="font-size:11.5px;line-height:1.6;color:var(--tenue);margin-top:16px;text-align:center">' +
          'Entorno de PRUEBAS. Si no tienes cuenta, te la da Jonatan.</div>' +
      '</div>';
    document.body.appendChild(cap);

    var email = document.getElementById('log-email');
    var pass = document.getElementById('log-pass');
    var btn = document.getElementById('log-entrar');
    // rellenar el correo que se probó por última vez, para no teclearlo cada vez
    try { email.value = localStorage.getItem('aj_app_ultimo_correo') || ''; } catch (e) {}
    if (email.value) setTimeout(function () { try { pass.focus(); } catch (e) {} }, 60);
    else setTimeout(function () { try { email.focus(); } catch (e) {} }, 60);

    pass.addEventListener('keydown', function (e) { if (e.key === 'Enter') entrar(); });
    btn.addEventListener('click', entrar);

    function entrar() {
      if (cargando) return;
      var c = (email.value || '').trim(), p = pass.value || '';
      if (!c || !p) { error = 'Faltan el correo o la contraseña.'; return pintar(); }
      if (navigator.onLine === false) { error = 'Sin conexión: entrar necesita red.'; return pintar(); }
      cargando = true; error = null; fase = 'Entrando…'; pintar();
      try { localStorage.setItem('aj_app_ultimo_correo', c); } catch (e) {}

      AJ.remote.login(c, p).then(function (r) {
        if (!r || r.error) {
          cargando = false;
          error = (r && r.error) || 'No se ha podido entrar.';
          return pintar();
        }
        /* sesión creada: bajar los datos antes de recargar, para que el primer
           pintado ya tenga cartera y no el estado vacío. Si la bajada falla, se
           entra igual —la sesión vale— y los datos llegan en el siguiente
           arranque; no se deja al usuario fuera por un fallo de red parcial. */
        fase = 'Descargando tu cartera…'; pintar2();
        var bajar = D.restaurar();
        return bajar.catch(function (e) {
          console.warn('[app] la bajada tras login no completó:', e.message);
          return null;
        }).then(function () { location.reload(); });
      }).catch(function (e) {
        cargando = false; error = e.message || 'Error al entrar.'; pintar();
      });
    }
    /* repinta solo el botón mientras carga, sin destruir los inputs */
    function pintar2() {
      var b = document.getElementById('log-entrar');
      if (b) { b.disabled = true; b.textContent = fase; b.style.opacity = '.6'; }
    }
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m];
    });
  }

  window.AJapp.login = C;
})();
