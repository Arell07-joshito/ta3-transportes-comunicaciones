/* script.js — lógica e interactividad de la presentación (sin librerías externas) */
"use strict";

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const fmt = (n, d = 0) => (n == null || isNaN(n)) ? "–" : Number(n).toLocaleString("es-PE", { minimumFractionDigits: d, maximumFractionDigits: d });
const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const COL_LUG = { 1:"#1F4E79", 3:"#2f7bbf", 5:"#6fa8dc", 2:"#C55A11", 4:"#e08a4b", 6:"#f2b27d", 7:"#8a94a3", 8:"#b8c0cc" };
const MIN_N = 30;
/* máximo "redondo" para que las marcas del eje sean números limpios (4 intervalos) */
const niceMax = v => { const p = Math.pow(10, Math.floor(Math.log10(v / 4))), m = v / 4 / p, k = m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10; return k * p * 4; };
const tk = v => fmt(v, Number.isInteger(+v.toFixed(6)) ? 0 : 1);

const ITEM  = Object.fromEntries(DATOS.items.map(i => [i.id, i.nombre]));
const DOMN  = Object.fromEntries(DATOS.dominios.map(d => [d.id, d.nombre]));
const LUGN  = Object.fromEntries(DATOS.lugares.map(l => [l.id, l]));
const state = { dom: 0, orden: "valor", item: 0, med: "ambas", dmet: "gastoMedio", mmet: "gastoMedio" };

/* ---------- Variables del diccionario ---------- */
const VARS = [
  ["AÑO, MES", "Año (2025) y mes de la encuesta (01–12).", "Numérica"],
  ["CONGLOME, VIVIENDA, HOGAR", "Identificadores; juntos forman la llave del hogar.", "Texto"],
  ["UBIGEO, DOMINIO, ESTRATO", "Ubicación (código de 6 dígitos), dominio geográfico (1–8) y estrato (1–8).", "Categórica"],
  ["P604N", "Número del producto/servicio (1 a 13; no existe el 12).", "Categórica"],
  ["P604", "¿Obtuvo o usó el producto el mes anterior? 1 = Sí, 2 = No, 9 = sin información.", "Categórica"],
  ["P604A1–P604A8", "Forma de obtención (comprado, autoconsumo, regalo, donación, otro, no sabe); 1 = marcada.", "Binaria"],
  ["P604AA", "Lugar de compra (grifo, taller, empresa de transporte, teléfono público; formal/informal).", "Categórica"],
  ["P604B", "Monto total pagado por la compra o servicio, en soles del mes.", "Numérica"],
  ["P604C2–P604C7, P604C", "Costo estimado si hubiera tenido que pagar (productos no comprados).", "Numérica"],
  ["D604B…, I604B…", "Versiones anuales de los montos (≈ 12 veces el valor mensual), ajustadas.", "Numérica"],
  ["FACTOR07", "Factor de expansión del hogar (ponderador).", "Numérica"],
  ["VISITA_CAMPO, TICUEST01, NCONGLOME, SUB_CONGLOME", "Control de campo y de la muestra.", "Mixta"]
];

/* ---------- Tooltip global ---------- */
const tip = $("#tip");
document.addEventListener("mousemove", e => {
  const t = e.target.closest("[data-tip]");
  if (!t) { tip.style.opacity = 0; return; }
  tip.innerHTML = t.getAttribute("data-tip");
  tip.style.opacity = 1;
  const x = Math.min(e.clientX + 14, innerWidth - tip.offsetWidth - 10);
  tip.style.left = x + "px"; tip.style.top = (e.clientY + 16) + "px";
});
document.addEventListener("scroll", () => tip.style.opacity = 0, { passive: true });

/* ---------- Utilidades de datos ---------- */
const usoDe   = (d = state.dom) => DATOS.uso[d];
const gastoDe = (d = state.dom) => DATOS.gasto[d];
const ambito  = () => state.dom === 0 ? "a nivel nacional" : "en " + DOMN[state.dom];
const wrap2   = txt => { const p = txt.split(" "); if (p.length < 2) return [txt]; const m = Math.ceil(p.length / 2); return [p.slice(0, m).join(" "), p.slice(m).join(" ")]; };

/* ---------- Gráfico 1: barras horizontales ---------- */
function renderG1() {
  const u = usoDe();
  let rows = DATOS.items.map(i => ({ id: i.id, nombre: i.nombre, v: u[i.id] || 0 }));
  if (state.orden === "valor") rows.sort((a, b) => b.v - a.v);
  const W = 860, LW = 250, RW = 70, RH = 32, T = 8, H = rows.length * RH + T + 30;
  const max = niceMax(Math.max(1, ...rows.map(r => r.v)) * 1.05), aw = W - LW - RW;
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Porcentaje de hogares por producto">`;
  for (let k = 0; k <= 4; k++) { const x = LW + aw * k / 4; s += `<line class="grid" x1="${x}" x2="${x}" y1="${T}" y2="${H - 28}"/><text class="muted" x="${x}" y="${H - 10}" text-anchor="middle">${tk(max * k / 4)}%</text>`; }
  rows.forEach((r, i) => {
    const y = T + i * RH, w = Math.max(1.5, r.v / max * aw);
    s += `<text x="${LW - 10}" y="${y + 20}" text-anchor="end">${esc(r.nombre)}</text>
      <rect class="bar" x="${LW}" y="${y + 5}" width="${w}" height="${RH - 10}" rx="5" style="fill:var(--brand);animation-delay:${i * 40}ms" data-tip="<b>${esc(r.nombre)}</b>${fmt(r.v, 1)}% de los hogares ${ambito()}"/>
      <text x="${LW + w + 8}" y="${y + 20}">${fmt(r.v, 1)}%</text>`;
  });
  $("#g1").innerHTML = s + "</svg>";
  const top = [...rows].sort((a, b) => b.v - a.v);
  $("#t1").innerHTML = `<b>Lectura:</b> ${ambito().replace(/^a /, "A ").replace(/^en /, "En ")}, el rubro más frecuente es <b>${esc(top[0].nombre)}</b> (${fmt(top[0].v, 1)}% de los hogares), seguido de <b>${esc(top[1].nombre)}</b> (${fmt(top[1].v, 1)}%) y <b>${esc(top[2].nombre)}</b> (${fmt(top[2].v, 1)}%). Los servicios para menores de 14 años y el correo casi no aparecen.`;
}

/* ---------- Gráfico 2: dona de lugar de compra ---------- */
function renderG2() {
  const L = DATOS.lug[state.dom], ids = state.item === 0 ? DATOS.items.map(i => i.id) : [state.item];
  const tot = {}; DATOS.lugares.forEach(l => tot[l.id] = 0);
  ids.forEach(id => DATOS.lugares.forEach(l => tot[l.id] += (L[id] ? L[id][l.id] : 0)));
  const total = Object.values(tot).reduce((a, b) => a + b, 0);
  const nombreProd = state.item === 0 ? "todos los productos" : ITEM[state.item];
  if (total === 0) {
    $("#g2").innerHTML = `<p style="padding:30px;color:var(--muted)">No hay compras con lugar declarado para <b>${esc(nombreProd)}</b> ${ambito()}.</p>`;
    $("#g2leg").innerHTML = ""; $("#t2").innerHTML = `<b>Lectura:</b> sin datos para esta combinación.`; return;
  }
  const rows = DATOS.lugares.map(l => ({ ...l, w: tot[l.id], p: tot[l.id] / total * 100 })).filter(r => r.w > 0).sort((a, b) => b.w - a.w);
  const cx = 150, cy = 150, R = 130, r0 = 78; let a0 = -Math.PI / 2;
  let s = `<svg viewBox="0 0 300 300" role="img" aria-label="Lugar de compra" style="max-width:340px;margin:auto">`;
  rows.forEach(r => {
    const ang = Math.min(r.p / 100 * 2 * Math.PI, 2 * Math.PI - 0.0001), a1 = a0 + ang, lg = ang > Math.PI ? 1 : 0;
    const p = `M${cx + R * Math.cos(a0)} ${cy + R * Math.sin(a0)} A${R} ${R} 0 ${lg} 1 ${cx + R * Math.cos(a1)} ${cy + R * Math.sin(a1)} L${cx + r0 * Math.cos(a1)} ${cy + r0 * Math.sin(a1)} A${r0} ${r0} 0 ${lg} 0 ${cx + r0 * Math.cos(a0)} ${cy + r0 * Math.sin(a0)} Z`;
    s += `<path class="slice" d="${p}" fill="${COL_LUG[r.id]}" stroke="var(--card)" stroke-width="2" data-tip="<b>${esc(r.nombre)}</b>${fmt(r.p, 1)}% de las compras"/>`;
    a0 = a1;
  });
  const fo = rows.filter(r => r.tipo === "formal").reduce((a, r) => a + r.w, 0), inf = rows.filter(r => r.tipo === "informal").reduce((a, r) => a + r.w, 0);
  const pf = fo + inf > 0 ? fo / (fo + inf) * 100 : null;
  s += `<text x="${cx}" y="${cy - 2}" text-anchor="middle" style="font-size:26px;font-weight:700">${pf == null ? "–" : fmt(pf, 0) + "%"}</text><text class="muted" x="${cx}" y="${cy + 18}" text-anchor="middle">formal</text></svg>`;
  $("#g2").innerHTML = s;
  $("#g2leg").innerHTML = `<div class="legend" style="flex-direction:column;gap:8px;font-size:.92rem;color:var(--ink)">` +
    rows.map(r => `<span><i style="background:${COL_LUG[r.id]}"></i>${esc(r.nombre)} — <b>${fmt(r.p, 1)}%</b></span>`).join("") + `</div>`;
  $("#t2").innerHTML = `<b>Lectura:</b> para <b>${esc(nombreProd)}</b> ${ambito()}, el lugar más frecuente es <b>${esc(rows[0].nombre)}</b> (${fmt(rows[0].p, 1)}% de las compras)` +
    (pf == null ? "." : `. Entre los establecimientos clasificados como formales o informales, el <b>${fmt(pf, 1)}%</b> es formal.`);
}

/* ---------- Gráfico 3: media y mediana ---------- */
function renderG3() {
  const g = gastoDe();
  let rows = DATOS.items.filter(i => g[i.id].n >= MIN_N).map(i => ({ nombre: i.nombre, n: g[i.id].n, media: g[i.id].media, mediana: g[i.id].mediana }));
  const key = state.med === "mediana" ? "mediana" : "media";
  rows.sort((a, b) => b[key] - a[key]);
  if (!rows.length) { $("#g3").innerHTML = `<p style="padding:30px;color:var(--muted)">Sin rubros con ${MIN_N} casos o más ${ambito()}.</p>`; $("#t3").innerHTML = ""; return; }
  const both = state.med === "ambas", RH = both ? 46 : 32, W = 860, LW = 250, RW = 80, T = 8, H = rows.length * RH + T + 30, aw = W - LW - RW;
  const max = niceMax(Math.max(...rows.map(r => both ? Math.max(r.media, r.mediana) : r[key])) * 1.05);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Gasto mensual por producto">`;
  for (let k = 0; k <= 4; k++) { const x = LW + aw * k / 4; s += `<line class="grid" x1="${x}" x2="${x}" y1="${T}" y2="${H - 28}"/><text class="muted" x="${x}" y="${H - 10}" text-anchor="middle">S/ ${tk(max * k / 4)}</text>`; }
  rows.forEach((r, i) => {
    const y = T + i * RH, tt = v => `<b>${esc(r.nombre)}</b>${v}<br>${fmt(r.n)} casos con monto`;
    s += `<text x="${LW - 10}" y="${y + RH / 2 + 4}" text-anchor="end">${esc(r.nombre)}</text>`;
    if (both) {
      s += `<rect class="bar" x="${LW}" y="${y + 5}" width="${r.media / max * aw}" height="16" rx="4" style="fill:var(--brand);animation-delay:${i * 40}ms" data-tip="${tt("Media: S/ " + fmt(r.media, 1))}"/><text x="${LW + r.media / max * aw + 6}" y="${y + 18}">S/ ${fmt(r.media, 0)}</text>
        <rect class="bar" x="${LW}" y="${y + 24}" width="${r.mediana / max * aw}" height="16" rx="4" style="fill:var(--accent);animation-delay:${i * 40 + 20}ms" data-tip="${tt("Mediana: S/ " + fmt(r.mediana, 1))}"/><text x="${LW + r.mediana / max * aw + 6}" y="${y + 37}">S/ ${fmt(r.mediana, 0)}</text>`;
    } else {
      const col = key === "media" ? "var(--brand)" : "var(--accent)", v = r[key];
      s += `<rect class="bar" x="${LW}" y="${y + 5}" width="${v / max * aw}" height="${RH - 10}" rx="5" style="fill:${col};animation-delay:${i * 40}ms" data-tip="${tt((key === "media" ? "Media" : "Mediana") + ": S/ " + fmt(v, 1))}"/><text x="${LW + v / max * aw + 8}" y="${y + 21}">S/ ${fmt(v, 0)}</text>`;
    }
  });
  $("#g3").innerHTML = s + "</svg>";
  const top = [...rows].sort((a, b) => b.media - a.media)[0], asim = rows.filter(r => r.media > r.mediana).length;
  $("#t3").innerHTML = `<b>Lectura:</b> ${ambito().replace(/^a /, "A ").replace(/^en /, "En ")}, el mayor gasto medio mensual es <b>${esc(top.nombre)}</b> (S/ ${fmt(top.media, 0)}; mediana S/ ${fmt(top.mediana, 0)}). En ${asim} de ${rows.length} rubros la media supera a la mediana: pocos hogares con gastos muy altos elevan el promedio.`;
}

/* ---------- Gráfico 4: dominios ---------- */
function renderG4() {
  const m = state.dmet, esPct = m === "pctConGasto";
  const rows = DATOS.dominios.filter(d => d.id !== 0).map(d => ({ id: d.id, nombre: d.nombre, v: DATOS.dom[d.id][m] })).sort((a, b) => b.v - a.v);
  const ref = DATOS.dom[0][m], W = 860, H = 340, L = 50, B = 70, T = 24, ah = H - B - T, aw = W - L - 10, bw = aw / rows.length;
  const max = niceMax(Math.max(...rows.map(r => r.v), ref) * 1.1), f = v => esPct ? fmt(v, 1) + "%" : "S/ " + fmt(v, 0);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Comparación por dominio">`;
  for (let k = 0; k <= 4; k++) { const y = T + ah - ah * k / 4; s += `<line class="grid" x1="${L}" x2="${W - 10}" y1="${y}" y2="${y}"/><text class="muted" x="${L - 8}" y="${y + 4}" text-anchor="end">${tk(max * k / 4)}</text>`; }
  rows.forEach((r, i) => {
    const h = r.v / max * ah, x = L + i * bw + bw * .15, w = bw * .7, sel = r.id === state.dom;
    s += `<rect class="vbar ${sel ? "sel" : ""}" x="${x}" y="${T + ah - h}" width="${w}" height="${h}" rx="6" data-dom="${r.id}" style="fill:${sel ? "var(--accent)" : "var(--brand)"};animation-delay:${i * 50}ms" data-tip="<b>${esc(r.nombre)}</b>${f(r.v)}<br><i>Clic para filtrar todo por este dominio</i>"/>
      <text x="${x + w / 2}" y="${T + ah - h - 7}" text-anchor="middle" style="font-weight:600">${f(r.v)}</text>`;
    wrap2(r.nombre).forEach((ln, j) => s += `<text class="muted" x="${x + w / 2}" y="${H - B + 18 + j * 15}" text-anchor="middle">${esc(ln)}</text>`);
  });
  const yr = T + ah - ref / max * ah;
  s += `<line x1="${L}" x2="${W - 10}" y1="${yr}" y2="${yr}" stroke="var(--accent)" stroke-dasharray="6 5" stroke-width="1.5"/><text x="${W - 12}" y="${yr - 6}" text-anchor="end" style="fill:var(--accent);font-weight:600">Nacional: ${f(ref)}</text></svg>`;
  $("#g4").innerHTML = s;
  $$("#g4 .vbar").forEach(b => b.addEventListener("click", () => setDom(+b.dataset.dom)));
  const hi = rows[0], lo = rows[rows.length - 1], nom = { gastoMedio: "gasto medio mensual por hogar", gastoMediano: "gasto mediano mensual por hogar", pctConGasto: "porcentaje de hogares con gasto" }[m];
  $("#t4").innerHTML = `<b>Lectura:</b> en el ${nom}, <b>${esc(hi.nombre)}</b> lidera (${f(hi.v)}) y <b>${esc(lo.nombre)}</b> es el más bajo (${f(lo.v)}); la brecha es de ${fmt(hi.v / lo.v, 1)} veces. <i>Haz clic en una barra para filtrar toda la página por ese dominio.</i>`;
}

/* ---------- Gráfico 5: evolución mensual ---------- */
function renderG5() {
  const m = state.mmet, esPct = m === "pctGasto", W = 860, H = 340, L = 56, R = 20, T = 20, B = 40, aw = W - L - R, ah = H - T - B;
  const serie = DATOS.mensual[state.dom], nac = DATOS.mensual[0], vals = serie.map(p => p[m]);
  const todos = (state.dom === 0 ? vals : vals.concat(nac.map(p => p[m]))).filter(v => v != null);
  const mn = Math.min(...todos), mx = Math.max(...todos), pad = (mx - mn) * .3 || 5, y0 = Math.floor(mn - pad), y1 = Math.ceil(mx + pad);
  const X = i => L + aw * i / 11, Y = v => T + ah - (v - y0) / (y1 - y0) * ah, f = v => esPct ? fmt(v, 1) + "%" : "S/ " + fmt(v, 0);
  let s = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Evolución mensual">`;
  for (let k = 0; k <= 4; k++) { const v = y0 + (y1 - y0) * k / 4, y = Y(v); s += `<line class="grid" x1="${L}" x2="${W - R}" y1="${y}" y2="${y}"/><text class="muted" x="${L - 8}" y="${y + 4}" text-anchor="end">${fmt(v, 0)}</text>`; }
  MESES.forEach((mm, i) => s += `<text class="muted" x="${X(i)}" y="${H - 14}" text-anchor="middle">${mm}</text>`);
  const path = arr => arr.map((p, i) => p[m] == null ? "" : `${i ? "L" : "M"}${X(i)} ${Y(p[m])}`).join(" ");
  if (state.dom !== 0) s += `<path d="${path(nac)}" fill="none" stroke="var(--gray)" stroke-width="2" stroke-dasharray="6 5"/>`;
  s += `<path class="linepath" d="${path(serie)}" fill="none" stroke="var(--brand)" stroke-width="3" stroke-linejoin="round"/>`;
  serie.forEach((p, i) => { if (p[m] != null) s += `<circle cx="${X(i)}" cy="${Y(p[m])}" r="6" fill="var(--card)" stroke="var(--brand)" stroke-width="3" style="cursor:pointer" data-tip="<b>${MESES[i]} 2025</b>${f(p[m])}${state.dom !== 0 ? "<br>Nacional: " + f(nac[i][m]) : ""}"/>`; });
  $("#g5").innerHTML = s + "</svg>" + (state.dom !== 0 ? `<div class="legend"><span><i style="background:var(--brand)"></i>${esc(DOMN[state.dom])}</span><span><i style="background:var(--gray)"></i>Nacional</span></div>` : "");
  const ok = serie.map((p, i) => ({ i, v: p[m] })).filter(p => p.v != null), hi = ok.reduce((a, b) => b.v > a.v ? b : a), lo = ok.reduce((a, b) => b.v < a.v ? b : a);
  $("#t5").innerHTML = `<b>Lectura:</b> ${ambito().replace(/^a /, "A ").replace(/^en /, "En ")}, el valor más alto del año fue en <b>${MESES[hi.i]}</b> (${f(hi.v)}) y el más bajo en <b>${MESES[lo.i]}</b> (${f(lo.v)}). El eje vertical no parte de cero para hacer visibles las variaciones.`;
}

/* ---------- Tabla resumen ---------- */
let sortK = "pct", sortAsc = false;
function renderTabla() {
  const u = usoDe(), g = gastoDe();
  const rows = DATOS.items.map(i => ({ nombre: i.nombre, pct: u[i.id], n: g[i.id].n, media: g[i.id].n >= MIN_N ? g[i.id].media : null, mediana: g[i.id].n >= MIN_N ? g[i.id].mediana : null }));
  rows.sort((a, b) => { const x = a[sortK], y = b[sortK]; if (x == null) return 1; if (y == null) return -1; return (typeof x === "string" ? x.localeCompare(y) : x - y) * (sortAsc ? 1 : -1); });
  $("#tablaRes tbody").innerHTML = rows.map(r => `<tr><td>${esc(r.nombre)}</td><td class="num">${fmt(r.pct, 1)}%</td><td class="num">${fmt(r.n)}</td><td class="num">${fmt(r.media, 1)}</td><td class="num">${fmt(r.mediana, 1)}</td></tr>`).join("");
}

/* ---------- Secciones fijas ---------- */
function renderBase() {
  const M = DATOS.meta;
  $("#estructura").innerHTML = `<b>${fmt(M.filas)}</b> filas y <b>${M.columnas}</b> columnas. Cada uno de los <b>${fmt(M.hogares)}</b> hogares aparece en ${Math.round(M.filas / M.hogares)} filas (una por producto o servicio). Cubre los 12 meses de 2025, <b>${M.deptos}</b> departamentos, 8 dominios geográficos y 8 estratos.`;
  $("#calidad").innerHTML = [
    "Archivo con separador «;», decimal «,» y codificación latin-1.",
    `Solo el ${fmt(M.pctSi, 1)}% de las filas son respuestas «Sí»; por eso forma de obtención, lugar y monto están vacíos en más del 90% (no es un error).`,
    `${fmt(M.nsnr)} filas con P604 = 9 (sin información) se excluyeron.`,
    `${M.montos999} montos codificados como 999999.9 se trataron como datos perdidos.`
  ].map(t => `<li>${t}</li>`).join("");
  const pintar = q => { q = q.trim().toLowerCase(); $("#tablaVars tbody").innerHTML = VARS.filter(v => v.join(" ").toLowerCase().includes(q)).map(v => `<tr><td><code>${esc(v[0])}</code></td><td>${esc(v[1])}</td><td>${v[2]}</td></tr>`).join("") || `<tr><td colspan="3">Sin coincidencias.</td></tr>`; };
  pintar(""); $("#buscaVar").addEventListener("input", e => pintar(e.target.value));
}

function renderKpis() {
  const M = DATOS.meta, d0 = DATOS.dom[0];
  const k = [
    { v: M.hogares, l: "hogares encuestados", d: 0, p: "" }, { v: M.filas, l: "registros (hogar × producto)", d: 0, p: "" },
    { v: d0.pctConGasto, l: "hogares con gasto en el mes", d: 1, p: "%" }, { v: d0.gastoMedio, l: "gasto medio mensual por hogar con gasto", d: 0, p: "S/ " }
  ];
  $("#kpis").innerHTML = k.map(x => `<div class="kpi"><b data-v="${x.v}" data-d="${x.d}" data-p="${x.p}">0</b><span>${x.l}</span></div>`).join("");
  $$("#kpis b").forEach(el => {
    const fin = +el.dataset.v, d = +el.dataset.d, p = el.dataset.p, t0 = performance.now();
    const paso = t => { const q = Math.min(1, (t - t0) / 1200), e = 1 - Math.pow(1 - q, 3), val = fin * e;
      el.textContent = (p === "S/ " ? p : "") + fmt(val, d) + (p === "%" ? "%" : ""); if (q < 1) requestAnimationFrame(paso); };
    requestAnimationFrame(paso);
  });
}

function renderConcl() {
  const u = DATOS.uso[0], top = DATOS.items.map(i => ({ n: i.nombre, v: u[i.id] })).sort((a, b) => b.v - a.v)[0];
  const d = DATOS.dom, doms = DATOS.dominios.filter(x => x.id).map(x => ({ n: x.nombre, v: d[x.id].gastoMedio })).sort((a, b) => b.v - a.v);
  const c = [
    [fmt(top.v, 1) + "%", `de los hogares usó <b>${esc(top.n)}</b>, el rubro más frecuente. El uso se concentra en pocos productos.`],
    [fmt(DATOS.meta.pctFormal, 1) + "%", `de las compras con establecimiento clasificado se hizo en lugares <b>formales</b>; las empresas de transporte son el canal más importante.`],
    [`S/ ${fmt(d[0].gastoMedio, 0)} vs S/ ${fmt(d[0].gastoMediano, 0)}`, `gasto <b>medio</b> frente al <b>mediano</b> por hogar: los montos son asimétricos, conviene reportar ambos.`],
    [fmt(doms[0].v / doms[doms.length - 1].v, 1) + "×", `es la brecha de gasto entre <b>${esc(doms[0].n)}</b> y <b>${esc(doms[doms.length - 1].n)}</b>: existen diferencias territoriales marcadas.`]
  ];
  $("#concl").innerHTML = c.map(x => `<div class="card"><div class="n">${x[0]}</div><p style="margin:6px 0 0">${x[1]}</p></div>`).join("");
}

/* ---------- Estado y eventos ---------- */
function actualizarNota() {
  const n = DATOS.dom[state.dom].hogares;
  $("#nota").textContent = `${fmt(n)} hogares en la muestra (${DOMN[state.dom]})`;
}
function renderTodo() { actualizarNota(); renderG1(); renderG2(); renderG3(); renderG4(); renderG5(); renderTabla(); }
function setDom(id) { state.dom = id; $("#selDom").value = id; renderTodo(); }

function chips(sel, key, cb) {
  $$(sel + " .chip").forEach(b => b.addEventListener("click", () => {
    $$(sel + " .chip").forEach(x => x.classList.remove("on")); b.classList.add("on"); state[key] = b.dataset.v; cb();
  }));
}

function init() {
  const repo = typeof REPO_URL !== "undefined" ? REPO_URL : "#", pages = typeof GITHUB_URL !== "undefined" ? GITHUB_URL : "#";
  ["repoLink", "repoLink2"].forEach(id => $("#" + id).href = repo); $("#pagesLink").href = pages;

  $("#selDom").innerHTML = DATOS.dominios.map(d => `<option value="${d.id}">${d.id === 0 ? "Nacional (todos los dominios)" : esc(d.nombre)}</option>`).join("");
  $("#selDom").addEventListener("change", e => setDom(+e.target.value));
  $("#selItem").innerHTML = `<option value="0">Todos los productos</option>` + DATOS.items.filter(i => DATOS.gasto[0][i.id].n >= MIN_N).map(i => `<option value="${i.id}">${esc(i.nombre)}</option>`).join("");
  $("#selItem").addEventListener("change", e => { state.item = +e.target.value; renderG2(); });

  chips("#chipsOrden", "orden", renderG1); chips("#chipsMed", "med", renderG3); chips("#chipsDom", "dmet", renderG4); chips("#chipsMes", "mmet", renderG5);
  $$("#tablaRes th.sortable").forEach(th => th.addEventListener("click", () => { const k = th.dataset.k; sortAsc = (sortK === k) ? !sortAsc : (k === "nombre"); sortK = k; renderTabla(); }));

  renderBase(); renderKpis(); renderConcl(); renderTodo();

  /* tema claro/oscuro */
  const root = document.documentElement;
  let saved = null; try { saved = localStorage.getItem("tema"); } catch (e) {}
  root.dataset.theme = saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  $("#themeBtn").addEventListener("click", () => { root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark"; try { localStorage.setItem("tema", root.dataset.theme); } catch (e) {} });

  /* aparición de secciones y menú activo */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) e.target.classList.add("in"); }), { threshold: .05 });
  $$(".fade").forEach(s => io.observe(s));
  const links = $$("#nav a"), secs = ["inicio", "base", "resultados", "resumen", "conclusiones"].map(id => document.getElementById(id));
  const spy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id)); }), { rootMargin: "-40% 0px -55% 0px" });
  secs.forEach(s => spy.observe(s));
}
document.addEventListener("DOMContentLoaded", init);
