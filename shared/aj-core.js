/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  AJ Grup CRM — aj-core.js
 *  Runtime compartido para módulos HTML del CRM AJ Grup.
 *
 *  Versión del runtime:  2.24.0
 *  Fecha de creación:    22 abril 2026
 *  Última actualización: 23 julio 2026 (Tanda 1 Ficha 360 — Capa 11 `AJ.personas` ampliación aditiva v2.24.0: 8 campos schema nuevos canon mockups Design "Editar Cliente" traslado 1:1 — fechaNacimiento + fechaConstitucion + idioma ('es' default | ca/en/fr) + cif + representante (jurídica) + agenteCaptacionId (dueño de la relación ≠ agente de la operación) + residencia (asociación dirección↔propiedad territorial {refCatastral, direccionCanonica, vinculo inquilino|propietario|otro, desde}) + rgpd ({origenDato, consentimientoComunicaciones, fechaConsentimiento}). `personasActualizar` ya era permisivo (Object.assign, 4 campos prohibidos) → cero cambio. Capas 1-10+12-19 INVARIANTES byte por byte. PRIOR Sub-frente 19.2.A v5.144 código runtime — Capa 11 `AJ.personas` ampliación aditiva canon D-F19-03 vinculante: (a) opción `permitirSoloNombre` en `personasCrear` opciones param para importador laxo (skip validación R-N3 estricta dni/tel/email obligatorio cuando solo nombre disponible — caso CSV histórico Inmo), (b) flag aditivo `requiere_verificacion_datos: boolean` schema canon §16.2 ampliación schema rich Capa 11 v2.16.0 → v2.23.0 para auditoría posterior personas creadas via importador laxo. ROTURA INTENCIONAL md5 R-X canon §21.6 evolutivo bump v2.22.0 → v2.23.0 vinculante Sub-frente 19 NUEVO Importador batch CSV propiedades históricas Inmo canon §30 v5.143. Capas 9+10+12-19 INVARIANTES byte por byte preservadas. PRIOR Sub-frente 18 v5.142 código runtime — Capa 1 `AJ.theme` paleta Finances champagne canónica v5.58+ Helmholtz-Kohlrausch vinculante migración 4 valores desde dorado legacy descartado. PRIOR Sub-frente 16.2 v5.124 código runtime — Capa 19 NUEVA `ajSession` Frente 16 NUEVO Módulo Login Unificado + Ajustes/Permisos canon §28 v5.123. Storage canónico ÚNICO `aj_session_v3` schema enriquecido + `aj_session_users_v3` users CRUD admin-only. 12 funciones públicas (login + logout + obtenerSesion + tienePermiso + tieneRol + esAdmin + cambiarPassword + crearUsuario + actualizarUsuario + eliminarUsuario + listarUsuarios + migrarSesionesLegacy) + 7 constantes frozen (ROLES + MODULOS + ACCIONES + STORAGE_KEY + USERS_KEY + LEGACY_KEYS + MIGRATION_FLAG) + 5 helpers privados storage + 4 helpers privados crypto/validación (SHA-256 puro JS cross-platform sync Fase 1 migrable PBKDF2 Web Crypto API Fase 2 backend canon D-F16-02). Bridges canónicos LEGACY→NEW desde DISEÑO canon Sub-disciplina T11 v5.124+ CANONIZADA FORMAL VINCULANTE v5.123+ EJECUTABLE 4ª manif acumulada — `migrarSesionesLegacy()` idempotente flag `aj_migracion_frente16_completada` migra 3 storage keys legacy (`aj_comercial_activo` + `aj_inmo_session` + `aj_suite_session_v2`) → `aj_session_v3`. Pre-requisito Sub-frentes 16.3 v5.125 UI login canónico Finances Suite + 16.4 v5.126 UI login canónico Inmo Suite + 16.5 v5.127 UI deprecación logins dispersos módulos seguimiento + 16.6 v5.128 UI Módulo Ajustes/Permisos + 16.7 v5.129 UI cleanup consumers cross-archivos.)
 *
 *  Major bump v1.x → v2.0.0 justificado: Frente 5 introduce ruptura del
 *  modelo de datos canonizado. Las claves legacy aj_clientes (con
 *  operaciones embebidas) y aj_ops (proyección flat) quedan deprecadas
 *  y son sustituidas por aj_personas + aj_operaciones + aj_seguimientos.
 *  La API JS pública de las Capas 1-5 preserva retrocompatibilidad: las
 *  llamadas existentes a AJ.theme/store/format/id/rappel siguen
 *  funcionando idénticamente. La ruptura es exclusiva del modelo de datos.
 *  Ver CLAUDE.md §16 (Frente 5) para detalle.
 *
 *  Capas incluidas en esta versión:
 *    1. Theme  — inyección de paletas CSS (3 capas) + tipografía Plex.
 *    2. Store  — lectura/escritura segura de localStorage con namespace.
 *    3. Format — formateo para UI española (moneda, fecha, %, DNI, tel).
 *    4. Id     — generación de identificadores. Códigos humanos
 *                AJ-F-NNN (operaciones Finances), AJ-I-NNN (personas Inmo
 *                legacy), AJ-P-NNN (personas Frente 5), AJ-S-NNN
 *                (seguimientos Frente 5). Reglas Duda J cerrada.
 *    5. Rappel — cálculo de comisiones por FEIN según CLAUDE.md §5.3.
 *                Función pura, no toca localStorage.
 *   11. Personas      — gestión de aj_personas (CLAUDE.md §16.2).
 *                       CRUD + roles acumulables + dedup canónico R-N3 +
 *                       fusión + migración legacy. [NUEVO v2.0.0]
 *                       v2.1.0: 8º rol `supervisor` añadido (CLAUDE.md
 *                       §16.8.1) + sembrarAgentesYColaboradores() y
 *                       reconciliarAgenteIds() para siembra de personas
 *                       operativas (CLAUDE.md §16.8.4 y §16.8.6).
 *                       [AMPLIADA v2.1.0]
 *                       v2.2.0: personasCrear refactorizada con campos `type`
 *                       (enum), `empresa`, `agenteId`, `perfilBusqueda`
 *                       (CLAUDE.md §16.2 v5.9). migrarFrente5Inmo() para
 *                       migrar aj_inmo_compradores y aj_inmo_captaciones.
 *                       Set canónico FUENTES expuesto (CLAUDE.md §16.4 v5.8).
 *                       [AMPLIADA v2.2.0]
 *                       v2.3.0: Capa 11 ampliada con campo `embudos[]`
 *                       (CLAUDE.md §16.11 v5.11.1) + 5 métodos API canónicos
 *                       (agregarEmbudo, quitarEmbudo, enEmbudo, listarEmbudos,
 *                       buscarEnEmbudo) + constante congelada
 *                       _EMBUDOS_CANONICOS con 5 valores. Distinción nominal
 *                       explícita del método AJ.personas.enEmbudo() vs
 *                       atributo legacy o.enEmbudo de operaciones.
 *                       [AMPLIADA v2.3.0]
 *                       v2.4.0: Capa 11 ampliada con función
 *                       `migrarFrente55Embudos()` que migra personas
 *                       existentes derivando entradas activas en `embudos[]`
 *                       desde `roles[]` (los 5 roles-embudo canonizados)
 *                       según CLAUDE.md §16.11.5 v5.11.1. Invocación en
 *                       `initApp()`/`initDefaultData()` de los 3 HTMLs
 *                       productivos (Finances seguimiento, Colaboradores,
 *                       Inmo seguimiento). Idempotencia per-persona (si
 *                       `embudos[]` no vacío, NO migrar). Divergencia con
 *                       patrón canónico global de `migrarFrente5`/
 *                       `migrarFrente5Inmo` justificada por semántica
 *                       distinta: derivación continua, NO one-shot
 *                       histórica. [AMPLIADA v2.4.0]
 *   12. Seguimientos  — gestión de aj_seguimientos polimórficos
 *                       (CLAUDE.md §16.6). CRUD + filtrado polimórfico +
 *                       reconciliación de personaId denormalizado.
 *                       [NUEVO v2.0.0]
 *   13. Captación      — gestión de aj_captacion canonizada
 *                       en CLAUDE.md §17 (Frente 6) y §12.4
 *                       v5.17 (Capa 13 nueva [NUEVO v2.5.0]).
 *                       Fundamentos: CRUD básico (crear,
 *                       obtener, listar, actualizar,
 *                       softDelete) + constantes canónicas
 *                       expuestas (ESTADOS_EMBUDO con 5
 *                       valores + ESTADOS_LATERALES con 3
 *                       valores + TIPOS_LEAD con 4 valores
 *                       + MOTIVOS_DESCARTE con 9 valores +
 *                       ORIGENES con 5 valores) + esqueleto
 *                       idempotente migrarFrente6(). Capa 4
 *                       ajId ampliada con prefijo AJ-CL- y
 *                       clave aj_ultimo_codigo_captacion en
 *                       _CLAVES_CONTADOR + _PREFIJOS_CODIGO.
 *                       Máquina de estados con transiciones
 *                       validadas, deduplicación canónica,
 *                       enlace de relacionados,
 *                       desdoblamiento R-F6-1 (compraventa),
 *                       promoción R-F6-2/3/4/5 con
 *                       doble-write C-M033-1 y métricas
 *                       canonizadas para Sesiones código 2
 *                       y 3 posteriores. [NUEVO v2.5.0]
 *                       v2.6.0: Capa 13 ampliada con máquina
 *                       de estados canónica (cambiarEstado +
 *                       validarTransicion según §17.6),
 *                       deduplicación por teléfono normalizado
 *                       (detectarDuplicados con reutilización
 *                       de _normalizarTelefono del closure
 *                       IIFE Capa 11 — R-F6-2 + D-F6-08),
 *                       enlace de relacionados bidireccional
 *                       + idempotente (enlazarComoRelacionado),
 *                       lazy check de vencimiento de pausa en
 *                       cambiarEstado y captacionListar
 *                       (transición 'en_pausa' → 'nuevo' al
 *                       vencer fecha_pausa_hasta).
 *                       [AMPLIADA v2.6.0]
 *                       v2.7.0: Capa 13 ampliada con
 *                       desdoblamiento R-F6-1 (captacionDesdoblar
 *                       compraventa → 2 entradas vinculadas
 *                       vendedor_inmo + comprador_finanzas),
 *                       promoción R-F6-2/3/4/5 (captacionPromover
 *                       dedup persona por teléfono + alta o
 *                       reutilización en aj_personas +
 *                       agregarEmbudo fase 'estudio' tagOrigen),
 *                       resolución on-demand post-promoción
 *                       (captacionResolverEstadoSeguimiento
 *                       D-F6-09), 3 métricas Panel Supervisor
 *                       (captacionMetricasCampania +
 *                       captacionTasaConversion +
 *                       captacionMotivosDescartePorCampania).
 *                       Doble-write C-M033-1 deferido:
 *                       promovido_a_operacion_id null hasta
 *                       aj_operaciones operativa (Fase 2 backend
 *                       o sub-frente futuro). [AMPLIADA v2.7.0]
 *                       v2.8.0: Capa 14 nueva AJ.pedidos.*
 *                       (Frente 8 §20). Sub-frente 8.3 implementa
 *                       entidad aj_pedidos con 8 funciones públicas
 *                       (CRUD + crearOAsociar orquestador D-F8-05 +
 *                       cambiarEstado máquina acotada sin lazy
 *                       vencimiento + listarPorPersona alias) +
 *                       4 constantes canónicas frozen + 6 helpers
 *                       privados + 1 tabla transiciones canónica.
 *                       Reutiliza Capa 11 personasBuscarPorDedup +
 *                       personasCrear + personasAgregarRol vía
 *                       closure IIFE (R-N1 + R-N2 + R-N3 sin
 *                       duplicar código). Capa 4 ampliada con
 *                       prefijo AJ-PD-NNN + clave contador
 *                       aj_ultimo_codigo_pedidos. 5 campos schema
 *                       NUEVOS paquete F8+F9 v2 Sesión 61:
 *                       presupuesto_flexible_max, orientacion,
 *                       planta_min, mascotas_permitidas, urgencia.
 *                       tipo_inmueble cambio a string[] multi-select.
 *                       D-F8-01 a D-F8-06 vinculantes. C-M033-1
 *                       v5.16 preservada (NO crear aj_operaciones,
 *                       NO embebido en aj_personas). Aprendizaje
 *                       T12 candidato 3ª manifestación formal
 *                       "Patrón Hoja → Entidad CRM con dedup".
 *                       [AMPLIADA v2.8.0]
 *   15. Operaciones Inmo — gestión aj_inmo_operaciones bilateral
 *                       persona+propiedad (CLAUDE.md §15.8 v5.31).
 *                       Acoplamiento canónico D-13: personaId +
 *                       propiedadId AMBOS OBLIGATORIOS. 3 tipos
 *                       canónicos: venta (6 fases) + compra (5 fases
 *                       — paga_y_senal sustituye promesa_de_compra
 *                       eliminada coherente §4.7 v5.13 Finances) +
 *                       alquiler (post-MVP esqueleto). 11 funciones
 *                       públicas (CRUD + máquina estados + búsquedas
 *                       + orquestadores helpers crearVenta/Compra/
 *                       Alquiler) + 5 constantes frozen (TIPOS +
 *                       ESTADOS_VENTA + ESTADOS_COMPRA +
 *                       ESTADOS_ALQUILER + SALIDAS_LATERALES) +
 *                       tabla _OPSINMO_TRANSICIONES Object.freeze
 *                       mapping tipo → estado → siguientes. 7
 *                       helpers privados prefijo _opsInmo (3ª
 *                       manifestación CONFIRMATORIA patrón canónico
 *                       T11 candidato v5.27 helpers IIFE prefijo
 *                       capa). Validaciones: R-N1 análogo personaId
 *                       existe (Capa 11) + propiedadId existe (Capa
 *                       9) + R3 análogo NO duplicado activo
 *                       persona+propiedad+tipo + tipo INMUTABLE
 *                       post-creación + estado válido para tipo.
 *                       Capa 4 ajId ampliada con 9ª clave
 *                       inmoOperaciones + 9º prefijo AJ-IO-.
 *                       Coexistencia bilateral cross-suite C-M033-1
 *                       v5.16 preservada: NO crea aj_operaciones
 *                       Finances ni modifica cliente.operaciones[]
 *                       legacy Finances — modelos separados
 *                       bilateral cada suite con su entidad
 *                       operación. Sub-frente 4.5 código Sesión 2
 *                       [NUEVO v2.13.0].
 *
 *  Capas pendientes de sesiones futuras (CLAUDE.md §12.4):
 *    6. Sociedades     — perfiles económicos AJ Finances / AJ Inmobiliaria.
 *    7. Nav            — navegación entre suites y Portal Maestro.
 *    8. i18n           — internacionalización (es/ca/en/fr).
 *    9. Propiedades    — gestión aj_inmo_propiedades (Sub-frente 4.2).
 *   10. Titularidades  — gestión aj_inmo_titularidades (Sub-frente 4.2).
 *
 *  Numeración aditiva sin renumeración (CLAUDE.md v5.5 [Q11]): cuando
 *  6, 7, 8, 9, 10 se construyan ocuparán sus huecos previstos. 11 y 12
 *  ya están implementadas y no se renumeran. 13 nueva [NUEVO v2.5.0] = Captación (CLAUDE.md §12.4 v5.17 + §17 Frente 6). [AMPLIADA v2.5.0]
 *
 *  Fuentes de verdad del sistema visual:
 *    - CLAUDE.md v5.9 §2 (consolidación de principios y reglas).
 *    - CLAUDE.md v5.9 §16 (Frente 5: modelo unificado de personas).
 *    - docs/aj-grup-spec-migracion-visual.md (detalle técnico exhaustivo).
 *
 *  Carga esperada en navegador:
 *    <script src="../shared/aj-core.js"></script>
 *    AJ.theme.inject('finances');   // o 'inmo' / 'doc'
 *
 *  Carga en Node (tests):
 *    require('./mocks/localStorage');  // inyecta global.localStorage
 *    require('../shared/aj-core.js');  // ejecuta IIFE, side-effect
 *    const AJ = global.AJ;
 *
 *  Expone un único objeto global:
 *    window.AJ = { theme, store, format, id, rappel, personas, seguimientos }.
 *
 *  No hay autocarga: cada HTML invoca inject() de forma explícita con la
 *  capa que le corresponde (con tres capas visuales, la autocarga no
 *  sabe cuál).
 * ═══════════════════════════════════════════════════════════════════════════
 */

(function (global) {
  'use strict';

  // ═══════════════════════════════════════════════════════════════════════
  //  CAPA 1 — ajTheme
  //  Identidad visual del CRM: tres paletas CSS + tipografía Plex.
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Paletas de color por capa visual.
   * Las claves son los nombres exactos de las variables CSS sin el prefijo `--`.
   * Los valores son los colores canónicos según la spec visual §4.
   *
   * NOTA sobre la paleta Finances: el valor de `red` sigue la spec visual
   * `docs/aj-grup-spec-migracion-visual.md §4.1` (`#d95555`). CLAUDE.md v5 §2.2
   * tiene `#d97766` como residuo de v4.1; la regla de precedencia dice que
   * prevalece la spec visual cuando ambos documentos se contradicen.
   */
  const palette = {
    finances: Object.freeze({
      'navy':       '#0d1b3e',
      'navy-mid':   '#132048',
      'navy-light': '#1e2e5a',
      /* ─── Sub-frente 18 v5.142 — paleta champagne canon Capa A v5.58+ Helmholtz-Kohlrausch vinculante v5.122+ (root cause aj-core.js Capa 1 AJ.theme legacy descartado migrado decisión Jonatan 2026-06-01 vinculante "todos los lugares") ─── */
      'gold':       '#c8b89a',
      'gold-light': '#dccfba',
      'gold-pale':  'rgba(200,184,154,.11)',
      'white':      '#f2f1ec',
      'dim':        'rgba(242,241,236,.62)',
      'muted':      'rgba(242,241,236,.32)',
      'border':     'rgba(200,184,154,.18)',
      'green':      '#4aad7e',
      'blue':       '#6ea8d8',
      'amber':      '#e0a84a',
      'teal':       '#3ab5a0',
      'red':        '#d95555'
    }),
    inmo: Object.freeze({
      'cream':         '#f5f2ec',
      'cream-mid':     '#faf8f4',
      'cream-dark':    '#ece8e0',
      'cream-darker':  '#e0dbd1',
      'navy':          '#1a3a5c',
      'navy-mid':      '#1f4570',
      'navy-light':    '#25527f',
      'navy-subtle':   'rgba(26,58,92,0.08)',
      'navy-subtle2':  'rgba(26,58,92,0.04)',
      'stone':         '#9a8f7e',
      'stone-light':   '#bdb3a4',
      'text-main':     '#2c3e50',
      'text-muted':    'rgba(44,62,80,0.55)',
      'text-dim':      'rgba(44,62,80,0.3)',
      'border':        'rgba(26,58,92,0.16)',
      'border-light':  'rgba(26,58,92,0.08)',
      'success':       '#2d6a4f',
      'success-bg':    '#d8f3dc',
      'danger':        '#7f1d1d',
      'danger-bg':     '#fee2e2',
      'teal':          '#2e7d52'
    }),
    // Las claves de `doc` ya llevan el prefijo `doc-` incluido, tal como
    // aparecen en CSS (`--doc-bg`, `--doc-accent`, etc.). Esto permite que
    // `inject` trate las tres paletas de forma uniforme: `--${key}: ${value}`.
    doc: Object.freeze({
      'doc-bg':        '#ffffff',
      'doc-accent':    '#192571',
      'doc-ink':       '#1a1a1a',
      'doc-ink-soft':  '#4a5568',
      'doc-muted':     '#7a8290',
      'doc-hairline':  '#d8dce2',
      'doc-highlight': '#eef1f6'
    })
  };

  /**
   * Familias tipográficas del sistema visual v5.
   * IBM Plex Serif + IBM Plex Sans, cargadas desde Google Fonts.
   * URL y pesos alineados con `docs/aj-grup-spec-migracion-visual.md §3`.
   */
  const fonts = Object.freeze({
    serif: Object.freeze({
      family:        'IBM Plex Serif',
      weights:       [300, 400, 500, 600, 700],
      italicWeights: [300, 400, 500, 600]
    }),
    sans: Object.freeze({
      family:  'IBM Plex Sans',
      weights: [300, 400, 500, 600, 700]
    }),
    googleFontsUrl:
      'https://fonts.googleapis.com/css2' +
      '?family=IBM+Plex+Serif:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600' +
      '&family=IBM+Plex+Sans:wght@300;400;500;600;700' +
      '&display=swap'
  });

  // IDs de los elementos inyectados en <head>. Permiten idempotencia.
  const STYLE_IDS = Object.freeze({
    finances:    'aj-theme-style-finances',
    inmo:        'aj-theme-style-inmo',
    doc:         'aj-theme-style-doc',
    preconnect1: 'aj-theme-preconnect-api',
    preconnect2: 'aj-theme-preconnect-static',
    fonts:       'aj-theme-fonts'
  });

  /**
   * Construye el bloque CSS para una paleta dada.
   * @param {string} selector — selector CSS (`:root` o `.pdoc, .sim-export`).
   * @param {Object} vars — objeto con las variables CSS (clave sin `--`, valor).
   * @returns {string} bloque CSS listo para insertar en un <style>.
   */
  function buildCssBlock(selector, vars) {
    const lines = Object.keys(vars).map(function (k) {
      return '  --' + k + ': ' + vars[k] + ';';
    });
    return selector + ' {\n' + lines.join('\n') + '\n}\n';
  }

  /**
   * Inyecta un <style> en <head> con el bloque CSS dado, si no existe ya.
   * Idempotente: llamarlo varias veces con el mismo id no duplica.
   * @param {string} id — id del elemento <style>.
   * @param {string} css — contenido CSS.
   */
  function injectStyle(id, css) {
    if (document.getElementById(id)) return;
    const el = document.createElement('style');
    el.id = id;
    el.textContent = css;
    document.head.appendChild(el);
  }

  /**
   * Inyecta un <link> en <head>, si no existe ya.
   * Idempotente por id.
   * @param {string} id
   * @param {Object} attrs — atributos del link (rel, href, crossorigin...).
   */
  function injectLink(id, attrs) {
    if (document.getElementById(id)) return;
    const el = document.createElement('link');
    el.id = id;
    Object.keys(attrs).forEach(function (k) {
      if (attrs[k] === true) {
        el.setAttribute(k, '');
      } else if (attrs[k] !== false && attrs[k] != null) {
        el.setAttribute(k, attrs[k]);
      }
    });
    document.head.appendChild(el);
  }

  /**
   * Carga la tipografía Plex (Serif + Sans) desde Google Fonts.
   * Inserta dos <link rel="preconnect"> y el <link> a fonts.googleapis.com.
   * Idempotente: si ya están cargados, no hace nada.
   *
   * @example
   *   AJ.theme.loadFonts();
   */
  function loadFonts() {
    injectLink(STYLE_IDS.preconnect1, {
      rel:  'preconnect',
      href: 'https://fonts.googleapis.com'
    });
    injectLink(STYLE_IDS.preconnect2, {
      rel:         'preconnect',
      href:        'https://fonts.gstatic.com',
      crossorigin: ''
    });
    injectLink(STYLE_IDS.fonts, {
      rel:  'stylesheet',
      href: fonts.googleFontsUrl
    });
  }

  /**
   * Inyecta la paleta CSS de la capa visual indicada y carga la tipografía Plex.
   *
   * Capas válidas:
   *   - 'finances' — Capa A, paleta navy/gold del CRM Finances. Selector `:root`.
   *   - 'inmo'     — Capa B, paleta crema/navy/stone del CRM Inmo. Selector `:root`.
   *   - 'doc'      — Capa C, paleta documental (prefijo `--doc-`). Selector
   *                  `.pdoc, .sim-export` — NUNCA `:root`, según regla §2.3.1
   *                  de CLAUDE.md v5 (aislamiento documental).
   *
   * Idempotente: llamarla varias veces con la misma capa no duplica nada.
   *
   * @param {'finances'|'inmo'|'doc'} layer — capa visual a inyectar.
   * @throws {Error} si no se pasa parámetro o si la capa no existe.
   *
   * @example
   *   AJ.theme.inject('finances');   // CRM Finances (pantalla)
   *   AJ.theme.inject('inmo');       // CRM Inmobiliaria (pantalla)
   *   AJ.theme.inject('doc');        // Zona exportable a PDF
   */
  function inject(layer) {
    if (layer === undefined || layer === null) {
      throw new Error(
        'AJ.theme.inject: parámetro "layer" obligatorio. ' +
        'Valores admitidos: "finances" | "inmo" | "doc".'
      );
    }
    if (!palette[layer]) {
      throw new Error(
        'AJ.theme.inject: capa "' + layer + '" no reconocida. ' +
        'Valores admitidos: "finances" | "inmo" | "doc".'
      );
    }

    // Selector: ':root' para capas interactivas; scope documental para la capa 'doc'.
    // Ver CLAUDE.md v5 §2.3 regla 1 ("aislamiento documental").
    const selector = (layer === 'doc') ? '.pdoc, .sim-export' : ':root';
    const css = buildCssBlock(selector, palette[layer]);

    injectStyle(STYLE_IDS[layer], css);
    loadFonts();
  }

  const theme = {
    palette:   palette,
    fonts:     fonts,
    inject:    inject,
    loadFonts: loadFonts
  };


  // ═══════════════════════════════════════════════════════════════════════
  //  CAPA 2 — ajStore
  //  Acceso seguro a localStorage con namespaces por sociedad.
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Prefijos de namespace para las tres familias de claves del CRM.
   * Ver CLAUDE.md v5 §3.3.
   */
  const namespace = Object.freeze({
    FINANCES: 'aj_',
    INMO:     'aj_inmo_',
    GRUP:     'ajgrup_'
  });

  /**
   * Lee una clave de localStorage y la devuelve parseada como JSON.
   * Nunca lanza excepción: si la clave no existe o su contenido no es JSON
   * válido, devuelve null.
   *
   * @param {string} key — nombre de la clave.
   * @returns {*} el valor parseado, o null si no existe o está corrupto.
   *
   * @example
   *   const cliente = AJ.store.get('aj_clientes');
   *   // → objeto/array parseado, o null
   */
  function storeGet(key) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  /**
   * Serializa un valor a JSON y lo guarda en localStorage bajo la clave dada.
   * Acepta null (lo guarda como "null"); rechaza undefined (lanza excepción).
   *
   * @param {string} key — nombre de la clave.
   * @param {*} value — valor a guardar. Cualquier valor serializable por JSON.
   * @throws {Error} si value es literalmente undefined.
   *
   * @example
   *   AJ.store.set('aj_clientes', [{ id: 1, nombre: 'Juan' }]);
   */
  function storeSet(key, value) {
    if (value === undefined) {
      throw new Error(
        'AJ.store.set: valor "undefined" no permitido para la clave "' + key + '". ' +
        'Usa null si quieres persistir ausencia.'
      );
    }
    localStorage.setItem(key, JSON.stringify(value));
  }

  /**
   * Elimina una clave de localStorage.
   * @param {string} key — nombre de la clave.
   *
   * @example
   *   AJ.store.remove('aj_hoja_draft');
   */
  function storeRemove(key) {
    localStorage.removeItem(key);
  }

  /**
   * Lista todas las claves de localStorage que empiezan por el prefijo dado.
   * Útil para depuración y migraciones futuras.
   *
   * NOTA: si se llama sin prefijo (o con cadena vacía), devuelve TODAS las
   * claves del localStorage. Se asume uso consciente para depuración.
   *
   * @param {string} [prefix=''] — prefijo a filtrar.
   * @returns {string[]} array de claves (puede estar vacío).
   *
   * @example
   *   AJ.store.list('aj_inmo_');
   *   // → ['aj_inmo_compradores', 'aj_inmo_captaciones', ...]
   */
  function storeList(prefix) {
    const p = (prefix == null) ? '' : String(prefix);
    const out = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k !== null && k.indexOf(p) === 0) out.push(k);
    }
    return out;
  }

  /**
   * Elimina todas las claves de localStorage que empiezan por el prefijo dado.
   *
   * SEGURIDAD: el parámetro `prefix` es obligatorio. NUNCA borra todo el
   * localStorage. Si se llama sin prefijo (o con cadena vacía), lanza
   * excepción para evitar borrados masivos accidentales.
   *
   * @param {string} prefix — prefijo obligatorio no vacío.
   * @throws {Error} si prefix es nulo, undefined o cadena vacía.
   *
   * @example
   *   AJ.store.clear(AJ.store.namespace.INMO);
   *   // → borra todas las claves que empiezan por 'aj_inmo_'
   */
  function storeClear(prefix) {
    if (prefix == null || prefix === '') {
      throw new Error(
        'AJ.store.clear: prefijo obligatorio. ' +
        'No se permite borrar todo el localStorage desde aj-core.'
      );
    }
    // Capturar primero las claves y luego borrar, para no alterar los índices
    // mientras iteramos sobre localStorage.
    const keys = storeList(prefix);
    for (let i = 0; i < keys.length; i++) {
      localStorage.removeItem(keys[i]);
    }
  }

  const store = {
    get:       storeGet,
    set:       storeSet,
    remove:    storeRemove,
    list:      storeList,
    clear:     storeClear,
    namespace: namespace
  };


  // ═══════════════════════════════════════════════════════════════════════
  //  CAPA 3 — ajFormat
  //  Formateo de valores para UI española.
  // ═══════════════════════════════════════════════════════════════════════

  const DASH = '—';  // em-dash, usado para valores ausentes.

  // Formateador de moneda EUR español. Instanciado una vez por rendimiento.
  const _fmtEur = new Intl.NumberFormat('es-ES', {
    style:                 'currency',
    currency:              'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  // Formateador de número con separador de miles español.
  function _fmtNum(decimales) {
    return new Intl.NumberFormat('es-ES', {
      minimumFractionDigits: decimales,
      maximumFractionDigits: decimales
    });
  }

  /**
   * Devuelve true si el valor debe tratarse como "ausente" (null, undefined o NaN).
   * @param {*} n
   * @returns {boolean}
   */
  function _isEmpty(n) {
    return n === null || n === undefined || (typeof n === 'number' && isNaN(n));
  }

  /**
   * Formatea un número como moneda en euros (es-ES).
   * Negativos con signo delante del número (`-12.345,67 €`).
   * Cero como `0 €` (caso especial, sin decimales).
   * Null, undefined y NaN devuelven `—`.
   *
   * @param {number} n
   * @returns {string}
   *
   * @example
   *   AJ.format.moneda(12345.67);  // → "12.345,67 €"
   *   AJ.format.moneda(0);         // → "0 €"
   *   AJ.format.moneda(-500);      // → "-500,00 €"
   *   AJ.format.moneda(null);      // → "—"
   */
  function fmtMoneda(n) {
    if (_isEmpty(n)) return DASH;
    if (n === 0) return '0 €';
    return _fmtEur.format(n);
  }

  /**
   * Formatea un número como moneda compacta: `12,3 k€` / `1,2 M€`.
   * Umbral de abreviación: valor absoluto >= 10.000.
   * Por debajo del umbral, devuelve moneda normal (`AJ.format.moneda`).
   * Null, undefined y NaN devuelven `—`.
   *
   * @param {number} n
   * @returns {string}
   *
   * @example
   *   AJ.format.monedaCompacta(9999);     // → "9.999,00 €"
   *   AJ.format.monedaCompacta(12345);    // → "12,3 k€"
   *   AJ.format.monedaCompacta(1234567);  // → "1,2 M€"
   */
  function fmtMonedaCompacta(n) {
    if (_isEmpty(n)) return DASH;
    const abs = Math.abs(n);
    if (abs < 10000) return fmtMoneda(n);
    const fmt1 = _fmtNum(1);
    if (abs >= 1000000) {
      return fmt1.format(n / 1000000) + ' M€';
    }
    return fmt1.format(n / 1000) + ' k€';
  }

  // Nombres de mes para formato 'media' y 'larga', en español.
  const _MESES_CORTO = ['ene', 'feb', 'mar', 'abr', 'may', 'jun',
                        'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const _MESES_LARGO = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
                        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

  function _pad2(n) { return (n < 10 ? '0' : '') + n; }

  /**
   * Calcula la diferencia en días entre dos fechas (sin considerar la hora).
   * @param {Date} a — fecha futura o igual.
   * @param {Date} b — fecha pasada o igual.
   * @returns {number} días de diferencia (puede ser negativo).
   */
  function _diffDays(a, b) {
    const ms = 1000 * 60 * 60 * 24;
    const da = new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const db = new Date(b.getFullYear(), b.getMonth(), b.getDate());
    return Math.round((da - db) / ms);
  }

  /**
   * Convierte una fecha ISO a string legible en español.
   *
   * Formatos soportados:
   *   - 'corta'     → "21/04/2026"
   *   - 'media'     → "21 abr 2026"
   *   - 'larga'     → "21 de abril de 2026"
   *   - 'relativa'  → "hace 3 días", "en 2 semanas", "hoy", "ayer", "mañana"
   *
   * Null y undefined devuelven `—`. Strings que no se parseen como fecha válida
   * también devuelven `—`.
   *
   * @param {string|Date} isoString — fecha en formato ISO o instancia Date.
   * @param {'corta'|'media'|'larga'|'relativa'} [formato='corta']
   * @returns {string}
   *
   * @example
   *   AJ.format.fecha('2026-04-21');              // → "21/04/2026"
   *   AJ.format.fecha('2026-04-21', 'larga');     // → "21 de abril de 2026"
   *   AJ.format.fecha('2026-04-19', 'relativa');  // → "hace 2 días" (si hoy es 21)
   */
  function fmtFecha(isoString, formato) {
    if (isoString == null) return DASH;
    const d = (isoString instanceof Date) ? isoString : new Date(isoString);
    if (isNaN(d.getTime())) return DASH;
    const fmt = formato || 'corta';

    if (fmt === 'corta') {
      return _pad2(d.getDate()) + '/' + _pad2(d.getMonth() + 1) + '/' + d.getFullYear();
    }
    if (fmt === 'media') {
      return d.getDate() + ' ' + _MESES_CORTO[d.getMonth()] + ' ' + d.getFullYear();
    }
    if (fmt === 'larga') {
      return d.getDate() + ' de ' + _MESES_LARGO[d.getMonth()] + ' de ' + d.getFullYear();
    }
    if (fmt === 'relativa') {
      const diff = _diffDays(d, new Date());
      if (diff === 0)  return 'hoy';
      if (diff === 1)  return 'mañana';
      if (diff === -1) return 'ayer';
      if (diff > 0) {
        if (diff < 7)   return 'en ' + diff + ' días';
        if (diff < 30)  return 'en ' + Math.round(diff / 7) + ' semanas';
        if (diff < 365) return 'en ' + Math.round(diff / 30) + ' meses';
        return 'en ' + Math.round(diff / 365) + ' años';
      }
      // diff < -1
      const a = -diff;
      if (a < 7)   return 'hace ' + a + ' días';
      if (a < 30)  return 'hace ' + Math.round(a / 7) + ' semanas';
      if (a < 365) return 'hace ' + Math.round(a / 30) + ' meses';
      return 'hace ' + Math.round(a / 365) + ' años';
    }

    // Formato desconocido: fallback a 'corta' para no romper llamadas antiguas.
    return _pad2(d.getDate()) + '/' + _pad2(d.getMonth() + 1) + '/' + d.getFullYear();
  }

  /**
   * Formatea un número como porcentaje en es-ES.
   * El número de entrada se trata como porcentaje directo (25 → "25,00 %",
   * NO 0.25 → "25,00 %"). Null y undefined devuelven `—`.
   *
   * @param {number} n — valor en porcentaje directo (ej: 25 para 25 %).
   * @param {number} [decimales=2]
   * @returns {string}
   *
   * @example
   *   AJ.format.porcentaje(25);       // → "25,00 %"
   *   AJ.format.porcentaje(3.5, 1);   // → "3,5 %"
   *   AJ.format.porcentaje(null);     // → "—"
   */
  function fmtPorcentaje(n, decimales) {
    if (_isEmpty(n)) return DASH;
    const d = (decimales == null) ? 2 : decimales;
    return _fmtNum(d).format(n) + ' %';
  }

  /**
   * Formatea un número con separador de miles español (`.`) y decimal (`,`).
   * Null, undefined y NaN devuelven `—`.
   *
   * @param {number} n
   * @param {number} [decimales=0]
   * @returns {string}
   *
   * @example
   *   AJ.format.numero(12345);        // → "12.345"
   *   AJ.format.numero(12345.678, 2); // → "12.345,68"
   */
  function fmtNumero(n, decimales) {
    if (_isEmpty(n)) return DASH;
    const d = (decimales == null) ? 0 : decimales;
    return _fmtNum(d).format(n);
  }

  /**
   * Formatea un DNI español: 8 dígitos + 1 letra mayúscula.
   * Acepta entrada con espacios/guiones y los normaliza.
   * Valida únicamente el FORMATO (8 dígitos + 1 letra), no la letra de control.
   * Si el input no cumple el formato, se devuelve tal cual (sin tocar).
   *
   * @param {string} s
   * @returns {string} DNI normalizado "12345678A" o el string original si no es válido.
   *
   * @example
   *   AJ.format.dni('12345678a');     // → "12345678A"
   *   AJ.format.dni('12.345.678-A');  // → "12345678A"
   *   AJ.format.dni('abc');           // → "abc"  (no válido, se devuelve como está)
   */
  function fmtDni(s) {
    if (s == null) return s;
    const cleaned = String(s).replace(/[\s.\-]/g, '').toUpperCase();
    const m = /^(\d{8})([A-Z])$/.exec(cleaned);
    if (!m) return s;
    return m[1] + m[2];
  }

  /**
   * Formatea un teléfono español.
   * Detecta móvil (primer dígito 6 o 7) y fijo (primer dígito 8 o 9).
   * Tolera prefijo internacional `+34`, `0034` o `34` al inicio.
   *
   *   - Móvil: "612 345 678"     (grupos 3-3-3)
   *   - Fijo:  "93 123 45 67"    (grupos 2-3-2-2)
   *
   * Si el input no cumple ninguno de los dos formatos, se devuelve tal cual.
   *
   * @param {string} s
   * @returns {string}
   *
   * @example
   *   AJ.format.telefono('612345678');       // → "612 345 678"
   *   AJ.format.telefono('+34 93 123 45 67');// → "93 123 45 67"
   *   AJ.format.telefono('abc');             // → "abc"
   */
  function fmtTelefono(s) {
    if (s == null) return s;
    // Quitar espacios, guiones, paréntesis y puntos.
    let digits = String(s).replace(/[\s().\-]/g, '');
    // Normalizar prefijo internacional español a versión local de 9 dígitos.
    if (digits.indexOf('+34') === 0) digits = digits.slice(3);
    else if (digits.indexOf('0034') === 0) digits = digits.slice(4);
    else if (digits.length === 11 && digits.indexOf('34') === 0) digits = digits.slice(2);

    if (!/^\d{9}$/.test(digits)) return s;

    const first = digits.charAt(0);
    if (first === '6' || first === '7') {
      return digits.slice(0, 3) + ' ' + digits.slice(3, 6) + ' ' + digits.slice(6);
    }
    if (first === '8' || first === '9') {
      return digits.slice(0, 2) + ' ' + digits.slice(2, 5) + ' ' +
             digits.slice(5, 7) + ' ' + digits.slice(7);
    }
    return s;
  }

  const format = {
    moneda:         fmtMoneda,
    monedaCompacta: fmtMonedaCompacta,
    fecha:          fmtFecha,
    porcentaje:     fmtPorcentaje,
    numero:         fmtNumero,
    dni:            fmtDni,
    telefono:       fmtTelefono
  };


  // ═══════════════════════════════════════════════════════════════════════
  //  CAPA 4 — ajId
  //  Generación de identificadores: UUID v4 internos + códigos humanos
  //  AJ-F-NNN / AJ-I-NNN / AJ-P-NNN / AJ-S-NNN / AJ-CL-NNN [AMPLIADA v2.5.0].
  //  Reglas canónicas (Duda J cerrada):
  //    - J1  no reciclar: el contador crece monotónicamente aunque se
  //          borren operaciones.
  //    - J2  numeración global por sociedad, sin reinicio anual. Padding
  //          mínimo de 3 dígitos; al superar 999 crece natural (AJ-F-1000…).
  //  La incorporación documental de la Duda J a CLAUDE.md §6.1 se hará en
  //  una sesión posterior; aquí se aplica solo en código.
  // ═══════════════════════════════════════════════════════════════════════

  // Sociedades admitidas por las funciones de código humano. El UUID es
  // transversal y no requiere sociedad.
  const _CLAVES_CONTADOR = Object.freeze({
    finances:        'aj_ultimo_codigo_finances',
    inmo:            'aj_ultimo_codigo_inmo',
    personas:        'aj_ultimo_codigo_personas',         // NUEVO Frente 5
    seguimientos:    'aj_ultimo_codigo_seguimientos',     // NUEVO Frente 5
    captacion:       'aj_ultimo_codigo_captacion',        // NUEVO Frente 6 [v2.5.0]
    pedidos:         'aj_ultimo_codigo_pedidos',          // NUEVO Frente 8 [v2.8.0]
    propiedades:     'aj_ultimo_codigo_propiedades',      // NUEVO Frente 4 §15.2 [v2.9.0]
    titularidades:   'aj_ultimo_codigo_titularidades',    // NUEVO Frente 4 §15.3 [v2.9.0]
    inmoOperaciones: 'aj_ultimo_codigo_inmo_operaciones', // NUEVO Frente 4 §15.8 Sub-frente 4.5 [v2.13.0]
    inmoFincas:      'aj_ultimo_codigo_inmo_fincas',      // NUEVO Frente 12 §25.3 Sub-frente 12.2 [v2.18.0]
    inbox:           'aj_ultimo_codigo_inbox'             // NUEVO Frente 10 §26.3 Sub-frente 10.2 [v2.19.0]
  });

  // Detección única al cargar el módulo: preferir `crypto.randomUUID` cuando
  // está disponible (navegadores modernos y Node ≥ 19). Cuando no, se usa un
  // fallback manual por concatenación de hex aleatorios. La referencia se
  // cachea en el closure para no repetir la comprobación en cada llamada.
  const _nativeUuid = (typeof global.crypto !== 'undefined'
                       && typeof global.crypto.randomUUID === 'function')
    ? global.crypto.randomUUID.bind(global.crypto)
    : null;

  /**
   * Valida que `sociedad` sea uno de los valores admitidos en
   * `_CLAVES_CONTADOR`. Lanza si no lo es. El check de tipo va antes del
   * check de valor para que un `undefined` o `null` reciban un mensaje de
   * error específico (y no se interpolen como cadena "undefined" en el
   * mensaje de "sociedad inválida").
   *
   * Nota Frente 5: nombre `_validarSociedad` preservado por decisión D2 del
   * Sub-frente 5.2, aunque el conjunto de valores admitidos ya incluye
   * `personas` y `seguimientos` (entidades transversales del CRM, no
   * sociedades). El nombre se mantiene para evitar churn innecesario.
   *
   * @param {*} sociedad
   * @throws {Error} si sociedad no es string o no es uno de los valores
   *                 admitidos en `_CLAVES_CONTADOR`.
   */
  function _validarSociedad(sociedad) {
    if (typeof sociedad !== 'string') {
      throw new Error('[ajId] sociedad es obligatoria y debe ser string');
    }
    if (!Object.prototype.hasOwnProperty.call(_CLAVES_CONTADOR, sociedad)) {
      const validos = Object.keys(_CLAVES_CONTADOR).map(s => "'" + s + "'").join(', ');
      throw new Error(
        '[ajId] sociedad inválida: "' + sociedad + '" (debe ser uno de: ' + validos + ')'
      );
    }
  }

  /**
   * Mapa de prefijos de código humano por entidad. Frente 5 §16.2 introduce
   * `AJ-P-` (personas) y `AJ-S-` (seguimientos, operativa en Sesión B).
   */
  const _PREFIJOS_CODIGO = Object.freeze({
    finances:        'AJ-F-',
    inmo:            'AJ-I-',
    personas:        'AJ-P-',     // NUEVO Frente 5 §16.2
    seguimientos:    'AJ-S-',     // NUEVO Frente 5 §16.6 (operativa en Sesión B)
    captacion:       'AJ-CL-',    // NUEVO Frente 6 §17.4 [v2.5.0]
    pedidos:         'AJ-PD-',    // NUEVO Frente 8 §20.2 [v2.8.0]
    propiedades:     'AJ-IP-',    // NUEVO Frente 4 §15.2 [v2.9.0]
    titularidades:   'AJ-IT-',    // NUEVO Frente 4 §15.3 [v2.9.0]
    inmoOperaciones: 'AJ-IO-',    // NUEVO Frente 4 §15.8 Sub-frente 4.5 [v2.13.0]
    inmoFincas:      'AJ-IF-',    // NUEVO Frente 12 §25.3 Sub-frente 12.2 [v2.18.0]
    inbox:           'AJ-IB-'     // NUEVO Frente 10 §26.3 Sub-frente 10.2 [v2.19.0]
  });

  /**
   * Genera un UUID v4 manualmente. Fallback usado cuando `crypto.randomUUID`
   * no está disponible en el entorno. Formato canónico:
   *   xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
   * donde `y` es uno de {8, 9, a, b} (variante RFC 4122).
   *
   * No expuesto: solo se usa a través de `idUuid`.
   * @returns {string} UUID v4 de 36 caracteres.
   */
  function _uuidFallback() {
    const hex = '0123456789abcdef';
    let out = '';
    for (let i = 0; i < 36; i++) {
      if (i === 8 || i === 13 || i === 18 || i === 23) {
        out += '-';
      } else if (i === 14) {
        out += '4';
      } else if (i === 19) {
        // Variante RFC 4122: bits 10xx → uno de {8, 9, a, b}.
        out += hex[(Math.random() * 4 | 0) + 8];
      } else {
        out += hex[Math.random() * 16 | 0];
      }
    }
    return out;
  }

  /**
   * Genera un UUID v4 estándar, usado como clave primaria interna de los
   * registros del CRM (id de cliente, operación, lead, etc.). No es visible
   * al usuario final; para códigos visibles en UI usar `codigoHumano`.
   *
   * Prefiere `crypto.randomUUID` cuando está disponible; cae al fallback
   * manual en entornos antiguos.
   *
   * @returns {string} UUID de 36 caracteres con formato canónico.
   *
   * @example
   *   const id = AJ.id.uuid();
   *   // → "3b0c1f2d-5a5e-4b7c-9f0a-1d2e3f4a5b6c"
   */
  function idUuid() {
    return _nativeUuid ? _nativeUuid() : _uuidFallback();
  }

  /**
   * Genera el siguiente código humano secuencial para la sociedad/entidad
   * indicada y lo persiste antes de devolverlo.
   *
   * Reglas invariantes (Duda J cerrada):
   *   - No recicla. El contador crece aunque se borren operaciones.
   *   - Global por sociedad, sin reinicio anual.
   *   - Padding mínimo a 3 dígitos; al superar 999 crece natural.
   *
   * El orden es: incrementar → persistir → devolver. Así, si la lectura
   * posterior falla, el número ya está grabado y no se asigna dos veces.
   *
   * @param {'finances'|'inmo'|'personas'|'seguimientos'|'captacion'|'pedidos'|'propiedades'|'titularidades'} sociedad
   * @returns {string} código en formato `AJ-F-NNN`, `AJ-I-NNN`, `AJ-P-NNN`
   *                  o `AJ-S-NNN`.
   * @throws {Error} si sociedad no es string o no está en
   *                 `_CLAVES_CONTADOR`.
   *
   * @example
   *   AJ.id.codigoHumano('finances');     // → "AJ-F-001"
   *   AJ.id.codigoHumano('inmo');         // → "AJ-I-001"
   *   AJ.id.codigoHumano('personas');     // → "AJ-P-001"  (Frente 5 §16.2)
   *   AJ.id.codigoHumano('seguimientos'); // → "AJ-S-001"  (Frente 5 §16.6, operativa en Sesión B)
   */
  function idCodigoHumano(sociedad) {
    _validarSociedad(sociedad);
    const clave = _CLAVES_CONTADOR[sociedad];
    const actual = store.get(clave);
    const base = (typeof actual === 'number' && actual >= 0) ? actual : 0;
    const siguiente = base + 1;
    store.set(clave, siguiente);
    const prefijo = _PREFIJOS_CODIGO[sociedad];
    return prefijo + String(siguiente).padStart(3, '0');
  }

  /**
   * Devuelve el último número asignado a la sociedad indicada, SIN
   * incrementar y SIN tocar storage. Uso: paneles de administración,
   * debugging, migraciones. Si aún no se ha asignado ningún código en
   * esa sociedad, devuelve 0.
   *
   * @param {'finances'|'inmo'|'personas'|'seguimientos'|'captacion'|'pedidos'|'propiedades'|'titularidades'} sociedad
   * @returns {number} entero no negativo.
   * @throws {Error} si sociedad no es string o no está en
   *                 `_CLAVES_CONTADOR`.
   *
   * @example
   *   AJ.id.ultimoCodigo('finances');     // → 42 (si el último fue AJ-F-042)
   *   AJ.id.ultimoCodigo('inmo');         // → 0  (si aún no hay ninguno)
   *   AJ.id.ultimoCodigo('personas');     // → 0  (Frente 5 §16.2)
   */
  function idUltimoCodigo(sociedad) {
    _validarSociedad(sociedad);
    const actual = store.get(_CLAVES_CONTADOR[sociedad]);
    return (typeof actual === 'number' && actual >= 0) ? actual : 0;
  }

  /**
   * @admin
   * Función de administración. No usar en flujos regulares. Pensada para:
   * (1) migración inicial de códigos legacy, (2) corrección puntual si se
   * detecta desincronización entre la numeración esperada y la persistida.
   * Cualquier uso queda bajo responsabilidad del admin y debe registrarse
   * en audit log cuando exista (pendiente §8.5 CLAUDE.md).
   *
   * Ajusta el contador al valor indicado. Se permite también bajar el
   * contador (rompe técnicamente la monotonía que garantiza
   * `codigoHumano`, pero es la puerta de escape legítima para correcciones
   * administrativas).
   *
   * @param {'finances'|'inmo'|'personas'|'seguimientos'|'captacion'|'pedidos'|'propiedades'|'titularidades'} sociedad
   * @param {number} nuevoValor — entero ≥ 0.
   * @returns {number} el nuevoValor aplicado, tras persistirlo.
   * @throws {Error} si sociedad es inválida, o si nuevoValor no es entero
   *                 o es negativo.
   *
   * @example
   *   AJ.id.reiniciarContador('finances', 150);   // → 150, persistido.
   *   // Próximo AJ.id.codigoHumano('finances') devolverá "AJ-F-151".
   */
  function idReiniciarContador(sociedad, nuevoValor) {
    _validarSociedad(sociedad);
    if (typeof nuevoValor !== 'number' || !Number.isInteger(nuevoValor)) {
      throw new Error(
        '[ajId] nuevoValor debe ser un entero. Recibido: ' +
        typeof nuevoValor + ' (' + nuevoValor + ')'
      );
    }
    if (nuevoValor < 0) {
      throw new Error(
        '[ajId] nuevoValor no puede ser negativo. Recibido: ' + nuevoValor
      );
    }
    store.set(_CLAVES_CONTADOR[sociedad], nuevoValor);
    return nuevoValor;
  }

  const id = {
    uuid:              idUuid,
    codigoHumano:      idCodigoHumano,
    ultimoCodigo:      idUltimoCodigo,
    reiniciarContador: idReiniciarContador
  };


  // ═══════════════════════════════════════════════════════════════════════
  //  CAPA 5 — ajRappel
  //  Cálculo de comisiones por FEIN según la especificación canónica de
  //  CLAUDE.md §5.3. Función PURA: no toca localStorage ni tiene efectos
  //  secundarios. El caller es quien filtra las FEINs por agente y por
  //  mes antes de llamar; esta capa solo conoce la tabla de tramos y
  //  la mecánica de cálculo (invariante contable, redondeo, ordenamiento
  //  con desempate estable).
  //
  //  Defensa contra legacy: las funciones validan que `origen` sea uno
  //  de {directo, agente, empresa}. Cualquier otro valor (en particular
  //  el `tipoOrigen` no estandarizado del código pre-aj-core) lanza con
  //  referencia explícita a CLAUDE.md §5.3.1.bis para que el error sea
  //  auto-explicativo.
  // ═══════════════════════════════════════════════════════════════════════

  // Tabla canónica de tramos (CLAUDE.md §5.3.2). Copia literal de la tabla
  // documental: si en el futuro algún módulo muestra valores distintos,
  // lo correcto es la tabla, no el código. Freeze profundo.
  const TABLA = Object.freeze({
    directo: Object.freeze({ 1: 70, 2: 70, 3: 70, default: 70 }),
    agente:  Object.freeze({ 1: 60, 2: 65, 3: 70, default: 70 }),
    empresa: Object.freeze({ 1: 50, 2: 55, 3: 60, default: 60 })
  });

  // Valores admitidos de `origen`. Cualquier otro valor (incluido el
  // `tipoOrigen` legacy) hace fallar la validación, por diseño.
  const _ORIGENES_VALIDOS = Object.freeze(['directo', 'agente', 'empresa']);

  /**
   * Devuelve true si `v` es un objeto plano (no null, no array, no Date).
   * Usado para validar `params` de `calcular` y `tabla` custom.
   * @param {*} v
   * @returns {boolean}
   */
  function _esObjetoPlano(v) {
    return v !== null
        && typeof v === 'object'
        && !Array.isArray(v)
        && !(v instanceof Date);
  }

  /**
   * Devuelve true si `s` es uno de los tres valores canónicos de origen.
   * @param {*} s
   * @returns {boolean}
   */
  function _esOrigenValido(s) {
    return typeof s === 'string' && _ORIGENES_VALIDOS.indexOf(s) !== -1;
  }

  /**
   * Parsea un valor a timestamp en ms. Acepta Date, string ISO, o null/undefined.
   * Devuelve NaN si no se puede parsear. No lanza.
   * @param {Date|string|null|undefined} v
   * @returns {number} timestamp en ms, o NaN.
   */
  function _parseTs(v) {
    if (v === null || v === undefined) return NaN;
    if (v instanceof Date) return v.getTime();
    return Date.parse(v);
  }

  /**
   * Calcula la comisión de una FEIN individual según la tabla canónica de
   * tramos. Función PURA: recibe los parámetros ya resueltos por el caller
   * (incluida la posición dentro del contador mensual del origen) y devuelve
   * el desglose agente/sociedad al céntimo.
   *
   * **Invariante contable:** `importeAgente + importeSociedad === honorariosBrutos`
   * exacto al céntimo, incluso en casos con redondeo. El test de humo lo
   * verifica.
   *
   * **Defensa anti-legacy:** si `origen` no es uno de los tres valores
   * canónicos (`directo`, `agente`, `empresa`), la excepción incluye
   * referencia a CLAUDE.md §5.3.1.bis para localizar la deuda de migración
   * `tipoOrigen` → `origen`.
   *
   * @param {Object} params
   * @param {'directo'|'agente'|'empresa'} params.origen
   * @param {number} params.honorariosBrutos — euros brutos que cobra AJ.
   *   Debe ser número finito ≥ 0. Se admite 0 como caso válido (cortesías,
   *   operaciones sin honorarios).
   * @param {number} params.posicionEnContador — posición (1-based) de
   *   esta FEIN dentro del contador de su origen en el mes.
   * @param {Object} [params.tabla] — tabla alternativa a TABLA. Uso
   *   previsto: permitir que Inmo u otros contextos pasen su propia
   *   tabla sin acoplar el módulo (Duda M §13.2 abierta).
   * @returns {Object} desglose con 7 campos:
   *   `origen`, `posicionEnContador`, `porcentaje`, `honorariosBrutos`,
   *   `importeAgente`, `importeSociedad`, `tramo`.
   * @throws {Error} si cualquier validación falla; mensaje con prefijo [ajRappel].
   *
   * @example
   *   AJ.rappel.calcular({
   *     origen: 'agente',
   *     honorariosBrutos: 4500,
   *     posicionEnContador: 1
   *   });
   *   // → { origen: 'agente', posicionEnContador: 1, porcentaje: 60,
   *   //     honorariosBrutos: 4500, importeAgente: 2700,
   *   //     importeSociedad: 1800, tramo: 'agente-tramo-1' }
   */
  function rappelCalcular(params) {
    if (!_esObjetoPlano(params)) {
      throw new Error(
        '[ajRappel] params debe ser un objeto con los campos origen, ' +
        'honorariosBrutos, posicionEnContador'
      );
    }
    const origen = params.origen;
    const honorariosBrutos = params.honorariosBrutos;
    const posicionEnContador = params.posicionEnContador;
    const tabla = params.tabla;

    if (!_esOrigenValido(origen)) {
      throw new Error(
        '[ajRappel] origen inválido: "' + origen + '". ' +
        'Valores admitidos: \'directo\', \'agente\', \'empresa\'. ' +
        '(Si se recibió "tipoOrigen" o un valor legacy, revisar deuda ' +
        'de migración documentada en CLAUDE.md §5.3.1.bis)'
      );
    }
    if (typeof honorariosBrutos !== 'number'
        || !Number.isFinite(honorariosBrutos)
        || honorariosBrutos < 0) {
      throw new Error(
        '[ajRappel] honorariosBrutos debe ser número finito ≥ 0. ' +
        'Recibido: ' + typeof honorariosBrutos + ' (' + honorariosBrutos + ')'
      );
    }
    if (typeof posicionEnContador !== 'number'
        || !Number.isInteger(posicionEnContador)
        || posicionEnContador < 1) {
      throw new Error(
        '[ajRappel] posicionEnContador debe ser entero ≥ 1. ' +
        'Recibido: ' + typeof posicionEnContador + ' (' + posicionEnContador + ')'
      );
    }
    if (tabla !== undefined && !_esObjetoPlano(tabla)) {
      throw new Error(
        '[ajRappel] tabla debe ser objeto con las claves de origen ' +
        '(directo, agente, empresa). Recibido: ' + typeof tabla
      );
    }

    const tablaEfectiva = (tabla === undefined) ? TABLA : tabla;
    const tramoOrigen = tablaEfectiva[origen];
    if (!_esObjetoPlano(tramoOrigen)) {
      throw new Error(
        '[ajRappel] tabla no contiene la clave de origen "' + origen +
        '". Claves presentes: ' + Object.keys(tablaEfectiva).join(', ')
      );
    }

    const porcentaje = (posicionEnContador <= 3)
      ? tramoOrigen[posicionEnContador]
      : tramoOrigen.default;
    if (typeof porcentaje !== 'number') {
      throw new Error(
        '[ajRappel] tabla para origen "' + origen +
        '" no define porcentaje en posición ' + posicionEnContador + '.'
      );
    }

    // Redondeo al céntimo. `importeSociedad` se calcula por resta explícita
    // sobre el bruto (no por fórmula independiente) para garantizar la
    // invariante contable `agente + sociedad = brutos` incluso con errores
    // de coma flotante.
    const importeAgente = Math.round(honorariosBrutos * porcentaje) / 100;
    const importeSociedad = Math.round((honorariosBrutos - importeAgente) * 100) / 100;

    const tramo = (posicionEnContador <= 3)
      ? origen + '-tramo-' + posicionEnContador
      : origen + '-tramo-max';

    return {
      origen:             origen,
      posicionEnContador: posicionEnContador,
      porcentaje:         porcentaje,
      honorariosBrutos:   honorariosBrutos,
      importeAgente:      importeAgente,
      importeSociedad:    importeSociedad,
      tramo:              tramo
    };
  }

  /**
   * Ordena un array de FEINs y les asigna `posicionEnContador` según su
   * posición dentro del contador mensual de su `origen`.
   *
   * **Asunción canónica (el caller debe garantizarla):** todas las FEINs
   * del array pertenecen al mismo agente y al mismo mes natural. Esta
   * función NO filtra; si el caller mezcla agentes o meses, los contadores
   * quedarán mezclados y el resultado será incorrecto.
   *
   * **Orden aplicado:**
   *   1. `fechaRecepcion` ascendente (parseada como Date).
   *   2. Si coinciden: `createdAt` ascendente, SOLO si ambas FEINs lo tienen.
   *   3. Si siguen empatadas (o falta `createdAt` en alguna): orden de
   *      entrada al array (ordenamiento estable).
   *
   * **No mutación:** el array de entrada no se toca. Las FEINs del
   * resultado son copias superficiales con `posicionEnContador` añadido.
   *
   * **Defensa anti-legacy:** valida que cada elemento tenga `origen`
   * canónico; en caso contrario lanza con referencia a §5.3.1.bis.
   *
   * @param {Array<Object>} feins — FEINs del mismo agente y mes.
   * @returns {Array<Object>} copia ordenada con `posicionEnContador` añadido.
   * @throws {Error} si `feins` no es array, o si algún elemento tiene
   *                 `origen` inválido o `fechaRecepcion` no parseable.
   *                 Los mensajes incluyen el índice del elemento problemático.
   */
  function rappelPosicionarFeins(feins) {
    if (!Array.isArray(feins)) {
      throw new Error(
        '[ajRappel] posicionarFeins espera un array. Recibido: ' + typeof feins
      );
    }

    // Validación por elemento + preparación del registro intermedio.
    const preparadas = feins.map(function (f, i) {
      if (!_esObjetoPlano(f)) {
        throw new Error('[ajRappel] elemento [' + i + '] no es un objeto plano.');
      }
      if (!_esOrigenValido(f.origen)) {
        throw new Error(
          '[ajRappel] elemento [' + i + '] tiene origen inválido: "' + f.origen +
          '". Valores admitidos: \'directo\', \'agente\', \'empresa\' ' +
          '(revisar §5.3.1.bis sobre deuda de migración tipoOrigen → origen).'
        );
      }
      const ts = _parseTs(f.fechaRecepcion);
      if (isNaN(ts)) {
        throw new Error(
          '[ajRappel] elemento [' + i + '] tiene fechaRecepcion no parseable: "' +
          f.fechaRecepcion + '".'
        );
      }
      const rawCts = _parseTs(f.createdAt);
      const cts = isNaN(rawCts) ? null : rawCts;
      return { fein: f, ts: ts, cts: cts, origIdx: i };
    });

    // Ordenamiento estable. El desempate por `cts` solo se aplica si AMBAS
    // FEINs tienen `createdAt` definido; si falta en alguna, cae al orden
    // de inserción (origIdx). Esto respeta literalmente §5.3.8.
    preparadas.sort(function (a, b) {
      if (a.ts !== b.ts) return a.ts - b.ts;
      if (a.cts !== null && b.cts !== null && a.cts !== b.cts) {
        return a.cts - b.cts;
      }
      return a.origIdx - b.origIdx;
    });

    // Numeración por contador de origen. Tres contadores independientes
    // que corren en paralelo (CLAUDE.md §5.3.5).
    const contadores = { directo: 0, agente: 0, empresa: 0 };
    return preparadas.map(function (p) {
      contadores[p.fein.origen] += 1;
      // Copia superficial del objeto original + campo nuevo. No se muta `p.fein`.
      return Object.assign({}, p.fein, {
        posicionEnContador: contadores[p.fein.origen]
      });
    });
  }

  // Ejemplo de uso conjunto de la Capa 5 (flujo esperado del caller):
  //
  // 1. El caller obtiene las FEINs del agente en el mes, ya filtradas
  //    desde su fuente de datos (por ejemplo, `AJ.store.get` + filtros).
  //
  //    const feinsCamiloFebrero = [
  //      { origen: 'directo', honorariosBrutos: 5000,
  //        fechaRecepcion: '2026-02-05T10:00:00Z' },
  //      { origen: 'agente',  honorariosBrutos: 4500,
  //        fechaRecepcion: '2026-02-12T14:30:00Z' },
  //      { origen: 'empresa', honorariosBrutos: 6000,
  //        fechaRecepcion: '2026-02-20T09:15:00Z' }
  //    ];
  //
  // 2. Posicionar: cada FEIN recibe su `posicionEnContador`.
  //
  //    const posicionadas = AJ.rappel.posicionarFeins(feinsCamiloFebrero);
  //    // → cada una es 1ª de su contador de origen en febrero.
  //
  // 3. Calcular el rappel individual de cada una.
  //
  //    const resultados = posicionadas.map(function (f) {
  //      return AJ.rappel.calcular({
  //        origen:             f.origen,
  //        honorariosBrutos:   f.honorariosBrutos,
  //        posicionEnContador: f.posicionEnContador
  //      });
  //    });
  //    // → porcentajes 70, 60, 50 (ejemplo canónico CLAUDE.md §5.3.6).

  const rappel = {
    TABLA:            TABLA,
    calcular:         rappelCalcular,
    posicionarFeins:  rappelPosicionarFeins
  };


  // ═══════════════════════════════════════════════════════════════════════
  //  CAPA 11 — ajPersonas
  //  Gestión de la entidad transversal aj_personas canonizada en
  //  CLAUDE.md §16.2 (Frente 5). CRUD + búsqueda por roles + dedup
  //  canónico R-N3 + agregar/quitar rol + fusión de duplicados.
  //
  //  Reglas operativas implementadas en esta capa:
  //    - R-N1 (referencia obligatoria): se valida desde otras capas
  //      cuando referencien personaId. En Capa 11 no aplica directo.
  //    - R-N2 (no duplicación de roles): aplicada en agregarRol.
  //    - R-N3 (dedup blando): aplicada en crear con opción
  //      forzarSiDuplicado.
  //    - R-N4 (idempotencia migración): se implementa en migrarFrente5
  //      en Sesión B junto con Capa 12.
  //
  //  IMPORTANTE — Distinción nominal `enEmbudo` (NUEVO v2.3.0):
  //  Esta capa expone `AJ.personas.enEmbudo()` como método API canónico
  //  (predicado de visibilidad sobre `aj_personas[i].embudos[]`). NO confundir
  //  con el atributo legacy `op.enEmbudo` (boolean) en operaciones del kanban
  //  — son semánticas distintas en namespaces distintos:
  //    - `AJ.personas.enEmbudo(personaId, embudo, agenteId?)` → método API.
  //    - `op.enEmbudo` → atributo en aj_personas[i].operaciones[j].
  //  Anotación canonizada en bitácora `496dbfb` (Día Histórico AJ Grup CRM,
  //  hallazgo colateral pre-Sesión código 1).
  // ═══════════════════════════════════════════════════════════════════════

  const _CLAVE_PERSONAS = 'aj_personas';

  const _ROLES_CANONICOS = Object.freeze([
    'cliente_finances',
    'comprador_inmo',
    'vendedor_inmo',
    'propietario',
    'colaborador',
    'agente_finances',
    'agente_inmo',
    'supervisor'  // NUEVO Sub-frente 5.3.B (CLAUDE.md §16.8.1)
  ]);

  // Set canónico de embudos admitidos en `aj_personas[i].embudos[].embudo`
  // (CLAUDE.md §16.11.3 v5.11.1). 5 valores cerrados, subset de los 5
  // rol-embudo de _ROLES_CANONICOS (excluye agente_finances, agente_inmo,
  // supervisor que son roles staff sin embudo asociado). Expuesto como
  // AJ.personas.EMBUDOS_CANONICOS desde v2.3.0.
  const _EMBUDOS_CANONICOS = Object.freeze([
    'cliente_finances',
    'comprador_inmo',
    'vendedor_inmo',
    'propietario',
    'colaborador'
  ]);

  // Set canónico de valores admitidos en `op.fuente` (CLAUDE.md §16.4).
  // Expuesto como AJ.personas.FUENTES desde v2.2.0 para consumo en HTMLs
  // refactorizados en Sub-frente 5.4 S3+S4.
  const _FUENTES = Object.freeze({
    INMO_CAPTACION:  'inmo_captacion',
    INMO_VISITA:     'inmo_visita',
    INMO_COMPRADOR:  'inmo_comprador',
    MANUAL_FINANCES: 'manual_finances',  // Reservado para creación manual desde Finances (sin uso legacy detectado en S2 — MF1)
    MANUAL_INMO:     'manual_inmo'
  });

  function _validarRol(rol) {
    if (typeof rol !== 'string') {
      throw new Error('[ajPersonas] rol debe ser string');
    }
    if (_ROLES_CANONICOS.indexOf(rol) === -1) {
      throw new Error(
        '[ajPersonas] rol inválido: "' + rol + '" (válidos: ' +
        _ROLES_CANONICOS.map(r => "'" + r + "'").join(', ') + ')'
      );
    }
  }

  function _validarEmbudo(embudo) {
    if (typeof embudo !== 'string') {
      throw new Error('[ajPersonas] embudo debe ser string');
    }
    if (_EMBUDOS_CANONICOS.indexOf(embudo) === -1) {
      throw new Error(
        '[ajPersonas] embudo inválido: "' + embudo + '" (válidos: ' +
        _EMBUDOS_CANONICOS.map(e => "'" + e + "'").join(', ') + ')'
      );
    }
  }

  function _normalizarTelefono(tel) {
    if (typeof tel !== 'string') return '';
    return tel.replace(/\s/g, '').replace(/-/g, '').replace(/^\+34/, '');
  }

  function _normalizarEmail(email) {
    if (typeof email !== 'string') return '';
    return email.trim().toLowerCase();
  }

  function _normalizarNombreAscii(nombre) {
    if (typeof nombre !== 'string') return '';
    // NFD + eliminación de diacríticos (combining marks U+0300..U+036F)
    // + lowercased + trimmed.
    return nombre.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }

  function _leerPersonas() {
    const raw = store.get(_CLAVE_PERSONAS);
    return Array.isArray(raw) ? raw : [];
  }

  function _persistirPersonas(personas) {
    store.set(_CLAVE_PERSONAS, personas);
  }

  /**
   * Busca personas potencialmente duplicadas según los criterios canónicos
   * R-N3 de CLAUDE.md §16.5. Devuelve array de candidatos con la lista de
   * criterios que coinciden por cada uno.
   *
   * Los 4 criterios son:
   *   - DNI: igualdad exacta de strings trimmed (solo si ambos lo tienen).
   *   - Teléfono: normalizado (sin espacios/guiones/+34) (solo si ambos).
   *   - Email: lowercased + trimmed (solo si ambos).
   *   - Nombre: ASCII-friendly (lowercased + sin tildes + trimmed).
   *
   * @param {{nombre?: string, dni?: string, telefono?: string, email?: string}} criterios
   * @returns {Array<{personaId: string, criteriosCoincidencia: string[], persona: Object}>}
   */
  function personasBuscarPorDedup(criterios) {
    criterios = criterios || {};
    const personas = _leerPersonas();
    const out = [];

    const cDni      = (typeof criterios.dni === 'string') ? criterios.dni.trim() : '';
    const cTelNorm  = _normalizarTelefono(criterios.telefono);
    const cEmailNorm = _normalizarEmail(criterios.email);
    const cNombreNorm = _normalizarNombreAscii(criterios.nombre);

    for (let i = 0; i < personas.length; i++) {
      const p = personas[i];
      const criteriosCoincidencia = [];

      const pDni = (typeof p.dni === 'string') ? p.dni.trim() : '';
      if (cDni !== '' && pDni !== '' && cDni === pDni) {
        criteriosCoincidencia.push('dni');
      }

      const pTelNorm = _normalizarTelefono(p.telefono);
      if (cTelNorm !== '' && pTelNorm !== '' && cTelNorm === pTelNorm) {
        criteriosCoincidencia.push('telefono');
      }

      const pEmailNorm = _normalizarEmail(p.email);
      if (cEmailNorm !== '' && pEmailNorm !== '' && cEmailNorm === pEmailNorm) {
        criteriosCoincidencia.push('email');
      }

      const pNombreNorm = _normalizarNombreAscii(p.nombre);
      if (cNombreNorm !== '' && pNombreNorm !== '' && cNombreNorm === pNombreNorm) {
        criteriosCoincidencia.push('nombre');
      }

      if (criteriosCoincidencia.length > 0) {
        out.push({
          personaId: p.id,
          criteriosCoincidencia: criteriosCoincidencia,
          persona: p
        });
      }
    }

    return out;
  }

  /**
   * Crea una nueva persona en `aj_personas`. Aplica validación de campos
   * obligatorios (D7) y dedup R-N3.
   *
   * Forma de retorno (D8):
   *   - Sin duplicados: { creada: persona, duplicadosCandidatos: [] }
   *   - Con duplicados, forzarSiDuplicado=false (default):
   *       { creada: null, duplicadosCandidatos: [...] }
   *   - Con duplicados, forzarSiDuplicado=true:
   *       { creada: persona, duplicadosCandidatos: [...] } (informativo)
   *
   * @param {Object} personaData
   * @param {string} personaData.nombre - obligatorio
   * @param {'fisica'|'juridica'} [personaData.type='fisica'] - tipo de persona [NUEVO v5.9]
   * @param {string} [personaData.cotitular]
   * @param {string} [personaData.dni]
   * @param {string} [personaData.telefono]
   * @param {string} [personaData.email]
   * @param {Object} [personaData.direccion]
   * @param {string} [personaData.referenciaInterna]
   * @param {string} [personaData.empresa] - vinculación empresarial Modelo M1 §16.8.3 [NUEVO v5.9]
   * @param {string} [personaData.agenteId] - referencia al agente gestor (canonizado retroactivamente desde v5.7)
   * @param {Object} [personaData.perfilBusqueda] - perfil de búsqueda activa para compradores Inmo §16.2 v5.9 [NUEVO v5.9]
   * @param {string} [personaData.notas]
   * @param {string} [personaData.notasComerciales]
   * @param {string} rolInicial — uno de _ROLES_CANONICOS.
   * @param {{forzarSiDuplicado?: boolean}} [opciones]
   * @returns {{creada: Object|null, duplicadosCandidatos: Array}}
   * @throws {Error} ante violación de contrato (datos faltantes, rol inválido,
   *                 type fuera del enum).
   */
  function personasCrear(personaData, rolInicial, opciones) {
    opciones = opciones || {};
    const forzar = !!opciones.forzarSiDuplicado;
    /* ─── Sub-frente 19.2.A v5.144 — opción permitirSoloNombre canon D-F19-03 vinculante (importador CSV propiedades históricas Inmo Frente 19 NUEVO §30 v5.143) ─── */
    /* Permite crear persona con SOLO `nombre` saltando validación R-N3 estricta (dni/tel/email obligatorio). */
    /* Vinculante coherente decisión Jonatan "propietarios laxo filtrar bien" + flag aditivo requiere_verificacion_datos para auditoría posterior. */
    const permitirSoloNombre = !!opciones.permitirSoloNombre;

    if (!personaData || typeof personaData !== 'object') {
      throw new Error('[ajPersonas] personaData es obligatorio y debe ser objeto');
    }
    if (typeof personaData.nombre !== 'string' || personaData.nombre.trim() === '') {
      throw new Error('[ajPersonas] nombre es obligatorio');
    }
    const tieneDni = typeof personaData.dni === 'string' && personaData.dni.trim() !== '';
    const tieneTel = typeof personaData.telefono === 'string' && personaData.telefono.trim() !== '';
    const tieneEmail = typeof personaData.email === 'string' && personaData.email.trim() !== '';
    if (!tieneDni && !tieneTel && !tieneEmail && !permitirSoloNombre) {
      throw new Error('[ajPersonas] una persona necesita al menos un identificador de contacto: dni, telefono o email (o pasar opciones.permitirSoloNombre: true para importador laxo)');
    }
    _validarRol(rolInicial);

    // Validación de type (CLAUDE.md §16.2 v5.9, R2 + PV1).
    const type = personaData.type || 'fisica';  // default 'fisica' si no se provee
    if (type !== 'fisica' && type !== 'juridica') {
      throw new Error(
        '[ajPersonas] personaData.type debe ser "fisica" o "juridica" (recibido: "' + type + '")'
      );
    }

    const candidatos = personasBuscarPorDedup({
      nombre:   personaData.nombre,
      dni:      personaData.dni,
      telefono: personaData.telefono,
      email:    personaData.email
    });

    if (candidatos.length > 0 && !forzar) {
      return { creada: null, duplicadosCandidatos: candidatos };
    }

    const ahora = new Date().toISOString();
    const nueva = {
      id:        idCodigoHumano('personas'),
      uuid:      idUuid(),
      nombre:    personaData.nombre.trim(),
      type:      type,                                                                      // NUEVO v5.9 (default 'fisica' aplicado en validación arriba)
      cotitular: personaData.cotitular || null,
      dni:       personaData.dni || null,
      telefono:  personaData.telefono || null,
      email:     personaData.email || null,
      direccion: personaData.direccion || null,
      referenciaInterna: personaData.referenciaInterna || null,
      empresa:   typeof personaData.empresa === 'string' && personaData.empresa.trim() !== '' ? personaData.empresa.trim() : null,  // NUEVO v5.9 (trim coherente con sembrarAgentesYColaboradores)
      agenteId:  personaData.agenteId || null,                                              // CANONIZADO v5.7 retroactivo (campo persistido desde Sub-frente 5.3.B)
      perfilBusqueda: personaData.perfilBusqueda || null,                                   // NUEVO v5.9 (PB2 §16.2 v5.9)
      /* ─── Tanda 1 · Ficha 360 (mockups Design "Editar Cliente" — traslado 1:1 al modelo) — campos aditivos v2.24.0 ─── */
      fechaNacimiento: personaData.fechaNacimiento || null,                                 // física · ISO date (mock: "Fecha de nacimiento")
      fechaConstitucion: personaData.fechaConstitucion || null,                             // jurídica · ISO date (mock: "Fecha de constitución (opcional)")
      idioma: (personaData.idioma === 'ca' || personaData.idioma === 'en' || personaData.idioma === 'fr') ? personaData.idioma : 'es',  // mock: "Idioma preferido" (es default · en/fr previstos Capa 8 i18n)
      cif: personaData.cif || null,                                                         // jurídica (mock: CIF — dni queda para físicas)
      representante: personaData.representante || null,                                     // jurídica (mock: "Representante")
      agenteCaptacionId: personaData.agenteCaptacionId || null,                             // mock: "Agente de captación" — dueño de la relación (≠ agente de la operación, que vive en cada op)
      residencia: (personaData.residencia && typeof personaData.residencia === 'object') ? personaData.residencia : null,  // mock: "Asociar con propiedad" — {refCatastral, direccionCanonica, vinculo:'inquilino'|'propietario'|'otro', desde} | null
      rgpd: (personaData.rgpd && typeof personaData.rgpd === 'object') ? personaData.rgpd : { origenDato: null, consentimientoComunicaciones: false, fechaConsentimiento: null },  // mock: "Origen y consentimiento (RGPD)"
      roles:     [rolInicial],
      embudos:   [],                                                                       // NUEVO v2.3.0 (CLAUDE.md §16.11.3 v5.11.1)
      meta:      personaData.meta && typeof personaData.meta === 'object' ? personaData.meta : {},  // NUEVO v2.16.0 (CLAUDE.md §23.3 v5.66 — subobjeto polimórfico canónico ampliación aditiva schema §16.2 Sub-frente 13.2 Frente 13 Módulo Colaboradores Refactor MAYOR)
      /* ─── Sub-frente 19.2.A v5.144 — flag aditivo canon D-F19-03 vinculante (importador CSV propiedades históricas Inmo Frente 19 NUEVO §30 v5.143) ─── */
      /* Flag auditoría posterior cuando persona se crea via importador con datos LAXOS (solo nombre sin contacto verificado). UI Inmo badge "⚠ Verificar datos" en personas flagged. */
      requiere_verificacion_datos: !!personaData.requiere_verificacion_datos,  // NUEVO v2.23.0 aditivo canon Sub-frente 19.2.A
      notas:     personaData.notas || '',
      notasComerciales: personaData.notasComerciales || '',
      createdAt: ahora,
      updatedAt: ahora
    };

    const personas = _leerPersonas();
    personas.push(nueva);
    _persistirPersonas(personas);

    return { creada: nueva, duplicadosCandidatos: candidatos };
  }

  /**
   * Lookup por `id` (código humano AJ-P-NNN). Devuelve la persona o null.
   * @param {string} personaId
   * @returns {Object|null}
   */
  function personasObtener(personaId) {
    const personas = _leerPersonas();
    for (let i = 0; i < personas.length; i++) {
      if (personas[i].id === personaId) return personas[i];
    }
    return null;
  }

  /**
   * Lista personas, opcionalmente filtradas por rol o conjunto de roles.
   *
   * @param {{rol?: string, conRol?: string[]}} [filtros]
   *   - rol: personas que tienen el rol indicado.
   *   - conRol: personas que tienen TODOS los roles listados.
   * @returns {Array}
   */
  function personasListar(filtros) {
    const personas = _leerPersonas();
    if (!filtros) return personas.slice();
    if (filtros.rol !== undefined) {
      return personas.filter(p => Array.isArray(p.roles) && p.roles.indexOf(filtros.rol) !== -1);
    }
    if (Array.isArray(filtros.conRol)) {
      return personas.filter(p => {
        if (!Array.isArray(p.roles)) return false;
        for (let i = 0; i < filtros.conRol.length; i++) {
          if (p.roles.indexOf(filtros.conRol[i]) === -1) return false;
        }
        return true;
      });
    }
    return personas.slice();
  }

  /**
   * Actualiza campos de la persona. Rechaza cambios sobre `id`, `uuid`,
   * `roles`, `createdAt`. Actualiza `updatedAt`.
   *
   * @param {string} personaId
   * @param {Object} cambios
   * @returns {Object} persona actualizada.
   * @throws {Error} si personaId no existe o cambios incluye campo prohibido.
   */
  function personasActualizar(personaId, cambios) {
    if (!cambios || typeof cambios !== 'object') {
      throw new Error('[ajPersonas] cambios debe ser objeto');
    }
    const camposProhibidos = ['id', 'uuid', 'roles', 'createdAt'];
    for (let i = 0; i < camposProhibidos.length; i++) {
      if (Object.prototype.hasOwnProperty.call(cambios, camposProhibidos[i])) {
        throw new Error(
          '[ajPersonas] campo "' + camposProhibidos[i] + '" no se puede modificar mediante actualizar. ' +
          'Para roles usar agregarRol/quitarRol.'
        );
      }
    }

    const personas = _leerPersonas();
    let idx = -1;
    for (let i = 0; i < personas.length; i++) {
      if (personas[i].id === personaId) { idx = i; break; }
    }
    if (idx === -1) {
      throw new Error('[ajPersonas] personaId no encontrado: "' + personaId + '"');
    }

    const ahora = new Date().toISOString();
    const actualizada = Object.assign({}, personas[idx], cambios, { updatedAt: ahora });
    personas[idx] = actualizada;
    _persistirPersonas(personas);
    return actualizada;
  }

  /**
   * Elimina la persona indicada. NO valida R-N1 inversa en Sesión A
   * (entidades operacionales aún no usan personaId).
   *
   * @param {string} personaId
   * @param {{forzar?: boolean}} [opciones] — reservado.
   * @returns {boolean} true si eliminó.
   * @throws {Error} si personaId no existe.
   */
  function personasEliminar(personaId, opciones) {
    opciones = opciones || {};
    const personas = _leerPersonas();
    let idx = -1;
    for (let i = 0; i < personas.length; i++) {
      if (personas[i].id === personaId) { idx = i; break; }
    }
    if (idx === -1) {
      throw new Error('[ajPersonas] personaId no encontrado: "' + personaId + '"');
    }
    personas.splice(idx, 1);
    _persistirPersonas(personas);
    return true;
  }

  /**
   * Añade un rol a la persona. R-N2: si el rol ya está, no-op silencioso.
   *
   * @param {string} personaId
   * @param {string} nuevoRol
   * @returns {Object} persona resultante.
   * @throws {Error} si personaId no existe o nuevoRol no es válido.
   */
  function personasAgregarRol(personaId, nuevoRol) {
    _validarRol(nuevoRol);
    const personas = _leerPersonas();
    let idx = -1;
    for (let i = 0; i < personas.length; i++) {
      if (personas[i].id === personaId) { idx = i; break; }
    }
    if (idx === -1) {
      throw new Error('[ajPersonas] personaId no encontrado: "' + personaId + '"');
    }
    const persona = personas[idx];
    if (!Array.isArray(persona.roles)) persona.roles = [];
    if (persona.roles.indexOf(nuevoRol) !== -1) {
      // R-N2: no-op silencioso, devolver persona sin cambios.
      return persona;
    }
    persona.roles.push(nuevoRol);
    persona.updatedAt = new Date().toISOString();
    _persistirPersonas(personas);
    return persona;
  }

  /**
   * Quita un rol de la persona. Si no lo tiene, no-op. Si quitarlo dejaría
   * roles vacío, lanza error de seguridad: una persona debe tener al menos
   * un rol.
   *
   * @param {string} personaId
   * @param {string} rol
   * @returns {Object} persona resultante.
   * @throws {Error} si personaId no existe, rol inválido, o quitarlo dejaría roles vacío.
   */
  function personasQuitarRol(personaId, rol) {
    _validarRol(rol);
    const personas = _leerPersonas();
    let idx = -1;
    for (let i = 0; i < personas.length; i++) {
      if (personas[i].id === personaId) { idx = i; break; }
    }
    if (idx === -1) {
      throw new Error('[ajPersonas] personaId no encontrado: "' + personaId + '"');
    }
    const persona = personas[idx];
    if (!Array.isArray(persona.roles)) persona.roles = [];
    const pos = persona.roles.indexOf(rol);
    if (pos === -1) {
      // No-op: persona no tenía el rol.
      return persona;
    }
    if (persona.roles.length === 1) {
      throw new Error('[ajPersonas] no se puede quitar el último rol; una persona debe tener al menos un rol');
    }
    persona.roles.splice(pos, 1);
    persona.updatedAt = new Date().toISOString();
    _persistirPersonas(personas);
    return persona;
  }

  /**
   * Devuelve personas que tienen el rol indicado.
   *
   * @param {string} rol
   * @returns {Array}
   * @throws {Error} si rol no es válido.
   */
  function personasBuscarPorRol(rol) {
    _validarRol(rol);
    return personasListar({ rol: rol });
  }

  // ─────────────────────────────────────────────────────────────────────
  //  Métodos del campo `embudos[]` (NUEVO v2.3.0 — CLAUDE.md §16.11.4
  //  v5.11.1). Patrón canónico replica personasAgregarRol/QuitarRol/
  //  BuscarPorRol byte por byte (loop manual con idx, idempotencia
  //  silenciosa, retorno persona completa).
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Añade entrada activa al array `embudos[]` de una persona.
   *
   * IMPORTANTE — Distinción nominal: este método API es DISTINTO del atributo
   * legacy `o.enEmbudo` (boolean) en operaciones del kanban. Aquí
   * `AJ.personas.agregarEmbudo()` opera sobre `aj_personas[i].embudos[]`
   * (campo añadido en v2.3.0 según CLAUDE.md §16.11.3 v5.11.1).
   *
   * Idempotencia pura R-N2: si la persona YA tiene entrada activa
   * (`estado === 'activo'`) en ese embudo, retorna la persona sin duplicar la
   * entrada NI modificar atributos. Para actualizar atributos: primero
   * `quitarEmbudo` (cierra con `estado: 'perdido'` + `hasta: now`) + luego
   * `agregarEmbudo` (abre entrada nueva).
   *
   * Estados canonizados en §16.11.3 son 4 ('activo', 'ganado', 'perdido',
   * 'pausa') pero esta versión v2.3.0 SOLO genera 'activo'. Los estados
   * 'ganado' y 'pausa' se implementarán en Sub-frente 5.6 cuando emerja caso
   * operativo (UIs Seguimientos).
   *
   * @param {string} personaId - ID canónico de la persona (AJ-P-NNN).
   * @param {string} embudo - Embudo canónico (debe estar en _EMBUDOS_CANONICOS).
   * @param {Object} [opciones={}] - Opciones de la entrada.
   * @param {string|null} [opciones.agenteId=null] - Agente asignado.
   * @param {string|null} [opciones.notas=null] - Notas operativas.
   * @param {string} [opciones.desde] - ISO timestamp entrada (default: now).
   * @returns {Object} La persona completa (objeto entero), coherente con
   *                   `personasAgregarRol`. Si idempotente: misma persona sin
   *                   cambios.
   * @throws {Error} si personaId no existe o embudo no es canónico.
   */
  /* Estados en los que puede quedar el embudo de una persona.
     `descartado` (nuevo, 28-ago) NO es `perdido`: perdido es que se peleó la
     operación y se perdió; descartado es que no se llegó a coger. Lo usa
     Finances con los compradores que le derivan de Inmobiliaria. La distinción
     es la del canon §4.7. */
  const _ESTADOS_EMBUDO_PERSONA = Object.freeze([
    'activo', 'ganado', 'perdido', 'pausa', 'descartado'
  ]);

  /**
   * Cierra (o reabre) el embudo de una persona dejándolo en otro estado.
   *
   * Si no existe entrada para ese embudo se crea ya en el estado pedido: eso
   * permite que Finances descarte a un comprador derivado sobre el que nunca
   * llegó a abrir nada.
   *
   * Volver a 'activo' limpia `hasta`, para que reabrir no deje una fecha de
   * cierre mintiendo.
   *
   * @param {string} personaId
   * @param {string} embudo   uno de _EMBUDOS_CANONICOS
   * @param {string} estado   uno de _ESTADOS_EMBUDO_PERSONA
   * @param {Object} [opciones] {notas, agenteId, hasta}
   * @returns {Object} la persona
   */
  function personasCerrarEmbudo(personaId, embudo, estado, opciones) {
    _validarEmbudo(embudo);
    if (_ESTADOS_EMBUDO_PERSONA.indexOf(estado) === -1) {
      throw new Error(
        '[ajPersonas] estado de embudo inválido: "' + estado + '" (válidos: ' +
        _ESTADOS_EMBUDO_PERSONA.join(', ') + ')'
      );
    }
    opciones = opciones || {};
    const personas = _leerPersonas();
    let idx = -1;
    for (let i = 0; i < personas.length; i++) {
      if (personas[i].id === personaId) { idx = i; break; }
    }
    if (idx === -1) {
      throw new Error('[ajPersonas] personaId no encontrado: "' + personaId + '"');
    }
    const persona = personas[idx];
    if (!Array.isArray(persona.embudos)) persona.embudos = [];
    const ahora = new Date().toISOString();
    const cierra = (estado !== 'activo');

    let e = null;
    for (let j = 0; j < persona.embudos.length; j++) {
      if (persona.embudos[j].embudo === embudo) { e = persona.embudos[j]; break; }
    }
    if (!e) {
      e = { embudo: embudo, desde: ahora, estado: estado, agenteId: null, notas: null, hasta: null };
      persona.embudos.push(e);
    }
    e.estado = estado;
    e.hasta  = cierra ? (opciones.hasta || ahora) : null;
    if (opciones.notas    !== undefined) e.notas    = opciones.notas;
    if (opciones.agenteId !== undefined) e.agenteId = opciones.agenteId;

    persona.updatedAt = ahora;
    _persistirPersonas(personas);
    return persona;
  }

  function personasAgregarEmbudo(personaId, embudo, opciones) {
    _validarEmbudo(embudo);
    opciones = opciones || {};
    const personas = _leerPersonas();
    let idx = -1;
    for (let i = 0; i < personas.length; i++) {
      if (personas[i].id === personaId) { idx = i; break; }
    }
    if (idx === -1) {
      throw new Error('[ajPersonas] personaId no encontrado: "' + personaId + '"');
    }
    const persona = personas[idx];
    if (!Array.isArray(persona.embudos)) persona.embudos = [];
    // Idempotencia pura: si ya hay entrada activa, retornar persona sin cambios.
    for (let j = 0; j < persona.embudos.length; j++) {
      const e = persona.embudos[j];
      if (e.embudo === embudo && e.estado === 'activo') {
        return persona;
      }
    }
    // Crear nueva entrada activa.
    persona.embudos.push({
      embudo:   embudo,
      desde:    opciones.desde || new Date().toISOString(),
      estado:   'activo',
      agenteId: opciones.agenteId || null,
      notas:    opciones.notas || null,
      hasta:    null
    });
    persona.updatedAt = new Date().toISOString();
    _persistirPersonas(personas);
    return persona;
  }

  /**
   * Marca como 'perdido' la entrada activa de un embudo en una persona.
   * NO elimina la entrada del array — preserva historial completo.
   *
   * Idempotencia silenciosa: si no hay entrada activa en ese embudo (porque
   * nunca la hubo o ya fue cerrada), retorna persona sin cambios.
   *
   * A diferencia de `personasQuitarRol`, NO lanza Error si `embudos[]` queda
   * vacío. Una persona puede tener `embudos: []` válido (no es invariante
   * mantener al menos un embudo).
   *
   * @param {string} personaId - ID canónico de la persona.
   * @param {string} embudo - Embudo canónico.
   * @returns {Object} La persona completa con la entrada cerrada (o persona
   *                   sin cambios si era idempotente). Coherente con
   *                   `personasQuitarRol`.
   * @throws {Error} si personaId no existe o embudo no es canónico.
   */
  function personasQuitarEmbudo(personaId, embudo) {
    _validarEmbudo(embudo);
    const personas = _leerPersonas();
    let idx = -1;
    for (let i = 0; i < personas.length; i++) {
      if (personas[i].id === personaId) { idx = i; break; }
    }
    if (idx === -1) {
      throw new Error('[ajPersonas] personaId no encontrado: "' + personaId + '"');
    }
    const persona = personas[idx];
    if (!Array.isArray(persona.embudos)) persona.embudos = [];
    // Buscar entrada activa.
    let entradaActiva = null;
    for (let j = 0; j < persona.embudos.length; j++) {
      const e = persona.embudos[j];
      if (e.embudo === embudo && e.estado === 'activo') {
        entradaActiva = e;
        break;
      }
    }
    if (entradaActiva === null) {
      // Idempotencia silenciosa: persona sin cambios.
      return persona;
    }
    entradaActiva.estado = 'perdido';
    entradaActiva.hasta  = new Date().toISOString();
    persona.updatedAt = new Date().toISOString();
    _persistirPersonas(personas);
    return persona;
  }

  /**
   * Predicado de visibilidad: ¿está la persona actualmente con
   * `estado === 'activo'` en ese embudo?
   *
   * IMPORTANTE — Distinción nominal: este método API
   * `AJ.personas.enEmbudo()` es DISTINTO del atributo legacy `o.enEmbudo`
   * (boolean) en operaciones del kanban. Operan sobre namespaces y entidades
   * distintas:
   *   - `AJ.personas.enEmbudo(personaId, embudo, agenteId?)` → predicado
   *     sobre `aj_personas[i].embudos[]` (este método).
   *   - `op.enEmbudo` → atributo boolean en `aj_personas[i].operaciones[j]`
   *     que indica si la operación está visible en kanban (legacy).
   *
   * Si se proporciona `agenteId` opcional, también verifica que coincida con
   * el `agenteId` de la entrada activa (AND cliente Y agente_propio).
   * Predicado canónico para reemplazar filtros legacy `c.ops.some()` que
   * combinan presencia en embudo + asignación a agente (3 filtros M-013 en
   * `seguimiento-operaciones-aj.html`: F-07/F-09/F-10 según §16.11.7).
   *
   * Comportamiento ante `personaId` inexistente: retorna `false` (semántica
   * de predicado boolean, NO lanza Error).
   *
   * @param {string} personaId
   * @param {string} embudo
   * @param {string} [agenteId] - Si se proporciona, AND con agenteId de la
   *                              entrada activa.
   * @returns {boolean}
   * @throws {Error} si embudo no es canónico.
   */
  function personasEnEmbudo(personaId, embudo, agenteId) {
    _validarEmbudo(embudo);
    const personas = _leerPersonas();
    let idx = -1;
    for (let i = 0; i < personas.length; i++) {
      if (personas[i].id === personaId) { idx = i; break; }
    }
    if (idx === -1) return false;
    const persona = personas[idx];
    if (!Array.isArray(persona.embudos)) return false;
    for (let j = 0; j < persona.embudos.length; j++) {
      const e = persona.embudos[j];
      if (e.embudo === embudo && e.estado === 'activo') {
        if (typeof agenteId === 'undefined') return true;
        return e.agenteId === agenteId;
      }
    }
    return false;
  }

  /**
   * Lista los embudos en los que la persona está actualmente activa.
   * Útil para mostrar contexto cross-suite en ficha de persona (M-012
   * sub-mejora 12.b).
   *
   * Comportamiento ante `personaId` inexistente: retorna `[]` (semántica de
   * listado vacío).
   *
   * @param {string} personaId
   * @returns {Array<Object>} Array de entradas activas (estado === 'activo').
   *                          Cada entrada tiene los 6 atributos canónicos:
   *                          embudo, desde, estado, agenteId, notas, hasta.
   */
  function personasListarEmbudos(personaId) {
    const personas = _leerPersonas();
    let idx = -1;
    for (let i = 0; i < personas.length; i++) {
      if (personas[i].id === personaId) { idx = i; break; }
    }
    if (idx === -1) return [];
    const persona = personas[idx];
    if (!Array.isArray(persona.embudos)) return [];
    const activos = [];
    for (let j = 0; j < persona.embudos.length; j++) {
      if (persona.embudos[j].estado === 'activo') {
        activos.push(persona.embudos[j]);
      }
    }
    return activos;
  }

  /**
   * Busca personas activamente en un embudo, con filtros opcionales.
   * Reemplazo canónico de filtros legacy `c.ops.some()` en pestañas de
   * personas (3 filtros M-013 en `seguimiento-operaciones-aj.html`).
   *
   * @param {string} embudo - Embudo canónico.
   * @param {Object} [filtros={}] - Filtros opcionales sobre la entrada activa.
   * @param {string} [filtros.agenteId] - Solo personas con este agente
   *                                       asignado en la entrada activa.
   * @returns {Array<Object>} Array de personas (objetos completos) que tienen
   *                          entrada activa en `embudo` que cumple los filtros.
   * @throws {Error} si embudo no es canónico.
   */
  function personasBuscarEnEmbudo(embudo, filtros) {
    _validarEmbudo(embudo);
    filtros = filtros || {};
    const personas = _leerPersonas();
    const resultado = [];
    for (let i = 0; i < personas.length; i++) {
      const persona = personas[i];
      if (!Array.isArray(persona.embudos)) continue;
      for (let j = 0; j < persona.embudos.length; j++) {
        const e = persona.embudos[j];
        if (e.embudo !== embudo) continue;
        if (e.estado !== 'activo') continue;
        if (typeof filtros.agenteId !== 'undefined' && e.agenteId !== filtros.agenteId) continue;
        resultado.push(persona);
        break;
      }
    }
    return resultado;
  }

  /**
   * Fusiona dos personas: la "eliminada" se absorbe en la "mantenida". La
   * mantenida queda con roles unidos (sin duplicar) y datos de contacto
   * fusionados (mantenida tiene precedencia, campos vacíos se rellenan
   * desde la absorbida).
   *
   * NOTA importante: NO propaga referencias en Sesión A. Solo opera sobre
   * `aj_personas`. La propagación a entidades operacionales se hace en
   * Sub-frente 5.4.
   *
   * @param {string} personaIdEliminar
   * @param {string} personaIdMantener
   * @param {Object} [opciones] — reservado.
   * @returns {Object} la persona mantenida actualizada.
   * @throws {Error} si alguna no existe o si son iguales.
   */
  function personasFusionar(personaIdEliminar, personaIdMantener, opciones) {
    opciones = opciones || {};
    if (personaIdEliminar === personaIdMantener) {
      throw new Error('[ajPersonas] no se puede fusionar persona consigo misma');
    }
    const personas = _leerPersonas();
    let idxEli = -1;
    let idxMan = -1;
    for (let i = 0; i < personas.length; i++) {
      if (personas[i].id === personaIdEliminar)  idxEli = i;
      if (personas[i].id === personaIdMantener)  idxMan = i;
    }
    if (idxEli === -1) {
      throw new Error('[ajPersonas] personaIdEliminar no encontrado: "' + personaIdEliminar + '"');
    }
    if (idxMan === -1) {
      throw new Error('[ajPersonas] personaIdMantener no encontrado: "' + personaIdMantener + '"');
    }

    const eli = personas[idxEli];
    const man = personas[idxMan];

    // Unir roles sin duplicar.
    const rolesUnidos = Array.isArray(man.roles) ? man.roles.slice() : [];
    const rolesEli = Array.isArray(eli.roles) ? eli.roles : [];
    for (let i = 0; i < rolesEli.length; i++) {
      if (rolesUnidos.indexOf(rolesEli[i]) === -1) rolesUnidos.push(rolesEli[i]);
    }

    // Fusionar campos de contacto: mantenida tiene precedencia; campos
    // vacíos (null o cadena vacía) se rellenan desde la absorbida.
    function vacio(v) { return v === null || v === undefined || v === ''; }
    const camposContacto = ['cotitular', 'dni', 'telefono', 'email', 'direccion', 'referenciaInterna'];
    const fusionada = Object.assign({}, man);
    for (let i = 0; i < camposContacto.length; i++) {
      const k = camposContacto[i];
      if (vacio(fusionada[k]) && !vacio(eli[k])) {
        fusionada[k] = eli[k];
      }
    }
    fusionada.roles = rolesUnidos;
    fusionada.updatedAt = new Date().toISOString();

    // Persistir la mantenida actualizada y eliminar la absorbida.
    personas[idxMan] = fusionada;
    // Recalcular idx de eliminada porque puede haberse desplazado tras Object.assign? No: Object.assign no afecta índices.
    personas.splice(idxEli, 1);
    _persistirPersonas(personas);

    // Disparo de reconciliación (D1 Sub-frente 5.2 Sesión B).
    // La fusión cambia el personaId de las entidades origen que apuntaban
    // a personaIdEliminar; sus seguimientos quedan con personaId
    // desactualizado. Reconciliar inmediatamente.
    try {
      seguimientos.reconciliarPersonaIds();
    } catch (errRec) {
      console.warn('[personasFusionar] reconciliación post-fusión falló: ' + errRec.message);
    }

    return fusionada;
  }

  /**
   * Migra el modelo legacy aj_clientes (con operaciones embebidas y notes
   * embebidos) al modelo canónico Frente 5: aj_personas + aj_operaciones +
   * aj_seguimientos.
   *
   * Idempotente vía flag aj_migracion_frente5_completada.
   *
   * Tolera datos corruptos: warning en consola y descarta entrada
   * problemática, continúa con el resto. Comportamiento aceptable durante
   * fase de pruebas (D-N2). Cuando el sistema entre en uso operativo real,
   * esta tolerancia se revisará.
   *
   * Tras completar, dispara seguimientos.reconciliarPersonaIds() como
   * verificación final.
   *
   * @returns {Object} reporte: {personasCreadas, operacionesCreadas,
   *                              seguimientosCreados, descartadas,
   *                              backupKey, ya_completada,
   *                              reporteReconciliacion}
   */
  function migrarFrente5() {
    // Paso 6 (verificado primero por idempotencia R-N4):
    if (store.get('aj_migracion_frente5_completada') === true) {
      return {
        ya_completada: true,
        personasCreadas: 0,
        operacionesCreadas: 0,
        seguimientosCreados: 0,
        descartadas: 0,
        backupKey: null
      };
    }

    // Paso 1: leer aj_clientes legacy.
    const clientesLegacy = store.get('aj_clientes');
    if (!Array.isArray(clientesLegacy)) {
      // Sin datos legacy, marcar migración como completada vacía.
      store.set('aj_migracion_frente5_completada', true);
      return {
        ya_completada: false,
        personasCreadas: 0,
        operacionesCreadas: 0,
        seguimientosCreados: 0,
        descartadas: 0,
        backupKey: null
      };
    }

    // Paso 2: backup explícito con timestamp YYYYMMDD.
    const fecha = new Date();
    const yyyymmdd = fecha.getFullYear().toString() +
                     String(fecha.getMonth() + 1).padStart(2, '0') +
                     String(fecha.getDate()).padStart(2, '0');
    const backupKey = 'aj_clientes_backup_pre_frente5_' + yyyymmdd;
    store.set(backupKey, clientesLegacy);

    // Estado de migración.
    const personasNuevas = [];
    const operacionesNuevas = [];
    const seguimientosNuevos = [];
    let descartadas = 0;
    const ahora = new Date().toISOString();

    // Pasos 3, 4, 5: por cada cliente legacy.
    for (let i = 0; i < clientesLegacy.length; i++) {
      const cliLegacy = clientesLegacy[i];
      try {
        // Paso 3: extraer datos de persona.
        if (!cliLegacy || typeof cliLegacy !== 'object') {
          console.warn('[migrarFrente5] entrada inválida en aj_clientes[' + i + '], se descarta:', cliLegacy);
          descartadas++;
          continue;
        }
        if (typeof cliLegacy.nombre !== 'string' || cliLegacy.nombre.trim() === '') {
          console.warn('[migrarFrente5] cliente sin nombre en índice ' + i + ', se descarta');
          descartadas++;
          continue;
        }

        const personaId = idCodigoHumano('personas');
        const persona = {
          id: personaId,
          uuid: idUuid(),
          nombre: cliLegacy.nombre.trim(),
          cotitular: cliLegacy.cotitular || null,
          dni: cliLegacy.dni || null,
          telefono: cliLegacy.telefono || null,
          email: cliLegacy.email || null,
          direccion: cliLegacy.direccion || null,
          referenciaInterna: cliLegacy.referenciaInterna || null,
          roles: ['cliente_finances'],
          notas: cliLegacy.notas || '',
          notasComerciales: cliLegacy.notasComerciales || '',
          createdAt: cliLegacy.createdAt || ahora,
          updatedAt: ahora
        };
        personasNuevas.push(persona);

        // Paso 4: por cada operación embebida, crear entrada en aj_operaciones.
        const operacionesLegacy = Array.isArray(cliLegacy.operaciones) ? cliLegacy.operaciones : [];
        for (let j = 0; j < operacionesLegacy.length; j++) {
          const opLegacy = operacionesLegacy[j];
          if (!opLegacy || typeof opLegacy !== 'object') {
            console.warn('[migrarFrente5] operación inválida en cliente[' + i + '].operaciones[' + j + '], se descarta');
            continue;
          }

          const opId = idCodigoHumano('finances');
          const operacion = Object.assign({}, opLegacy, {
            // Sobreescribir id y uuid para garantizar canonicidad post-migración.
            id: opId,
            uuid: idUuid(),
            personaId: personaId,
            createdAt: opLegacy.createdAt || ahora,
            updatedAt: ahora
          });
          // Eliminar el array notes embebido — va a aj_seguimientos.
          delete operacion.notes;
          operacionesNuevas.push(operacion);

          // Paso 5: por cada nota embebida, crear seguimiento.
          const notasLegacy = Array.isArray(opLegacy.notes) ? opLegacy.notes : [];
          for (let k = 0; k < notasLegacy.length; k++) {
            const nota = notasLegacy[k];
            if (!nota || typeof nota !== 'object' || typeof nota.text !== 'string') {
              console.warn('[migrarFrente5] nota inválida en cliente[' + i + '].operaciones[' + j + '].notes[' + k + '], se descarta');
              continue;
            }
            const seguimiento = {
              id: idCodigoHumano('seguimientos'),
              uuid: idUuid(),
              entidadOrigen: 'operacion_finances',
              entidadId: opId,
              personaId: personaId,
              tipo: 'nota',
              texto: nota.text,
              autorId: nota.author || 'sistema_migracion',
              autorNombre: nota.author || 'Migración Frente 5',
              fecha: nota.date || ahora,
              system: nota.system === true,
              createdAt: nota.date || ahora,
              updatedAt: ahora
            };
            seguimientosNuevos.push(seguimiento);
          }
        }
      } catch (errCli) {
        console.warn('[migrarFrente5] error procesando cliente índice ' + i + ': ' + errCli.message + ', se descarta');
        descartadas++;
      }
    }

    // Persistencia atómica de las 3 tablas nuevas.
    store.set('aj_personas', personasNuevas);
    store.set('aj_operaciones', operacionesNuevas);
    store.set('aj_seguimientos', seguimientosNuevos);

    // Paso 6: persistir flag de migración completada.
    store.set('aj_migracion_frente5_completada', true);

    // Reconciliación final (D1: tras migración, dispara reconciliación).
    let reporteReconciliacion = null;
    try {
      reporteReconciliacion = seguimientos.reconciliarPersonaIds();
    } catch (errRec) {
      console.warn('[migrarFrente5] reconciliación post-migración falló: ' + errRec.message);
    }

    return {
      ya_completada: false,
      personasCreadas: personasNuevas.length,
      operacionesCreadas: operacionesNuevas.length,
      seguimientosCreados: seguimientosNuevos.length,
      descartadas: descartadas,
      backupKey: backupKey,
      reporteReconciliacion: reporteReconciliacion
    };
  }

  /**
   * Migra datos productivos de tablas legacy Inmo (aj_inmo_compradores +
   * aj_inmo_captaciones) a aj_personas según modelo unificado v5.7+.
   *
   * Canonizada en CLAUDE.md §16.9.2 (Sub-frente 5.4 S2).
   *
   * Algoritmo:
   * 1. Si flag aj_migracion_frente5_inmo_completada está activo, return idempotente.
   * 2. Migrar aj_inmo_compradores: cada entrada → persona con rol 'comprador_inmo'
   *    + perfilBusqueda con 7 campos (PB2). Traducir agenteId legacy a personaId
   *    canónico vía dedup R-N3 sobre nombre.
   * 3. Migrar aj_inmo_captaciones: cada entrada → persona con rol 'vendedor_inmo'.
   *    Solo titular principal (CT1). Traducir agenteId legacy igual que en (2).
   * 4. Tolerar entradas malformadas con descarte silencioso + reporte.
   * 5. Marcar flag de migración completada.
   *
   * @returns {{
   *   ya_completada: boolean,
   *   migrados: number,
   *   descartados: number,
   *   compradoresMigrados: number,
   *   captacionesMigradas: number,
   *   detalles: Array<{tabla, entidadIdLegacy, personaIdNuevo, motivo}>,
   *   motivosDescarte: Array<{tabla, entidadIdLegacy, motivo}>,
   *   agentesNoEncontrados: Array<{agenteIdLegacy, ocurrencias}>
   * }}
   */
  function migrarFrente5Inmo() {
    const reporte = {
      ya_completada: false,
      migrados: 0,
      descartados: 0,
      compradoresMigrados: 0,
      captacionesMigradas: 0,
      detalles: [],
      motivosDescarte: [],
      agentesNoEncontrados: []
    };

    // Idempotencia (R-N4 análoga a migrarFrente5).
    if (store.get('aj_migracion_frente5_inmo_completada') === true) {
      reporte.ya_completada = true;
      return reporte;
    }

    const ahora = new Date().toISOString();

    // Mapa interno para trazar agentesNoEncontrados.
    const agentesFalladosMap = {};
    function registrarAgenteNoEncontrado(agenteIdLegacy) {
      if (!agentesFalladosMap[agenteIdLegacy]) {
        agentesFalladosMap[agenteIdLegacy] = 0;
      }
      agentesFalladosMap[agenteIdLegacy]++;
    }

    // Helper: traduce agenteId legacy a personaId canónico vía dedup R-N3.
    // Patrón análogo a resolverAgenteId() de reconciliarAgenteIds.
    function traducirAgenteId(agenteIdLegacy) {
      if (typeof agenteIdLegacy !== 'string' || agenteIdLegacy.trim() === '') {
        return null;
      }
      // Si ya es canónico AJ-P-NNN, devolver tal cual.
      if (/^AJ-P-\d{3,}$/.test(agenteIdLegacy)) {
        return agenteIdLegacy;
      }
      // Heurística de nombre.
      let nombreCandidato = null;
      if (agenteIdLegacy === 'admin') nombreCandidato = 'Jonatan';
      else {
        const partes = agenteIdLegacy.split('_');
        nombreCandidato = partes[0] || null;
      }
      if (!nombreCandidato) return null;
      const candidatos = personasBuscarPorDedup({nombre: nombreCandidato});
      if (candidatos.length === 0) {
        registrarAgenteNoEncontrado(agenteIdLegacy);
        return null;
      }
      return candidatos[0].personaId;
    }

    // 1. Migrar aj_inmo_compradores.
    const compradoresLegacy = store.get('aj_inmo_compradores');
    if (Array.isArray(compradoresLegacy)) {
      const personasActuales = _leerPersonas();
      for (let i = 0; i < compradoresLegacy.length; i++) {
        const c = compradoresLegacy[i];
        try {
          if (!c || typeof c !== 'object') {
            reporte.descartados++;
            reporte.motivosDescarte.push({
              tabla: 'aj_inmo_compradores',
              entidadIdLegacy: c && c.id ? c.id : '<sin id>',
              motivo: 'entrada_no_objeto'
            });
            continue;
          }
          if (typeof c.nombre !== 'string' || c.nombre.trim() === '') {
            reporte.descartados++;
            reporte.motivosDescarte.push({
              tabla: 'aj_inmo_compradores',
              entidadIdLegacy: c.id || '<sin id>',
              motivo: 'sin_nombre'
            });
            continue;
          }

          // Construir perfilBusqueda con los 7 campos (PB2).
          const perfilBusqueda = {
            tipoInmueble:           c.tipoInmueble || null,
            zonasInteres:           c.zonasInteres || null,
            presupuesto:            c.presupuesto || null,
            habitaciones:           c.habitaciones || null,
            m2Min:                  c.m2Min || null,
            otrasCaracteristicas:   c.otrasCaracteristicas || null,
            perfilFinanciero:       c.perfilFinanciero || null
          };

          // Traducir agenteId si existe.
          let agenteIdCanonico = null;
          if (typeof c.agenteId === 'string') {
            agenteIdCanonico = traducirAgenteId(c.agenteId);
          }

          const personaId = idCodigoHumano('personas');
          const nuevaPersona = {
            id: personaId,
            uuid: idUuid(),
            nombre: c.nombre.trim(),
            type: 'fisica',
            cotitular: c.cotitular || null,
            dni: c.dni || null,
            telefono: c.telefono || null,
            email: c.email || null,
            direccion: c.direccion || null,
            referenciaInterna: c.referenciaInterna || null,
            empresa: null,
            agenteId: agenteIdCanonico,
            perfilBusqueda: perfilBusqueda,
            roles: ['comprador_inmo'],
            notas: c.notas || '',
            notasComerciales: c.notasComerciales || '',
            createdAt: c.createdAt || ahora,
            updatedAt: ahora
          };
          personasActuales.push(nuevaPersona);
          reporte.migrados++;
          reporte.compradoresMigrados++;
          reporte.detalles.push({
            tabla: 'aj_inmo_compradores',
            entidadIdLegacy: c.id || '<sin id>',
            personaIdNuevo: personaId,
            motivo: 'migrado_ok'
          });
        } catch (errC) {
          reporte.descartados++;
          reporte.motivosDescarte.push({
            tabla: 'aj_inmo_compradores',
            entidadIdLegacy: c && c.id ? c.id : '<sin id>',
            motivo: 'error_runtime: ' + errC.message
          });
        }
      }
      _persistirPersonas(personasActuales);
    }

    // 2. Migrar aj_inmo_captaciones (solo titular principal — CT1).
    const captacionesLegacy = store.get('aj_inmo_captaciones');
    if (Array.isArray(captacionesLegacy)) {
      const personasActuales = _leerPersonas();
      for (let i = 0; i < captacionesLegacy.length; i++) {
        const cap = captacionesLegacy[i];
        try {
          if (!cap || typeof cap !== 'object') {
            reporte.descartados++;
            reporte.motivosDescarte.push({
              tabla: 'aj_inmo_captaciones',
              entidadIdLegacy: cap && cap.id ? cap.id : '<sin id>',
              motivo: 'entrada_no_objeto'
            });
            continue;
          }
          if (typeof cap.nombre !== 'string' || cap.nombre.trim() === '') {
            reporte.descartados++;
            reporte.motivosDescarte.push({
              tabla: 'aj_inmo_captaciones',
              entidadIdLegacy: cap.id || '<sin id>',
              motivo: 'sin_nombre'
            });
            continue;
          }

          let agenteIdCanonico = null;
          if (typeof cap.agenteId === 'string') {
            agenteIdCanonico = traducirAgenteId(cap.agenteId);
          }

          const personaId = idCodigoHumano('personas');
          const nuevaPersona = {
            id: personaId,
            uuid: idUuid(),
            nombre: cap.nombre.trim(),
            type: 'fisica',
            cotitular: null,  // CT1: cotitulares NO se migran en S2; preservados en tabla legacy
            dni: cap.dni || null,
            telefono: cap.telefono || null,
            email: cap.email || null,
            direccion: cap.direccion || null,
            referenciaInterna: cap.referenciaInterna || null,
            empresa: null,
            agenteId: agenteIdCanonico,
            perfilBusqueda: null,
            roles: ['vendedor_inmo'],
            notas: cap.notas || '',
            notasComerciales: cap.notasComerciales || '',
            createdAt: cap.createdAt || ahora,
            updatedAt: ahora
          };
          personasActuales.push(nuevaPersona);
          reporte.migrados++;
          reporte.captacionesMigradas++;
          reporte.detalles.push({
            tabla: 'aj_inmo_captaciones',
            entidadIdLegacy: cap.id || '<sin id>',
            personaIdNuevo: personaId,
            motivo: 'migrado_ok'
          });
        } catch (errCap) {
          reporte.descartados++;
          reporte.motivosDescarte.push({
            tabla: 'aj_inmo_captaciones',
            entidadIdLegacy: cap && cap.id ? cap.id : '<sin id>',
            motivo: 'error_runtime: ' + errCap.message
          });
        }
      }
      _persistirPersonas(personasActuales);
    }

    // Consolidar agentesNoEncontrados.
    const claves = Object.keys(agentesFalladosMap);
    for (let k = 0; k < claves.length; k++) {
      reporte.agentesNoEncontrados.push({
        agenteIdLegacy: claves[k],
        ocurrencias: agentesFalladosMap[claves[k]]
      });
    }

    // Marcar flag de migración completada.
    store.set('aj_migracion_frente5_inmo_completada', true);

    // Resumen.
    if (typeof console !== 'undefined' && typeof console.info === 'function') {
      console.info('[ajPersonas] migrarFrente5Inmo: ' +
                   reporte.migrados + ' migrados (' + reporte.compradoresMigrados + ' compradores + ' +
                   reporte.captacionesMigradas + ' captaciones), ' +
                   reporte.descartados + ' descartados, ' +
                   reporte.agentesNoEncontrados.length + ' agentes no encontrados.');
    }

    return reporte;
  }

  /**
   * Migra personas existentes derivando entradas activas en `embudos[]` desde
   * `roles[]` (los 5 roles-embudo canonizados) según CLAUDE.md §16.11.5 v5.11.1.
   *
   * NOTA SOBRE DIVERGENCIA DE PATRÓN: las migraciones legacy `migrarFrente5` y
   * `migrarFrente5Inmo` usan flag GLOBAL (`aj_migracion_frente5_completada`)
   * porque son transformaciones one-shot históricas (legacy → nuevo modelo,
   * ejecutadas 1 vez al actualizar versión). `migrarFrente55Embudos` usa
   * idempotencia PER-PERSONA porque tiene semántica distinta: corre en CADA
   * `initApp()` (cada carga de página) para migrar personas creadas POST-Sesión
   * código 1 (ej. M-001 botón 'Nuevo Cliente' Finances). Es derivación continua,
   * NO one-shot histórica. Divergencia justificada por diferencia semántica.
   *
   * Idempotencia per-persona: si `persona.embudos` ya no vacío, NO migrar esa
   * persona. Robusto contra ejecuciones repetidas, ediciones manuales y
   * creaciones post-migración.
   *
   * Para cada persona con `roles[]` no vacío:
   *   - Itera `roles[]`.
   *   - Para cada rol que sea uno de los 5 roles-embudo (cliente_finances,
   *     comprador_inmo, vendedor_inmo, propietario, colaborador), crea entrada
   *     activa en `embudos[]` con `desde=persona.createdAt` (preserva historial
   *     real), `agenteId=persona.agenteId || null`, `estado='activo'`.
   *   - Roles-staff (`agente_finances`, `agente_inmo`, `supervisor`) NO generan
   *     entradas en `embudos[]`.
   *
   * Cobertura §16.11.5: las colecciones legacy `aj_clientes` (con rol
   * `cliente_finances`) y `aj_inmo_compradores`/`aj_inmo_captaciones` (con roles
   * `comprador_inmo`/`vendedor_inmo`) ya fueron migradas a `aj_personas` por
   * `migrarFrente5`/`migrarFrente5Inmo`. La derivación desde `roles[]` aquí es
   * la implementación canónica de "presencia en colecciones legacy
   * correspondientes" tras esas migraciones.
   *
   * @returns {{
   *   totalPersonas: number,
   *   migradas: number,
   *   omitidasYaPobladas: number,
   *   entradasCreadas: number
   * }}
   */
  function migrarFrente55Embudos() {
    const personas = _leerPersonas();
    let migradas = 0;
    let omitidasYaPobladas = 0;
    let entradasCreadas = 0;

    for (let i = 0; i < personas.length; i++) {
      const persona = personas[i];

      // Idempotencia per-persona: si ya hay embudos[] no vacío, saltar.
      if (Array.isArray(persona.embudos) && persona.embudos.length > 0) {
        omitidasYaPobladas++;
        continue;
      }

      // Inicializar embudos[] si no existe.
      if (!Array.isArray(persona.embudos)) {
        persona.embudos = [];
      }

      // Si no tiene roles[], saltar (no hay nada que derivar).
      if (!Array.isArray(persona.roles) || persona.roles.length === 0) {
        continue;
      }

      // Iterar roles y derivar entradas para los 5 roles-embudo. Roles-staff
      // (agente_finances, agente_inmo, supervisor) se ignoran porque NO están
      // en _EMBUDOS_CANONICOS.
      for (let j = 0; j < persona.roles.length; j++) {
        const rol = persona.roles[j];
        if (_EMBUDOS_CANONICOS.indexOf(rol) === -1) continue;

        persona.embudos.push({
          embudo:   rol,
          desde:    persona.createdAt,                            // preserva historial real
          estado:   'activo',
          agenteId: persona.agenteId || null,
          notas:    null,
          hasta:    null
        });
        entradasCreadas++;
      }

      if (persona.embudos.length > 0) {
        persona.updatedAt = new Date().toISOString();
        migradas++;
      }
    }

    if (migradas > 0) {
      _persistirPersonas(personas);
    }

    return {
      totalPersonas:      personas.length,
      migradas:           migradas,
      omitidasYaPobladas: omitidasYaPobladas,
      entradasCreadas:    entradasCreadas
    };
  }

  /**
   * Reconcilia el campo `agenteId` denormalizado en `aj_operaciones` y
   * `aj_col_leads` contra las personas canonizadas en `aj_personas`.
   *
   * Disparada tras `sembrarAgentesYColaboradores()` automáticamente.
   * Disponible también para invocación manual desde consola.
   *
   * Algoritmo (CLAUDE.md §16.8.6):
   * 1. Para cada operación / lead con `agenteId` antiguo (no AJ-P-NNN):
   *    a. Buscar persona equivalente en aj_personas vía dedup R-N3
   *       con criterio principal nombre ASCII.
   *    b. Si encuentra equivalente, remapear agenteId → personaId.
   *    c. Si NO encuentra equivalente (huérfano), preservar agenteId
   *       original y registrar en reporte.
   * 2. Persistir solo si hubo cambios reales.
   *
   * @returns {{
   *   revisados: number,
   *   remapeados: number,
   *   huerfanos: number,
   *   detalles: Array<{tabla, entidadId, antes, despues, motivo}>
   * }}
   */
  function reconciliarAgenteIds() {
    const reporte = {
      revisados: 0,
      remapeados: 0,
      huerfanos: 0,
      detalles: []
    };
    const ahora = new Date().toISOString();

    // Helper: detecta si un agenteId ya es canónico (formato AJ-P-NNN).
    function esCanonico(agenteId) {
      return typeof agenteId === 'string' && /^AJ-P-\d{3,}$/.test(agenteId);
    }

    // Helper: resuelve un agenteId legacy a personaId canónico vía nombre.
    // Devuelve null si no encuentra equivalente.
    function resolverAgenteId(agenteIdLegacy, hintNombre) {
      if (esCanonico(agenteIdLegacy)) return agenteIdLegacy; // ya canónico
      // Heurística de nombre: agenteIdLegacy tipo 'admin', 'camilo_*' o
      // 'jonatan_*' contiene el nombre o lo contiene parcialmente.
      // Si hay hint de nombre explícito, usarlo. Si no, derivar del agenteId.
      let nombreCandidato = hintNombre || null;
      if (!nombreCandidato) {
        // Heurística: extraer nombre antes del guión bajo o usar el id literal.
        if (agenteIdLegacy === 'admin') nombreCandidato = 'Jonatan';
        else if (typeof agenteIdLegacy === 'string') {
          const partes = agenteIdLegacy.split('_');
          nombreCandidato = partes[0] || null;
        }
      }
      if (!nombreCandidato) return null;
      // Buscar en aj_personas por dedup R-N3 con criterio principal nombre.
      const candidatos = personasBuscarPorDedup({nombre: nombreCandidato});
      if (candidatos.length === 0) return null;
      return candidatos[0].personaId; // el primero por orden de inserción
    }

    // 1. Reconciliar aj_operaciones.
    let operaciones = store.get('aj_operaciones');
    if (Array.isArray(operaciones)) {
      let huboCambiosOp = false;
      for (let i = 0; i < operaciones.length; i++) {
        const op = operaciones[i];
        if (!op || typeof op.agenteId !== 'string') continue;
        reporte.revisados++;
        if (esCanonico(op.agenteId)) continue; // ya reconciliado
        const personaId = resolverAgenteId(op.agenteId, null);
        if (personaId === null) {
          reporte.huerfanos++;
          reporte.detalles.push({
            tabla: 'aj_operaciones',
            entidadId: op.id,
            antes: op.agenteId,
            despues: op.agenteId,
            motivo: 'huerfano_sin_equivalente_en_aj_personas'
          });
        } else {
          reporte.detalles.push({
            tabla: 'aj_operaciones',
            entidadId: op.id,
            antes: op.agenteId,
            despues: personaId,
            motivo: 'remapeado'
          });
          op.agenteId = personaId;
          op.updatedAt = ahora;
          reporte.remapeados++;
          huboCambiosOp = true;
        }
      }
      if (huboCambiosOp) store.set('aj_operaciones', operaciones);
    }

    // 2. Reconciliar aj_col_leads.
    let leads = store.get('aj_col_leads');
    if (Array.isArray(leads)) {
      let huboCambiosLeads = false;
      for (let i = 0; i < leads.length; i++) {
        const lead = leads[i];
        if (!lead || typeof lead.agenteId !== 'string') continue;
        reporte.revisados++;
        if (esCanonico(lead.agenteId)) continue;
        const personaId = resolverAgenteId(lead.agenteId, null);
        if (personaId === null) {
          reporte.huerfanos++;
          reporte.detalles.push({
            tabla: 'aj_col_leads',
            entidadId: lead.id,
            antes: lead.agenteId,
            despues: lead.agenteId,
            motivo: 'huerfano_sin_equivalente_en_aj_personas'
          });
        } else {
          reporte.detalles.push({
            tabla: 'aj_col_leads',
            entidadId: lead.id,
            antes: lead.agenteId,
            despues: personaId,
            motivo: 'remapeado'
          });
          lead.agenteId = personaId;
          leads[i] = lead;
          reporte.remapeados++;
          huboCambiosLeads = true;
        }
      }
      if (huboCambiosLeads) store.set('aj_col_leads', leads);
    }

    // Resumen para auditoría manual.
    if (typeof console !== 'undefined' && typeof console.info === 'function') {
      console.info('[ajPersonas] Reconciliación agenteId: ' +
                   reporte.revisados + ' revisados, ' +
                   reporte.remapeados + ' remapeados, ' +
                   reporte.huerfanos + ' huérfanos.');
    }

    return reporte;
  }

  /**
   * Siembra programática manual de las 5 personas operativas reales del
   * CRM AJ Grup en aj_personas. Canonizada en CLAUDE.md §16.8.4.
   *
   * Recibe los datos como parámetros en runtime (decisión P3 §16.8.2).
   * Datos sensibles NO se versionan en código.
   *
   * Idempotente vía flag `aj_seed_personas_completado`.
   *
   * Cero tolerancia a datos malformados (a diferencia de migrarFrente5).
   * Lanza error de validación ante cualquier inconsistencia.
   *
   * Tras sembrar, dispara reconciliarAgenteIds() automáticamente.
   *
   * @param {Array<{nombre, dni?, email?, telefono?, roles}>} datosAgentes
   *   Array de agentes a sembrar. Cada uno requiere `nombre` + al menos
   *   uno de dni/email/teléfono + `roles` array de roles canónicos.
   * @param {Array<{nombre, empresa, agenteNombre, email?, telefono?}>} datosColaboradores
   *   Array de colaboradores. Cada uno requiere `nombre` + `empresa` +
   *   `agenteNombre` (resuelto a personaId del agente gestor).
   * @param {{forzar?: boolean}} [opciones] - reservado para futuro.
   * @returns {{
   *   ya_completada: boolean,
   *   personasCreadas: number,
   *   agentesCreados: number,
   *   colaboradoresCreados: number,
   *   reporteReconciliacion: Object|null
   * }}
   * @throws {Error} si datos malformados o validación falla.
   */

  /**
   * Migra datos legacy Inmo (aj_inmo_compradores + aj_inmo_captaciones +
   * aj_inmo_visitas) a modelo canónico Capa 11 aj_personas + Capa 9
   * aj_inmo_propiedades + Capa 15 aj_inmo_operaciones bilateral D-13.
   *
   * Frente 12 §25.3 v5.90 Sub-frente 12.2.
   * Idempotente vía flag aj_migracion_frente12_completada.
   * Tolerancia pérdida puntual fase pruebas (warn console).
   *
   * Patrón canónico análogo migrarFrente5() §16.3 + migrarFrente5Inmo()
   * §16.9.2 + migrarFrente13Colaboradores() §23.3 + agentesIAMigrarFrente14()
   * §24.3.
   *
   * @returns {object} reporte {compradores, captaciones, visitas, personas, propiedades, operaciones, warnings}
   */
  function migrarFrente12SeguimientosInmo() {
    if (store.get('aj_migracion_frente12_completada') === true) {
      return { compradores: 0, captaciones: 0, visitas: 0, personas: 0, propiedades: 0, operaciones: 0, warnings: ['ya completada'] };
    }

    var compradoresLegacy = store.get('aj_inmo_compradores') || [];
    var captacionesLegacy = store.get('aj_inmo_captaciones') || [];
    var visitasLegacy     = store.get('aj_inmo_visitas')     || [];

    // Backup explícito pre-migración
    var fechaIso = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    store.set('aj_inmo_compradores_backup_pre_frente12_' + fechaIso, compradoresLegacy);
    store.set('aj_inmo_captaciones_backup_pre_frente12_' + fechaIso, captacionesLegacy);
    store.set('aj_inmo_visitas_backup_pre_frente12_'     + fechaIso, visitasLegacy);

    var reporte = { compradores: 0, captaciones: 0, visitas: 0, personas: 0, propiedades: 0, operaciones: 0, warnings: [] };

    // Step 1 — Compradores legacy → personas Capa 11 rol comprador_inmo
    compradoresLegacy.forEach(function (comp) {
      try {
        if (!comp.nombre && !comp.telefono && !comp.email) {
          reporte.warnings.push('Comprador sin datos identidad: ' + (comp.id || 'sin_id'));
          return;
        }
        var datosPersona = {
          nombre:    comp.nombre    || '(sin nombre)',
          telefono:  comp.telefono  || null,
          email:     comp.email     || null,
          dni:       comp.dni       || null
        };
        var resultado = personasCrear(datosPersona, 'comprador_inmo', { forzarSiDuplicado: false });
        reporte.compradores++;
        if (resultado.creada) reporte.personas++;
      } catch (e) {
        reporte.warnings.push('Comprador ' + (comp.id || 'sin_id') + ': ' + e.message);
      }
    });

    // Step 2 — Captaciones legacy → personas Capa 11 rol vendedor_inmo + propiedades Capa 9
    captacionesLegacy.forEach(function (cap) {
      try {
        if (!cap.vendedor_nombre && !cap.vendedor_telefono) {
          reporte.warnings.push('Captación sin vendedor: ' + (cap.id || 'sin_id'));
          return;
        }
        var datosPersona = {
          nombre:    cap.vendedor_nombre    || '(sin nombre)',
          telefono:  cap.vendedor_telefono  || null,
          email:     cap.vendedor_email     || null,
          dni:       cap.vendedor_dni       || null
        };
        var resultPersona = personasCrear(datosPersona, 'vendedor_inmo', { forzarSiDuplicado: false });
        reporte.captaciones++;
        if (resultPersona.creada) reporte.personas++;

        // Crear propiedad asociada Capa 9 si direccion + tipo + m² presentes
        if (cap.direccion && cap.tipo && cap.metros_cuadrados) {
          try {
            propiedadesCrear({
              direccion:        cap.direccion,
              caracteristicas:  {
                tipo:            cap.tipo,
                metrosCuadrados: cap.metros_cuadrados,
                habitaciones:    cap.habitaciones || null,
                baños:           cap.baños || null
              },
              estadoOcupacion:  cap.estado_ocupacion || 'vacio',
              refCatastral:     cap.refCatastral || null,
              captacionOrigenId: cap.id
            });
            reporte.propiedades++;
          } catch (errProp) {
            reporte.warnings.push('Propiedad desde captación ' + cap.id + ': ' + errProp.message);
          }
        }
      } catch (e) {
        reporte.warnings.push('Captación ' + (cap.id || 'sin_id') + ': ' + e.message);
      }
    });

    // Step 3 — Visitas legacy → counter (no crea seguimientos, migración seguimientos diferida Sub-frente 12.X+ código UI)
    reporte.visitas = visitasLegacy.length;

    store.set('aj_migracion_frente12_completada', true);
    return reporte;
  }

  /**
   * Sub-frente 13.2 v5.66 Frente 13 Módulo Colaboradores Refactor MAYOR — migración canónica entidades legacy.
   * Análoga `migrarFrente5()` §16.3 + `migrarFrente5Inmo()` §16.9.2 patrón canónico replicable.
   * Migra entidades legacy `aj_colaboradores` + `aj_col_leads` + `aj_col_liquidaciones` a Capa 11
   * `aj_personas` rol `colaborador` v5.7 Modelo M1 §16.8.3 + subobjeto `meta.colaborador` ampliación canon §23.3.
   * Backup explícito `aj_colaboradores_backup_pre_frente13_YYYYMMDD` + flag idempotencia
   * `aj_migracion_frente13_completada` boolean localStorage (R-N4 análoga).
   * Dedup R-N3 vía `personasBuscarPorDedup` (match → `personasActualizar` + `personasAgregarRol` R-N2;
   * no-match → `personasCrear` con rol `colaborador` + `meta.colaborador` subobjeto).
   * Tolerancia pérdida puntual fase pruebas canon §16.3 (warning console + continúa).
   * Migración referencias `colaboradorId` legacy → `personaId` canon vía mapa interno
   * `colIdLegacy → personaIdNuevo` para `aj_colab_leads` + `aj_colab_liquidaciones` (claves NUEVAS canonizables).
   * @returns {Object} reporte canónico {ya_completada, colaboradoresMigrados, leadsMigrados, liquidacionesMigradas, descartados, motivosDescarte, agentesFalladosMap, detalles}
   */
  function migrarFrente13Colaboradores() {
    const reporte = {
      ya_completada: false,
      colaboradoresMigrados: 0,
      leadsMigrados: 0,
      liquidacionesMigradas: 0,
      descartados: 0,
      motivosDescarte: [],
      agentesFalladosMap: {},
      detalles: []
    };

    // Idempotencia R-N4 análoga migrarFrente5/Inmo
    if (store.get('aj_migracion_frente13_completada') === true) {
      reporte.ya_completada = true;
      return reporte;
    }

    const ahora = new Date().toISOString();
    const colaboradoresLegacy = store.get('aj_colaboradores') || [];

    // Backup explícito pre-migración (tolerancia pérdida puntual canon §16.3)
    if (colaboradoresLegacy.length > 0) {
      const fechaSlug = ahora.slice(0, 10).replace(/-/g, '');
      const backupKey = 'aj_colaboradores_backup_pre_frente13_' + fechaSlug;
      store.set(backupKey, colaboradoresLegacy);
    }

    // Mapa interno colIdLegacy → personaIdNuevo para migración referencias leads + liquidaciones
    const colIdMap = {};

    // Migración colaboradores → aj_personas rol colaborador + meta.colaborador
    colaboradoresLegacy.forEach(function(col) {
      try {
        // Validar mínimos R-N3 dedup criterios (teléfono OR email OR DNI mínimo)
        if (!col.telefono && !col.email) {
          reporte.descartados++;
          reporte.motivosDescarte.push({
            colaboradorId: col.id,
            motivo: 'Sin teléfono ni email — R-N3 dedup imposible canon §16.5'
          });
          console.warn('[migrarFrente13] colaborador descartado sin contacto: ' + col.id);
          return;
        }

        // Dedup R-N3 vía personasBuscarPorDedup
        const candidatos = personasBuscarPorDedup({
          nombre: col.nombre,
          telefono: col.telefono,
          email: col.email
        });

        // Construir subobjeto meta.colaborador canon §23.3 (9-13 atributos canónicos)
        const metaColaborador = {
          tipo: col.tipo || 'independiente',
          cif: col.cif || null,
          razonSocial: col.razonSocial || null,
          iban: col.iban || null,
          acuerdo: col.acuerdo === true,
          fechaAcuerdo: col.fechaAcuerdo || null,
          tags: Array.isArray(col.tags) ? col.tags : [],
          lat: typeof col.lat === 'number' ? col.lat : null,
          lng: typeof col.lng === 'number' ? col.lng : null,
          porcentaje: typeof col.porcentaje === 'number' ? col.porcentaje : null,
          ultimoLead: col.ultimoLead || null,
          estado: col.estado || 'activo',
          direccion: col.direccion || null,
          fechaAlta: col.fechaAlta || ahora
        };

        let personaId;
        if (candidatos.length > 0) {
          // Match dedup R-N3 → actualizar persona existente + agregar rol colaborador R-N2
          // [INFERENCIA-DEDUP-SHAPE-CAPA-4-FIX-IN-SITU]: personasBuscarPorDedup retorna [{personaId, criteriosCoincidencia, persona}, ...] canon empírico real L1538-L1543 — NO [{id, ...}] como briefing canonizaba implícitamente
          personaId = candidatos[0].personaId;
          const personaCandidata = candidatos[0].persona;
          // Actualizar empresa Modelo M1 §16.8.3 + notas + meta.colaborador
          const cambios = {
            empresa: col.empresa || personaCandidata.empresa || null,
            meta: Object.assign({}, personaCandidata.meta || {}, { colaborador: metaColaborador })
          };
          if (col.notas) cambios.notas = col.notas;
          personasActualizar(personaId, cambios);
          // R-N2 idempotente: si ya tiene rol 'colaborador', no-op silencioso
          personasAgregarRol(personaId, 'colaborador');
          reporte.detalles.push({
            colaboradorIdLegacy: col.id, personaId: personaId, accion: 'dedup_match_agregarRol'
          });
        } else {
          // No-match → crear persona NUEVA con rol colaborador + meta.colaborador
          const personaData = {
            nombre: col.nombre,
            type: 'fisica',  // canon Modelo M1 §16.8.3 v5.7 persona física
            empresa: col.empresa || null,  // canon Modelo M1 vinculación empresarial
            telefono: col.telefono || null,
            email: col.email || null,
            notas: col.notas || null,
            agenteId: col.agenteId || null,
            meta: { colaborador: metaColaborador }
          };
          const resultado = personasCrear(personaData, 'colaborador');
          personaId = resultado.creada.id;
          reporte.detalles.push({
            colaboradorIdLegacy: col.id, personaId: personaId, accion: 'crear_nuevo'
          });
        }

        // Mapa interno colIdLegacy → personaIdNuevo para migración referencias
        colIdMap[col.id] = personaId;
        reporte.colaboradoresMigrados++;
      } catch (err) {
        reporte.descartados++;
        reporte.motivosDescarte.push({
          colaboradorId: col.id || 'unknown',
          motivo: 'Error: ' + err.message
        });
        console.warn('[migrarFrente13] error migrando colaborador ' + (col.id || 'unknown') + ': ' + err.message);
      }
    });

    // Migración aj_col_leads → aj_colab_leads (clave NUEVA canonizable) con referencias migradas
    const leadsLegacy = store.get('aj_col_leads') || [];
    const leadsCanon = leadsLegacy.map(function(lead) {
      const personaIdNuevo = colIdMap[lead.colaboradorId];
      if (personaIdNuevo) {
        reporte.leadsMigrados++;
        return Object.assign({}, lead, {
          personaId: personaIdNuevo,
          colaboradorIdLegacy: lead.colaboradorId  // preserva legacy para trazabilidad
        });
      } else {
        // Lead huérfano sin colaborador migrado — preservar con warning
        console.warn('[migrarFrente13] lead huérfano sin colaborador migrado: ' + lead.id);
        return Object.assign({}, lead, { personaId: null, colaboradorIdLegacy: lead.colaboradorId });
      }
    });
    store.set('aj_colab_leads', leadsCanon);

    // Migración aj_col_liquidaciones → aj_colab_liquidaciones (clave NUEVA canonizable) análoga
    const liquidacionesLegacy = store.get('aj_col_liquidaciones') || [];
    const liquidacionesCanon = liquidacionesLegacy.map(function(liq) {
      const personaIdNuevo = colIdMap[liq.colaboradorId];
      if (personaIdNuevo) {
        reporte.liquidacionesMigradas++;
        return Object.assign({}, liq, {
          personaId: personaIdNuevo,
          colaboradorIdLegacy: liq.colaboradorId
        });
      } else {
        console.warn('[migrarFrente13] liquidacion huérfana sin colaborador migrado: ' + liq.id);
        return Object.assign({}, liq, { personaId: null, colaboradorIdLegacy: liq.colaboradorId });
      }
    });
    store.set('aj_colab_liquidaciones', liquidacionesCanon);

    // Flag idempotencia R-N4
    store.set('aj_migracion_frente13_completada', true);

    // Reporte console.info final canon §16.3/§16.9.2 patrón
    console.info('[ajPersonas] migrarFrente13Colaboradores: ' +
      reporte.colaboradoresMigrados + ' colaboradores migrados (canon §16.2 + Modelo M1 §16.8.3 + meta.colaborador canon §23.3), ' +
      reporte.leadsMigrados + ' leads migrados (aj_col_leads → aj_colab_leads), ' +
      reporte.liquidacionesMigradas + ' liquidaciones migradas (aj_col_liquidaciones → aj_colab_liquidaciones), ' +
      reporte.descartados + ' descartados');

    return reporte;
  }

  function sembrarAgentesYColaboradores(datosAgentes, datosColaboradores, opciones) {
    opciones = opciones || {};

    // Idempotencia.
    if (store.get('aj_seed_personas_completado') === true) {
      return {
        ya_completada: true,
        personasCreadas: 0,
        agentesCreados: 0,
        colaboradoresCreados: 0,
        reporteReconciliacion: null
      };
    }

    // Validación de shape de inputs.
    if (!Array.isArray(datosAgentes)) {
      throw new Error('[ajPersonas] sembrarAgentesYColaboradores: datosAgentes debe ser array');
    }
    if (!Array.isArray(datosColaboradores)) {
      throw new Error('[ajPersonas] sembrarAgentesYColaboradores: datosColaboradores debe ser array');
    }

    // Pre-validar TODOS los agentes antes de empezar a persistir.
    // Atomicidad mínima: si algún agente es inválido, ninguno se siembra.
    for (let i = 0; i < datosAgentes.length; i++) {
      const a = datosAgentes[i];
      if (!a || typeof a !== 'object') {
        throw new Error('[ajPersonas] datosAgentes[' + i + '] debe ser objeto');
      }
      if (typeof a.nombre !== 'string' || a.nombre.trim() === '') {
        throw new Error('[ajPersonas] datosAgentes[' + i + '] requiere nombre no vacío');
      }
      const tieneContacto =
        (typeof a.dni === 'string' && a.dni.trim() !== '') ||
        (typeof a.email === 'string' && a.email.trim() !== '') ||
        (typeof a.telefono === 'string' && a.telefono.trim() !== '');
      if (!tieneContacto) {
        throw new Error('[ajPersonas] datosAgentes[' + i + '] requiere al menos uno de dni/email/telefono');
      }
      if (!Array.isArray(a.roles) || a.roles.length === 0) {
        throw new Error('[ajPersonas] datosAgentes[' + i + '] requiere roles array no vacío');
      }
      for (let j = 0; j < a.roles.length; j++) {
        _validarRol(a.roles[j]); // lanza si rol fuera de set canónico
      }
    }

    // Pre-validar TODOS los colaboradores.
    for (let i = 0; i < datosColaboradores.length; i++) {
      const c = datosColaboradores[i];
      if (!c || typeof c !== 'object') {
        throw new Error('[ajPersonas] datosColaboradores[' + i + '] debe ser objeto');
      }
      if (typeof c.nombre !== 'string' || c.nombre.trim() === '') {
        throw new Error('[ajPersonas] datosColaboradores[' + i + '] requiere nombre no vacío');
      }
      if (typeof c.empresa !== 'string' || c.empresa.trim() === '') {
        throw new Error('[ajPersonas] datosColaboradores[' + i + '] requiere empresa no vacía (Modelo M1 §16.8.3)');
      }
      if (typeof c.agenteNombre !== 'string' || c.agenteNombre.trim() === '') {
        throw new Error('[ajPersonas] datosColaboradores[' + i + '] requiere agenteNombre (gestor) no vacío');
      }
    }

    // Persistencia: primero agentes, luego colaboradores con agenteId resuelto.
    const ahora = new Date().toISOString();
    let agentesCreados = 0;
    let colaboradoresCreados = 0;

    // 1. Sembrar agentes.
    for (let i = 0; i < datosAgentes.length; i++) {
      const a = datosAgentes[i];
      const personasExistentes = _leerPersonas();
      const personaId = idCodigoHumano('personas');
      const nuevaPersona = {
        id: personaId,
        uuid: idUuid(),
        nombre: a.nombre.trim(),
        type: 'fisica',  // CLAUDE.md §16.2 (post v5.7)
        cotitular: null,
        dni: typeof a.dni === 'string' && a.dni.trim() !== '' ? a.dni.trim() : null,
        telefono: typeof a.telefono === 'string' && a.telefono.trim() !== '' ? a.telefono.trim() : null,
        email: typeof a.email === 'string' && a.email.trim() !== '' ? a.email.trim() : null,
        direccion: null,
        referenciaInterna: null,
        empresa: null,  // agentes NO tienen empresa (Modelo M1 sólo aplica a colaboradores)
        roles: a.roles.slice(),
        notas: '',
        notasComerciales: '',
        createdAt: ahora,
        updatedAt: ahora
      };
      personasExistentes.push(nuevaPersona);
      _persistirPersonas(personasExistentes);
      agentesCreados++;
    }

    // 2. Sembrar colaboradores.
    for (let i = 0; i < datosColaboradores.length; i++) {
      const c = datosColaboradores[i];
      // Resolver agenteId desde agenteNombre vía dedup R-N3.
      const candidatos = personasBuscarPorDedup({nombre: c.agenteNombre});
      if (candidatos.length === 0) {
        throw new Error(
          '[ajPersonas] datosColaboradores[' + i + '].agenteNombre no encontrado en aj_personas: "' +
          c.agenteNombre + '" (asegurar que el agente está en datosAgentes y se sembró antes)'
        );
      }
      const agenteId = candidatos[0].personaId;
      const personasExistentes = _leerPersonas();
      const personaId = idCodigoHumano('personas');
      const nuevaPersona = {
        id: personaId,
        uuid: idUuid(),
        nombre: c.nombre.trim(),
        type: 'fisica',
        cotitular: null,
        dni: null,
        telefono: typeof c.telefono === 'string' && c.telefono.trim() !== '' ? c.telefono.trim() : null,
        email: typeof c.email === 'string' && c.email.trim() !== '' ? c.email.trim() : null,
        direccion: null,
        referenciaInterna: null,
        empresa: c.empresa.trim(),
        agenteId: agenteId,  // referencia al agente gestor (Modelo M1 §16.8.3 + D6 sesión 31)
        roles: ['colaborador'],
        notas: '',
        notasComerciales: '',
        createdAt: ahora,
        updatedAt: ahora
      };
      personasExistentes.push(nuevaPersona);
      _persistirPersonas(personasExistentes);
      colaboradoresCreados++;
    }

    // 3. Marcar flag de siembra completada.
    store.set('aj_seed_personas_completado', true);

    // 4. Disparar reconciliación.
    let reporteReconciliacion = null;
    try {
      reporteReconciliacion = reconciliarAgenteIds();
    } catch (errRec) {
      console.warn('[sembrarAgentesYColaboradores] reconciliación post-siembra falló: ' + errRec.message);
    }

    return {
      ya_completada: false,
      personasCreadas: agentesCreados + colaboradoresCreados,
      agentesCreados: agentesCreados,
      colaboradoresCreados: colaboradoresCreados,
      reporteReconciliacion: reporteReconciliacion
    };
  }

  const personas = {
    crear:                          personasCrear,
    obtener:                        personasObtener,
    listar:                         personasListar,
    actualizar:                     personasActualizar,
    eliminar:                       personasEliminar,
    agregarRol:                     personasAgregarRol,
    quitarRol:                      personasQuitarRol,
    buscarPorRol:                   personasBuscarPorRol,
    // Métodos del campo embudos[] (NUEVO v2.3.0 — CLAUDE.md §16.11.4 v5.11.1):
    agregarEmbudo:                  personasAgregarEmbudo,
    cerrarEmbudo:                   personasCerrarEmbudo,
    ESTADOS_EMBUDO_PERSONA:         _ESTADOS_EMBUDO_PERSONA,
    quitarEmbudo:                   personasQuitarEmbudo,
    enEmbudo:                       personasEnEmbudo,
    listarEmbudos:                  personasListarEmbudos,
    buscarEnEmbudo:                 personasBuscarEnEmbudo,
    buscarPorDedup:                 personasBuscarPorDedup,
    fusionar:                       personasFusionar,
    migrarFrente5:                  migrarFrente5,
    migrarFrente5Inmo:              migrarFrente5Inmo,               // NUEVO Sub-frente 5.4.S2
    migrarFrente55Embudos:          migrarFrente55Embudos,           // NUEVO v2.4.0 (CLAUDE.md §16.11.5 v5.11.1)
    migrarFrente12SeguimientosInmo: migrarFrente12SeguimientosInmo,  // NUEVO Sub-frente 12.2 v5.91 Frente 12 Módulo Seguimientos AJ Inmobiliaria refactor MAYOR
    migrarFrente13Colaboradores:    migrarFrente13Colaboradores,     // NUEVO Sub-frente 13.2 v5.66 Frente 13 Módulo Colaboradores Refactor MAYOR
    sembrarAgentesYColaboradores:   sembrarAgentesYColaboradores,
    reconciliarAgenteIds:           reconciliarAgenteIds,
    ROLES_CANONICOS:                _ROLES_CANONICOS,
    EMBUDOS_CANONICOS:              _EMBUDOS_CANONICOS,              // NUEVO v2.3.0 (CLAUDE.md §16.11.3 v5.11.1)
    FUENTES:                        _FUENTES                         // NUEVO Sub-frente 5.4.S2 (CLAUDE.md §16.4 v5.8)
  };


  // ═══════════════════════════════════════════════════════════════════════
  //  CAPA 12 — ajSeguimientos
  //  Gestión de la entidad polimórfica aj_seguimientos canonizada en
  //  CLAUDE.md §16.6 (Frente 5). CRUD + filtrado polimórfico por entidad
  //  origen + reconciliación de personaId denormalizado.
  //
  //  Polimorfismo: cada seguimiento referencia EXACTAMENTE UNA entidad
  //  origen mediante el par (entidadOrigen, entidadId). El campo personaId
  //  es atajo derivable persistido para consultas frecuentes.
  //
  //  Estrategia de sincronización de personaId denormalizado (CLAUDE.md
  //  §16.6 deuda canonizada): cron de reconciliación periódica disparada
  //  tras migrarFrente5() y tras personasFusionar(). Cero overhead en
  //  cargas normales.
  // ═══════════════════════════════════════════════════════════════════════

  const _CLAVE_SEGUIMIENTOS = 'aj_seguimientos';

  const _ENTIDADES_ORIGEN = Object.freeze([
    'operacion_finances',
    'comprador_inmo',
    'captacion_inmo',
    'visita_inmo',
    'propiedad_inmo',
    'persona'
  ]);

  const _TIPOS_SEGUIMIENTO = Object.freeze([
    'nota',
    'llamada',
    'email_enviado',
    'email_recibido',
    'cita',
    'visita',
    'whatsapp',
    'documento_enviado',
    'evento_sistema'
  ]);

  // ─── v2.14.0: schema rich motor seguimientos (§22.7 canon v5.34) ─────────
  const _ESTADOS_SEGUIMIENTO = Object.freeze([
    'programada',
    'realizada',
    'no_realizada',
    'anulada'
  ]);

  // Tabla canónica transiciones permitidas §22.7.4. Key = estado origen,
  // value = Set congelado de estados destino válidos. Same-state es siempre
  // idempotente (no-op).
  const _TRANSICIONES_ESTADO = Object.freeze({
    programada:   Object.freeze(['realizada', 'no_realizada', 'anulada', 'programada']),
    realizada:    Object.freeze(['programada', 'realizada']),
    no_realizada: Object.freeze(['programada', 'no_realizada']),
    anulada:      Object.freeze(['programada', 'anulada'])
  });

  // Helper: deriva agendado_bool a partir del tipo (canon §22.7.1).
  // tipo ∈ {cita, visita} → true; resto → false.
  function _derivarAgendadoBool(tipo) {
    return tipo === 'cita' || tipo === 'visita';
  }

  function _validarEntidadOrigen(entidadOrigen) {
    if (typeof entidadOrigen !== 'string') {
      throw new Error('[ajSeguimientos] entidadOrigen debe ser string');
    }
    if (_ENTIDADES_ORIGEN.indexOf(entidadOrigen) === -1) {
      throw new Error(
        '[ajSeguimientos] entidadOrigen inválido: "' + entidadOrigen + '" (válidos: ' +
        _ENTIDADES_ORIGEN.map(e => "'" + e + "'").join(', ') + ')'
      );
    }
  }

  function _validarTipo(tipo) {
    if (typeof tipo !== 'string') {
      throw new Error('[ajSeguimientos] tipo debe ser string');
    }
    if (_TIPOS_SEGUIMIENTO.indexOf(tipo) === -1) {
      throw new Error(
        '[ajSeguimientos] tipo inválido: "' + tipo + '" (válidos: ' +
        _TIPOS_SEGUIMIENTO.map(t => "'" + t + "'").join(', ') + ')'
      );
    }
  }

  function _leerSeguimientos() {
    const raw = store.get(_CLAVE_SEGUIMIENTOS);
    return Array.isArray(raw) ? raw : [];
  }

  function _persistirSeguimientos(seguimientos) {
    store.set(_CLAVE_SEGUIMIENTOS, seguimientos);
  }

  /**
   * Deriva el personaId que debería corresponder a un seguimiento dado su
   * entidadOrigen y entidadId, consultando la entidad origen actual.
   * Devuelve null si la entidad origen no existe o no tiene personaId
   * (caso legítimo en propiedad_inmo).
   */
  function _derivarPersonaId(entidadOrigen, entidadId) {
    if (entidadOrigen === 'persona') {
      return entidadId;  // trivial
    }
    let clave = null;
    switch (entidadOrigen) {
      case 'operacion_finances':  clave = 'aj_operaciones'; break;
      case 'comprador_inmo':      clave = 'aj_inmo_compradores'; break;
      case 'captacion_inmo':      clave = 'aj_inmo_captaciones'; break;
      case 'visita_inmo':         clave = 'aj_inmo_visitas'; break;
      case 'propiedad_inmo':      clave = 'aj_inmo_propiedades'; break;
    }
    if (!clave) return null;
    const tabla = store.get(clave);
    if (!Array.isArray(tabla)) return null;
    const entrada = tabla.find(e => e && e.id === entidadId);
    if (!entrada) return null;
    return (typeof entrada.personaId === 'string' && entrada.personaId) ? entrada.personaId : null;
  }

  /**
   * Crea un seguimiento polimórfico (Flujo 4 §16.7).
   *
   * @param {Object} seguimientoData
   *   Campos obligatorios: entidadOrigen (enum cerrado), entidadId, tipo
   *   (enum cerrado), texto, autorId.
   *   Campos opcionales: autorNombre, fecha, system (default false).
   *   Si caller proporciona personaId, prevalece el derivado vía
   *   `_derivarPersonaId` (consistencia con regla denormalizada).
   * @returns {Object} seguimiento creado.
   */
  function seguimientosCrear(seguimientoData) {
    if (!seguimientoData || typeof seguimientoData !== 'object') {
      throw new Error('[ajSeguimientos] seguimientoData es obligatorio y debe ser objeto');
    }
    _validarEntidadOrigen(seguimientoData.entidadOrigen);
    if (typeof seguimientoData.entidadId !== 'string' || seguimientoData.entidadId.trim() === '') {
      throw new Error('[ajSeguimientos] entidadId es obligatorio (string no vacío)');
    }
    _validarTipo(seguimientoData.tipo);
    if (typeof seguimientoData.texto !== 'string' || seguimientoData.texto.trim() === '') {
      throw new Error('[ajSeguimientos] texto es obligatorio (string no vacío)');
    }
    if (typeof seguimientoData.autorId !== 'string' || seguimientoData.autorId.trim() === '') {
      throw new Error('[ajSeguimientos] autorId es obligatorio (string no vacío)');
    }

    // v2.14.0: validar estado si caller lo proporciona
    if (seguimientoData.estado !== undefined) {
      if (!_ESTADOS_SEGUIMIENTO.includes(seguimientoData.estado)) {
        throw new Error('[ajSeguimientos] estado invalido. Valores canon: ' + _ESTADOS_SEGUIMIENTO.join(', '));
      }
    }
    const ahora = new Date().toISOString();
    // personaId derivado tiene precedencia sobre lo que envíe el caller.
    const personaIdDerivado = _derivarPersonaId(seguimientoData.entidadOrigen, seguimientoData.entidadId);

    const nuevo = {
      id:            idCodigoHumano('seguimientos'),
      uuid:          idUuid(),
      entidadOrigen: seguimientoData.entidadOrigen,
      entidadId:     seguimientoData.entidadId,
      personaId:     personaIdDerivado,
      tipo:          seguimientoData.tipo,
      texto:         seguimientoData.texto,
      autorId:       seguimientoData.autorId,
      autorNombre:   seguimientoData.autorNombre || null,
      fecha:         seguimientoData.fecha || ahora,
      system:        seguimientoData.system === true,
      // v2.14.0: schema rich motor seguimientos §22.7.1
      estado:        seguimientoData.estado || (seguimientoData.system === true ? 'realizada' : 'programada'),
      hora:          seguimientoData.hora || null,
      duracion_min:  typeof seguimientoData.duracion_min === 'number' ? seguimientoData.duracion_min : 0,
      agendado_bool: typeof seguimientoData.agendado_bool === 'boolean'
                       ? seguimientoData.agendado_bool
                       : _derivarAgendadoBool(seguimientoData.tipo),
      resultados:    Array.isArray(seguimientoData.resultados) ? seguimientoData.resultados : [],
      createdAt:     ahora,
      updatedAt:     ahora
    };

    const seguimientos = _leerSeguimientos();
    seguimientos.push(nuevo);
    _persistirSeguimientos(seguimientos);
    return nuevo;
  }

  /**
   * Lookup por id. Devuelve seguimiento o null.
   * @param {string} seguimientoId
   * @returns {Object|null}
   */
  function seguimientosObtener(seguimientoId) {
    const seguimientos = _leerSeguimientos();
    for (let i = 0; i < seguimientos.length; i++) {
      if (seguimientos[i].id === seguimientoId) return seguimientos[i];
    }
    return null;
  }

  /**
   * Lista seguimientos filtrados polimórficamente. Filtros combinables AND.
   *
   * @param {Object} [filtros]
   *   - entidadOrigen, entidadId, personaId, tipo (igualdad estricta).
   *   - desde, hasta (rango ISO sobre `fecha`, ambos inclusive).
   *   - system (boolean).
   * @returns {Array}
   */
  function seguimientosListar(filtros) {
    const seguimientos = _leerSeguimientos();
    if (!filtros) return seguimientos.slice();
    return seguimientos.filter(s => {
      if (filtros.entidadOrigen !== undefined && s.entidadOrigen !== filtros.entidadOrigen) return false;
      if (filtros.entidadId !== undefined && s.entidadId !== filtros.entidadId) return false;
      if (filtros.personaId !== undefined && s.personaId !== filtros.personaId) return false;
      if (filtros.tipo !== undefined && s.tipo !== filtros.tipo) return false;
      if (filtros.system !== undefined && s.system !== filtros.system) return false;
      if (filtros.desde !== undefined && (typeof s.fecha !== 'string' || s.fecha < filtros.desde)) return false;
      if (filtros.hasta !== undefined && (typeof s.fecha !== 'string' || s.fecha > filtros.hasta)) return false;
      return true;
    });
  }

  /**
   * Borra un seguimiento. Lanza si no existe.
   * @param {string} seguimientoId
   * @returns {boolean} true si eliminó.
   */
  function seguimientosEliminar(seguimientoId) {
    const seguimientos = _leerSeguimientos();
    let idx = -1;
    for (let i = 0; i < seguimientos.length; i++) {
      if (seguimientos[i].id === seguimientoId) { idx = i; break; }
    }
    if (idx === -1) {
      throw new Error('[ajSeguimientos] seguimientoId no encontrado: "' + seguimientoId + '"');
    }
    seguimientos.splice(idx, 1);
    _persistirSeguimientos(seguimientos);
    return true;
  }

  /**
   * Actualiza seguimiento con cambios parciales preservando integridad referencial
   * + auditoría. Refresca updatedAt automático. Re-deriva agendado_bool si
   * caller cambia `tipo` sin override explícito de `agendado_bool`.
   *
   * Campos PROHIBIDOS (throw):
   *   - id, uuid, createdAt (identidad inmutable)
   *   - entidadOrigen, entidadId, personaId (vínculo referencial inmutable)
   *   - autorId, autorNombre, system (auditoría/origen inmutable)
   *   - resultados (historial inmutable — usar cambiarEstado para append)
   *   - estado (usar seguimientosCambiarEstado para validar transición)
   *
   * Campos editables: fecha / hora / duracion_min / tipo / texto / agendado_bool.
   *
   * Capa 12 v2.15.0 — D-F11-16 + D-F11-17 (canonización pendiente sub-frente
   * documental futuro v5.37+/v5.38). Patrón replicado de pedidosActualizar L4928.
   *
   * @param {string} seguimientoId
   * @param {Object} cambios — objeto con campos a mutar
   * @returns {Object} seguimiento actualizado
   * @throws si cambios no objeto / campo prohibido / tipo inválido / duracion_min inválido / no existe
   */
  function seguimientosActualizar(seguimientoId, cambios) {
    if (!cambios || typeof cambios !== 'object') {
      throw new Error('[ajSeguimientos] cambios obligatorio (objeto)');
    }
    const camposProhibidos = [
      'id', 'uuid', 'createdAt',
      'entidadOrigen', 'entidadId', 'personaId',
      'autorId', 'autorNombre', 'system',
      'resultados'
    ];
    for (let i = 0; i < camposProhibidos.length; i++) {
      if (Object.prototype.hasOwnProperty.call(cambios, camposProhibidos[i])) {
        throw new Error('[ajSeguimientos] campo prohibido: "' + camposProhibidos[i] + '"');
      }
    }
    if (Object.prototype.hasOwnProperty.call(cambios, 'estado')) {
      throw new Error('[ajSeguimientos] usa seguimientosCambiarEstado para modificar estado');
    }
    if (Object.prototype.hasOwnProperty.call(cambios, 'tipo')) {
      if (_TIPOS_SEGUIMIENTO.indexOf(cambios.tipo) === -1) {
        throw new Error('[ajSeguimientos] tipo invalido: "' + cambios.tipo + '" (valores canon: ' +
          _TIPOS_SEGUIMIENTO.map(t => "'" + t + "'").join(', ') + ')');
      }
    }
    if (Object.prototype.hasOwnProperty.call(cambios, 'duracion_min')) {
      if (typeof cambios.duracion_min !== 'number' || cambios.duracion_min < 0) {
        throw new Error('[ajSeguimientos] duracion_min debe ser number >= 0');
      }
    }

    const seguimientos = _leerSeguimientos();
    for (let i = 0; i < seguimientos.length; i++) {
      if (seguimientos[i].id === seguimientoId) {
        const claves = Object.keys(cambios);
        for (let k = 0; k < claves.length; k++) {
          seguimientos[i][claves[k]] = cambios[claves[k]];
        }
        // D-F11-17: re-derivar agendado_bool si tipo cambió sin override explícito
        if (Object.prototype.hasOwnProperty.call(cambios, 'tipo') &&
            !Object.prototype.hasOwnProperty.call(cambios, 'agendado_bool')) {
          seguimientos[i].agendado_bool = _derivarAgendadoBool(seguimientos[i].tipo);
        }
        seguimientos[i].updatedAt = new Date().toISOString();
        _persistirSeguimientos(seguimientos);
        return seguimientos[i];
      }
    }
    throw new Error('[ajSeguimientos] seguimientoId no encontrado: "' + seguimientoId + '"');
  }

  /**
   * Reconcilia el campo `personaId` denormalizado de cada seguimiento contra
   * la entidad origen actual. Disparada tras migrarFrente5() y tras
   * personasFusionar() (D1 Sub-frente 5.2 Sesión B).
   *
   * Para cada seguimiento, deriva el personaId actual y compara con el
   * persistido. Si difieren, actualiza. Si la entidad origen no existe,
   * preserva el personaId histórico y lo marca como huérfano en el reporte.
   *
   * @returns {{revisados: number, corregidos: number, huerfanos: number, detalles: Array}}
   */
  function seguimientosReconciliarPersonaIds() {
    const seguimientos = _leerSeguimientos();
    const reporte = {
      revisados: 0,
      corregidos: 0,
      huerfanos: 0,
      detalles: []
    };
    let huboCambios = false;
    const ahora = new Date().toISOString();

    // Pre-detectar entidad origen huérfana para distinguir "huérfano" de
    // "personaId legítimamente null" (caso propiedad_inmo sin persona).
    function entidadOrigenExiste(entidadOrigen, entidadId) {
      if (entidadOrigen === 'persona') return true;  // trivial: el id es el personaId
      let clave = null;
      switch (entidadOrigen) {
        case 'operacion_finances':  clave = 'aj_operaciones'; break;
        case 'comprador_inmo':      clave = 'aj_inmo_compradores'; break;
        case 'captacion_inmo':      clave = 'aj_inmo_captaciones'; break;
        case 'visita_inmo':         clave = 'aj_inmo_visitas'; break;
        case 'propiedad_inmo':      clave = 'aj_inmo_propiedades'; break;
      }
      if (!clave) return false;
      const tabla = store.get(clave);
      if (!Array.isArray(tabla)) return false;
      return tabla.some(e => e && e.id === entidadId);
    }

    for (let i = 0; i < seguimientos.length; i++) {
      const s = seguimientos[i];
      reporte.revisados++;

      const existe = entidadOrigenExiste(s.entidadOrigen, s.entidadId);
      if (!existe) {
        // Huérfano: preservar personaId histórico, registrar.
        reporte.huerfanos++;
        reporte.detalles.push({
          seguimientoId: s.id,
          antes: s.personaId,
          despues: s.personaId,
          motivo: 'huerfano_entidad_origen_no_existe'
        });
        continue;
      }

      const derivado = _derivarPersonaId(s.entidadOrigen, s.entidadId);
      if (derivado !== s.personaId) {
        const antes = s.personaId;
        s.personaId = derivado;
        s.updatedAt = ahora;
        huboCambios = true;
        reporte.corregidos++;
        reporte.detalles.push({
          seguimientoId: s.id,
          antes: antes,
          despues: derivado,
          motivo: 'personaId_actualizado'
        });
      }
    }

    if (huboCambios) {
      _persistirSeguimientos(seguimientos);
    }

    if (typeof console !== 'undefined' && typeof console.info === 'function') {
      console.info('[ajSeguimientos] Reconciliación: ' + reporte.revisados +
                   ' revisados, ' + reporte.corregidos + ' corregidos, ' +
                   reporte.huerfanos + ' huérfanos.');
    }

    return reporte;
  }

  /**
   * Cambia el estado de un seguimiento aplicando transiciones canónicas
   * §22.7.4. Valida que la transición es permitida + que nota es proporcionada
   * para transiciones programada → realizada/no_realizada.
   *
   * @param {string} seguimientoId
   * @param {string} nuevoEstado — uno de _ESTADOS_SEGUIMIENTO.
   * @param {Object} [contexto] — opciones:
   *   - nota {string} OBLIGATORIA para programada → realizada/no_realizada.
   *   - autor {string} opcional autorId del cambio (default: autorId del seguimiento).
   * @returns {Object} seguimiento actualizado.
   */
  function seguimientosCambiarEstado(seguimientoId, nuevoEstado, contexto) {
    if (typeof seguimientoId !== 'string' || seguimientoId.trim() === '') {
      throw new Error('[ajSeguimientos] seguimientoId es obligatorio');
    }
    if (!_ESTADOS_SEGUIMIENTO.includes(nuevoEstado)) {
      throw new Error('[ajSeguimientos] nuevoEstado invalido. Valores canon: ' + _ESTADOS_SEGUIMIENTO.join(', '));
    }

    const seguimientos = _leerSeguimientos();
    const idx = seguimientos.findIndex(s => s.id === seguimientoId);
    if (idx === -1) {
      throw new Error('[ajSeguimientos] seguimiento no encontrado: ' + seguimientoId);
    }

    const seguimiento = seguimientos[idx];
    // backward compat: registro pre-v2.14.0 sin estado → asumir 'realizada'
    const estadoActual = seguimiento.estado || 'realizada';

    // Same-state idempotente (no-op)
    if (estadoActual === nuevoEstado) {
      return seguimiento;
    }

    // Validar transición canónica §22.7.4
    const transicionesPermitidas = _TRANSICIONES_ESTADO[estadoActual];
    if (!transicionesPermitidas || !transicionesPermitidas.includes(nuevoEstado)) {
      throw new Error('[ajSeguimientos] transicion no permitida: ' + estadoActual + ' → ' + nuevoEstado);
    }

    // Nota obligatoria para transición programada → realizada/no_realizada
    const exigeNota = estadoActual === 'programada' &&
                      (nuevoEstado === 'realizada' || nuevoEstado === 'no_realizada');
    /* Anular no exige nota —es una decisión tomada, hay test que la fija— pero
       si te molestas en dar el motivo, se guarda. Antes se pedía por parámetro
       y se tiraba en silencio, que es lo peor de las dos opciones. */
    const guardaNota = exigeNota ||
      (estadoActual === 'programada' && nuevoEstado === 'anulada' &&
       contexto && typeof contexto.nota === 'string' && contexto.nota.trim() !== '');
    if (exigeNota) {
      if (!contexto || typeof contexto.nota !== 'string' || contexto.nota.trim() === '') {
        throw new Error('[ajSeguimientos] nota obligatoria para transicion programada → ' + nuevoEstado);
      }
    }

    const ahora = new Date().toISOString();
    seguimiento.estado = nuevoEstado;
    seguimiento.updatedAt = ahora;

    // Si hay nota que guardar: push a resultados[] §22.7.1
    if (guardaNota) {
      if (!Array.isArray(seguimiento.resultados)) {
        seguimiento.resultados = [];
      }
      seguimiento.resultados.push({
        fecha: ahora,
        autor: (contexto && contexto.autor) || seguimiento.autorId,
        texto: contexto.nota,
        estado_resultado: nuevoEstado
      });
    }

    _persistirSeguimientos(seguimientos);
    return seguimiento;
  }

  /**
   * Normaliza registros aj_seguimientos[] pre-v2.14.0 con defaults backward
   * compat §22.7.3. Idempotente. Registros ya v2.14.0 (con campo `estado`
   * presente) NO se tocan.
   *
   * Defaults aplicados:
   *  - estado = 'realizada' (asumimos sistema-creado para records antiguos)
   *  - hora = null
   *  - duracion_min = 0
   *  - agendado_bool = _derivarAgendadoBool(tipo)
   *  - resultados = []
   *
   * @returns {number} cantidad de registros normalizados.
   */
  function seguimientosMigrarSchemaV214() {
    const seguimientos = _leerSeguimientos();
    let normalizados = 0;

    for (let i = 0; i < seguimientos.length; i++) {
      const s = seguimientos[i];
      let tocado = false;
      if (s.estado === undefined) { s.estado = 'realizada'; tocado = true; }
      if (s.hora === undefined) { s.hora = null; tocado = true; }
      if (s.duracion_min === undefined) { s.duracion_min = 0; tocado = true; }
      if (s.agendado_bool === undefined) { s.agendado_bool = _derivarAgendadoBool(s.tipo); tocado = true; }
      if (!Array.isArray(s.resultados)) { s.resultados = []; tocado = true; }
      if (tocado) normalizados++;
    }

    if (normalizados > 0) {
      _persistirSeguimientos(seguimientos);
    }
    return normalizados;
  }

  const seguimientos = {
    crear:                  seguimientosCrear,
    obtener:                seguimientosObtener,
    listar:                 seguimientosListar,
    eliminar:               seguimientosEliminar,
    actualizar:             seguimientosActualizar,
    reconciliarPersonaIds:  seguimientosReconciliarPersonaIds,
    // v2.14.0: schema rich motor seguimientos §22.7
    cambiarEstado:          seguimientosCambiarEstado,
    migrarSchemaV214:       seguimientosMigrarSchemaV214,
    ENTIDADES_ORIGEN:       _ENTIDADES_ORIGEN,
    TIPOS:                  _TIPOS_SEGUIMIENTO,
    ESTADOS:                _ESTADOS_SEGUIMIENTO
  };


  // ═══════════════════════════════════════════════════════════════════════
  //  CAPA 13 — ajCaptacion [NUEVO v2.5.0]
  //  Gestión de la entidad transversal aj_captacion canonizada en
  //  CLAUDE.md §17 (Frente 6 — Módulo de Captación de Leads).
  //
  //  Sesión código 1 (Sub-frente 6.2) implementó los fundamentos:
  //  CRUD básico + constantes canónicas expuestas + esqueleto
  //  idempotente migrarFrente6().
  //
  //  Sesión código 2 [AMPLIADA v2.6.0] amplía con máquina de estados
  //  canónica (cambiarEstado + validarTransicion según §17.6),
  //  deduplicación por teléfono normalizado (detectarDuplicados
  //  con reutilización de _normalizarTelefono del closure IIFE
  //  Capa 11 — R-F6-2 + D-F6-08), enlace de relacionados
  //  bidireccional + idempotente (enlazarComoRelacionado) y lazy
  //  check de vencimiento de pausa en operaciones de listado y
  //  cambio de estado (§17.6 transición automática 'en_pausa' →
  //  'nuevo' al vencer fecha_pausa_hasta, implementación canónica
  //  en entorno vanilla JS sin backend).
  //
  //  Sesión código 3 [AMPLIADA v2.7.0] cierra el código de la Capa
  //  13 con las funciones de alto nivel: desdoblamiento R-F6-1
  //  (captacionDesdoblar — compraventa en 2 entradas vinculadas
  //  vendedor_inmo + comprador_finanzas), promoción
  //  R-F6-2/3/4/5 (captacionPromover — orquesta dedup persona por
  //  teléfono via personasBuscarPorDedup + alta o reutilización
  //  via personasCrear + agregarEmbudo con fase 'estudio' y
  //  tagOrigen del lead, integrando Capa 13 con Capa 11
  //  ajPersonas vía APIs públicas SIN embeber — C-M033-1
  //  preservada), resolución on-demand de estado de seguimiento
  //  post-promoción (captacionResolverEstadoSeguimiento — D-F6-09
  //  lee embudos[] activos de persona promovida), 3 funciones de
  //  métricas para Panel Supervisor §17.10
  //  (captacionMetricasCampania + captacionTasaConversion +
  //  captacionMotivosDescartePorCampania, funciones puras de
  //  lectura).
  //
  //  Doble-write C-M033-1 deferido: promover() NO crea operación
  //  en aj_operaciones porque la entidad aj_operaciones no existe
  //  todavía como entidad real en código (legacy
  //  cliente.operaciones[] embebido vigente, M-033 Opción 3
  //  híbrido transicional). promovido_a_operacion_id queda null
  //  hasta que aj_operaciones se implemente (Fase 2 backend o
  //  sub-frente futuro). Esto NO viola C-M033-1 — aj_captacion
  //  sigue siendo entidad separada. C-M033-1 prohíbe REPLICAR el
  //  modelo dual en módulos NUEVOS, no obliga a crear
  //  aj_operaciones AHORA.
  //
  //  Disciplinas vinculantes operativas:
  //    - C-M033-1 (CLAUDE.md §18.4): aj_captacion es entidad separada
  //      desde inicio (clave localStorage 'aj_captacion'). PROHIBIDO
  //      replicar modelo dual cliente.operaciones[] embebido.
  //    - C-M033-2 (CLAUDE.md §18.5): NO aplica en Sesión código 1
  //      (sin cambiarEstado todavía). Aplicará en Sesión código 2.
  //
  //  Constantes canónicas expuestas como AJ.captacion.X:
  //    - ESTADOS_EMBUDO    — 5 valores (CLAUDE.md §17.6)
  //    - ESTADOS_LATERALES — 3 valores (CLAUDE.md §17.6)
  //    - TIPOS_LEAD        — 4 valores (CLAUDE.md §17.4 + §17.5)
  //    - MOTIVOS_DESCARTE  — 9 valores (CLAUDE.md §17.6)
  //    - ORIGENES          — 5 valores (CLAUDE.md §17.4)
  // ═══════════════════════════════════════════════════════════════════════

  const _CLAVE_CAPTACION = 'aj_captacion';

  // Estados del embudo principal (CLAUDE.md §17.6).
  const _ESTADOS_EMBUDO = Object.freeze([
    'nuevo',
    'contactando',
    'contactado',
    'cualificando',
    'listo_promover'
  ]);

  // Estados laterales (salidas del embudo, CLAUDE.md §17.6).
  const _ESTADOS_LATERALES = Object.freeze([
    'promovido',
    'descartado',
    'en_pausa'
  ]);

  // Tipos de lead admitidos en `aj_captacion.tipo_lead` (CLAUDE.md
  // §17.4 + §17.5). Los 4 valores son cerrados.
  const _TIPOS_LEAD = Object.freeze([
    'comprador_inmo',
    'vendedor_inmo',
    'comprador_finanzas',
    'compraventa'
  ]);

  // Motivos de descarte canonizados (CLAUDE.md §17.6).
  const _MOTIVOS_DESCARTE = Object.freeze([
    'no_responde',
    'fuera_de_zona',
    'fuera_de_presupuesto',
    'no_cualifica_financiacion',
    'fake_o_erroneo',
    'no_interesado_finalmente',
    'duplicado_de_otro_lead',
    'competencia',
    'otro'
  ]);

  // Orígenes admitidos en `aj_captacion.origen` (CLAUDE.md §17.4).
  const _ORIGENES = Object.freeze([
    'meta_ads',
    'manual',
    'referido',
    'web',
    'otro'
  ]);

  /**
   * Devuelve timestamp ISO 8601 del momento actual. Helper local
   * para uniformidad en created_at / updated_at / deleted_at.
   */
  function _ahora() {
    return new Date().toISOString();
  }

  /**
   * Valida que `tipo_lead` sea uno de los 4 valores admitidos.
   * Lanza si no lo es.
   */
  function _validarTipoLead(tipo) {
    if (typeof tipo !== 'string') {
      throw new Error('[ajCaptacion] tipo_lead obligatorio (string)');
    }
    if (_TIPOS_LEAD.indexOf(tipo) === -1) {
      throw new Error(
        '[ajCaptacion] tipo_lead inválido: "' + tipo +
        '" (debe ser uno de: ' + _TIPOS_LEAD.join(', ') + ')'
      );
    }
  }

  /**
   * Valida que `estado` sea uno de embudo o lateral. Lanza si no.
   */
  function _validarEstadoCaptacion(estado) {
    if (typeof estado !== 'string') {
      throw new Error('[ajCaptacion] estado debe ser string');
    }
    const valido = (_ESTADOS_EMBUDO.indexOf(estado) !== -1) ||
                   (_ESTADOS_LATERALES.indexOf(estado) !== -1);
    if (!valido) {
      throw new Error(
        '[ajCaptacion] estado inválido: "' + estado +
        '" (válidos: ' + _ESTADOS_EMBUDO.concat(_ESTADOS_LATERALES).join(', ') + ')'
      );
    }
  }

  /**
   * Verifica si una entrada aj_captacion con estado='en_pausa' ha
   * vencido su fecha_pausa_hasta. Devuelve true si está vencida
   * (debe transitarse a 'nuevo'). False en cualquier otro caso
   * (estado distinto + sin fecha + fecha futura).
   *
   * Helper para D6 (lazy vencimiento de pausa): invocado por
   * cambiarEstado y captacionListar para implementar la transición
   * automática canonizada en §17.6.
   *
   * @param {object} entrada entrada de aj_captacion
   * @returns {boolean}
   */
  function _vencimientoPausa(entrada) {
    if (!entrada || entrada.estado !== 'en_pausa') return false;
    if (typeof entrada.fecha_pausa_hasta !== 'string') return false;
    const ahoraISO = _ahora();
    return entrada.fecha_pausa_hasta < ahoraISO;
  }

  /**
   * Mapping canónico suite_destino × tipo_lead → {rol, embudo}
   * según D14 (CLAUDE.md §17.4 + §17.5 + Capa 11 _ROLES_CANONICOS
   * + _EMBUDOS_CANONICOS).
   *
   * Helper privado usado por captacionPromover para resolver el
   * rol que recibirá la persona en aj_personas y el embudo que
   * se añadirá vía personasAgregarEmbudo.
   *
   * Casos cubiertos:
   *   - inmo + comprador_inmo      → rol='comprador_inmo',   embudo='comprador_inmo'
   *   - inmo + vendedor_inmo       → rol='vendedor_inmo',    embudo='vendedor_inmo'
   *   - finances + comprador_finanzas → rol='cliente_finances', embudo='cliente_finances'
   *   - ambas → throw (debe haberse desdoblado antes via captacionDesdoblar)
   *
   * @param {string} suite_destino
   * @param {string} tipo_lead
   * @returns {{rol: string, embudo: string}}
   * @throws {Error} si la combinación no es válida o requiere desdoblamiento previo
   */
  function _mappingPromocion(suite_destino, tipo_lead) {
    if (suite_destino === 'ambas') {
      throw new Error(
        '[ajCaptacion] suite_destino "ambas" requiere desdoblamiento previo via captacionDesdoblar (R-F6-1)'
      );
    }
    if (suite_destino === 'inmo' && tipo_lead === 'comprador_inmo') {
      return { rol: 'comprador_inmo', embudo: 'comprador_inmo' };
    }
    if (suite_destino === 'inmo' && tipo_lead === 'vendedor_inmo') {
      return { rol: 'vendedor_inmo', embudo: 'vendedor_inmo' };
    }
    if (suite_destino === 'finances' && tipo_lead === 'comprador_finanzas') {
      return { rol: 'cliente_finances', embudo: 'cliente_finances' };
    }
    throw new Error(
      '[ajCaptacion] combinación inválida suite_destino="' + suite_destino +
      '" tipo_lead="' + tipo_lead + '" (D14)'
    );
  }

  /**
   * Lee el array completo de captaciones desde localStorage. Si la
   * clave no existe devuelve []. NO filtra soft-deletes (eso lo
   * hacen las funciones públicas listar/obtener con `incluir_eliminados`).
   */
  function _leerCaptaciones() {
    const raw = store.get(_CLAVE_CAPTACION);
    if (raw === null || raw === undefined) {
      return [];
    }
    if (!Array.isArray(raw)) {
      // Salvaguarda: si la clave existe con valor no-array (corrupto),
      // tratar como vacío sin sobrescribir todavía.
      return [];
    }
    return raw;
  }

  /**
   * Persiste el array completo de captaciones a localStorage usando
   * Capa 2 Store. Usado por todas las funciones que mutan estado.
   */
  function _persistirCaptaciones(arr) {
    store.set(_CLAVE_CAPTACION, arr);
  }

  /**
   * Crea una nueva entrada en aj_captacion. Validaciones:
   *   - datos.tipo_lead obligatorio + uno de _TIPOS_LEAD.
   *   - datos.nombre_completo obligatorio (string no vacío).
   *   - datos.telefono obligatorio (string).
   *   - datos.origen opcional (defecto 'manual').
   *   - datos.suite_destino opcional.
   *   - Resto de campos del shape §17.4 son opcionales con defectos:
   *     estado='nuevo', motivo_descarte=null, fecha_pausa_hasta=null,
   *     agente_asignado_id=null, leads_relacionados=[], desdoblado_en=[],
   *     desdoblado_de=null, acciones=[], deleted_at=null.
   *
   * @param {object} datos
   * @returns {object} entrada creada con id AJ-CL-NNN
   */
  function captacionCrear(datos) {
    if (!datos || typeof datos !== 'object') {
      throw new Error('[ajCaptacion] datos obligatorio (object)');
    }
    _validarTipoLead(datos.tipo_lead);
    if (typeof datos.nombre_completo !== 'string' || datos.nombre_completo.trim() === '') {
      throw new Error('[ajCaptacion] nombre_completo obligatorio (string no vacío)');
    }
    if (typeof datos.telefono !== 'string') {
      throw new Error('[ajCaptacion] telefono obligatorio (string)');
    }

    const ahora = _ahora();
    const nuevaEntrada = {
      id: idCodigoHumano('captacion'),
      created_at: ahora,
      updated_at: ahora,
      deleted_at: null,

      origen: datos.origen || 'manual',
      source_id: datos.source_id || null,
      fecha_captacion: datos.fecha_captacion || ahora,

      meta: datos.meta || {
        campaign_id: null, campaign_name: null,
        adset_id: null, adset_name: null,
        ad_id: null, ad_name: null,
        form_id: null, platform: null, created_time: null
      },

      nombre_completo: datos.nombre_completo,
      telefono: datos.telefono,
      email: datos.email || null,
      requiere_revision_nombre: datos.requiere_revision_nombre || false,

      tipo_lead: datos.tipo_lead,
      suite_destino: datos.suite_destino || null,

      datos: datos.datos || {},

      estado: 'nuevo',
      motivo_descarte: null,
      motivo_descarte_notas: null,
      agente_asignado_id: datos.agente_asignado_id || null,
      fecha_pausa_hasta: null,

      leads_relacionados: [],
      desdoblado_en: [],
      desdoblado_de: null,

      acciones: [],

      promovido_en: null,
      promovido_a_persona_id: null,
      promovido_a_operacion_id: null,
      promovido_a_suite: null,
      promovido_por_agente_id: null
    };

    const captaciones = _leerCaptaciones();
    captaciones.push(nuevaEntrada);
    _persistirCaptaciones(captaciones);

    return nuevaEntrada;
  }

  /**
   * Devuelve la entrada con id `id`. Devuelve null si no existe o
   * si está soft-deleted (a menos que `incluir_eliminado=true`).
   */
  function captacionObtener(id, incluir_eliminado) {
    if (typeof id !== 'string') return null;
    const captaciones = _leerCaptaciones();
    for (let i = 0; i < captaciones.length; i++) {
      const c = captaciones[i];
      if (c && c.id === id) {
        if (c.deleted_at && !incluir_eliminado) return null;
        return c;
      }
    }
    return null;
  }

  /**
   * Lista entradas filtradas. Filtros opcionales:
   *   - estado: string o array de strings
   *   - tipo_lead: string
   *   - suite_destino: string
   *   - agente_asignado_id: string
   *   - incluir_eliminados: boolean (defecto false)
   *
   * Si filtros es null/undefined → devuelve todas excepto eliminadas.
   */
  function captacionListar(filtros) {
    filtros = filtros || {};
    const captaciones = _leerCaptaciones();
    const incluirEliminados = filtros.incluir_eliminados === true;

    // D6 — lazy vencimiento de pausa: transitar 'en_pausa' vencido → 'nuevo'.
    let huboCambios = false;
    for (let i = 0; i < captaciones.length; i++) {
      if (_vencimientoPausa(captaciones[i])) {
        captaciones[i].estado = 'nuevo';
        captaciones[i].fecha_pausa_hasta = null;
        captaciones[i].updated_at = _ahora();
        huboCambios = true;
      }
    }
    if (huboCambios) {
      _persistirCaptaciones(captaciones);
    }

    return captaciones.filter(function (c) {
      if (!c) return false;
      if (c.deleted_at && !incluirEliminados) return false;
      if (filtros.tipo_lead && c.tipo_lead !== filtros.tipo_lead) return false;
      if (filtros.suite_destino && c.suite_destino !== filtros.suite_destino) return false;
      if (filtros.agente_asignado_id && c.agente_asignado_id !== filtros.agente_asignado_id) return false;
      if (filtros.estado) {
        if (Array.isArray(filtros.estado)) {
          if (filtros.estado.indexOf(c.estado) === -1) return false;
        } else {
          if (c.estado !== filtros.estado) return false;
        }
      }
      return true;
    });
  }

  /**
   * Actualiza una entrada existente con cambios parciales. Rechaza
   * actualizar id / created_at. NO valida transiciones de estado
   * (eso lo hará cambiarEstado() en Sesión código 2). Si cambia
   * `estado` lo valida contra _ESTADOS_EMBUDO + _ESTADOS_LATERALES.
   *
   * Devuelve la entrada actualizada. Lanza si id no existe o está
   * soft-deleted.
   */
  function captacionActualizar(id, cambios) {
    if (typeof id !== 'string') {
      throw new Error('[ajCaptacion] id obligatorio (string)');
    }
    if (!cambios || typeof cambios !== 'object') {
      throw new Error('[ajCaptacion] cambios obligatorio (object)');
    }
    if (Object.prototype.hasOwnProperty.call(cambios, 'id')) {
      throw new Error('[ajCaptacion] id no modificable');
    }
    if (Object.prototype.hasOwnProperty.call(cambios, 'created_at')) {
      throw new Error('[ajCaptacion] created_at no modificable');
    }
    if (Object.prototype.hasOwnProperty.call(cambios, 'estado')) {
      _validarEstadoCaptacion(cambios.estado);
    }
    if (Object.prototype.hasOwnProperty.call(cambios, 'tipo_lead')) {
      _validarTipoLead(cambios.tipo_lead);
    }

    const captaciones = _leerCaptaciones();
    let encontrada = null;
    for (let i = 0; i < captaciones.length; i++) {
      if (captaciones[i] && captaciones[i].id === id) {
        if (captaciones[i].deleted_at) {
          throw new Error('[ajCaptacion] id "' + id + '" soft-deleted, no actualizable');
        }
        const keys = Object.keys(cambios);
        for (let k = 0; k < keys.length; k++) {
          captaciones[i][keys[k]] = cambios[keys[k]];
        }
        captaciones[i].updated_at = _ahora();
        encontrada = captaciones[i];
        break;
      }
    }
    if (!encontrada) {
      throw new Error('[ajCaptacion] id "' + id + '" no encontrado');
    }
    _persistirCaptaciones(captaciones);
    return encontrada;
  }

  /**
   * Soft-delete: marca deleted_at con timestamp actual. Idempotente
   * (si ya está soft-deleted no la toca). Devuelve true si marcó,
   * false si ya estaba marcada o no existe.
   */
  function captacionSoftDelete(id) {
    if (typeof id !== 'string') return false;
    const captaciones = _leerCaptaciones();
    for (let i = 0; i < captaciones.length; i++) {
      if (captaciones[i] && captaciones[i].id === id) {
        if (captaciones[i].deleted_at) return false;
        captaciones[i].deleted_at = _ahora();
        captaciones[i].updated_at = captaciones[i].deleted_at;
        _persistirCaptaciones(captaciones);
        return true;
      }
    }
    return false;
  }

  /**
   * Tabla canónica de transiciones permitidas entre estados de
   * aj_captacion (CLAUDE.md §17.6).
   *
   * Estructura: clave = estado actual, valor = array de estados
   * destino permitidos. Estados terminales (no transicionan):
   * 'promovido'. Estado 'en_pausa' transita automáticamente a
   * 'nuevo' al vencer fecha_pausa_hasta (D6 lazy check).
   */
  const _TRANSICIONES_PERMITIDAS = Object.freeze({
    'nuevo':          Object.freeze(['contactando', 'descartado', 'en_pausa']),
    'contactando':    Object.freeze(['contactado', 'descartado', 'en_pausa']),
    'contactado':     Object.freeze(['cualificando', 'descartado', 'en_pausa']),
    'cualificando':   Object.freeze(['listo_promover', 'descartado', 'en_pausa']),
    'listo_promover': Object.freeze(['promovido', 'descartado']),
    'en_pausa':       Object.freeze(['nuevo', 'descartado']),
    'descartado':     Object.freeze(['nuevo']),
    'promovido':      Object.freeze([])
  });

  /**
   * Valida si una transición de estado es permitida según la tabla
   * canónica de §17.6. NO valida el contexto (motivo_descarte /
   * fecha_pausa_hasta) — eso es responsabilidad de cambiarEstado.
   *
   * Pública para uso por UIs que deshabiliten opciones inválidas
   * en dropdowns/menus antes de invocar cambiarEstado.
   *
   * @param {string} estado_actual
   * @param {string} estado_nuevo
   * @returns {boolean} true si la transición es permitida
   */
  function captacionValidarTransicion(estado_actual, estado_nuevo) {
    if (typeof estado_actual !== 'string') return false;
    if (typeof estado_nuevo !== 'string') return false;
    const destinos = _TRANSICIONES_PERMITIDAS[estado_actual];
    if (!destinos) return false;
    return destinos.indexOf(estado_nuevo) !== -1;
  }

  /**
   * Transita una entrada de aj_captacion a un nuevo estado.
   *
   * Flujo:
   *   1. Lee la entrada. Si no existe o soft-deleted → throw.
   *   2. Lazy check de vencimiento de pausa: si la entrada está
   *      en 'en_pausa' con fecha_pausa_hasta vencida, primero
   *      transita silenciosamente a 'nuevo' (limpiando
   *      fecha_pausa_hasta) y luego continúa con la transición
   *      solicitada desde 'nuevo'.
   *   3. Valida transición permitida via captacionValidarTransicion.
   *      Si no permitida → throw con mensaje detallado.
   *   4. Valida contexto según destino:
   *        - 'descartado' → contexto.motivo obligatorio + en
   *          _MOTIVOS_DESCARTE. contexto.notas opcional.
   *        - 'en_pausa' → contexto.fecha_pausa_hasta obligatorio +
   *          ISO 8601 + futuro (> ahora).
   *        - Otros estados → contexto puede ser null/undefined.
   *   5. Construye objeto cambios con campos derivados:
   *        - estado: nuevo_estado
   *        - motivo_descarte / motivo_descarte_notas: si destino
   *          'descartado'
   *        - fecha_pausa_hasta: si destino 'en_pausa', SET; si
   *          origen 'en_pausa' (reactivación), CLEAR a null.
   *   6. Invoca captacionActualizar(id, cambios) para persistir.
   *      Esto reusa updated_at + validaciones de campos.
   *
   * @param {string} id
   * @param {string} nuevo_estado uno de _ESTADOS_EMBUDO o _ESTADOS_LATERALES
   * @param {object} [contexto] datos según destino
   * @returns {object} entrada actualizada
   * @throws {Error} si id no existe / soft-deleted / transición no
   *                 permitida / contexto incompleto
   */
  function captacionCambiarEstado(id, nuevo_estado, contexto) {
    if (typeof id !== 'string') {
      throw new Error('[ajCaptacion] id obligatorio (string)');
    }
    _validarEstadoCaptacion(nuevo_estado);

    const captaciones = _leerCaptaciones();
    let entrada = null;
    let indice = -1;
    for (let i = 0; i < captaciones.length; i++) {
      if (captaciones[i] && captaciones[i].id === id) {
        if (captaciones[i].deleted_at) {
          throw new Error('[ajCaptacion] id "' + id + '" soft-deleted, no transicionable');
        }
        entrada = captaciones[i];
        indice = i;
        break;
      }
    }
    if (!entrada) {
      throw new Error('[ajCaptacion] id "' + id + '" no encontrado');
    }

    // D6 — lazy vencimiento de pausa.
    let estadoActual = entrada.estado;
    if (_vencimientoPausa(entrada)) {
      captaciones[indice].estado = 'nuevo';
      captaciones[indice].fecha_pausa_hasta = null;
      captaciones[indice].updated_at = _ahora();
      _persistirCaptaciones(captaciones);
      estadoActual = 'nuevo';
    }

    // Validación de transición permitida.
    if (!captacionValidarTransicion(estadoActual, nuevo_estado)) {
      throw new Error(
        '[ajCaptacion] transición no permitida: "' + estadoActual +
        '" → "' + nuevo_estado + '"'
      );
    }

    // Validación de contexto según destino.
    const cambios = { estado: nuevo_estado };
    if (nuevo_estado === 'descartado') {
      if (!contexto || typeof contexto !== 'object') {
        throw new Error('[ajCaptacion] transición a "descartado" requiere contexto con motivo');
      }
      if (typeof contexto.motivo !== 'string') {
        throw new Error('[ajCaptacion] contexto.motivo obligatorio (string)');
      }
      if (_MOTIVOS_DESCARTE.indexOf(contexto.motivo) === -1) {
        throw new Error(
          '[ajCaptacion] contexto.motivo inválido: "' + contexto.motivo +
          '" (válidos: ' + _MOTIVOS_DESCARTE.join(', ') + ')'
        );
      }
      cambios.motivo_descarte = contexto.motivo;
      cambios.motivo_descarte_notas = (typeof contexto.notas === 'string') ? contexto.notas : null;
    } else if (nuevo_estado === 'en_pausa') {
      if (!contexto || typeof contexto !== 'object') {
        throw new Error('[ajCaptacion] transición a "en_pausa" requiere contexto con fecha_pausa_hasta');
      }
      if (typeof contexto.fecha_pausa_hasta !== 'string') {
        throw new Error('[ajCaptacion] contexto.fecha_pausa_hasta obligatorio (ISO 8601 string)');
      }
      if (contexto.fecha_pausa_hasta <= _ahora()) {
        throw new Error('[ajCaptacion] contexto.fecha_pausa_hasta debe ser futuro');
      }
      cambios.fecha_pausa_hasta = contexto.fecha_pausa_hasta;
    }

    // Si origen 'en_pausa' (reactivación), limpiar fecha_pausa_hasta.
    if (estadoActual === 'en_pausa' && nuevo_estado !== 'en_pausa') {
      cambios.fecha_pausa_hasta = null;
    }

    return captacionActualizar(id, cambios);
  }

  /**
   * Detecta entradas duplicadas en aj_captacion por teléfono
   * normalizado (R-F6-2 + D-F6-08).
   *
   * Normalización del teléfono: REUTILIZA _normalizarTelefono del
   * closure IIFE (declarada en Capa 11, función pura sin estado).
   * Comportamiento canonizado: elimina espacios + guiones + prefijo
   * '+34'. Comparación case-insensitive implícita (los dígitos
   * son los mismos).
   *
   * Excluye entradas soft-deleted (deleted_at !== null).
   * Excluye una entrada por id si se pasa excluir_id (útil al
   * detectar duplicados antes de crear una entrada que ya tiene
   * id asignado).
   *
   * @param {string} telefono teléfono a buscar (normalizado internamente)
   * @param {string} [excluir_id] id a excluir del resultado
   * @returns {Array<object>} entradas con teléfono normalizado coincidente
   */
  function captacionDetectarDuplicados(telefono, excluir_id) {
    if (typeof telefono !== 'string') return [];
    const telNorm = _normalizarTelefono(telefono);
    if (telNorm === '') return [];

    const captaciones = _leerCaptaciones();
    const duplicados = [];
    for (let i = 0; i < captaciones.length; i++) {
      const c = captaciones[i];
      if (!c) continue;
      if (c.deleted_at) continue;
      if (excluir_id && c.id === excluir_id) continue;
      if (typeof c.telefono !== 'string') continue;
      if (_normalizarTelefono(c.telefono) === telNorm) {
        duplicados.push(c);
      }
    }
    return duplicados;
  }

  /**
   * Enlaza dos entradas de aj_captacion como relacionadas
   * (R-F6-2 + R-F6-3). Operación BIDIRECCIONAL + IDEMPOTENTE:
   *
   *   - Si A enlaza B, también B se enlaza con A.
   *   - Si ya están enlazadas, NO duplicar (idempotente).
   *
   * Usado típicamente para enlazar duplicados detectados por
   * detectarDuplicados, o para vincular entradas desdobladas
   * (Sesión código 3 desdoblar R-F6-1).
   *
   * Validaciones:
   *   - id_a !== id_b (no auto-enlace).
   *   - Ambos ids existen y no soft-deleted.
   *
   * @param {string} id_a
   * @param {string} id_b
   * @returns {boolean} true si se modificó algo (cualquier dirección), false si idempotente
   * @throws {Error} si ids inválidos / iguales / no encontrados / soft-deleted
   */
  function captacionEnlazarComoRelacionado(id_a, id_b) {
    if (typeof id_a !== 'string' || typeof id_b !== 'string') {
      throw new Error('[ajCaptacion] id_a + id_b obligatorios (string)');
    }
    if (id_a === id_b) {
      throw new Error('[ajCaptacion] id_a + id_b deben ser distintos');
    }

    const captaciones = _leerCaptaciones();
    let idxA = -1;
    let idxB = -1;
    for (let i = 0; i < captaciones.length; i++) {
      if (!captaciones[i]) continue;
      if (captaciones[i].id === id_a) idxA = i;
      if (captaciones[i].id === id_b) idxB = i;
    }
    if (idxA === -1) throw new Error('[ajCaptacion] id_a "' + id_a + '" no encontrado');
    if (idxB === -1) throw new Error('[ajCaptacion] id_b "' + id_b + '" no encontrado');
    if (captaciones[idxA].deleted_at) {
      throw new Error('[ajCaptacion] id_a "' + id_a + '" soft-deleted');
    }
    if (captaciones[idxB].deleted_at) {
      throw new Error('[ajCaptacion] id_b "' + id_b + '" soft-deleted');
    }

    let cambios = false;
    const ahora = _ahora();

    if (!Array.isArray(captaciones[idxA].leads_relacionados)) {
      captaciones[idxA].leads_relacionados = [];
    }
    if (captaciones[idxA].leads_relacionados.indexOf(id_b) === -1) {
      captaciones[idxA].leads_relacionados.push(id_b);
      captaciones[idxA].updated_at = ahora;
      cambios = true;
    }

    if (!Array.isArray(captaciones[idxB].leads_relacionados)) {
      captaciones[idxB].leads_relacionados = [];
    }
    if (captaciones[idxB].leads_relacionados.indexOf(id_a) === -1) {
      captaciones[idxB].leads_relacionados.push(id_a);
      captaciones[idxB].updated_at = ahora;
      cambios = true;
    }

    if (cambios) {
      _persistirCaptaciones(captaciones);
    }
    return cambios;
  }

  /**
   * Desdobla una entrada aj_captacion de tipo_lead 'compraventa'
   * en 2 entradas vinculadas (R-F6-1):
   *
   *   - Entrada A: tipo_lead='vendedor_inmo', suite_destino='inmo'
   *     con datos copiados de original.datos.piso_actual.
   *   - Entrada B: tipo_lead='comprador_finanzas',
   *     suite_destino='finances' con datos derivados de
   *     original.datos.piso_objetivo (tipo_hipoteca='compra' +
   *     importe_solicitado + zona_propiedad).
   *
   * Vinculación bidireccional + idempotente:
   *   - original.desdoblado_en = [id_A, id_B]
   *   - A.desdoblado_de = original.id, B.desdoblado_de = original.id
   *   - A↔B enlazadas via captacionEnlazarComoRelacionado
   *
   * Validaciones:
   *   - entrada existe y no soft-deleted (throw)
   *   - tipo_lead === 'compraventa' (throw si no)
   *   - desdoblado_en vacío (throw si ya desdoblada — protección
   *     anti-duplicación en lugar de devolver IDs silenciosamente)
   *
   * @param {string} id id de la entrada compraventa a desdoblar
   * @returns {{original_id: string, vendedor_id: string, comprador_finanzas_id: string}}
   * @throws {Error} si validaciones fallan
   */
  function captacionDesdoblar(id) {
    if (typeof id !== 'string') {
      throw new Error('[ajCaptacion] id obligatorio (string)');
    }
    const entrada = captacionObtener(id);
    if (!entrada) {
      throw new Error('[ajCaptacion] id "' + id + '" no encontrado');
    }
    if (entrada.tipo_lead !== 'compraventa') {
      throw new Error(
        '[ajCaptacion] tipo_lead debe ser "compraventa" para desdoblar, recibido: "' +
        entrada.tipo_lead + '"'
      );
    }
    if (Array.isArray(entrada.desdoblado_en) && entrada.desdoblado_en.length > 0) {
      throw new Error('[ajCaptacion] entrada "' + id + '" ya desdoblada');
    }

    const datosOriginal = entrada.datos || {};
    const pisoActual = datosOriginal.piso_actual || {};
    const pisoObjetivo = datosOriginal.piso_objetivo || {};

    // Entrada A — vendedor_inmo.
    const datosA = {
      tipo_lead:        'vendedor_inmo',
      suite_destino:    'inmo',
      nombre_completo:  entrada.nombre_completo,
      telefono:         entrada.telefono,
      email:            entrada.email,
      origen:           entrada.origen,
      source_id:        entrada.source_id,
      fecha_captacion:  entrada.fecha_captacion,
      meta:             entrada.meta,
      agente_asignado_id: entrada.agente_asignado_id,
      datos: {
        tipo_inmueble:      pisoActual.tipo_inmueble || null,
        ubicacion:          pisoActual.ubicacion || null,
        precio_estimado:    pisoActual.precio_estimado || null,
        motivo_venta:       null,
        plazo_deseado:      null,
        busca_comprar_otro: true
      }
    };
    const nuevaA = captacionCrear(datosA);

    // Entrada B — comprador_finanzas.
    const datosB = {
      tipo_lead:        'comprador_finanzas',
      suite_destino:    'finances',
      nombre_completo:  entrada.nombre_completo,
      telefono:         entrada.telefono,
      email:            entrada.email,
      origen:           entrada.origen,
      source_id:        entrada.source_id,
      fecha_captacion:  entrada.fecha_captacion,
      meta:             entrada.meta,
      agente_asignado_id: entrada.agente_asignado_id,
      datos: {
        tipo_hipoteca:                'compra',
        importe_solicitado:           pisoObjetivo.importe_hipoteca_estimado || null,
        ingresos_titular:             null,
        ingresos_cotitular:           null,
        tiene_propiedad_seleccionada: false,
        zona_propiedad:               pisoObjetivo.zona_preferida || null
      }
    };
    const nuevaB = captacionCrear(datosB);

    // Vincular en una sola escritura final.
    const captaciones = _leerCaptaciones();
    let idxOriginal = -1, idxA = -1, idxB = -1;
    for (let i = 0; i < captaciones.length; i++) {
      if (!captaciones[i]) continue;
      if (captaciones[i].id === id) idxOriginal = i;
      if (captaciones[i].id === nuevaA.id) idxA = i;
      if (captaciones[i].id === nuevaB.id) idxB = i;
    }

    const ahora = _ahora();
    captaciones[idxOriginal].desdoblado_en = [nuevaA.id, nuevaB.id];
    captaciones[idxOriginal].updated_at = ahora;
    captaciones[idxA].desdoblado_de = id;
    captaciones[idxA].updated_at = ahora;
    captaciones[idxB].desdoblado_de = id;
    captaciones[idxB].updated_at = ahora;

    _persistirCaptaciones(captaciones);

    // Enlazar A↔B bidireccional + idempotente.
    captacionEnlazarComoRelacionado(nuevaA.id, nuevaB.id);

    return {
      original_id:           id,
      vendedor_id:           nuevaA.id,
      comprador_finanzas_id: nuevaB.id
    };
  }

  /**
   * Promueve una entrada aj_captacion a aj_personas (R-F6-2 +
   * R-F6-3 + R-F6-4 + R-F6-5). Orquesta:
   *
   *   1. Validaciones (estado origen 'listo_promover' o
   *      'cualificando'; tipo_lead 'compraventa' bloqueado sin
   *      desdoblamiento previo).
   *   2. Resolución personaId: reutilizar via reutilizar_persona_id
   *      directo, o dedup por teléfono via
   *      personasBuscarPorDedup (R-F6-2), o crear nueva via
   *      personasCrear con rol según D14 mapping.
   *   3. Agregar embudo a persona via personasAgregarEmbudo con
   *      fase 'estudio' (R-F6-4) y tagOrigen del lead (R-F6-3 +
   *      R-F6-5).
   *   4. Transitar aj_captacion.estado a 'promovido' via
   *      captacionCambiarEstado.
   *   5. Rellenar campos promovido_* via captacionActualizar.
   *
   * Doble-write C-M033-1 deferido: promovido_a_operacion_id queda
   * null hasta que aj_operaciones se implemente (Fase 2 backend o
   * sub-frente futuro). Esto NO viola C-M033-1 — aj_captacion
   * sigue siendo entidad separada.
   *
   * @param {string} id id de la entrada aj_captacion a promover
   * @param {object} [opciones_wizard]
   * @param {string} [opciones_wizard.agente_asignado_id] override agente
   * @param {string} [opciones_wizard.reutilizar_persona_id] bypass dedup
   * @param {object} [opciones_wizard.datos_persona] overrides nombre/teléfono/email
   * @returns {{captacion_id: string, persona_id: string, embudo: string, reutilizada_persona: boolean}}
   * @throws {Error} si validaciones fallan
   */
  function captacionPromover(id, opciones_wizard) {
    if (typeof id !== 'string') {
      throw new Error('[ajCaptacion] id obligatorio (string)');
    }
    opciones_wizard = opciones_wizard || {};

    const entrada = captacionObtener(id);
    if (!entrada) {
      throw new Error('[ajCaptacion] id "' + id + '" no encontrado');
    }
    if (entrada.estado !== 'listo_promover') {
      throw new Error(
        '[ajCaptacion] promoción requiere estado "listo_promover", recibido: "' +
        entrada.estado + '"'
      );
    }
    if (entrada.tipo_lead === 'compraventa' &&
        (!Array.isArray(entrada.desdoblado_en) || entrada.desdoblado_en.length === 0)) {
      throw new Error(
        '[ajCaptacion] entrada compraventa debe desdoblarse antes de promover (D-F6-01 + R-F6-1)'
      );
    }

    const mapping = _mappingPromocion(entrada.suite_destino, entrada.tipo_lead);
    const datosPersona = opciones_wizard.datos_persona || {};
    const nombrePersona   = datosPersona.nombre_completo || entrada.nombre_completo;
    const telefonoPersona = datosPersona.telefono || entrada.telefono;
    const emailPersona    = datosPersona.email || entrada.email;
    const agenteId        = opciones_wizard.agente_asignado_id || entrada.agente_asignado_id;

    let personaId;
    let reutilizadaPersona;

    if (typeof opciones_wizard.reutilizar_persona_id === 'string') {
      personaId = opciones_wizard.reutilizar_persona_id;
      reutilizadaPersona = true;
    } else {
      // R-F6-2 dedup por teléfono.
      const candidatos = personas.buscarPorDedup({ telefono: telefonoPersona });
      let matchTelefono = null;
      for (let i = 0; i < candidatos.length; i++) {
        if (candidatos[i].criteriosCoincidencia.indexOf('telefono') !== -1) {
          matchTelefono = candidatos[i];
          break;
        }
      }
      if (matchTelefono) {
        personaId = matchTelefono.personaId;
        reutilizadaPersona = true;
      } else {
        const resCreacion = personas.crear({
          nombre:   nombrePersona,
          telefono: telefonoPersona,
          email:    emailPersona
        }, mapping.rol);
        personaId = resCreacion.creada.id;
        reutilizadaPersona = false;
      }
    }

    // R-F6-3 + R-F6-4 + R-F6-5.
    personas.agregarEmbudo(personaId, mapping.embudo, {
      agenteId: agenteId,
      notas: {
        fase:      'estudio',
        tagOrigen: entrada.origen || 'manual'
      }
    });

    // Transitar estado vía cambiarEstado (valida transición).
    captacionCambiarEstado(id, 'promovido', null);

    // Rellenar campos promovido_*.
    captacionActualizar(id, {
      promovido_en:             _ahora(),
      promovido_a_persona_id:   personaId,
      promovido_a_operacion_id: null,   // D11 — deferido hasta aj_operaciones operativa
      promovido_a_suite:        entrada.suite_destino,
      promovido_por_agente_id:  agenteId
    });

    return {
      captacion_id:        id,
      persona_id:          personaId,
      embudo:              mapping.embudo,
      reutilizada_persona: reutilizadaPersona
    };
  }

  /**
   * Resuelve on-demand el estado actual de seguimiento de una
   * entrada aj_captacion ya promovida (D-F6-09).
   *
   * Lee la persona resultante en aj_personas y filtra sus
   * embudos[] activos por el embudo correspondiente al tipo_lead +
   * suite_destino de la captación promovida.
   *
   * Función pura de lectura. No muta estado.
   *
   * @param {string} id id de la entrada aj_captacion promovida
   * @returns {{persona_id: string, persona_nombre: string, embudos_activos: Array, total_activos: number}}
   * @throws {Error} si entrada no existe / no promovida / persona no encontrada
   */
  function captacionResolverEstadoSeguimiento(id) {
    if (typeof id !== 'string') {
      throw new Error('[ajCaptacion] id obligatorio (string)');
    }
    const entrada = captacionObtener(id);
    if (!entrada) {
      throw new Error('[ajCaptacion] id "' + id + '" no encontrado');
    }
    if (entrada.estado !== 'promovido') {
      throw new Error(
        '[ajCaptacion] resolverEstadoSeguimiento requiere estado "promovido", recibido: "' +
        entrada.estado + '"'
      );
    }
    if (typeof entrada.promovido_a_persona_id !== 'string') {
      throw new Error('[ajCaptacion] entrada promovida sin promovido_a_persona_id');
    }

    const persona = personas.obtener(entrada.promovido_a_persona_id);
    if (!persona) {
      throw new Error(
        '[ajCaptacion] persona "' + entrada.promovido_a_persona_id + '" no encontrada en aj_personas'
      );
    }

    const mapping = _mappingPromocion(entrada.suite_destino, entrada.tipo_lead);
    const embudosActivos = [];
    if (Array.isArray(persona.embudos)) {
      for (let i = 0; i < persona.embudos.length; i++) {
        const e = persona.embudos[i];
        if (e && e.embudo === mapping.embudo && e.estado === 'activo') {
          embudosActivos.push({
            embudo:   e.embudo,
            desde:    e.desde,
            agenteId: e.agenteId,
            notas:    e.notas
          });
        }
      }
    }

    return {
      persona_id:      persona.id,
      persona_nombre:  persona.nombre,
      embudos_activos: embudosActivos,
      total_activos:   embudosActivos.length
    };
  }

  /**
   * Métricas de campaña Meta: cuenta entradas aj_captacion con
   * meta.campaign_id === campaign_id, agrupadas por estado.
   *
   * Función pura de lectura.
   * Excluye entradas soft-deleted.
   *
   * @param {string} campaign_id
   * @returns {{campaign_id: string, total: number, por_estado: Object}}
   */
  function captacionMetricasCampania(campaign_id) {
    if (typeof campaign_id !== 'string') {
      throw new Error('[ajCaptacion] campaign_id obligatorio (string)');
    }

    const captaciones = _leerCaptaciones();
    const porEstado = {};
    const estadosTodos = _ESTADOS_EMBUDO.concat(_ESTADOS_LATERALES);
    for (let i = 0; i < estadosTodos.length; i++) {
      porEstado[estadosTodos[i]] = 0;
    }
    let total = 0;

    for (let i = 0; i < captaciones.length; i++) {
      const c = captaciones[i];
      if (!c) continue;
      if (c.deleted_at) continue;
      if (!c.meta || c.meta.campaign_id !== campaign_id) continue;
      total++;
      if (typeof porEstado[c.estado] === 'number') {
        porEstado[c.estado]++;
      }
    }

    return {
      campaign_id: campaign_id,
      total:       total,
      por_estado:  porEstado
    };
  }

  /**
   * Tasa de conversión global o filtrada. Función pura de lectura.
   *
   * Filtros opcionales:
   *   - campaign_id: string
   *   - agente_asignado_id: string
   *   - origen: string
   *   - desde: ISO 8601 (fecha_captacion >= desde)
   *   - hasta: ISO 8601 (fecha_captacion <= hasta)
   *
   * Excluye entradas soft-deleted.
   *
   * @param {object} [filtros]
   * @returns {{total: number, promovidos: number, descartados: number, en_curso: number, tasa_conversion: number}}
   */
  function captacionTasaConversion(filtros) {
    filtros = filtros || {};
    const captaciones = _leerCaptaciones();
    let total = 0;
    let promovidos = 0;
    let descartados = 0;
    let en_curso = 0;

    for (let i = 0; i < captaciones.length; i++) {
      const c = captaciones[i];
      if (!c) continue;
      if (c.deleted_at) continue;
      if (filtros.campaign_id) {
        if (!c.meta || c.meta.campaign_id !== filtros.campaign_id) continue;
      }
      if (filtros.agente_asignado_id && c.agente_asignado_id !== filtros.agente_asignado_id) continue;
      if (filtros.origen && c.origen !== filtros.origen) continue;
      if (filtros.desde && (typeof c.fecha_captacion !== 'string' || c.fecha_captacion < filtros.desde)) continue;
      if (filtros.hasta && (typeof c.fecha_captacion !== 'string' || c.fecha_captacion > filtros.hasta)) continue;

      total++;
      if (c.estado === 'promovido') promovidos++;
      else if (c.estado === 'descartado') descartados++;
      else en_curso++;
    }

    const tasa = (total > 0) ? (promovidos / total) : 0;
    return {
      total:           total,
      promovidos:      promovidos,
      descartados:     descartados,
      en_curso:        en_curso,
      tasa_conversion: tasa
    };
  }

  /**
   * Matriz de motivos de descarte agrupados por campaign_id.
   * Función pura de lectura.
   *
   * Entradas sin meta.campaign_id se agrupan bajo clave 'sin_campania'.
   * Solo considera entradas con estado='descartado' y motivo_descarte
   * presente.
   * Excluye soft-deleted.
   *
   * @returns {Object} {[campaign_id]: {[motivo]: count}}
   */
  function captacionMotivosDescartePorCampania() {
    const captaciones = _leerCaptaciones();
    const matriz = {};

    for (let i = 0; i < captaciones.length; i++) {
      const c = captaciones[i];
      if (!c) continue;
      if (c.deleted_at) continue;
      if (c.estado !== 'descartado') continue;
      if (typeof c.motivo_descarte !== 'string') continue;

      const campaignKey = (c.meta && typeof c.meta.campaign_id === 'string')
        ? c.meta.campaign_id
        : 'sin_campania';

      if (!matriz[campaignKey]) {
        matriz[campaignKey] = {};
      }
      if (typeof matriz[campaignKey][c.motivo_descarte] !== 'number') {
        matriz[campaignKey][c.motivo_descarte] = 0;
      }
      matriz[campaignKey][c.motivo_descarte]++;
    }

    return matriz;
  }

  /**
   * Migración Frente 6 — esqueleto idempotente.
   *
   * Punto de extensión canónico para futuras migraciones que
   * vendrán cuando:
   *   - Webhook Meta Lead Ads esté operativo (M-041 Fase 2 backend).
   *   - Importación masiva de leads históricos sea necesaria.
   *
   * Por ahora NO migra nada. Devuelve siempre {creados: 0, omitidos: 0}.
   * NO se invoca desde initApp()/initDefaultData() todavía (decisión
   * canonizada Sesión código 1 — invocación se canonizará cuando la
   * lógica real exista).
   *
   * Idempotente por contrato: aunque se invoque N veces, no debe
   * crear duplicados.
   *
   * @returns {{creados: number, omitidos: number}}
   */
  function migrarFrente6() {
    return { creados: 0, omitidos: 0 };
  }

  const captacion = {
    crear:                       captacionCrear,
    obtener:                     captacionObtener,
    listar:                      captacionListar,
    actualizar:                  captacionActualizar,
    softDelete:                  captacionSoftDelete,
    cambiarEstado:               captacionCambiarEstado,             // NUEVO v2.6.0
    validarTransicion:           captacionValidarTransicion,         // NUEVO v2.6.0
    detectarDuplicados:          captacionDetectarDuplicados,        // NUEVO v2.6.0
    enlazarComoRelacionado:      captacionEnlazarComoRelacionado,    // NUEVO v2.6.0
    desdoblar:                   captacionDesdoblar,                 // NUEVO v2.7.0
    promover:                    captacionPromover,                  // NUEVO v2.7.0
    resolverEstadoSeguimiento:   captacionResolverEstadoSeguimiento, // NUEVO v2.7.0
    metricasCampania:            captacionMetricasCampania,          // NUEVO v2.7.0
    tasaConversion:              captacionTasaConversion,            // NUEVO v2.7.0
    motivosDescartePorCampania:  captacionMotivosDescartePorCampania,// NUEVO v2.7.0
    migrarFrente6:               migrarFrente6,

    ESTADOS_EMBUDO:    _ESTADOS_EMBUDO,
    ESTADOS_LATERALES: _ESTADOS_LATERALES,
    TIPOS_LEAD:        _TIPOS_LEAD,
    MOTIVOS_DESCARTE:  _MOTIVOS_DESCARTE,
    ORIGENES:          _ORIGENES
  };


  // ═══════════════════════════════════════════════════════════════════════
  //  CAPA 14 — ajPedidos
  //  Gestión de aj_pedidos (Frente 8 §20.2 v5.22 + 5 campos paquete F8+F9 v2).
  //  Entidad separada referenciando personaId (D-F8-01). Capa agnóstica de
  //  suite origen (D-F8-04). Reutiliza Capa 11 personas vía closure IIFE.
  //  Sub-frente 8.3 — Capa 14 motor de datos [NUEVO v2.8.0].
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Estados canónicos pedido (§20.2 v5.22).
   * - activo: pedido en búsqueda activa.
   * - cerrado_compra: terminal positivo (cliente compró).
   * - cerrado_descartado: terminal negativo (cliente desistió o descartado).
   * - pausado: pausa temporal manual (sin lazy vencimiento a diferencia Capa 13).
   */
  const _PEDIDOS_ESTADOS = Object.freeze([
    'activo', 'cerrado_compra', 'cerrado_descartado', 'pausado'
  ]);

  /**
   * Orígenes canónicos creación (D-F8-04 agnóstica de suite).
   */
  const _PEDIDOS_ORIGENES = Object.freeze([
    'hoja_pedido_inmo', 'hoja_pedido_finances', 'manual'
  ]);

  /**
   * Tipos inmueble (paquete F8+F9 v2 — array multi-select).
   */
  const _PEDIDOS_TIPOS_INMUEBLE = Object.freeze([
    'piso', 'casa', 'local', 'terreno', 'otro'
  ]);

  /**
   * Niveles urgencia (paquete F8+F9 v2 §3.6 — default 'media').
   */
  const _PEDIDOS_URGENCIAS = Object.freeze([
    'baja', 'media', 'alta'
  ]);

  /**
   * Tabla canónica de transiciones permitidas (§20.2 v5.22 sin lazy vencimiento).
   * cerrado_compra es terminal absoluto. cerrado_descartado reactivable manual.
   */
  const _PEDIDOS_TRANSICIONES = Object.freeze({
    'activo':              ['cerrado_compra', 'cerrado_descartado', 'pausado'],
    'pausado':             ['activo', 'cerrado_descartado'],
    'cerrado_compra':      [],
    'cerrado_descartado':  ['activo']
  });


  /**
   * Lee aj_pedidos desde store. Auto-inicializa a [] si no existe.
   * [INFERENCIA-STORE-API-GET-SET] aplicada Capa 4: API real es store.get/set
   * (NO store.leer/escribir como briefing Capa 3 §3.2 anticipaba).
   */
  function _leerPedidos() {
    return store.get('aj_pedidos') || [];
  }

  /**
   * Persiste array completo pedidos en store.
   */
  function _persistirPedidos(pedidos) {
    store.set('aj_pedidos', pedidos);
  }

  /**
   * Valida que estado ∈ _PEDIDOS_ESTADOS. Throw si no.
   */
  function _validarEstadoPedido(estado) {
    if (typeof estado !== 'string' || _PEDIDOS_ESTADOS.indexOf(estado) === -1) {
      throw new Error(
        '[ajPedidos] estado inválido: "' + estado + '" (debe ser uno de: ' +
        _PEDIDOS_ESTADOS.map(function (e) { return "'" + e + "'"; }).join(', ') + ')'
      );
    }
  }

  /**
   * R-N1 vinculante: valida que personaId apunte a entrada existente en
   * aj_personas. Reutiliza personasObtener del closure IIFE Capa 11.
   */
  function _validarPersonaExiste(personaId) {
    if (typeof personaId !== 'string' || personaId.trim() === '') {
      throw new Error('[ajPedidos] personaId obligatorio (string no vacío)');
    }
    if (personasObtener(personaId) === null) {
      throw new Error('[ajPedidos] R-N1: persona no existe: "' + personaId + '"');
    }
  }

  /**
   * Normaliza preferencias aplicando defaults razonables.
   * 18 campos canonizados §20.2 v5.22 + paquete F8+F9 v2.
   * - tipo_inmueble: array multi-select (paquete v2 §3.6).
   * - 5 campos NUEVOS v5.25: presupuesto_flexible_max, orientacion,
   *   planta_min, mascotas_permitidas, urgencia.
   */
  function _normalizarPreferencias(prefs) {
    prefs = prefs || {};
    return {
      zona_busqueda:              Array.isArray(prefs.zona_busqueda) ? prefs.zona_busqueda : [],
      tipo_inmueble:              Array.isArray(prefs.tipo_inmueble) ? prefs.tipo_inmueble : [],
      precio_max:                 (typeof prefs.precio_max === 'number') ? prefs.precio_max : null,
      precio_min:                 (typeof prefs.precio_min === 'number') ? prefs.precio_min : null,
      presupuesto_flexible_max:   (typeof prefs.presupuesto_flexible_max === 'number') ? prefs.presupuesto_flexible_max : null,
      habitaciones_min:           (typeof prefs.habitaciones_min === 'number') ? prefs.habitaciones_min : null,
      banos_min:                  (typeof prefs.banos_min === 'number') ? prefs.banos_min : null,
      m2_min:                     (typeof prefs.m2_min === 'number') ? prefs.m2_min : null,
      m2_max:                     (typeof prefs.m2_max === 'number') ? prefs.m2_max : null,
      terraza:                    !!prefs.terraza,
      parking:                    !!prefs.parking,
      ascensor:                   !!prefs.ascensor,
      estado_conservacion:        prefs.estado_conservacion || 'cualquiera',
      orientacion:                prefs.orientacion || 'indiferente',
      planta_min:                 (typeof prefs.planta_min === 'number') ? prefs.planta_min : null,
      mascotas_permitidas:        !!prefs.mascotas_permitidas,
      urgencia:                   prefs.urgencia || 'media',
      otras_caracteristicas:      prefs.otras_caracteristicas || ''
    };
  }

  /**
   * Resuelve origen_creacion con prioridad:
   * opciones.origen > datosPedido.origen_creacion > 'manual'.
   */
  function _extraerOrigen(datosPedido, opciones) {
    opciones = opciones || {};
    if (typeof opciones.origen === 'string' && _PEDIDOS_ORIGENES.indexOf(opciones.origen) !== -1) {
      return opciones.origen;
    }
    if (typeof datosPedido.origen_creacion === 'string' && _PEDIDOS_ORIGENES.indexOf(datosPedido.origen_creacion) !== -1) {
      return datosPedido.origen_creacion;
    }
    return 'manual';
  }


  /**
   * Crea pedido vinculado a personaId existente.
   * Validaciones:
   *   - R-N1: personaId obligatorio + apunta a persona existente.
   *   - agenteId obligatorio (string no vacío).
   *   - estado se inicializa siempre a 'activo' (NO se acepta desde input).
   * Genera id AJ-PD-NNN via idCodigoHumano('pedidos').
   * Persiste y retorna pedido creado.
   *
   * @param {object} datosPedido { personaId, agenteId, preferencias?, origen_creacion?, notas? }
   * @returns {object} pedido creado con id AJ-PD-NNN
   */
  function pedidosCrear(datosPedido) {
    if (!datosPedido || typeof datosPedido !== 'object') {
      throw new Error('[ajPedidos] datosPedido obligatorio (objeto)');
    }
    _validarPersonaExiste(datosPedido.personaId);
    if (typeof datosPedido.agenteId !== 'string' || datosPedido.agenteId.trim() === '') {
      throw new Error('[ajPedidos] agenteId obligatorio (string no vacío)');
    }

    const ahora = new Date().toISOString();
    const pedido = {
      id:                   idCodigoHumano('pedidos'),
      personaId:            datosPedido.personaId,
      agenteId:             datosPedido.agenteId,
      estado:               'activo',
      fecha_creacion:       ahora,
      preferencias:         _normalizarPreferencias(datosPedido.preferencias),
      origen_creacion:      _extraerOrigen(datosPedido, {}),
      notas:                datosPedido.notas || '',
      cruces_propiedad_ids: [],
      created_at:           ahora,
      updated_at:           ahora,
      deleted_at:           null
    };

    const todos = _leerPedidos();
    todos.push(pedido);
    _persistirPedidos(todos);
    return pedido;
  }

  /**
   * Lookup por id. Retorna null si no existe o soft-deleted (a menos que
   * incluir_eliminado === true).
   */
  function pedidosObtener(pedidoId, incluir_eliminado) {
    if (typeof pedidoId !== 'string') return null;
    const todos = _leerPedidos();
    for (let i = 0; i < todos.length; i++) {
      if (todos[i].id === pedidoId) {
        if (todos[i].deleted_at !== null && !incluir_eliminado) return null;
        return todos[i];
      }
    }
    return null;
  }

  /**
   * Lista pedidos con filtros opcionales combinables AND.
   * Filtros: personaId, estado, agenteId, origen_creacion, incluir_eliminados,
   *          desde (ISO date sobre fecha_creacion), hasta (idem).
   * Retorna array ordenado por fecha_creacion DESC.
   */
  function pedidosListar(filtros) {
    filtros = filtros || {};
    const incluirEliminados = !!filtros.incluir_eliminados;
    let resultado = _leerPedidos().filter(function (p) {
      if (!incluirEliminados && p.deleted_at !== null) return false;
      if (filtros.personaId !== undefined && p.personaId !== filtros.personaId) return false;
      if (filtros.estado !== undefined && p.estado !== filtros.estado) return false;
      if (filtros.agenteId !== undefined && p.agenteId !== filtros.agenteId) return false;
      if (filtros.origen_creacion !== undefined && p.origen_creacion !== filtros.origen_creacion) return false;
      if (filtros.desde !== undefined && p.fecha_creacion < filtros.desde) return false;
      if (filtros.hasta !== undefined && p.fecha_creacion > filtros.hasta) return false;
      return true;
    });
    resultado.sort(function (a, b) {
      if (a.fecha_creacion < b.fecha_creacion) return 1;
      if (a.fecha_creacion > b.fecha_creacion) return -1;
      return 0;
    });
    return resultado;
  }

  /**
   * Actualiza pedido con cambios parciales. Refresca updated_at automático.
   * Rechaza modificar id, created_at, personaId, fecha_creacion.
   * Para cambiar estado usar pedidosCambiarEstado (validación transición).
   */
  function pedidosActualizar(pedidoId, cambios) {
    if (!cambios || typeof cambios !== 'object') {
      throw new Error('[ajPedidos] cambios obligatorio (objeto)');
    }
    const camposProhibidos = ['id', 'created_at', 'personaId', 'fecha_creacion'];
    for (let i = 0; i < camposProhibidos.length; i++) {
      if (Object.prototype.hasOwnProperty.call(cambios, camposProhibidos[i])) {
        throw new Error('[ajPedidos] campo prohibido: "' + camposProhibidos[i] + '"');
      }
    }
    if (Object.prototype.hasOwnProperty.call(cambios, 'estado')) {
      throw new Error('[ajPedidos] usa pedidosCambiarEstado para modificar estado');
    }

    const todos = _leerPedidos();
    for (let i = 0; i < todos.length; i++) {
      if (todos[i].id === pedidoId) {
        if (todos[i].deleted_at !== null) {
          throw new Error('[ajPedidos] pedido soft-deleted no actualizable: "' + pedidoId + '"');
        }
        const claves = Object.keys(cambios);
        for (let k = 0; k < claves.length; k++) {
          todos[i][claves[k]] = cambios[claves[k]];
        }
        todos[i].updated_at = new Date().toISOString();
        _persistirPedidos(todos);
        return todos[i];
      }
    }
    throw new Error('[ajPedidos] pedido no existe: "' + pedidoId + '"');
  }

  /**
   * Marca deleted_at = now. Idempotente: retorna true si marcó, false si ya
   * estaba marcado. NO eliminación física (M-038 v5.16 patrón Opción Atemp).
   */
  function pedidosSoftDelete(pedidoId) {
    const todos = _leerPedidos();
    for (let i = 0; i < todos.length; i++) {
      if (todos[i].id === pedidoId) {
        if (todos[i].deleted_at !== null) return false;
        todos[i].deleted_at = new Date().toISOString();
        todos[i].updated_at = todos[i].deleted_at;
        _persistirPedidos(todos);
        return true;
      }
    }
    throw new Error('[ajPedidos] pedido no existe: "' + pedidoId + '"');
  }

  /**
   * Cambia estado validando transición contra _PEDIDOS_TRANSICIONES.
   * Throw si transición no permitida. Contexto polimórfico:
   *   - cerrado_compra: contexto.propiedadAdquirida (string opcional).
   *   - cerrado_descartado: contexto.motivo (string REQUERIDO).
   *   - pausado: contexto.motivoPausa (string opcional).
   * Refresca updated_at + estado. Notas contextuales persistidas vía notas
   * append con timestamp.
   */
  function pedidosCambiarEstado(pedidoId, nuevoEstado, contexto) {
    _validarEstadoPedido(nuevoEstado);
    contexto = contexto || {};

    const todos = _leerPedidos();
    for (let i = 0; i < todos.length; i++) {
      if (todos[i].id === pedidoId) {
        if (todos[i].deleted_at !== null) {
          throw new Error('[ajPedidos] pedido soft-deleted no editable: "' + pedidoId + '"');
        }
        const estadoActual = todos[i].estado;
        const permitidas = _PEDIDOS_TRANSICIONES[estadoActual] || [];
        if (permitidas.indexOf(nuevoEstado) === -1) {
          throw new Error(
            '[ajPedidos] Transición no permitida: ' + estadoActual + ' → ' + nuevoEstado
          );
        }

        // Validación contexto polimórfico
        if (nuevoEstado === 'cerrado_descartado') {
          if (typeof contexto.motivo !== 'string' || contexto.motivo.trim() === '') {
            throw new Error('[ajPedidos] contexto.motivo obligatorio para cerrado_descartado');
          }
        }

        const ahora = new Date().toISOString();
        const notaExtra = [];
        if (nuevoEstado === 'cerrado_compra' && contexto.propiedadAdquirida) {
          notaExtra.push('[' + ahora + '] cerrado_compra: ' + contexto.propiedadAdquirida);
        }
        if (nuevoEstado === 'cerrado_descartado') {
          notaExtra.push('[' + ahora + '] cerrado_descartado: ' + contexto.motivo);
        }
        if (nuevoEstado === 'pausado' && contexto.motivoPausa) {
          notaExtra.push('[' + ahora + '] pausado: ' + contexto.motivoPausa);
        }
        if (notaExtra.length > 0) {
          todos[i].notas = (todos[i].notas ? todos[i].notas + '\n' : '') + notaExtra.join('\n');
        }

        todos[i].estado = nuevoEstado;
        todos[i].updated_at = ahora;
        _persistirPedidos(todos);
        return todos[i];
      }
    }
    throw new Error('[ajPedidos] pedido no existe: "' + pedidoId + '"');
  }

  /**
   * Orquestador canónico (D-F8-05): flujo hoja pedido → CRM con dedup R-N3.
   * Reutiliza Capa 11 personasBuscarPorDedup + personasCrear + personasAgregarRol.
   *
   *   1. Validar datosPersona.nombre + datosPersona.telefono mínimo.
   *   2. Dedup R-N3 vía personasBuscarPorDedup({nombre,telefono,dni,email}).
   *   3. Si EXISTE y !opciones.forzarNueva: reutilizar personaId + agregarRol.
   *   4. Si NO existe O forzarNueva: personasCrear(datos, 'comprador_inmo').
   *   5. Crear pedido con personaId resuelto + agenteId + preferencias.
   *   6. Retornar { pedido, persona, dedupResultado }.
   *
   * Manejo errores: rollback pedido huérfano si paso 5 falla tras paso 4.
   * Aprendizaje T12 candidato 3ª manifestación formal del patrón
   * "Hoja → Entidad CRM con dedup" (hoja-estudio legacy + captacionPromover v5.18).
   *
   * @param {object} datosPedido { agenteId, preferencias?, origen_creacion?, notas? }
   * @param {object} datosPersona { nombre, telefono, dni?, email? }
   * @param {object} [opciones] { forzarNueva?, origen? }
   * @returns {object} { pedido, persona, dedupResultado: { matchTipo, esNueva } }
   */
  function pedidosCrearOAsociar(datosPedido, datosPersona, opciones) {
    if (!datosPedido || typeof datosPedido !== 'object') {
      throw new Error('[ajPedidos] datosPedido obligatorio (objeto)');
    }
    if (!datosPersona || typeof datosPersona !== 'object') {
      throw new Error('[ajPedidos] datosPersona obligatorio (objeto)');
    }
    if (typeof datosPersona.nombre !== 'string' || datosPersona.nombre.trim() === '') {
      throw new Error('[ajPedidos] datosPersona.nombre obligatorio');
    }
    if (typeof datosPersona.telefono !== 'string' || datosPersona.telefono.trim() === '') {
      throw new Error('[ajPedidos] datosPersona.telefono obligatorio');
    }
    if (typeof datosPedido.agenteId !== 'string' || datosPedido.agenteId.trim() === '') {
      throw new Error('[ajPedidos] datosPedido.agenteId obligatorio');
    }
    opciones = opciones || {};

    const candidatos = personasBuscarPorDedup({
      nombre:   datosPersona.nombre,
      telefono: datosPersona.telefono,
      dni:      datosPersona.dni,
      email:    datosPersona.email
    });

    let persona;
    let dedupResultado;
    if (candidatos.length > 0 && !opciones.forzarNueva) {
      // [INFERENCIA-DEDUP-RETORNO-SHAPE] personasBuscarPorDedup retorna
      // {personaId, criteriosCoincidencia, persona} NO la persona directamente.
      persona = candidatos[0].persona;
      personasAgregarRol(persona.id, 'comprador_inmo');
      // Re-leer tras agregarRol (estado actualizado)
      persona = personasObtener(persona.id);
      dedupResultado = {
        matchTipo:    'reutilizada',
        matchCriterio: 'dedup-R-N3',
        esNueva:       false,
        candidatosTotal: candidatos.length
      };
    } else {
      // [INFERENCIA-PERSONASCREAR-RETORNO-SHAPE] personasCrear retorna
      // {creada, duplicadosCandidatos}. Si hay candidatos sin forzarSiDuplicado,
      // creada=null. Para forzarNueva, debemos pasar forzarSiDuplicado:true.
      const resultadoCrear = personasCrear(
        datosPersona,
        'comprador_inmo',
        {
          agenteId:           datosPedido.agenteId,
          forzarSiDuplicado:  opciones.forzarNueva === true
        }
      );
      persona = resultadoCrear.creada;
      if (!persona) {
        throw new Error(
          '[ajPedidos] dedup R-N3 detectó ' + candidatos.length +
          ' candidato(s) pero forzarNueva no activado'
        );
      }
      dedupResultado = {
        matchTipo:    opciones.forzarNueva ? 'forzada_nueva' : 'creada',
        matchCriterio: null,
        esNueva:       true,
        candidatosTotal: candidatos.length
      };
    }

    let pedido;
    try {
      pedido = pedidosCrear({
        personaId:       persona.id,
        agenteId:        datosPedido.agenteId,
        preferencias:    datosPedido.preferencias,
        origen_creacion: _extraerOrigen(datosPedido, opciones),
        notas:           datosPedido.notas
      });
    } catch (e) {
      // Rollback: si persona fue creada en este flujo, dejarla (no eliminamos
      // huérfanos en Capa 11). Re-throw para que caller decida.
      throw new Error('[ajPedidos] error creando pedido: ' + e.message);
    }

    return { pedido: pedido, persona: persona, dedupResultado: dedupResultado };
  }

  /**
   * Alias semántico de pedidosListar({personaId}). Útil para sección "Pedidos"
   * en ficha cliente (Sub-frente 9.3). Retorno ordenado fecha_creacion DESC.
   */
  function pedidosListarPorPersona(personaId) {
    if (typeof personaId !== 'string' || personaId.trim() === '') {
      throw new Error('[ajPedidos] personaId obligatorio');
    }
    return pedidosListar({ personaId: personaId });
  }


  /**
   * Namespace público Capa 14.
   * Funciones: 8 públicas (CRUD + orquestador + máquina estados + alias).
   * Constantes: 4 sets frozen canónicos.
   * Esqueletos pedidosMigrarFrente8 + pedidosBuscarCrucesPropiedad
   * diferidos según [INFERENCIA-MIGRARFRENTE8-DIFERIBLE] +
   * [INFERENCIA-BUSCARCRUCES-DIFERIBLE] documentadas pre-envío Capa 3.
   */
  const pedidos = {
    crear:             pedidosCrear,
    obtener:           pedidosObtener,
    listar:            pedidosListar,
    actualizar:        pedidosActualizar,
    softDelete:        pedidosSoftDelete,
    crearOAsociar:     pedidosCrearOAsociar,
    cambiarEstado:     pedidosCambiarEstado,
    listarPorPersona:  pedidosListarPorPersona,

    ESTADOS:           _PEDIDOS_ESTADOS,
    ORIGENES:          _PEDIDOS_ORIGENES,
    TIPOS_INMUEBLE:    _PEDIDOS_TIPOS_INMUEBLE,
    URGENCIAS:         _PEDIDOS_URGENCIAS
  };


  // ═══════════════════════════════════════════════════════════════════════
  //  CAPA 15 — ajOpsInmo
  //  Gestión aj_inmo_operaciones bilateral persona+propiedad (Sub-frente 4.5
  //  §15.8 v5.31). Acoplamiento canónico D-13: personaId + propiedadId AMBOS
  //  OBLIGATORIOS. 3 tipos canónicos: venta (6 fases) + compra (5 fases —
  //  paga_y_senal sustituye promesa_de_compra eliminada coherente §4.7 v5.13
  //  Finances) + alquiler (post-MVP esqueleto). Reutiliza Capa 4
  //  idCodigoHumano('inmoOperaciones') + idUuid + Capa 2 store.get/set +
  //  Capa 9 propiedadesObtener (R-N1 propiedadId) + Capa 11 personasObtener
  //  (R-N1 personaId) vía closure IIFE.
  //  Coexistencia bilateral cross-suite C-M033-1 v5.16: NO crea
  //  aj_operaciones Finances ni modifica cliente.operaciones[] legacy
  //  Finances — modelos separados bilateral cada suite con su entidad
  //  operación.
  //  Sub-frente 4.5 código Sesión 2 — Capa 15 motor de datos [NUEVO v2.13.0].
  // ═══════════════════════════════════════════════════════════════════════

  // Espacio canónico TIPOS operación Inmo §15.8.2 v5.31.
  const _OPSINMO_TIPOS = Object.freeze(['venta', 'compra', 'alquiler']);

  // Embudo venta 6 fases lineales + 1 salida lateral §15.8.4 v5.31.
  const _OPSINMO_ESTADOS_VENTA = Object.freeze([
    'pendiente_valorar',
    'valorado',
    'encargo_vigente',
    'promesa_compra',
    'arras',
    'pendiente_firma',
    'retirada'    // salida lateral terminal
  ]);

  // Embudo compra 5 fases lineales + 1 salida lateral §15.8.4 v5.31
  // (NOTA: paga_y_senal sustituye promesa_de_compra eliminada).
  const _OPSINMO_ESTADOS_COMPRA = Object.freeze([
    'en_gestion',
    'en_visita',
    'paga_y_senal',
    'arras',
    'firma',
    'perdido'     // salida lateral terminal
  ]);

  // Embudo alquiler post-MVP v5.31 esqueleto preparado.
  // Definición operativa diferida sesión arquitectónica futura.
  const _OPSINMO_ESTADOS_ALQUILER = Object.freeze([]);

  // Salidas laterales canónicas v5.31.
  const _OPSINMO_SALIDAS_LATERALES = Object.freeze(['retirada', 'perdido']);

  // Tabla canónica transiciones permitidas por tipo + estado.
  // Mapping tipo → estado_actual → [estados_permitidos_siguientes].
  const _OPSINMO_TRANSICIONES = Object.freeze({
    venta: Object.freeze({
      pendiente_valorar: Object.freeze(['valorado', 'retirada']),
      valorado:          Object.freeze(['encargo_vigente', 'retirada']),
      encargo_vigente:   Object.freeze(['promesa_compra', 'retirada']),
      promesa_compra:    Object.freeze(['arras', 'retirada']),
      arras:             Object.freeze(['pendiente_firma', 'retirada']),
      pendiente_firma:   Object.freeze(['retirada']),
      retirada:          Object.freeze([])   // terminal
    }),
    compra: Object.freeze({
      en_gestion:        Object.freeze(['en_visita', 'perdido']),
      en_visita:         Object.freeze(['paga_y_senal', 'perdido']),
      paga_y_senal:      Object.freeze(['arras', 'perdido']),
      arras:             Object.freeze(['firma', 'perdido']),
      firma:             Object.freeze(['perdido']),
      perdido:           Object.freeze([])   // terminal
    }),
    alquiler: Object.freeze({})   // post-MVP esqueleto
  });

  // ─── Helpers privados Capa 15 (prefijo _opsInmo coherente patrón canónico v5.27) ───

  function _opsInmoLeer() {
    return store.get('aj_inmo_operaciones') || [];
  }

  function _opsInmoPersistir(arr) {
    store.set('aj_inmo_operaciones', arr);
  }

  function _opsInmoValidarTipo(tipo) {
    if (typeof tipo !== 'string') {
      throw new Error('[ajOpsInmo] tipo es obligatorio y debe ser string');
    }
    if (_OPSINMO_TIPOS.indexOf(tipo) === -1) {
      throw new Error(
        '[ajOpsInmo] tipo inválido: "' + tipo + '" (válidos: ' +
        _OPSINMO_TIPOS.map(function (t) { return "'" + t + "'"; }).join(', ') + ')'
      );
    }
  }

  function _opsInmoEstadosValidosPorTipo(tipo) {
    if (tipo === 'venta')    return _OPSINMO_ESTADOS_VENTA;
    if (tipo === 'compra')   return _OPSINMO_ESTADOS_COMPRA;
    if (tipo === 'alquiler') return _OPSINMO_ESTADOS_ALQUILER;
    return Object.freeze([]);
  }

  function _opsInmoValidarEstadoParaTipo(tipo, estado) {
    if (typeof estado !== 'string') {
      throw new Error('[ajOpsInmo] estado es obligatorio y debe ser string');
    }
    var estadosValidos = _opsInmoEstadosValidosPorTipo(tipo);
    if (estadosValidos.indexOf(estado) === -1) {
      throw new Error(
        '[ajOpsInmo] estado "' + estado + '" inválido para tipo "' + tipo + '" (válidos: ' +
        estadosValidos.map(function (e) { return "'" + e + "'"; }).join(', ') + ')'
      );
    }
  }

  function _opsInmoValidarPersonaExiste(personaId) {
    if (typeof personaId !== 'string' || personaId.trim() === '') {
      throw new Error('[ajOpsInmo] personaId es obligatorio (D-13 acoplamiento bilateral)');
    }
    if (personasObtener(personaId) === null) {
      throw new Error('[ajOpsInmo] R-N1: personaId no existe: "' + personaId + '"');
    }
  }

  function _opsInmoValidarPropiedadExiste(propiedadId) {
    if (typeof propiedadId !== 'string' || propiedadId.trim() === '') {
      throw new Error('[ajOpsInmo] propiedadId es obligatorio (D-13 acoplamiento bilateral)');
    }
    if (propiedadesObtener(propiedadId) === null) {
      throw new Error('[ajOpsInmo] R-N1: propiedadId no existe: "' + propiedadId + '"');
    }
  }

  function _opsInmoValidarR3NoDuplicadoActivo(personaId, propiedadId, tipo, excluirId) {
    // R3 análogo: NO operación activa duplicada misma persona+propiedad+tipo
    var todas = _opsInmoLeer();
    for (var i = 0; i < todas.length; i++) {
      var op = todas[i];
      if (op.deleted_at !== null) continue;
      if (excluirId && op.id === excluirId) continue;
      if (op.personaId === personaId &&
          op.propiedadId === propiedadId &&
          op.tipo === tipo &&
          op.fecha_cierre === null) {
        throw new Error(
          '[ajOpsInmo] R3: ya existe operación activa duplicada para ' +
          'personaId="' + personaId + '" + propiedadId="' + propiedadId + '" + tipo="' + tipo + '" (id: ' + op.id + ')'
        );
      }
    }
  }

  // ─── CRUD ───

  /**
   * Crea operación Inmo. Validaciones obligatorias canónicas:
   *  - tipo en _OPSINMO_TIPOS (3 valores)
   *  - personaId existe (R-N1 + acoplamiento bilateral D-13)
   *  - propiedadId existe (R-N1 + acoplamiento bilateral D-13)
   *  - estado válido para tipo (según embudo §15.8.4 v5.31)
   *  - R3 análogo: NO duplicado activo persona+propiedad+tipo
   *
   * @param {Object} datos
   * @param {'venta'|'compra'|'alquiler'} datos.tipo - OBLIGATORIO
   * @param {string} datos.personaId - OBLIGATORIO (AJ-P-NNN)
   * @param {string} datos.propiedadId - OBLIGATORIO (AJ-IP-NNN)
   * @param {string} [datos.estado] - default primer estado embudo según tipo
   * @param {string} [datos.agenteId]
   * @param {string} [datos.notas]
   * @param {number} [datos.precio_propuesto]
   * @param {number} [datos.precio_cerrado]
   * @param {number} [datos.alquiler_mensual]
   * @returns {Object} operación creada con id AJ-IO-NNN.
   * @throws {Error} ante violación de contrato.
   */
  function opsInmoCrear(datos) {
    if (!datos || typeof datos !== 'object') {
      throw new Error('[ajOpsInmo] datos obligatorio (objeto)');
    }
    _opsInmoValidarTipo(datos.tipo);
    _opsInmoValidarPersonaExiste(datos.personaId);
    _opsInmoValidarPropiedadExiste(datos.propiedadId);

    // Default estado = primer estado embudo según tipo
    var estadosTipo = _opsInmoEstadosValidosPorTipo(datos.tipo);
    var estado = datos.estado || (estadosTipo.length > 0 ? estadosTipo[0] : null);
    if (estado !== null) {
      _opsInmoValidarEstadoParaTipo(datos.tipo, estado);
    } else if (datos.tipo !== 'alquiler') {
      // Solo alquiler permite estado null (post-MVP esqueleto)
      throw new Error('[ajOpsInmo] estado obligatorio para tipo "' + datos.tipo + '"');
    }

    _opsInmoValidarR3NoDuplicadoActivo(datos.personaId, datos.propiedadId, datos.tipo, null);

    var ahora = new Date().toISOString();
    var op = {
      id:                idCodigoHumano('inmoOperaciones'),
      uuid:              idUuid(),
      tipo:              datos.tipo,
      personaId:         datos.personaId,
      propiedadId:       datos.propiedadId,
      estado:            estado,
      esLead:            false,                          // canonizable futuro post-MVP
      agenteId:          datos.agenteId || null,
      fecha_creacion:    ahora,
      fecha_cierre:      null,
      notas:             datos.notas || '',
      precio_propuesto:  datos.precio_propuesto || null,
      precio_cerrado:    datos.precio_cerrado || null,
      alquiler_mensual:  datos.alquiler_mensual || null,
      created_at:        ahora,
      updated_at:        ahora,
      deleted_at:        null
    };

    var todas = _opsInmoLeer();
    todas.push(op);
    _opsInmoPersistir(todas);
    return op;
  }

  function opsInmoObtener(operacionId, incluir_eliminado) {
    if (typeof operacionId !== 'string') return null;
    var todas = _opsInmoLeer();
    for (var i = 0; i < todas.length; i++) {
      if (todas[i].id === operacionId) {
        if (todas[i].deleted_at !== null && !incluir_eliminado) return null;
        return todas[i];
      }
    }
    return null;
  }

  /**
   * Lista operaciones con filtros opcionales combinables AND.
   * Filtros: tipo? + estado? + personaId? + propiedadId? + agenteId? +
   *          activas? (fecha_cierre === null) + cerradas? (fecha_cierre !== null) +
   *          incluir_eliminados?
   * Retorna array ordenado por created_at DESC + tiebreaker id DESC.
   */
  function opsInmoListar(filtros) {
    filtros = filtros || {};
    var incluirEliminados = !!filtros.incluir_eliminados;
    var resultado = _opsInmoLeer().filter(function (op) {
      if (!incluirEliminados && op.deleted_at !== null) return false;
      if (filtros.tipo !== undefined && op.tipo !== filtros.tipo) return false;
      if (filtros.estado !== undefined && op.estado !== filtros.estado) return false;
      if (filtros.personaId !== undefined && op.personaId !== filtros.personaId) return false;
      if (filtros.propiedadId !== undefined && op.propiedadId !== filtros.propiedadId) return false;
      if (filtros.agenteId !== undefined && op.agenteId !== filtros.agenteId) return false;
      if (filtros.activas === true && op.fecha_cierre !== null) return false;
      if (filtros.cerradas === true && op.fecha_cierre === null) return false;
      return true;
    });
    resultado.sort(function (a, b) {
      if (a.created_at < b.created_at) return 1;
      if (a.created_at > b.created_at) return -1;
      if (a.id < b.id) return 1;
      if (a.id > b.id) return -1;
      return 0;
    });
    return resultado;
  }

  /**
   * Actualiza operación con cambios parciales. Refresca updated_at automático.
   * Rechaza modificar id, uuid, created_at, tipo (tipo INMUTABLE post-creación).
   * Rechaza modificar estado directamente — usar opsInmoCambiarEstado.
   */
  function opsInmoActualizar(operacionId, cambios) {
    if (!cambios || typeof cambios !== 'object') {
      throw new Error('[ajOpsInmo] cambios obligatorio (objeto)');
    }
    var camposProhibidos = ['id', 'uuid', 'created_at', 'tipo'];
    for (var i = 0; i < camposProhibidos.length; i++) {
      if (Object.prototype.hasOwnProperty.call(cambios, camposProhibidos[i])) {
        throw new Error('[ajOpsInmo] campo prohibido: "' + camposProhibidos[i] + '"');
      }
    }
    if (Object.prototype.hasOwnProperty.call(cambios, 'estado')) {
      throw new Error('[ajOpsInmo] usa opsInmoCambiarEstado para modificar estado (máquina estados embudo)');
    }
    var todas = _opsInmoLeer();
    for (var j = 0; j < todas.length; j++) {
      if (todas[j].id === operacionId) {
        if (todas[j].deleted_at !== null) {
          throw new Error('[ajOpsInmo] operación soft-deleted no actualizable: "' + operacionId + '"');
        }
        // Si cambia personaId o propiedadId, revalidar existencia + R3
        if (cambios.personaId !== undefined && cambios.personaId !== todas[j].personaId) {
          _opsInmoValidarPersonaExiste(cambios.personaId);
          _opsInmoValidarR3NoDuplicadoActivo(cambios.personaId, todas[j].propiedadId, todas[j].tipo, operacionId);
        }
        if (cambios.propiedadId !== undefined && cambios.propiedadId !== todas[j].propiedadId) {
          _opsInmoValidarPropiedadExiste(cambios.propiedadId);
          _opsInmoValidarR3NoDuplicadoActivo(todas[j].personaId, cambios.propiedadId, todas[j].tipo, operacionId);
        }
        var actualizada = Object.assign({}, todas[j], cambios, {
          id:         todas[j].id,
          uuid:       todas[j].uuid,
          created_at: todas[j].created_at,
          tipo:       todas[j].tipo,
          updated_at: new Date().toISOString()
        });
        todas[j] = actualizada;
        _opsInmoPersistir(todas);
        return actualizada;
      }
    }
    throw new Error('[ajOpsInmo] operacionId no encontrado: "' + operacionId + '"');
  }

  function opsInmoSoftDelete(operacionId) {
    var todas = _opsInmoLeer();
    for (var i = 0; i < todas.length; i++) {
      if (todas[i].id === operacionId) {
        if (todas[i].deleted_at !== null) return false;
        todas[i].deleted_at = new Date().toISOString();
        todas[i].updated_at = todas[i].deleted_at;
        _opsInmoPersistir(todas);
        return true;
      }
    }
    return false;
  }

  // ─── Máquina de estados ───

  /**
   * Cambia estado validando transición permitida según tabla canónica
   * _OPSINMO_TRANSICIONES (mapping tipo → estado → siguientes).
   * Contexto opcional: si nuevo_estado es terminal (retirada/perdido/firma/pendiente_firma),
   * setea fecha_cierre automáticamente.
   */
  function opsInmoCambiarEstado(operacionId, nuevoEstado, contexto) {
    contexto = contexto || {};
    var op = opsInmoObtener(operacionId);
    if (!op) {
      throw new Error('[ajOpsInmo] operacionId no encontrado o soft-deleted: "' + operacionId + '"');
    }
    opsInmoValidarTransicion(op.tipo, op.estado, nuevoEstado);

    var ahora = new Date().toISOString();
    var esSalidaLateral = _OPSINMO_SALIDAS_LATERALES.indexOf(nuevoEstado) !== -1;
    var esTerminalPositivo = (op.tipo === 'venta' && nuevoEstado === 'pendiente_firma') ||
                              (op.tipo === 'compra' && nuevoEstado === 'firma');

    var cambios = {
      estado:     nuevoEstado,
      updated_at: ahora
    };
    if (esSalidaLateral || esTerminalPositivo) {
      cambios.fecha_cierre = ahora;
    }
    if (contexto.precio_cerrado !== undefined && esTerminalPositivo) {
      cambios.precio_cerrado = contexto.precio_cerrado;
    }
    if (contexto.notas !== undefined) {
      cambios.notas = contexto.notas;
    }

    // Aplicar cambios bypassing opsInmoActualizar (que rechaza estado/tipo/etc.)
    var todas = _opsInmoLeer();
    for (var i = 0; i < todas.length; i++) {
      if (todas[i].id === operacionId) {
        todas[i] = Object.assign({}, todas[i], cambios);
        _opsInmoPersistir(todas);
        return todas[i];
      }
    }
    throw new Error('[ajOpsInmo] inconsistencia interna cambiarEstado: "' + operacionId + '"');
  }

  /**
   * Valida transición de estado permitida según tipo. Pública para UIs.
   * @throws {Error} si transición no permitida.
   */
  function opsInmoValidarTransicion(tipo, estadoActual, estadoNuevo) {
    _opsInmoValidarTipo(tipo);
    _opsInmoValidarEstadoParaTipo(tipo, estadoActual);
    _opsInmoValidarEstadoParaTipo(tipo, estadoNuevo);
    var transicionesPorEstado = _OPSINMO_TRANSICIONES[tipo] || {};
    var permitidas = transicionesPorEstado[estadoActual] || [];
    if (permitidas.indexOf(estadoNuevo) === -1) {
      throw new Error(
        '[ajOpsInmo] transición no permitida tipo="' + tipo +
        '" estado_actual="' + estadoActual + '" → estado_nuevo="' + estadoNuevo +
        '" (permitidas: ' + (permitidas.length > 0 ? permitidas.map(function (p) { return "'" + p + "'"; }).join(', ') : 'NINGUNA — estado terminal') + ')'
      );
    }
  }

  // ─── Búsquedas cross-Capa (helpers conveniencia) ───

  function opsInmoListarPorPersona(personaId, filtros) {
    return opsInmoListar(Object.assign({}, filtros || {}, { personaId: personaId }));
  }

  function opsInmoListarPorPropiedad(propiedadId, filtros) {
    return opsInmoListar(Object.assign({}, filtros || {}, { propiedadId: propiedadId }));
  }

  function opsInmoContarActivasPorPersona(personaId) {
    return opsInmoListar({ personaId: personaId, activas: true }).length;
  }

  function opsInmoContarActivasPorPropiedad(propiedadId) {
    return opsInmoListar({ propiedadId: propiedadId, activas: true }).length;
  }

  // ─── Orquestadores helpers Sub-frente 4.5 código UI futuras ───

  function opsInmoCrearVenta(personaId, propiedadId, datos) {
    return opsInmoCrear(Object.assign({}, datos || {}, {
      tipo: 'venta',
      personaId: personaId,
      propiedadId: propiedadId
    }));
  }

  function opsInmoCrearCompra(personaId, propiedadId, datos) {
    return opsInmoCrear(Object.assign({}, datos || {}, {
      tipo: 'compra',
      personaId: personaId,
      propiedadId: propiedadId
    }));
  }

  function opsInmoCrearAlquiler(personaId, propiedadId, datos) {
    return opsInmoCrear(Object.assign({}, datos || {}, {
      tipo: 'alquiler',
      personaId: personaId,
      propiedadId: propiedadId
    }));
  }

  // ─── Namespace público Capa 15 ───
  const opsInmo = {
    crear:                     opsInmoCrear,
    obtener:                   opsInmoObtener,
    listar:                    opsInmoListar,
    actualizar:                opsInmoActualizar,
    softDelete:                opsInmoSoftDelete,

    cambiarEstado:             opsInmoCambiarEstado,
    validarTransicion:         opsInmoValidarTransicion,

    listarPorPersona:          opsInmoListarPorPersona,
    listarPorPropiedad:        opsInmoListarPorPropiedad,
    contarActivasPorPersona:   opsInmoContarActivasPorPersona,
    contarActivasPorPropiedad: opsInmoContarActivasPorPropiedad,

    crearVenta:                opsInmoCrearVenta,
    crearCompra:               opsInmoCrearCompra,
    crearAlquiler:             opsInmoCrearAlquiler,

    TIPOS:                     _OPSINMO_TIPOS,
    ESTADOS_VENTA:             _OPSINMO_ESTADOS_VENTA,
    ESTADOS_COMPRA:            _OPSINMO_ESTADOS_COMPRA,
    ESTADOS_ALQUILER:          _OPSINMO_ESTADOS_ALQUILER,
    SALIDAS_LATERALES:         _OPSINMO_SALIDAS_LATERALES
  };


  // ═══════════════════════════════════════════════════════════════════════
  //  CAPA 9 — ajPropiedades
  //  Gestión aj_inmo_propiedades como entidad primer nivel (Frente 4 §15.2
  //  v5.4 + v5.26). Identidad propia AJ-IP-NNN + refCatastral D-1 + estados
  //  ocupación canónicos exclusivos. R1 ampliada con catastro duro D-2.
  //  propiedadesOperaciones() reactivo sin caché D-5 itera 5 tablas
  //  operacionales Inmo. Reutiliza Capa 4 idCodigoHumano('propiedades') +
  //  idUuid + store.get/set vía closure IIFE.
  //  Sub-frente 4.2 Parte B — Capa 9 motor de datos [NUEVO v2.10.0].
  // ═══════════════════════════════════════════════════════════════════════

  /** Estados ocupación canónicos exclusivos §15.2. */
  const _PROPIEDADES_ESTADOS_OCUPACION = Object.freeze([
    'vacio', 'alquilado', 'ocupado_propietario'
  ]);

  /** Tipos inmueble canónicos §15.2. */
  const _PROPIEDADES_TIPOS = Object.freeze([
    'piso', 'casa', 'local', 'oficina', 'terreno', 'garaje', 'trastero'
  ]);

  /**
   * Tablas operacionales Inmo a iterar en propiedadesOperaciones() reactivo
   * D-5 v5.26. Cada entrada: { tabla, tipo, campoFecha }.
   * NOTA Capa 2 [INFERENCIA-CAMPOS-LEGACY-PENDIENTES]: hasta Sub-frente 4.4
   * los HTMLs operacionales escriben campos embebidos (no `propiedadId`).
   * La función propiedadesOperaciones() retorna SOLO entradas con
   * `propiedadId` definido (lazy filtering coherente con D-5 sin caché).
   */
  const _PROPIEDADES_TABLAS_OPERACIONALES = Object.freeze([
    { tabla: 'aj_inmo_captaciones',            tipo: 'captacion',             campoFecha: 'fecha_captacion' },
    { tabla: 'aj_inmo_visitas',                tipo: 'visita',                campoFecha: 'fecha' },
    { tabla: 'aj_inmo_encargos_exclusiva',     tipo: 'encargo_exclusiva',     campoFecha: 'fecha' },
    { tabla: 'aj_inmo_encargos_sin_exclusiva', tipo: 'encargo_sin_exclusiva', campoFecha: 'fecha' },
    { tabla: 'aj_inmo_promesas_compraventa',   tipo: 'promesa_compraventa',   campoFecha: 'fecha' }
  ]);

  /** Regex validación refCatastral ES canónico 20 caracteres alfanuméricos. */
  const _PROPIEDADES_REF_CATASTRAL_REGEX = /^[A-Z0-9]{20}$/;


  // ─── Helpers privados ───

  function _leerPropiedades()       { return store.get('aj_inmo_propiedades') || []; }
  function _persistirPropiedades(a) { store.set('aj_inmo_propiedades', a); }

  function _propiedadesValidarEstadoOcupacion(estado) {
    if (typeof estado !== 'string' || _PROPIEDADES_ESTADOS_OCUPACION.indexOf(estado) === -1) {
      throw new Error('[ajPropiedades] estadoOcupacion inválido: "' + estado + '" (debe ser uno de: ' +
        _PROPIEDADES_ESTADOS_OCUPACION.map(function (e) { return "'" + e + "'"; }).join(', ') + ')');
    }
  }

  function _propiedadesValidarTipo(tipo) {
    if (typeof tipo !== 'string' || _PROPIEDADES_TIPOS.indexOf(tipo) === -1) {
      throw new Error('[ajPropiedades] tipo inválido: "' + tipo + '" (debe ser uno de: ' +
        _PROPIEDADES_TIPOS.map(function (t) { return "'" + t + "'"; }).join(', ') + ')');
    }
  }

  /**
   * Validación blanda refCatastral D-1. null/undefined/'' normalizado a null.
   * String no-vacío DEBE matchear formato canónico 20 chars [A-Z0-9].
   * Retorna refCatastral normalizado o null.
   */
  function _propiedadesValidarRefCatastral(ref) {
    if (ref === null || ref === undefined) return null;
    if (typeof ref !== 'string') {
      throw new Error('[ajPropiedades] refCatastral debe ser string o null. Recibido: ' + typeof ref);
    }
    const trimmed = ref.trim();
    if (trimmed === '') return null;
    if (!_PROPIEDADES_REF_CATASTRAL_REGEX.test(trimmed)) {
      throw new Error('[ajPropiedades] refCatastral formato canónico ES inválido (20 chars [A-Z0-9]): "' + ref + '"');
    }
    return trimmed;
  }

  function _propiedadesNormalizarDireccion(dir) {
    dir = dir || {};
    return {
      calle:        dir.calle        || '',
      numero:       dir.numero       || '',
      puerta:       dir.puerta       || '',
      escalera:     dir.escalera     || '',
      poblacion:    dir.poblacion    || '',
      provincia:    dir.provincia    || '',
      codigoPostal: dir.codigoPostal || '',
      pais:         dir.pais         || 'España'
    };
  }

  function _propiedadesNormalizarCaracteristicas(car) {
    car = car || {};
    return {
      tipo:                       car.tipo || null,
      metrosCuadrados:            (typeof car.metrosCuadrados === 'number') ? car.metrosCuadrados : null,
      metrosCuadradosUtiles:      (typeof car.metrosCuadradosUtiles === 'number') ? car.metrosCuadradosUtiles : null,
      metrosCuadradosConstruidos: (typeof car.metrosCuadradosConstruidos === 'number') ? car.metrosCuadradosConstruidos : null,
      habitaciones:               (typeof car.habitaciones === 'number') ? car.habitaciones : null,
      baños:                      (typeof car.baños === 'number') ? car.baños : null,
      añoConstruccion:            (typeof car.añoConstruccion === 'number') ? car.añoConstruccion : null,
      planta:                     car.planta || null,
      ascensor:                   !!car.ascensor,
      terraza:                    !!car.terraza,
      parking:                    !!car.parking,
      trastero:                   !!car.trastero,
      calefaccion:                car.calefaccion || 'ninguna',
      aireAcondicionado:          !!car.aireAcondicionado,
      estadoConservacion:         car.estadoConservacion || 'buen_estado',
      certificadoEnergetico:      car.certificadoEnergetico || 'no_disponible'
    };
  }


  // ─── Funciones públicas ───

  /**
   * Crea propiedad nueva en aj_inmo_propiedades.
   * Validaciones obligatorias: direccion (calle+numero+poblacion+codigoPostal),
   * caracteristicas.tipo canónico, estadoOcupacion canónico.
   * refCatastral opcional — formato validado si presente (D-1).
   * R1 ampliada D-2: bloqueo duro si catastro duplicado. Bloqueo blando
   * si dirección exacta duplicada (forzable con opciones.forzarUnicidad: true).
   * Genera id AJ-IP-NNN via idCodigoHumano('propiedades') Capa 4.
   *
   * @param {object} datosPropiedad
   * @param {object} [opciones] { forzarUnicidad?: boolean }
   * @returns {object} propiedad creada con id AJ-IP-NNN
   */
  function propiedadesCrear(datosPropiedad, opciones) {
    if (!datosPropiedad || typeof datosPropiedad !== 'object') {
      throw new Error('[ajPropiedades] datosPropiedad obligatorio (objeto)');
    }
    opciones = opciones || {};

    const dir = datosPropiedad.direccion || {};
    if (!dir.calle)        throw new Error('[ajPropiedades] direccion.calle obligatorio');
    if (!dir.numero)       throw new Error('[ajPropiedades] direccion.numero obligatorio');
    if (!dir.poblacion)    throw new Error('[ajPropiedades] direccion.poblacion obligatorio');
    if (!dir.codigoPostal) throw new Error('[ajPropiedades] direccion.codigoPostal obligatorio');

    const car = datosPropiedad.caracteristicas || {};
    _propiedadesValidarTipo(car.tipo);
    _propiedadesValidarEstadoOcupacion(datosPropiedad.estadoOcupacion);

    const refCatastralNormalizado = _propiedadesValidarRefCatastral(datosPropiedad.refCatastral);

    // R1 ampliada D-2
    const r1 = propiedadesValidarR1(dir, refCatastralNormalizado);
    if (r1.duplicadoCatastro) {
      throw new Error('[ajPropiedades] R1 catastro duro D-2: refCatastral "' + refCatastralNormalizado +
        '" ya existe en propiedad. Catastro ES unívoco por ley — bloqueo NO confirmable.');
    }
    if (r1.duplicadoDireccion && opciones.forzarUnicidad !== true) {
      throw new Error('[ajPropiedades] R1 direccion blando: dirección exacta duplicada. ' +
        'Pasa opciones.forzarUnicidad: true para forzar creación duplicada.');
    }

    const ahora = new Date().toISOString();
    const propiedad = {
      id:                idCodigoHumano('propiedades'),
      uuid:              idUuid(),
      refCatastral:      refCatastralNormalizado,
      direccion:         _propiedadesNormalizarDireccion(dir),
      coordenadas:       datosPropiedad.coordenadas || null,
      caracteristicas:   _propiedadesNormalizarCaracteristicas(car),
      estadoOcupacion:   datosPropiedad.estadoOcupacion,
      captacionOrigenId: datosPropiedad.captacionOrigenId || null,
      notas:             datosPropiedad.notas || '',
      documentos:        [],
      fotos:             [],
      created_at:        ahora,
      updated_at:        ahora,
      deleted_at:        null
    };

    const todas = _leerPropiedades();
    todas.push(propiedad);
    _persistirPropiedades(todas);
    return propiedad;
  }

  /**
   * Lookup por id. Retorna null si no existe o soft-deleted (a menos que
   * incluir_eliminado === true).
   */
  function propiedadesObtener(propiedadId, incluir_eliminado) {
    if (typeof propiedadId !== 'string') return null;
    const todas = _leerPropiedades();
    for (let i = 0; i < todas.length; i++) {
      if (todas[i].id === propiedadId) {
        if (todas[i].deleted_at !== null && !incluir_eliminado) return null;
        return todas[i];
      }
    }
    return null;
  }

  /**
   * Lista propiedades con filtros opcionales combinables AND.
   * Filtros: estadoOcupacion, tipo, poblacion, conRefCatastral (boolean),
   *          sinTitularActiva (boolean — true: solo sin titularidad activa; false: solo con; cross-Capa 10),
   *          incluir_eliminados, desde/hasta sobre created_at.
   * Retorna array ordenado por created_at DESC.
   */
  function propiedadesListar(filtros) {
    filtros = filtros || {};
    // Filtro sinTitularActiva cross-Capa 10 — impl funcional final v2.11.0 (aplicado tras filter chain).
    const incluirEliminados = !!filtros.incluir_eliminados;
    let resultado = _leerPropiedades().filter(function (p) {
      if (!incluirEliminados && p.deleted_at !== null) return false;
      if (filtros.estadoOcupacion !== undefined && p.estadoOcupacion !== filtros.estadoOcupacion) return false;
      if (filtros.tipo !== undefined && (!p.caracteristicas || p.caracteristicas.tipo !== filtros.tipo)) return false;
      if (filtros.poblacion !== undefined && (!p.direccion || p.direccion.poblacion !== filtros.poblacion)) return false;
      if (filtros.conRefCatastral === true && p.refCatastral === null) return false;
      if (filtros.conRefCatastral === false && p.refCatastral !== null) return false;
      if (filtros.desde !== undefined && p.created_at < filtros.desde) return false;
      if (filtros.hasta !== undefined && p.created_at > filtros.hasta) return false;
      return true;
    });
    // Filtro sinTitularActiva cross-Capa 10 (impl funcional final v2.11.0)
    if (filtros.sinTitularActiva !== undefined) {
      resultado = resultado.filter(function (prop) {
        const titulares = titularidadesTitularesActuales(prop.id);
        const tieneActiva = titulares.length > 0;
        return filtros.sinTitularActiva ? !tieneActiva : tieneActiva;
      });
    }
    resultado.sort(function (a, b) {
      if (a.created_at < b.created_at) return 1;
      if (a.created_at > b.created_at) return -1;
      // Tiebreaker determinístico: id descendente (AJ-IP-002 más reciente que AJ-IP-001).
      if (a.id < b.id) return 1;
      if (a.id > b.id) return -1;
      return 0;
    });
    return resultado;
  }

  /**
   * Actualiza propiedad con cambios parciales. Refresca updated_at automático.
   * Rechaza modificar id, uuid, created_at.
   * Rechaza modificar estadoOcupacion directamente — usar propiedadesActualizarEstadoOcupacion.
   * Si cambios.refCatastral presente → revalidar R1 catastro duro D-2.
   */
  function propiedadesActualizar(propiedadId, cambios) {
    if (!cambios || typeof cambios !== 'object') {
      throw new Error('[ajPropiedades] cambios obligatorio (objeto)');
    }
    const camposProhibidos = ['id', 'uuid', 'created_at'];
    for (let i = 0; i < camposProhibidos.length; i++) {
      if (Object.prototype.hasOwnProperty.call(cambios, camposProhibidos[i])) {
        throw new Error('[ajPropiedades] campo prohibido: "' + camposProhibidos[i] + '"');
      }
    }
    if (Object.prototype.hasOwnProperty.call(cambios, 'estadoOcupacion')) {
      throw new Error('[ajPropiedades] usa propiedadesActualizarEstadoOcupacion para modificar estadoOcupacion (Flujo 5 §6.12)');
    }

    const todas = _leerPropiedades();
    for (let i = 0; i < todas.length; i++) {
      if (todas[i].id === propiedadId) {
        if (todas[i].deleted_at !== null) {
          throw new Error('[ajPropiedades] propiedad soft-deleted no actualizable: "' + propiedadId + '"');
        }
        // Revalidación R1 catastro duro D-2 si cambia refCatastral
        if (Object.prototype.hasOwnProperty.call(cambios, 'refCatastral')) {
          const refNueva = _propiedadesValidarRefCatastral(cambios.refCatastral);
          if (refNueva !== null && refNueva !== todas[i].refCatastral) {
            const otra = propiedadesBuscarPorRefCatastral(refNueva);
            if (otra !== null && otra.id !== propiedadId) {
              throw new Error('[ajPropiedades] R1 catastro duro D-2: refCatastral "' + refNueva +
                '" ya existe en propiedad "' + otra.id + '". Bloqueo NO confirmable.');
            }
          }
          cambios.refCatastral = refNueva;
        }
        const claves = Object.keys(cambios);
        for (let k = 0; k < claves.length; k++) {
          todas[i][claves[k]] = cambios[claves[k]];
        }
        todas[i].updated_at = new Date().toISOString();
        _persistirPropiedades(todas);
        return todas[i];
      }
    }
    throw new Error('[ajPropiedades] propiedad no existe: "' + propiedadId + '"');
  }

  /**
   * Marca deleted_at = now. Idempotente: retorna true si marcó, false si ya
   * estaba marcado. NO eliminación física (M-038 v5.16 patrón Opción Atemp).
   */
  function propiedadesSoftDelete(propiedadId) {
    const todas = _leerPropiedades();
    for (let i = 0; i < todas.length; i++) {
      if (todas[i].id === propiedadId) {
        if (todas[i].deleted_at !== null) return false;
        todas[i].deleted_at = new Date().toISOString();
        todas[i].updated_at = todas[i].deleted_at;
        _persistirPropiedades(todas);
        return true;
      }
    }
    throw new Error('[ajPropiedades] propiedad no existe: "' + propiedadId + '"');
  }

  /**
   * Búsqueda por dirección. Match sobre (calle, numero, codigoPostal) con
   * discriminación opcional de puerta. Retorna array de objetos
   * {propiedad, duplicadoExacto}:
   *   - duplicadoExacto: true si COINCIDE (calle, numero, puerta, codigoPostal)
   *     los 4 simultáneamente.
   *   - duplicadoExacto: false si comparte (calle, numero, codigoPostal) pero
   *     puerta distinta (caso múltiples pisos en bloque — R1 blando v5.4).
   * Excluye soft-deleted.
   */
  function propiedadesBuscarPorDireccion(direccion) {
    direccion = direccion || {};
    const todas = _leerPropiedades();
    const resultado = [];
    for (let i = 0; i < todas.length; i++) {
      const p = todas[i];
      if (p.deleted_at !== null) continue;
      const d = p.direccion || {};
      if (d.calle === direccion.calle &&
          d.numero === direccion.numero &&
          d.codigoPostal === direccion.codigoPostal) {
        const puertaCoincide = (d.puerta || '') === (direccion.puerta || '');
        resultado.push({ propiedad: p, duplicadoExacto: puertaCoincide });
      }
    }
    return resultado;
  }

  /**
   * Búsqueda por refCatastral. Retorna propiedad o null.
   * Si refCatastral null/vacío → retorna null sin buscar.
   * Si formato inválido → throw.
   * Excluye soft-deleted.
   */
  function propiedadesBuscarPorRefCatastral(refCatastral) {
    const refNormalizada = _propiedadesValidarRefCatastral(refCatastral);
    if (refNormalizada === null) return null;
    const todas = _leerPropiedades();
    for (let i = 0; i < todas.length; i++) {
      const p = todas[i];
      if (p.deleted_at !== null) continue;
      if (p.refCatastral === refNormalizada) return p;
    }
    return null;
  }

  /**
   * R1 ampliada §15.2 v5.26 + §6.11 + D-2.
   * Retorna {duplicadoDireccion, duplicadoCatastro} para UI consumidora.
   *   - duplicadoCatastro: true → bloqueo NO confirmable (catastro ES unívoco).
   *   - duplicadoDireccion: true → aviso confirmable con opciones.forzarUnicidad.
   */
  function propiedadesValidarR1(direccion, refCatastral) {
    const refNormalizada = _propiedadesValidarRefCatastral(refCatastral);
    let duplicadoCatastro = false;
    if (refNormalizada !== null) {
      duplicadoCatastro = (propiedadesBuscarPorRefCatastral(refNormalizada) !== null);
    }
    let duplicadoDireccion = false;
    if (direccion) {
      const matches = propiedadesBuscarPorDireccion(direccion);
      duplicadoDireccion = matches.some(function (m) { return m.duplicadoExacto === true; });
    }
    return { duplicadoDireccion: duplicadoDireccion, duplicadoCatastro: duplicadoCatastro };
  }

  /**
   * Lectura reactiva sin caché D-5 v5.26 — itera 5 tablas operacionales Inmo.
   * Filtra por propiedadId. Retorna array normalizado {tipo, entidadId, fecha, estadoOp}
   * ordenado DESC por fecha (entradas sin fecha al final).
   * NO valida que propiedad exista (caso uso legítimo: lectura post-softDelete).
   * Opciones: tipos[], desde, hasta, incluirCerradas (default false).
   * Heurística estados cerrados [INFERENCIA-INCLUIR-CERRADAS-HEURISTICA-CAPA-2]:
   * 'cerrada', 'vendida', 'retirada', 'perdida' (aproximación §6.6).
   */
  function propiedadesOperaciones(propiedadId, opciones) {
    if (typeof propiedadId !== 'string') {
      throw new Error('[ajPropiedades] propiedadId obligatorio');
    }
    opciones = opciones || {};
    const tiposFiltro = Array.isArray(opciones.tipos) ? opciones.tipos : null;
    const desde = opciones.desde || null;
    const hasta = opciones.hasta || null;
    const incluirCerradas = !!opciones.incluirCerradas;
    const estadosCerrados = ['cerrada', 'vendida', 'retirada', 'perdida'];

    const resultado = [];
    _PROPIEDADES_TABLAS_OPERACIONALES.forEach(function (config) {
      if (tiposFiltro && tiposFiltro.indexOf(config.tipo) === -1) return;
      const entradas = store.get(config.tabla) || [];
      entradas.forEach(function (entrada) {
        if (!entrada.propiedadId || entrada.propiedadId !== propiedadId) return;
        const estadoOp = entrada.estado || entrada.estadoOp || null;
        const estadoCerrado = estadoOp !== null && estadosCerrados.indexOf(estadoOp) !== -1;
        if (estadoCerrado && !incluirCerradas) return;
        const fecha = entrada[config.campoFecha] || null;
        if (desde && fecha && fecha < desde) return;
        if (hasta && fecha && fecha > hasta) return;
        resultado.push({
          tipo:      config.tipo,
          entidadId: entrada.id,
          fecha:     fecha,
          estadoOp:  estadoOp
        });
      });
    });
    resultado.sort(function (a, b) {
      if (!a.fecha && !b.fecha) return 0;
      if (!a.fecha) return 1;
      if (!b.fecha) return -1;
      return b.fecha.localeCompare(a.fecha);
    });
    return resultado;
  }

  /**
   * Flujo 5 §6.12 v5.5: actualiza estadoOcupacion canónico con validación.
   * No-op si estado igual al actual. Throw si nuevoEstado inválido o propiedad
   * no existe o soft-deleted. Retorna propiedad actualizada (o sin cambios si no-op).
   */
  function propiedadesActualizarEstadoOcupacion(propiedadId, nuevoEstado) {
    _propiedadesValidarEstadoOcupacion(nuevoEstado);
    const todas = _leerPropiedades();
    for (let i = 0; i < todas.length; i++) {
      if (todas[i].id === propiedadId) {
        if (todas[i].deleted_at !== null) {
          throw new Error('[ajPropiedades] propiedad soft-deleted: "' + propiedadId + '"');
        }
        if (todas[i].estadoOcupacion === nuevoEstado) return todas[i]; // no-op
        todas[i].estadoOcupacion = nuevoEstado;
        todas[i].updated_at = new Date().toISOString();
        _persistirPropiedades(todas);
        return todas[i];
      }
    }
    throw new Error('[ajPropiedades] propiedad no existe: "' + propiedadId + '"');
  }

  /**
   * Helper read-only para Sub-frente 4.3 vuelco manual MVP captaciones vigentes.
   * Filtra aj_inmo_captaciones por criterio "vigente" coherente con
   * aj-inmo-hoja-visita.html L577 (verificado empíricamente Capa 3, §15.7 D-4).
   * Excluye captaciones ya volcadas (propiedadId definido O flag volcadaA).
   * NO expuesto en namespace público propiedades — acceso vía closure IIFE.
   */
  function _propiedadesListarCandidatosVuelco() {
    const captaciones = store.get('aj_inmo_captaciones') || [];
    return captaciones.filter(function (c) {
      const vigente = (!c.estadoOp || c.estadoOp === 'activa' || c.etapa === 'vigente');
      const noVolcada = !c.propiedadId;
      const sinFlagVolcada = !c.volcadaA;
      return vigente && noVolcada && sinFlagVolcada;
    });
  }


  // ─── Namespace público Capa 9 ───
  const propiedades = {
    crear:                     propiedadesCrear,
    obtener:                   propiedadesObtener,
    listar:                    propiedadesListar,
    actualizar:                propiedadesActualizar,
    softDelete:                propiedadesSoftDelete,
    buscarPorDireccion:        propiedadesBuscarPorDireccion,
    buscarPorRefCatastral:     propiedadesBuscarPorRefCatastral,
    validarR1:                 propiedadesValidarR1,
    operaciones:               propiedadesOperaciones,
    actualizarEstadoOcupacion: propiedadesActualizarEstadoOcupacion,
    listarCandidatosVuelco:    _propiedadesListarCandidatosVuelco,    // NUEVO Sub-frente 4.3 [v2.12.0]

    ESTADOS_OCUPACION:         _PROPIEDADES_ESTADOS_OCUPACION,
    TIPOS:                     _PROPIEDADES_TIPOS
  };


  // ═══════════════════════════════════════════════════════════════════════
  //  CAPA 10 — ajTitularidades
  // ═══════════════════════════════════════════════════════════════════════════
  //  Capa 9b · AJ.fincas
  // ═══════════════════════════════════════════════════════════════════════════
  //  Gestión aj_inmo_fincas como BD catastro territorial Inmo (Frente 12 §25.3
  //  v5.90 Sub-frente 12.2 + HANDOFF §4.2). Entidad NUEVA candidate v2.18.0
  //  identidad propia AJ-IF-NNN + refCatastral UNIQUE D-2 canon §15.7 D-1
  //  refCatastral ES 20 chars [A-Z0-9]{20} + dirección + coordenadas opcional
  //  + superficie m² catastrales + tipo (urbana/rustica/industrial) + cross-link
  //  propiedades[] referencias Capa 9 aj_inmo_propiedades.
  //
  //  R1-Fincas: refCatastral UNIQUE bloqueo duro D-2 (catastro ES unívoco
  //  por ley). Reutiliza regex canónica _PROPIEDADES_REF_CATASTRAL_REGEX Capa 9
  //  sin duplicar (closure IIFE compartido).
  //  Reutiliza idCodigoHumano('inmoFincas') + idUuid + Capa 2 store.get/set
  //  + Capa 11 personas patrón canónico.
  // ═══════════════════════════════════════════════════════════════════════════

  const _TIPOS_FINCA = Object.freeze(['urbana', 'rustica', 'industrial']);

  // ─── Store de fincas: IndexedDB en navegador (capacidad grande — la BD territorial
  //     del Catastro supera el límite ~5 MB de localStorage), con fallback a localStorage
  //     en tests / entornos sin IndexedDB. La API de AJ.fincas sigue SÍNCRONA operando
  //     sobre una caché en memoria; IndexedDB solo persiste (carga async al arrancar via
  //     AJ.fincas.init()). Sin IndexedDB (tests) el comportamiento es idéntico al original. ───
  var _FINCAS_KEY = 'aj_inmo_fincas';
  var _fincasUsaIDB = (typeof indexedDB !== 'undefined' && indexedDB !== null);
  var _fincasCache = _fincasUsaIDB ? [] : null;
  var _fincasReady = null;
  var _fincasMutado = false;
  var _fincasWriteTimer = null;

  function _idbAbrir() {
    return new Promise(function (resolve, reject) {
      var req = indexedDB.open('aj_grup_crm', 1);
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
      };
      req.onsuccess = function (e) { resolve(e.target.result); };
      req.onerror   = function ()  { reject(req.error); };
    });
  }
  function _idbGet(key) {
    return _idbAbrir().then(function (db) {
      return new Promise(function (resolve, reject) {
        var r = db.transaction('kv', 'readonly').objectStore('kv').get(key);
        r.onsuccess = function () { resolve(r.result); };
        r.onerror   = function () { reject(r.error); };
      });
    });
  }
  function _idbSet(key, val) {
    return _idbAbrir().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction('kv', 'readwrite');
        tx.objectStore('kv').put(val, key);
        tx.oncomplete = function () { resolve(); };
        tx.onerror    = function () { reject(tx.error); };
      });
    });
  }

  /**
   * Carga inicial de las fincas desde IndexedDB a la caché en memoria (idempotente).
   * Migra una sola vez desde localStorage legacy si IndexedDB está vacío.
   * En modo localStorage (sin IndexedDB) es no-op. Devuelve promesa con el array.
   * El mapa / importador deben `await AJ.fincas.init()` antes de leer/importar en navegador.
   */
  function _fincasInit() {
    if (!_fincasUsaIDB) return Promise.resolve([]);
    if (_fincasReady) return _fincasReady;
    _fincasReady = _idbGet(_FINCAS_KEY).then(function (v) {
      var cargado = Array.isArray(v) ? v : null;
      if (cargado === null) {
        var legacy = null; try { legacy = store.get(_FINCAS_KEY); } catch (e) {}
        cargado = (Array.isArray(legacy) && legacy.length) ? legacy : [];
      }
      if (!_fincasMutado) {
        _fincasCache = cargado;
      } else {
        var porK = {};
        cargado.forEach(function (f) { porK[f.refCatastral || f.id] = f; });
        _fincasCache.forEach(function (f) { porK[f.refCatastral || f.id] = f; });
        _fincasCache = Object.keys(porK).map(function (k) { return porK[k]; });
      }
      _idbSet(_FINCAS_KEY, _fincasCache).catch(function () {});
      return _fincasCache;
    }).catch(function () { if (_fincasCache === null) _fincasCache = []; return _fincasCache; });
    return _fincasReady;
  }
  if (_fincasUsaIDB) { try { _fincasInit(); } catch (e) {} }

  function _fincasLeer() {
    if (_fincasUsaIDB) return _fincasCache || [];
    return store.get(_FINCAS_KEY) || [];
  }
  function _fincasPersistir(a) {
    if (_fincasUsaIDB) {
      _fincasCache = a;
      _fincasMutado = true;
      if (_fincasWriteTimer) clearTimeout(_fincasWriteTimer);
      _fincasWriteTimer = setTimeout(function () {
        _idbSet(_FINCAS_KEY, _fincasCache).catch(function (e) {
          if (typeof console !== 'undefined') console.warn('[ajFincas] IndexedDB write error:', e);
        });
      }, 120);
      return;
    }
    store.set(_FINCAS_KEY, a);
  }

  function _fincasValidarTipo(tipo) {
    if (_TIPOS_FINCA.indexOf(tipo) === -1) {
      throw new Error('[ajFincas] tipo canónico inválido: "' + tipo + '". Valores: ' + _TIPOS_FINCA.join('|'));
    }
  }

  /**
   * refCatastral de FINCA = ref de PARCELA (14 chars) o inmueble completo (20 chars).
   * En España la parcela (la finca) se identifica con 14 caracteres [A-Z0-9]; el
   * inmueble/unidad con 20. La ingesta INSPIRE del Catastro emite el ref de parcela
   * de 14 → el validador de finca acepta 14 o 20 (la Capa 9 propiedades sigue exigiendo 20).
   */
  const _FINCAS_REF_CATASTRAL_REGEX = /^[A-Z0-9]{14}(?:[A-Z0-9]{6})?$/;

  /**
   * Validación blanda refCatastral de finca (14 = parcela, 20 = inmueble completo).
   * null/undefined/'' normalizado a null. Retorna refCatastral normalizado o null.
   * @throws Si presente pero formato inválido.
   */
  function _fincasValidarRefCatastral(ref) {
    if (ref === null || ref === undefined) return null;
    if (typeof ref !== 'string') {
      throw new Error('[ajFincas] refCatastral debe ser string o null. Recibido: ' + typeof ref);
    }
    var trimmed = ref.trim();
    if (trimmed === '') return null;
    if (!_FINCAS_REF_CATASTRAL_REGEX.test(trimmed)) {
      throw new Error('[ajFincas] refCatastral formato ES inválido (14 chars parcela o 20 inmueble [A-Z0-9]): "' + trimmed + '"');
    }
    return trimmed;
  }

  /**
   * R1-Fincas: refCatastral UNIQUE bloqueo duro D-2 — busca finca con
   * mismo refCatastral no-null + no soft-deleted (excluyendo `excluirId`).
   * Retorna finca colisión o null.
   */
  function _fincasBuscarPorRefCatastral(refCatastral, excluirId) {
    if (refCatastral === null) return null;
    var todas = _fincasLeer();
    for (var i = 0; i < todas.length; i++) {
      var f = todas[i];
      if (f.deleted_at) continue;
      if (excluirId && f.id === excluirId) continue;
      if (f.refCatastral === refCatastral) return f;
    }
    return null;
  }

  /**
   * Crea finca nueva en aj_inmo_fincas.
   * @param {object} datos - {refCatastral, direccion, coordenadas?, superficie, tipo, propiedades?}
   * @returns {object} finca creada con id AJ-IF-NNN.
   * @throws Si campos obligatorios faltan, tipo inválido, refCatastral formato inválido o R1-Fincas UNIQUE viola D-2.
   */
  /**
   * Normaliza una finca de ingesta al shape canónico. Tolera el formato "lite"
   * del agente de Catastro (dirección aplanada: poblacion/calleLegible en nivel
   * superior) reconstruyendo el objeto `direccion`. Formato "full" pasa tal cual.
   */
  function _fincasNormalizarEntrada(f) {
    if (!f || typeof f !== 'object') return f;
    if (f.direccion && typeof f.direccion === 'object') return f;
    if (f.poblacion || f.calleLegible || f.calle || f.codigoPostal) {
      var copia = {};
      for (var k in f) { if (Object.prototype.hasOwnProperty.call(f, k)) copia[k] = f[k]; }
      copia.direccion = {
        calle:        f.calle || null,
        calleLegible: f.calleLegible || null,
        numero:       f.numero || null,
        poblacion:    f.poblacion || null,
        provincia:    f.provincia || null,
        codigoPostal: f.codigoPostal || null,
        pais:         f.pais || 'España'
      };
      return copia;
    }
    return f;
  }

  /**
   * Normaliza el array de unidades (pisos/locales) de una finca — Fase C OVC.
   * Conserva SOLO características físicas del inmueble (contrato: cero titulares,
   * cero valor catastral). refCatastral de unidad = 20 chars. Tolera ausencia.
   */
  var _UNIDAD_TIPOS = ['piso', 'local', 'oficina', 'garaje', 'trastero', 'almacen', 'otro'];
  function _fincasNormalizarUnidades(arr) {
    if (!Array.isArray(arr)) return [];
    var out = [];
    for (var i = 0; i < arr.length; i++) {
      var u = arr[i];
      if (!u || typeof u !== 'object' || !u.refCatastral) continue;
      var tipo = (typeof u.tipo === 'string' && _UNIDAD_TIPOS.indexOf(u.tipo) !== -1) ? u.tipo : 'otro';
      out.push({
        refCatastral:     String(u.refCatastral).toUpperCase(),
        tipo:             tipo,
        planta:           (u.planta != null) ? String(u.planta) : null,
        puerta:           (u.puerta != null) ? String(u.puerta) : null,
        escalera:         (u.escalera != null) ? String(u.escalera) : null,
        superficie:       (typeof u.superficie === 'number') ? u.superficie : null,
        uso:              (typeof u.uso === 'string') ? u.uso : null,
        usoLabel:         (typeof u.usoLabel === 'string') ? u.usoLabel : null,
        anioConstruccion: (typeof u.anioConstruccion === 'number') ? u.anioConstruccion : null,
        construcciones:   Array.isArray(u.construcciones) ? u.construcciones.slice() : []
      });
    }
    return out;
  }

  /**
   * Construye el objeto finca persistible (id/uuid nuevos). Asume validación previa.
   * Campos extra (uso/usoLabel/numViviendas/anioConstruccion/numPlantas/fuente/fechaIngesta)
   * provienen de la ingesta INSPIRE del Catastro — opcionales, útiles para mapa/filtros.
   */
  function _fincasConstruir(datos, refCatastralNormalizado, nowIso) {
    return {
      id:               idCodigoHumano('inmoFincas'),
      uuid:             idUuid(),
      refCatastral:     refCatastralNormalizado,
      direccion:        datos.direccion,
      coordenadas:      datos.coordenadas || null,
      superficie:       datos.superficie,
      tipo:             datos.tipo,
      uso:              (typeof datos.uso === 'string')              ? datos.uso : null,
      usoLabel:         (typeof datos.usoLabel === 'string')         ? datos.usoLabel : null,
      numViviendas:     (typeof datos.numViviendas === 'number')     ? datos.numViviendas : null,
      anioConstruccion: (typeof datos.anioConstruccion === 'number') ? datos.anioConstruccion : null,
      numPlantas:       (typeof datos.numPlantas === 'number')       ? datos.numPlantas : null,
      fuente:           datos.fuente || null,
      fechaIngesta:     datos.fechaIngesta || null,
      propiedades:      Array.isArray(datos.propiedades) ? datos.propiedades.slice() : [],
      unidades:         _fincasNormalizarUnidades(datos.unidades),
      numUnidades:      Array.isArray(datos.unidades) ? _fincasNormalizarUnidades(datos.unidades).length : 0,
      fechaConsulta:    datos.fechaConsulta || null,
      created_at:       nowIso,
      updated_at:       nowIso,
      deleted_at:       null
    };
  }

  function fincasCrear(datos) {
    if (!datos || typeof datos !== 'object')           throw new Error('[ajFincas] datos requeridos');
    datos = _fincasNormalizarEntrada(datos);
    if (typeof datos.superficie !== 'number')          throw new Error('[ajFincas] superficie m² obligatoria number');
    if (!datos.direccion || typeof datos.direccion !== 'object') throw new Error('[ajFincas] direccion obligatoria');
    _fincasValidarTipo(datos.tipo);
    var refCatastralNormalizado = _fincasValidarRefCatastral(datos.refCatastral);
    if (refCatastralNormalizado === null) {
      throw new Error('[ajFincas] refCatastral OBLIGATORIO entidad BD catastro territorial canon §25.3 v5.90');
    }
    var colision = _fincasBuscarPorRefCatastral(refCatastralNormalizado, null);
    if (colision) {
      throw new Error('[ajFincas] R1-Fincas catastro duro D-2: refCatastral "' + refCatastralNormalizado +
        '" ya existe en finca ' + colision.id + ' (catastro ES unívoco por ley).');
    }
    var nueva = _fincasConstruir(datos, refCatastralNormalizado, new Date().toISOString());
    var todas = _fincasLeer();
    todas.push(nueva);
    _fincasPersistir(todas);
    return nueva;
  }

  /**
   * Importación masiva de fincas (ingesta del agente de Catastro INSPIRE).
   * Deduplica por refCatastral (R1-Fincas D-2). O(n): lee una vez, construye en
   * memoria, persiste una sola vez — apto para 12k+ fincas.
   * @param {Array} fincas - array de fincas con el schema de fincasCrear.
   * @param {object} [opciones] - { actualizar:boolean } (default false = omitir existentes).
   * @returns {object} reporte { total, creadas, omitidas, actualizadas, errores, detalles }.
   */
  function fincasImportarBulk(fincas, opciones) {
    if (!Array.isArray(fincas)) throw new Error('[ajFincas] importarBulk requiere un array de fincas');
    opciones = opciones || {};
    var actualizar = opciones.actualizar === true;
    var rep = { total: fincas.length, creadas: 0, omitidas: 0, actualizadas: 0, errores: 0, detalles: [] };
    var todas = _fincasLeer();
    var porRef = {};
    for (var j = 0; j < todas.length; j++) {
      if (todas[j].refCatastral && todas[j].deleted_at === null) porRef[todas[j].refCatastral] = todas[j];
    }
    var nowIso = new Date().toISOString();
    for (var i = 0; i < fincas.length; i++) {
      var f = _fincasNormalizarEntrada(fincas[i]);
      try {
        if (!f || typeof f !== 'object') throw new Error('finca no es objeto');
        if (typeof f.superficie !== 'number') throw new Error('superficie m² obligatoria number');
        if (!f.direccion || typeof f.direccion !== 'object') throw new Error('direccion obligatoria');
        _fincasValidarTipo(f.tipo);
        var refNorm = _fincasValidarRefCatastral(f.refCatastral);
        if (refNorm === null) throw new Error('refCatastral obligatorio');
        var existe = porRef[refNorm];
        if (existe) {
          if (actualizar) {
            existe.direccion        = f.direccion;
            existe.coordenadas      = f.coordenadas || null;
            existe.superficie       = f.superficie;
            existe.tipo             = f.tipo;
            existe.uso              = (typeof f.uso === 'string') ? f.uso : existe.uso;
            existe.numViviendas     = (typeof f.numViviendas === 'number') ? f.numViviendas : existe.numViviendas;
            existe.anioConstruccion = (typeof f.anioConstruccion === 'number') ? f.anioConstruccion : existe.anioConstruccion;
            existe.numPlantas       = (typeof f.numPlantas === 'number') ? f.numPlantas : existe.numPlantas;
            if (Array.isArray(f.unidades)) {
              existe.unidades    = _fincasNormalizarUnidades(f.unidades);
              existe.numUnidades = existe.unidades.length;
            }
            existe.updated_at       = nowIso;
            rep.actualizadas++;
          } else {
            rep.omitidas++;
          }
          continue;
        }
        var nueva = _fincasConstruir(f, refNorm, nowIso);
        todas.push(nueva);
        porRef[refNorm] = nueva;
        rep.creadas++;
      } catch (e) {
        rep.errores++;
        if (rep.detalles.length < 50) rep.detalles.push({ i: i, ref: (f && f.refCatastral) || null, error: e.message });
      }
    }
    _fincasPersistir(todas);
    return rep;
  }

  /**
   * Obtiene finca por id.
   * @param {boolean} incluir_eliminado - default false (excluye soft-deleted).
   * @returns {object|null}
   */
  function fincasObtener(fincaId, incluir_eliminado) {
    if (!fincaId) return null;
    var todas = _fincasLeer();
    for (var i = 0; i < todas.length; i++) {
      if (todas[i].id === fincaId) {
        if (todas[i].deleted_at && !incluir_eliminado) return null;
        return todas[i];
      }
    }
    return null;
  }

  /**
   * Lista fincas con filtros opcionales AND combinables.
   * Filtros: {tipo?, poblacion?, conCoordenadas?, conPropiedades?, incluir_eliminados?}
   * @returns {object[]}
   */
  function fincasListar(filtros) {
    filtros = filtros || {};
    var todas = _fincasLeer();
    return todas.filter(function (f) {
      if (f.deleted_at && !filtros.incluir_eliminados) return false;
      if (filtros.tipo && f.tipo !== filtros.tipo) return false;
      if (filtros.poblacion && (!f.direccion || f.direccion.poblacion !== filtros.poblacion)) return false;
      if (filtros.conCoordenadas === true && f.coordenadas === null) return false;
      if (filtros.conCoordenadas === false && f.coordenadas !== null) return false;
      if (filtros.conPropiedades === true && (!f.propiedades || f.propiedades.length === 0)) return false;
      if (filtros.conPropiedades === false && f.propiedades && f.propiedades.length > 0) return false;
      return true;
    });
  }

  /**
   * Actualiza finca con cambios parciales. Rechaza campos prohibidos
   * [id, uuid, created_at, deleted_at]. Si cambios.refCatastral → revalida
   * R1-Fincas UNIQUE D-2.
   */
  function fincasActualizar(fincaId, cambios) {
    if (!fincaId) throw new Error('[ajFincas] fincaId obligatorio');
    if (!cambios || typeof cambios !== 'object') throw new Error('[ajFincas] cambios obligatorios object');
    var prohibidos = ['id', 'uuid', 'created_at', 'deleted_at'];
    for (var k = 0; k < prohibidos.length; k++) {
      if (Object.prototype.hasOwnProperty.call(cambios, prohibidos[k])) {
        throw new Error('[ajFincas] campo prohibido: ' + prohibidos[k]);
      }
    }
    if (Object.prototype.hasOwnProperty.call(cambios, 'tipo')) {
      _fincasValidarTipo(cambios.tipo);
    }
    var todas = _fincasLeer();
    for (var i = 0; i < todas.length; i++) {
      if (todas[i].id === fincaId) {
        if (todas[i].deleted_at) return null;
        if (Object.prototype.hasOwnProperty.call(cambios, 'refCatastral')) {
          var refNueva = _fincasValidarRefCatastral(cambios.refCatastral);
          if (refNueva === null) {
            throw new Error('[ajFincas] refCatastral NO puede ser null en update (UNIQUE D-2)');
          }
          if (refNueva !== todas[i].refCatastral) {
            var colision = _fincasBuscarPorRefCatastral(refNueva, fincaId);
            if (colision) {
              throw new Error('[ajFincas] R1-Fincas catastro duro D-2: refCatastral "' + refNueva +
                '" ya existe en finca ' + colision.id);
            }
            todas[i].refCatastral = refNueva;
          }
        }
        ['direccion', 'coordenadas', 'superficie', 'tipo', 'propiedades', 'fechaConsulta'].forEach(function (campo) {
          if (Object.prototype.hasOwnProperty.call(cambios, campo) && campo !== 'refCatastral') {
            todas[i][campo] = cambios[campo];
          }
        });
        todas[i].updated_at = new Date().toISOString();
        _fincasPersistir(todas);
        return todas[i];
      }
    }
    return null;
  }

  /**
   * Soft-delete finca (idempotente). Retorna true si marcó, false si ya estaba o no existe.
   */
  function fincasSoftDelete(fincaId) {
    if (!fincaId) return false;
    var todas = _fincasLeer();
    for (var i = 0; i < todas.length; i++) {
      if (todas[i].id === fincaId) {
        if (todas[i].deleted_at) return false;
        todas[i].deleted_at = new Date().toISOString();
        todas[i].updated_at = todas[i].deleted_at;
        _fincasPersistir(todas);
        return true;
      }
    }
    return false;
  }

  /**
   * Asocia propiedad a finca (idempotente — no duplica). Cross-link
   * aj_inmo_propiedades ← aj_inmo_fincas. Valida propiedadId existe Capa 9.
   * @returns {object} finca actualizada o null si finca no existe.
   */
  function fincasAsociarPropiedad(fincaId, propiedadId) {
    if (!fincaId || !propiedadId) throw new Error('[ajFincas] fincaId + propiedadId obligatorios');
    var prop = propiedadesObtener(propiedadId);
    if (!prop) throw new Error('[ajFincas] propiedadId "' + propiedadId + '" no existe Capa 9');
    var todas = _fincasLeer();
    for (var i = 0; i < todas.length; i++) {
      if (todas[i].id === fincaId) {
        if (todas[i].deleted_at) return null;
        if (todas[i].propiedades.indexOf(propiedadId) === -1) {
          todas[i].propiedades.push(propiedadId);
          todas[i].updated_at = new Date().toISOString();
          _fincasPersistir(todas);
        }
        return todas[i];
      }
    }
    return null;
  }

  /**
   * Busca finca por refCatastral exacto (público — sin excluirId).
   * @returns {object|null}
   */
  function fincasBuscarPorRefCatastral(refCatastral) {
    var refNormalizada = _fincasValidarRefCatastral(refCatastral);
    if (refNormalizada === null) return null;
    return _fincasBuscarPorRefCatastral(refNormalizada, null);
  }

  // API pública Capa 9b AJ.fincas — exposición surface al final del IIFE.
  var fincas = {
    TIPOS:                     _TIPOS_FINCA,
    init:                      _fincasInit,
    crear:                     fincasCrear,
    importarBulk:              fincasImportarBulk,
    obtener:                   fincasObtener,
    listar:                    fincasListar,
    actualizar:                fincasActualizar,
    softDelete:                fincasSoftDelete,
    asociarPropiedad:          fincasAsociarPropiedad,
    buscarPorRefCatastral:     fincasBuscarPorRefCatastral
  };

  //  Gestión aj_inmo_titularidades como tabla N:N entre aj_inmo_propiedades
  //  y aj_personas con histórico completo (Frente 4 §15.3 v5.4 + §6.10).
  //  Identidad propia AJ-IT-NNN + porcentajes cotitularidad R2 + sin
  //  solapamiento fechas R3. cambiarPropietario transaccional snapshot+
  //  rollback (Flujos 3+4 §6.12). crearVinculacionInicial Flujo 2 §6.12.
  //  Reutiliza Capa 9 propiedadesObtener + Capa 11 personasObtener +
  //  personasAgregarRol vía closure IIFE.
  //  Sub-frente 4.2 Parte C — Capa 10 motor de datos [NUEVO v2.11.0].
  //  Prefijo _titularidades en helpers privados desde inicio (lección
  //  T11 candidato Parte B 2ª manifestación formal del patrón).
  // ═══════════════════════════════════════════════════════════════════════

  /** Roles canónicos titularidad §15.3. Escalable a usufructuario/nudo_propietario futuro. */
  const _TITULARIDADES_ROLES = Object.freeze([
    'propietario'
  ]);

  /** Títulos de adquisición canónicos §6.12 Flujos 3+4. */
  const _TITULARIDADES_TITULOS_ADQUISICION = Object.freeze([
    'compraventa', 'herencia', 'donacion', 'permuta', 'otra'
  ]);


  // ─── Helpers privados (prefijo _titularidades T11 candidato 2ª manifestación) ───

  function _titularidadesLeer()       { return store.get('aj_inmo_titularidades') || []; }
  function _titularidadesPersistir(a) { store.set('aj_inmo_titularidades', a); }

  function _titularidadesValidarRol(rol) {
    if (typeof rol !== 'string' || _TITULARIDADES_ROLES.indexOf(rol) === -1) {
      throw new Error('[ajTitularidades] rol inválido: "' + rol + '" (debe ser uno de: ' +
        _TITULARIDADES_ROLES.map(function (r) { return "'" + r + "'"; }).join(', ') + ')');
    }
  }

  function _titularidadesValidarTituloAdquisicion(titulo) {
    if (typeof titulo !== 'string' || _TITULARIDADES_TITULOS_ADQUISICION.indexOf(titulo) === -1) {
      throw new Error('[ajTitularidades] tituloAdquisicion inválido: "' + titulo + '" (debe ser uno de: ' +
        _TITULARIDADES_TITULOS_ADQUISICION.map(function (t) { return "'" + t + "'"; }).join(', ') + ')');
    }
  }

  /**
   * R2 §6.11: si propiedadId tiene 2+ titularidades activas (hasta===null),
   * TODAS deben tener porcentaje number + suma EXACTA 100. Si 1 sola activa
   * con porcentaje:null → titularidad plena, NO validar suma.
   */
  function _titularidadesValidarR2(propiedadId) {
    const activas = _titularidadesLeer().filter(function (t) {
      return t.propiedadId === propiedadId
          && t.hasta === null
          && t.deleted_at === null;
    });
    if (activas.length < 2) return;  // 0 o 1 activa: R2 NO aplica
    let suma = 0;
    for (let i = 0; i < activas.length; i++) {
      if (typeof activas[i].porcentaje !== 'number') {
        throw new Error('[ajTitularidades] R2: con 2+ titularidades activas TODAS deben tener porcentaje number. Falta en titularidad ' + activas[i].id);
      }
      suma += activas[i].porcentaje;
    }
    if (suma !== 100) {
      throw new Error('[ajTitularidades] R2: suma porcentajes activas ≠ 100 (actual: ' + suma + '). Propiedad: ' + propiedadId);
    }
  }

  /**
   * R3 §6.11: no solapamiento fechas para misma combinación
   * (personaId, propiedadId). Histórico OK (rangos disjuntos).
   */
  function _titularidadesValidarR3(propiedadId, personaId, desde, excluirId) {
    const candidatas = _titularidadesLeer().filter(function (t) {
      return t.propiedadId === propiedadId
          && t.personaId === personaId
          && t.deleted_at === null
          && (excluirId === undefined || t.id !== excluirId);
    });
    for (let i = 0; i < candidatas.length; i++) {
      const t = candidatas[i];
      const hastaExistente = t.hasta || '9999-12-31';
      if (desde < hastaExistente) {
        throw new Error('[ajTitularidades] R3: solapamiento fechas misma combinación persona-propiedad. Titularidad existente: ' + t.id + ' (desde: ' + t.desde + ', hasta: ' + (t.hasta || 'activa') + ')');
      }
    }
  }


  // ─── Funciones públicas ───

  /**
   * Crea titularidad nueva. Valida cross-Capa 9 propiedadId + cross-Capa 11
   * personaId + tituloAdquisicion canónico + R3 pre-check. R2 post-persistencia.
   * NO auto-asigna rol propietario (responsabilidad de orquestador).
   */
  function titularidadesCrear(datosTitularidad) {
    if (!datosTitularidad || typeof datosTitularidad !== 'object') {
      throw new Error('[ajTitularidades] datosTitularidad obligatorio (objeto)');
    }
    if (typeof datosTitularidad.propiedadId !== 'string') {
      throw new Error('[ajTitularidades] propiedadId obligatorio (string)');
    }
    if (propiedadesObtener(datosTitularidad.propiedadId) === null) {
      throw new Error('[ajTitularidades] propiedadId no existe: "' + datosTitularidad.propiedadId + '"');
    }
    if (typeof datosTitularidad.personaId !== 'string') {
      throw new Error('[ajTitularidades] personaId obligatorio (string)');
    }
    if (personasObtener(datosTitularidad.personaId) === null) {
      throw new Error('[ajTitularidades] R-N1: persona no existe: "' + datosTitularidad.personaId + '"');
    }
    if (datosTitularidad.rol !== undefined) {
      _titularidadesValidarRol(datosTitularidad.rol);
    }
    _titularidadesValidarTituloAdquisicion(datosTitularidad.tituloAdquisicion);
    if (typeof datosTitularidad.desde !== 'string' || datosTitularidad.desde === '') {
      throw new Error('[ajTitularidades] desde obligatorio (ISO date string)');
    }
    if (datosTitularidad.porcentaje !== undefined && datosTitularidad.porcentaje !== null) {
      if (typeof datosTitularidad.porcentaje !== 'number' ||
          datosTitularidad.porcentaje < 0 ||
          datosTitularidad.porcentaje > 100) {
        throw new Error('[ajTitularidades] porcentaje debe ser number [0,100] o null');
      }
    }
    if (datosTitularidad.hasta !== undefined && datosTitularidad.hasta !== null) {
      if (typeof datosTitularidad.hasta !== 'string') {
        throw new Error('[ajTitularidades] hasta debe ser ISO date string o null');
      }
      if (datosTitularidad.desde >= datosTitularidad.hasta) {
        throw new Error('[ajTitularidades] desde debe ser anterior a hasta');
      }
    }
    // R3 pre-check (no solapamiento misma combinación)
    _titularidadesValidarR3(datosTitularidad.propiedadId, datosTitularidad.personaId, datosTitularidad.desde, undefined);

    const ahora = new Date().toISOString();
    const titularidad = {
      id:                idCodigoHumano('titularidades'),
      uuid:              idUuid(),
      propiedadId:       datosTitularidad.propiedadId,
      personaId:         datosTitularidad.personaId,
      porcentaje:        (typeof datosTitularidad.porcentaje === 'number') ? datosTitularidad.porcentaje : null,
      rol:               datosTitularidad.rol || 'propietario',
      desde:             datosTitularidad.desde,
      hasta:             datosTitularidad.hasta || null,
      tituloAdquisicion: datosTitularidad.tituloAdquisicion,
      notas:             datosTitularidad.notas || '',
      created_at:        ahora,
      updated_at:        ahora,
      deleted_at:        null
    };

    const todas = _titularidadesLeer();
    todas.push(titularidad);
    _titularidadesPersistir(todas);
    // R2 post-persistencia (sólo si activa)
    if (titularidad.hasta === null) {
      _titularidadesValidarR2(titularidad.propiedadId);
    }
    return titularidad;
  }

  /** Lookup por id. Retorna null si no existe o soft-deleted. */
  function titularidadesObtener(titularidadId, incluir_eliminado) {
    if (typeof titularidadId !== 'string') return null;
    const todas = _titularidadesLeer();
    for (let i = 0; i < todas.length; i++) {
      if (todas[i].id === titularidadId) {
        if (todas[i].deleted_at !== null && !incluir_eliminado) return null;
        return todas[i];
      }
    }
    return null;
  }

  /**
   * Lista titularidades con filtros AND combinables.
   * Filtros: propiedadId, personaId, rol, tituloAdquisicion, soloActivas
   * (boolean — hasta===null), incluir_eliminados, desde/hasta sobre desde.
   * Orden DESC por desde.
   */
  function titularidadesListar(filtros) {
    filtros = filtros || {};
    const incluirEliminados = !!filtros.incluir_eliminados;
    let resultado = _titularidadesLeer().filter(function (t) {
      if (!incluirEliminados && t.deleted_at !== null) return false;
      if (filtros.propiedadId !== undefined && t.propiedadId !== filtros.propiedadId) return false;
      if (filtros.personaId !== undefined && t.personaId !== filtros.personaId) return false;
      if (filtros.rol !== undefined && t.rol !== filtros.rol) return false;
      if (filtros.tituloAdquisicion !== undefined && t.tituloAdquisicion !== filtros.tituloAdquisicion) return false;
      if (filtros.soloActivas === true && t.hasta !== null) return false;
      if (filtros.desde !== undefined && t.desde < filtros.desde) return false;
      if (filtros.hasta !== undefined && t.desde > filtros.hasta) return false;
      return true;
    });
    resultado.sort(function (a, b) {
      if (a.desde < b.desde) return 1;
      if (a.desde > b.desde) return -1;
      if (a.id < b.id) return 1;
      if (a.id > b.id) return -1;
      return 0;
    });
    return resultado;
  }

  /**
   * Actualiza titularidad campos permitidos: porcentaje, hasta, rol, notas,
   * tituloAdquisicion. Campos estructurales prohibidos. Revalida R2 + R3
   * si afecta titularidad activa.
   */
  function titularidadesActualizar(titularidadId, cambios) {
    if (!cambios || typeof cambios !== 'object') {
      throw new Error('[ajTitularidades] cambios obligatorio (objeto)');
    }
    const camposProhibidos = ['id', 'uuid', 'created_at', 'propiedadId', 'personaId', 'desde'];
    for (let i = 0; i < camposProhibidos.length; i++) {
      if (Object.prototype.hasOwnProperty.call(cambios, camposProhibidos[i])) {
        throw new Error('[ajTitularidades] campo prohibido: "' + camposProhibidos[i] + '" (estructural, usa cambiarPropietario)');
      }
    }

    const todas = _titularidadesLeer();
    for (let i = 0; i < todas.length; i++) {
      if (todas[i].id === titularidadId) {
        if (todas[i].deleted_at !== null) {
          throw new Error('[ajTitularidades] titularidad soft-deleted no actualizable: "' + titularidadId + '"');
        }
        // Re-validar rol/tituloAdquisicion si cambian
        if (Object.prototype.hasOwnProperty.call(cambios, 'rol')) {
          _titularidadesValidarRol(cambios.rol);
        }
        if (Object.prototype.hasOwnProperty.call(cambios, 'tituloAdquisicion')) {
          _titularidadesValidarTituloAdquisicion(cambios.tituloAdquisicion);
        }
        // Aplicar cambios provisional
        const claves = Object.keys(cambios);
        for (let k = 0; k < claves.length; k++) {
          todas[i][claves[k]] = cambios[claves[k]];
        }
        todas[i].updated_at = new Date().toISOString();
        _titularidadesPersistir(todas);
        // Re-validar R3 si cambia hasta (puede solapar con otras)
        if (Object.prototype.hasOwnProperty.call(cambios, 'hasta')) {
          try {
            _titularidadesValidarR3(todas[i].propiedadId, todas[i].personaId, todas[i].desde, todas[i].id);
          } catch (e) {
            // Rollback cambio hasta si solapamiento
            todas[i].hasta = null;
            _titularidadesPersistir(todas);
            throw e;
          }
        }
        // Re-validar R2 si afecta activa
        if (todas[i].hasta === null) {
          _titularidadesValidarR2(todas[i].propiedadId);
        }
        return todas[i];
      }
    }
    throw new Error('[ajTitularidades] titularidad no existe: "' + titularidadId + '"');
  }

  /** Soft-delete idempotente. */
  function titularidadesSoftDelete(titularidadId) {
    const todas = _titularidadesLeer();
    for (let i = 0; i < todas.length; i++) {
      if (todas[i].id === titularidadId) {
        if (todas[i].deleted_at !== null) return false;
        todas[i].deleted_at = new Date().toISOString();
        todas[i].updated_at = todas[i].deleted_at;
        _titularidadesPersistir(todas);
        return true;
      }
    }
    throw new Error('[ajTitularidades] titularidad no existe: "' + titularidadId + '"');
  }

  /**
   * Flujo 2 §6.12 v5.5: vinculación inicial de titulares al crear propiedad.
   * Caso 1 persona: porcentaje:null titularidad plena.
   * Caso 2+ personas: TODAS con porcentaje number + suma exacta 100 pre-check.
   * Snapshot+rollback atómico. Auto-asigna rol propietario a cada persona (R-N2).
   */
  function titularidadesCrearVinculacionInicial(propiedadId, listaPersonas) {
    if (propiedadesObtener(propiedadId) === null) {
      throw new Error('[ajTitularidades] propiedadId no existe: "' + propiedadId + '"');
    }
    if (!Array.isArray(listaPersonas) || listaPersonas.length === 0) {
      throw new Error('[ajTitularidades] listaPersonas debe ser array no vacío');
    }
    // R2 pre-check si 2+
    if (listaPersonas.length >= 2) {
      let suma = 0;
      for (let i = 0; i < listaPersonas.length; i++) {
        if (typeof listaPersonas[i].porcentaje !== 'number') {
          throw new Error('[ajTitularidades] con 2+ personas TODAS deben tener porcentaje number');
        }
        suma += listaPersonas[i].porcentaje;
      }
      if (suma !== 100) {
        throw new Error('[ajTitularidades] R2 pre-check: suma porcentajes ≠ 100 (actual: ' + suma + ')');
      }
    }
    // Validar TODAS las personas existen ANTES de empezar (atomicidad)
    for (let i = 0; i < listaPersonas.length; i++) {
      if (personasObtener(listaPersonas[i].personaId) === null) {
        throw new Error('[ajTitularidades] R-N1: persona no existe: "' + listaPersonas[i].personaId + '"');
      }
    }
    // Snapshot transaccional
    const snapshot = _titularidadesLeer().slice();
    const fecha = new Date().toISOString().slice(0, 10);
    const creadas = [];
    try {
      for (let i = 0; i < listaPersonas.length; i++) {
        const p = listaPersonas[i];
        creadas.push(titularidadesCrear({
          propiedadId:       propiedadId,
          personaId:         p.personaId,
          porcentaje:        (p.porcentaje !== undefined) ? p.porcentaje : null,
          rol:               p.rol || 'propietario',
          desde:             p.desde || fecha,
          hasta:             null,
          tituloAdquisicion: p.tituloAdquisicion || 'compraventa',
          notas:             p.notas || ''
        }));
        personasAgregarRol(p.personaId, 'propietario');  // R-N2 idempotente
      }
      return creadas;
    } catch (e) {
      _titularidadesPersistir(snapshot);
      throw new Error('[ajTitularidades] crearVinculacionInicial falló: ' + e.message + ' (rollback aplicado)');
    }
  }

  /**
   * Flujos 3 (venta) + 4 (herencia/donación/permuta) §6.12 v5.5.
   * Cierra titularidades activas previas + crea nuevas + snapshot+rollback.
   * opciones.motivo: compraventa|herencia|donacion|permuta|otra.
   */
  function titularidadesCambiarPropietario(propiedadId, listaNuevos, fecha, opciones) {
    opciones = opciones || {};
    const motivo = opciones.motivo || 'compraventa';
    _titularidadesValidarTituloAdquisicion(motivo);

    if (propiedadesObtener(propiedadId) === null) {
      throw new Error('[ajTitularidades] propiedadId no existe: "' + propiedadId + '"');
    }
    if (!Array.isArray(listaNuevos) || listaNuevos.length === 0) {
      throw new Error('[ajTitularidades] listaNuevos debe ser array no vacío');
    }
    if (typeof fecha !== 'string' || fecha === '') {
      throw new Error('[ajTitularidades] fecha obligatoria (ISO date string)');
    }
    // R2 pre-check si 2+
    if (listaNuevos.length >= 2) {
      let suma = 0;
      for (let i = 0; i < listaNuevos.length; i++) {
        if (typeof listaNuevos[i].porcentaje !== 'number') {
          throw new Error('[ajTitularidades] con 2+ nuevos TODAS deben tener porcentaje number');
        }
        suma += listaNuevos[i].porcentaje;
      }
      if (suma !== 100) {
        throw new Error('[ajTitularidades] R2 pre-check: suma porcentajes ≠ 100 (actual: ' + suma + ')');
      }
    }
    // Validar TODAS las personas nuevas existen ANTES de empezar
    for (let i = 0; i < listaNuevos.length; i++) {
      if (personasObtener(listaNuevos[i].personaId) === null) {
        throw new Error('[ajTitularidades] R-N1: persona no existe: "' + listaNuevos[i].personaId + '"');
      }
    }
    // Snapshot transaccional COMPLETO
    const snapshot = _titularidadesLeer().slice();
    try {
      // Cerrar activas previas
      const todas = _titularidadesLeer();
      const cerradas = [];
      for (let i = 0; i < todas.length; i++) {
        if (todas[i].propiedadId === propiedadId
            && todas[i].hasta === null
            && todas[i].deleted_at === null) {
          todas[i].hasta = fecha;
          todas[i].updated_at = new Date().toISOString();
          cerradas.push(todas[i]);
        }
      }
      _titularidadesPersistir(todas);
      // Crear nuevas activas
      const abiertas = [];
      for (let i = 0; i < listaNuevos.length; i++) {
        const p = listaNuevos[i];
        abiertas.push(titularidadesCrear({
          propiedadId:       propiedadId,
          personaId:         p.personaId,
          porcentaje:        (p.porcentaje !== undefined) ? p.porcentaje : null,
          rol:               p.rol || 'propietario',
          desde:             fecha,
          hasta:             null,
          tituloAdquisicion: motivo,
          notas:             p.notas || ''
        }));
        personasAgregarRol(p.personaId, 'propietario');
      }
      return { cerradas: cerradas, abiertas: abiertas };
    } catch (e) {
      _titularidadesPersistir(snapshot);
      throw new Error('[ajTitularidades] cambiarPropietario falló: ' + e.message + ' (rollback aplicado)');
    }
  }

  /**
   * Retorna titulares actuales de una propiedad joinados con persona.
   * Si persona soft-deleted o no existe → entrada con persona: null
   * (preserva histórico).
   */
  function titularidadesTitularesActuales(propiedadId) {
    const activas = _titularidadesLeer().filter(function (t) {
      return t.propiedadId === propiedadId
          && t.hasta === null
          && t.deleted_at === null;
    });
    return activas.map(function (t) {
      return {
        titularidad: t,
        persona:     personasObtener(t.personaId)
      };
    });
  }

  /**
   * Histórico completo titularidades de una propiedad ordenado DESC por desde.
   * Excluye soft-deleted. Sin join.
   */
  function titularidadesHistoricoPropiedad(propiedadId) {
    const todas = _titularidadesLeer().filter(function (t) {
      return t.propiedadId === propiedadId && t.deleted_at === null;
    });
    todas.sort(function (a, b) {
      if (a.desde < b.desde) return 1;
      if (a.desde > b.desde) return -1;
      if (a.id < b.id) return 1;
      if (a.id > b.id) return -1;
      return 0;
    });
    return todas;
  }

  /**
   * Propiedades de una persona joinadas con propiedad. opciones.soloActivas
   * filtra hasta===null. Si propiedad soft-deleted → entrada con propiedad: null.
   */
  function titularidadesPropiedadesDePersona(personaId, opciones) {
    opciones = opciones || {};
    const soloActivas = !!opciones.soloActivas;
    const titularidades = _titularidadesLeer().filter(function (t) {
      if (t.personaId !== personaId) return false;
      if (t.deleted_at !== null) return false;
      if (soloActivas && t.hasta !== null) return false;
      return true;
    });
    return titularidades.map(function (t) {
      return {
        titularidad: t,
        propiedad:   propiedadesObtener(t.propiedadId)
      };
    });
  }


  // ─── Namespace público Capa 10 ───
  const titularidades = {
    crear:                   titularidadesCrear,
    obtener:                 titularidadesObtener,
    listar:                  titularidadesListar,
    actualizar:              titularidadesActualizar,
    softDelete:              titularidadesSoftDelete,

    crearVinculacionInicial: titularidadesCrearVinculacionInicial,
    cambiarPropietario:      titularidadesCambiarPropietario,

    titularesActuales:       titularidadesTitularesActuales,
    historicoPropiedad:      titularidadesHistoricoPropiedad,
    propiedadesDePersona:    titularidadesPropiedadesDePersona,

    ROLES:                   _TITULARIDADES_ROLES,
    TITULOS_ADQUISICION:     _TITULARIDADES_TITULOS_ADQUISICION
  };


  // ═══════════════════════════════════════════════════════════════════════
  //  CAPA 16 — ajAgentesIA
  //  Gestión aj_agentes_ia agentes IA (Frente 14 §24 v5.77 + canon
  //  HANDOFF-AGENTES-IA-V10 §1 + §3.1). 5 agentes canónicos: 3 whatsapp
  //  (wp-followup + wp-recordatorios + wp-seguimientos) + 2 voz
  //  (voice-inbound + voice-outbound). Schema canonizado §24.3 v5.77.
  //  Función agentesIAMigrarFrente14() siembra inicial análoga
  //  migrarFrente13Colaboradores() v5.66 idempotente.
  //  Sub-frente 14.2 — Capa 16 motor de datos [NUEVO v2.17.0].
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Tipos canónicos agente IA §24.6.
   * - whatsapp: agente WhatsApp Business API (360dialog EU).
   * - voz: agente Voicebot (Vapi.ai inbound/outbound).
   */
  const _AGENTESIA_TIPOS = Object.freeze(['whatsapp', 'voz']);

  /**
   * Estados canónicos agente IA §24.3.
   * - activo: agente operativo recibiendo conversaciones.
   * - pausa: agente pausado temporalmente (NO recibe nuevas conversaciones).
   */
  const _AGENTESIA_ESTADOS = Object.freeze(['activo', 'pausa']);

  /**
   * Probabilidad escala humana §24.3.
   * - low: rara vez escala a humano.
   * - med: ocasionalmente escala.
   * - high: frecuentemente escala.
   */
  const _AGENTESIA_ESCALAS = Object.freeze(['low', 'med', 'high']);

  /**
   * Helper privado defensivo NO FATAL T11 (27) — lectura array agentes IA.
   * Patrón canónico replicable de _leerPedidos Capa 14 v2.8.0.
   * @returns {Array} array agentes IA leídos de localStorage (vacío si error o no existe)
   */
  function _agentesIALeer() {
    try {
      const agentes = store.get('aj_agentes_ia');
      return Array.isArray(agentes) ? agentes : [];
    } catch (err) {
      console.warn('[agentesIA] _agentesIALeer error: ' + err.message);
      return [];
    }
  }

  /**
   * Helper privado defensivo NO FATAL T11 (27) — persistencia array agentes IA.
   * Patrón canónico replicable de _persistirPedidos Capa 14 v2.8.0.
   * @param {Array} agentes - array agentes IA a persistir
   */
  function _agentesIAPersistir(agentes) {
    try {
      store.set('aj_agentes_ia', agentes);
    } catch (err) {
      console.warn('[agentesIA] _agentesIAPersistir error: ' + err.message);
    }
  }

  /**
   * Helper privado defensivo NO FATAL T11 (27) — validación tipo canónico.
   * @param {string} tipo - tipo a validar
   * @returns {boolean} true si tipo válido en _AGENTESIA_TIPOS
   */
  function _agentesIAValidarTipo(tipo) {
    return _AGENTESIA_TIPOS.indexOf(tipo) !== -1;
  }

  /**
   * Helper privado defensivo NO FATAL T11 (27) — validación estado canónico.
   * @param {string} estado - estado a validar
   * @returns {boolean} true si estado válido en _AGENTESIA_ESTADOS
   */
  function _agentesIAValidarEstado(estado) {
    return _AGENTESIA_ESTADOS.indexOf(estado) !== -1;
  }

  /**
   * Crea agente IA nuevo. Genera timestamps createdAt + updatedAt automáticos.
   * @param {Object} datos - datos agente (id obligatorio + nombre + tipo + estado + descr)
   * @returns {Object} agente IA creado con timestamps
   * @throws Error si id duplicado o tipo/estado inválidos
   */
  function agentesIACrear(datos) {
    if (!datos || !datos.id || typeof datos.id !== 'string') {
      throw new Error('[agentesIA] id obligatorio string');
    }
    if (!_agentesIAValidarTipo(datos.tipo)) {
      throw new Error('[agentesIA] tipo inválido: ' + datos.tipo + ' (válidos: ' + _AGENTESIA_TIPOS.join(', ') + ')');
    }
    if (!_agentesIAValidarEstado(datos.estado || 'activo')) {
      throw new Error('[agentesIA] estado inválido: ' + datos.estado);
    }
    const agentes = _agentesIALeer();
    if (agentes.some(function (a) { return a.id === datos.id; })) {
      throw new Error('[agentesIA] id duplicado: ' + datos.id);
    }
    const ahora = new Date().toISOString();
    const agente = {
      id: datos.id,
      nombre: datos.nombre || datos.id,
      tipo: datos.tipo,
      estado: datos.estado || 'activo',
      conv: typeof datos.conv === 'number' ? datos.conv : 0,
      escala: datos.escala && _AGENTESIA_ESCALAS.indexOf(datos.escala) !== -1 ? datos.escala : 'med',
      hil: !!datos.hil,
      descr: datos.descr || '',
      createdAt: ahora,
      updatedAt: ahora,
      deleted_at: null
    };
    agentes.push(agente);
    _agentesIAPersistir(agentes);
    return agente;
  }

  /**
   * Obtiene agente IA por id. Retorna null si no existe o soft-deleted (incluir_eliminado=false).
   * @param {string} agenteId - id agente
   * @param {boolean} [incluir_eliminado=false] - incluir agentes soft-deleted
   * @returns {Object|null} agente IA o null
   */
  function agentesIAObtener(agenteId, incluir_eliminado) {
    const agentes = _agentesIALeer();
    const agente = agentes.find(function (a) { return a.id === agenteId; });
    if (!agente) return null;
    if (!incluir_eliminado && agente.deleted_at) return null;
    return agente;
  }

  /**
   * Lista agentes IA con filtros opcionales.
   * @param {Object} [filtros] - {tipo?, estado?, hil?, incluir_eliminados?}
   * @returns {Array} array agentes IA filtrados
   */
  function agentesIAListar(filtros) {
    filtros = filtros || {};
    const incluirEliminados = !!filtros.incluir_eliminados;
    return _agentesIALeer().filter(function (a) {
      if (!incluirEliminados && a.deleted_at) return false;
      if (filtros.tipo && a.tipo !== filtros.tipo) return false;
      if (filtros.estado && a.estado !== filtros.estado) return false;
      if (typeof filtros.hil === 'boolean' && a.hil !== filtros.hil) return false;
      return true;
    });
  }

  /**
   * Actualiza agente IA. Rechaza modificar id/createdAt. Genera updatedAt automático.
   * @param {string} agenteId - id agente
   * @param {Object} cambios - cambios parciales
   * @returns {Object} agente IA actualizado
   * @throws Error si agente no existe o cambios prohibidos
   */
  function agentesIAActualizar(agenteId, cambios) {
    if (!cambios || typeof cambios !== 'object') {
      throw new Error('[agentesIA] cambios obligatorio objeto');
    }
    const camposProhibidos = ['id', 'createdAt'];
    for (const campo of camposProhibidos) {
      if (campo in cambios) {
        throw new Error('[agentesIA] campo prohibido modificar: ' + campo);
      }
    }
    if (cambios.tipo && !_agentesIAValidarTipo(cambios.tipo)) {
      throw new Error('[agentesIA] tipo inválido: ' + cambios.tipo);
    }
    if (cambios.estado && !_agentesIAValidarEstado(cambios.estado)) {
      throw new Error('[agentesIA] estado inválido: ' + cambios.estado);
    }
    const agentes = _agentesIALeer();
    const idx = agentes.findIndex(function (a) { return a.id === agenteId; });
    if (idx === -1) {
      throw new Error('[agentesIA] agente no existe: ' + agenteId);
    }
    Object.assign(agentes[idx], cambios);
    agentes[idx].updatedAt = new Date().toISOString();
    _agentesIAPersistir(agentes);
    return agentes[idx];
  }

  /**
   * Soft-delete agente IA. Idempotente (retorna true si marcó, false si ya estaba).
   * @param {string} agenteId - id agente
   * @returns {boolean} true si soft-delete aplicado, false si ya estaba o no existe
   */
  function agentesIASoftDelete(agenteId) {
    const agentes = _agentesIALeer();
    const idx = agentes.findIndex(function (a) { return a.id === agenteId; });
    if (idx === -1) return false;
    if (agentes[idx].deleted_at) return false;
    agentes[idx].deleted_at = new Date().toISOString();
    agentes[idx].updatedAt = agentes[idx].deleted_at;
    _agentesIAPersistir(agentes);
    return true;
  }

  /**
   * Cambia estado agente IA (activo ↔ pausa). Genera updatedAt automático.
   * @param {string} agenteId - id agente
   * @param {string} nuevoEstado - 'activo' | 'pausa'
   * @returns {Object} agente IA actualizado
   * @throws Error si estado inválido o agente no existe
   */
  function agentesIACambiarEstado(agenteId, nuevoEstado) {
    if (!_agentesIAValidarEstado(nuevoEstado)) {
      throw new Error('[agentesIA] estado inválido: ' + nuevoEstado);
    }
    return agentesIAActualizar(agenteId, { estado: nuevoEstado });
  }

  /**
   * Cuenta conversaciones IA activas (NO cerradas) para un agente. Actualiza conv denormalizado.
   * @param {string} agenteId - id agente
   * @returns {number} count conversaciones activas (live + escala + alerta)
   */
  function agentesIAContarConversacionesActivas(agenteId) {
    try {
      const convs = store.get('aj_conversaciones_ia') || [];
      const activas = convs.filter(function (c) {
        return c.agenteId === agenteId && c.estado !== 'cerrada' && !c.deleted_at;
      });
      return activas.length;
    } catch (err) {
      console.warn('[agentesIA] agentesIAContarConversacionesActivas error: ' + err.message);
      return 0;
    }
  }

  /**
   * Migración inicial Frente 14 — siembra 5 agentes canónicos canon HANDOFF-AGENTES-IA-V10 §1.
   * Idempotente vía flag aj_migracion_frente14_completada.
   * Patrón canónico replicable de migrarFrente13Colaboradores() v5.66.
   * @returns {Object} {creados: number, omitidos: number}
   */
  function agentesIAMigrarFrente14() {
    try {
      if (store.get('aj_migracion_frente14_completada')) {
        return { creados: 0, omitidos: 5 };
      }
      const AGENTES_INICIALES = [
        { id: 'wp-followup',      nombre: 'WhatsApp · Seguimiento',     tipo: 'whatsapp', estado: 'activo', conv: 0, escala: 'low',  hil: false, descr: 'Sigue clientes activos durante toda la operación' },
        { id: 'wp-recordatorios', nombre: 'WhatsApp · Recordatorios',   tipo: 'whatsapp', estado: 'activo', conv: 0, escala: 'low',  hil: true,  descr: 'Avisos firma, documentación, citas próximas' },
        { id: 'voice-inbound',    nombre: 'Voz · Recepción llamadas',   tipo: 'voz',      estado: 'activo', conv: 0, escala: 'high', hil: false, descr: 'Atiende llamadas si no contestamos en 3 tonos' },
        { id: 'voice-outbound',   nombre: 'Voz · Outbound',             tipo: 'voz',      estado: 'pausa',  conv: 0, escala: 'med',  hil: true,  descr: 'Llama a clientes sin respuesta + agenda visita' },
        { id: 'wp-seguimientos',  nombre: 'Agente seguimientos pdte.',  tipo: 'whatsapp', estado: 'activo', conv: 0, escala: 'med',  hil: false, descr: 'Recuerda al cliente seguimientos sin cerrar' }
      ];
      const existentes = _agentesIALeer();
      let creados = 0, omitidos = 0;
      AGENTES_INICIALES.forEach(function (a) {
        if (existentes.some(function (e) { return e.id === a.id; })) {
          omitidos++;
        } else {
          agentesIACrear(a);
          creados++;
        }
      });
      store.set('aj_migracion_frente14_completada', true);
      return { creados: creados, omitidos: omitidos };
    } catch (err) {
      console.warn('[agentesIA] agentesIAMigrarFrente14 error: ' + err.message);
      return { creados: 0, omitidos: 0, error: err.message };
    }
  }

  /**
   * Namespace público Capa 16.
   * Funciones: 8 públicas (CRUD + 2 helpers + función migración).
   * Constantes: 3 sets frozen canónicos.
   */
  const agentesIA = {
    crear:                       agentesIACrear,
    obtener:                     agentesIAObtener,
    listar:                      agentesIAListar,
    actualizar:                  agentesIAActualizar,
    softDelete:                  agentesIASoftDelete,

    cambiarEstado:               agentesIACambiarEstado,
    contarConversacionesActivas: agentesIAContarConversacionesActivas,
    migrarFrente14:              agentesIAMigrarFrente14,

    TIPOS:                       _AGENTESIA_TIPOS,
    ESTADOS:                     _AGENTESIA_ESTADOS,
    ESCALAS:                     _AGENTESIA_ESCALAS
  };


  // ═══════════════════════════════════════════════════════════════════════
  //  CAPA 17 — ajConversacionesIA
  //  Gestión aj_conversaciones_ia conversaciones IA polimórficas (Frente 14
  //  §24 v5.77 + canon HANDOFF-AGENTES-IA-V10 §3.2 + §3.3 + §3.4).
  //  Schema polimórfico por tipo agente: whatsapp → aj_mensajes_ia[convId] +
  //  voz → aj_llamadas_ia[convId]. Estados canónicos 4: live + escala +
  //  alerta + cerrada. Reutiliza Capa 16 agentesIA + Capa 11 personas via
  //  closure IIFE para validación referencias clienteId + agenteId.
  //  Sub-frente 14.2 — Capa 17 motor de datos [NUEVO v2.17.0].
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * Estados canónicos conversación IA §24.3.
   * - live: conversación activa operativa.
   * - escala: cliente pide humano explícitamente.
   * - alerta: sentimiento negativo / queja detectada.
   * - cerrada: conversación finalizada.
   */
  const _CONVERSACIONESIA_ESTADOS = Object.freeze(['live', 'escala', 'alerta', 'cerrada']);

  /**
   * Sentimientos canónicos conversación IA §24.3.
   * - pos: positivo.
   * - neu: neutral.
   * - neg: negativo.
   */
  const _CONVERSACIONESIA_SENTIMIENTOS = Object.freeze(['pos', 'neu', 'neg']);

  /**
   * Tipos canónicos mensaje IA §24.3 (solo whatsapp).
   * - normal: mensaje regular agente/cliente.
   * - escalation: mensaje agente pasa control a humano.
   * - alerta: mensaje sistema indica alerta automática.
   */
  const _MENSAJESIA_TIPOS = Object.freeze(['normal', 'escalation', 'alerta']);

  /**
   * Helper privado defensivo NO FATAL T11 (27) — lectura array conversaciones IA.
   */
  function _conversacionesIALeer() {
    try {
      const convs = store.get('aj_conversaciones_ia');
      return Array.isArray(convs) ? convs : [];
    } catch (err) {
      console.warn('[conversacionesIA] _conversacionesIALeer error: ' + err.message);
      return [];
    }
  }

  /**
   * Helper privado defensivo NO FATAL T11 (27) — persistencia array conversaciones IA.
   */
  function _conversacionesIAPersistir(convs) {
    try {
      store.set('aj_conversaciones_ia', convs);
    } catch (err) {
      console.warn('[conversacionesIA] _conversacionesIAPersistir error: ' + err.message);
    }
  }

  /**
   * Helper privado defensivo NO FATAL T11 (27) — validación estado canónico.
   */
  function _conversacionesIAValidarEstado(estado) {
    return _CONVERSACIONESIA_ESTADOS.indexOf(estado) !== -1;
  }

  /**
   * Helper privado defensivo NO FATAL T11 (27) — validación sentimiento canónico.
   */
  function _conversacionesIAValidarSentimiento(sentimiento) {
    return _CONVERSACIONESIA_SENTIMIENTOS.indexOf(sentimiento) !== -1;
  }

  /**
   * Crea conversación IA nueva. Valida clienteId existe + agenteId existe.
   * @param {Object} datos - datos conversación
   * @returns {Object} conversación IA creada
   * @throws Error si id duplicado o referencias inválidas
   */
  function conversacionesIACrear(datos) {
    if (!datos || !datos.id || typeof datos.id !== 'string') {
      throw new Error('[conversacionesIA] id obligatorio string');
    }
    if (!datos.agenteId) {
      throw new Error('[conversacionesIA] agenteId obligatorio');
    }
    if (datos.estado && !_conversacionesIAValidarEstado(datos.estado)) {
      throw new Error('[conversacionesIA] estado inválido: ' + datos.estado);
    }
    if (datos.sentimiento && !_conversacionesIAValidarSentimiento(datos.sentimiento)) {
      throw new Error('[conversacionesIA] sentimiento inválido: ' + datos.sentimiento);
    }
    const convs = _conversacionesIALeer();
    if (convs.some(function (c) { return c.id === datos.id; })) {
      throw new Error('[conversacionesIA] id duplicado: ' + datos.id);
    }
    const ahora = new Date().toISOString();
    const conv = {
      id: datos.id,
      clienteId: datos.clienteId || null,
      cliente: datos.cliente || '',
      agenteId: datos.agenteId,
      ultimoMsg: datos.ultimoMsg || '',
      cuandoUlt: datos.cuandoUlt || ahora,
      sentimiento: datos.sentimiento || 'neu',
      estado: datos.estado || 'live',
      unread: typeof datos.unread === 'number' ? datos.unread : 0,
      agenteActivo: typeof datos.agenteActivo === 'boolean' ? datos.agenteActivo : true,
      msgPendiente: !!datos.msgPendiente,
      motivoEscala: datos.motivoEscala || null,
      createdAt: ahora,
      updatedAt: ahora,
      deleted_at: null
    };
    convs.push(conv);
    _conversacionesIAPersistir(convs);
    return conv;
  }

  /**
   * Obtiene conversación IA por id.
   */
  function conversacionesIAObtener(convId, incluir_eliminado) {
    const convs = _conversacionesIALeer();
    const conv = convs.find(function (c) { return c.id === convId; });
    if (!conv) return null;
    if (!incluir_eliminado && conv.deleted_at) return null;
    return conv;
  }

  /**
   * Lista conversaciones IA con filtros opcionales.
   * @param {Object} [filtros] - {clienteId?, agenteId?, estado?, sentimiento?, incluir_eliminados?}
   * @returns {Array} array conversaciones IA filtradas
   */
  function conversacionesIAListar(filtros) {
    filtros = filtros || {};
    const incluirEliminados = !!filtros.incluir_eliminados;
    return _conversacionesIALeer().filter(function (c) {
      if (!incluirEliminados && c.deleted_at) return false;
      if (filtros.clienteId && c.clienteId !== filtros.clienteId) return false;
      if (filtros.agenteId && c.agenteId !== filtros.agenteId) return false;
      if (filtros.estado && c.estado !== filtros.estado) return false;
      if (filtros.sentimiento && c.sentimiento !== filtros.sentimiento) return false;
      return true;
    });
  }

  /**
   * Actualiza conversación IA. Rechaza modificar id/createdAt.
   */
  function conversacionesIAActualizar(convId, cambios) {
    if (!cambios || typeof cambios !== 'object') {
      throw new Error('[conversacionesIA] cambios obligatorio objeto');
    }
    const camposProhibidos = ['id', 'createdAt'];
    for (const campo of camposProhibidos) {
      if (campo in cambios) {
        throw new Error('[conversacionesIA] campo prohibido modificar: ' + campo);
      }
    }
    if (cambios.estado && !_conversacionesIAValidarEstado(cambios.estado)) {
      throw new Error('[conversacionesIA] estado inválido: ' + cambios.estado);
    }
    if (cambios.sentimiento && !_conversacionesIAValidarSentimiento(cambios.sentimiento)) {
      throw new Error('[conversacionesIA] sentimiento inválido: ' + cambios.sentimiento);
    }
    const convs = _conversacionesIALeer();
    const idx = convs.findIndex(function (c) { return c.id === convId; });
    if (idx === -1) {
      throw new Error('[conversacionesIA] conversación no existe: ' + convId);
    }
    Object.assign(convs[idx], cambios);
    convs[idx].updatedAt = new Date().toISOString();
    _conversacionesIAPersistir(convs);
    return convs[idx];
  }

  /**
   * Soft-delete conversación IA.
   */
  function conversacionesIASoftDelete(convId) {
    const convs = _conversacionesIALeer();
    const idx = convs.findIndex(function (c) { return c.id === convId; });
    if (idx === -1) return false;
    if (convs[idx].deleted_at) return false;
    convs[idx].deleted_at = new Date().toISOString();
    convs[idx].updatedAt = convs[idx].deleted_at;
    _conversacionesIAPersistir(convs);
    return true;
  }

  /**
   * Cambia estado conversación IA. Valida transición canónica.
   */
  function conversacionesIACambiarEstado(convId, nuevoEstado, contexto) {
    if (!_conversacionesIAValidarEstado(nuevoEstado)) {
      throw new Error('[conversacionesIA] estado inválido: ' + nuevoEstado);
    }
    const cambios = { estado: nuevoEstado };
    if (contexto && contexto.motivoEscala) cambios.motivoEscala = contexto.motivoEscala;
    if (contexto && typeof contexto.msgPendiente === 'boolean') cambios.msgPendiente = contexto.msgPendiente;
    return conversacionesIAActualizar(convId, cambios);
  }

  /**
   * Obtiene array mensajes whatsapp para conversación. Retorna array vacío si no whatsapp o no existe.
   */
  function conversacionesIAMensajesObtener(convId) {
    try {
      const mensajes = store.get('aj_mensajes_ia') || {};
      return Array.isArray(mensajes[convId]) ? mensajes[convId] : [];
    } catch (err) {
      console.warn('[conversacionesIA] conversacionesIAMensajesObtener error: ' + err.message);
      return [];
    }
  }

  /**
   * Añade mensaje whatsapp a conversación. Actualiza ultimoMsg + cuandoUlt + updatedAt conversación.
   */
  function conversacionesIAMensajeAniadir(convId, mensaje) {
    if (!mensaje || !mensaje.from || !mensaje.texto) {
      throw new Error('[conversacionesIA] mensaje requiere from + texto');
    }
    if (mensaje.tipo && _MENSAJESIA_TIPOS.indexOf(mensaje.tipo) === -1) {
      throw new Error('[conversacionesIA] tipo mensaje inválido: ' + mensaje.tipo);
    }
    const mensajes = store.get('aj_mensajes_ia') || {};
    if (!mensajes[convId]) mensajes[convId] = [];
    mensajes[convId].push(mensaje);
    store.set('aj_mensajes_ia', mensajes);
    // Actualiza ultimoMsg + cuandoUlt en conversación
    try {
      conversacionesIAActualizar(convId, {
        ultimoMsg: mensaje.texto,
        cuandoUlt: mensaje.hora || new Date().toISOString()
      });
    } catch (err) {
      console.warn('[conversacionesIA] conversación no existe al añadir mensaje: ' + convId);
    }
    return mensaje;
  }

  /**
   * Obtiene objeto llamada voz para conversación.
   */
  function conversacionesIALlamadaObtener(convId) {
    try {
      const llamadas = store.get('aj_llamadas_ia') || {};
      return llamadas[convId] || null;
    } catch (err) {
      console.warn('[conversacionesIA] conversacionesIALlamadaObtener error: ' + err.message);
      return null;
    }
  }

  /**
   * Actualiza objeto llamada voz para conversación.
   */
  function conversacionesIALlamadaActualizar(convId, llamada) {
    const llamadas = store.get('aj_llamadas_ia') || {};
    llamadas[convId] = llamada;
    store.set('aj_llamadas_ia', llamadas);
    return llamada;
  }

  /**
   * Lista conversaciones IA por cliente (alias semántico).
   */
  function conversacionesIAListarPorCliente(clienteId) {
    return conversacionesIAListar({ clienteId: clienteId });
  }

  /**
   * Lista conversaciones IA por agente (alias semántico).
   */
  function conversacionesIAListarPorAgente(agenteId) {
    return conversacionesIAListar({ agenteId: agenteId });
  }

  /**
   * Marca conversación como escalada a humano + motivo opcional.
   */
  function conversacionesIAMarcarComoEscalada(convId, motivoEscala) {
    return conversacionesIACambiarEstado(convId, 'escala', {
      motivoEscala: motivoEscala || 'Cliente pide humano',
      msgPendiente: true
    });
  }

  /**
   * Cierra conversación (estado='cerrada' + agenteActivo=false).
   */
  function conversacionesIACerrarConversacion(convId) {
    return conversacionesIAActualizar(convId, { estado: 'cerrada', agenteActivo: false });
  }

  /**
   * Namespace público Capa 17.
   * Funciones: 15 públicas (5 CRUD + 1 transición estado + 4 helpers polimórficos mensajes/llamadas + 2 búsqueda + 3 transición específicas).
   * Constantes: 3 sets frozen canónicos.
   */
  const conversacionesIA = {
    crear:                  conversacionesIACrear,
    obtener:                conversacionesIAObtener,
    listar:                 conversacionesIAListar,
    actualizar:             conversacionesIAActualizar,
    softDelete:             conversacionesIASoftDelete,

    cambiarEstado:          conversacionesIACambiarEstado,

    mensajesObtener:        conversacionesIAMensajesObtener,
    mensajeAniadir:         conversacionesIAMensajeAniadir,
    llamadaObtener:         conversacionesIALlamadaObtener,
    llamadaActualizar:      conversacionesIALlamadaActualizar,

    listarPorCliente:       conversacionesIAListarPorCliente,
    listarPorAgente:        conversacionesIAListarPorAgente,

    marcarComoEscalada:     conversacionesIAMarcarComoEscalada,
    cerrarConversacion:     conversacionesIACerrarConversacion,

    ESTADOS:                _CONVERSACIONESIA_ESTADOS,
    SENTIMIENTOS:           _CONVERSACIONESIA_SENTIMIENTOS,
    TIPOS_MENSAJE:          _MENSAJESIA_TIPOS
  };


  // ═══════════════════════════════════════════════════════════════════════
  //  CAPA 18 — ajInbox
  // ═══════════════════════════════════════════════════════════════════════
  //  Gestión aj_inbox como entidad NUEVA Frente 10 NUEVO Módulo Inbox
  //  portales B2B inmobiliarios (canon §26 v5.102 Sub-frente 10.2 +
  //  D-F10-01..08 canonizadas formal vinculantes).
  //
  //  Entidad NUEVA candidate v2.19.0 — id AJ-IB-NNN + canal canonizable
  //  (4 valores: idealista + fotocasa_pro + habitaclia + email_portal) +
  //  estado embudo 6 valores canon §26.3 (nuevo → en_revision →
  //  contactado → cualificado → convertido → descartado) + cliente_potencial
  //  + propiedad_interes_id cross-link Capa 9 opcional + suite_destino_canonico
  //  = 'inmo' fijo (D-F10-08 INMO EXCLUSIVO vinculante).
  //
  //  Patrón canónico replicable Capa 13 AJ.captacion v2.7.0 byte por byte
  //  adaptado Inbox canon FORMAL VINCULANTE v5.73+ cross-canon enrichment
  //  11ª manif acumulada cross-Frente 10.
  //
  //  Conversión Inbox → persona Capa 11 patrón canon Sub-frente 6.4 v5.22
  //  wizard 5 pasos replicable (canon D-F10-07 vinculante) reutiliza
  //  AJ.personas.buscarPorDedup R-N3 + AJ.personas.crear + agregarEmbudo
  //  fase 'estudio' tagOrigen 'inbox_portal_<canal>'.
  // ═══════════════════════════════════════════════════════════════════════

  // Sub-frente 10.4 v5.105 — recalibración retroactiva D-F10-08 v5.102 polimórfica
  // canon cross-suite Inmo + Finances vinculante (post-Sub-frente 10.3 v5.104 Inmo VALIDADO)
  const _INBOX_SUITE_DESTINOS = Object.freeze(['inmo', 'finances']);

  const _INBOX_CANALES = Object.freeze(['idealista', 'fotocasa_pro', 'habitaclia', 'email_portal']);

  const _INBOX_ESTADOS = Object.freeze([
    'nuevo',
    'en_revision',
    'contactado',
    'cualificado',
    'convertido',
    'descartado'
  ]);

  const _INBOX_TRANSICIONES_PERMITIDAS = Object.freeze({
    nuevo:        ['en_revision', 'descartado'],
    en_revision:  ['contactado', 'descartado'],
    contactado:   ['cualificado', 'descartado'],
    cualificado:  ['convertido', 'descartado'],
    convertido:   [],  // terminal positivo
    descartado:   ['nuevo']  // reactivación manual
  });

  const _INBOX_MOTIVOS_DESCARTE = Object.freeze([
    'no_responde', 'fuera_zona', 'fuera_presupuesto', 'fake_o_erroneo',
    'no_interesado', 'duplicado', 'otro'
  ]);

  // NUEVO v5.113 — Tipos de demanda canónicos Capa 18 v2.20.0
  // Canon §26.3 + §26.14.2 D Opción (β3) Híbrido vinculante v5.112
  // Backward compat producción Sub-frentes 10.2-10.10 (tipo: null permitido en inboxCrear/inboxActualizar)
  const _INBOX_TIPOS_DEMANDA = Object.freeze(['compra', 'venta', 'alquiler']);

  function _inboxLeer()       { return store.get('aj_inbox') || []; }
  function _inboxPersistir(a) { store.set('aj_inbox', a); }

  function _inboxValidarSuiteDestino(suite) {
    if (_INBOX_SUITE_DESTINOS.indexOf(suite) === -1) {
      throw new Error('[ajInbox] suite_destino_canonico inválido: "' + suite + '". Valores: ' + _INBOX_SUITE_DESTINOS.join('|'));
    }
  }

  function _inboxValidarCanal(canal) {
    if (_INBOX_CANALES.indexOf(canal) === -1) {
      throw new Error('[ajInbox] canal inválido: "' + canal + '". Valores: ' + _INBOX_CANALES.join('|'));
    }
  }

  function _inboxValidarEstado(estado) {
    if (_INBOX_ESTADOS.indexOf(estado) === -1) {
      throw new Error('[ajInbox] estado inválido: "' + estado + '". Valores: ' + _INBOX_ESTADOS.join('|'));
    }
  }

  /**
   * Valida tipo de demanda Capa 18 v2.20.0 [NUEVO v5.113]
   * Canon §26.3 + §26.14.2 D Opción (β3) Híbrido vinculante v5.112
   * @param {string} tipo - Valor a validar (caller responsable de filtrar null)
   * @throws Error si tipo no ∈ _INBOX_TIPOS_DEMANDA
   */
  function _inboxValidarTipoDemanda(tipo) {
    if (_INBOX_TIPOS_DEMANDA.indexOf(tipo) === -1) {
      throw new Error('[ajInbox] tipo demanda inválido: "' + tipo + '". Valores: ' + _INBOX_TIPOS_DEMANDA.join('|'));
    }
  }

  /**
   * Crea nueva entrada inbox aj_inbox.
   * @param {object} datos - {canal, cliente_potencial, propiedad_interes_id?, analista_asignado_id?, source_id?, payload_original?}
   * @returns {object} entrada creada con id AJ-IB-NNN + estado='nuevo' + suite_destino_canonico='inmo'.
   * @throws Si campos obligatorios faltan o canal inválido.
   */
  function inboxCrear(datos) {
    if (!datos || typeof datos !== 'object') throw new Error('[ajInbox] datos requeridos');
    _inboxValidarCanal(datos.canal);
    if (!datos.cliente_potencial || typeof datos.cliente_potencial !== 'object') {
      throw new Error('[ajInbox] cliente_potencial objeto requerido');
    }
    if (!datos.cliente_potencial.nombre || typeof datos.cliente_potencial.nombre !== 'string' || datos.cliente_potencial.nombre.trim() === '') {
      throw new Error('[ajInbox] cliente_potencial.nombre obligatorio string no vacío');
    }
    // NUEVO v5.113 canon §26.3 + §26.14.2 D Opción (β3) Híbrido — validar tipo opcional (admite null backward compat)
    if (datos.tipo !== undefined && datos.tipo !== null) {
      _inboxValidarTipoDemanda(datos.tipo);
    }
    var nowIso = new Date().toISOString();
    var nueva = {
      id:                       idCodigoHumano('inbox'),
      uuid:                     idUuid(),
      canal:                    datos.canal,
      ts_recepcion:             datos.ts_recepcion || nowIso,
      cliente_potencial: {
        nombre:          datos.cliente_potencial.nombre,
        telefono:        datos.cliente_potencial.telefono || null,
        email:           datos.cliente_potencial.email || null,
        mensaje_original: datos.cliente_potencial.mensaje_original || ''
      },
      propiedad_interes_id:     datos.propiedad_interes_id || null,
      tipo:                     (datos.tipo !== undefined && datos.tipo !== null) ? datos.tipo : null,  // NUEVO v5.113 canon §26.3 ampliación campo tipo aditivo backward compat
      estado:                   'nuevo',
      motivo_descarte:          null,
      analista_asignado_id:     datos.analista_asignado_id || null,
      suite_destino_canonico:   (function(){
        var s = datos.suite_destino_canonico || 'inmo';  // default 'inmo' backward compat Sub-frente 10.3 v5.104 producción
        _inboxValidarSuiteDestino(s);
        return s;
      })(),  // D-F10-08 RECALIBRADA v5.105 polimórfico canon cross-suite Inmo + Finances vinculante
      promovido_a_persona_id:   null,
      ts_promocion:             null,
      promovido_por_agente_id:  null,
      source_id:                datos.source_id || null,  // Antigravity v11 Fase 2 webhook ID
      payload_original:         datos.payload_original || null,  // datos crudos portal
      created_at:               nowIso,
      updated_at:               nowIso,
      deleted_at:               null
    };
    var todas = _inboxLeer();
    todas.push(nueva);
    _inboxPersistir(todas);
    return nueva;
  }

  /**
   * Obtiene entrada inbox por id. null si soft-deleted (a menos incluir_eliminado=true).
   */
  function inboxObtener(id, incluir_eliminado) {
    if (!id) return null;
    var todas = _inboxLeer();
    for (var i = 0; i < todas.length; i++) {
      if (todas[i].id === id) {
        if (todas[i].deleted_at && !incluir_eliminado) return null;
        return todas[i];
      }
    }
    return null;
  }

  /**
   * Lista entradas inbox con filtros AND combinables.
   * Filtros: {canal?, estado?, analista_asignado_id?, propiedad_interes_id?, incluir_eliminados?}
   */
  function inboxListar(filtros) {
    filtros = filtros || {};
    var todas = _inboxLeer();
    return todas.filter(function (e) {
      if (e.deleted_at && !filtros.incluir_eliminados) return false;
      if (filtros.canal && e.canal !== filtros.canal) return false;
      if (filtros.estado && e.estado !== filtros.estado) return false;
      if (filtros.analista_asignado_id && e.analista_asignado_id !== filtros.analista_asignado_id) return false;
      if (filtros.propiedad_interes_id && e.propiedad_interes_id !== filtros.propiedad_interes_id) return false;
      if (filtros.suite_destino_canonico && e.suite_destino_canonico !== filtros.suite_destino_canonico) return false;
      if (filtros.tipo !== undefined && e.tipo !== filtros.tipo) return false;  // NUEVO v5.113 canon §26.3 filter opcional tipo demanda (admite null)
      return true;
    });
  }

  /**
   * Actualiza entrada inbox cambios parciales. Rechaza campos prohibidos
   * [id, uuid, created_at, deleted_at, suite_destino_canonico, estado].
   * Para cambiar estado usar inboxCambiarEstado.
   */
  function inboxActualizar(id, cambios) {
    if (!id) throw new Error('[ajInbox] id obligatorio');
    if (!cambios || typeof cambios !== 'object') throw new Error('[ajInbox] cambios objeto');
    var prohibidos = ['id', 'uuid', 'created_at', 'deleted_at', 'estado'];
    // NOTA Sub-frente 10.4 v5.105: suite_destino_canonico SACADO de prohibidos
    // (canon polimórfico v5.105 — migración manual cross-suite Inmo ↔ Finances permitida con validación)
    for (var k = 0; k < prohibidos.length; k++) {
      if (Object.prototype.hasOwnProperty.call(cambios, prohibidos[k])) {
        throw new Error('[ajInbox] campo prohibido: ' + prohibidos[k]);
      }
    }
    var todas = _inboxLeer();
    for (var i = 0; i < todas.length; i++) {
      if (todas[i].id === id) {
        if (todas[i].deleted_at) return null;
        ['canal', 'cliente_potencial', 'propiedad_interes_id', 'analista_asignado_id', 'source_id', 'payload_original', 'suite_destino_canonico', 'tipo'].forEach(function (campo) {
          if (Object.prototype.hasOwnProperty.call(cambios, campo)) {
            if (campo === 'canal') _inboxValidarCanal(cambios.canal);
            if (campo === 'suite_destino_canonico') _inboxValidarSuiteDestino(cambios.suite_destino_canonico);
            if (campo === 'tipo' && cambios.tipo !== null) _inboxValidarTipoDemanda(cambios.tipo);  // NUEVO v5.113 canon §26.3 ampliación campo tipo aditivo backward compat (null permitido)
            todas[i][campo] = cambios[campo];
          }
        });
        todas[i].updated_at = new Date().toISOString();
        _inboxPersistir(todas);
        return todas[i];
      }
    }
    return null;
  }

  /**
   * Soft-delete entrada inbox (idempotente).
   */
  function inboxSoftDelete(id) {
    if (!id) return false;
    var todas = _inboxLeer();
    for (var i = 0; i < todas.length; i++) {
      if (todas[i].id === id) {
        if (todas[i].deleted_at) return false;
        todas[i].deleted_at = new Date().toISOString();
        todas[i].updated_at = todas[i].deleted_at;
        _inboxPersistir(todas);
        return true;
      }
    }
    return false;
  }

  /**
   * Valida transición estado canon tabla _INBOX_TRANSICIONES_PERMITIDAS.
   * @returns {boolean} true si permitida, false si no.
   */
  function inboxValidarTransicion(estadoActual, estadoNuevo) {
    if (estadoActual === estadoNuevo) return true;  // no-op idempotente
    var permitidas = _INBOX_TRANSICIONES_PERMITIDAS[estadoActual] || [];
    return permitidas.indexOf(estadoNuevo) !== -1;
  }

  /**
   * Cambia estado entrada inbox con validación transición + contexto polimórfico.
   * Contexto descartado requiere {motivo, notas?}. Contexto otros estados libre.
   */
  function inboxCambiarEstado(id, nuevoEstado, contexto) {
    if (!id) throw new Error('[ajInbox] id obligatorio');
    _inboxValidarEstado(nuevoEstado);
    var todas = _inboxLeer();
    for (var i = 0; i < todas.length; i++) {
      if (todas[i].id === id) {
        if (todas[i].deleted_at) throw new Error('[ajInbox] entrada soft-deleted');
        if (!inboxValidarTransicion(todas[i].estado, nuevoEstado)) {
          throw new Error('[ajInbox] transición no permitida: ' + todas[i].estado + ' → ' + nuevoEstado);
        }
        contexto = contexto || {};
        if (nuevoEstado === 'descartado') {
          if (!contexto.motivo) throw new Error('[ajInbox] motivo descarte obligatorio');
          if (_INBOX_MOTIVOS_DESCARTE.indexOf(contexto.motivo) === -1) {
            throw new Error('[ajInbox] motivo inválido. Valores: ' + _INBOX_MOTIVOS_DESCARTE.join('|'));
          }
          todas[i].motivo_descarte = contexto.motivo + (contexto.notas ? ' · ' + contexto.notas : '');
        }
        todas[i].estado = nuevoEstado;
        todas[i].updated_at = new Date().toISOString();
        _inboxPersistir(todas);
        return todas[i];
      }
    }
    throw new Error('[ajInbox] entrada no encontrada: ' + id);
  }

  /**
   * Orquesta conversión Inbox → persona Capa 11 + agregarEmbudo fase 'estudio'.
   * Canon Sub-frente 6.4 v5.22 wizard 5 pasos replicable + Sub-frente 12.10 v5.99 patrón
   * (canon FORMAL VINCULANTE v5.73+ cross-canon enrichment 11ª manif).
   *
   * @param {string} id - id entrada inbox
   * @param {object} opciones - {forzar_nueva?, agente_id?, tipo_solicitud?}
   * @returns {object} {entrada, persona, dedupResultado}
   */
  function inboxConvertirAPersona(id, opciones) {
    if (!id) throw new Error('[ajInbox] id obligatorio');
    opciones = opciones || {};
    var entrada = inboxObtener(id);
    if (!entrada) throw new Error('[ajInbox] entrada no encontrada: ' + id);
    if (entrada.estado !== 'cualificado') {
      throw new Error('[ajInbox] conversión requiere estado cualificado (actual: ' + entrada.estado + ')');
    }

    // Paso 1+3 canon Sub-frente 6.4 — dedup R-N3 canon §16.5 reutiliza Capa 11
    var datosPersona = {
      nombre:   entrada.cliente_potencial.nombre,
      telefono: entrada.cliente_potencial.telefono,
      email:    entrada.cliente_potencial.email
    };

    var personaResultado;
    if (opciones.forzar_nueva === true) {
      personaResultado = personasCrear(datosPersona, 'comprador_inmo', { forzarSiDuplicado: true });
    } else {
      personaResultado = personasCrear(datosPersona, 'comprador_inmo', { forzarSiDuplicado: false });
    }

    var personaId = personaResultado.creada ? personaResultado.creada.id :
                    (personaResultado.duplicadosCandidatos && personaResultado.duplicadosCandidatos[0] ? personaResultado.duplicadosCandidatos[0].id : null);

    if (!personaId) {
      throw new Error('[ajInbox] dedup persona no resolvió personaId');
    }

    // Paso 5 canon Sub-frente 6.4 — agregarEmbudo fase 'estudio' tagOrigen
    if (typeof personasAgregarEmbudo === 'function') {
      try {
        personasAgregarEmbudo(personaId, 'comprador_inmo', {
          notas: {
            fase:       'estudio',
            tagOrigen:  'inbox_portal_' + entrada.canal,
            inboxId:    entrada.id
          }
        });
      } catch (e) { /* embudo opcional — tolerar fallo */ }
    }

    // Cambiar estado inbox a 'convertido' + rellenar campos promoción
    var todas = _inboxLeer();
    for (var i = 0; i < todas.length; i++) {
      if (todas[i].id === id) {
        todas[i].estado                   = 'convertido';
        todas[i].promovido_a_persona_id   = personaId;
        todas[i].ts_promocion             = new Date().toISOString();
        todas[i].promovido_por_agente_id  = opciones.agente_id || entrada.analista_asignado_id || null;
        todas[i].updated_at               = todas[i].ts_promocion;
        _inboxPersistir(todas);
        return {
          entrada:        todas[i],
          persona:        personaResultado.creada || personaResultado.duplicadosCandidatos[0],
          dedupResultado: {
            esNueva:          !!personaResultado.creada,
            candidatosTotal:  personaResultado.duplicadosCandidatos ? personaResultado.duplicadosCandidatos.length : 0
          }
        };
      }
    }
    throw new Error('[ajInbox] entrada no encontrada post-conversión: ' + id);
  }

  /**
   * Migración Frente 10 idempotente — esqueleto siembra inicial.
   * Patrón canon migrarFrente6 + migrarFrente12SeguimientosInmo + migrarFrente14AgentesIA.
   * Fase 1: idempotente vía flag. Fase 2 backend Antigravity v11-handoff webhooks portales
   * extenderá ingesta automatizada (D-F10-06 vinculante).
   */
  function inboxMigrarFrente10() {
    if (store.get('aj_migracion_frente10_completada') === true) {
      return { creados: 0, omitidos: 0, mensaje: 'ya completada' };
    }
    store.set('aj_migracion_frente10_completada', true);
    return { creados: 0, omitidos: 0, mensaje: 'esqueleto Fase 1 — extensible Fase 2 Antigravity v11' };
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  CAPA 19 — ajSession
  // ═══════════════════════════════════════════════════════════════════════
  //  Gestión sesión autenticación canónica unificada Frente 16 NUEVO
  //  Módulo Login Unificado + Ajustes/Permisos (canon §28 v5.123 Sub-frente
  //  16.2 v5.124 código runtime + 6 decisiones D-F16-01..06 RECALIBRADAS
  //  vinculantes Capa 1 Jonatan 2026-05-31).
  //
  //  Storage canónico ÚNICO `aj_session_v3` (D-F16-02 vinculante) schema
  //  enriquecido {userId, email, passwordHash, salt, roles[], permissions{},
  //  sociedad_principal, suite_origen, lastSeen, createdAt, expiresAt,
  //  lastPasswordChange}. Hashing SHA-256+salt Fase 1 puro JS cross-platform
  //  sync (Node `crypto.createHash` + Browser pure JS embedded ~50L canonical
  //  algorithm RFC 6234) migrable PBKDF2 Web Crypto API Fase 2 backend.
  //
  //  Storage adicional `aj_session_users_v3` (admin-only CRUD) — lista
  //  usuarios autorizados {userId, email, passwordHash, salt, roles[],
  //  permissions{}, sociedad_principal, createdAt, lastPasswordChange}.
  //
  //  Gateway ÚNICO suites SOLAMENTE (D-F16-03 RECALIBRADA vinculante) —
  //  portal `ajgrup-platform.html` libre acceso sin login. Módulos hijos
  //  consumen via `obtenerSesion()` + `tienePermiso(accion, modulo)` SIN
  //  re-login propio.
  //
  //  Bridges canónicos LEGACY→NEW DESDE DISEÑO canon Sub-disciplina T11
  //  v5.124+ CANONIZADA FORMAL VINCULANTE v5.123+ EJECUTABLE 4ª manif
  //  acumulada — `migrarSesionesLegacy()` idempotente flag
  //  `aj_migracion_frente16_completada` migra 3 storage keys legacy
  //  (`aj_comercial_activo` + `aj_inmo_session` + `aj_suite_session_v2`)
  //  → `aj_session_v3`.
  //
  //  Pre-requisito Sub-frentes 16.3 v5.125 UI login canónico Finances +
  //  16.4 v5.126 UI login canónico Inmo + 16.5 v5.127 UI deprecación
  //  logins dispersos módulos seguimiento + 16.6 v5.128 UI Módulo
  //  Ajustes/Permisos + 16.7 v5.129 UI cleanup consumers cross-archivos.
  // ═══════════════════════════════════════════════════════════════════════

  // Constantes canónicas frozen
  const _SESSION_STORAGE_KEY    = 'aj_session_v3';
  const _SESSION_USERS_KEY      = 'aj_session_users_v3';
  const _SESSION_MIGRATION_FLAG = 'aj_migracion_frente16_completada';
  const _SESSION_BACKUP_PREFIX  = 'aj_sessions_backup_pre_frente16_';
  const _SESSION_DURATION_DAYS  = 30;

  const _SESSION_LEGACY_KEYS = Object.freeze([
    'aj_comercial_activo',     // slLogin LEGACY Finances (12 hits aj-finances-suite + 2 seguimiento)
    'aj_inmo_session',         // LEGACY Inmo (1 aj-inmobiliaria-suite + 4 aj-inmo-seguimiento)
    'aj_suite_session_v2'      // Login PIN canónico Sub-frente 15.5 v5.121 (18 aj-finances-suite)
  ]);

  // Canon §3.1 v5.7 — 8 roles canonizados acumulables
  const _SESSION_ROLES = Object.freeze([
    'cliente_finances',
    'comprador_inmo',
    'vendedor_inmo',
    'propietario',
    'colaborador',
    'agente_finances',
    'agente_inmo',
    'supervisor'
  ]);

  // Canon §28.2 D-F16-06 RECALIBRADA — módulos vinculantes Ajustes/Permisos matriz
  const _SESSION_MODULOS = Object.freeze([
    'seguimientos',
    'captacion',
    'colaboradores',
    'supervisor',
    'cliente_ficha',
    'hoja_pedido',
    'inbox',
    'ajustes'
  ]);

  // Canon §28.2 D-F16-06 RECALIBRADA — acciones canónicas matriz permisos
  const _SESSION_ACCIONES = Object.freeze(['ver', 'crear', 'editar', 'eliminar']);

  // Helpers privados storage
  function _sessionLeer()              { return store.get(_SESSION_STORAGE_KEY) || null; }
  function _sessionPersistir(s)        { store.set(_SESSION_STORAGE_KEY, s); }
  function _sessionLimpiar()           { store.set(_SESSION_STORAGE_KEY, null); }
  function _sessionUsersLeer()         { return store.get(_SESSION_USERS_KEY) || []; }
  function _sessionUsersPersistir(u)   { store.set(_SESSION_USERS_KEY, u); }

  /**
   * Sub-frente 16.5 v5.127 — Bridge bidireccional Capa 19 ↔ LEGACY storage keys.
   * Sincroniza sesión NEW → storage LEGACY (aj_comercial_activo + aj_inmo_session)
   * para preservar UX módulos hijos con login PIN propio LOCAL que leen LEGACY
   * (seguimiento-operaciones-aj.html + aj-inmo-seguimiento.html + N hijos cross-suite).
   *
   * Refactor hijos completo eliminación login propio LOCAL DIFERIDO Sub-frentes
   * 16.5.B + 16.5.C + 16.5.D iterativos canon §22.34.5 v5.56+ estrategia iterativa.
   *
   * Canon Sub-disciplina T11 v5.124+ FORMAL VINCULANTE EJECUTABLE refuerzo procedimental:
   * bridges bidireccionales LEGACY↔NEW canonizados DESDE DISEÑO Capa 19.
   *
   * @param {object|null} sesion - sesión NEW Capa 19 o null para clear LEGACY
   * @private
   */
  function _sessionSyncLegacyKeys(sesion) {
    try {
      if (!sesion) {
        // Logout: clear ambos LEGACY keys
        store.set('aj_comercial_activo', null);
        try { if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('aj_inmo_session'); } catch (e) {}
        return;
      }
      // Login/migration: sync sesión NEW → LEGACY shapes
      const isSup = sesion.roles && sesion.roles.indexOf('supervisor') !== -1;
      const nombre = (sesion.email || '').split('@')[0] || 'usuario';
      const legacyShape = {
        id:           sesion.userId,
        name:         nombre,
        role:         isSup ? 'supervisor' : 'agente',
        isSupervisor: isSup,
        email:        sesion.email,
        _sync_capa19: true   // marca trazabilidad bridge bidireccional
      };
      // Finances LEGACY storage
      store.set('aj_comercial_activo', legacyShape);
      // Inmo LEGACY sessionStorage (shape ligeramente distinto: initials)
      try {
        if (typeof sessionStorage !== 'undefined') {
          const inmoShape = Object.assign({}, legacyShape, {
            initials: nombre.slice(0, 2).toUpperCase()
          });
          sessionStorage.setItem('aj_inmo_session', JSON.stringify(inmoShape));
        }
      } catch (e) {}
    } catch (e) { /* swallow defensive */ }
  }

  /**
   * Sub-frente 16.5 v5.127 — Auto-import LEGACY → NEW on-demand.
   * Si sesión NEW null pero LEGACY active detectada → crea sesión NEW transparente.
   * Preserva caso usuario hace login PIN propio en hijo (seguimiento-operaciones-aj
   * o aj-inmo-seguimiento) ANTES de acceder Suite → siguiente acceso Suite consume
   * Capa 19 con sesión auto-importada desde hijo.
   * @private
   */
  function _sessionAutoImportLegacy() {
    try {
      // Verificar si hay users migrados disponibles
      const users = _sessionUsersLeer();
      if (!users || users.length === 0) return null;
      // Leer LEGACY storage
      let legacy = null;
      const ajCom = store.get('aj_comercial_activo');
      if (ajCom && (ajCom.id || ajCom.email)) legacy = ajCom;
      if (!legacy) {
        try {
          if (typeof sessionStorage !== 'undefined') {
            const inmoRaw = sessionStorage.getItem('aj_inmo_session');
            if (inmoRaw) {
              const inmoParsed = JSON.parse(inmoRaw);
              if (inmoParsed && (inmoParsed.id || inmoParsed.email)) legacy = inmoParsed;
            }
          }
        } catch (e) {}
      }
      if (!legacy) return null;
      // Buscar user migrado matching email/id
      const emailMatch = legacy.email || (legacy.id ? legacy.id + '@ajgrup.local' : null);
      if (!emailMatch) return null;
      const userMatch = users.find(function(u) { return u.email.toLowerCase() === emailMatch.toLowerCase(); });
      if (!userMatch) return null;
      // Auto-create sesión NEW desde user matched
      const ahora = new Date();
      const exp  = new Date(ahora.getTime() + _SESSION_DURATION_DAYS * 86400000);
      const sesionAuto = {
        userId:             userMatch.userId,
        email:              userMatch.email,
        roles:              userMatch.roles.slice(),
        permissions:        userMatch.permissions,
        sociedad_principal: userMatch.sociedad_principal,
        suite_origen:       userMatch.sociedad_principal,
        lastSeen:           ahora.toISOString(),
        createdAt:          ahora.toISOString(),
        expiresAt:          exp.toISOString(),
        lastPasswordChange: userMatch.lastPasswordChange,
        _auto_import_legacy: true   // marca trazabilidad bridge bidireccional
      };
      _sessionPersistir(sesionAuto);
      return sesionAuto;
    } catch (e) { return null; }
  }

  /**
   * Validación email format básica canon D-F16-04 RECALIBRADA Fase 1.
   * @param {string} email
   * @returns {boolean}
   */
  function _sessionValidarEmail(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  /**
   * Validación password length min 6 chars canon D-F16-04 RECALIBRADA Fase 1.
   * @param {string} pwd
   * @returns {boolean}
   */
  function _sessionValidarPassword(pwd) {
    return typeof pwd === 'string' && pwd.length >= 6;
  }

  /**
   * Validación rol ∈ _SESSION_ROLES canon §3.1 v5.7.
   * @param {string} rol
   * @throws Error si rol inválido
   */
  function _sessionValidarRol(rol) {
    if (_SESSION_ROLES.indexOf(rol) === -1) {
      throw new Error('[ajSession] rol inválido: "' + rol + '". Valores canon §3.1 v5.7: ' + _SESSION_ROLES.join('|'));
    }
  }

  /**
   * Generación salt aleatorio cross-platform (Node crypto.randomBytes +
   * Browser crypto.getRandomValues + fallback Math.random no-crypto).
   * @returns {string} base64 16 bytes
   */
  function _sessionGenerarSalt() {
    let bytes;
    // Node.js native crypto
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      try {
        const nodecrypto = require('crypto');
        bytes = nodecrypto.randomBytes(16);
      } catch (e) { /* fallthrough */ }
    }
    // Browser Web Crypto API
    if (!bytes && typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.getRandomValues) {
      bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
    }
    // Fallback final no-crypto (NO usar producción real — solo desarrollo)
    if (!bytes) {
      bytes = new Uint8Array(16);
      for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256);
    }
    // Convert to base64
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(bytes).toString('base64');
    }
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return typeof btoa !== 'undefined' ? btoa(binary) : binary;
  }

  /**
   * SHA-256 sync cross-platform. Node usa crypto.createHash + Browser
   * usa implementación pura JS embebida (canonical algorithm RFC 6234).
   * Fase 1 vinculante canon D-F16-02 — migrable PBKDF2 Web Crypto API
   * async Fase 2 backend.
   * @param {string} input
   * @returns {string} hex 64 chars
   */
  function _sessionSha256(input) {
    // Node.js native crypto sync
    if (typeof process !== 'undefined' && process.versions && process.versions.node) {
      try {
        const nodecrypto = require('crypto');
        return nodecrypto.createHash('sha256').update(input, 'utf8').digest('hex');
      } catch (e) { /* fallthrough */ }
    }
    // Browser fallback: SHA-256 pure JS implementation
    return _sessionSha256PureJS(input);
  }

  /**
   * SHA-256 puro JS canonical algorithm RFC 6234 — cross-platform sync
   * fallback para browser sin Node crypto. Embeded ~55L Fase 1.
   * @private
   */
  function _sessionSha256PureJS(message) {
    const K = [
      0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
      0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
      0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
      0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
      0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
      0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
      0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
      0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ];
    let H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    // UTF-8 encode
    const bytes = [];
    for (let i = 0; i < message.length; i++) {
      let c = message.charCodeAt(i);
      if (c < 0x80) bytes.push(c);
      else if (c < 0x800) { bytes.push(0xc0 | (c >> 6)); bytes.push(0x80 | (c & 0x3f)); }
      else if (c < 0xd800 || c >= 0xe000) { bytes.push(0xe0 | (c >> 12)); bytes.push(0x80 | ((c >> 6) & 0x3f)); bytes.push(0x80 | (c & 0x3f)); }
      else { i++; c = 0x10000 + (((c & 0x3ff) << 10) | (message.charCodeAt(i) & 0x3ff)); bytes.push(0xf0 | (c >> 18)); bytes.push(0x80 | ((c >> 12) & 0x3f)); bytes.push(0x80 | ((c >> 6) & 0x3f)); bytes.push(0x80 | (c & 0x3f)); }
    }
    // Pad
    const bitlen = bytes.length * 8;
    bytes.push(0x80);
    while ((bytes.length % 64) !== 56) bytes.push(0);
    // Append length 64-bit big-endian (assumes message < 2^32 bits — sufficient Fase 1)
    bytes.push(0, 0, 0, 0, (bitlen >>> 24) & 0xff, (bitlen >>> 16) & 0xff, (bitlen >>> 8) & 0xff, bitlen & 0xff);
    // Process 512-bit chunks
    function rotr(n, x) { return ((x >>> n) | (x << (32 - n))) >>> 0; }
    function add(a, b) { return ((a + b) & 0xFFFFFFFF) >>> 0; }
    for (let chunk = 0; chunk < bytes.length; chunk += 64) {
      const W = new Array(64);
      for (let i = 0; i < 16; i++) {
        W[i] = ((bytes[chunk + i * 4] << 24) | (bytes[chunk + i * 4 + 1] << 16) | (bytes[chunk + i * 4 + 2] << 8) | bytes[chunk + i * 4 + 3]) >>> 0;
      }
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(7, W[i - 15]) ^ rotr(18, W[i - 15]) ^ (W[i - 15] >>> 3);
        const s1 = rotr(17, W[i - 2]) ^ rotr(19, W[i - 2]) ^ (W[i - 2] >>> 10);
        W[i] = add(add(add(W[i - 16], s0), W[i - 7]), s1);
      }
      let a = H[0], b = H[1], c = H[2], d = H[3], e = H[4], f = H[5], g = H[6], h = H[7];
      for (let i = 0; i < 64; i++) {
        const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
        const ch = (e & f) ^ ((~e >>> 0) & g);
        const t1 = add(add(add(add(h, S1), ch), K[i]), W[i]);
        const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
        const mj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = add(S0, mj);
        h = g; g = f; f = e; e = add(d, t1); d = c; c = b; b = a; a = add(t1, t2);
      }
      H[0] = add(H[0], a); H[1] = add(H[1], b); H[2] = add(H[2], c); H[3] = add(H[3], d);
      H[4] = add(H[4], e); H[5] = add(H[5], f); H[6] = add(H[6], g); H[7] = add(H[7], h);
    }
    return H.map(function(x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }).join('');
  }

  /**
   * Permissions default por rol canon §28.2 D-F16-06 RECALIBRADA.
   * Supervisor full access + agentes según sociedad + admin override.
   * @private
   */
  function _sessionPermissionsDefaultPorRoles(roles) {
    const esSupervisor = roles.indexOf('supervisor') !== -1;
    const esAgenteFin = roles.indexOf('agente_finances') !== -1;
    const esAgenteInmo = roles.indexOf('agente_inmo') !== -1;
    const perms = {};
    _SESSION_MODULOS.forEach(function(modulo) {
      perms[modulo] = {};
      _SESSION_ACCIONES.forEach(function(accion) {
        if (esSupervisor) {
          perms[modulo][accion] = true;
        } else if (modulo === 'ajustes') {
          perms[modulo][accion] = false;
        } else if (modulo === 'supervisor') {
          perms[modulo][accion] = false;
        } else if (esAgenteFin || esAgenteInmo) {
          perms[modulo][accion] = (accion !== 'eliminar');
        } else {
          perms[modulo][accion] = (accion === 'ver');
        }
      });
    });
    return perms;
  }

  /**
   * Determinar sociedad principal por rol.
   * @private
   */
  function _sessionSociedadPorRoles(roles) {
    if (roles.indexOf('agente_finances') !== -1 && roles.indexOf('agente_inmo') !== -1) return 'ambas';
    if (roles.indexOf('agente_finances') !== -1) return 'finances';
    if (roles.indexOf('agente_inmo') !== -1) return 'inmo';
    if (roles.indexOf('supervisor') !== -1) return 'ambas';
    return 'ambas';
  }

  /**
   * Login canónico ÚNICO email+password canon D-F16-04 RECALIBRADA.
   * Verifica email + password contra _SESSION_USERS_KEY + crea sesión
   * en _SESSION_STORAGE_KEY con expiresAt = now + 30 días.
   * @param {string} email
   * @param {string} password
   * @param {object} [opciones] {suite_origen?: 'finances'|'inmo'}
   * @returns {{sesion: object|null, error: string|null}}
   */
  function sessionLogin(email, password, opciones) {
    opciones = opciones || {};
    if (!_sessionValidarEmail(email)) return { sesion: null, error: 'email inválido' };
    if (!_sessionValidarPassword(password)) return { sesion: null, error: 'password inválido (min 6 chars)' };
    const users = _sessionUsersLeer();
    const user = users.find(function(u) { return u.email.toLowerCase() === email.toLowerCase(); });
    if (!user) return { sesion: null, error: 'credenciales inválidas' };
    const hashIntento = _sessionSha256(password + user.salt);
    if (hashIntento !== user.passwordHash) return { sesion: null, error: 'credenciales inválidas' };
    const now = new Date();
    const expiresAt = new Date(now.getTime() + _SESSION_DURATION_DAYS * 86400000);
    const sesion = {
      userId: user.userId,
      email: user.email,
      roles: user.roles.slice(),
      permissions: user.permissions || _sessionPermissionsDefaultPorRoles(user.roles),
      sociedad_principal: user.sociedad_principal || _sessionSociedadPorRoles(user.roles),
      suite_origen: opciones.suite_origen || user.sociedad_principal || 'finances',
      lastSeen: now.toISOString(),
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      lastPasswordChange: user.lastPasswordChange || user.createdAt || now.toISOString()
    };
    _sessionPersistir(sesion);
    // Sub-frente 16.5 v5.127 — Bridge bidireccional Capa 19 → LEGACY sync hijos
    _sessionSyncLegacyKeys(sesion);
    return { sesion: sesion, error: null };
  }

  /**
   * Logout canónico — limpia _SESSION_STORAGE_KEY + LEGACY keys bidireccional.
   */
  function sessionLogout() {
    _sessionLimpiar();
    // Sub-frente 16.5 v5.127 — Bridge bidireccional Capa 19 → LEGACY cleanup hijos
    _sessionSyncLegacyKeys(null);
  }

  /**
   * Obtener sesión actual + validar expiresAt. Si expirada, limpia + retorna null.
   * Sub-frente 16.5 v5.127 — Auto-import LEGACY → NEW si sesión NEW null pero LEGACY active
   * (preserva caso usuario login PIN hijo propio ANTES acceder Suite Capa 19).
   * @returns {object|null}
   */
  function sessionObtenerSesion() {
    const s = _sessionLeer();
    if (!s) {
      // Sub-frente 16.5 v5.127 — Bridge bidireccional auto-import LEGACY → NEW
      return _sessionAutoImportLegacy();
    }
    if (s.expiresAt && new Date(s.expiresAt).getTime() < Date.now()) {
      _sessionLimpiar();
      _sessionSyncLegacyKeys(null);
      return null;
    }
    return s;
  }

  /**
   * Verifica permiso granular acción × módulo. Lee sesión + consulta
   * permissions matriz. Supervisor full override true.
   * @param {string} accion ∈ _SESSION_ACCIONES
   * @param {string} modulo ∈ _SESSION_MODULOS
   * @returns {boolean}
   */
  function sessionTienePermiso(accion, modulo) {
    const s = sessionObtenerSesion();
    if (!s) return false;
    if (s.roles && s.roles.indexOf('supervisor') !== -1) return true;
    if (!s.permissions || !s.permissions[modulo]) return false;
    return s.permissions[modulo][accion] === true;
  }

  /**
   * Sub-frente 16.7 v5.132 — Obtener sesión actual en shape compat LEGACY.
   * Retorna sesión NEW Capa 19 adaptada a shape LEGACY compat para consumers
   * cross-archivos (id + name + role + isSupervisor + email).
   *
   * Permite refactor incremental priority read consumers hijos cross-archivos:
   *   var session = AJ.session.obtenerSesionCompat() || JSON.parse(localStorage.getItem('aj_comercial_activo') || 'null');
   *
   * @returns {{id, name, role, isSupervisor, email}|null}
   */
  function sessionObtenerSesionCompat() {
    const s = sessionObtenerSesion();
    if (!s) return null;
    const isSup = s.roles && s.roles.indexOf('supervisor') !== -1;
    return {
      id:           s.userId,
      name:         (s.email || '').split('@')[0] || 'usuario',
      role:         isSup ? 'supervisor' : 'agente',
      isSupervisor: isSup,
      email:        s.email
    };
  }

  /**
   * Verifica rol específico en sesión actual.
   * @param {string} rol
   * @returns {boolean}
   */
  function sessionTieneRol(rol) {
    const s = sessionObtenerSesion();
    if (!s || !s.roles) return false;
    return s.roles.indexOf(rol) !== -1;
  }

  /**
   * Atajo supervisor canon §8 v4.1 admin/comercial — retorna true si
   * sesión activa con rol supervisor.
   * @returns {boolean}
   */
  function sessionEsAdmin() {
    return sessionTieneRol('supervisor');
  }

  /**
   * Cambiar password propio sesión actual. Verifica viejaPwd + actualiza
   * passwordHash + salt + lastPasswordChange.
   * @param {string} viejaPwd
   * @param {string} nuevaPwd
   * @returns {{ok: boolean, error: string|null}}
   */
  function sessionCambiarPassword(viejaPwd, nuevaPwd) {
    const s = sessionObtenerSesion();
    if (!s) return { ok: false, error: 'sin sesión activa' };
    if (!_sessionValidarPassword(nuevaPwd)) return { ok: false, error: 'password nueva inválida (min 6 chars)' };
    const users = _sessionUsersLeer();
    const userIdx = users.findIndex(function(u) { return u.userId === s.userId; });
    if (userIdx === -1) return { ok: false, error: 'usuario no encontrado' };
    const user = users[userIdx];
    if (_sessionSha256(viejaPwd + user.salt) !== user.passwordHash) return { ok: false, error: 'password actual incorrecta' };
    const nuevoSalt = _sessionGenerarSalt();
    const nuevoHash = _sessionSha256(nuevaPwd + nuevoSalt);
    const now = new Date().toISOString();
    user.passwordHash = nuevoHash;
    user.salt = nuevoSalt;
    user.lastPasswordChange = now;
    users[userIdx] = user;
    _sessionUsersPersistir(users);
    // Actualizar sesión activa
    s.lastPasswordChange = now;
    _sessionPersistir(s);
    return { ok: true, error: null };
  }

  /**
   * Crear usuario nuevo canon D-F16-06 RECALIBRADA admin-only Ajustes.
   * Valida unicidad email + valida roles + genera salt + hash.
   * @param {object} datos {email, password, roles[], sociedad_principal?, permissions?, userId?}
   * @returns {{usuario: object|null, error: string|null}}
   */
  function sessionCrearUsuario(datos) {
    if (!datos || typeof datos !== 'object') return { usuario: null, error: 'datos requeridos' };
    if (!_sessionValidarEmail(datos.email)) return { usuario: null, error: 'email inválido' };
    if (!_sessionValidarPassword(datos.password)) return { usuario: null, error: 'password inválido (min 6 chars)' };
    if (!Array.isArray(datos.roles) || datos.roles.length === 0) return { usuario: null, error: 'roles[] requerido (≥1)' };
    datos.roles.forEach(_sessionValidarRol);
    const users = _sessionUsersLeer();
    const duplicate = users.find(function(u) { return u.email.toLowerCase() === datos.email.toLowerCase(); });
    if (duplicate) return { usuario: null, error: 'email ya registrado' };
    const salt = _sessionGenerarSalt();
    const passwordHash = _sessionSha256(datos.password + salt);
    const now = new Date().toISOString();
    const userId = datos.userId || ('AJ-U-' + String(users.length + 1).padStart(3, '0'));
    const user = {
      userId: userId,
      email: datos.email,
      passwordHash: passwordHash,
      salt: salt,
      roles: datos.roles.slice(),
      permissions: datos.permissions || _sessionPermissionsDefaultPorRoles(datos.roles),
      sociedad_principal: datos.sociedad_principal || _sessionSociedadPorRoles(datos.roles),
      createdAt: now,
      lastPasswordChange: now
    };
    users.push(user);
    _sessionUsersPersistir(users);
    return { usuario: user, error: null };
  }

  /**
   * Actualizar usuario admin-only. Permite cambios roles + permissions +
   * sociedad_principal + email. Para cambiar password usar
   * sessionCambiarPassword (requiere viejaPwd).
   * @param {string} userId
   * @param {object} cambios {email?, roles?, permissions?, sociedad_principal?}
   * @returns {{usuario: object|null, error: string|null}}
   */
  function sessionActualizarUsuario(userId, cambios) {
    const users = _sessionUsersLeer();
    const idx = users.findIndex(function(u) { return u.userId === userId; });
    if (idx === -1) return { usuario: null, error: 'usuario no encontrado' };
    const PROHIBIDOS = ['userId', 'passwordHash', 'salt', 'createdAt', 'lastPasswordChange'];
    const cambiosAplicables = {};
    Object.keys(cambios || {}).forEach(function(k) {
      if (PROHIBIDOS.indexOf(k) !== -1) {
        throw new Error('[ajSession] campo prohibido en actualizarUsuario: "' + k + '". Usar cambiarPassword para password/salt.');
      }
      cambiosAplicables[k] = cambios[k];
    });
    if (cambiosAplicables.email && !_sessionValidarEmail(cambiosAplicables.email)) {
      return { usuario: null, error: 'email inválido' };
    }
    if (cambiosAplicables.roles) {
      if (!Array.isArray(cambiosAplicables.roles) || cambiosAplicables.roles.length === 0) {
        return { usuario: null, error: 'roles[] requerido (≥1)' };
      }
      cambiosAplicables.roles.forEach(_sessionValidarRol);
    }
    const user = users[idx];
    Object.keys(cambiosAplicables).forEach(function(k) { user[k] = cambiosAplicables[k]; });
    users[idx] = user;
    _sessionUsersPersistir(users);
    return { usuario: user, error: null };
  }

  /**
   * Eliminar usuario admin-only. NO permite eliminar último supervisor
   * (canon §8 v4.1 + protección sistema).
   * @param {string} userId
   * @returns {{ok: boolean, error: string|null}}
   */
  function sessionEliminarUsuario(userId) {
    const users = _sessionUsersLeer();
    const idx = users.findIndex(function(u) { return u.userId === userId; });
    if (idx === -1) return { ok: false, error: 'usuario no encontrado' };
    const user = users[idx];
    if (user.roles.indexOf('supervisor') !== -1) {
      const supervisores = users.filter(function(u) { return u.roles.indexOf('supervisor') !== -1; });
      if (supervisores.length === 1) {
        return { ok: false, error: 'no se puede eliminar último supervisor' };
      }
    }
    users.splice(idx, 1);
    _sessionUsersPersistir(users);
    return { ok: true, error: null };
  }

  /**
   * Listar usuarios admin-only (sin passwordHash + salt — proyección segura).
   * @returns {Array<{userId, email, roles, sociedad_principal, createdAt, lastPasswordChange}>}
   */
  function sessionListarUsuarios() {
    const users = _sessionUsersLeer();
    return users.map(function(u) {
      return {
        userId: u.userId,
        email: u.email,
        roles: u.roles.slice(),
        sociedad_principal: u.sociedad_principal,
        createdAt: u.createdAt,
        lastPasswordChange: u.lastPasswordChange
      };
    });
  }

  /**
   * Migración cross-archivos LEGACY → NEW canon Sub-disciplina T11 v5.124+
   * CANONIZADA FORMAL VINCULANTE v5.123+ EJECUTABLE 4ª manif acumulada.
   * Idempotente vía flag _SESSION_MIGRATION_FLAG. Backup explícito
   * pre-migración _SESSION_BACKUP_PREFIX + YYYYMMDD por cada storage key
   * legacy con datos. NO crea sesión activa (sólo migra users).
   * @returns {{migrados: number, omitidos: number, errores: number, backup_keys: string[]}}
   */
  function sessionMigrarSesionesLegacy() {
    const flag = store.get(_SESSION_MIGRATION_FLAG);
    if (flag === true) return { migrados: 0, omitidos: 0, errores: 0, backup_keys: [] };
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const backup_keys = [];
    let migrados = 0, omitidos = 0, errores = 0;
    const users = _sessionUsersLeer();
    _SESSION_LEGACY_KEYS.forEach(function(key) {
      try {
        const legacy = store.get(key);
        if (!legacy) { omitidos++; return; }
        // Backup explícito antes de tocar
        const backupKey = _SESSION_BACKUP_PREFIX + today + '__' + key;
        store.set(backupKey, legacy);
        backup_keys.push(backupKey);
        // Extraer datos legacy heurística
        const nombreLegacy = legacy.name || legacy.nombre || legacy.id || 'usuario_legacy_' + key;
        const rolLegacy = legacy.role === 'supervisor' || legacy.isSupervisor === true
                          ? ['supervisor', key.indexOf('inmo') !== -1 ? 'agente_inmo' : 'agente_finances']
                          : (key.indexOf('inmo') !== -1 ? ['agente_inmo'] : ['agente_finances']);
        const emailLegacy = legacy.email || (legacy.id ? legacy.id + '@ajgrup.local' : nombreLegacy.toLowerCase().replace(/\s+/g, '.') + '@ajgrup.local');
        // Verificar duplicado cross-keys legacy
        const existe = users.find(function(u) { return u.email.toLowerCase() === emailLegacy.toLowerCase(); });
        if (existe) { omitidos++; return; }
        // Crear placeholder user con password temporal canónico (debe cambiarse en primer login)
        const passwordTemporal = 'cambiar123';
        const salt = _sessionGenerarSalt();
        const passwordHash = _sessionSha256(passwordTemporal + salt);
        const now = new Date().toISOString();
        users.push({
          userId: 'AJ-U-' + String(users.length + 1).padStart(3, '0'),
          email: emailLegacy,
          passwordHash: passwordHash,
          salt: salt,
          roles: rolLegacy,
          permissions: _sessionPermissionsDefaultPorRoles(rolLegacy),
          sociedad_principal: _sessionSociedadPorRoles(rolLegacy),
          createdAt: now,
          lastPasswordChange: now,
          _migradoDe: key,
          _nombreLegacy: nombreLegacy
        });
        migrados++;
      } catch (e) {
        errores++;
      }
    });
    if (migrados > 0) _sessionUsersPersistir(users);
    store.set(_SESSION_MIGRATION_FLAG, true);

    // HOTFIX-PROACTIVO embebido pre-push Sub-frente 16.3.1 v5.125.1 — canon Sub-disciplina v5.71+
    // FORMAL VINCULANTE EJECUTABLE 12ª manif acumulada hotfix proactivo embebido pre-commit Chrome MCP
    // T10 ENDURECIDA + canon Sub-disciplina T11 v5.124+ FORMAL VINCULANTE EJECUTABLE refuerzo DESDE DISEÑO
    //
    // Auto-login post-migración si LEGACY active session detectada — preserva UX cross-migración:
    // usuario logueado en LEGACY NO requiere re-login manual + descubrir credenciales migradas +
    // password temporal "cambiar123" canon. Tras refresh página post-deploy v5.125, migración auto
    // crea sesión activa NEW para user migrado → loadDashGrid lee Capa 19 supervisor → renderiza
    // 6 cards supervisor view directamente (resuelve T10 ENDURECIDA Jonatan "no salen Colaboradores
    // ni Supervisor" cazado empíricamente Sub-frente 16.3 v5.125 post-push reporte verbal Capa 1).
    if (migrados > 0 && !_sessionLeer()) {
      const ultimoMigrado = users[users.length - 1];
      if (ultimoMigrado && ultimoMigrado._migradoDe) {
        const ahora = new Date();
        const exp  = new Date(ahora.getTime() + _SESSION_DURATION_DAYS * 86400000);
        const sesionAuto = {
          userId:             ultimoMigrado.userId,
          email:              ultimoMigrado.email,
          roles:              ultimoMigrado.roles.slice(),
          permissions:        ultimoMigrado.permissions,
          sociedad_principal: ultimoMigrado.sociedad_principal,
          suite_origen:       ultimoMigrado.sociedad_principal,
          lastSeen:           ahora.toISOString(),
          createdAt:          ahora.toISOString(),
          expiresAt:          exp.toISOString(),
          lastPasswordChange: ultimoMigrado.lastPasswordChange,
          _auto_login_legacy: true   // marca trazabilidad migración auto
        };
        _sessionPersistir(sesionAuto);
        // Sub-frente 16.5 v5.127 — Bridge bidireccional sync LEGACY post-auto-login migración
        _sessionSyncLegacyKeys(sesionAuto);
      }
    }

    return { migrados: migrados, omitidos: omitidos, errores: errores, backup_keys: backup_keys };
  }


  /**
   * Surface API pública Capa 19 AJ.session.
   */
  const session = {
    login:                sessionLogin,
    logout:               sessionLogout,
    obtenerSesion:        sessionObtenerSesion,
    obtenerSesionCompat:  sessionObtenerSesionCompat,   // Sub-frente 16.7 v5.132 — shape compat LEGACY consumers cross-archivos
    tienePermiso:         sessionTienePermiso,
    tieneRol:             sessionTieneRol,
    esAdmin:              sessionEsAdmin,
    cambiarPassword:      sessionCambiarPassword,
    crearUsuario:         sessionCrearUsuario,
    actualizarUsuario:    sessionActualizarUsuario,
    eliminarUsuario:      sessionEliminarUsuario,
    listarUsuarios:       sessionListarUsuarios,
    migrarSesionesLegacy: sessionMigrarSesionesLegacy,

    ROLES:                _SESSION_ROLES,
    MODULOS:              _SESSION_MODULOS,
    ACCIONES:             _SESSION_ACCIONES,
    STORAGE_KEY:          _SESSION_STORAGE_KEY,
    USERS_KEY:            _SESSION_USERS_KEY,
    LEGACY_KEYS:          _SESSION_LEGACY_KEYS,
    MIGRATION_FLAG:       _SESSION_MIGRATION_FLAG
  };


  /**
   * Surface API pública Capa 18 AJ.inbox.
   */
  const inbox = {
    crear:                inboxCrear,
    obtener:              inboxObtener,
    listar:               inboxListar,
    actualizar:           inboxActualizar,
    softDelete:           inboxSoftDelete,
    cambiarEstado:        inboxCambiarEstado,
    validarTransicion:    inboxValidarTransicion,
    convertirAPersona:    inboxConvertirAPersona,
    migrarFrente10:       inboxMigrarFrente10,

    CANALES:              _INBOX_CANALES,
    ESTADOS:              _INBOX_ESTADOS,
    MOTIVOS_DESCARTE:     _INBOX_MOTIVOS_DESCARTE,
    SUITE_DESTINOS:       _INBOX_SUITE_DESTINOS,  // D-F10-08 RECALIBRADA v5.105 polimórfico ['inmo', 'finances'] canon cross-suite vinculante
    TIPOS_DEMANDA:        _INBOX_TIPOS_DEMANDA    // NUEVO v5.113 canon §26.3 + §26.14.2 D Opción (β3) Híbrido vinculante v2.20.0
  };


  // ═══════════════════════════════════════════════════════════════════════
  //  Exposición global
  //  Un único objeto `AJ` en window/global. Las capas futuras canonizadas
  //  en CLAUDE.md §12.4 (sociedades, nav, i18n) se añadirán aquí en
  //  sesiones posteriores.
  // ═══════════════════════════════════════════════════════════════════════

  global.AJ = {
    theme:        theme,
    store:        store,
    format:       format,
    id:           id,
    rappel:       rappel,
    personas:     personas,
    seguimientos: seguimientos,   // NUEVO Frente 5 §16.6 — Sub-frente 5.2.B
    captacion:    captacion,      // NUEVO Frente 6 §17 — Sub-frente 6.2 Sesión código 1 [v2.5.0]
    pedidos:       pedidos,        // NUEVO Frente 8 §20 — Sub-frente 8.3 [v2.8.0]
    propiedades:   propiedades,    // NUEVO Frente 4 §15.2 — Sub-frente 4.2 Parte B [v2.10.0]
    titularidades: titularidades,  // NUEVO Frente 4 §15.3 — Sub-frente 4.2 Parte C [v2.11.0]
    opsInmo:       opsInmo,        // NUEVO Frente 4 §15.8 — Sub-frente 4.5 Sesión 2 [v2.13.0]
    fincas:        fincas,         // NUEVO Frente 12 §25.3 — Sub-frente 12.2 Capa 9b [v2.18.0]
    agentesIA:        agentesIA,        // NUEVO Frente 14 §24 — Sub-frente 14.2 Capa 16 [v2.17.0]
    conversacionesIA: conversacionesIA, // NUEVO Frente 14 §24 — Sub-frente 14.2 Capa 17 [v2.17.0]
    inbox:            inbox,            // NUEVO Frente 10 §26 — Sub-frente 10.2 Capa 18 [v2.19.0]
    session:          session            // NUEVO Frente 16 §28 — Sub-frente 16.2 Capa 19 [v2.21.0]
  };

})(typeof window !== 'undefined' ? window : global);
