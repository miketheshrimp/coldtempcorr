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
const exampleRows = [
  ['IAF', 6200],
  ['IF', 5400],
  ['FAF', 4200],
  ['Step-down Fix', 3500],
  ['DA/MDA', 2600],
  ['GA ALT', 4600],
  ['Holding', 6000],
  ['MSA', 7000]
];
const initialRows = exampleRows.map(([label]) => [label, '']);
const STANDARD_GRADIENT = 0.052;
const FEET_PER_MINUTE_PER_KNOT = 6076.12 / 60;

const $ = (id) => document.getElementById(id);
const rowsEl = $('altitudeRows');
let lastResults = null;

function isMandatoryRowLabel(label) {
  const text = String(label).trim().toUpperCase();
  return text === 'FAF' || text === 'DA/MDA' || text === 'MAP' || text === 'MISSED APPROACH POINT';
}
function syncMandatoryRow(row) {
  const label = row.querySelector('.label-input').value;
  row.classList.toggle('mandatory-row', isMandatoryRowLabel(label));
}
function addAltitudeRow(label = '', altitude = '', active = String(altitude).trim() !== '') {
  const row = document.createElement('div');
  row.className = 'altitude-row';
  row.innerHTML = `
    <label class="toggle-wrap"><input class="row-toggle" type="checkbox" ${active ? 'checked' : ''} aria-label="Include this fix in calculations"><span class="toggle-ui" aria-hidden="true"></span></label>
    <input class="row-input label-input" type="text" maxlength="36" placeholder="e.g. FAF" value="${escapeHtml(String(label))}" aria-label="Altitude point label">
    <div class="altitude-wrap"><input class="row-input altitude-input" type="number" inputmode="numeric" step="1" placeholder="Altitude" value="${escapeHtml(String(altitude))}" aria-label="Published altitude in feet MSL"><span>FT</span></div>
    <button class="drag-handle" type="button" aria-label="Hold and drag to reorder; use Option plus arrow keys on a keyboard">⋮⋮</button>
    <button class="remove-row" type="button" aria-label="Remove altitude">×</button>`;
  const toggle = row.querySelector('.row-toggle');
  const altitudeInput = row.querySelector('.altitude-input');
  const labelInput = row.querySelector('.label-input');
  labelInput.addEventListener('input', () => syncMandatoryRow(row));
  syncMandatoryRow(row);
  toggle.addEventListener('change', () => row.classList.toggle('is-disabled', !toggle.checked));
  altitudeInput.addEventListener('input', () => {
    toggle.checked = altitudeInput.value.trim() !== '';
    row.classList.toggle('is-disabled', !toggle.checked);
  });
  row.classList.toggle('is-disabled', !toggle.checked);
  setupRowReordering(row);
  row.querySelector('.remove-row').addEventListener('click', () => {
    row.remove();
    clearValidation();
    updateRowCount();
  });
  rowsEl.appendChild(row);
  updateRowCount();
}

function setupRowReordering(row) {
  const handle = row.querySelector('.drag-handle');
  let holdTimer = null;
  let dragging = false;
  let pointerId = null;
  let pointerY = 0;
  let grabOffsetY = 0;
  let placeholder = null;

  const movePlaceholder = clientY => {
    const siblings = [...rowsEl.querySelectorAll('.altitude-row')].filter(item => item !== row);
    const next = siblings.find(item => clientY < item.getBoundingClientRect().top + item.getBoundingClientRect().height / 2);
    rowsEl.insertBefore(placeholder, next || null);
  };

  const startDragging = () => {
    const rect = row.getBoundingClientRect();
    dragging = true;
    grabOffsetY = Math.max(0, Math.min(rect.height, pointerY - rect.top));
    placeholder = document.createElement('div');
    placeholder.className = 'altitude-row-placeholder';
    placeholder.style.height = `${rect.height}px`;
    rowsEl.insertBefore(placeholder, row);
    row.classList.add('dragging');
    row.setAttribute('aria-grabbed', 'true');
    Object.assign(row.style, {
      position: 'fixed',
      left: `${rect.left}px`,
      top: `${pointerY - grabOffsetY}px`,
      width: `${rect.width}px`,
      zIndex: '1000',
      pointerEvents: 'none'
    });
    document.body.classList.add('is-reordering');
  };

  const move = event => {
    if (event.pointerId !== pointerId) return;
    pointerY = event.clientY;
    if (!dragging) return;
    event.preventDefault();
    row.style.top = `${pointerY - grabOffsetY}px`;
    if (pointerY < 70) window.scrollBy(0, -10);
    if (pointerY > window.innerHeight - 70) window.scrollBy(0, 10);
    movePlaceholder(pointerY);
  };

  const finish = () => {
    clearTimeout(holdTimer);
    holdTimer = null;
    if (dragging) {
      rowsEl.insertBefore(row, placeholder);
      placeholder.remove();
      placeholder = null;
      dragging = false;
      row.classList.remove('dragging');
      row.removeAttribute('aria-grabbed');
      row.removeAttribute('style');
      document.body.classList.remove('is-reordering');
    }
    if (pointerId !== null && handle.hasPointerCapture?.(pointerId)) handle.releasePointerCapture(pointerId);
    pointerId = null;
    document.removeEventListener('pointermove', move);
    document.removeEventListener('pointerup', finish);
    document.removeEventListener('pointercancel', finish);
  };

  handle.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    event.preventDefault();
    pointerId = event.pointerId;
    pointerY = event.clientY;
    handle.setPointerCapture?.(event.pointerId);
    document.addEventListener('pointermove', move, {passive: false});
    document.addEventListener('pointerup', finish);
    document.addEventListener('pointercancel', finish);
    holdTimer = setTimeout(startDragging, event.pointerType === 'mouse' ? 100 : 180);
  });
  handle.addEventListener('keydown', event => {
    if (!event.altKey || !['ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'ArrowUp' && row.previousElementSibling) rowsEl.insertBefore(row, row.previousElementSibling);
    if (event.key === 'ArrowDown' && row.nextElementSibling) rowsEl.insertBefore(row.nextElementSibling, row);
    handle.focus();
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function updateRowCount() { $('rowCount').textContent = rowsEl.children.length; }
function showValidation(message) { $('validation').textContent = message; $('validation').hidden = false; }
function clearValidation() { $('validation').hidden = true; }

function bracket(value, points) {
  if (value <= points[0]) return [points[0], points[1]];
  if (value >= points[points.length - 1]) return [points[points.length - 2], points[points.length - 1]];
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
function formatCorrectedAltitude(row, isMap = false) {
  const increment = isMap || /\b(?:MAP|MDA|DDA|DA)\b/i.test(row.label) || /missed approach point/i.test(row.label) ? 10 : 100;
  return `${(Math.ceil(row.corrected / increment) * increment).toLocaleString()} ft`;
}
function displayPointLabel(label) {
  return /missed approach altitude/i.test(label) ? 'GA ALT' : label;
}

function calculate() {
  clearValidation();
  const tempValue = $('temperature').value.trim();
  const elevationValue = $('elevation').value.trim();
  const groundspeedValue = $('groundspeed').value.trim();
  const temp = Number(tempValue);
  const elevation = Number(elevationValue);
  const groundspeed = Number(groundspeedValue);
  const rows = [...rowsEl.querySelectorAll('.altitude-row')]
    .filter(row => row.querySelector('.row-toggle').checked)
    .map((row, i) => {
      const altitudeValue = row.querySelector('.altitude-input').value.trim();
      return {
        label: row.querySelector('.label-input').value.trim() || `Point ${i + 1}`,
        altitudeValue,
        altitude: Number(altitudeValue)
      };
    });
  if (!tempValue) return showValidation('Enter the airport temperature.');
  if (!elevationValue) return showValidation('Enter the airport elevation.');
  if (!groundspeedValue) return showValidation('Enter the FAF to DA/MDA groundspeed.');
  if (!Number.isFinite(temp) || temp > 0 || temp < -50) return showValidation('Airport temperature must be between 0°C and −50°C.');
  if (!Number.isFinite(elevation) || elevation < -1500 || elevation > 15000) return showValidation('Enter a valid airport elevation between −1,500 and 15,000 ft MSL.');
  if (!Number.isFinite(groundspeed) || groundspeed <= 0 || groundspeed > 600) return showValidation('Enter a groundspeed between 1 and 600 knots.');
  if (!rows.length) return showValidation('Switch on at least one altitude entry. Active FAF and DA/MDA rows are required for the final-segment analysis.');
  if (rows.some(r => !r.altitudeValue || !Number.isFinite(r.altitude))) return showValidation('Enter a published altitude for every active row.');
  if (rows.some(r => r.altitude < elevation)) return showValidation('Each active procedure altitude must be at or above the airport elevation.');

  const computed = rows.map(r => {
    const height = r.altitude - elevation;
    const correction = correctionAt(temp, height);
    return {...r, height, correction, corrected: r.altitude + correction, trueUncorrected: Math.max(0, height - correction)};
  });
  const faf = computed.find(r => /\bP?FAF\b/i.test(r.label));
  const map = computed.find(r => /\bMAP\b|missed approach point|DA\/MDA|\bDA\b|\bMDA\b/i.test(r.label));
  if (!faf || !map) return showValidation('Label one altitude FAF and one altitude DA/MDA (or MAP / “Missed approach point”).');
  const publishedDrop = faf.height - map.height;
  if (publishedDrop <= 0) return showValidation('The FAF altitude must be higher than the DA/MDA altitude.');
  const trueDrop = faf.trueUncorrected - map.trueUncorrected;
  if (trueDrop <= 0) return showValidation('The calculated cold true height at FAF must be higher than at DA/MDA.');
  const segmentDistanceFt = publishedDrop / STANDARD_GRADIENT;
  const actualGradient = trueDrop / segmentDistanceFt;
  const standardAngle = Math.atan(STANDARD_GRADIENT) * 180 / Math.PI;
  const actualAngle = Math.atan(actualGradient) * 180 / Math.PI;
  const standardVs = groundspeed * FEET_PER_MINUTE_PER_KNOT * STANDARD_GRADIENT;
  const actualVs = groundspeed * FEET_PER_MINUTE_PER_KNOT * actualGradient;
  const layerScale = trueDrop / publishedDrop;
  const indicatedVs = actualVs / layerScale;
  const samePathIndicatedVs = standardVs / layerScale;
  lastResults = { temp, elevation, groundspeed, computed, faf, map, publishedDrop, trueDrop, segmentDistanceFt, actualGradient, standardAngle, actualAngle, standardVs, actualVs, layerScale, indicatedVs, samePathIndicatedVs };
  renderResults(lastResults);
}

function renderResults(data) {
  $('emptyState').hidden = true;
  $('results').hidden = false;
  $('actualGradient').textContent = `${data.actualAngle.toFixed(2)}°`;
  $('shallowerBy').textContent = `${data.actualAngle.toFixed(2)}° · ${(data.standardAngle - data.actualAngle).toFixed(2)}° shallower`;
  $('standardVs').textContent = `${Math.round(data.standardVs)} fpm`;
  $('standardVsNote').textContent = `5.2% at ${Math.round(data.groundspeed)} kt`;
  $('actualVs').textContent = `${Math.round(data.actualVs)} fpm`;
  $('actualVsNote').textContent = `true geometric · ${Math.round(data.standardVs - data.actualVs)} fpm lower`;
  $('indicatedVs').textContent = `${Math.round(data.indicatedVs)} fpm`;
  $('indicatedVsNote').textContent = `pressure-derived · ${((1 / data.layerScale - 1) * 100).toFixed(1)}% sensitivity`;
  $('samePathIndicatedVs').textContent = `${Math.round(data.samePathIndicatedVs)} fpm indicated`;
  $('resultsBody').innerHTML = data.computed.map(r => `<tr><td>${escapeHtml(displayPointLabel(r.label))}</td><td>${formatFt(r.altitude)}</td><td>+${Math.round(r.correction)} ft</td><td><strong>${formatCorrectedAltitude(r)}</strong></td></tr>`).join('');
  const extrapolated = data.computed.some(r => r.height > 5000);
  $('methodNote').innerHTML = `<strong>Calculation note:</strong> Switched-off rows are excluded entirely from validation, calculations, output, and FAF–DA/MDA analysis. Values are interpolated from the FAA/ICAO table and shown to the nearest foot. ${extrapolated ? 'One or more points exceed 5,000 ft AAE; those values use a linear extension of the final table interval, which the FAA permits as an optional extrapolation method. ' : ''}The VSI estimate uses a table-derived average FAF–DA/MDA layer factor of ${data.layerScale.toFixed(4)}. Exact aircraft indication can differ because of the real temperature/virtual-temperature profile, static-system and ADC calibration, instrument lag, and local pressure structure. Operational guidance always takes precedence.`;
  $('chartNarrative').textContent = `From FAF to DA/MDA at ${data.temp} degrees Celsius, the cold true descent gradient is ${(data.actualGradient*100).toFixed(2)} percent or ${data.actualAngle.toFixed(2)} degrees. At ${data.groundspeed} knots, standard vertical speed is ${Math.round(data.standardVs)} feet per minute, cold geometric vertical speed is ${Math.round(data.actualVs)} feet per minute, and the pressure-derived cockpit VSI indication is ${Math.round(data.indicatedVs)} feet per minute.`;
  requestAnimationFrame(() => drawChart(data));
  if (window.innerWidth >= 641 && window.innerWidth < 1000) $('results').scrollIntoView({behavior: 'smooth', block: 'start'});
}

function drawChart(data) {
  const canvas = $('profileChart');
  const dayTheme = document.documentElement.dataset.theme === 'day';
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.max(1, Math.round(rect.width * dpr));
  canvas.height = Math.max(1, Math.round(rect.height * dpr));
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  const w = rect.width, h = rect.height;
  const pad = {l: 50, r: 18, t: 18, b: 34};
  const pw = w-pad.l-pad.r, ph = h-pad.t-pad.b;
  const maxHeight = Math.max(500, data.publishedDrop);
  const maxNm = data.segmentDistanceFt / 6076.12;
  ctx.font = '9px system-ui';
  ctx.lineWidth = 1;
  ctx.strokeStyle = dayTheme ? 'rgba(6,17,26,.12)' : 'rgba(255,255,255,.09)';
  ctx.fillStyle = dayTheme ? '#52656d' : '#81939b';
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
  gradient.addColorStop(0, dayTheme ? 'rgba(8,127,168,.14)' : 'rgba(103,216,255,.18)');
  gradient.addColorStop(1, dayTheme ? 'rgba(8,127,168,0)' : 'rgba(103,216,255,0)');
  ctx.beginPath();
  for (let i=0;i<=70;i++) {
    const nm=maxNm*(1-i/70), progress=nm/maxNm, cold=data.trueDrop*progress;
    const x=xAt(nm), y=yAt(cold); if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
  }
  ctx.lineTo(xAt(0),yAt(0)); ctx.closePath(); ctx.fillStyle=gradient; ctx.fill();
  function path(color, cold=false, dash=[]) {
    ctx.beginPath();
    for(let i=0;i<=70;i++){
      const nm=maxNm*(1-i/70), progress=nm/maxNm, ft=cold?data.trueDrop*progress:data.publishedDrop*progress;
      const x=xAt(nm), y=yAt(ft); if(i===0)ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.strokeStyle=color; ctx.lineWidth=2.2; ctx.setLineDash(dash); ctx.stroke(); ctx.setLineDash([]);
  }
  const standardColor = dayTheme ? '#587000' : '#d8ff4f';
  const coldColor = dayTheme ? '#087fa8' : '#67d8ff';
  path(standardColor,false,[]); path(coldColor,true,[6,4]);
  ctx.fillStyle=standardColor; ctx.textAlign='right'; ctx.fillText(`${(STANDARD_GRADIENT*100).toFixed(1)}% / ${data.standardAngle.toFixed(2)}° standard`,w-pad.r-8,pad.t+13);
  ctx.fillStyle=coldColor; ctx.textAlign='left'; ctx.fillText(`${(data.actualGradient*100).toFixed(2)}% / ${data.actualAngle.toFixed(2)}° cold`,pad.l+8,h-pad.b-8);
}

/* ---- Hot temperature VSI mode (local preview, no altitude correction) ---- */
function setMode(mode) {
  const isHot = mode === 'hot';
  $('coldWorkspace').hidden = isHot;
  $('hotWorkspace').hidden = !isHot;
  $('modeCold').classList.toggle('is-active', !isHot);
  $('modeHot').classList.toggle('is-active', isHot);
  $('modeCold').setAttribute('aria-selected', String(!isHot));
  $('modeHot').setAttribute('aria-selected', String(isHot));
  if (isHot) {
    $('heroTitle').innerHTML = 'See what hot air<br><em>does to your VSI.</em>';
    $('heroCopy').textContent = 'No altitude correction in hot air — just the difference between a true 3° path and an uncompensated FMC baro path, in indicated feet per minute.';
  } else {
    $('heroTitle').innerHTML = 'See the altitude<br><em>cold air takes away.</em>';
    $('heroCopy').textContent = 'Calculate indicated altitude corrections and visualize how an uncompensated 3° barometric descent becomes shallower in below-zero conditions.';
  }
}
function showHotValidation(message) { $('hotValidation').textContent = message; $('hotValidation').hidden = false; }
function clearHotValidation() { $('hotValidation').hidden = true; }
// Sign toggles: iOS numeric keyboards have no minus key, so the sign lives on a
// button, not in the typed number. Both fields take a magnitude (0 and up);
// the button supplies the sign. Hot OAT defaults to +, headwind defaults to HW.
let hotTempNegative = false;
let hotHeadwindTailwind = false;
function syncHotTempSign() { const b = $('hotTempSign'); b.textContent = hotTempNegative ? '−' : '+'; b.setAttribute('aria-pressed', String(hotTempNegative)); }
function syncHotHeadwindSign() { const b = $('hotHeadwindSign'); b.textContent = hotHeadwindTailwind ? 'TW' : 'HW'; b.setAttribute('aria-pressed', String(hotHeadwindTailwind)); }
$('hotTempSign').addEventListener('click', () => { hotTempNegative = !hotTempNegative; syncHotTempSign(); });
$('hotHeadwindSign').addEventListener('click', () => { hotHeadwindTailwind = !hotHeadwindTailwind; syncHotHeadwindSign(); });
function calculateHot() {
  clearHotValidation();
  const oatValue = $('hotTemperature').value.trim();
  const elevValue = $('hotElevation').value.trim();
  const qnhValue = $('hotQnh').value.trim();
  const iasValue = $('hotIas').value.trim();
  const headwindValue = $('hotHeadwind').value.trim();
  const angleValue = $('hotAngle').value.trim();
  const oat = (hotTempNegative ? -1 : 1) * Number(oatValue);
  const elevation = Number(elevValue);
  const qnh = Number(qnhValue);
  const ias = Number(iasValue);
  const headwind = (hotHeadwindTailwind ? -1 : 1) * Number(headwindValue);
  const angleDeg = Number(angleValue);
  if (!oatValue) return showHotValidation('Enter the outside air temperature.');
  if (!elevValue) return showHotValidation('Enter the airport elevation.');
  if (!qnhValue) return showHotValidation('Enter the QNH.');
  if (!iasValue) return showHotValidation('Enter the indicated airspeed.');
  if (headwindValue === '') return showHotValidation('Enter the headwind component (0 if calm, tap TW for a tailwind).');
  if (!angleValue) return showHotValidation('Enter the glide slope angle.');
  if (!Number.isFinite(oat) || oat < -50 || oat > 50) return showHotValidation('OAT must be between −50°C and 50°C for this page (tap +/− for a below-zero OAT).');
  if (!Number.isFinite(elevation) || elevation < -1500 || elevation > 15000) return showHotValidation('Enter a valid airport elevation between −1,500 and 15,000 ft MSL.');
  if (!Number.isFinite(qnh) || qnh < 900 || qnh > 1100) return showHotValidation('Enter a QNH between 900 and 1,100 hPa.');
  if (!Number.isFinite(ias) || ias <= 0 || ias > 600) return showHotValidation('Enter an IAS between 1 and 600 knots.');
  if (!Number.isFinite(headwind) || headwind < -200 || headwind > 200) return showHotValidation('Enter a headwind/tailwind component between 0 and 200 knots.');
  if (!Number.isFinite(angleDeg) || angleDeg < 0.5 || angleDeg > 6) return showHotValidation('Enter a glide slope angle between 0.5° and 6°.');
  // Groundspeed, calculated (not entered): IAS -> TAS -> GS.
  // TAS from density ratio, low-speed approximation: TAS = IAS / sqrt(sigma), sigma = rho / rho0.
  // rho/rho0 = (p/p0) x (T0/T), with station pressure p from QNH and elevation using the ISA
  // pressure formula scaled by QNH: p/p0 = (QNH/1013.25) x (1 - 0.0065 x elev_m / 288.15)^5.25588.
  // This is the altimeter-consistent station pressure for that QNH. T = OAT in kelvin.
  // Compressibility and instrument/position error are ignored, so TAS is a planning estimate,
  // not a flight-manual value.
  const elevM = elevation * 0.3048;
  const pressureRatio = (qnh / 1013.25) * Math.pow(1 - 0.0065 * elevM / 288.15, 5.25588);
  const sigma = pressureRatio * (288.15 / (oat + 273.15));
  const tas = ias / Math.sqrt(sigma);
  const groundspeed = tas - headwind; // headwind positive reduces GS; tailwind (negative) increases it
  if (!Number.isFinite(groundspeed) || groundspeed <= 0) return showHotValidation('The calculated groundspeed is not positive — check IAS and headwind component.');
  // Pressure-rate VSI model: indicated rate = true rate x (ISA absolute temp / actual absolute temp).
  // ISA temperature falls with altitude at the standard lapse rate, 1.98°C per 1,000 ft, so the
  // ISA temperature that matters is the one at the airport, not sea level: ISA = 15 - 1.98 x elev/1000.
  // OAT is the airport temperature. For a low-altitude final segment, if actual and ISA temperatures
  // lapse at roughly the same rate, this airport-surface ratio is close to the layer ratio above the airport.
  const isaAtAirport = 15 - 1.98 * elevation / 1000;
  const ratio = (oat + 273.15) / (isaAtAirport + 273.15); // true feet per indicated foot
  const gradient = Math.tan(angleDeg * Math.PI / 180);
  const nominalVs = groundspeed * FEET_PER_MINUTE_PER_KNOT * gradient;
  const geoIndicatedVs = nominalVs / ratio; // flying a true geometrical glide path
  const fmcIndicatedVs = nominalVs; // FMC baro path is at the entered angle in indicated altitude, by definition
  const fmcTrueVs = nominalVs * ratio; // what that baro path really does in hot air
  const fmcAngle = Math.atan(gradient * ratio) * 180 / Math.PI;
  const geoPct = (1 / ratio - 1) * 100;
  const windPhrase = headwind >= 0 ? `headwind ${Math.round(headwind)} kt` : `tailwind ${Math.round(-headwind)} kt`;
  $('hotEmptyState').hidden = true;
  $('hotResults').hidden = false;
  $('hotGroundspeedOut').textContent = `${Math.round(groundspeed)} kt`;
  $('hotGroundspeedNote').textContent = `TAS ${Math.round(tas)} kt ${headwind >= 0 ? '− headwind' : '+ tailwind'} ${Math.round(Math.abs(headwind))} kt`;
  $('hotGeoIndicated').textContent = `${Math.round(geoIndicatedVs)} fpm`;
  $('hotGeoIndicatedNote').textContent = `true rate ${Math.round(nominalVs)} fpm · reads ${Math.abs(geoPct).toFixed(1)}% ${geoPct < 0 ? 'lower' : 'higher'} than true rate`;
  $('hotFmcIndicated').textContent = `${Math.round(fmcIndicatedVs)} fpm`;
  $('hotFmcIndicatedNote').textContent = `same as nominal ${angleDeg.toFixed(1)}° rate at ${Math.round(groundspeed)} kt GS`;
  $('hotGradientLabel').textContent = `${angleDeg.toFixed(1)}° GLIDE SLOPE · ${(gradient * 100).toFixed(2)}% GRADIENT`;
  $('hotGeoIndicatedCell').textContent = `${Math.round(geoIndicatedVs)} fpm`;
  $('hotGeoTrueCell').textContent = `${Math.round(nominalVs)} fpm`;
  $('hotGeoAngleCell').textContent = `${angleDeg.toFixed(1)}°`;
  $('hotFmcIndicatedCell').textContent = `${Math.round(fmcIndicatedVs)} fpm`;
  $('hotFmcTrueCell').textContent = `${Math.round(fmcTrueVs)} fpm`;
  $('hotFmcAngleCell').textContent = `${fmcAngle.toFixed(2)}°`;
  const diff = Math.round(fmcIndicatedVs - geoIndicatedVs);
  $('hotDifference').textContent = `${Math.abs(diff)} fpm apart`;
  $('hotDifferenceNote').textContent = diff >= 0
    ? `At ${oat}°C, ${Math.round(elevation).toLocaleString()} ft elevation, IAS ${Math.round(ias)} kt and ${windPhrase} (GS ${Math.round(groundspeed)} kt), the FMC baro path shows ${Math.round(fmcIndicatedVs)} fpm indicated, ${Math.abs(diff)} fpm higher than the ${Math.round(geoIndicatedVs)} fpm you would see flying a true geometrical ${angleDeg.toFixed(1)}° path. Following the FMC path, your true descent is ${Math.round(fmcTrueVs)} fpm at a true angle of ${fmcAngle.toFixed(2)}°, steeper than ${angleDeg.toFixed(1)}°.`
    : `At ${oat}°C, ${Math.round(elevation).toLocaleString()} ft elevation, IAS ${Math.round(ias)} kt and ${windPhrase} (GS ${Math.round(groundspeed)} kt), the FMC baro path shows ${Math.round(fmcIndicatedVs)} fpm indicated, ${Math.abs(diff)} fpm lower than the ${Math.round(geoIndicatedVs)} fpm you would see flying a true geometrical ${angleDeg.toFixed(1)}° path.`;
  $('hotMethodNote').innerHTML = `<strong>Calculation note:</strong> ISA temperature at ${Math.round(elevation).toLocaleString()} ft is ${isaAtAirport.toFixed(1)}°C, so the temperature ratio is ${(ratio).toFixed(4)} at ${oat}°C vs that ISA temperature. TAS ${Math.round(tas)} kt is IAS ${Math.round(ias)} kt corrected for density ratio ${sigma.toFixed(4)} at the airport (station pressure ratio ${pressureRatio.toFixed(4)} from QNH ${Math.round(qnh)} hPa and elevation); groundspeed is TAS minus headwind component. Geometrical path: indicated = nominal / ratio. FMC path without baro-VNAV: indicated = nominal, because the FMC path is at the entered angle in barometric altitude; its true rate is nominal × ratio. This is an estimate: TAS ignores compressibility and instrument/position error, and the VSI indication depends on the real temperature profile through the layer, static-system and ADC calibration, and instrument lag. No altitude correction is applied on this page — in hot air true altitude is higher than indicated, so obstacle clearance is not reduced by temperature. Operational guidance, chart notes, and ATC instructions always take precedence.`;
}
$('modeCold').addEventListener('click', () => setMode('cold'));
$('modeHot').addEventListener('click', () => setMode('hot'));
$('calculateHot').addEventListener('click', calculateHot);
$('loadHotExample').addEventListener('click', () => { $('hotTemperature').value = 35; $('hotElevation').value = 5000; $('hotQnh').value = 1013; $('hotIas').value = 140; $('hotHeadwind').value = 10; $('hotAngle').value = 3; hotTempNegative = false; hotHeadwindTailwind = false; syncHotTempSign(); syncHotHeadwindSign(); clearHotValidation(); });
$('clearHot').addEventListener('click', () => {
  $('hotTemperature').value = ''; $('hotElevation').value = ''; $('hotQnh').value = 1013;
  $('hotIas').value = ''; $('hotHeadwind').value = ''; $('hotAngle').value = 3;
  hotTempNegative = false; hotHeadwindTailwind = false; syncHotTempSign(); syncHotHeadwindSign();
  clearHotValidation(); $('hotEmptyState').hidden = false; $('hotResults').hidden = true;
});
$('printHotResults').addEventListener('click', () => window.print());

initialRows.forEach(([label, altitude]) => addAltitudeRow(label, altitude));
$('themeToggle').addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'night' ? 'day' : 'night';
  document.documentElement.dataset.theme = nextTheme;
  try { localStorage.setItem('cold-altitude-theme', nextTheme); } catch {}
  syncThemeControl();
  if (lastResults) requestAnimationFrame(() => drawChart(lastResults));
});
const deviceToggle = $('deviceToggle');
deviceToggle.addEventListener('click', () => {
  const phonePreview = document.documentElement.dataset.preview !== 'phone';
  document.documentElement.dataset.preview = phonePreview ? 'phone' : 'normal';
  try { localStorage.setItem('cold-altitude-preview', document.documentElement.dataset.preview); } catch {}
  syncDeviceControl();
  if (lastResults) requestAnimationFrame(() => drawChart(lastResults));
});
function syncDeviceControl() {
  const phonePreview = document.documentElement.dataset.preview === 'phone';
  deviceToggle.textContent = phonePreview ? 'Tablet view' : 'Phone view';
  deviceToggle.setAttribute('aria-label', phonePreview ? 'Switch to tablet preview' : 'Switch to iPhone preview');
  deviceToggle.setAttribute('aria-pressed', String(phonePreview));
}
try { document.documentElement.dataset.preview = localStorage.getItem('cold-altitude-preview') || 'normal'; } catch { document.documentElement.dataset.preview = 'normal'; }
syncDeviceControl();
function syncThemeControl() {
  const isNight = document.documentElement.dataset.theme === 'night';
  const button = $('themeToggle');
  button.querySelector('.theme-icon').textContent = isNight ? '☀' : '☾';
  button.querySelector('.theme-label').textContent = isNight ? 'Day' : 'Night';
  button.setAttribute('aria-label', `Switch to ${isNight ? 'day' : 'night'} theme`);
  button.setAttribute('aria-pressed', String(isNight));
  $('themeColor').content = isNight ? '#07141e' : '#edf1ef';
}
syncThemeControl();
$('addRow').addEventListener('click', () => addAltitudeRow('', ''));
$('calculate').addEventListener('click', calculate);
$('temperature').addEventListener('input', event => {
  const raw = event.currentTarget.value.trim();
  if (!raw || raw === '-') return;
  const value = Number(raw);
  if (Number.isFinite(value) && value > 0) event.currentTarget.value = String(-value);
});
$('loadExample').addEventListener('click', () => {
  $('temperature').value = -20; $('elevation').value = 1200; $('groundspeed').value = 120; rowsEl.innerHTML=''; exampleRows.forEach(([l,a])=>addAltitudeRow(l,a)); clearValidation();
});
$('clearCold').addEventListener('click', () => {
  $('temperature').value = ''; $('elevation').value = ''; $('groundspeed').value = '';
  rowsEl.innerHTML=''; initialRows.forEach(([l,a])=>addAltitudeRow(l,a));
  clearValidation(); lastResults = null; $('emptyState').hidden = false; $('results').hidden = true;
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

/* ---- Update button: the pill right of the Day/Night toggle ---- */
/* Why the old version stuck: the service worker serves the cached page first, so a plain */
/* reload can keep showing the old cached copy. This button explicitly asks the browser */
/* for a new service worker and only reloads when one has taken over. It never clears the */
/* offline cache when you are offline or already up to date, so it cannot break offline use. */
let updateReloading = false;
async function checkForUpdate() {
  const status = $('offlineStatus');
  const label = status.querySelector('span');
  const original = label.textContent;
  if (!('serviceWorker' in navigator)) { window.location.reload(); return; }
  if (!navigator.onLine) {
    label.textContent = 'Offline — update needs internet';
    setTimeout(() => { label.textContent = 'Running offline'; }, 2500);
    return;
  }
  label.textContent = 'Checking for update…';
  status.disabled = true;
  const restoreUpToDate = () => {
    label.textContent = 'Up to date';
    status.disabled = false;
    setTimeout(() => { label.textContent = navigator.onLine ? 'Offline ready' : 'Running offline'; }, 2500);
  };
  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (!reg) { window.location.reload(); return; }
    // Listen first, so we catch the new worker taking over even if it activates immediately.
    const onControllerChange = () => {
      if (updateReloading) return;
      updateReloading = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
    await reg.update();
    if (reg.waiting) {
      label.textContent = 'Updating…';
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      // Fallback if controllerchange does not fire (e.g. first activation edge case).
      setTimeout(() => { if (!updateReloading) { updateReloading = true; window.location.reload(); } }, 2500);
      return;
    }
    if (reg.installing) {
      label.textContent = 'Updating…';
      reg.installing.addEventListener('statechange', () => {
        if (reg.installing && reg.installing.state === 'activated' && !updateReloading) {
          updateReloading = true;
          window.location.reload();
        }
      });
      setTimeout(() => { if (!updateReloading) { updateReloading = true; window.location.reload(); } }, 4000);
      return;
    }
    // No new worker: the service-worker file is unchanged, so this is the latest version.
    // Do not clear caches and do not reload — that would only lose the current inputs.
    navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    restoreUpToDate();
  } catch {
    label.textContent = 'Update check failed';
    status.disabled = false;
    setTimeout(() => { label.textContent = original; }, 3000);
  }
}
$('offlineStatus').addEventListener('click', checkForUpdate);
