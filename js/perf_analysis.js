/**
 * CX Performance Deep Analysis — Charts & Insights Module
 * Renders full analytics dashboard from Data Performance & Data Statistik sheets
 */

(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const instances = {};

  function destroyChart(id) {
    if (instances[id]) {
      instances[id].destroy();
      delete instances[id];
    }
  }

  function makeChart(id, config) {
    destroyChart(id);
    const el = $(id);
    if (!el) return null;
    const chart = new Chart(el.getContext('2d'), config);
    instances[id] = chart;
    return chart;
  }

  const MONTHS = [
    "Jan 25","Feb 25","Mar 25","Apr 25","May 25","Jun 25",
    "Jul 25","Aug 25","Sep 25","Oct 25","Nov 25","Dec 25",
    "Jan 26","Feb 26","Mar 26","Apr 26","May 26","Jun 26"
  ];

  const PALETTE = [
    '#6366f1','#06b6d4','#10b981','#f59e0b','#ef4444',
    '#8b5cf6','#f97316','#ec4899','#14b8a6','#84cc16'
  ];

  const BU_COLORS = {
    'API': '#6366f1',
    'HIN': '#06b6d4',
    'IAS': '#10b981',
    'IDM - TMII': '#f59e0b',
    'IDM - TWC': '#f97316',
    'ITDC': '#ec4899',
    'Sarinah': '#8b5cf6',
  };

  function clean(arr) {
    return (arr || []).map(v => (v === null || v === undefined || isNaN(v)) ? null : parseFloat(v));
  }

  function sumClean(arr) {
    return (arr || []).reduce((a, v) => a + (v || 0), 0);
  }

  function avgClean(arr) {
    const valid = (arr || []).filter(v => v !== null && v !== undefined && !isNaN(v));
    return valid.length ? valid.reduce((a, v) => a + v, 0) / valid.length : null;
  }

  function lastValid(arr) {
    const valid = (arr || []).filter(v => v !== null && !isNaN(v));
    return valid.length ? valid[valid.length - 1] : null;
  }

  function fmt(v, decimals = 1) {
    if (v === null || v === undefined || isNaN(v)) return '—';
    return parseFloat(v).toFixed(decimals);
  }

  function fmtNum(v) {
    if (v === null || v === undefined) return '—';
    return Math.round(v).toLocaleString('id-ID');
  }

  function gridOptions(yLabel = '') {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', labels: { color: '#94a3b8', padding: 12 } },
        tooltip: {
          backgroundColor: 'rgba(15,23,42,0.95)',
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          padding: 10,
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', maxRotation: 45 } },
        y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' }, title: { display: !!yLabel, text: yLabel, color: '#64748b' } }
      }
    };
  }

  // ─────────────────────────────────────────────────────────────
  // SECTION 1: KPI Summary Cards
  // ─────────────────────────────────────────────────────────────
  function renderKPISummaryCards(perfData, selectedBU) {
    const container = $('pa-kpi-cards');
    if (!container) return;

    const bus = selectedBU === 'all'
      ? Object.keys(perfData).filter(k => !k.startsWith('_'))
      : [selectedBU];

    let totalPengunjung = 0, totalInteraksi = 0, totalComplaints = 0, totalCompleted = 0;
    let csatScores = [], serviceScores = [], resolutionRates = [];

    bus.forEach(bu => {
      const d = perfData[bu];
      if (!d) return;
      const st = d.statistik || {};
      const perf = d.performance || {};
      const comp = d.complaints || perf.complaints || {};

      totalPengunjung += sumClean(st.jumlah_pengunjung);
      totalInteraksi += sumClean(st.total_interaksi);
      totalComplaints += sumClean(comp.total);
      totalCompleted += sumClean(comp.completed);

      const csatOverall = perf.csat ? perf.csat.overall : (d.scores ? d.scores.overall : []);
      const lastCsat = lastValid(csatOverall);
      if (lastCsat) csatScores.push(lastCsat);

      const svcOverall = perf.branch_service ? perf.branch_service.overall : [];
      const lastSvc = lastValid(svcOverall);
      if (lastSvc) serviceScores.push(lastSvc);

      const lastRes = lastValid(comp.resolution_rate);
      if (lastRes) resolutionRates.push(lastRes);
    });

    const avgCsat = csatScores.length ? (csatScores.reduce((a, b) => a + b, 0) / csatScores.length) : null;
    const avgSvc = serviceScores.length ? (serviceScores.reduce((a, b) => a + b, 0) / serviceScores.length) : null;
    const avgRes = resolutionRates.length ? (resolutionRates.reduce((a, b) => a + b, 0) / resolutionRates.length) : null;
    const resRate = totalComplaints > 0 ? (totalCompleted / totalComplaints * 100) : null;

    const kpis = [
      { label: 'Total Pengunjung', value: fmtNum(totalPengunjung), icon: '👥', color: '#6366f1', sub: 'Seluruh periode' },
      { label: 'Total Interaksi', value: fmtNum(totalInteraksi), icon: '💬', color: '#06b6d4', sub: 'Seluruh periode' },
      { label: 'CSAT Terkini', value: avgCsat ? fmt(avgCsat, 2) : '—', icon: '⭐', color: '#10b981', sub: 'Rata-rata skala 1-5' },
      { label: 'Service Performance', value: avgSvc ? fmt(avgSvc, 1) + '%' : '—', icon: '🎯', color: '#f59e0b', sub: 'Rata-rata BU' },
      { label: 'Total Complaint', value: fmtNum(totalComplaints), icon: '⚠️', color: '#ef4444', sub: 'Seluruh periode' },
      { label: 'Resolution Rate', value: resRate ? fmt(resRate, 1) + '%' : (avgRes ? fmt(avgRes, 1) + '%' : '—'), icon: '✅', color: '#8b5cf6', sub: 'Tingkat penyelesaian' },
    ];

    container.innerHTML = kpis.map(k => `
      <div class="kpi-card" style="border-top: 3px solid ${k.color};">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div class="kpi-title">${k.label}</div>
          <span style="font-size:1.5rem;">${k.icon}</span>
        </div>
        <div class="kpi-value" style="color:${k.color}; font-size:1.8rem;">${k.value}</div>
        <div style="font-size:0.75rem; color:#64748b; margin-top:0.25rem;">${k.sub}</div>
      </div>
    `).join('');
  }

  // ─────────────────────────────────────────────────────────────
  // SECTION 2: CSAT Trend Chart (multi-BU comparison)
  // ─────────────────────────────────────────────────────────────
  function renderCSATTrend(perfData, selectedBU) {
    const bus = selectedBU === 'all'
      ? Object.keys(perfData).filter(k => !k.startsWith('_'))
      : [selectedBU];

    const datasets = bus.map((bu, i) => {
      const d = perfData[bu];
      if (!d) return null;
      const perf = d.performance || {};
      const scores = d.scores || {};
      const overall = perf.csat ? perf.csat.overall : (scores.overall || []);
      return {
        label: bu,
        data: clean(overall),
        borderColor: BU_COLORS[bu] || PALETTE[i],
        backgroundColor: (BU_COLORS[bu] || PALETTE[i]) + '22',
        fill: false,
        tension: 0.4,
        pointRadius: 4,
        spanGaps: true,
      };
    }).filter(Boolean);

    const opts = gridOptions('CSAT Score');
    opts.plugins.title = { display: false };
    opts.scales.y.min = 3.5;
    opts.scales.y.max = 5.0;

    makeChart('pa-csat-trend', {
      type: 'line',
      data: { labels: MONTHS, datasets },
      options: opts
    });
  }

  // ─────────────────────────────────────────────────────────────
  // SECTION 3: CSAT Radar (People, Process, Premises)
  // ─────────────────────────────────────────────────────────────
  function renderCSATRadar(perfData, selectedBU) {
    const bus = selectedBU === 'all'
      ? Object.keys(perfData).filter(k => !k.startsWith('_'))
      : [selectedBU];

    const datasets = bus.map((bu, i) => {
      const d = perfData[bu];
      if (!d) return null;
      const perf = d.performance || {};
      const scores = d.scores || {};
      const csat = perf.csat || {};

      const overall = avgClean(csat.overall || scores.overall);
      const people = avgClean(csat.people || scores.people);
      const process = avgClean(csat.process || scores.process);
      const premises = avgClean(csat.premises || scores.premises);

      if (!overall && !people && !process && !premises) return null;

      const color = BU_COLORS[bu] || PALETTE[i];
      return {
        label: bu,
        data: [overall, people, process, premises].map(v => v ? parseFloat(v.toFixed(2)) : null),
        borderColor: color,
        backgroundColor: color + '33',
        pointBackgroundColor: color,
      };
    }).filter(Boolean);

    makeChart('pa-csat-radar', {
      type: 'radar',
      data: {
        labels: ['Overall', 'People', 'Process', 'Premises'],
        datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            min: 3.5, max: 5.0, ticks: { stepSize: 0.5, color: '#64748b', backdropColor: 'transparent' },
            grid: { color: 'rgba(255,255,255,0.08)' },
            angleLines: { color: 'rgba(255,255,255,0.08)' },
            pointLabels: { color: '#94a3b8', font: { size: 13 } }
          }
        },
        plugins: { legend: { position: 'top', labels: { color: '#94a3b8' } } }
      }
    });
  }

  // ─────────────────────────────────────────────────────────────
  // SECTION 4: Service Performance Trend
  // ─────────────────────────────────────────────────────────────
  function renderServicePerfTrend(perfData, selectedBU) {
    const bus = selectedBU === 'all'
      ? Object.keys(perfData).filter(k => !k.startsWith('_'))
      : [selectedBU];

    const datasets = bus.map((bu, i) => {
      const d = perfData[bu];
      if (!d) return null;
      const svc = (d.performance || {}).branch_service || {};
      if (!svc.overall || !svc.overall.some(v => v)) return null;
      return {
        label: bu,
        data: clean(svc.overall),
        borderColor: BU_COLORS[bu] || PALETTE[i],
        backgroundColor: (BU_COLORS[bu] || PALETTE[i]) + '22',
        fill: false, tension: 0.4, spanGaps: true, pointRadius: 3,
      };
    }).filter(Boolean);

    const opts = gridOptions('Service Score (%)');
    opts.scales.y.min = 50;
    opts.scales.y.max = 100;

    makeChart('pa-service-trend', {
      type: 'line',
      data: { labels: MONTHS, datasets },
      options: opts
    });
  }

  // ─────────────────────────────────────────────────────────────
  // SECTION 5: Call Center Performance
  // ─────────────────────────────────────────────────────────────
  function renderCallCenterCharts(perfData, selectedBU) {
    const bus = selectedBU === 'all'
      ? Object.keys(perfData).filter(k => !k.startsWith('_'))
      : [selectedBU];

    // FCR & Service Level Multi-BU
    const fcrDatasets = [], slDatasets = [];
    bus.forEach((bu, i) => {
      const d = perfData[bu];
      if (!d) return;
      const cc = d.call_center || (d.performance || {}).call_center || {};
      const color = BU_COLORS[bu] || PALETTE[i];

      if (cc.fcr && cc.fcr.some(v => v)) {
        fcrDatasets.push({
          label: bu, data: clean(cc.fcr),
          borderColor: color, backgroundColor: color + '22',
          fill: false, tension: 0.4, spanGaps: true, pointRadius: 3,
        });
      }
      if (cc.service_level && cc.service_level.some(v => v)) {
        slDatasets.push({
          label: bu, data: clean(cc.service_level),
          borderColor: color, backgroundColor: color + '22',
          fill: false, tension: 0.4, spanGaps: true, pointRadius: 3,
        });
      }
    });

    if (fcrDatasets.length) {
      const opts = gridOptions('FCR (%)');
      opts.scales.y.min = 60;
      makeChart('pa-fcr-chart', { type: 'line', data: { labels: MONTHS, datasets: fcrDatasets }, options: opts });
    }

    if (slDatasets.length) {
      const opts = gridOptions('Service Level (%)');
      opts.scales.y.min = 60;
      makeChart('pa-sl-chart', { type: 'line', data: { labels: MONTHS, datasets: slDatasets }, options: opts });
    }

    // Call Volume Bar chart - total per BU
    const buLabels = [], buVolumes = [], buColors = [];
    bus.forEach((bu, i) => {
      const d = perfData[bu];
      if (!d) return;
      const cc = d.call_center || (d.performance || {}).call_center || {};
      const vol = sumClean(cc.volume);
      if (vol > 0) {
        buLabels.push(bu);
        buVolumes.push(vol);
        buColors.push(BU_COLORS[bu] || PALETTE[i]);
      }
    });

    if (buLabels.length) {
      makeChart('pa-callvol-chart', {
        type: 'bar',
        data: {
          labels: buLabels,
          datasets: [{ label: 'Total Volume Panggilan', data: buVolumes, backgroundColor: buColors, borderRadius: 6 }]
        },
        options: {
          ...gridOptions('Volume'),
          plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y.toLocaleString('id-ID')} panggilan` } } }
        }
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SECTION 6: Complaint Handling
  // ─────────────────────────────────────────────────────────────
  function renderComplaintCharts(perfData, selectedBU) {
    const bus = selectedBU === 'all'
      ? Object.keys(perfData).filter(k => !k.startsWith('_'))
      : [selectedBU];

    // Resolution Rate trend
    const resDatasets = [];
    bus.forEach((bu, i) => {
      const d = perfData[bu];
      if (!d) return;
      const comp = d.complaints || (d.performance || {}).complaints || {};
      const color = BU_COLORS[bu] || PALETTE[i];
      if (comp.resolution_rate && comp.resolution_rate.some(v => v)) {
        resDatasets.push({
          label: bu, data: clean(comp.resolution_rate),
          borderColor: color, backgroundColor: color + '22',
          fill: false, tension: 0.4, spanGaps: true, pointRadius: 3,
        });
      }
    });

    if (resDatasets.length) {
      const opts = gridOptions('Resolution Rate (%)');
      opts.scales.y.min = 0; opts.scales.y.max = 110;
      makeChart('pa-res-rate-chart', { type: 'line', data: { labels: MONTHS, datasets: resDatasets }, options: opts });
    }

    // Complaint Total by BU - Bar
    const buLabels = [], buTotals = [], buColors = [], buCompletedRates = [];
    bus.forEach((bu, i) => {
      const d = perfData[bu];
      if (!d) return;
      const comp = d.complaints || (d.performance || {}).complaints || {};
      const total = sumClean(comp.total);
      if (total > 0) {
        buLabels.push(bu);
        buTotals.push(total);
        buColors.push(BU_COLORS[bu] || PALETTE[i]);
        const completed = sumClean(comp.completed);
        buCompletedRates.push(total > 0 ? parseFloat((completed / total * 100).toFixed(1)) : 0);
      }
    });

    if (buLabels.length) {
      makeChart('pa-complaint-total-chart', {
        type: 'bar',
        data: {
          labels: buLabels,
          datasets: [
            { label: 'Total Complaint', data: buTotals, backgroundColor: buColors, borderRadius: 6 }
          ]
        },
        options: {
          ...gridOptions('Jumlah'),
          plugins: { legend: { display: false } }
        }
      });

      // Avg time to resolve per BU
      const avgTimes = [], avgLabels = [], avgColors = [];
      bus.forEach((bu, i) => {
        const d = perfData[bu];
        if (!d) return;
        const comp = d.complaints || (d.performance || {}).complaints || {};
        const avg = avgClean(comp.avg_time_resolution);
        if (avg !== null) {
          avgLabels.push(bu);
          avgTimes.push(parseFloat(avg.toFixed(1)));
          avgColors.push(BU_COLORS[bu] || PALETTE[i]);
        }
      });

      if (avgLabels.length) {
        makeChart('pa-avg-resolution-chart', {
          type: 'bar',
          data: {
            labels: avgLabels,
            datasets: [{ label: 'Avg. Time to Resolve (hari)', data: avgTimes, backgroundColor: avgColors, borderRadius: 6 }]
          },
          options: {
            indexAxis: 'y',
            ...gridOptions('Hari'),
            plugins: { legend: { display: false } }
          }
        });
      }
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SECTION 7: Interaksi Channel & Kategori
  // ─────────────────────────────────────────────────────────────
  function renderInteraksiCharts(perfData, selectedBU) {
    const bus = selectedBU === 'all'
      ? Object.keys(perfData).filter(k => !k.startsWith('_'))
      : [selectedBU];

    // Aggregate all channel totals across selected BUs
    const channelTotals = {};
    const kategoriTotals = {
      pengaduan: 0, permohonan: 0, informasi: 0,
      pertanyaan: 0, apresiasi: 0, laporan: 0, saran: 0
    };

    bus.forEach(bu => {
      const d = perfData[bu];
      if (!d) return;
      const st = d.statistik || {};

      // Channels
      Object.entries(st.interaksi_channel || {}).forEach(([ch, vals]) => {
        channelTotals[ch] = (channelTotals[ch] || 0) + sumClean(vals);
      });

      // Kategori
      const kat = st.interaksi_kategori || {};
      Object.keys(kategoriTotals).forEach(k => {
        kategoriTotals[k] += sumClean(kat[k]);
      });
    });

    // Channel bar chart
    const chLabels = Object.keys(channelTotals).sort((a, b) => channelTotals[b] - channelTotals[a]);
    const chValues = chLabels.map(l => channelTotals[l]);

    if (chLabels.length) {
      makeChart('pa-channel-bar', {
        type: 'bar',
        data: {
          labels: chLabels,
          datasets: [{ label: 'Total Interaksi', data: chValues, backgroundColor: PALETTE, borderRadius: 6 }]
        },
        options: {
          indexAxis: 'y',
          ...gridOptions('Interaksi'),
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x.toLocaleString('id-ID')}` } }
          }
        }
      });
    }

    // Kategori doughnut
    const katEntries = Object.entries(kategoriTotals).filter(([, v]) => v > 0);
    if (katEntries.length) {
      makeChart('pa-kategori-donut', {
        type: 'doughnut',
        data: {
          labels: katEntries.map(([k]) => k.charAt(0).toUpperCase() + k.slice(1)),
          datasets: [{ data: katEntries.map(([, v]) => v), backgroundColor: PALETTE, borderWidth: 0 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '65%',
          plugins: {
            legend: { position: 'right', labels: { color: '#94a3b8', padding: 10 } },
            tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.toLocaleString('id-ID')} (${((ctx.parsed / katEntries.reduce((a,[,v])=>a+v,0))*100).toFixed(1)}%)` } }
          }
        }
      });
    }

    // Channel Trend over time (top 3 channels)
    const top3Channels = chLabels.slice(0, 3);
    if (top3Channels.length) {
      // Aggregate channel trend across BUs
      const channelTrends = {};
      top3Channels.forEach(ch => { channelTrends[ch] = new Array(18).fill(0); });

      bus.forEach(bu => {
        const d = perfData[bu];
        if (!d) return;
        const st = d.statistik || {};
        top3Channels.forEach(ch => {
          const vals = (st.interaksi_channel || {})[ch];
          if (vals) {
            vals.forEach((v, i) => { channelTrends[ch][i] += (v || 0); });
          }
        });
      });

      makeChart('pa-channel-trend', {
        type: 'line',
        data: {
          labels: MONTHS,
          datasets: top3Channels.map((ch, i) => ({
            label: ch,
            data: channelTrends[ch].map(v => v === 0 ? null : v),
            borderColor: PALETTE[i],
            backgroundColor: PALETTE[i] + '22',
            fill: true, tension: 0.4, spanGaps: true, pointRadius: 3,
          }))
        },
        options: gridOptions('Interaksi')
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SECTION 8: AHT per Channel
  // ─────────────────────────────────────────────────────────────
  function renderAHTCharts(perfData, selectedBU) {
    const bus = selectedBU === 'all'
      ? Object.keys(perfData).filter(k => !k.startsWith('_'))
      : [selectedBU];

    const ahtAvg = {};

    bus.forEach(bu => {
      const d = perfData[bu];
      if (!d) return;
      const st = d.statistik || {};
      Object.entries(st.aht_channel || {}).forEach(([ch, vals]) => {
        const avg = avgClean(vals);
        if (avg !== null) {
          if (!ahtAvg[ch]) ahtAvg[ch] = [];
          ahtAvg[ch].push(avg);
        }
      });
    });

    const ahtLabels = Object.keys(ahtAvg);
    const ahtValues = ahtLabels.map(ch => parseFloat((ahtAvg[ch].reduce((a, b) => a + b, 0) / ahtAvg[ch].length).toFixed(2)));

    if (ahtLabels.length) {
      makeChart('pa-aht-chart', {
        type: 'bar',
        data: {
          labels: ahtLabels,
          datasets: [{ label: 'Avg. AHT (menit)', data: ahtValues, backgroundColor: PALETTE, borderRadius: 6 }]
        },
        options: {
          indexAxis: 'y',
          ...gridOptions('Menit'),
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x.toFixed(1)} menit` } }
          }
        }
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SECTION 9: SLA Resolution
  // ─────────────────────────────────────────────────────────────
  function renderSLACharts(perfData, selectedBU) {
    const bus = selectedBU === 'all'
      ? Object.keys(perfData).filter(k => !k.startsWith('_'))
      : [selectedBU];

    const slaAgg = { fcr: new Array(18).fill(0), lt_3_hari: new Array(18).fill(0), lt_14_hari: new Array(18).fill(0), lt_30_hari: new Array(18).fill(0) };

    bus.forEach(bu => {
      const d = perfData[bu];
      if (!d) return;
      const sla = (d.statistik || {}).sla_resolution || {};
      Object.keys(slaAgg).forEach(k => {
        (sla[k] || []).forEach((v, i) => { slaAgg[k][i] += (v || 0); });
      });
    });

    const hasSLA = Object.values(slaAgg).some(arr => arr.some(v => v > 0));

    if (hasSLA) {
      const slaLabels = { fcr: 'FCR', lt_3_hari: '< 3 Hari', lt_14_hari: '4-14 Hari', lt_30_hari: '15-30 Hari' };
      const datasets = Object.entries(slaAgg).map(([k, vals], i) => ({
        label: slaLabels[k],
        data: vals.map(v => v === 0 ? null : v),
        backgroundColor: PALETTE[i] + 'aa',
        borderColor: PALETTE[i],
        borderWidth: 1,
        borderRadius: 4,
      }));

      makeChart('pa-sla-chart', {
        type: 'bar',
        data: { labels: MONTHS, datasets },
        options: {
          ...gridOptions('Jumlah Kasus'),
          scales: {
            x: { stacked: false, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', maxRotation: 45 } },
            y: { stacked: false, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } }
          }
        }
      });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // SECTION 10: Auto Insights
  // ─────────────────────────────────────────────────────────────
  function renderInsights(perfData, selectedBU) {
    const container = $('pa-insights-container');
    if (!container) return;

    const bus = selectedBU === 'all'
      ? Object.keys(perfData).filter(k => !k.startsWith('_'))
      : [selectedBU];

    const insights = [];

    // Find best/worst CSAT
    let bestCsat = { bu: '', score: 0 }, worstCsat = { bu: '', score: 99 };
    bus.forEach(bu => {
      const d = perfData[bu];
      if (!d) return;
      const perf = d.performance || {};
      const overall = perf.csat ? perf.csat.overall : (d.scores || {}).overall;
      const avg = avgClean(overall);
      if (avg && avg > bestCsat.score) { bestCsat = { bu, score: avg }; }
      if (avg && avg < worstCsat.score) { worstCsat = { bu, score: avg }; }
    });
    if (bestCsat.bu) {
      insights.push({
        icon: '🏆', type: 'success',
        title: `CSAT Tertinggi: ${bestCsat.bu}`,
        body: `${bestCsat.bu} mencatat rata-rata CSAT <strong>${fmt(bestCsat.score, 2)}/5.0</strong> – performa layanan terbaik di antara seluruh Business Unit.`
      });
    }
    if (worstCsat.bu && worstCsat.bu !== bestCsat.bu) {
      insights.push({
        icon: '📉', type: 'warning',
        title: `CSAT Butuh Perhatian: ${worstCsat.bu}`,
        body: `${worstCsat.bu} memiliki rata-rata CSAT <strong>${fmt(worstCsat.score, 2)}/5.0</strong>. Perlu evaluasi lebih lanjut terutama pada aspek People, Process, atau Premises.`
      });
    }

    // Resolution rate
    let avgResAll = [];
    bus.forEach(bu => {
      const d = perfData[bu];
      if (!d) return;
      const comp = d.complaints || (d.performance || {}).complaints || {};
      const last = lastValid(comp.resolution_rate);
      if (last !== null) avgResAll.push({ bu, rate: last });
    });
    avgResAll.sort((a, b) => b.rate - a.rate);
    if (avgResAll.length > 0) {
      const top = avgResAll[0];
      insights.push({
        icon: '✅', type: 'info',
        title: `Penanganan Keluhan Terbaik: ${top.bu}`,
        body: `${top.bu} memiliki Complaint Resolution Rate <strong>${fmt(top.rate, 1)}%</strong> pada periode terkini – tingkat penyelesaian keluhan yang sangat baik.`
      });
    }

    // Channel dominance
    const channelTotals = {};
    bus.forEach(bu => {
      const d = perfData[bu];
      if (!d) return;
      Object.entries((d.statistik || {}).interaksi_channel || {}).forEach(([ch, vals]) => {
        channelTotals[ch] = (channelTotals[ch] || 0) + sumClean(vals);
      });
    });
    const topChannel = Object.entries(channelTotals).sort((a, b) => b[1] - a[1])[0];
    if (topChannel) {
      const totalInteraksi = Object.values(channelTotals).reduce((a, b) => a + b, 0);
      const pct = (topChannel[1] / totalInteraksi * 100).toFixed(1);
      insights.push({
        icon: '📱', type: 'info',
        title: `Channel Terpopuler: ${topChannel[0]}`,
        body: `<strong>${topChannel[0]}</strong> mendominasi <strong>${pct}%</strong> dari total interaksi pelanggan (${topChannel[1].toLocaleString('id-ID')} interaksi). Prioritaskan SDM dan teknologi di channel ini.`
      });
    }

    // Service performance gap
    bus.forEach(bu => {
      const d = perfData[bu];
      if (!d) return;
      const svc = (d.performance || {}).branch_service || {};
      const lastOverall = lastValid(svc.overall);
      const lastProcess = lastValid(svc.process);
      if (lastOverall && lastProcess && lastProcess < 80) {
        insights.push({
          icon: '🔧', type: 'warning',
          title: `Gap Layanan di ${bu}: Process`,
          body: `Aspek <strong>Process</strong> di ${bu} hanya <strong>${fmt(lastProcess, 1)}%</strong> pada periode terkini, jauh di bawah Overall ${fmt(lastOverall, 1)}%. Perlu review standar prosedur layanan.`
        });
      }
    });

    // FCR performance
    let bestFCR = { bu: '', score: 0 };
    bus.forEach(bu => {
      const d = perfData[bu];
      if (!d) return;
      const cc = d.call_center || (d.performance || {}).call_center || {};
      const lastFcr = lastValid(cc.fcr);
      if (lastFcr && lastFcr > bestFCR.score) { bestFCR = { bu, score: lastFcr }; }
    });
    if (bestFCR.bu) {
      insights.push({
        icon: '📞', type: 'success',
        title: `FCR Call Center Terbaik: ${bestFCR.bu}`,
        body: `${bestFCR.bu} mencapai First Call Resolution <strong>${fmt(bestFCR.score, 1)}%</strong>. Artinya mayoritas keluhan pelanggan diselesaikan dalam satu kali kontak pertama.`
      });
    }

    const typeStyles = {
      success: 'border-left: 4px solid #10b981; background: rgba(16,185,129,0.08);',
      warning: 'border-left: 4px solid #f59e0b; background: rgba(245,158,11,0.08);',
      danger:  'border-left: 4px solid #ef4444; background: rgba(239,68,68,0.08);',
      info:    'border-left: 4px solid #3b82f6; background: rgba(59,130,246,0.08);',
    };

    container.innerHTML = insights.length > 0
      ? insights.map(ins => `
          <div style="padding: 1rem 1.25rem; border-radius: 12px; margin-bottom: 1rem; ${typeStyles[ins.type]}">
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
              <span style="font-size:1.3rem;">${ins.icon}</span>
              <strong style="color:#f1f5f9;">${ins.title}</strong>
            </div>
            <p style="color:#94a3b8; margin:0; line-height:1.6;">${ins.body}</p>
          </div>
        `).join('')
      : '<p style="color:#64748b; text-align:center; padding:2rem;">Tidak ada insight untuk ditampilkan.</p>';
  }

  // ─────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────
  window.renderPerfAnalysis = function (perfData) {
    const buSelect = $('pa-filter-bu');
    const selectedBU = buSelect ? buSelect.value : 'all';

    renderKPISummaryCards(perfData, selectedBU);
    renderCSATTrend(perfData, selectedBU);
    renderCSATRadar(perfData, selectedBU);
    renderServicePerfTrend(perfData, selectedBU);
    renderCallCenterCharts(perfData, selectedBU);
    renderComplaintCharts(perfData, selectedBU);
    renderInteraksiCharts(perfData, selectedBU);
    renderAHTCharts(perfData, selectedBU);
    renderSLACharts(perfData, selectedBU);
    renderInsights(perfData, selectedBU);
  };

})();
