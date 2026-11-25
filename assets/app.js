/*
 * BPMN Decision Lab — browser application controller
 * All assets, data, assessment logic and simulation execute locally in the browser.
 */
(() => {
  'use strict';

  const DATA = window.BPMN_LAB_DATA;
  if (!DATA || !window.ProcessSim) {
    document.body.insertAdjacentHTML('afterbegin', '<div style="margin:2rem;padding:1rem;background:#fff0f0;color:#8b2525;border-radius:12px">فایل‌های داده یا موتور شبیه‌سازی بارگذاری نشده‌اند. مطمئن شوید assets/data.js و assets/simulator.js پیش از assets/app.js بارگذاری شده‌اند.</div>');
    return;
  }

  const $ = (id) => document.getElementById(id);
  const CASE = DATA.processCase;
  const QUESTIONS = DATA.assessment.questions;
  const STORAGE = { history: 'bpmn-decision-lab:history:v1', answers: 'bpmn-decision-lab:answers:v1' };
  const PAGE_TITLES = { overview: 'پیشخوان', process: 'پرونده فرایند', lab: 'آزمایشگاه بهبود', arena: 'Decision Arena', insights: 'گزارش تشخیصی' };
  const NUMBER = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 1 });
  const INTEGER = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 });
  const KEY_LABELS = ['الف', 'ب', 'ج', 'د'];

  let selectedNode = 'pickpack';
  let currentQuestion = 0;
  let answers = loadJSON(STORAGE.answers, []);
  let lastRun = null;
  let baselineRun = null;
  let history = loadJSON(STORAGE.history, []);
  let toastTimer = null;

  function loadJSON(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (_) { return fallback; }
  }
  function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) { showToast('فضای ذخیره‌سازی مرورگر در دسترس نیست.'); }
  }
  function fa(value, digits = 1) {
    const n = Number(value);
    if (!Number.isFinite(n)) return '—';
    return new Intl.NumberFormat('fa-IR', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(n);
  }
  function fi(value) { return INTEGER.format(Number(value) || 0); }
  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function showToast(message) {
    const node = $('toast');
    if (!node) return;
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => node.classList.remove('show'), 2600);
  }
  function setHidden(node, hidden) { if (node) node.classList.toggle('hidden', !!hidden); }

  // ---------------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------------
  function navigate(viewId) {
    if (!PAGE_TITLES[viewId]) return;
    document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.id === viewId));
    document.querySelectorAll('[data-view]').forEach((button) => button.classList.toggle('active', button.dataset.view === viewId));
    $('pageTitle').textContent = PAGE_TITLES[viewId];
    if (viewId === 'insights') renderReport();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  document.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.view)));
  document.querySelectorAll('[data-go]').forEach((button) => button.addEventListener('click', () => navigate(button.dataset.go)));

  // ---------------------------------------------------------------------------
  // BPMN view — simplified visual representation of the supplied case model.
  // ---------------------------------------------------------------------------
  const POS = {
    start: { x: 72, y: 101, kind: 'event' },
    register: { x: 186, y: 101, kind: 'task' },
    payment: { x: 350, y: 184, kind: 'task' },
    paygw: { x: 480, y: 184, kind: 'gateway' },
    cancel: { x: 620, y: 101, kind: 'task' },
    pickpack: { x: 650, y: 265, kind: 'task' },
    quality: { x: 820, y: 350, kind: 'task' },
    qgw: { x: 950, y: 350, kind: 'gateway' },
    dispatch: { x: 1090, y: 350, kind: 'task' },
    end: { x: 1215, y: 350, kind: 'event' }
  };
  const NODE_LABELS = {
    start: 'شروع سفارش', register: 'ثبت سفارش', payment: 'تأیید پرداخت', paygw: 'پرداخت موفق؟',
    cancel: 'لغو سفارش', pickpack: 'جمع‌آوری و بسته‌بندی', quality: 'کنترل کیفیت', qgw: 'بسته سالم است؟',
    dispatch: 'تحویل به ارسال', end: 'پایان فرایند'
  };

  function svgTask(id, label, x, y, changed, sublabel = '') {
    const words = label.length > 19 ? [label.slice(0, 19), label.slice(19)] : [label];
    return `<g class="bpmn-node ${changed ? 'changed' : ''}" data-node="${id}" tabindex="0" role="button" aria-label="نمایش جزئیات ${esc(label)}">
      <rect x="${x - 53}" y="${y - 24}" width="106" height="48" rx="9"/>
      <text x="${x}" y="${y - (words.length > 1 ? 3 : 0)}" text-anchor="middle">${esc(words[0])}</text>
      ${words.length > 1 ? `<text x="${x}" y="${y + 10}" text-anchor="middle">${esc(words[1])}</text>` : ''}
      ${sublabel ? `<text class="node-sub" x="${x}" y="${y + 37}" text-anchor="middle">${esc(sublabel)}</text>` : ''}
    </g>`;
  }
  function svgGateway(id, label, x, y, changed) {
    return `<g class="bpmn-node ${changed ? 'changed' : ''}" data-node="${id}" tabindex="0" role="button" aria-label="نمایش جزئیات ${esc(label)}">
      <polygon points="${x},${y - 26} ${x + 26},${y} ${x},${y + 26} ${x - 26},${y}"/>
      <path d="M${x - 7} ${y - 7} L${x + 7} ${y + 7} M${x + 7} ${y - 7} L${x - 7} ${y + 7}" stroke="#7485a5" stroke-width="1.6"/>
      <text x="${x}" y="${y + 43}" text-anchor="middle">${esc(label)}</text>
    </g>`;
  }
  function svgEvent(id, label, x, y, isEnd = false) {
    return `<g class="bpmn-node" data-node="${id}" tabindex="0" role="button" aria-label="نمایش جزئیات ${esc(label)}">
      <circle cx="${x}" cy="${y}" r="15" ${isEnd ? 'stroke-width="3"' : ''}/><text x="${x}" y="${y + 36}" text-anchor="middle">${esc(label)}</text>
    </g>`;
  }
  function renderDiagram(targetId, changedIds = [], isToBe = false) {
    const target = $(targetId);
    if (!target) return;
    const changed = new Set(changedIds);
    const paymentLabel = isToBe && changed.has('payment') ? 'پرداخت خودکار' : 'تأیید پرداخت';
    const packLabel = isToBe && changed.has('pickpack') ? 'بسته‌بندی استاندارد' : 'جمع‌آوری و بسته‌بندی';
    const qualityLabel = isToBe && changed.has('quality') ? 'کنترل با چک‌لیست' : 'کنترل کیفیت';
    target.setAttribute('viewBox', '0 0 1280 420');
    target.innerHTML = `
      <defs>
        <marker id="arrow-${targetId}" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#8795ad"/></marker>
        <marker id="arrow-warn-${targetId}" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L7,3 z" fill="#d69d42"/></marker>
      </defs>
      <rect class="lane-rect" x="10" y="48" width="1260" height="92" rx="9"/><rect class="lane-rect alt" x="10" y="140" width="1260" height="86" rx="9"/><rect class="lane-rect" x="10" y="226" width="1260" height="80" rx="9"/><rect class="lane-rect alt" x="10" y="306" width="1260" height="96" rx="9"/>
      <text class="lane-label" x="1250" y="66" text-anchor="end">فروش و ثبت سفارش</text><text class="lane-label" x="1250" y="158" text-anchor="end">پرداخت</text><text class="lane-label" x="1250" y="244" text-anchor="end">انبار</text><text class="lane-label" x="1250" y="324" text-anchor="end">کنترل و ارسال</text>
      <g marker-end="url(#arrow-${targetId})">
        <path class="flow-path" d="M87 101 H133"/><path class="flow-path" d="M239 101 H268 V184 H297"/>
        <path class="flow-path" d="M403 184 H454"/><path class="flow-path" d="M506 184 H548 V265 H597"/>
        <path class="flow-path" d="M506 184 H540 V101 H566"/><path class="flow-path" d="M703 265 H746 V350 H767"/>
        <path class="flow-path" d="M873 350 H924"/><path class="flow-path" d="M976 350 H1037"/><path class="flow-path" d="M1143 350 H1199"/>
      </g>
      <path class="flow-dash" marker-end="url(#arrow-warn-${targetId})" d="M950 376 V390 H650 V290"/>
      <text class="flow-caption" x="548" y="175" text-anchor="middle">پرداخت موفق</text><text class="flow-caption" x="548" y="91" text-anchor="middle">پرداخت ناموفق</text><text class="flow-caption" x="805" y="405" text-anchor="middle">نیازمند اصلاح · بازگشت به بسته‌بندی</text>
      ${svgEvent('start', 'شروع', POS.start.x, POS.start.y)}
      ${svgTask('register', NODE_LABELS.register, POS.register.x, POS.register.y, false, '۲ دقیقه · ۱ نفر')}
      ${svgTask('payment', paymentLabel, POS.payment.x, POS.payment.y, changed.has('payment'), isToBe && changed.has('payment') ? 'Service Task' : '۴ دقیقه · ۱ نفر')}
      ${svgGateway('paygw', NODE_LABELS.paygw, POS.paygw.x, POS.paygw.y, false)}
      ${svgTask('cancel', NODE_LABELS.cancel, POS.cancel.x, POS.cancel.y, false, 'پایان مسیر ناموفق')}
      ${svgTask('pickpack', packLabel, POS.pickpack.x, POS.pickpack.y, changed.has('pickpack'), isToBe && changed.has('pickpack') ? 'منبع: ' + (getConfig().packers + (getConfig().extraPacker ? 1 : 0)) + ' نفر' : '۱۲ دقیقه · ۲ نفر')}
      ${svgTask('quality', qualityLabel, POS.quality.x, POS.quality.y, changed.has('quality'), isToBe && changed.has('quality') ? 'نرخ اصلاح هدف: ۳٪' : '۵ دقیقه · ۱ نفر')}
      ${svgGateway('qgw', NODE_LABELS.qgw, POS.qgw.x, POS.qgw.y, false)}
      ${svgTask('dispatch', NODE_LABELS.dispatch, POS.dispatch.x, POS.dispatch.y, false, '۴ دقیقه · ۱ نفر')}
      ${svgEvent('end', 'پایان', POS.end.x, POS.end.y, true)}
    `;
    target.querySelectorAll('[data-node]').forEach((node) => {
      const handler = () => selectNode(node.dataset.node);
      node.addEventListener('click', handler);
      node.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); handler(); } });
    });
  }

  function selectNode(id) {
    selectedNode = id;
    document.querySelectorAll('#processDiagram [data-node]').forEach((node) => node.classList.toggle('selected', node.dataset.node === id));
    const activity = CASE.activities.find((item) => item.id === id);
    if (!activity) return;
    $('elementTitle').textContent = activity.name;
    $('elementType').textContent = `${activity.type} · ${activity.lane}`;
    $('elementDescription').textContent = activity.description;
    const values = [
      ['زمان پایه', activity.duration ? `${fa(activity.duration, 0)} دقیقه` : 'بدون زمان خدمت'],
      ['منابع', activity.resources ? `${fi(activity.resources)} نفر` : 'بدون منبع مستقیم'],
      ['ورودی', activity.input || '—'],
      ['خروجی', activity.output || '—']
    ];
    $('elementStats').innerHTML = values.map(([label, value]) => `<div><span>${esc(label)}</span><b>${esc(value)}</b></div>`).join('');
  }

  function renderAssumptions() {
    $('assumptionList').innerHTML = CASE.assumptions.map((item, index) => `<article class="assumption-card"><b>${fi(index + 1)} · فرض مدل</b><p>${esc(item)}</p></article>`).join('');
  }

  $('resetModelView').addEventListener('click', () => selectNode('pickpack'));

  // ---------------------------------------------------------------------------
  // Experiment workspace and output analysis
  // ---------------------------------------------------------------------------
  function baselineConfig() {
    return {
      demand: CASE.baseline.demandPerShift,
      packers: CASE.baseline.packers,
      packMinutes: CASE.baseline.packMinutes,
      reworkPercent: CASE.baseline.reworkPercent,
      paymentFailurePercent: CASE.baseline.paymentFailurePercent,
      shiftMinutes: CASE.baseline.shiftMinutes,
      automation: false, checklist: false, extraPacker: false, seed: 20261125
    };
  }
  function getConfig() {
    return {
      demand: Number($('demand').value), packers: Number($('packers').value),
      packMinutes: Number($('packMinutes').value), reworkPercent: Number($('reworkPercent').value),
      paymentFailurePercent: CASE.baseline.paymentFailurePercent, shiftMinutes: CASE.baseline.shiftMinutes,
      automation: $('automation').checked, checklist: $('checklist').checked, extraPacker: $('extraPacker').checked,
      seed: 20261125
    };
  }
  function updateControls() {
    $('demandOut').textContent = `${fi($('demand').value)} سفارش`;
    $('packersOut').textContent = `${fi($('packers').value)} نفر`;
    $('packMinutesOut').textContent = `${fi($('packMinutes').value)} دقیقه`;
    $('reworkPercentOut').textContent = `${fi($('reworkPercent').value)}٪`;
    renderDiagram('toBeDiagram', changedNodeIds(getConfig()), true);
  }
  function changedNodeIds(config) {
    const ids = [];
    if (config.automation) ids.push('payment');
    if (config.checklist) ids.push('pickpack', 'quality');
    if (config.extraPacker || config.packers !== CASE.baseline.packers || config.packMinutes !== CASE.baseline.packMinutes) ids.push('pickpack');
    return [...new Set(ids)];
  }
  function currentToBeNote(config) {
    const parts = [];
    if (config.automation) parts.push('تأیید پرداخت به خدمت خودکار تغییر کرده است.');
    if (config.checklist) parts.push('چک‌لیست پیشگیرانه به بسته‌بندی و کنترل کیفیت افزوده شده است.');
    if (config.extraPacker) parts.push('یک نیروی اضافی به ظرفیت بسته‌بندی اضافه شده است.');
    if (config.packers !== CASE.baseline.packers) parts.push(`تعداد کارکنان بسته‌بندی از ${CASE.baseline.packers} به ${config.packers} نفر تغییر کرده است.`);
    if (config.packMinutes !== CASE.baseline.packMinutes) parts.push(`زمان بسته‌بندی از ${CASE.baseline.packMinutes} به ${config.packMinutes} دقیقه تغییر کرده است.`);
    if (!parts.length) parts.push('هنوز مداخله ساختاری انتخاب نشده است؛ فقط وضعیت پایه نمایش داده می‌شود.');
    return parts.join(' ');
  }
  function updateToBePreview(config) {
    renderDiagram('toBeDiagram', changedNodeIds(config), true);
    const note = $('toBeNote');
    if (note) note.textContent = currentToBeNote(config);
  }
  function delta(before, after, lowerIsBetter = true) {
    const diff = after - before;
    const improved = lowerIsBetter ? diff < -0.001 : diff > 0.001;
    const worsened = lowerIsBetter ? diff > 0.001 : diff < -0.001;
    const amount = fa(Math.abs(diff), 1);
    return { text: Math.abs(diff) < 0.001 ? 'بدون تغییر' : `${improved ? 'بهبود' : worsened ? 'افت' : 'تغییر'} ${amount}`, className: improved ? 'change-good' : worsened ? 'change-bad' : '' };
  }
  function kpiCard(label, value, unit, hint = '') {
    return `<div class="kpi-card"><span>${esc(label)}</span><strong>${esc(value)} <small>${esc(unit)}</small></strong>${hint ? `<small>${esc(hint)}</small>` : ''}</div>`;
  }
  function renderResults(result, baseline, config) {
    $('resultsPlaceholder').classList.add('hidden');
    $('resultsContent').classList.remove('hidden');
    $('runStamp').textContent = `اجرا شد · ${fi(result.demand)} سفارش · ${new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}`;

    $('kpiGrid').innerHTML = [
      kpiCard('میانگین زمان چرخه', fa(result.averageCycle), 'دقیقه', `صدک ۹۰: ${fa(result.p90Cycle)} دقیقه`),
      kpiCard('تکمیل در شیفت', fi(result.completedWithinShift), 'سفارش', `از ${fi(result.demand)} ورودی`),
      kpiCard('انتظار متوسط صف', fa(result.averageWaitPerQueueVisit), 'دقیقه', 'به‌ازای هر مراجعه به صف'),
      kpiCard('هزینه شیفت', fi(result.totalCost), 'واحد', `هزینه هر تکمیل: ${fa(result.costPerCompleted)}`),
      kpiCard('بازده عبور اول (FPY)', `${fa(result.firstPassYield)}٪`, '', `${fi(result.firstPass)} سفارش بدون اصلاح`),
      kpiCard('سفارش‌های اصلاح‌شده', fi(result.reworked), 'سفارش', `نرخ مشاهده‌شده: ${fa(result.reworkRateObserved)}٪`),
      kpiCard('تکمیل کل در مدل', fi(result.completed), 'سفارش', `لغو پرداخت: ${fi(result.cancelled)}`),
      kpiCard('بهره‌برداری گلوگاه', `${fa(result.bottleneckLoad)}٪`, '', result.bottleneckName)
    ].join('');

    const stageOrder = ['register', 'payment', 'packing', 'quality', 'dispatch'];
    $('stationChart').innerHTML = stageOrder.map((key) => {
      const stage = result.stages[key];
      const value = stage.workloadPercent;
      const over = value > 100;
      return `<div class="station-row"><label>${esc(stage.name)}</label><div class="station-track"><i class="station-fill ${over ? 'over' : ''}" style="width:${Math.min(value, 150) / 150 * 100}%"></i></div><strong class="station-value ${over ? 'over' : ''}">${fa(value, 0)}٪</strong></div>`;
    }).join('');

    const rows = [
      ['میانگین زمان چرخه', baseline.averageCycle, result.averageCycle, 'دقیقه', true],
      ['تکمیل در شیفت', baseline.completedWithinShift, result.completedWithinShift, 'سفارش', false],
      ['انتظار متوسط صف', baseline.averageWaitPerQueueVisit, result.averageWaitPerQueueVisit, 'دقیقه', true],
      ['بازده عبور اول', baseline.firstPassYield, result.firstPassYield, '٪', false],
      ['هزینه کل شیفت', baseline.totalCost, result.totalCost, 'واحد', true],
      ['نرخ اصلاح مشاهده‌شده', baseline.reworkRateObserved, result.reworkRateObserved, '٪', true]
    ];
    $('comparisonTable').innerHTML = `<table class="compare-table"><thead><tr><th>شاخص</th><th>As-Is</th><th>سناریوی شما</th><th>تغییر</th></tr></thead><tbody>${rows.map(([name, before, after, unit, lower]) => {
      const d = delta(before, after, lower);
      return `<tr><td>${esc(name)}</td><td>${fa(before)} ${esc(unit)}</td><td><strong>${fa(after)} ${esc(unit)}</strong></td><td class="${d.className}">${esc(d.text)}</td></tr>`;
    }).join('')}</tbody></table>`;

    const bottleneck = result.stages[result.bottleneck];
    const baseBottleneck = baseline.stages[baseline.bottleneck];
    let diagnosis = `بالاترین بار نسبی در «${result.bottleneckName}» با ${fa(result.bottleneckLoad)}٪ ظرفیت ثبت شده است. `;
    if (result.bottleneckLoad > 100) diagnosis += 'بار کاری از ظرفیت اسمی یک شیفت عبور کرده است؛ بنابراین انتظار و انباشت سفارش محتمل است.';
    else if (result.bottleneckLoad >= 85) diagnosis += 'این ایستگاه به ظرفیت اسمی نزدیک است و نسبت به افزایش تقاضا حساس خواهد بود.';
    else diagnosis += 'در این اجرای مدل، بهره‌برداری ایستگاه‌ها زیر ۸۵٪ است؛ گلوگاه باید با الگوی ورود و داده‌های بیشتر بررسی شود.';
    if (baseline.bottleneck !== result.bottleneck) diagnosis += ` گلوگاه نسبت به حالت پایه از «${baseBottleneck.name}» به «${bottleneck.name}» منتقل شده است؛ این اثر انتقال گلوگاه را بررسی کنید.`;
    if (result.firstPassYield < CASE.targets.firstPassYieldPercent) diagnosis += ` بازده عبور اول هنوز از هدف آموزشی ${CASE.targets.firstPassYieldPercent}٪ کمتر است.`;
    const costIncrease = baseline.totalCost ? ((result.totalCost - baseline.totalCost) / baseline.totalCost) * 100 : 0;
    if (costIncrease > CASE.targets.maxCostIncreasePercent) diagnosis += ` هزینه ${fa(costIncrease)}٪ بیشتر از پایه است و از سقف آموزشی ${CASE.targets.maxCostIncreasePercent}٪ عبور می‌کند.`;
    $('bottleneckNote').innerHTML = `<span class="callout-mark">!</span><div><b>تشخیص عملکردی مدل</b><p>${esc(diagnosis)}</p><p class="muted-note">این تشخیص از بار کاری محاسبه‌شده به دست می‌آید؛ با داده صف و محدودیت‌های مدل تفسیر شود.</p></div>`;
    updateToBePreview(config);
  }
  function runExperiment() {
    const config = getConfig();
    const base = window.ProcessSim.run(baselineConfig());
    const result = window.ProcessSim.run(config);
    lastRun = {
      id: `RUN-${Date.now()}`, at: new Date().toISOString(), config,
      result, baseline: base, hypothesis: $('hypothesis').value.trim(), goal: $('goal').value
    };
    baselineRun = base;
    renderResults(result, base, config);
    renderExperimentSummary();
    showToast('شبیه‌سازی اجرا شد؛ نتایج را با وضعیت پایه مقایسه کنید.');
  }
  $('runExperiment').addEventListener('click', runExperiment);
  ['demand', 'packers', 'packMinutes', 'reworkPercent', 'automation', 'checklist', 'extraPacker'].forEach((id) => {
    $(id).addEventListener('input', updateControls);
    $(id).addEventListener('change', updateControls);
  });
  $('resetControls').addEventListener('click', () => {
    const base = baselineConfig();
    $('demand').value = base.demand;
    $('packers').value = base.packers;
    $('packMinutes').value = base.packMinutes;
    $('reworkPercent').value = base.reworkPercent;
    $('automation').checked = false; $('checklist').checked = false; $('extraPacker').checked = false;
    $('hypothesis').value = ''; $('goal').value = 'balanced';
    updateControls(); runExperiment();
  });

  function renderHistory() {
    if (!history.length) {
      $('historyList').innerHTML = '<div class="empty-inline">هنوز سناریویی ذخیره نشده است.</div>';
      return;
    }
    $('historyList').innerHTML = history.slice().reverse().map((item) => `<div class="history-item"><div><b>${esc(item.name || 'اجرای آزمایشی')}</b><small>${new Date(item.at).toLocaleString('fa-IR')} · ${fi(item.result.demand)} سفارش · ${esc(item.tags || 'بدون مداخله')}</small></div><strong>${fa(item.result.averageCycle)} دقیقه</strong></div>`).join('');
  }
  $('saveScenario').addEventListener('click', () => {
    if (!lastRun) return showToast('ابتدا یک شبیه‌سازی اجرا کنید.');
    const tags = [lastRun.config.automation && 'خودکارسازی پرداخت', lastRun.config.checklist && 'چک‌لیست کیفیت', lastRun.config.extraPacker && 'نیروی اضافه'].filter(Boolean).join('، ') || 'تغییر پارامترها';
    history.push({ id: lastRun.id, at: lastRun.at, name: `سناریو ${fi(history.length + 1)}`, tags, result: lastRun.result, config: lastRun.config });
    history = history.slice(-12);
    saveJSON(STORAGE.history, history);
    renderHistory();
    showToast('سناریو در حافظه همین مرورگر ذخیره شد.');
  });
  $('clearHistory').addEventListener('click', () => { history = []; saveJSON(STORAGE.history, history); renderHistory(); showToast('تاریخچه آزمایش‌ها پاک شد.'); });

  // ---------------------------------------------------------------------------
  // Assessment evidence rendering
  // ---------------------------------------------------------------------------
  function renderEvidence(evidence) {
    if (!evidence) return '';
    const caption = `<div class="evidence-caption">${esc(evidence.caption || 'شواهد پرونده')}</div>`;
    if (evidence.kind === 'flow') {
      return caption + `<div class="evidence-flow">${(evidence.nodes || []).map((node, i) => `${i ? '<span class="evidence-arrow">←</span>' : ''}<div class="evidence-node ${node.type === 'xor' ? 'gateway' : ''}">${esc(node.label)}</div>`).join('')}</div>`;
    }
    if (evidence.kind === 'bars') {
      const max = Math.max(1, ...evidence.bars.map((bar) => Number(bar.value)));
      return caption + `<div class="evidence-bars">${evidence.bars.map((bar) => `<div class="evidence-bar-row"><span>${esc(bar.label)}</span><div class="evidence-bar-track"><i style="width:${Math.max(2, Number(bar.value) / max * 100)}%"></i></div><strong>${fa(bar.value)} ${esc(bar.unit || '')}</strong></div>`).join('')}</div>`;
    }
    if (evidence.kind === 'formula') return caption + `<div class="evidence-formula">${esc(evidence.formula)}</div>`;
    if (evidence.kind === 'metrics') return caption + `<div class="evidence-metrics">${evidence.metrics.map((metric) => `<div class="evidence-metric"><span>${esc(metric.label)}</span><b>${esc(metric.value)}</b></div>`).join('')}</div>`;
    if (evidence.kind === 'parallel') {
      return caption + `<div class="parallel-evidence"><div class="parallel-start">ثبت سفارش</div><div class="parallel-branches"><div>بررسی موجودی</div><div>اعتبارسنجی نشانی</div></div><div class="parallel-join">هر دو بررسی تکمیل شوند ← ادامه فرایند</div></div>`;
    }
    return caption;
  }

  // ---------------------------------------------------------------------------
  // Step-by-step Decision Arena
  // ---------------------------------------------------------------------------
  function updateQuestionMap() {
    $('questionMap').innerHTML = QUESTIONS.map((q, index) => {
      const done = answers[index] && Number.isInteger(answers[index].choice) && (!q.requiresReason || String(answers[index].reason || '').trim().length >= 15);
      return `<button type="button" class="map-dot ${index === currentQuestion ? 'current' : ''} ${done ? 'done' : ''}" data-qjump="${index}" aria-label="رفتن به سؤال ${index + 1}" ${done || index <= currentQuestion ? '' : 'disabled'}>${String(index + 1).padStart(2, '0')}</button>`;
    }).join('');
    $('questionMap').querySelectorAll('[data-qjump]').forEach((button) => button.addEventListener('click', () => {
      const target = Number(button.dataset.qjump);
      if (target <= currentQuestion || (answers[target] && Number.isInteger(answers[target].choice))) { currentQuestion = target; renderQuestion(); }
    }));
  }
  function renderQuestion() {
    const q = QUESTIONS[currentQuestion];
    if (!q) return;
    const existing = answers[currentQuestion] || {};
    $('questionCounter').textContent = `سؤال ${fi(currentQuestion + 1)} از ${fi(QUESTIONS.length)}`;
    $('questionLevel').textContent = q.level;
    $('questionDomain').textContent = q.domain;
    $('questionProgress').style.width = `${(currentQuestion / QUESTIONS.length) * 100}%`;
    $('questionEvidence').innerHTML = renderEvidence(q.evidence);
    $('questionTitle').textContent = q.title;
    $('questionPrompt').textContent = q.prompt;
    $('questionOptions').innerHTML = q.options.map((option, index) => `<label class="answer-option ${existing.choice === index ? 'selected' : ''}"><input type="radio" name="assessment-answer" value="${index}" ${existing.choice === index ? 'checked' : ''}><span class="option-key">${KEY_LABELS[index] || index + 1}</span><span>${esc(option.label)}</span></label>`).join('');
    $('questionReason').value = existing.reason || '';
    $('reasonRequirement').textContent = q.requiresReason ? 'الزامی: حداقل ۱۵ نویسه؛ یک یا دو جمله مستند بنویسید.' : 'اختیاری؛ برای بازبینی مدرس مفید است.';
    $('answerState').textContent = existing.choice === undefined ? 'یک گزینه انتخاب کنید.' : (q.requiresReason && String(existing.reason || '').trim().length < 15 ? 'برای ادامه، استدلال کوتاه خود را هم ثبت کنید.' : 'پاسخ و استدلال ثبت شده‌اند؛ می‌توانید آن‌ها را تغییر دهید.');
    $('previousQuestion').disabled = currentQuestion === 0;
    $('nextQuestion').disabled = !canContinueCurrentQuestion();
    $('nextQuestion').textContent = currentQuestion === QUESTIONS.length - 1 ? 'ثبت پاسخ و پایان آزمون' : 'ثبت و ادامه ←';
    $('questionOptions').querySelectorAll('input').forEach((radio) => radio.addEventListener('change', () => {
      answers[currentQuestion] = { ...(answers[currentQuestion] || {}), choice: Number(radio.value), reason: $('questionReason').value };
      $('questionOptions').querySelectorAll('.answer-option').forEach((label, index) => label.classList.toggle('selected', index === Number(radio.value)));
      const canContinue = canContinueCurrentQuestion();
      $('answerState').textContent = canContinue ? 'پاسخ ثبت شد؛ می‌توانید ادامه دهید.' : 'برای این سؤال، حداقل ۱۵ نویسه استدلال لازم است.';
      $('nextQuestion').disabled = !canContinue;
      saveJSON(STORAGE.answers, answers);
      updateQuestionMap();
    }));
    updateQuestionMap();
  }
  function canContinueCurrentQuestion() {
    const q = QUESTIONS[currentQuestion];
    const answer = answers[currentQuestion];
    if (!answer || !Number.isInteger(answer.choice)) return false;
    return !q.requiresReason || String($('questionReason').value || '').trim().length >= 15;
  }
  $('questionReason').addEventListener('input', () => {
    if (answers[currentQuestion]) {
      answers[currentQuestion].reason = $('questionReason').value;
      saveJSON(STORAGE.answers, answers);
    }
    const q = QUESTIONS[currentQuestion];
    const canContinue = canContinueCurrentQuestion();
    $('nextQuestion').disabled = !canContinue;
    if (q.requiresReason && answers[currentQuestion]?.choice !== undefined) {
      $('answerState').textContent = canContinue ? 'استدلال ثبت شد؛ می‌توانید ادامه دهید.' : 'برای ادامه، حداقل ۱۵ نویسه استدلال بنویسید.';
    }
    updateQuestionMap();
  });
  $('startAssessment').addEventListener('click', () => {
    const nextIncomplete = QUESTIONS.findIndex((q, index) => !answers[index] || !Number.isInteger(answers[index].choice) || (q.requiresReason && String(answers[index].reason || '').trim().length < 15));
    currentQuestion = nextIncomplete >= 0 ? nextIncomplete : 0;
    setHidden($('assessmentIntro'), true);
    setHidden($('assessmentComplete'), true);
    setHidden($('questionWorkspace'), false);
    renderQuestion();
  });
  $('previousQuestion').addEventListener('click', () => {
    if (currentQuestion > 0) {
      if (answers[currentQuestion]) answers[currentQuestion].reason = $('questionReason').value;
      saveJSON(STORAGE.answers, answers);
      currentQuestion -= 1; renderQuestion();
    }
  });
  $('nextQuestion').addEventListener('click', () => {
    if (!canContinueCurrentQuestion()) { showToast('برای ادامه، پاسخ و در صورت نیاز استدلال خود را کامل کنید.'); return; }
    answers[currentQuestion].reason = $('questionReason').value;
    saveJSON(STORAGE.answers, answers);
    if (currentQuestion < QUESTIONS.length - 1) {
      currentQuestion += 1;
      renderQuestion();
    } else {
      $('questionProgress').style.width = '100%';
      setHidden($('questionWorkspace'), true);
      setHidden($('assessmentComplete'), false);
      renderReport();
    }
  });
  $('assessmentComplete').insertAdjacentHTML('beforeend', '<button class="button button-quiet" id="restartAssessment" style="margin-right:8px">شروع دوباره آزمون</button>');
  $('restartAssessment').addEventListener('click', () => {
    answers = []; currentQuestion = 0; saveJSON(STORAGE.answers, answers);
    setHidden($('assessmentComplete'), true); setHidden($('assessmentIntro'), false); setHidden($('questionWorkspace'), true);
  });

  // ---------------------------------------------------------------------------
  // Diagnostic report and Decision Replay
  // ---------------------------------------------------------------------------
  function isAssessmentComplete() {
    return answers.length === QUESTIONS.length && QUESTIONS.every((q, index) => {
      const answer = answers[index];
      return !!answer && Number.isInteger(answer.choice) && (!q.requiresReason || String(answer.reason || '').trim().length >= 15);
    });
  }

  function weightedScore() {
    let numerator = 0, denominator = 0;
    QUESTIONS.forEach((q, index) => {
      const answer = answers[index];
      if (!answer || !Number.isInteger(answer.choice)) return;
      const weight = Number(q.weight || 1);
      numerator += Number(q.options[answer.choice].score || 0) * weight;
      denominator += 100 * weight;
    });
    return denominator ? Math.round(numerator / denominator * 100) : null;
  }
  function competencyResults() {
    const groups = new Map();
    QUESTIONS.forEach((q, index) => {
      const a = answers[index];
      if (!a || !Number.isInteger(a.choice)) return;
      const key = q.competency || q.domain;
      const list = groups.get(key) || [];
      list.push({ score: Number(q.options[a.choice].score || 0), weight: Number(q.weight || 1) });
      groups.set(key, list);
    });
    return [...groups.entries()].map(([name, values]) => {
      const totalWeight = values.reduce((sum, item) => sum + item.weight, 0);
      return { name, count: values.length, score: Math.round(values.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight) };
    }).sort((a, b) => a.score - b.score);
  }
  function renderCompetencies() {
    const groups = competencyResults();
    $('competencyBars').innerHTML = groups.map((item) => `<div class="competency-row"><label>${esc(item.name)}</label><div class="competency-track"><i style="width:${item.score}%"></i></div><strong class="competency-score">${fi(item.score)}٪</strong><span class="muted-note">${fi(item.count)} سؤال</span></div>`).join('');
  }
  function renderRecommendations() {
    const low = competencyResults().slice(0, 3);
    if (!low.length) { $('learningRecommendations').innerHTML = '<div class="empty-inline">پس از تکمیل آزمون، پیشنهادهای یادگیری نمایش داده می‌شوند.</div>'; return; }
    const mapping = {
      'مدل‌خوانی': ['خواندن نمودارهای دارای Gateway و مسیر استثنا', 'تمرین تفاوت Sequence Flow، Message Flow و منطق انشعاب'],
      'تحلیل شواهد': ['تحلیل Queue Time و Resource Utilization در چند سناریو', 'تفکیک نشانه عملیاتی از علت ریشه‌ای'],
      'استدلال کمی': ['تمرین ظرفیت اسمی و بار کاری با کنترل واحدها', 'مقایسه تقاضا، ظرفیت و نرخ بهره‌برداری'],
      'تحلیل دوباره‌کاری': ['تحلیل علت ریشه‌ای نقص و حلقه‌های بازگشت', 'طراحی کنترل پیشگیرانه و اندازه‌گیری FPY'],
      'انتخاب مداخله': ['مقایسه هزینه مداخلات با اثر مورد انتظار', 'طراحی آزمایش کنترل‌شده با یک متغیر در هر بار'],
      'اثر ساختاری تغییر': ['تمرین تبدیل فعالیت دستی به Service Task با حفظ مسیر استثنا', 'بررسی اثر تغییر فناوری بر کنترل‌های کسب‌وکار'],
      'موازی‌سازی': ['تمرین Parallel split/join و شرط همگام‌سازی', 'بررسی نیاز منابع در اجرای هم‌زمان'],
      'تاب‌آوری عملیاتی': ['تحلیل شوک تقاضا و انتقال گلوگاه', 'طراحی سیاست ظرفیت و اولویت‌بندی'],
      'مدیریت مبادله‌ها': ['مقایسه هم‌زمان زمان، هزینه و کیفیت', 'تعریف حداقل سطح خدمت و محدودیت تصمیم'],
      'اعتبارسنجی مدل': ['کالیبراسیون پارامترها با داده رویدادی', 'تحلیل حساسیت و مستندسازی محدودیت‌های مدل']
    };
    $('learningRecommendations').innerHTML = low.map((item) => {
      const suggestions = mapping[item.name] || ['مرور شواهد و فرضیات تصمیم', 'تمرین مقایسه گزینه‌های جایگزین'];
      return `<article class="recommendation"><span class="rec-level">${item.score < 50 ? 'اولویت بالا' : item.score < 75 ? 'نیازمند تقویت' : 'تمرین تکمیلی'}</span><b>${esc(item.name)} · ${fi(item.score)}٪</b><p>${esc(suggestions.join('؛ '))}</p><small class="muted-note">شواهد: ${fi(item.count)} سؤال؛ این امتیاز تشخیصی مقدماتی است.</small></article>`;
    }).join('');
  }
  function renderReplay() {
    if (!isAssessmentComplete()) {
      $('decisionReplay').innerHTML = '<div class="empty-inline">پس از تکمیل آزمون، بازبینی انتخاب‌ها و پیامد هر گزینه اینجا نمایش داده می‌شود.</div>';
      return;
    }
    $('decisionReplay').innerHTML = QUESTIONS.map((q, index) => {
      const chosenIndex = answers[index].choice;
      const chosen = q.options[chosenIndex];
      const bestIndex = q.options.reduce((best, option, i) => option.score > q.options[best].score ? i : best, 0);
      const best = q.options[bestIndex];
      const reviewOptions = q.options.map((option, optionIndex) => {
        const flags = [optionIndex === chosenIndex ? 'selected-answer' : '', optionIndex === bestIndex ? 'best-answer' : ''].filter(Boolean).join(' ');
        const labels = [optionIndex === chosenIndex ? 'انتخاب شما' : '', optionIndex === bestIndex ? 'گزینه با امتیاز بالاتر در این سناریو' : ''].filter(Boolean).join(' · ');
        return `<div class="replay-answer ${flags}"><span class="answer-tag">${labels || 'گزینه جایگزین'} · امتیاز ${fi(option.score)} از ۱۰۰</span><b>${esc(option.label)}</b><p>${esc(option.feedback)}</p><p><strong>پیامد محتمل:</strong> ${esc(option.impact)}</p></div>`;
      }).join('');
      return `<details class="replay-item"><summary><span class="replay-no">${String(index + 1).padStart(2, '0')}</span><span class="replay-question">${esc(q.title)}</span><span class="replay-score">${fi(chosen.score)} / ۱۰۰</span></summary><div class="replay-body"><div class="replay-meta"><span>${esc(q.level)}</span><span>${esc(q.domain)}</span><span>${esc(q.competency)}</span></div><div class="replay-choice">${reviewOptions}</div><div class="replay-explanation"><strong>منطق پاسخ برتر:</strong> ${esc(q.bestExplanation)}<br><strong>نکته یادگیری:</strong> ${esc(q.learningTip)}</div>${answers[index].reason ? `<div class="student-reason"><strong>استدلال ثبت‌شده شما:</strong><br>${esc(answers[index].reason)}</div>` : '<div class="student-reason">برای این سؤال استدلال متنی ثبت نشده است.</div>'}</div></details>`;
    }).join('');
  }
  const DIAGNOSTIC_LABELS = {
    gateway_parallel_confusion: 'اشتباه در تفسیر انشعاب موازی', gateway_inclusiveness_confusion: 'ابهام در انتخاب Gateway', event_vs_data_gateway: 'اشتباه بین تصمیم داده‌محور و انتظار رویداد',
    quality_control_bypass: 'حذف کنترل بدون ارزیابی ریسک کیفیت', upstream_local_optimization: 'بهینه‌سازی محلی در بالادست', terminal_activity_local_optimization: 'تمرکز بر فعالیت انتهایی به‌جای شواهد گلوگاه',
    single_server_capacity: 'نادیده‌گرفتن تعداد منابع موازی', wrong_service_time: 'خطا در استفاده از زمان خدمت', capacity_overestimate: 'بیش‌برآورد ظرفیت اسمی',
    rework_loop_removal: 'حذف مسیر اصلاح به‌جای رفع علت', resource_misalignment: 'انتقال نامتناسب منابع', quality_shortcut: 'کاهش کنترل کیفیت بدون شواهد',
    cost_without_root_cause: 'افزایش هزینه بدون تشخیص علت ریشه‌ای', blanket_processing_time_increase: 'افزایش عمومی زمان خدمت بدون هدف‌گیری علت',
    gateway_removal_after_automation: 'فرض موفقیت قطعی اتوماسیون', gateway_semantics_mismatch: 'تغییر نادرست منطق Gateway', payment_control_omission: 'حذف کنترل پرداخت',
    exclusive_gateway_for_required_checks: 'استفاده از انشعاب انحصاری برای کنترل‌های الزامی', missing_synchronization: 'نبود همگام‌سازی مسیرهای موازی', unsupported_time_reduction: 'افتراض کاهش زمان بدون تغییر ساختار',
    upstream_local_optimization: 'بهینه‌سازی محلی در بالادست', capacity_arithmetic_misread: 'خطا در مقایسه تقاضا با ظرفیت',
    single_metric_optimization: 'بهینه‌سازی تک‌شاخصی', metric_suppression: 'حذف شاخص نامطلوب از گزارش', reactive_reversal_without_diagnosis: 'بازگشت واکنشی بدون تحلیل علت',
    model_overconfidence: 'اعتماد بیش‌ازحد به مدل آموزشی', parameter_tuning_without_validation: 'تنظیم پارامتر بدون اعتبارسنجی', presentation_over_evidence: 'ترجیح ظاهر گزارش بر شواهد'
  };

  function renderDiagnosticSignals() {
    const selected = QUESTIONS.map((question, index) => {
      const answer = answers[index];
      if (!answer || !Number.isInteger(answer.choice)) return null;
      const option = question.options[answer.choice];
      if (Number(option.score) >= 100) return null;
      return { question, option, index, score: Number(option.score || 0), tag: option.diagnosticTag || 'general-review' };
    }).filter(Boolean);
    const high = selected.filter((item) => item.score === 0).length;
    const moderate = selected.filter((item) => item.score > 0 && item.score <= 20).length;
    const partial = selected.filter((item) => item.score > 20).length;
    $('diagnosticSummary').innerHTML = `<span>${fi(selected.length)} انتخاب نیازمند بازبینی</span><span>${fi(high)} ریسک استدلالی جدی</span><span>${fi(moderate)} انتخاب ضعیف یا ناقص</span><span>${fi(partial)} پاسخ تا حدی قابل دفاع</span>`;
    if (!selected.length) {
      $('diagnosticSignals').innerHTML = '<div class="empty-inline">در این سناریو، همه انتخاب‌ها بالاترین امتیاز را دریافت کرده‌اند. برای ارزیابی عمیق‌تر، استدلال‌های ثبت‌شده و فرضیات آزمایش را نیز مرور کنید.</div>';
    } else {
      $('diagnosticSignals').innerHTML = selected.map((item) => {
        const severity = item.score === 0 ? 'high' : item.score <= 20 ? 'medium' : 'partial';
        const badge = severity === 'high' ? 'نیازمند بازبینی جدی' : severity === 'medium' ? 'نیازمند تقویت' : 'پاسخ ناقص / قابل دفاع';
        const signal = DIAGNOSTIC_LABELS[item.tag] || 'الگوی تصمیم نیازمند بازبینی';
        return `<article class="diagnostic-signal ${severity}"><span class="signal-label">${badge} · ${fi(item.score)}/۱۰۰</span><b>${esc(signal)}</b><p><strong>در سؤال ${fi(item.index + 1)}:</strong> ${esc(item.question.title)}</p><p><strong>انتخاب:</strong> ${esc(item.option.label)}</p><p><strong>ریسک یا پیامد محتمل:</strong> ${esc(item.option.impact)}</p><p><strong>گام اصلاحی پیشنهادی:</strong> ${esc(item.question.learningTip)}</p></article>`;
      }).join('');
    }
    const required = QUESTIONS.filter((q) => q.requiresReason);
    const completedReasons = required.filter((q) => {
      const i = QUESTIONS.findIndex((candidate) => candidate.id === q.id);
      return String(answers[i]?.reason || '').trim().length >= 15;
    }).length;
    const anyReasons = answers.filter((a) => String(a?.reason || '').trim().length > 0).length;
    $('reasonCoverage').innerHTML = `<strong>پوشش استدلال مکتوب:</strong> ${fi(completedReasons)} از ${fi(required.length)} سؤال الزامی دارای استدلال قابل قبول از نظر حداقل طول هستند. در مجموع برای ${fi(anyReasons)} سؤال توضیحی ثبت شده است. <br>این شاخص فقط ثبت متن را می‌سنجد، نه کیفیت محتوای استدلال؛ کیفیت آن باید توسط مدرس بررسی شود.`;
  }

  function renderExperimentSummary() {
    if (!lastRun) {
      $('experimentSummary').innerHTML = '<div class="empty-inline">هنوز اجرای شبیه‌سازی انجام نشده است.</div>';
      return;
    }
    const r = lastRun.result, b = lastRun.baseline;
    const costDelta = b.totalCost ? ((r.totalCost - b.totalCost) / b.totalCost) * 100 : 0;
    const items = [
      ['زمان چرخه', `${fa(r.averageCycle)} دقیقه`, delta(b.averageCycle, r.averageCycle, true).text],
      ['تکمیل در شیفت', `${fi(r.completedWithinShift)} سفارش`, delta(b.completedWithinShift, r.completedWithinShift, false).text],
      ['هزینه', `${fi(r.totalCost)} واحد`, `${costDelta >= 0 ? '+' : ''}${fa(costDelta)}٪ نسبت به پایه`],
      ['گلوگاه', r.bottleneckName, `${fa(r.bottleneckLoad)}٪ ظرفیت`]
    ];
    $('experimentSummary').innerHTML = `<div class="detail-stats">${items.map(([label, value, change]) => `<div><span>${esc(label)}</span><b>${esc(value)}</b><small>${esc(change)}</small></div>`).join('')}</div>${lastRun.hypothesis ? `<p class="muted-note"><strong>فرضیه ثبت‌شده:</strong> ${esc(lastRun.hypothesis)}</p>` : ''}`;
  }
  function renderReport() {
    const completed = isAssessmentComplete();
    setHidden($('reportEmpty'), completed);
    setHidden($('reportContent'), !completed);
    if (!completed) return;
    const score = weightedScore();
    $('overallScore').textContent = fi(score);
    $('scoreLabel').textContent = score >= 85 ? 'عملکرد قوی در این سناریو' : score >= 70 ? 'درک مناسب با فرصت بهبود' : score >= 50 ? 'نیازمند تقویت چند مهارت' : 'نیازمند بازآموزی هدفمند';
    renderCompetencies();
    renderDiagnosticSignals();
    renderExperimentSummary();
    renderRecommendations();
    renderReplay();
  }

  // ---------------------------------------------------------------------------
  // Report export, printing and help
  // ---------------------------------------------------------------------------
  function reportPayload() {
    const required = QUESTIONS.filter((q) => q.requiresReason);
    const completedRequiredReasons = required.filter((q) => {
      const index = QUESTIONS.findIndex((candidate) => candidate.id === q.id);
      return String(answers[index]?.reason || '').trim().length >= 15;
    }).length;
    const answerRows = QUESTIONS.map((q, index) => {
      const response = answers[index] || {};
      const selected = Number.isInteger(response.choice) ? q.options[response.choice] : null;
      const bestIndex = q.options.reduce((best, option, i) => option.score > q.options[best].score ? i : best, 0);
      return {
        questionId: q.id, title: q.title, prompt: q.prompt, level: q.level, domain: q.domain,
        competency: q.competency, weight: q.weight, requiresReason: !!q.requiresReason,
        selectedOption: selected?.label || null, selectedScore: selected?.score ?? null,
        selectedFeedback: selected?.feedback || null, selectedImpact: selected?.impact || null,
        diagnosticTag: selected?.diagnosticTag || null, bestOption: q.options[bestIndex].label,
        bestExplanation: q.bestExplanation, learningTip: q.learningTip,
        reasoning: response.reason || '',
        optionReview: q.options.map((option) => ({ label: option.label, score: option.score, feedback: option.feedback, impact: option.impact, diagnosticTag: option.diagnosticTag }))
      };
    });
    return {
      project: 'BPMN Decision Lab', version: '0.4.1', caseId: CASE.id, assessmentId: DATA.assessment.id,
      generatedAt: new Date().toISOString(), overallScore: weightedScore(),
      competencies: competencyResults(),
      rationaleCoverage: { requiredItems: required.length, completedRequiredItems: completedRequiredReasons, itemsWithAnyText: answers.filter((a) => String(a?.reason || '').trim().length > 0).length, note: 'Coverage counts text presence and minimum length only; it does not grade reasoning quality.' },
      diagnosticSignals: answerRows.filter((row) => row.selectedScore !== null && row.selectedScore < 100).map((row) => ({ questionId: row.questionId, title: row.title, score: row.selectedScore, diagnosticTag: row.diagnosticTag, selectedOption: row.selectedOption, impact: row.selectedImpact, learningTip: row.learningTip })),
      answers: answerRows,
      latestExperiment: lastRun ? { at: lastRun.at, config: lastRun.config, hypothesis: lastRun.hypothesis, goal: lastRun.goal, result: lastRun.result, baseline: lastRun.baseline } : null,
      limitations: ['Fictional case data', 'Simplified discrete-event model', 'Free-text reasoning is not automatically scored', 'This prototype is not a full BPMN 2.0 editor or conformance validator']
    };
  }
  $('exportReport').addEventListener('click', () => {
    if (!isAssessmentComplete()) return showToast('ابتدا آزمون و استدلال‌های الزامی را کامل کنید.');
    const blob = new Blob([JSON.stringify(reportPayload(), null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = url; link.download = 'bpmn-decision-lab-report.json'; link.click();
    URL.revokeObjectURL(url);
  });
  $('printReport').addEventListener('click', () => window.print());
  $('helpButton').addEventListener('click', () => $('helpDialog').showModal());
  $('closeHelp').addEventListener('click', () => $('helpDialog').close());
  $('helpDialog').addEventListener('click', (event) => { if (event.target === $('helpDialog')) $('helpDialog').close(); });

  // ---------------------------------------------------------------------------
  // Initial state
  // ---------------------------------------------------------------------------
  renderDiagram('processDiagram');
  renderAssumptions();
  renderDiagram('toBeDiagram', [], true);
  selectNode(selectedNode);
  updateControls();
  renderHistory();
  baselineRun = window.ProcessSim.run(baselineConfig());
  renderExperimentSummary();
  if (isAssessmentComplete()) {
    setHidden($('assessmentIntro'), true);
    setHidden($('assessmentComplete'), false);
    setHidden($('questionWorkspace'), true);
  }
})();
