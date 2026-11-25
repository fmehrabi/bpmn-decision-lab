/*
 * BPMN Decision Lab — deterministic teaching simulation
 * Discrete-event, FIFO resource queues; fixed uniform arrivals; seeded random outcomes.
 * No network requests, third-party packages, or external APIs.
 */
(function (global) {
  'use strict';

  function mulberry32(seed) {
    return function () {
      let t = seed += 0x6D2B79F5;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createStation(name, servers) {
    const count = Math.max(1, Math.floor(servers));
    return { name, freeAt: Array(count).fill(0), busy: 0, wait: 0, jobs: 0, maxWait: 0 };
  }

  function serve(station, arrival, duration) {
    let server = 0;
    for (let i = 1; i < station.freeAt.length; i++) {
      if (station.freeAt[i] < station.freeAt[server]) server = i;
    }
    const start = Math.max(arrival, station.freeAt[server]);
    const wait = start - arrival;
    const end = start + Math.max(0, duration);
    station.freeAt[server] = end;
    station.busy += Math.max(0, duration);
    station.wait += wait;
    station.maxWait = Math.max(station.maxWait, wait);
    station.jobs += 1;
    return { start, end, wait, server };
  }

  function percentile(values, p) {
    if (!values.length) return 0;
    const sorted = values.slice().sort((a, b) => a - b);
    const pos = (sorted.length - 1) * p;
    const lo = Math.floor(pos);
    const hi = Math.ceil(pos);
    return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo);
  }

  function run(config, baseline) {
    const cfg = Object.assign({
      demand: 80,
      packers: 2,
      packMinutes: 12,
      reworkPercent: 8,
      paymentFailurePercent: 4,
      shiftMinutes: 480,
      automation: false,
      checklist: false,
      extraPacker: false,
      seed: 20261125
    }, config || {});

    const demand = Math.max(1, Math.min(240, Math.round(cfg.demand)));
    const shiftMinutes = Math.max(60, cfg.shiftMinutes);
    const packers = Math.max(1, Math.min(10, Math.round(cfg.packers))) + (cfg.extraPacker ? 1 : 0);
    const packMinutes = Math.max(1, cfg.packMinutes);
    const reworkPercent = cfg.checklist ? Math.min(cfg.reworkPercent, 3) : cfg.reworkPercent;
    const paymentFailureProbability = cfg.paymentFailurePercent / 100;
    const reworkProbability = reworkPercent / 100;

    const stations = {
      register: createStation('ثبت سفارش', 1),
      payment: createStation('تأیید پرداخت', cfg.automation ? 3 : 1),
      packing: createStation('جمع‌آوری و بسته‌بندی', packers),
      quality: createStation('کنترل کیفیت', 1),
      dispatch: createStation('تحویل به ارسال', 1)
    };

    // Common random numbers: the same seed makes baseline and interventions comparable.
    const paymentRng = mulberry32(cfg.seed + 101);
    const reworkRng = mulberry32(cfg.seed + 307);
    const waitsPerOrder = [];
    const cycleTimes = [];
    const completionTimes = [];
    let cancelled = 0;
    let reworked = 0;
    let paidOrders = 0;
    let firstPass = 0;
    let completed = 0;
    let completedWithinShift = 0;

    for (let i = 0; i < demand; i++) {
      const arrival = i * (shiftMinutes / demand);
      let orderWait = 0;
      const registration = serve(stations.register, arrival, 2);
      orderWait += registration.wait;

      const paymentDuration = cfg.automation ? 1.2 : 4;
      const payment = serve(stations.payment, registration.end, paymentDuration);
      orderWait += payment.wait;

      if (paymentRng() < paymentFailureProbability) {
        cancelled += 1;
        waitsPerOrder.push(orderWait);
        continue;
      }
      paidOrders += 1;

      const packing = serve(stations.packing, payment.end, packMinutes);
      orderWait += packing.wait;
      let quality = serve(stations.quality, packing.end, 5);
      orderWait += quality.wait;

      if (reworkRng() < reworkProbability) {
        reworked += 1;
        const correction = serve(stations.packing, quality.end, 6);
        orderWait += correction.wait;
        quality = serve(stations.quality, correction.end, 4);
        orderWait += quality.wait;
      } else {
        firstPass += 1;
      }

      const dispatch = serve(stations.dispatch, quality.end, 4);
      orderWait += dispatch.wait;
      const cycle = dispatch.end - arrival;
      cycleTimes.push(cycle);
      completionTimes.push(dispatch.end);
      waitsPerOrder.push(orderWait);
      completed += 1;
      if (dispatch.end <= shiftMinutes) completedWithinShift += 1;
    }

    const staffing = {
      register: 1,
      payment: cfg.automation ? 0 : 1,
      packing: packers,
      quality: 1,
      dispatch: 1
    };
    const stage = {};
    Object.keys(stations).forEach((key) => {
      const s = stations[key];
      const capacity = staffing[key] || s.freeAt.length;
      const nominalCapacity = capacity * shiftMinutes;
      stage[key] = {
        name: s.name,
        jobs: s.jobs,
        averageWait: s.jobs ? s.wait / s.jobs : 0,
        maxWait: s.maxWait,
        busyMinutes: s.busy,
        capacityMinutes: nominalCapacity,
        workloadPercent: nominalCapacity ? (s.busy / nominalCapacity) * 100 : 0
      };
    });

    const totalWait = waitsPerOrder.reduce((sum, value) => sum + value, 0);
    const averageCycle = cycleTimes.length ? cycleTimes.reduce((sum, value) => sum + value, 0) / cycleTimes.length : 0;
    const sortedStages = Object.entries(stage).sort((a, b) => b[1].workloadPercent - a[1].workloadPercent);
    const labourHeadcount = Object.values(staffing).reduce((sum, n) => sum + n, 0);
    const labourCost = labourHeadcount * 120;
    const automationCost = cfg.automation ? 45 + (demand * 0.2) : 0;
    const checklistCost = cfg.checklist ? 20 : 0;
    const totalCost = labourCost + automationCost + checklistCost;
    const totalQueueJobs = Object.values(stations).reduce((sum, station) => sum + station.jobs, 0);
    const averageWaitPerQueueVisit = totalQueueJobs
      ? Object.values(stations).reduce((sum, station) => sum + station.wait, 0) / totalQueueJobs
      : 0;
    const firstPassYield = paidOrders ? (firstPass / paidOrders) * 100 : 0;
    const reworkRateObserved = paidOrders ? (reworked / paidOrders) * 100 : 0;
    const lateOrders = Math.max(0, completed - completedWithinShift);

    return {
      demand,
      paidOrders,
      cancelled,
      completed,
      completedWithinShift,
      lateOrders,
      reworked,
      firstPass,
      firstPassYield,
      reworkRateObserved,
      averageCycle,
      medianCycle: percentile(cycleTimes, 0.5),
      p90Cycle: percentile(cycleTimes, 0.9),
      averageWaitPerOrder: waitsPerOrder.length ? totalWait / waitsPerOrder.length : 0,
      averageWaitPerQueueVisit,
      totalWait,
      labourHeadcount,
      labourCost,
      automationCost,
      checklistCost,
      totalCost,
      costPerCompleted: completed ? totalCost / completed : 0,
      stages: stage,
      bottleneck: sortedStages.length ? sortedStages[0][0] : null,
      bottleneckName: sortedStages.length ? sortedStages[0][1].name : 'نامشخص',
      bottleneckLoad: sortedStages.length ? sortedStages[0][1].workloadPercent : 0,
      shiftMinutes,
      cycleTimes,
      completionTimes,
      assumptions: {
        arrivalPattern: 'Uniform arrivals across the shift',
        paymentFailurePercent: cfg.paymentFailurePercent,
        reworkPercent,
        packMinutes,
        packers,
        automation: !!cfg.automation,
        checklist: !!cfg.checklist,
        seed: cfg.seed
      }
    };
  }

  global.ProcessSim = { run };
})(window);
