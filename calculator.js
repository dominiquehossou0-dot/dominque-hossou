const $  = id => document.getElementById(id);
const R  = (v, d=3) => isNaN(v) ? '—' : Math.round(v * 10**d) / 10**d;
const RD = (v, d=2) => isNaN(v) ? '—' : parseFloat(v.toFixed(d));
const MOIS  = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];
const JOURS = [31,28,31,30,31,30,31,31,30,31,30,31];
let chartInst = {};
let HISTORY   = JSON.parse(localStorage.getItem('ch_history') || '[]');

Chart.register({
  id: 'whiteBg',
  beforeDraw(c) {
    const ctx = c.ctx;
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.restore();
  }
});

const notify = (msg, dur=2800) => {
  const n = $('notif');
  n.textContent = msg;
  n.classList.add('show');
  setTimeout(() => n.classList.remove('show'), dur);
};

const parseD = s => s.split(/[\s,;|\n]+/).map(Number).filter(v => !isNaN(v));

const showErr = (id, msg) => { const e = $(id); if(e){ e.textContent = '⚠️ ' + msg; e.classList.add('show'); } };
const clrErr  = id => $(id)?.classList.remove('show');
const showR   = id => $(id)?.classList.add('show');

window.addEventListener('scroll', () => {
  $('btt').classList.toggle('visible', window.scrollY > 300);
});

// ── TOGGLE CARTE ──────────────────────────────────────
function tog(h) { h.parentElement.classList.toggle('open'); }

// ── CRÉER GRAPHIQUE ───────────────────────────────────
function mkChart(id, cfg) {
  if (chartInst[id]) { chartInst[id].destroy(); delete chartInst[id]; }
  const canvas = $(id);
  if (!canvas) return;
  const wrap = canvas.closest('.chart-wrap');
  if (wrap) wrap.classList.add('show');
  if (!cfg.options) cfg.options = {};
  cfg.options.responsive = true;
  cfg.options.maintainAspectRatio = false;
  if (!cfg.options.animation) cfg.options.animation = { duration: 500 };
  chartInst[id] = new Chart(canvas.getContext('2d'), cfg);
  setTimeout(() => chartInst[id]?.resize(), 80);
}

// ── RÉINITIALISER CALCULATEUR ─────────────────────────
function rst(fields, resId, errId, chartWrapId) {
  fields.forEach(f => { const el = $(f); if (el) el.value = ''; });
  $(resId)?.classList.remove('show');
  clrErr(errId);
  if (chartWrapId) {
    const wrap = $(chartWrapId);
    if (wrap) {
      wrap.classList.remove('show');
      const c = wrap.querySelector('canvas');
      if (c && chartInst[c.id]) { chartInst[c.id].destroy(); delete chartInst[c.id]; }
    }
  }
}

// ── HISTORIQUE ────────────────────────────────────────
function addHist(nom, result) {
  HISTORY.unshift({ nom, result, time: new Date().toLocaleTimeString('fr-FR') });
  if (HISTORY.length > 20) HISTORY.pop();
  localStorage.setItem('ch_history', JSON.stringify(HISTORY));
  renderHist();
}
function renderHist() {
  const el = $('histList');
  if (!HISTORY.length) { el.innerHTML = '<div class="hist-empty">Aucun calcul effectué</div>'; return; }
  el.innerHTML = HISTORY.map(h => `
    <div class="hist-item">
      <strong>${h.nom}</strong><br/>
      <span style="color:var(--blue);font-size:.7rem">${h.result}</span>
      <span class="hist-time">🕐 ${h.time}</span>
    </div>`).join('');
}
function clearHistory() {
  HISTORY = [];
  localStorage.removeItem('ch_history');
  renderHist();
  notify('🗑️ Historique vidé');
}
renderHist();

// ── FILTRES ───────────────────────────────────────────
function filterCat(cat, btn) {
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterCards(cat);
}
function filterCat2(cat, btn) {
  document.querySelectorAll('.fb').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  filterCards(cat);
}
function filterCards(cat) {
  document.querySelectorAll('.ccard').forEach(c => {
    c.classList.toggle('hidden', cat !== 'all' && c.dataset.cat !== cat);
  });
}
function searchCalc(val) {
  const q = val.toLowerCase().trim();
  document.querySelectorAll('.ccard').forEach(c => {
    const kw = (c.dataset.kw || '') + ' ' + (c.querySelector('.ctitle')?.textContent.toLowerCase() || '');
    c.classList.toggle('hidden', !!q && !kw.includes(q));
  });
}

// ── EXEMPLES PRÉ-REMPLIS ──────────────────────────────
const EX = {
  c1:  { r_C:'0.65', r_i:'55', r_A:'2.5', r_tc:'1.0' },
  c2:  { tc_L:'18.5', tc_H:'320', tc_A:'85', tc_Im:'17.3' },
  c3:  { cn_CN:'75', cn_P:'85', cn_A:'12.5', cn_tc:'2.5' },
  c5:  { msk_K:'6', msk_X:'0.2', msk_dt:'3', msk_I:'5,12,28,45,55,60,52,40,28,18,12,8,5' },
  c6:  { g_data:'78,95,112,68,134,89,103,145,72,98,128,87,115,76,142,93,108,131' },
  c7:  { n_data:'1082,956,1134,1045,1201,978,1056,1189,932,1078,1156,1023,1098,945' },
  c8:  { s_data:'1082,956,1134,1045,1201,978,1056,1189,932,1078,1156,1023', s_name:'Pluies Bohicon (mm)' },
  c11: { ms_K:'35', ms_I:'0.002' },
  c12: { re_V:'1.5', re_D:'0.5', re_T:'25' },
  c13: { co_Q:'5.0', co_K:'40', co_I:'0.001' },
  c14: { rc_P:'1100', rc_Cp:'0.8', rc_Ce:'18.5', rc_A:'150' },
  c15: { gr_A:'1250', gr_P:'185', gr_Zmax:'450', gr_Zmin:'35', gr_L:'890' },
  c16: { m_X:'1082,956,1134,1045,1201,978,1056,1189,932,1078', m_Y:'45.2,38.1,52.4,41.3,58.7,36.9,47.2,55.1,33.8,44.6', m_nx:'Pluies (mm)', m_ny:'Débits (m³/s)' },
  c17: { cdc_data:'45,38,52,41,58,36,47,55,33,44,62,29,50,39,48,71,25,43,37,60' },
  c18: { spi_data:'1082,956,1134,1045,1201,978,1056,1189,932,1078,1156,1023,1098,945,1167,1034' },
  c19: { p3_data:'78,95,112,68,134,89,103,145,72,98,128,87,115,76,142' },
  c20: { jac_Q:'12.5', jac_r:'50', jac_T:'0.85', jac_S:'0.001', jac_t:'24' }
};
function fillEx(cid) {
  const ex = EX[cid];
  if (ex) Object.entries(ex).forEach(([id, val]) => { const el = $(id); if (el) el.value = val; });
  const card = $(cid);
  if (card && !card.classList.contains('open')) card.classList.add('open');
  // Cas spéciaux avec données tabulaires
  if (cid === 'c4') {
    // S'assurer que le tableau est initialisé avant de remplir
    setTimeout(fillExTarage, 50);
  }
  if (cid === 'c9') setTimeout(fillExTH, 50);
  if (cid === 'c10') setTimeout(fillExTurc, 50);
  notify('✅ Exemple chargé — cliquez sur Calculer');
}
function fillExTarage() {
  const tbody = $('tarageTable').querySelector('tbody');
  tbody.innerHTML = '';
  [[0.45,1.2],[0.68,2.8],[0.92,5.4],[1.15,8.9],[1.42,13.5],[1.78,20.2],[2.10,28.6]].forEach(([H,Q]) => {
    const r = tbody.insertRow(-1);
    r.innerHTML = `<td><input type="number" value="${H}" step="0.001" class="if"/></td><td><input type="number" value="${Q}" step="0.001" class="if"/></td>`;
  });
}
function fillExTH() {
  [27.2,29.8,32.1,31.5,29.4,27.8,26.5,26.1,26.8,28.3,29.1,27.6].forEach((t,i) => { $('tT'+i).value = t; });
  [5,10,35,105,132,145,175,210,165,62,8,2].forEach((p,i) => { $('tP'+i).value = p; });
}
function fillExTurc() {
  [27.2,29.8,32.1,31.5,29.4,27.8,26.5,26.1,26.8,28.3,29.1,27.6].forEach((t,i) => { $('tuT'+i).value = t; });
  [380,420,460,430,380,320,310,315,330,370,390,365].forEach((r,i) => { $('tuR'+i).value = r; });
  [55,52,58,70,80,85,88,88,82,75,62,58].forEach((h,i) => { $('tuH'+i).value = h; });
}

// ── EXPORT PDF ────────────────────────────────────────
function dlPDF(panelId, titre) {
  let jC;
  if (window.jspdf?.jsPDF) jC = window.jspdf.jsPDF;
  else if (window.jsPDF) jC = window.jsPDF;
  else { notify('⚠️ jsPDF non chargé. Vérifiez la connexion.'); return; }

  const panel = $(panelId);
  if (!panel?.classList.contains('show')) { notify('⚠️ Lancez d\'abord le calcul.'); return; }

  const safe = s => String(s).replace(/[^\x00-\x7F]/g, c => (
    {'é':'e','è':'e','ê':'e','à':'a','â':'a','î':'i','ô':'o','û':'u','ç':'c',
     'É':'E','È':'E','Ê':'E','À':'A','Î':'I','Ô':'O','Û':'U','Ç':'C',
     'α':'a','β':'b','μ':'u','σ':'s','π':'pi','²':'2','³':'3','¹':'1'}[c] || ''
  ));

  const doc = new jC({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 18;

  // En-tête
  doc.setFont('helvetica','bold'); doc.setFontSize(15); doc.setTextColor(10,31,60);
  doc.text(safe('Resultats — ' + titre), 14, y); y += 7;
  doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(100,116,139);
  doc.text('CalcHydro v2.0 · INE-UAC · Licence S3A54 · ' + new Date().toLocaleDateString('fr-FR'), 14, y); y += 4;
  doc.setDrawColor(21,101,192); doc.setLineWidth(0.4); doc.line(14,y,195,y); y += 6;

  // Résultat principal
  const main = panel.querySelector('.rpmain');
  const unit = panel.querySelector('.rpunit');
  if (main?.textContent && main.textContent !== '—') {
    doc.setFont('helvetica','bold'); doc.setFontSize(13); doc.setTextColor(21,101,192);
    doc.text(safe('Resultat : ' + main.textContent), 14, y); y += 5;
    if (unit) { doc.setFont('helvetica','normal'); doc.setFontSize(9); doc.setTextColor(100,116,139); doc.text(safe(unit.textContent), 14, y); y += 5; }
  }

  // Paramètres
  doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(51,65,85);
  panel.querySelectorAll('.rpitem').forEach(row => {
    if (y > 272) { doc.addPage(); y = 18; }
    const lbl = row.querySelector('.rplbl')?.textContent || '';
    const val = row.querySelector('.rpval')?.textContent || '';
    if (!lbl || !val || val === '—') return;
    doc.setFont('helvetica','bold'); doc.text(safe(lbl) + ' :', 14, y);
    doc.setFont('helvetica','normal'); doc.text(safe(val), 90, y); y += 6;
  });

  // Tableau
  const tbody = panel.querySelector('tbody');
  if (tbody?.querySelectorAll('tr').length) {
    if (y > 240) { doc.addPage(); y = 18; }
    y += 4;
    const hdrs = [...panel.querySelectorAll('thead th')].map(h => h.textContent);
    const cw = 175 / Math.max(hdrs.length, 1);
    doc.setFillColor(21,101,192); doc.setTextColor(255,255,255);
    doc.setFont('helvetica','bold'); doc.setFontSize(9);
    doc.rect(14, y-4, 180, 7, 'F');
    hdrs.forEach((h,i) => doc.text(safe(h), 15 + i*cw, y));
    y += 6;
    doc.setFont('helvetica','normal'); doc.setTextColor(51,65,85);
    tbody.querySelectorAll('tr').forEach((tr, ix) => {
      if (y > 272) { doc.addPage(); y = 18; }
      if (ix%2===0) { doc.setFillColor(248,250,252); doc.rect(14,y-4,180,6,'F'); }
      [...tr.querySelectorAll('td')].forEach((td,i) => doc.text(safe(td.textContent), 15+i*cw, y));
      y += 6;
    });
  }

  // Interprétation
  const interp = panel.querySelector('.rpinterp');
  if (interp?.textContent && y < 265) {
    y += 5; doc.setFontSize(9); doc.setTextColor(100,116,139);
    const lines = doc.splitTextToSize(safe('Interpretation : ' + interp.textContent), 175);
    doc.text(lines, 14, y);
  }

  doc.setFontSize(7); doc.setTextColor(180);
  doc.text('CalcHydro · INE-UAC · ' + new Date().toLocaleDateString('fr-FR'), 14, 290);
  doc.save(safe(titre).replace(/\s/g,'_') + '_calcul.pdf');
  notify('✅ PDF exporté');
}

// ── EXPORT PNG ────────────────────────────────────────
function dlChart(cid, name) {
  const c = $(cid);
  if (!c || !chartInst[cid]) { notify('⚠️ Aucun graphique à exporter.'); return; }
  const tmp = document.createElement('canvas');
  tmp.width = c.width; tmp.height = c.height;
  const ctx = tmp.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, tmp.width, tmp.height);
  ctx.drawImage(c, 0, 0);
  ctx.fillStyle = '#64748b'; ctx.font = '10px Segoe UI,Arial,sans-serif';
  ctx.fillText('CalcHydro v2.0 · INE-UAC · ' + new Date().toLocaleDateString('fr-FR'), 8, tmp.height - 5);
  const a = document.createElement('a');
  a.download = name + '.png'; a.href = tmp.toDataURL('image/png', 1.0); a.click();
  notify('✅ PNG exporté');
}

// ── EXPORT GLOBAL PDF ─────────────────────────────────
function exportAllPDF() {
  const panels = document.querySelectorAll('.rpanel.show');
  if (!panels.length) { notify('⚠️ Aucun résultat à exporter. Effectuez des calculs d\'abord.'); return; }
  notify(`📄 Export PDF de ${panels.length} calculateur(s) en cours...`);
  panels.forEach((p, i) => {
    setTimeout(() => {
      const titre = p.closest('.ccard')?.querySelector('.ctitle')?.textContent || 'Calculateur';
      dlPDF(p.id, titre);
    }, i * 800);
  });
}

function copyAllResults() {
  const panels = document.querySelectorAll('.rpanel.show');
  if (!panels.length) { notify('⚠️ Aucun résultat à copier.'); return; }
  let text = 'CALCHYDRO v2.0 — RÉSULTATS\n';
  text += 'INE-UAC · ' + new Date().toLocaleDateString('fr-FR') + '\n';
  text += '═'.repeat(50) + '\n\n';
  panels.forEach(p => {
    const titre = p.closest('.ccard')?.querySelector('.ctitle')?.textContent || '—';
    text += '▶ ' + titre + '\n';
    p.querySelectorAll('.rpitem').forEach(row => {
      const lbl = row.querySelector('.rplbl')?.textContent || '';
      const val = row.querySelector('.rpval')?.textContent || '';
      if (lbl && val && val !== '—') text += `  ${lbl}: ${val}\n`;
    });
    const interp = p.querySelector('.rpinterp');
    if (interp?.textContent) text += '  → ' + interp.textContent.replace(/<[^>]+>/g,'') + '\n';
    text += '\n';
  });
  navigator.clipboard?.writeText(text).then(() => notify('✅ Résultats copiés dans le presse-papier'));
}

// ═══════════════════════════════════════════════════════
// FONCTIONS MATHÉMATIQUES COMMUNES
// ═══════════════════════════════════════════════════════
function normCDF(z) {
  const a=[0.254829592,-0.284496736,1.421413741,-1.453152027,1.061405429],p=0.3275911;
  const s=z<0?-1:1; z=Math.abs(z)/Math.sqrt(2);
  const t=1/(1+p*z);
  return 0.5*(1+s*(1-(((((a[4]*t+a[3])*t+a[2])*t+a[1])*t+a[0])*t*Math.exp(-z*z))));
}
function normINV(prob) {
  if(prob<=0)return -6; if(prob>=1)return 6;
  const c=[0,2.50662823884,-18.61500062529,41.39119773534,-25.44106049637];
  const d=[0,-8.47351093090,23.08336743743,-21.06224101826,3.13082909833];
  const cc=[0.3374754822726147,0.9761690190917186,0.1607979714918209,0.0276438810333863,0.0038405729373609,0.0003951896511349,0.0000321767881768,0.0000002888167364,0.0000003960315187];
  const y=prob-0.5;
  if(Math.abs(y)<0.42){
    const r=y*y;
    return y*(((c[4]*r+c[3])*r+c[2])*r+c[1])/(((d[4]*r+d[3])*r+d[2])*r+d[1]+1);
  }
  const r=prob<0.5?Math.log(-Math.log(prob)):Math.log(-Math.log(1-prob));
  const res=cc[0]+r*(cc[1]+r*(cc[2]+r*(cc[3]+r*(cc[4]+r*(cc[5]+r*(cc[6]+r*(cc[7]+r*cc[8])))))));
  return prob<0.5?-res:res;
}
function linReg(X, Y) {
  const n=X.length, mx=X.reduce((a,b)=>a+b)/n, my=Y.reduce((a,b)=>a+b)/n;
  const num=X.reduce((s,x,i)=>s+(x-mx)*(Y[i]-my),0);
  const den=X.reduce((s,x)=>s+(x-mx)**2,0);
  const a=num/den, b=my-a*mx;
  const yhat=X.map(x=>a*x+b);
  const sst=Y.reduce((s,y)=>s+(y-my)**2,0);
  const sse=Y.reduce((s,y,i)=>s+(y-yhat[i])**2,0);
  return {a,b,r2:1-sse/sst,r:Math.sqrt(Math.max(0,1-sse/sst))*(a>=0?1:-1),se:Math.sqrt(sse/Math.max(n-2,1))};
}
function photoper(lat, mi) {
  const phi=lat*Math.PI/180, decl=23.45*Math.sin(2*Math.PI*(284+mi*30.5)/365)*Math.PI/180;
  const cosH=-Math.tan(phi)*Math.tan(decl);
  if(cosH>=1)return 0; if(cosH<=-1)return 24;
  return 2*Math.acos(cosH)*24/(2*Math.PI);
}
function wilsonHilferty(T, Cs) {
  const p=1-1/T, z=normINV(p);
  if(Math.abs(Cs)<0.001)return z;
  return z-(z**2-1)*Cs/6+(z**3-6*z)*Cs**2/54-(z**2-1)*Cs**3/162;
}

// ═══════════════════════════════════════════════════════
// C01 — MÉTHODE RATIONNELLE
// ═══════════════════════════════════════════════════════
function calcRationnel() {
  clrErr('r_err');
  const C=parseFloat($('r_C').value), i=parseFloat($('r_i').value),
        A=parseFloat($('r_A').value), tc=parseFloat($('r_tc').value)||1;
  if ([C,i,A].some(isNaN)||C<=0||C>1||i<=0||A<=0) { showErr('r_err','Vérifiez C (0–1), i > 0, A > 0.'); return; }
  const Q = R(C*i*A/3.6, 3);
  $('r_Qp').textContent = Q + ' m³/s';
  $('r_dC').textContent = C; $('r_di').textContent = i+' mm/h'; $('r_dA').textContent = A+' km²';
  let msg = `Bassin ${A} km², C=${C}, i=${i} mm/h → Q = <strong>${Q} m³/s</strong>.`;
  if(Q<1) msg+=' Petit ouvrage léger.'; else if(Q<10) msg+=' Collecteur à dimensionner.'; else msg+=' Ouvrage hydraulique majeur.';
  $('r_interp').innerHTML = msg;
  showR('r_res');
  addHist('Méthode Rationnelle', `Q = ${Q} m³/s`);
  // Hydrogramme triangulaire
  const tm=tc*0.4, tb=tc*2.5;
  const pts=[];
  for(let t=0;t<=tb+0.2;t+=tb/40) pts.push({x:R(t,2),y:R(Math.max(0,t<=tm?parseFloat(Q)*t/tm:parseFloat(Q)*(tb-t)/(tb-tm)),3)});
  mkChart('chart_r',{type:'line',data:{datasets:[
    {label:'Q (m³/s)',data:pts,borderColor:'#1565c0',backgroundColor:'rgba(21,101,192,.12)',fill:true,tension:0.3,pointRadius:0},
    {label:'Qp='+Q,data:[{x:tm,y:0},{x:tm,y:parseFloat(Q)}],type:'line',borderColor:'#dc2626',borderDash:[5,3],pointRadius:0}
  ]},options:{scales:{x:{type:'linear',title:{display:true,text:'Temps (h)'}},y:{title:{display:true,text:'Q (m³/s)'}}},plugins:{legend:{position:'bottom'}}}});
}

// ═══════════════════════════════════════════════════════
// C02 — TEMPS DE CONCENTRATION
// ═══════════════════════════════════════════════════════
function calcTC() {
  clrErr('tc_err');
  const L=parseFloat($('tc_L').value), H=parseFloat($('tc_H').value),
        A=parseFloat($('tc_A').value), Im=parseFloat($('tc_Im').value);
  if ([L,H,A,Im].some(isNaN)||L<=0||H<=0||A<=0||Im<=0) { showErr('tc_err','Tous les champs sont requis > 0.'); return; }
  const S = H/(L*1000); // m/m
  const kirpich  = R(0.0195 * Math.pow(L*1000,0.77) * Math.pow(S,-0.385) / 3600, 3); // en heures
  const giandotti= R((4*Math.sqrt(A)+1.5*L)/(0.8*Math.sqrt(H)), 3);
  const passini  = R(0.108*Math.pow(A*L,1/3)/Math.sqrt(Im), 3);
  const moy = R((kirpich+giandotti+passini)/3, 3);
  $('tc_kirpich').textContent  = kirpich  + ' h';
  $('tc_giandotti').textContent= giandotti + ' h';
  $('tc_passini').textContent  = passini  + ' h';
  $('tc_moy').textContent  = moy + ' h';
  $('tc_range').textContent= R(Math.min(kirpich,giandotti,passini),3)+' – '+R(Math.max(kirpich,giandotti,passini),3)+' h';
  const ecart = R((Math.max(kirpich,giandotti,passini)-Math.min(kirpich,giandotti,passini))/moy*100,1);
  $('tc_interp').innerHTML = `Moyenne recommandée : <strong>${moy} h</strong>. Écart entre méthodes : ${ecart}%. ${ecart>30?'Vérifier les paramètres (écart élevé).':'Résultats cohérents.'}`;
  showR('tc_res');
  addHist('Temps de concentration', `tc moy = ${moy} h`);
}

// ═══════════════════════════════════════════════════════
// C03 — SCS-CN
// ═══════════════════════════════════════════════════════
function calcSCSCN() {
  clrErr('cn_err');
  const CN=parseFloat($('cn_CN').value), P=parseFloat($('cn_P').value),
        A=parseFloat($('cn_A').value), tc=parseFloat($('cn_tc').value);
  if ([CN,P,A,tc].some(isNaN)||CN<=0||CN>100||P<=0||A<=0||tc<=0) { showErr('cn_err','Vérifiez les valeurs (CN:1–100, P>0, A>0, tc>0).'); return; }
  const S  = 25400/CN - 254;
  const Ia = 0.2*S;
  const Pe = P>Ia ? Math.pow(P-Ia,2)/(P+0.8*S) : 0;
  const Tp = tc/2 + 0.6*tc;
  const Qp = R(0.208*Pe*A/Tp, 3);
  const Vol= R(Pe*A*1000, 0);
  $('cn_S').textContent  = R(S,2)+' mm';
  $('cn_Ia').textContent = R(Ia,2)+' mm';
  $('cn_Pe').textContent = R(Pe,2)+' mm';
  $('cn_Qp').textContent = Qp+' m³/s';
  $('cn_Tp').textContent = R(Tp,2)+' h';
  $('cn_Vol').textContent= Vol.toLocaleString('fr-FR')+' m³';
  $('cn_interp').innerHTML = `Pluie nette Pe = <strong>${R(Pe,2)} mm</strong> (${R(Pe/P*100,1)}% de P). Débit de pointe Qp = <strong>${Qp} m³/s</strong> à Tp = ${R(Tp,2)} h.`;
  showR('cn_res');
  addHist('SCS-CN', `Qp = ${Qp} m³/s, Pe = ${R(Pe,2)} mm`);
  // Hydrogramme SCS
  const ratios=[0,0.015,0.075,0.16,0.28,0.43,0.60,0.77,0.89,0.97,1.0,0.98,0.92,0.84,0.75,0.65,0.57,0.49,0.43,0.36,0.31,0.26,0.22,0.18,0.15,0.13];
  const times=ratios.map((_,i)=>R(i*Tp/10,2));
  const flows=ratios.map(r=>R(r*parseFloat(Qp),3));
  mkChart('chart_cn',{type:'line',data:{datasets:[{label:'Hydrogramme SCS-CN',data:times.map((t,i)=>({x:t,y:flows[i]})),borderColor:'#16a34a',backgroundColor:'rgba(22,163,74,.12)',fill:true,tension:0.4,pointRadius:0}]},
    options:{scales:{x:{type:'linear',title:{display:true,text:'Temps (h)'}},y:{title:{display:true,text:'Q (m³/s)'}}},plugins:{legend:{position:'bottom'}}}});
}

// ═══════════════════════════════════════════════════════
// C04 — COURBE DE TARAGE
// ═══════════════════════════════════════════════════════
// Initialisation du tableau de tarage
(function initTarageTable(){
  const tbody = $('tarageTable').querySelector('tbody');
  for(let i=0;i<5;i++){
    const r=tbody.insertRow(-1);
    r.innerHTML='<td><input type="number" step="0.001" class="if" placeholder="H (m)"/></td><td><input type="number" step="0.001" class="if" placeholder="Q (m³/s)"/></td>';
  }
})();
function addTarageRow(){
  const tbody=$('tarageTable').querySelector('tbody');
  const r=tbody.insertRow(-1);
  r.innerHTML='<td><input type="number" step="0.001" class="if" placeholder="H (m)"/></td><td><input type="number" step="0.001" class="if" placeholder="Q (m³/s)"/></td>';
}
function rstTarage(){
  const tbody=$('tarageTable').querySelector('tbody');
  tbody.innerHTML='';
  for(let i=0;i<5;i++){const r=tbody.insertRow(-1);r.innerHTML='<td><input type="number" step="0.001" class="if" placeholder="H (m)"/></td><td><input type="number" step="0.001" class="if" placeholder="Q (m³/s)"/></td>';}
  $('tar_res')?.classList.remove('show'); $('cw_tar')?.classList.remove('show'); clrErr('tar_err');
}
function calcTarage(){
  clrErr('tar_err');
  const H0=parseFloat($('tar_H0').value)||0;
  const rows=[...$('tarageTable').querySelectorAll('tbody tr')];
  const pts=rows.map(r=>{const inputs=r.querySelectorAll('input');return{H:parseFloat(inputs[0].value),Q:parseFloat(inputs[1].value)};}).filter(p=>!isNaN(p.H)&&!isNaN(p.Q)&&p.H>H0&&p.Q>0);
  if(pts.length<3){showErr('tar_err','Minimum 3 paires (H, Q) valides avec H > H₀.');return;}
  // Régression log-log : log(Q) = log(a) + b·log(H-H0)
  const logH=pts.map(p=>Math.log(p.H-H0));
  const logQ=pts.map(p=>Math.log(p.Q));
  const {a:b,b:logA,r2}=linReg(logH,logQ);
  const a=Math.exp(logA);
  $('tar_eq').textContent=`Q = ${R(a,4)}·(H−${H0})^${R(b,3)}`;
  $('tar_a').textContent=R(a,4); $('tar_b').textContent=R(b,3);
  $('tar_r2').textContent=R(r2,4); $('tar_n').textContent=pts.length;
  $('tar_interp').innerHTML=`Ajustement ${r2>0.99?'<strong>excellent</strong>':r2>0.95?'<strong>très bon</strong>':r2>0.90?'bon':'à améliorer'} (R²=${R(r2,4)}). Exposant b=${R(b,3)} (typiquement 1,5–2,5).`;
  showR('tar_res');
  addHist('Courbe de tarage', `Q=${R(a,3)}·(H-${H0})^${R(b,3)}, R²=${R(r2,4)}`);
  // Graphique
  const Hvals=pts.map(p=>p.H); const Hmin=Math.min(...Hvals), Hmax=Math.max(...Hvals);
  const curve=Array.from({length:50},(_,i)=>{const h=Hmin+i*(Hmax-Hmin)/49;return{x:R(a*Math.pow(h-H0,b),3),y:h};});
  mkChart('chart_tar',{type:'scatter',data:{datasets:[
    {label:'Points jaugés',data:pts.map(p=>({x:p.Q,y:p.H})),backgroundColor:'#1565c0',pointRadius:7},
    {label:'Courbe ajustée',data:curve,type:'line',borderColor:'#dc2626',pointRadius:0,tension:0.3}
  ]},options:{scales:{x:{title:{display:true,text:'Débit Q (m³/s)'}},y:{title:{display:true,text:'Hauteur H (m)'}}},plugins:{legend:{position:'bottom'}}}});
}

// ═══════════════════════════════════════════════════════
// C05 — MUSKINGUM
// ═══════════════════════════════════════════════════════
function calcMuskingum(){
  clrErr('msk_err');
  const K=parseFloat($('msk_K').value), X=parseFloat($('msk_X').value), dt=parseFloat($('msk_dt').value);
  const I=parseD($('msk_I').value);
  if([K,X,dt].some(isNaN)||K<=0||X<0||X>0.5||dt<=0){showErr('msk_err','K>0, 0≤X≤0,5, Δt>0.');return;}
  if(I.length<3){showErr('msk_err','Minimum 3 valeurs pour l\'hydrogramme entrant.');return;}
  if(2*K*X>=dt||dt>=2*K*(1-X)){showErr('msk_err',`Condition non vérifiée : 2KX(${R(2*K*X,2)}) < Δt(${dt}) < 2K(1-X)(${R(2*K*(1-X),2)}). Ajuster K, X ou Δt.`);return;}
  const C0=(dt-2*K*X)/(2*K*(1-X)+dt);
  const C1=(dt+2*K*X)/(2*K*(1-X)+dt);
  const C2=(2*K*(1-X)-dt)/(2*K*(1-X)+dt);
  const O=[I[0]]; // O1 = I1 (état initial)
  for(let i=1;i<I.length;i++) O.push(R(C0*I[i]+C1*I[i-1]+C2*O[i-1],3));
  const Qpin=Math.max(...I), Qpout=Math.max(...O);
  $('msk_C0').textContent=R(C0,4); $('msk_C1').textContent=R(C1,4); $('msk_C2').textContent=R(C2,4);
  $('msk_Qpin').textContent=Qpin+' m³/s'; $('msk_Qpout').textContent=R(Qpout,3)+' m³/s';
  $('msk_ecr').textContent=R((1-Qpout/Qpin)*100,1)+'%';
  $('msk_interp').innerHTML=`Écrêtement de <strong>${R((1-Qpout/Qpin)*100,1)}%</strong>. Qp sortant = ${R(Qpout,3)} m³/s (entrant : ${Qpin}). C₀+C₁+C₂ = ${R(C0+C1+C2,4)} (doit = 1).`;
  showR('msk_res');
  addHist('Muskingum', `Qpout=${R(Qpout,3)} m³/s, écrêt.=${R((1-Qpout/Qpin)*100,1)}%`);
  const labels=I.map((_,i)=>R(i*dt,1));
  mkChart('chart_msk',{type:'line',data:{labels,datasets:[
    {label:'Hydrogramme entrant I(t)',data:I,borderColor:'#1565c0',backgroundColor:'rgba(21,101,192,.1)',fill:true,tension:0.4,pointRadius:3},
    {label:'Hydrogramme sortant O(t)',data:O,borderColor:'#dc2626',backgroundColor:'rgba(220,38,38,.08)',fill:true,tension:0.4,pointRadius:3}
  ]},options:{scales:{x:{title:{display:true,text:'Temps (h)'}},y:{title:{display:true,text:'Q (m³/s)'}}},plugins:{legend:{position:'bottom'}}}});
}

// ═══════════════════════════════════════════════════════
// C06 — GUMBEL
// ═══════════════════════════════════════════════════════
function calcGumbel(){
  clrErr('g_err');
  const data=parseD($('g_data').value);
  if(data.length<5){showErr('g_err','Minimum 5 valeurs requises.');return;}
  const n=data.length, mean=data.reduce((a,b)=>a+b)/n;
  const std=Math.sqrt(data.reduce((a,b)=>a+(b-mean)**2,0)/(n-1));
  const alpha=std*Math.sqrt(6)/Math.PI, u=mean-0.5772*alpha;
  const sorted=[...data].sort((a,b)=>a-b);
  let Dn=0;
  sorted.forEach((x,i)=>{const Fe=(i+1)/n,Ft=Math.exp(-Math.exp(-(x-u)/alpha));Dn=Math.max(Dn,Math.abs(Fe-Ft));});
  const Dcrit=R(1.36/Math.sqrt(n),4), ok=Dn<parseFloat(Dcrit);
  $('g_n').textContent=n; $('g_mean').textContent=R(mean,2); $('g_std').textContent=R(std,2);
  $('g_u').textContent=R(u,3); $('g_alpha').textContent=R(alpha,3);
  $('g_ks').textContent=`Dn=${R(Dn,4)} ${ok?'< ✅':'> ❌'} Dcrit=${Dcrit}`;
  const periods=[2,5,10,20,50,100,200,1000], tbody=$('g_tbody');
  tbody.innerHTML='';
  periods.forEach(T=>{const yT=-Math.log(-Math.log(1-1/T)),XT=R(u+alpha*yT,2);tbody.innerHTML+=`<tr><td>${T}</td><td>${R(yT,3)}</td><td><strong>${XT}</strong></td></tr>`;});
  $('g_interp').innerHTML=ok?`✅ Loi Gumbel <strong>acceptée</strong> (Dn=${R(Dn,4)} < Dcrit=${Dcrit}).`:`⚠️ Loi Gumbel <strong>rejetée</strong> au seuil 5%. Essayer Log-Normale ou Pearson III.`;
  showR('g_res');
  addHist('Loi de Gumbel', `u=${R(u,3)}, α=${R(alpha,3)}, Q100=${R(u+alpha*(-Math.log(-Math.log(0.99))),2)}`);
  const yVals=sorted.map((_,i)=>-Math.log(-Math.log((i+1)/(n+1))));
  mkChart('chart_g',{type:'scatter',data:{datasets:[
    {label:'Données observées',data:sorted.map((x,i)=>({x:yVals[i],y:x})),backgroundColor:'#1565c0',pointRadius:5},
    {label:'Droite de Gumbel',data:[{x:-2,y:u-2*alpha},{x:8,y:u+8*alpha}],type:'line',borderColor:'#dc2626',borderDash:[5,3],pointRadius:0}
  ]},options:{scales:{x:{title:{display:true,text:'Variable réduite y'}},y:{title:{display:true,text:'X(T)'}}},plugins:{legend:{position:'bottom'}}}});
}

// ═══════════════════════════════════════════════════════
// C07 — LOI NORMALE / LOG-NORMALE
// ═══════════════════════════════════════════════════════
function calcNormale(){
  clrErr('n_err');
  const data=parseD($('n_data').value), law=$('n_law').value;
  if(data.length<5){showErr('n_err','Minimum 5 valeurs.');return;}
  const work=law==='lognormal'?data.map(x=>Math.log(x)):data;
  const n=work.length, mu=work.reduce((a,b)=>a+b)/n;
  const sigma=Math.sqrt(work.reduce((a,b)=>a+(b-mu)**2,0)/(n-1));
  const sorted=[...data].sort((a,b)=>a-b);
  const sortedW=law==='lognormal'?sorted.map(Math.log):sorted;
  let Dn=0;
  sortedW.forEach((x,i)=>{const Fe=(i+1)/(n+1),Ft=normCDF((x-mu)/sigma);Dn=Math.max(Dn,Math.abs(Fe-Ft));});
  const Dcrit=R(1.36/Math.sqrt(n),4), ok=Dn<parseFloat(Dcrit);
  $('n_lawname').textContent=law==='lognormal'?'Log-Normale':'Normale';
  $('n_mu').textContent=R(mu,3); $('n_sigma').textContent=R(sigma,3);
  $('n_ks').textContent=`Dn=${R(Dn,4)} ${ok?'< ✅':'> ❌'} Dcrit=${Dcrit}`;
  const periods=[2,5,10,20,50,100], tbody=$('n_tbody');
  tbody.innerHTML='';
  periods.forEach(T=>{const z=normINV(1-1/T),XT=law==='lognormal'?R(Math.exp(mu+sigma*z),2):R(mu+sigma*z,2);tbody.innerHTML+=`<tr><td>${T}</td><td>${R(z,3)}</td><td><strong>${XT}</strong></td></tr>`;});
  $('n_interp').innerHTML=ok?`✅ Loi ${law==='lognormal'?'Log-Normale':'Normale'} <strong>acceptée</strong>.`:`⚠️ Loi rejetée au seuil 5%.`;
  showR('n_res');
  addHist('Loi '+(law==='lognormal'?'Log-Normale':'Normale'), `μ=${R(mu,2)}, σ=${R(sigma,2)}`);
  const mn=Math.min(...data),mx=Math.max(...data),nb=Math.max(7,Math.ceil(Math.sqrt(n)));
  const bw=(mx-mn)/nb; const counts=Array(nb).fill(0);
  data.forEach(x=>{const b=Math.min(Math.floor((x-mn)/bw),nb-1);counts[b]++;});
  const normY=counts.map((_,i)=>{const x=mn+(i+0.5)*bw,xw=law==='lognormal'&&x>0?Math.log(x):x,pd=(1/(sigma*Math.sqrt(2*Math.PI)))*Math.exp(-0.5*((xw-mu)/sigma)**2);return R(n*bw*(law==='lognormal'&&x>0?pd/x:pd),2);});
  mkChart('chart_n',{type:'bar',data:{labels:counts.map((_,i)=>R(mn+i*bw+bw/2,1)),datasets:[
    {label:'Fréquences',data:counts,backgroundColor:'rgba(21,101,192,.35)',borderColor:'#1565c0',borderWidth:1},
    {label:'Densité théorique',data:normY,type:'line',borderColor:'#dc2626',pointRadius:0,tension:0.4,borderWidth:2}
  ]},options:{scales:{x:{title:{display:true,text:'Valeur'}},y:{title:{display:true,text:'Effectif'}}},plugins:{legend:{position:'bottom'}}}});
}

// ═══════════════════════════════════════════════════════
// C08 — STATISTIQUES DESCRIPTIVES
// ═══════════════════════════════════════════════════════
function calcStats(){
  clrErr('s_err');
  const data=parseD($('s_data').value);
  if(data.length<2){showErr('s_err','Minimum 2 valeurs.');return;}
  const n=data.length, mean=data.reduce((a,b)=>a+b)/n;
  const sorted=[...data].sort((a,b)=>a-b);
  const variance=data.reduce((a,b)=>a+(b-mean)**2,0)/(n-1);
  const std=Math.sqrt(variance), cv=R(std/mean*100,2);
  const cs=R(data.reduce((a,b)=>a+(b-mean)**3,0)/(n*std**3),3);
  const ck=R(data.reduce((a,b)=>a+(b-mean)**4,0)/(n*std**4),3);
  const med=n%2===0?(sorted[n/2-1]+sorted[n/2])/2:sorted[Math.floor(n/2)];
  const q1=sorted[Math.floor(n*0.25)], q3=sorted[Math.floor(n*0.75)];
  const name=$('s_name').value||'Série';
  $('s_title').textContent='📊 '+name;
  $('s_n').textContent=n;
  $('s_mean').textContent=R(mean,3)+' / '+R(med,3);
  $('s_std').textContent=R(std,3)+' / '+R(variance,2);
  $('s_cv').textContent=cv+'%';
  $('s_cs').textContent=cs+' / '+ck;
  $('s_mm').textContent=R(sorted[0],2)+' / '+R(sorted[n-1],2);
  $('s_qq').textContent=R(q1,2)+' / '+R(q3,2)+' / '+R(q3-q1,2);
  let msg=`<strong>${name}</strong> (n=${n}) : x̄=${R(mean,2)}, Cv=${cv}%`;
  if(cv<15)msg+=' → série <strong>homogène</strong>.';
  else if(cv<30)msg+=' → variabilité <strong>modérée</strong>.';
  else msg+=' → <strong>forte irrégularité</strong>.';
  $('s_interp').innerHTML=msg;
  showR('s_res');
  addHist('Statistiques — '+name, `x̄=${R(mean,2)}, Cv=${cv}%`);
  const mn=sorted[0],mx=sorted[n-1],nb=Math.max(6,Math.ceil(Math.sqrt(n)));
  const bw=(mx-mn)/nb; const counts=Array(nb).fill(0);
  data.forEach(x=>{const b=Math.min(Math.floor((x-mn)/bw),nb-1);counts[b]++;});
  mkChart('chart_s',{type:'bar',data:{labels:counts.map((_,i)=>R(mn+i*bw+bw/2,1)),datasets:[{label:'Effectif',data:counts,backgroundColor:'rgba(21,101,192,.4)',borderColor:'#1565c0',borderWidth:1}]},
    options:{scales:{x:{title:{display:true,text:'Valeur'}},y:{title:{display:true,text:'Effectif'}}},plugins:{legend:{display:false}}}});
}

// ═══════════════════════════════════════════════════════
// C09 — THORNTHWAITE
// ═══════════════════════════════════════════════════════
(function buildTH(){
  const c=$('th_inputs');
  MOIS.forEach((m,i)=>{c.innerHTML+=`<div class="mgi"><label>${m}</label>
    <input class="if" id="tT${i}" type="number" step="0.1" placeholder="T°C" style="margin-bottom:.25rem"/>
    <input class="if" id="tP${i}" type="number" step="0.1" min="0" placeholder="P mm"/></div>`;});
})();
function calcTH(){
  clrErr('th_err');
  const lat=parseFloat($('th_lat').value);
  if(isNaN(lat)||lat<-90||lat>90){showErr('th_err','Latitude invalide.');return;}
  const T=[],P=[];
  for(let i=0;i<12;i++){const t=parseFloat($('tT'+i).value),p=parseFloat($('tP'+i).value);if(isNaN(t)||isNaN(p)||p<0){showErr('th_err','Données manquantes — '+MOIS[i]+'.');return;}T.push(t);P.push(p);}
  const I=T.reduce((s,t)=>s+(t>0?Math.pow(t/5,1.514):0),0);
  const a=6.75e-7*I**3-7.71e-5*I**2+1.792e-2*I+0.49239;
  const RU_MAX=100; let RU=RU_MAX;
  const res=[]; let totP=0,totETP=0,totETR=0;
  for(let i=0;i<12;i++){
    const t=T[i],p=P[i],d=JOURS[i],N=photoper(lat,i);
    const ETP_nc=t>0?16*Math.pow(10*t/I,a):0;
    const ETP=Math.max(0,R(ETP_nc*(N/360)*(d/30),1));
    let ETR;
    if(p>=ETP){const exc=p-ETP,fill=Math.min(exc,RU_MAX-RU);RU=Math.min(RU_MAX,RU+fill);ETR=ETP;}
    else{const need=ETP-p,drain=Math.min(RU,need);ETR=R(p+drain,1);RU=Math.max(0,RU-drain);}
    ETR=Math.min(R(ETR,1),ETP);
    totP+=p;totETP+=ETP;totETR+=ETR;
    res.push({m:MOIS[i],T:t,P:p,ETP,ETR,bil:R(p-ETR,1)});
  }
  $('th_P').textContent=R(totP,1)+' mm'; $('th_ETP').textContent=R(totETP,1)+' mm';
  $('th_ETR').textContent=R(totETR,1)+' mm'; $('th_def').textContent=R(totETP-totETR,1)+' mm';
  $('th_exc').textContent=R(Math.max(0,totP-totETR),1)+' mm'; $('th_I').textContent=R(I,2);
  const tbody=$('th_tbody'); tbody.innerHTML='';
  res.forEach(r=>{const c=r.bil>=0?'#86efac':'#fca5a5';tbody.innerHTML+=`<tr><td>${r.m}</td><td>${r.T}</td><td>${r.P}</td><td>${r.ETP}</td><td>${r.ETR}</td><td style="color:${c};font-weight:700">${r.bil>=0?'+'+r.bil:r.bil}</td></tr>`;});
  const sec=res.filter(r=>r.P<r.ETP).length;
  $('th_interp').innerHTML=`<strong>${sec} mois déficitaires</strong>/an. Déficit = <strong>${R(totETP-totETR,1)} mm</strong>. ETR/ETP = ${R(totETR/totETP*100,1)}%.`;
  showR('th_res');
  addHist('Thornthwaite', `P=${R(totP,1)}mm, ETP=${R(totETP,1)}mm, Déf=${R(totETP-totETR,1)}mm`);
  mkChart('chart_th',{type:'bar',data:{labels:MOIS,datasets:[
    {label:'P (mm)',data:res.map(r=>r.P),backgroundColor:'rgba(33,150,243,.4)',borderColor:'#2196f3',borderWidth:1,yAxisID:'y'},
    {label:'ETP (mm)',data:res.map(r=>r.ETP),type:'line',borderColor:'#dc2626',backgroundColor:'rgba(220,38,38,.08)',fill:true,tension:0.4,pointRadius:3,yAxisID:'y'},
    {label:'ETR (mm)',data:res.map(r=>r.ETR),type:'line',borderColor:'#16a34a',tension:0.4,pointRadius:3,borderDash:[5,3],yAxisID:'y'},
    {label:'T°C',data:res.map(r=>r.T),type:'line',borderColor:'#d97706',tension:0.4,pointRadius:3,yAxisID:'y2'}
  ]},options:{scales:{y:{title:{display:true,text:'mm'}},y2:{position:'right',title:{display:true,text:'°C'},grid:{drawOnChartArea:false}}},plugins:{legend:{position:'bottom'}}}});
}
function rstTH(){
  $('th_lat').value='';
  for(let i=0;i<12;i++){$('tT'+i).value='';$('tP'+i).value='';}
  $('th_res')?.classList.remove('show');
  const cw=$('cw_th');if(cw){cw.classList.remove('show');const c=cw.querySelector('canvas');if(c&&chartInst[c.id]){chartInst[c.id].destroy();delete chartInst[c.id];}}
  clrErr('th_err');
}

// ═══════════════════════════════════════════════════════
// C10 — BILAN DE TURC
// ═══════════════════════════════════════════════════════
(function buildTurc(){
  const c=$('turc_inputs');
  MOIS.forEach((m,i)=>{c.innerHTML+=`<div class="mgi"><label>${m}</label>
    <input class="if" id="tuT${i}" type="number" step="0.1" placeholder="T°C" style="margin-bottom:.22rem"/>
    <input class="if" id="tuR${i}" type="number" step="1" min="0" placeholder="Rg" style="margin-bottom:.22rem"/>
    <input class="if" id="tuH${i}" type="number" step="1" min="0" max="100" placeholder="HR%"/></div>`;});
})();
function calcTurc(){
  clrErr('turc_err');
  const res=[]; let totETP=0;
  for(let i=0;i<12;i++){
    const T=parseFloat($('tuT'+i).value), Rg=parseFloat($('tuR'+i).value), HR=parseFloat($('tuH'+i).value);
    if([T,Rg,HR].some(isNaN)||T<0||Rg<0||HR<0||HR>100){showErr('turc_err','Données manquantes ou invalides — '+MOIS[i]+'.');return;}
    let ETP;
    if(HR>=50){ ETP=0.4*(T/(T+15))*(Rg+50); }
    else { ETP=0.4*(T/(T+15))*(Rg+50)*(1+(50-HR)/70); }
    ETP=Math.max(0,R(ETP,1));
    totETP+=ETP;
    res.push({m:MOIS[i],T,Rg,HR,ETP});
  }
  const tbody=$('turc_tbody'); tbody.innerHTML='';
  res.forEach(r=>{tbody.innerHTML+=`<tr><td>${r.m}</td><td>${r.T}</td><td>${r.Rg}</td><td>${r.HR}</td><td><strong>${r.ETP}</strong></td></tr>`;});
  $('turc_interp').innerHTML=`ETP annuelle totale (Turc) = <strong>${R(totETP,1)} mm</strong>. Moyenne mensuelle = ${R(totETP/12,1)} mm/mois.`;
  showR('turc_res');
  addHist('ETP Turc', `ETP annuelle = ${R(totETP,1)} mm`);
  mkChart('chart_turc',{type:'bar',data:{labels:MOIS,datasets:[{label:'ETP Turc (mm)',data:res.map(r=>r.ETP),backgroundColor:'rgba(217,119,6,.4)',borderColor:'#d97706',borderWidth:1}]},
    options:{scales:{y:{title:{display:true,text:'ETP (mm)'}}},plugins:{legend:{display:false}}}});
}
function rstTurc(){
  for(let i=0;i<12;i++){$('tuT'+i).value='';$('tuR'+i).value='';$('tuH'+i).value='';}
  $('turc_res')?.classList.remove('show');
  const cw=$('cw_turc');if(cw){cw.classList.remove('show');const c=cw.querySelector('canvas');if(c&&chartInst[c.id]){chartInst[c.id].destroy();delete chartInst[c.id];}}
  clrErr('turc_err');
}

// ═══════════════════════════════════════════════════════
// C11 — MANNING-STRICKLER
// ═══════════════════════════════════════════════════════
function updateMS(){
  const s=$('ms_shape').value, c=$('ms_fields');
  if(s==='rect'){ c.innerHTML=`<div class="ig"><label class="il">Largeur b <span>(m)</span></label><input class="if" id="ms_b" type="number" min="0.01" step="0.01" placeholder="ex : 3.0"/></div><div class="ig"><label class="il">Hauteur d'eau h <span>(m)</span></label><input class="if" id="ms_h" type="number" min="0.01" step="0.01" placeholder="ex : 1.2"/></div>`; }
  else if(s==='trap'){ c.innerHTML=`<div class="ig"><label class="il">Largeur au fond b <span>(m)</span></label><input class="if" id="ms_b" type="number" min="0.01" step="0.01" placeholder="ex : 2.0"/></div><div class="ig"><label class="il">Hauteur d'eau h <span>(m)</span></label><input class="if" id="ms_h" type="number" min="0.01" step="0.01" placeholder="ex : 1.0"/></div><div class="ig"><label class="il">Fruit m <span>(h/v)</span></label><input class="if" id="ms_m" type="number" min="0" step="0.1" placeholder="ex : 1.5"/></div>`; }
  else{ c.innerHTML=`<div class="ig"><label class="il">Diamètre D <span>(m)</span></label><input class="if" id="ms_D" type="number" min="0.01" step="0.01" placeholder="ex : 0.8"/></div><div class="ig"><label class="il">Hauteur d'eau h <span>(m, h≤D)</span></label><input class="if" id="ms_h" type="number" min="0.01" step="0.01" placeholder="ex : 0.6"/></div>`; }
}
updateMS();
function calcMS(){
  clrErr('ms_err');
  const K=parseFloat($('ms_K').value), I=parseFloat($('ms_I').value), shape=$('ms_shape').value;
  if(isNaN(K)||isNaN(I)||K<=0||I<=0){showErr('ms_err','K > 0 et I > 0 requis.');return;}
  let A,Pm;
  if(shape==='rect'){const b=parseFloat($('ms_b').value),h=parseFloat($('ms_h').value);if(isNaN(b)||isNaN(h)||b<=0||h<=0){showErr('ms_err','b et h invalides.');return;}A=b*h;Pm=b+2*h;}
  else if(shape==='trap'){const b=parseFloat($('ms_b').value),h=parseFloat($('ms_h').value),m=parseFloat($('ms_m').value)||0;if(isNaN(b)||isNaN(h)||b<=0||h<=0){showErr('ms_err','Paramètres invalides.');return;}A=(b+m*h)*h;Pm=b+2*h*Math.sqrt(1+m**2);}
  else{const D=parseFloat($('ms_D').value),h=parseFloat($('ms_h').value);if(isNaN(D)||isNaN(h)||D<=0||h<=0||h>D){showErr('ms_err','h ≤ D requis.');return;}const theta=2*Math.acos((D/2-h)/(D/2));A=(D**2/8)*(theta-Math.sin(theta));Pm=(D/2)*theta;}
  const Rh=A/Pm, V=K*Math.pow(Rh,2/3)*Math.sqrt(I), Q=R(A*V,3);
  $('ms_Q').textContent=Q+' m³/s'; $('ms_A').textContent=R(A,3)+' m²';
  $('ms_Pm').textContent=R(Pm,3)+' m'; $('ms_R').textContent=R(Rh,3)+' m';
  $('ms_V').textContent=R(V,3)+' m/s';
  const Fr=R(V/Math.sqrt(9.81*Rh),3);
  $('ms_Fr').textContent=Fr+' ('+(Fr<1?'fluvial':Fr>1?'torrentiel':'critique')+')';
  $('ms_interp').innerHTML=`Q = <strong>${Q} m³/s</strong>, V = ${R(V,3)} m/s, Fr = ${Fr} → écoulement <strong>${Fr<1?'fluvial':Fr>1?'torrentiel':'critique'}</strong>.`;
  showR('ms_res');
  addHist('Manning-Strickler', `Q = ${Q} m³/s, V = ${R(V,3)} m/s`);
}
function rstMS(){
  $('ms_K').value=''; $('ms_I').value='';
  $('ms_fields').querySelectorAll('input').forEach(i=>i.value='');
  $('ms_res')?.classList.remove('show'); clrErr('ms_err');
}

// ═══════════════════════════════════════════════════════
// C12 — REYNOLDS
// ═══════════════════════════════════════════════════════
function calcReynolds(){
  clrErr('re_err');
  const V=parseFloat($('re_V').value), D=parseFloat($('re_D').value), T=parseFloat($('re_T').value);
  if([V,D,T].some(isNaN)||V<=0||D<=0||T<0){showErr('re_err','V > 0, D > 0, T ≥ 0.');return;}
  // Viscosité cinématique de l'eau (m²/s) selon la température
  const nu = (1.79e-6)/(1+0.0337*T+0.000221*T**2);
  const Re=R(V*D/nu,0);
  $('re_Re').textContent=parseFloat(Re).toLocaleString('fr-FR');
  $('re_nu').textContent=nu.toExponential(3)+' m²/s';
  let regime;
  if(Re<2000)regime='🟢 Laminaire (Re < 2000)';
  else if(Re<4000)regime='🟡 Transitoire (2000 < Re < 4000)';
  else regime='🔴 Turbulent (Re > 4000)';
  $('re_regime').textContent=regime;
  $('re_interp').innerHTML=`Re = <strong>${parseFloat(Re).toLocaleString('fr-FR')}</strong> → écoulement <strong>${Re<2000?'laminaire':Re<4000?'transitoire':'turbulent'}</strong>. ν(${T}°C) = ${nu.toExponential(3)} m²/s.`;
  showR('re_res');
  addHist('Reynolds', `Re = ${parseFloat(Re).toLocaleString('fr-FR')}`);
}

// ═══════════════════════════════════════════════════════
// C13 — CANAL OPTIMAL
// ═══════════════════════════════════════════════════════
function calcCanalOpt(){
  clrErr('co_err');
  const Q=parseFloat($('co_Q').value), K=parseFloat($('co_K').value), I=parseFloat($('co_I').value), type=$('co_type').value;
  if([Q,K,I].some(isNaN)||Q<=0||K<=0||I<=0){showErr('co_err','Q, K, I > 0 requis.');return;}
  // Résoudre Q = K·A·R^(2/3)·√I avec section optimale
  // Méthode itérative (Newton) sur h
  let m=0; if(type==='trap1')m=1; else if(type==='trap15')m=1.5;
  // Section optimale : rect b=2h, trap b=2h(√(1+m²)-m)
  const bFactor = type==='rect' ? 2 : 2*(Math.sqrt(1+m*m)-m);
  // Q = K · (bFactor·h²+m·h²)^(5/3) / (bFactor·h+2h√(1+m²))^(2/3) · √I
  // Résolution numérique
  let h=0.5;
  for(let iter=0;iter<200;iter++){
    const b=bFactor*h;
    const A=(b+m*h)*h;
    const Pm=b+2*h*Math.sqrt(1+m*m);
    const Qcalc=K*A*Math.pow(A/Pm,2/3)*Math.sqrt(I);
    if(Math.abs(Qcalc-Q)<0.0001)break;
    h*=Math.pow(Q/Qcalc,0.4);
  }
  const b=R(bFactor*h,3); h=R(h,3);
  const A=(parseFloat(b)+m*parseFloat(h))*parseFloat(h);
  const Pm=parseFloat(b)+2*parseFloat(h)*Math.sqrt(1+m*m);
  const Rh=A/Pm, V=K*Math.pow(Rh,2/3)*Math.sqrt(I), Qv=R(A*V,3);
  $('co_h').textContent=h+' m'; $('co_b').textContent=b+' m';
  $('co_A').textContent=R(A,3)+' m²'; $('co_Pm').textContent=R(Pm,3)+' m';
  $('co_R').textContent=R(Rh,3)+' m'; $('co_V').textContent=R(V,3)+' m/s';
  $('co_Qv').textContent=Qv+' m³/s ✅';
  $('co_interp').innerHTML=`Section <strong>${type==='rect'?'rectangulaire':type==='trap1'?'trapézoïdale (m=1)':'trapézoïdale (m=1,5)'}</strong> optimale : h=${h} m, b=${b} m. Vérification Q = ${Qv} m³/s.`;
  showR('co_res');
  addHist('Canal optimal', `h=${h}m, b=${b}m, Q=${Qv}m³/s`);
}

// ═══════════════════════════════════════════════════════
// C14 — RECHARGE NAPPES (BILAN CHLORURE)
// ═══════════════════════════════════════════════════════
function calcRecharge(){
  clrErr('rc_err');
  const P=parseFloat($('rc_P').value), Cp=parseFloat($('rc_Cp').value), Ce=parseFloat($('rc_Ce').value), A=parseFloat($('rc_A').value)||0;
  if([P,Cp,Ce].some(isNaN)||P<=0||Cp<=0||Ce<=Cp){showErr('rc_err','P>0, Cp>0, Ce>Cp (la nappe doit être plus concentrée que les pluies).');return;}
  const Rech=R(P*Cp/Ce,1);
  const pct=R(Rech/P*100,1);
  const vol=A>0?R(Rech*A*1e6/1000/1e6,3):null; // Mm³/an
  const fcl=R(Ce/Cp,1);
  $('rc_R').textContent=Rech+' mm/an';
  $('rc_pct').textContent=pct+'% des précipitations';
  $('rc_vol').textContent=vol?vol+' Mm³/an':'— (superficie non renseignée)';
  $('rc_fcl').textContent=fcl+' (Ce/Cp)';
  $('rc_interp').innerHTML=`Recharge de la nappe = <strong>${Rech} mm/an</strong> (${pct}% de P=${P} mm). Le facteur de concentration Cl = ${fcl} signifie que l'évapotranspiration concentre ${fcl}x le chlorure avant infiltration.`;
  showR('rc_res');
  addHist('Recharge nappes (Chlorure)', `R = ${Rech} mm/an (${pct}%)`);
}

// ═══════════════════════════════════════════════════════
// C15 — GRAVELIUS
// ═══════════════════════════════════════════════════════
function calcGravelius(){
  clrErr('gr_err');
  const A=parseFloat($('gr_A').value), P=parseFloat($('gr_P').value),
        Zmax=parseFloat($('gr_Zmax').value), Zmin=parseFloat($('gr_Zmin').value), L=parseFloat($('gr_L').value);
  if([A,P,Zmax,Zmin,L].some(isNaN)||A<=0||P<=0||Zmax<=Zmin||L<=0){showErr('gr_err','Tous les champs requis et Zmax > Zmin.');return;}
  const Kc=R(0.28*P/Math.sqrt(A),3);
  const disc=1-(1.12/Kc)**2;
  const Lr=R((Kc*Math.sqrt(A)/1.12)*(1+Math.sqrt(Math.max(0,disc))),2);
  const lr=R(A/Lr,2), dZ=Zmax-Zmin, Ig=R(dZ/(Lr*1000)*1000,3), Dd=R(L/A,3);
  $('gr_Kc').textContent=Kc; $('gr_Lr').textContent=Lr+' km';
  $('gr_lr').textContent=lr+' km'; $('gr_dZ').textContent=dZ+' m';
  $('gr_Ig').textContent=Ig+' m/km'; $('gr_Dd').textContent=Dd+' km/km²';
  let forme=Kc<1.25?'ramassé (quasi-circulaire)':Kc<1.5?'ovale-ramassé':Kc<1.75?'ovale-allongé':'très allongé';
  $('gr_interp').innerHTML=`Bassin <strong>${forme}</strong> (Kc=${Kc}). Dd=${Dd} km/km² (${Dd>2?'réseau dense':Dd>1?'modéré':'peu dense'}). Pente ${Ig>10?'forte':Ig>2?'modérée':'faible'} (${Ig} m/km).`;
  showR('gr_res');
  addHist('Gravelius', `Kc=${Kc} (${forme.split(' ')[0]}), Dd=${Dd}`);
}

// ═══════════════════════════════════════════════════════
// C16 — MAYER (CORRÉLATION & DROITE DE RÉGRESSION)
// ═══════════════════════════════════════════════════════
function calcMayer(){
  clrErr('m_err');
  const X=parseD($('m_X').value), Y=parseD($('m_Y').value);
  if(X.length<3||X.length!==Y.length){showErr('m_err','X et Y doivent avoir le même nombre de valeurs (min 3).');return;}
  const nx=$('m_nx').value||'X', ny=$('m_ny').value||'Y';
  const n=X.length;
  const {a,b,r,r2,se}=linReg(X,Y);

  // Valeurs prédites et résidus
  const Yhat=X.map(x=>a*x+b);
  const residus=Y.map((y,i)=>y-Yhat[i]);
  const meanX=X.reduce((s,v)=>s+v)/n;
  const Sxx=X.reduce((s,x)=>s+(x-meanX)**2,0);

  // Intervalle de confiance à 95% sur la droite
  // t(n-2, 0.975) approx
  const tVal = n>=30?1.96 : n>=20?2.086 : n>=15?2.145 : n>=10?2.228 : 2.571;

  // Résumé
  $('m_eq').textContent =`${ny} = ${R(a,4)} × ${nx} + ${R(b,3)}`;
  $('m_r').textContent  = R(r,4);
  $('m_r2').textContent = R(r2,4);
  $('m_a').textContent  = R(a,4)+` (pente)`;
  $('m_b').textContent  = R(b,3)+` (ordonnée à l'origine)`;

  // Interprétation
  let qual=Math.abs(r)>0.9?'très forte':Math.abs(r)>0.7?'forte':Math.abs(r)>0.5?'modérée':'faible';
  let sens=a>0?'positive':'négative';
  $('m_interp').innerHTML=
    `Corrélation <strong>${qual}</strong> ${sens} (r=${R(r,4)}, R²=${R(r2,4)}).`+
    ` Le modèle explique <strong>${R(r2*100,1)}%</strong> de la variance de ${ny}.`+
    ` Erreur standard des résidus : ${R(se,3)}.`+
    (Math.abs(r)<0.5?' ⚠️ Corrélation faible — relation linéaire peu fiable.':'');
  showR('m_res');
  addHist('Mayer — '+ny+'=f('+nx+')', `r=${R(r,4)}, R²=${R(r2,4)}, a=${R(a,4)}`);

  // ── GRAPHIQUE AMÉLIORÉ ──
  const mn=Math.min(...X), mx=Math.max(...X);
  const margin=(mx-mn)*0.05; // marge de 5% de chaque côté
  const xMin=mn-margin, xMax=mx+margin;

  // 50 points pour la droite de régression (lisse)
  const linePoints=Array.from({length:50},(_,i)=>{
    const x=xMin+i*(xMax-xMin)/49;
    return {x:R(x,4), y:R(a*x+b,4)};
  });

  // Bande de confiance à 95%
  const confUpper=Array.from({length:50},(_,i)=>{
    const x=xMin+i*(xMax-xMin)/49;
    const se_fit=se*Math.sqrt(1/n+(x-meanX)**2/Sxx);
    return {x:R(x,4), y:R(a*x+b+tVal*se_fit,4)};
  });
  const confLower=Array.from({length:50},(_,i)=>{
    const x=xMin+i*(xMax-xMin)/49;
    const se_fit=se*Math.sqrt(1/n+(x-meanX)**2/Sxx);
    return {x:R(x,4), y:R(a*x+b-tVal*se_fit,4)};
  });

  // Couleurs points selon résidu (rouge si |résidu| > 2*se)
  const ptColors=X.map((_,i)=>Math.abs(residus[i])>2*se?'rgba(220,38,38,.85)':'rgba(21,101,192,.75)');
  const ptBorders=X.map((_,i)=>Math.abs(residus[i])>2*se?'#dc2626':'#1565c0');

  mkChart('chart_m',{
    type:'scatter',
    data:{datasets:[
      // Bande de confiance (remplissage)
      {
        label:'IC 95%',
        data:confUpper,
        type:'line',
        borderColor:'rgba(220,38,38,.0)',
        backgroundColor:'rgba(220,38,38,.08)',
        fill:'+1',
        pointRadius:0,
        tension:0.1,
        order:3
      },
      {
        label:'_lower',
        data:confLower,
        type:'line',
        borderColor:'rgba(220,38,38,.0)',
        backgroundColor:'rgba(220,38,38,.08)',
        fill:false,
        pointRadius:0,
        tension:0.1,
        order:4
      },
      // Droite de régression
      {
        label:`Droite de Mayer : ${ny} = ${R(a,3)}·${nx} + ${R(b,2)}  (R²=${R(r2,3)})`,
        data:linePoints,
        type:'line',
        borderColor:'#dc2626',
        borderWidth:2.5,
        pointRadius:0,
        tension:0.1,
        order:2
      },
      // Nuage de points
      {
        label:`Données observées (n=${n})`,
        data:X.map((x,i)=>({x,y:Y[i]})),
        backgroundColor:ptColors,
        borderColor:ptBorders,
        borderWidth:1.5,
        pointRadius:7,
        pointHoverRadius:9,
        order:1
      }
    ]},
    options:{
      scales:{
        x:{title:{display:true,text:nx},grid:{color:'rgba(0,0,0,.06)'}},
        y:{title:{display:true,text:ny},grid:{color:'rgba(0,0,0,.06)'}}
      },
      plugins:{
        legend:{
          position:'bottom',
          labels:{
            filter: item => !item.text.startsWith('_'),
            font:{size:11}
          }
        },
        tooltip:{
          callbacks:{
            label: ctx => {
              if(ctx.dataset.label.startsWith('_')||ctx.dataset.label==='IC 95%') return null;
              if(ctx.dataset.label.startsWith('Droite')) return `Ŷ = ${R(ctx.parsed.y,3)}`;
              const i=ctx.dataIndex;
              return [`${nx} = ${X[i]}`, `${ny} = ${Y[i]}`, `Ŷ = ${R(Yhat[i],3)}`, `Résidu = ${R(residus[i],3)}`];
            }
          }
        }
      }
    }
  });
}

// ═══════════════════════════════════════════════════════
// C17 — COURBE DES DÉBITS CLASSÉS
// ═══════════════════════════════════════════════════════
function calcCDC(){
  clrErr('cdc_err');
  const data=parseD($('cdc_data').value);
  if(data.length<5){showErr('cdc_err','Minimum 5 valeurs.');return;}
  const sorted=[...data].sort((a,b)=>b-a);
  const n=sorted.length, moy=R(data.reduce((a,b)=>a+b)/n,3);
  const q10=sorted[Math.floor(n*0.10)], q50=sorted[Math.floor(n*0.50)], q90=sorted[Math.floor(n*0.90)];
  const irr=sorted[n-1]>0?R(sorted[0]/sorted[n-1],1):'∞';
  $('cdc_max').textContent=R(sorted[0],3)+' m³/s'; $('cdc_q10').textContent=R(q10,3)+' m³/s';
  $('cdc_q50').textContent=R(q50,3)+' m³/s'; $('cdc_moy').textContent=moy+' m³/s';
  $('cdc_q90').textContent=R(q90,3)+' m³/s'; $('cdc_min').textContent=R(sorted[n-1],3)+' m³/s';
  $('cdc_irr').textContent=irr;
  $('cdc_interp').innerHTML=`Q50% = <strong>${R(q50,3)} m³/s</strong> (médiane). Q90% = <strong>${R(q90,3)}</strong> (étiage). Irrégularité = <strong>${irr}</strong> → régime ${parseFloat(irr)<3?'<strong>régulier</strong>':parseFloat(irr)<10?'<strong>irrégulier</strong>':'<strong>très irrégulier</strong>'}.`;
  showR('cdc_res');
  addHist('CDC', `Q50%=${R(q50,3)}, Q90%=${R(q90,3)}, Irr=${irr}`);
  const pcts=sorted.map((_,i)=>(i/(n-1))*100);
  mkChart('chart_cdc',{type:'line',data:{datasets:[{label:`CDC — ${n} valeurs`,data:pcts.map((p,i)=>({x:R(p,1),y:sorted[i]})),borderColor:'#1565c0',backgroundColor:'rgba(21,101,192,.1)',fill:true,tension:0.3,pointRadius:0,borderWidth:2}]},
    options:{scales:{x:{type:'linear',min:0,max:100,title:{display:true,text:'Fréquence de dépassement (%)'}},y:{title:{display:true,text:'Q (m³/s)'}}},plugins:{legend:{display:false}}}});
}

// ═══════════════════════════════════════════════════════
// C18 — SPI
// ═══════════════════════════════════════════════════════
function calcSPI(){
  clrErr('spi_err');
  const data=parseD($('spi_data').value);
  if(data.length<5){showErr('spi_err','Minimum 5 valeurs.');return;}
  const n=data.length, mu=data.reduce((a,b)=>a+b)/n;
  const sigma=Math.sqrt(data.reduce((a,b)=>a+(b-mu)**2,0)/(n-1));
  const spi=data.map(p=>R((p-mu)/sigma,3));
  const dry=spi.filter(v=>v<-1).length, wet=spi.filter(v=>v>1).length;
  $('spi_n').textContent=n; $('spi_dry').textContent=dry+' ans'; $('spi_wet').textContent=wet+' ans';
  $('spi_min').textContent=R(Math.min(...spi),3); $('spi_max').textContent=R(Math.max(...spi),3);
  $('spi_interp').innerHTML=`<strong>${dry} années sèches</strong> (SPI<-1) et <strong>${wet} années humides</strong> (SPI>1) sur ${n} ans.`;
  showR('spi_res');
  addHist('SPI', `${dry} sèches, ${wet} humides sur ${n} ans`);
  const colors=spi.map(v=>v<-2?'#7f1d1d':v<-1?'#dc2626':v<0?'#fca5a5':v<1?'#bbf7d0':v<2?'#16a34a':'#14532d');
  mkChart('chart_spi',{type:'bar',data:{labels:spi.map((_,i)=>i+1),datasets:[{label:'SPI',data:spi,backgroundColor:colors,borderColor:colors,borderWidth:1}]},
    options:{scales:{x:{title:{display:true,text:'Année (rang)'}},y:{title:{display:true,text:'SPI'},min:-3,max:3}},plugins:{legend:{display:false}}}});
}

// ═══════════════════════════════════════════════════════
// C19 — PEARSON III
// ═══════════════════════════════════════════════════════
function calcPearson3(){
  clrErr('p3_err');
  const data=parseD($('p3_data').value);
  if(data.length<5){showErr('p3_err','Minimum 5 valeurs.');return;}
  const n=data.length, mean=data.reduce((a,b)=>a+b)/n;
  const std=Math.sqrt(data.reduce((a,b)=>a+(b-mean)**2,0)/(n-1));
  const cs=data.reduce((a,b)=>a+(b-mean)**3,0)/(n*std**3);
  $('p3_mean').textContent=R(mean,3); $('p3_std').textContent=R(std,3); $('p3_cs').textContent=R(cs,3);
  const periods=[2,5,10,20,50,100,200,1000];
  const tbody=$('p3_tbody'); tbody.innerHTML='';
  const qts=[];
  periods.forEach(T=>{const KT=R(wilsonHilferty(T,cs),3),XT=R(mean+KT*std,2);qts.push({T,XT});tbody.innerHTML+=`<tr><td>${T}</td><td>${KT}</td><td><strong>${XT}</strong></td></tr>`;});
  $('p3_interp').innerHTML=`Pearson III (Cs=${R(cs,3)}) : Q10=${qts[2].XT}, Q100=${qts[5].XT}, Q1000=${qts[7].XT}.`;
  showR('p3_res');
  addHist('Pearson III', `Cs=${R(cs,3)}, Q10=${qts[2].XT}, Q100=${qts[5].XT}`);
  const sorted=[...data].sort((a,b)=>a-b);
  const empX=sorted, empF=sorted.map((_,i)=>(i+1)/(n+1));
  const thX=Array.from({length:60},(_,i)=>Math.min(...data)+(Math.max(...data)-Math.min(...data))*i/59);
  const thF=thX.map(x=>normCDF((x-mean)/std));
  mkChart('chart_p3',{type:'line',data:{datasets:[
    {label:'F empirique',data:empX.map((x,i)=>({x,y:empF[i]})),borderColor:'#1565c0',pointRadius:5,showLine:false,backgroundColor:'#1565c0'},
    {label:'Pearson III théorique',data:thX.map((x,i)=>({x,y:thF[i]})),borderColor:'#dc2626',pointRadius:0,tension:0.4}
  ]},options:{scales:{x:{type:'linear',title:{display:true,text:'X(T)'}},y:{title:{display:true,text:'F(x)'},min:0,max:1}},plugins:{legend:{position:'bottom'}}}});
}

// ═══════════════════════════════════════════════════════
// C20 — JACOB (ESSAI DE POMPAGE)
// ═══════════════════════════════════════════════════════
function wTheis(u){
  // Fonction de puits W(u) par série tronquée (précise pour u<5)
  if(u<=0)return 0;
  if(u>5)return 0;
  return Math.max(0,-0.5772-Math.log(u)+u-u**2/4+u**3/18-u**4/96+u**5/600);
}
function calcJacob(){
  clrErr('jac_err');
  const Qh =parseFloat($('jac_Q').value);  // m³/h
  const r   =parseFloat($('jac_r').value); // m
  const T_h =parseFloat($('jac_T').value); // m²/h
  const S   =parseFloat($('jac_S').value);
  const t_h =parseFloat($('jac_t').value); // h
  if([Qh,r,T_h,S,t_h].some(isNaN)||Qh<=0||r<=0||T_h<=0||S<=0||t_h<=0){
    showErr('jac_err','Tous les champs sont requis et doivent être > 0.');return;
  }
  // Conversion SI
  const Q=Qh/3600, T=T_h/3600, t=t_h*3600;
  const u=r**2*S/(4*T*t);

  let s_val;
  if(u<0.05){
    // Approximation de Jacob (log)
    s_val=R(Math.max(0,(2.303*Q)/(4*Math.PI*T)*Math.log10(2.25*T*t/(r**2*S))),3);
  } else {
    s_val=R(Q/(4*Math.PI*T)*wTheis(u),3);
  }

  $('jac_s').textContent  = s_val+' m';
  $('jac_u').textContent  = R(u,6)+(u<0.05?' ✅ Jacob valide':' ⚠️ Theis recommandé');
  $('jac_Tms').textContent= T.toExponential(3)+' m²/s';
  $('jac_K').textContent  = '= T / épaisseur saturée (non fournie)';
  $('jac_interp').innerHTML=
    `s = <strong>${s_val} m</strong> à r=${r} m, t=${t_h} h. `+
    `u=${R(u,6)} → Jacob `+(u<0.05?'<strong>valide</strong>.':'<strong>limite</strong> — Theis pour plus de précision.')+
    ` T = ${T.toExponential(3)} m²/s.`;
  showR('jac_res');
  addHist('Jacob (pompage)',`s=${s_val}m, T=${T.toExponential(2)}m²/s`);

  // Courbe s = f(log t) — de 0.01h à 10000h
  const pts=[];
  for(let i=0;i<50;i++){
    const ti_h=Math.pow(10,-2+i*6/49); // 0.01h → 10000h
    const ti_s=ti_h*3600;
    const ui=r**2*S/(4*T*ti_s);
    let si;
    if(ui<0.05) si=Math.max(0,(2.303*Q)/(4*Math.PI*T)*Math.log10(2.25*T*ti_s/(r**2*S)));
    else si=Q/(4*Math.PI*T)*wTheis(ui);
    if(si>=0&&isFinite(si)) pts.push({x:R(Math.log10(ti_h),3),y:R(si,4)});
  }

  mkChart('chart_jac',{
    type:'line',
    data:{datasets:[
      {label:'Courbe de rabattement s=f(log t)',data:pts,borderColor:'#1565c0',backgroundColor:'rgba(21,101,192,.1)',fill:true,tension:0.4,pointRadius:0,borderWidth:2},
      {label:`t=${t_h}h → s=${s_val}m`,data:[{x:R(Math.log10(t_h),3),y:s_val}],backgroundColor:'#dc2626',pointRadius:10,borderColor:'#dc2626',showLine:false}
    ]},
    options:{
      scales:{
        x:{type:'linear',title:{display:true,text:'log(t)  [t en heures]'}},
        y:{title:{display:true,text:'Rabattement s (m)'},reverse:true}
      },
      plugins:{legend:{position:'bottom'}}
    }
  });
}

renderHist();