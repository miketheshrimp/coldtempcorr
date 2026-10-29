const HEIGHTS = [200, 300, 400, 500, 600, 700, 800, 900, 1000, 1500, 2000, 3000, 4000, 5000];
const TABLE = {
  10: [10,10,10,10,20,20,20,20,20,30,40,60,80,90],
  0: [20,20,30,30,40,40,50,50,60,90,120,170,230,280],
  '-10': [20,30,40,50,60,70,80,90,100,150,200,290,390,490],
  '-20': [30,50,60,70,90,100,120,130,140,210,280,420,570,710],
  '-30': [40,60,80,100,120,130,150,170,190,280,380,570,760,950],
  '-40': [50,80,100,120,150,170,190,220,240,360,480,720,970,1210],
  '-50': [60,90,120,150,180,210,240,270,300,450,590,890,1190,1500]
};
const TEMPS = [-50, -40, -30, -20, -10, 0, 10];
const initialRows = [
  ['IAF', 6200], ['Intermediate', 5400], ['FAF', 4200], ['Step-down 1', 3500],
  ['Step-down 2', 3000], ['MDA / DA', 2600], ['Missed approach', 4600], ['Holding', 6000]
];

const $ = (id) => document.getElementById(id);
const rowsEl = $('altitudeRows');
let lastResults = null;

function addAltitudeRow(label = '', altitude = '') {
  const row = document.createElement('div');
  row.className = 'altitude-row';
  row.innerHTML = `
    <input class="row-input label-input" type="text" maxlength="28" placeholder="e.g. FAF" value="${escapeHtml(String(label))}" aria-label="Altitude point label">
    <div class="altitude-wrap"><input class="row-input altitude-input" type="number" inputmode="numeric" step="1" placeholder="Altitude" value="${escapeHtml(String(altitude))}" aria-label="Published altitude in feet MSL"><span>FT</span></div>
    <button class="remove-row" type="button" aria-label="Remove altitude">×</button>`;
  row.querySelector('.remove-row').addEventListener('click', () => {
    if (rowsEl.children.length <= 8) {
      showValidation('Keep at least eight altitude entries.');
      return;
    }
    row.remove();
    updateRowCount();
  });
  rowsEl.appendChild(row);
  updateRowCount();
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function updateRowCount() { $('rowCount').textContent = rowsEl.children.length; }
function showValidation(message) { $('validation').textContent = message; $('validation').hidden = false; }
function clearValidation() { $('validation').hidden = true; }

function bracket(value, points) {
  if (value <= points[0]) return [points[0], points[1]];
  if (value >= points.at(-1)) return [points.at(-2), points.at(-1)];
  for (let i = 0; i < points.length - 1; i++) if (value >= points[i] && value <= points[i + 1]) return [points[i], points[i + 1]];
}

function lerp(x, x0, x1, y0, y1) { return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0); }

function correctionAt(temp, height) {
  if (height <= 0) return 0;
  const [t0, t1] = bracket(temp, TEMPS);
  const effectiveHeight = Math.max(0, height);
  if (effectiveHeight < 200) {
    const at200t0 = TABLE[t0][0];
    const at200t1 = TABLE[t1][0];
    return lerp(temp, t0, t1, at200t0, at200t1) * effectiveHeight / 200;
  }
  const [h0, h1] = bracket(effectiveHeight, HEIGHTS);
  const i0 = HEIGHTS.indexOf(h0), i1 = HEIGHTS.indexOf(h1);
  const atH0 = lerp(temp, t0, t1, TABLE[t0][i0], TABLE[t1][i0]);
  const atH1 = lerp(temp, t0, t1, TABLE[t0][i1], TABLE[t1][i1]);
  return lerp(effectiveHeight, h0, h1, atH0, atH1);
}

function formatFt(value) { return `${Math.round(value).toLocaleString()} ft`; }

function calculate() {
  clearValidation();
  const temp = Number($('temperature').value);
  const elevation = Number($('elevation').value);
  const rows = [...rowsEl.querySelectorAll('.altitude-row')].map((row, i) => ({
    label: row.querySelector('.label-input').value.trim() || `Point ${i + 1}`,
    altitude: Number(row.querySelector('.altitude-input').value)
  }));
  if (!Number.isFinite(temp) || temp > -1 || temp < -50) return showValidation('Airport temperature must be between −1°C and −50°C.');
  if (!Number.isFinite(elevation) || elevation < -1500 || elevation > 15000) return showValidation('Enter a valid airport elevation between −1,500 and 15,000 ft MSL.');
  if (rows.length < 8 || rows.some(r => !Number.isFinite(r.altitude))) return showValidation('Enter a published altitude for at least eight points.');
  if (rows.some(r => r.altitude < elevation)) return showValidation('Each procedure altitude must be at or above the airport elevation.');

  const computed = rows.map(r => {
    const height = r.altitude - elevation;
    const correction = correctionAt(temp, height);
    return {...r, height, correction, corrected: r.altitude + correction, trueUncorrected: Math.max(0, height - correction)};
  });
  const pathPoints = computed.filter(r => r.height > 0);
  const reference = pathPoints.find(r => /\bP?FAF\b/i.test(r.label)) || pathPoints.reduce((a, b) => b.height > a.height ? b : a, pathPoints[0]);
  const referenceRatio = reference ? reference.trueUncorrected / reference.height : 1;
  const actualAngle = Math.atan(Math.tan(3 * Math.PI / 180) * referenceRatio) * 180 / Math.PI;
  lastResults = { temp, elevation, computed, actualAngle, referenceLabel: reference?.label || 'profile' };
  renderResults(lastResults);
}

function renderResults(data) {
  $('emptyState').hidden = true;
  $('results').hidden = false;
  const max = data.computed.reduce((a, b) => b.correction > a.correction ? b : a, data.computed[0]);
  $('actualAngle').textContent = `${data.actualAngle.toFixed(2)}°`;
  $('shallowerBy').textContent = `${(3 - data.actualAngle).toFixed(2)}° shallower · based on ${data.referenceLabel}`;
  $('maxCorrection').textContent = `+${Math.round(max.correction)} ft`;
  $('maxCorrectionLabel').textContent = max.label;
  $('resultTemp').textContent = `${data.temp}°C`;
  $('resultElevation').textContent = `Field elevation ${formatFt(data.elevation)}`;
  $('resultsBody').innerHTML = data.computed.map(r => `<tr><td>${escapeHtml(r.label)}</td><td>${formatFt(r.altitude)}</td><td>${formatFt(r.height)}</td><td>+${Math.round(r.correction)} ft</td><td><strong>${formatFt(r.corrected)}</strong></td></tr>`).join('');
  const extrapolated = data.computed.some(r => r.height > 5000);
  $('methodNote').innerHTML = `<strong>Calculation note:</strong> Values are interpolated from the FAA/ICAO table and shown to the nearest foot. ${extrapolated ? 'One or more points exceed 5,000 ft AAE; those values use a linear extension of the final table interval, which the FAA permits as an optional extrapolation method. ' : ''}Operational rounding and which segments to correct must follow the applicable authority, chart, operator policy, and ATC instructions.`;
  $('chartNarrative').textContent = `At ${data.temp} degrees Celsius, the estimated uncompensated true descent angle referenced at ${data.referenceLabel} is ${data.actualAngle.toFixed(2)} degrees, ${(3-data.actualAngle).toFixed(2)} degrees shallower than the standard 3 degree path.`;
  requestAnimationFrame(() => drawChart(data));
  if (window.innerWidth < 1000) $('results').scrollIntoView({behavior: 'smooth', block: 'start'});
}

function drawChart(data) {
  const canvas = $('profileChart');
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const w = rect.width, h = rect.height;
  const pad = {l: 50, r: 18, t: 18, b: 34};
  const pw = w-pad.l-pad.r, ph = h-pad.t-pad.b;
  const maxHeight = Math.max(1000, ...data.computed.map(r => r.height));
  const maxNm = (maxHeight / Math.tan(3*Math.PI/180)) / 6076.12;
  ctx.font = '9px system-ui';
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,.09)';
  ctx.fillStyle = '#81939b';
  for (let i=0;i<=4;i++) {
    const y = pad.t + ph*i/4;
    ctx.beginPath(); ctx.moveTo(pad.l,y); ctx.lineTo(w-pad.r,y); ctx.stroke();
    const val = Math.round(maxHeight*(1-i/4));
    ctx.textAlign='right'; ctx.fillText(`${val.toLocaleString()}′`, pad.l-7, y+3);
  }
  for (let i=0;i<=4;i++) {
    const x = pad.l + pw*i/4;
    ctx.beginPath(); ctx.moveTo(x,pad.t); ctx.lineTo(x,h-pad.b); ctx.stroke();
    ctx.textAlign='center'; ctx.fillText(`${(maxNm*(1-i/4)).toFixed(1)} NM`, x, h-12);
  }
  const xAt = nm => pad.l + pw*(1-nm/maxNm);
  const yAt = ft => pad.t + ph*(1-ft/maxHeight);
  const gradient = ctx.createLinearGradient(0,pad.t,0,h-pad.b);
  gradient.addColorStop(0,'rgba(103,216,255,.18)'); gradient.addColorStop(1,'rgba(103,216,255,0)');
  ctx.beginPath();
  for (let i=0;i<=70;i++) {
    const nm=maxNm*(1-i/70), standard=nm*6076.12*Math.tan(3*Math.PI/180), correction=correctionAt(data.temp,standard), cold=Math.max(0,standard-correction);
    const x=xAt(nm), y=yAt(cold); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.lineTo(xAt(0),yAt(0)); ctx.closePath(); ctx.fillStyle=gradient; ctx.fill();
  function path(color, cold=false, dash=[]) {
    ctx.beginPath();
    for(let i=0;i<=70;i++){
      const nm=maxNm*(1-i/70), standard=nm*6076.12*Math.tan(3*Math.PI/180), ft=cold?Math.max(0,standard-correctionAt(data.temp,standard)):standard;
      const x=xAt(nm), y=yAt(ft); if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.strokeStyle=color; ctx.lineWidth=2.2; ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]);
  }
  path('#d8ff4f',false,[]); path('#67d8ff',true,[6,4]);
  ctx.fillStyle='#d8ff4f'; ctx.textAlign='left'; ctx.fillText('3.00° ISA',pad.l+8,pad.t+13);
  ctx.fillStyle='#67d8ff'; ctx.fillText(`${data.actualAngle.toFixed(2)}° cold`,pad.l+8,pad.t+27);
}

initialRows.forEach(([label, altitude]) => addAltitudeRow(label, altitude));
$('addRow').addEventListener('click', () => addAltitudeRow('', ''));
$('calculate').addEventListener('click', calculate);
$('loadExample').addEventListener('click', () => {
  $('temperature').value = -20; $('elevation').value = 1200; rowsEl.innerHTML=''; initialRows.forEach(([l,a])=>addAltitudeRow(l,a)); clearValidation();
});
$('printResults').addEventListener('click', () => window.print());
window.addEventListener('resize', () => { if (lastResults) drawChart(lastResults); });

async function setupOffline() {
  const status = $('offlineStatus');
  if (!('serviceWorker' in navigator)) { status.querySelector('span').textContent='Offline unsupported'; return; }
  try {
    await navigator.serviceWorker.register('./sw.js');
    await navigator.serviceWorker.ready;
    status.classList.add('ready');
    status.querySelector('span').textContent = navigator.onLine ? 'Offline ready' : 'Running offline';
    if (!navigator.onLine) status.classList.add('offline');
  } catch { status.querySelector('span').textContent='Offline setup failed'; }
}
window.addEventListener('online', () => { $('offlineStatus').classList.remove('offline'); $('offlineStatus').querySelector('span').textContent='Offline ready'; });
window.addEventListener('offline', () => { $('offlineStatus').classList.add('offline'); $('offlineStatus').querySelector('span').textContent='Running offline'; });
setupOffline();
