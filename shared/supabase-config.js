/* ═══════════════════════════════════════════════════════════════════════════
   AJ GRUP CRM · configuración de Supabase

   La publishable key es pública POR DISEÑO (va en el navegador; RLS protege los
   datos en servidor). La SECRET/service_role JAMÁS entra en este repo ni en el
   cliente — vive en el gestor de contraseñas y, en su día, en n8n.

   DOS ENTORNOS desde el 30-ago-2026:

     produccion  · AJ Grup CRM   · plan Pro  · datos reales de clientes
     laboratorio · LABORATORIO   · plan free · vacío, para probar y para
                                   ensayar restauraciones

   El entorno se elige con `AJ.entorno.usar('laboratorio')` y se recuerda en
   este navegador. Dos reglas que sostienen que esto sea seguro:

   1 · POR DEFECTO SIEMPRE PRODUCCIÓN. Un despiste no puede acabar escribiendo
       en el sitio equivocado por omisión; tiene que ser una decisión.
   2 · SI NO ES PRODUCCIÓN, SE VE. Una franja arriba, en todas las páginas que
       cargan este fichero. La avería que se paga cara no es apuntar al
       laboratorio: es apuntar al laboratorio y no saberlo —trabajar media hora
       y descubrir que nada de eso está donde creías—. Es la misma lección del
       `file://` y de la sesión ausente: un estado que cuesta trabajo no se
       pinta como si fuera neutro.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (root) {
  'use strict';

  var ENTORNOS = {
    produccion: {
      nombre: 'AJ Grup CRM',
      url: 'https://ogmrvssapifxzndzsczb.supabase.co',
      publishableKey: 'sb_publishable_dSsGL-o6X_mJG-PhnSMKZA_5Kz9-ejL'
    },
    laboratorio: {
      nombre: 'LABORATORIO',
      url: 'https://jscxilowybtuitwljsjj.supabase.co',
      publishableKey: 'sb_publishable_L4w3sOQeTnWMenRy-4IiqQ_d-iGtVu2'
    }
  };

  var CLAVE = 'aj_entorno';
  function elegido() {
    var e = null;
    try { e = root.localStorage && root.localStorage.getItem(CLAVE); } catch (x) {}
    return (e && ENTORNOS[e]) ? e : 'produccion';
  }

  var actual = elegido();
  root.AJ_SUPABASE = {
    entorno: actual,
    nombre: ENTORNOS[actual].nombre,
    url: ENTORNOS[actual].url,
    publishableKey: ENTORNOS[actual].publishableKey
  };

  root.AJ = root.AJ || {};
  root.AJ.entorno = {
    actual: function () { return actual; },
    lista: function () { return Object.keys(ENTORNOS); },
    usar: function (e) {
      if (!ENTORNOS[e]) throw new Error('[AJ.entorno] no existe: ' + e);
      if (!ENTORNOS[e].publishableKey)
        throw new Error('[AJ.entorno] «' + e + '» no tiene publishable key: se quedaría apuntando a una URL sin llave');
      try { root.localStorage.setItem(CLAVE, e); } catch (x) {}
      root.location.reload();
    },
    /* Volver a producción no puede depender de acordarse del nombre. */
    salir: function () {
      try { root.localStorage.removeItem(CLAVE); } catch (x) {}
      root.location.reload();
    }
  };

  /* La franja. Solo cuando NO es producción, y por encima de todo. */
  if (actual !== 'produccion') {
    var pintar = function () {
      if (!root.document || !root.document.body) return;
      if (root.document.getElementById('aj-franja-entorno')) return;
      var b = root.document.createElement('button');
      b.id = 'aj-franja-entorno';
      b.textContent = 'ENTORNO: ' + ENTORNOS[actual].nombre + ' · esto NO son los datos de verdad · pulsa para volver a producción';
      b.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:2147483647;border:none;width:100%;' +
        'background:#b8862b;color:#fff;font:600 12.5px/1.4 "IBM Plex Sans",system-ui,sans-serif;' +
        'letter-spacing:.02em;padding:calc(env(safe-area-inset-top,0px) + 7px) 14px 7px;cursor:pointer;';
      b.onclick = function () { root.AJ.entorno.salir(); };
      root.document.body.appendChild(b);
    };
    if (root.document && root.document.readyState !== 'loading') pintar();
    else if (root.document) root.document.addEventListener('DOMContentLoaded', pintar);
  }
})(typeof window !== 'undefined' ? window : this);
