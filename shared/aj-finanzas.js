/* ═══════════════════════════════════════════════════════════════════════════
   AJ GRUP CRM · OLA R1 — AJ.finanzas v1.0.1 (motor de cálculo hipotecario)

   Las fórmulas que mueven dinero, en UN solo sitio y con tests. Rescatadas de
   los simuladores de la era dorada (simulador-hipotecario-aj-v4, comparador-
   ofertas-aj, simulador-ahorro-amortizacion-aj, rentabilidad-hipoteca-v2) y
   usadas por: aj-finances-estudio · aj-calc-amortizacion · aj-calc-rentabilidad.

   Convención: los importes ENTRAN y SALEN en céntimos (canon Base B), salvo
   los porcentajes y los años. Sistema francés de amortización.
   ═══════════════════════════════════════════════════════════════════════════ */
(function (global) {
  'use strict';

  function num(v){ v = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(v) ? v : 0; }

  /* TIN efectivo del préstamo.
     fijo      → el TIN del tramo fijo
     variable  → euríbor + diferencial
     mixta     → media ponderada por años de cada tramo (lo que hace el banco) */
  function tinEfectivo(o){
    o = o || {};
    if (o.tipo === 'fijo')     return num(o.tinFijo);
    if (o.tipo === 'variable') return num(o.euribor) + num(o.diferencial);
    var total = num(o.plazoAnios) || 1;
    var fijos = Math.min(num(o.aniosFijo), total);
    return (num(o.tinFijo) * fijos + (num(o.euribor) + num(o.diferencial)) * (total - fijos)) / total;
  }

  /* Cuota mensual (sistema francés) en céntimos. */
  function cuotaMensual(capitalCents, tinPct, plazoAnios){
    var C = num(capitalCents) / 100, i = num(tinPct) / 100 / 12, N = Math.round(num(plazoAnios) * 12);
    if (!C || !N) return 0;
    if (i <= 0) return Math.round(C / N * 100);
    return Math.round(C * i / (1 - Math.pow(1 + i, -N)) * 100);
  }

  /* Intereses totales del préstamo (céntimos). */
  function interesesTotales(capitalCents, tinPct, plazoAnios){
    var cuota = cuotaMensual(capitalCents, tinPct, plazoAnios);
    return Math.max(0, cuota * Math.round(num(plazoAnios) * 12) - num(capitalCents));
  }

  /* ITP por comprador: cada uno paga su % del precio según su participación. */
  function itpTotal(pvpCents, compradores){
    return (compradores || []).reduce(function (t, c) {
      return t + Math.round(num(pvpCents) * (num(c.participacion_pct) / 100) * (num(c.itp_pct) / 100));
    }, 0);
  }

  /* Ahorro que el cliente necesita tener: entrada + gastos − lo ya entregado. */
  function ahorroNecesario(o){
    o = o || {};
    var entrada = Math.max(0, num(o.pvpCents) - num(o.hipotecaCents));
    var yaPagado = num(o.arrasCents) + num(o.reservaCents) + num(o.gastosAbonadosCents);
    return Math.max(0, entrada + num(o.gastosCents) - yaPagado);
  }

  /* Ratio de endeudamiento (%) sobre ingresos del hogar. */
  function ratioEndeudamiento(cuotaCents, prestamosCents, ingresosCents){
    var ing = num(ingresosCents);
    return ing ? (num(cuotaCents) + num(prestamosCents)) / ing * 100 : 0;
  }

  /* Cuadro de amortización anual (los N primeros años). */
  function cuadroAnual(capitalCents, tinPct, plazoAnios, anios){
    var pend = num(capitalCents) / 100, i = num(tinPct) / 100 / 12;
    var cuota = cuotaMensual(capitalCents, tinPct, plazoAnios) / 100;
    var filas = [], tope = Math.min(num(anios) || num(plazoAnios), num(plazoAnios));
    for (var a = 1; a <= tope; a++){
      var cap = 0, int = 0;
      for (var m = 0; m < 12 && pend > 0.01; m++){
        var ii = pend * i, cc = Math.min(cuota - ii, pend);
        int += ii; cap += cc; pend -= cc;
      }
      filas.push({ anio:a, cuotaAnual:Math.round(cuota * 12 * 100), capital:Math.round(cap * 100),
                   intereses:Math.round(int * 100), pendiente:Math.round(Math.max(0, pend) * 100) });
    }
    return filas;
  }

  /* ── Comparador de ofertas: lo que de verdad cuesta cada oferta ────────── */
  function evaluarOferta(o){
    o = o || {};
    // tres formas de oferta: mixta (tramo fijo + variable), fija pura y variable pura.
    // Ojo: una oferta FIJA no trae euríbor ni diferencial — si se cae a esa rama, el TIN sale 0.
    var base = (num(o.aniosFijo) > 0 && o.tinFijo != null)
      ? tinEfectivo({ tipo:'mixta', tinFijo:o.tinFijo, aniosFijo:o.aniosFijo, euribor:o.euribor,
                      diferencial:o.diferencial, plazoAnios:o.plazoAnios })
      : (o.tinFijo != null ? num(o.tinFijo) : num(o.euribor) + num(o.diferencial));
    var vinc = o.vinculaciones || [];
    var bonif = vinc.reduce(function (t, v){ return t + num(v.bonif_tin); }, 0);
    var costeAnual = vinc.reduce(function (t, v){ return t + num(v.coste_anual_cents); }, 0);
    var tinBon = Math.max(0, base - bonif);
    var meses = Math.round(num(o.plazoAnios) * 12);
    var cuotaCon = cuotaMensual(o.capitalCents, tinBon, o.plazoAnios);
    var costeVinc = Math.round(costeAnual * num(o.plazoAnios));
    var apertura = Math.round(num(o.aperturaCents) + num(o.capitalCents) * num(o.aperturaPct) / 100);
    var intereses = Math.max(0, cuotaCon * meses - num(o.capitalCents));
    return {
      tinBase: base, tinBonificado: tinBon,
      cuotaSinVinculaciones: cuotaMensual(o.capitalCents, base, o.plazoAnios),
      cuotaConVinculaciones: cuotaCon,
      costeVinculaciones: costeVinc, apertura: apertura, intereses: intereses,
      costeTotal: num(o.capitalCents) + intereses + costeVinc + apertura,
      cuotaReal: meses ? Math.round((cuotaCon * meses + costeVinc + apertura) / meses) : 0
    };
  }

  /* ── Plan de ahorro + amortización anticipada ──────────────────────────── */

  /* Valor futuro de aportar A €/mes durante D años a rentabilidad r % anual. */
  function futuroAhorro(aportacionCents, anios, rentAnualPct){
    var A = num(aportacionCents), i = num(rentAnualPct) / 100 / 12, N = Math.round(num(anios) * 12);
    if (!A || !N) return 0;
    return Math.round(i <= 0 ? A * N : A * ((Math.pow(1 + i, N) - 1) / i));
  }

  /* Simula la hipoteca aplicando cada tramo de ahorro al terminar su periodo.
     tramos: [{ aportacionCents, anios, destino:'plazo'|'cuota' }] (uno tras otro). */
  function simularPlan(h, tramos, rentAnualPct){
    h = h || {}; tramos = tramos || [];
    var i = num(h.tinPct) / 100 / 12;
    var mesesTot = Math.round(num(h.plazoAnios) * 12);
    var cuotaIni = cuotaMensual(h.pendienteCents, h.tinPct, h.plazoAnios);
    var pend = num(h.pendienteCents), cuota = cuotaIni;
    var intereses = 0, mes = 0, aportado = 0, rendimientos = 0, comisiones = 0, eventos = [];
    var acum = 0;
    var plan = tramos.map(function (t){ acum += Math.round(num(t.anios) * 12); return { t:t, mesFin:acum }; });
    var tope = mesesTot + 240;
    while (pend > 1 && mes < tope){
      mes++;
      var int = pend * i;
      if (cuota <= int) break;                       // guardia: cuota que no cubre intereses
      var cap = Math.min(cuota - int, pend);
      intereses += int; pend -= cap;
      for (var k = 0; k < plan.length; k++){
        var p = plan[k];
        if (p.mesFin === mes && pend > 1){
          var fv = futuroAhorro(p.t.aportacionCents, p.t.anios, rentAnualPct);
          var apo = num(p.t.aportacionCents) * Math.round(num(p.t.anios) * 12);
          aportado += apo; rendimientos += Math.max(0, fv - apo);
          var com = Math.round(fv * num(h.comisionPct) / 100);
          comisiones += com;
          var amortiza = Math.min(Math.max(0, fv - com), pend);
          pend -= amortiza;
          if (p.t.destino === 'cuota' && pend > 1){
            var restantes = Math.max(1, mesesTot - mes);
            cuota = cuotaMensual(Math.round(pend), h.tinPct, restantes / 12);
          }
          eventos.push({ mes:mes, capital:fv, comision:com, amortizado:amortiza,
                         destino:p.t.destino, pendiente:Math.round(pend) });
        }
      }
    }
    return { meses:mes, intereses:Math.round(intereses), cuotaInicial:cuotaIni,
             cuotaFinal:Math.round(cuota), aportado:aportado,
             rendimientos:Math.round(rendimientos), comisiones:comisiones, eventos:eventos };
  }

  /* ── Rentabilidad de inversión con hipoteca ────────────────────────────── */
  function rentabilidad(d){
    d = d || {};
    var precio = num(d.precioCents), alqAnual = num(d.alquilerMesCents) * 12;
    var hipoteca = Math.round(precio * num(d.ltvPct) / 100);
    var entrada = precio - hipoteca;
    var cuota = cuotaMensual(hipoteca, d.tinPct, d.plazoAnios);
    var i = num(d.tinPct) / 100 / 12, pend = hipoteca, int1 = 0;
    for (var m = 0; m < 12 && pend > 0; m++){ var ii = pend * i; int1 += ii; pend -= Math.max(0, cuota - ii); }
    int1 = Math.round(int1);
    var impuestos = Math.round(precio * num(d.impuestosPct) / 100);
    var gastosAdq = impuestos + num(d.provisionCents) + num(d.tasacionCents) + num(d.honorariosCents);
    var gastosMes = num(d.gastosMesCents);
    var fondosPropios = entrada + gastosAdq;
    var netoAnual = alqAnual - gastosMes * 12 - int1;
    return {
      hipoteca:hipoteca, entrada:entrada, cuota:cuota,
      interesesTotales:interesesTotales(hipoteca, d.tinPct, d.plazoAnios),
      interesesPrimerAnio:int1, impuestos:impuestos, gastosAdquisicion:gastosAdq,
      fondosPropios:fondosPropios, netoAnual:Math.round(netoAnual),
      cashflowMes:Math.round(num(d.alquilerMesCents) - gastosMes - cuota),
      brutaPct: precio ? alqAnual / precio * 100 : 0,
      netaPct: fondosPropios ? netoAnual / fondosPropios * 100 : 0
    };
  }

  var API = { version:'1.0.0', num:num, tinEfectivo:tinEfectivo, cuotaMensual:cuotaMensual,
    interesesTotales:interesesTotales, itpTotal:itpTotal, ahorroNecesario:ahorroNecesario,
    ratioEndeudamiento:ratioEndeudamiento, cuadroAnual:cuadroAnual, evaluarOferta:evaluarOferta,
    futuroAhorro:futuroAhorro, simularPlan:simularPlan, rentabilidad:rentabilidad };

  global.AJ = global.AJ || {};
  global.AJ.finanzas = API;
})(typeof globalThis !== 'undefined' ? globalThis : this);
