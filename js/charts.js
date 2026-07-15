/**
 * CX Dashboard — Charts Module
 * Chart.js configuration and rendering functions
 */

const CXCharts = (() => {
  // Store chart instances for cleanup
  const instances = {};

  // ── Chart.js Global Defaults ──
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.pointStyleWidth = 10;
  Chart.defaults.plugins.legend.labels.padding = 16;
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.95)';
  Chart.defaults.plugins.tooltip.titleColor = '#f1f5f9';
  Chart.defaults.plugins.tooltip.bodyColor = '#94a3b8';
  Chart.defaults.plugins.tooltip.borderColor = 'rgba(255,255,255,0.1)';
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.padding = 12;
  Chart.defaults.plugins.tooltip.cornerRadius = 8;
  Chart.defaults.plugins.tooltip.displayColors = true;

  // ── Color Palettes ──
  const COLORS = {
    primary: '#6366f1',
    primaryLight: '#818cf8',
    secondary: '#06b6d4',
    tertiary: '#8b5cf6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    info: '#3b82f6',
    pink: '#ec4899',
    orange: '#f97316',
  };

  const SCORE_COLORS = {
    5: '#10b981',
    4: '#06b6d4',
    3: '#f59e0b',
    2: '#f97316',
    1: '#ef4444',
  };

  const SENTIMENT_COLORS = {
    Positive: '#10b981',
    Neutral: '#f59e0b',
    Negative: '#ef4444',
    Unknown: '#64748b',
  };

  const BU_COLORS = [
    '#6366f1', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899',
    '#3b82f6', '#f97316', '#14b8a6', '#a855f7',
  ];

  function destroyChart(id) {
    if (instances[id]) {
      instances[id].destroy();
      delete instances[id];
    }
  }

  function destroyAll() {
    Object.keys(instances).forEach(destroyChart);
  }

  // ── CSAT Score Distribution (Doughnut) ──
  function renderCSATDistribution(canvasId, data) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const scoreCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    data.forEach(r => {
      if (r.overall_score >= 1 && r.overall_score <= 5) {
        scoreCounts[r.overall_score]++;
      }
    });

    instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['⭐ 5 — Excellent', '⭐ 4 — Good', '⭐ 3 — Average', '⭐ 2 — Poor', '⭐ 1 — Very Poor'],
        datasets: [{
          data: [scoreCounts[5], scoreCounts[4], scoreCounts[3], scoreCounts[2], scoreCounts[1]],
          backgroundColor: [
            SCORE_COLORS[5] + 'cc',
            SCORE_COLORS[4] + 'cc',
            SCORE_COLORS[3] + 'cc',
            SCORE_COLORS[2] + 'cc',
            SCORE_COLORS[1] + 'cc',
          ],
          borderColor: 'rgba(10, 14, 26, 0.8)',
          borderWidth: 3,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'right',
            labels: { font: { size: 11 } },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                return ` ${ctx.label}: ${ctx.parsed.toLocaleString()} (${pct}%)`;
              },
            },
          },
        },
      },
    });
  }

  // ── Sentiment Breakdown (Doughnut) ──
  function renderSentiment(canvasId, data) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const sentCounts = { Positive: 0, Neutral: 0, Negative: 0, Unknown: 0 };
    data.forEach(r => {
      const s = r.sentiment || 'Unknown';
      sentCounts[s] = (sentCounts[s] || 0) + 1;
    });

    instances[canvasId] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['😊 Positive', '😐 Neutral', '😞 Negative', '❓ Unknown'],
        datasets: [{
          data: [sentCounts.Positive, sentCounts.Neutral, sentCounts.Negative, sentCounts.Unknown],
          backgroundColor: [
            SENTIMENT_COLORS.Positive + 'cc',
            SENTIMENT_COLORS.Neutral + 'cc',
            SENTIMENT_COLORS.Negative + 'cc',
            SENTIMENT_COLORS.Unknown + '88',
          ],
          borderColor: 'rgba(10, 14, 26, 0.8)',
          borderWidth: 3,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: 'right',
            labels: { font: { size: 11 } },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                return ` ${ctx.label}: ${ctx.parsed.toLocaleString()} (${pct}%)`;
              },
            },
          },
        },
      },
    });
  }

  // ── Average CSAT by Business Unit (Bar) ──
  function renderByBusinessUnit(canvasId, data) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const buMap = {};
    data.forEach(r => {
      if (r.overall_score == null) return;
      const bu = r.source || r.subholding || 'Unknown';
      if (!buMap[bu]) buMap[bu] = { sum: 0, count: 0 };
      buMap[bu].sum += r.overall_score;
      buMap[bu].count++;
    });

    const labels = Object.keys(buMap).sort((a, b) => (buMap[b].sum / buMap[b].count) - (buMap[a].sum / buMap[a].count));
    const averages = labels.map(l => +(buMap[l].sum / buMap[l].count).toFixed(2));
    const counts = labels.map(l => buMap[l].count);

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Avg CSAT',
          data: averages,
          backgroundColor: labels.map((_, i) => BU_COLORS[i % BU_COLORS.length] + 'aa'),
          borderColor: labels.map((_, i) => BU_COLORS[i % BU_COLORS.length]),
          borderWidth: 1,
          borderRadius: 6,
          barPercentage: 0.6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: {
            min: 0,
            max: 5,
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { stepSize: 1 },
          },
          y: {
            grid: { display: false },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: (ctx) => `Responses: ${counts[ctx.dataIndex].toLocaleString()}`,
            },
          },
        },
      },
    });
  }

  // ── Radar: Sub-dimension Scores by BU ──
  function renderRadar(canvasId, data) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const buMap = {};
    data.forEach(r => {
      const bu = r.source || r.subholding || 'Unknown';
      if (!buMap[bu]) buMap[bu] = { staff: [], facility: [], cleanliness: [] };
      if (r.staff_score != null) buMap[bu].staff.push(r.staff_score);
      if (r.facility_score != null) buMap[bu].facility.push(r.facility_score);
      if (r.cleanliness_score != null) buMap[bu].cleanliness.push(r.cleanliness_score);
    });

    const busWithData = Object.keys(buMap).filter(bu =>
      buMap[bu].staff.length > 0 || buMap[bu].facility.length > 0 || buMap[bu].cleanliness.length > 0
    );

    const avg = arr => arr.length > 0 ? +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2) : 0;

    const datasets = busWithData.map((bu, i) => ({
      label: bu,
      data: [
        avg(buMap[bu].staff),
        avg(buMap[bu].facility),
        avg(buMap[bu].cleanliness),
      ],
      borderColor: BU_COLORS[i % BU_COLORS.length],
      backgroundColor: BU_COLORS[i % BU_COLORS.length] + '22',
      pointBackgroundColor: BU_COLORS[i % BU_COLORS.length],
      pointBorderColor: '#fff',
      pointBorderWidth: 1,
      borderWidth: 2,
    }));

    instances[canvasId] = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Staff & Service', 'Facilities', 'Cleanliness & Comfort'],
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            beginAtZero: true,
            max: 5,
            ticks: {
              stepSize: 1,
              backdropColor: 'transparent',
              font: { size: 10 },
            },
            grid: { color: 'rgba(255,255,255,0.06)' },
            pointLabels: {
              font: { size: 11, weight: '600' },
              color: '#94a3b8',
            },
            angleLines: { color: 'rgba(255,255,255,0.06)' },
          },
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 10 } },
          },
        },
      },
    });
  }

  // ── CSAT Trend Over Time — Multi-line by BU ──
  function renderTrend(canvasId, data) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // Group by month and BU
    const buMonthMap = {};
    const allMonths = new Set();
    const allBUs = new Set();

    data.forEach(r => {
      if (!r.response_date || r.overall_score == null) return;
      const month = r.response_date.substring(0, 7); // YYYY-MM
      const bu = r.source || 'Unknown';
      allMonths.add(month);
      allBUs.add(bu);
      if (!buMonthMap[bu]) buMonthMap[bu] = {};
      if (!buMonthMap[bu][month]) buMonthMap[bu][month] = { sum: 0, count: 0 };
      buMonthMap[bu][month].sum += r.overall_score;
      buMonthMap[bu][month].count++;
    });

    const sortedMonths = [...allMonths].sort();
    if (sortedMonths.length === 0) return;

    const labels = sortedMonths.map(m => {
      const [y, mon] = m.split('-');
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${monthNames[parseInt(mon)-1]} ${y}`;
    });

    const datasets = [...allBUs].sort().map((bu, i) => ({
      label: bu,
      data: sortedMonths.map(m => {
        const entry = buMonthMap[bu]?.[m];
        return entry ? +(entry.sum / entry.count).toFixed(2) : null;
      }),
      borderColor: BU_COLORS[i % BU_COLORS.length],
      backgroundColor: BU_COLORS[i % BU_COLORS.length] + '15',
      fill: false,
      tension: 0.3,
      spanGaps: true,
      pointRadius: 4,
      pointHoverRadius: 7,
      pointBackgroundColor: BU_COLORS[i % BU_COLORS.length],
      borderWidth: 2.5,
    }));

    instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 } },
          },
          y: {
            min: 1,
            max: 5,
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { stepSize: 1 },
            title: { display: true, text: 'CSAT Score', font: { size: 11 } },
          },
        },
        plugins: {
          legend: { position: 'top', labels: { font: { size: 10 } } },
        },
      },
    });
  }

  // ── Top/Bottom Facilities (Horizontal Bar) ──
  function renderFacilityRanking(canvasId, data, top = true, limit = 10) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const facilityMap = {};
    data.forEach(r => {
      if (r.overall_score == null) return;
      let key = r.survey_name || r.facility_type || 'Unknown';
      const bu = r.source || '';
      if (bu && !key.toUpperCase().includes(bu.toUpperCase())) {
        key = `${key} - ${bu}`;
      }
      if (!facilityMap[key]) facilityMap[key] = { sum: 0, count: 0 };
      facilityMap[key].sum += r.overall_score;
      facilityMap[key].count++;
    });

    let entries = Object.entries(facilityMap)
      .filter(([_, v]) => v.count >= 2)
      .map(([k, v]) => ({ name: k, avg: +(v.sum / v.count).toFixed(2), count: v.count }));

    // Sort descending overall (best to worst)
    entries.sort((a, b) => b.avg - a.avg);

    if (top) {
      entries = entries.slice(0, limit);
    } else {
      // Avoid redundancy by completely excluding items already shown in the Top chart
      if (entries.length <= limit) {
        entries = []; // All items fit in Top, so Bottom is empty
      } else {
        const numAvailable = entries.length - limit;
        const numToTake = Math.min(limit, numAvailable);
        entries = entries.slice(entries.length - numToTake);
        // Reverse so the absolute worst is at the top of the bar chart
        entries.reverse();
      }
    }

    const labels = entries.map(e => e.name.length > 25 ? e.name.slice(0, 25) + '…' : e.name);
    const values = entries.map(e => e.avg);
    const counts = entries.map(e => e.count);

    const barColors = values.map(v => {
      if (v >= 4.5) return COLORS.success + 'bb';
      if (v >= 4.0) return COLORS.secondary + 'bb';
      if (v >= 3.0) return COLORS.warning + 'bb';
      if (v >= 2.0) return COLORS.orange + 'bb';
      return COLORS.danger + 'bb';
    });

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Avg CSAT',
          data: values,
          backgroundColor: barColors,
          borderRadius: 4,
          barPercentage: 0.65,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: { min: 0, max: 5, grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { stepSize: 1 } },
          y: { grid: { display: false }, ticks: { font: { size: 10 } } },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              afterLabel: (ctx) => `Responses: ${counts[ctx.dataIndex]}`,
            },
          },
        },
      },
    });
  }

  // ── Sentiment Distribution by BU (Stacked Horizontal Bar) ──
  function renderSentimentByBU(canvasId, data) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const buSent = {};
    data.forEach(r => {
      const bu = r.source || 'Unknown';
      const sent = r.sentiment || 'Unknown';
      if (!buSent[bu]) buSent[bu] = { Positive: 0, Neutral: 0, Negative: 0 };
      if (buSent[bu].hasOwnProperty(sent)) buSent[bu][sent]++;
    });

    const bus = Object.keys(buSent).sort();

    instances[canvasId] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: bus,
        datasets: [
          {
            label: 'Positive',
            data: bus.map(bu => buSent[bu].Positive),
            backgroundColor: SENTIMENT_COLORS.Positive + 'bb',
            borderRadius: 3,
          },
          {
            label: 'Neutral',
            data: bus.map(bu => buSent[bu].Neutral),
            backgroundColor: SENTIMENT_COLORS.Neutral + 'bb',
            borderRadius: 3,
          },
          {
            label: 'Negative',
            data: bus.map(bu => buSent[bu].Negative),
            backgroundColor: SENTIMENT_COLORS.Negative + 'bb',
            borderRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: {
            stacked: true,
            grid: { color: 'rgba(255,255,255,0.04)' },
          },
          y: {
            stacked: true,
            grid: { display: false },
          },
        },
        plugins: {
          legend: { position: 'top', labels: { font: { size: 10 } } },
          tooltip: {
            callbacks: {
              afterBody: (items) => {
                const bu = items[0].label;
                const total = items.reduce((s, i) => s + i.parsed.x, 0);
                return `Total: ${total}`;
              },
            },
          },
        },
      },
    });
  }

  // ── Monthly Response Volume (Area Chart) ──
  function renderResponseVolume(canvasId, data) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    const monthMap = {};
    data.forEach(r => {
      if (!r.response_date) return;
      const month = r.response_date.substring(0, 7);
      monthMap[month] = (monthMap[month] || 0) + 1;
    });

    const sortedMonths = Object.keys(monthMap).sort();
    const labels = sortedMonths.map(m => {
      const [y, mon] = m.split('-');
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${monthNames[parseInt(mon)-1]} ${y}`;
    });
    const values = sortedMonths.map(m => monthMap[m]);

    instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Response Volume',
          data: values,
          borderColor: COLORS.secondary,
          backgroundColor: COLORS.secondary + '20',
          fill: true,
          tension: 0.4,
          pointRadius: 5,
          pointHoverRadius: 8,
          pointBackgroundColor: COLORS.secondary,
          borderWidth: 2.5,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 10 } },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255,255,255,0.04)' },
            title: { display: true, text: 'Responses', font: { size: 11 } },
          },
        },
        plugins: {
          legend: { display: false },
        },
      },
    });
  }

  // ── CSAT Heatmap (rendered as HTML table) ──
  function renderCSATHeatmap(containerId, data) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Group by BU and month
    const buMonthMap = {};
    const allMonths = new Set();

    data.forEach(r => {
      if (!r.response_date || r.overall_score == null) return;
      const month = r.response_date.substring(0, 7);
      const bu = r.source || 'Unknown';
      allMonths.add(month);
      if (!buMonthMap[bu]) buMonthMap[bu] = {};
      if (!buMonthMap[bu][month]) buMonthMap[bu][month] = { sum: 0, count: 0 };
      buMonthMap[bu][month].sum += r.overall_score;
      buMonthMap[bu][month].count++;
    });

    const sortedMonths = [...allMonths].sort();
    const bus = Object.keys(buMonthMap).sort();

    if (sortedMonths.length === 0 || bus.length === 0) {
      container.innerHTML = '<div class="no-data"><div class="no-data-icon">📊</div>No data for heatmap</div>';
      return;
    }

    const monthLabels = sortedMonths.map(m => {
      const [y, mon] = m.split('-');
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return `${monthNames[parseInt(mon)-1]} '${y.slice(2)}`;
    });

    let html = '<table class="heatmap-table"><thead><tr><th>BU</th>';
    monthLabels.forEach(ml => { html += `<th>${ml}</th>`; });
    html += '</tr></thead><tbody>';

    bus.forEach(bu => {
      html += `<tr><td>${bu}</td>`;
      sortedMonths.forEach(m => {
        const entry = buMonthMap[bu]?.[m];
        if (entry) {
          const avg = (entry.sum / entry.count).toFixed(2);
          const rounded = Math.round(entry.sum / entry.count);
          const cls = rounded >= 5 ? 'heatmap-5' : rounded >= 4 ? 'heatmap-4' : rounded >= 3 ? 'heatmap-3' : rounded >= 2 ? 'heatmap-2' : 'heatmap-1';
          html += `<td><span class="heatmap-cell ${cls}" title="${bu} ${m}: ${avg} (${entry.count} responses)">${avg}</span></td>`;
        } else {
          html += `<td><span class="heatmap-cell heatmap-na" title="No data">—</span></td>`;
        }
      });
      html += '</tr>';
    });

    html += '</tbody></table>';
    container.innerHTML = html;
  }

  return {
    renderCSATDistribution,
    renderSentiment,
    renderByBusinessUnit,
    renderRadar,
    renderTrend,
    renderFacilityRanking,
    renderSentimentByBU,
    renderResponseVolume,
    renderCSATHeatmap,
    destroyAll,
    COLORS,
    SCORE_COLORS,
    SENTIMENT_COLORS,
    BU_COLORS,
  };
})();

// Global function to render performance charts
window.renderPerformanceCharts = function(performanceData) {
  const container = document.getElementById('performanceChartsGrid');
  if (!container) return;

  // Clear existing
  container.innerHTML = '';

  const selectedBU = document.getElementById('filterBU')?.value || 'all';
  const startDate = document.getElementById('filterStartDate')?.value;
  const endDate = document.getElementById('filterEndDate')?.value;

  Object.entries(performanceData).forEach(([buName, buData], index) => {
    if (selectedBU !== 'all' && buName !== selectedBU) return;

    const cardId = `perf-chart-${index}`;
    
    // Create card element
    const card = document.createElement('div');
    card.className = 'glass-card chart-card animate-in';
    card.innerHTML = `
      <div class="chart-card-header">
        <h3 class="chart-card-title">${buName}</h3>
        <span class="chart-card-badge">${buData.label}</span>
      </div>
      <div class="chart-container" style="height: 250px;">
        <canvas id="${cardId}"></canvas>
      </div>
    `;
    container.appendChild(card);

    const ctx = document.getElementById(cardId);
    
    // Use a strict Month Year array starting from Jan 2025
    const monthYearLabels = [
      'Jan 2025', 'Feb 2025', 'Mar 2025', 'Apr 2025', 'May 2025', 'Jun 2025', 'Jul 2025', 'Aug 2025', 'Sep 2025', 'Oct 2025', 'Nov 2025', 'Dec 2025',
      'Jan 2026', 'Feb 2026', 'Mar 2026', 'Apr 2026', 'May 2026', 'Jun 2026', 'Jul 2026', 'Aug 2026', 'Sep 2026', 'Oct 2026', 'Nov 2026', 'Dec 2026'
    ];

    let scores = buData.data.map(d => d.score);
    // Truncate or extend labels to match scores length
    let labels = monthYearLabels.slice(0, scores.length);

    // Apply Date Range Filter
    if (startDate || endDate) {
      const filteredLabels = [];
      const filteredScores = [];
      
      labels.forEach((lbl, i) => {
        const lblDate = new Date('1 ' + lbl);
        let include = true;
        
        if (startDate) {
          const s = new Date(startDate);
          if (lblDate.getFullYear() < s.getFullYear() || (lblDate.getFullYear() === s.getFullYear() && lblDate.getMonth() < s.getMonth())) {
            include = false;
          }
        }
        if (endDate) {
          const e = new Date(endDate);
          if (lblDate.getFullYear() > e.getFullYear() || (lblDate.getFullYear() === e.getFullYear() && lblDate.getMonth() > e.getMonth())) {
            include = false;
          }
        }
        
        if (include) {
          filteredLabels.push(lbl);
          filteredScores.push(scores[i]);
        }
      });
      
      labels = filteredLabels;
      scores = filteredScores;
    }

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: buData.label,
          data: scores,
          borderColor: CXCharts.BU_COLORS[index % CXCharts.BU_COLORS.length],
          backgroundColor: CXCharts.BU_COLORS[index % CXCharts.BU_COLORS.length] + '22',
          borderWidth: 2,
          pointBackgroundColor: CXCharts.BU_COLORS[index % CXCharts.BU_COLORS.length],
          pointRadius: 4,
          pointHoverRadius: 6,
          fill: true,
          tension: 0.3,
          spanGaps: true // Connect lines over null values
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            min: 1,
            max: 5,
            grid: { color: 'rgba(255,255,255,0.05)' }
          },
          x: {
            grid: { display: false }
          }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  });
};

// ── Performance Targets Dashboard Charts ──
window.renderPerformanceCharts = function(perfData) {
  if (!perfData || !perfData._months) return;
  const buSelect = document.getElementById('perfFilterBU');
  if (!buSelect) return;
  
  const selectedBU = buSelect.value;
  const months = perfData._months;
  let buData;
  
  if (selectedBU === 'ALL') {
    buData = {
      scores: { overall: [], people: [], process: [], premises: [] },
      interactions: { pengaduan: [], permohonan: [], informasi: [], pengunjung: [], volume: [] },
      call_center: { volume: [], fcr: [], service_level: [], waiting_time: [], abandoned_rate: [] },
      social_media: { nss: [], avg_response_time: [], rsr: [] },
      complaints: { total: [], completed: [], progress: [], untouch: [], resolution_rate: [], avg_time_resolution: [] }
    };
    const numMonths = months.length;
    for (let i = 0; i < numMonths; i++) {
      // Metrics that should be Averaged
      [
        { obj: buData.scores, cats: ['overall', 'people', 'process', 'premises'], source: 'scores' },
        { obj: buData.call_center, cats: ['fcr', 'service_level', 'abandoned_rate'], source: 'call_center' },
        { obj: buData.social_media, cats: ['nss', 'rsr'], source: 'social_media' },
        { obj: buData.complaints, cats: ['resolution_rate'], source: 'complaints' }
      ].forEach(group => {
        group.cats.forEach(cat => {
          let sum = 0, count = 0;
          Object.keys(perfData).forEach(k => {
            if (k !== '_months' && perfData[k][group.source] && perfData[k][group.source][cat] && perfData[k][group.source][cat][i] != null) {
              sum += perfData[k][group.source][cat][i];
              count++;
            }
          });
          group.obj[cat].push(count > 0 ? +(sum / count).toFixed(2) : null);
        });
      });

      // Metrics that should be Summed
      [
        { obj: buData.interactions, cats: ['pengaduan', 'permohonan', 'informasi', 'pengunjung', 'volume'], source: 'interactions' },
        { obj: buData.call_center, cats: ['volume'], source: 'call_center' },
        { obj: buData.complaints, cats: ['total', 'completed', 'progress', 'untouch'], source: 'complaints' }
      ].forEach(group => {
        group.cats.forEach(cat => {
          let sum = 0, count = 0;
          Object.keys(perfData).forEach(k => {
            if (k !== '_months' && perfData[k][group.source] && perfData[k][group.source][cat] && perfData[k][group.source][cat][i] != null) {
              sum += perfData[k][group.source][cat][i];
              count++;
            }
          });
          group.obj[cat].push(count > 0 ? sum : null);
        });
      });
    }
  } else {
    buData = perfData[selectedBU];
  }
  
  // 1. Render CSAT Trend Line Chart
  if (!window.chartInstances) window.chartInstances = {};
  if (window.chartInstances['perfCsatChart']) {
    window.chartInstances['perfCsatChart'].destroy();
  }
  const csatCtx = document.getElementById('perfCsatChart');
  if (csatCtx && buData && buData.scores) {
    window.chartInstances['perfCsatChart'] = new Chart(csatCtx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Overall CSAT',
            data: buData.scores.overall || [],
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            fill: true,
            tension: 0.3,
            spanGaps: true
          },
          {
            label: 'People',
            data: buData.scores.people || [],
            borderColor: '#10b981',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.3,
            spanGaps: true
          },
          {
            label: 'Process',
            data: buData.scores.process || [],
            borderColor: '#f59e0b',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.3,
            spanGaps: true
          },
          {
            label: 'Premises',
            data: buData.scores.premises || [],
            borderColor: '#8b5cf6',
            borderWidth: 2,
            borderDash: [5, 5],
            tension: 0.3,
            spanGaps: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { min: 1, max: 5, grid: { color: 'rgba(255,255,255,0.05)' } },
          x: { grid: { display: false } }
        },
        plugins: {
          legend: { position: 'top', labels: { color: '#e2e8f0' } },
          tooltip: { mode: 'index', intersect: false }
        }
      }
    });
  }

  // 2. Render Interactions Bar Chart
  if (window.chartInstances['perfInteractionChart']) {
    window.chartInstances['perfInteractionChart'].destroy();
  }
  const intCtx = document.getElementById('perfInteractionChart');
  if (intCtx && buData && buData.interactions) {
    window.chartInstances['perfInteractionChart'] = new Chart(intCtx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Total Pengunjung',
            data: buData.interactions.pengunjung || [],
            type: 'line',
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderWidth: 2,
            tension: 0.3,
            yAxisID: 'y1',
            fill: true
          },
          {
            label: 'Informasi',
            data: buData.interactions.informasi || [],
            backgroundColor: '#3b82f6',
            borderRadius: 4,
            yAxisID: 'y'
          },
          {
            label: 'Pengaduan',
            data: buData.interactions.pengaduan || [],
            backgroundColor: '#ef4444',
            borderRadius: 4,
            yAxisID: 'y'
          },
          {
            label: 'Permohonan',
            data: buData.interactions.permohonan || [],
            backgroundColor: '#f59e0b',
            borderRadius: 4,
            yAxisID: 'y'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { 
            type: 'linear',
            display: true,
            position: 'left',
            stacked: true, 
            grid: { color: 'rgba(255,255,255,0.05)' },
            title: { display: true, text: 'Interactions', color: '#94a3b8' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            grid: { drawOnChartArea: false },
            title: { display: true, text: 'Total Pengunjung', color: '#10b981' }
          },
          x: { stacked: true, grid: { display: false } }
        },
        plugins: {
          legend: { position: 'top', labels: { color: '#e2e8f0' } },
          tooltip: { mode: 'index', intersect: false }
        }
      }
    });
  }

  // 3. Render Call Center Chart
  if (window.chartInstances['perfCallCenterChart']) {
    window.chartInstances['perfCallCenterChart'].destroy();
  }
  const ccCtx = document.getElementById('perfCallCenterChart');
  if (ccCtx && buData && buData.call_center) {
    window.chartInstances['perfCallCenterChart'] = new Chart(ccCtx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Volume of Call',
            data: buData.call_center.volume || [],
            backgroundColor: 'rgba(59, 130, 246, 0.2)',
            borderColor: '#3b82f6',
            borderWidth: 1,
            yAxisID: 'yVolume'
          },
          {
            label: 'Service Level (%)',
            data: buData.call_center.service_level || [],
            type: 'line',
            borderColor: '#10b981',
            tension: 0.3,
            yAxisID: 'yPct'
          },
          {
            label: 'FCR (%)',
            data: buData.call_center.fcr || [],
            type: 'line',
            borderColor: '#f59e0b',
            tension: 0.3,
            yAxisID: 'yPct'
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          yVolume: { type: 'linear', position: 'left', grid: { color: 'rgba(255,255,255,0.05)' } },
          yPct: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, min: 0, max: 100 }
        }
      }
    });
  }

  // 4. Render Social Media Chart
  if (window.chartInstances['perfSocialMediaChart']) {
    window.chartInstances['perfSocialMediaChart'].destroy();
  }
  const smCtx = document.getElementById('perfSocialMediaChart');
  if (smCtx && buData && buData.social_media) {
    window.chartInstances['perfSocialMediaChart'] = new Chart(smCtx, {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Net Sentiment Score (%)',
            data: buData.social_media.nss || [],
            borderColor: '#8b5cf6',
            tension: 0.3
          },
          {
            label: 'Response to Sentiment Ratio',
            data: buData.social_media.rsr || [],
            borderColor: '#ec4899',
            tension: 0.3
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { y: { grid: { color: 'rgba(255,255,255,0.05)' } } }
      }
    });
  }

  // 5. Render Complaint Handling Chart
  if (window.chartInstances['perfComplaintChart']) {
    window.chartInstances['perfComplaintChart'].destroy();
  }
  const compCtx = document.getElementById('perfComplaintChart');
  if (compCtx && buData && buData.complaints) {
    window.chartInstances['perfComplaintChart'] = new Chart(compCtx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Resolution Rate (%)',
            data: buData.complaints.resolution_rate || [],
            type: 'line',
            borderColor: '#10b981',
            tension: 0.3,
            yAxisID: 'yPct'
          },
          {
            label: 'Completed',
            data: buData.complaints.completed || [],
            backgroundColor: '#3b82f6',
            yAxisID: 'yVol'
          },
          {
            label: 'Progress',
            data: buData.complaints.progress || [],
            backgroundColor: '#f59e0b',
            yAxisID: 'yVol'
          },
          {
            label: 'Untouch',
            data: buData.complaints.untouch || [],
            backgroundColor: '#ef4444',
            yAxisID: 'yVol'
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          yVol: { type: 'linear', position: 'left', stacked: true, grid: { color: 'rgba(255,255,255,0.05)' } },
          yPct: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, min: 0, max: 100 },
          x: { stacked: true }
        }
      }
      }
    });
  }
};

// ── Interaksi & Pengunjung Analytics Dashboard ──
window.renderInteractionDashboard = function(perfData) {
  if (!perfData || !perfData._months) return;

  const months = perfData._months;
  const buSelect = document.getElementById('perfFilterBU');
  const selectedBU = buSelect ? buSelect.value : 'ALL';

  if (!window.chartInstances) window.chartInstances = {};

  // ── Aggregate statistik data across BUs ──
  let jumlahPengunjung = new Array(18).fill(0);
  let totalInteraksi   = new Array(18).fill(0);
  let kategoriSums     = { pengaduan: 0, permohonan: 0, informasi: 0, apresiasi: 0 };
  let channelSums      = {};   // channel -> total across months
  let ahtByChannel     = {};   // channel -> [18 months] (averaged)

  const buKeys = Object.keys(perfData).filter(k => k !== '_months');
  const activeBUs = selectedBU === 'ALL'
    ? buKeys
    : buKeys.filter(k => k === selectedBU || k.startsWith(selectedBU + ' - '));

  activeBUs.forEach(buKey => {
    const st = perfData[buKey] && perfData[buKey].statistik;
    if (!st) return;

    // Trend data (sum across selected BUs)
    st.jumlah_pengunjung.forEach((v, i) => { if (v) jumlahPengunjung[i] += v; });
    st.total_interaksi.forEach((v, i) => { if (v) totalInteraksi[i] += v; });

    // Kategori totals
    Object.keys(kategoriSums).forEach(cat => {
      if (st.interaksi_kategori && st.interaksi_kategori[cat]) {
        kategoriSums[cat] += st.interaksi_kategori[cat].reduce((a, b) => a + (b || 0), 0);
      }
    });

    // Channel volumes
    if (st.interaksi_channel) {
      Object.entries(st.interaksi_channel).forEach(([ch, vals]) => {
        if (!channelSums[ch]) channelSums[ch] = 0;
        channelSums[ch] += vals.reduce((a, b) => a + (b || 0), 0);
      });
    }

    // AHT per channel (average across BUs)
    if (st.aht_channel) {
      Object.entries(st.aht_channel).forEach(([ch, vals]) => {
        if (!ahtByChannel[ch]) ahtByChannel[ch] = { sum: new Array(18).fill(0), count: new Array(18).fill(0) };
        vals.forEach((v, i) => {
          if (v !== null && v > 0) {
            ahtByChannel[ch].sum[i] += v;
            ahtByChannel[ch].count[i]++;
          }
        });
      });
    }
  });

  // Average AHT across BUs
  const ahtAvg = {};
  Object.entries(ahtByChannel).forEach(([ch, d]) => {
    ahtAvg[ch] = d.sum.map((s, i) => d.count[i] > 0 ? +(s / d.count[i]).toFixed(2) : null);
  });

  // ── KPI Cards ──
  const totalPeng = jumlahPengunjung.reduce((a, b) => a + b, 0);
  const totalIntr = totalInteraksi.reduce((a, b) => a + b, 0);
  const activeMonths = jumlahPengunjung.filter(v => v > 0).length;
  const avgPengPerMonth = activeMonths > 0 ? Math.round(totalPeng / activeMonths) : 0;

  const kpiContainer = document.getElementById('interaksiKpiCards');
  if (kpiContainer) {
    kpiContainer.innerHTML = `
      <div class="kpi-card overall-kpi-card purple animate-in">
        <div class="kpi-icon">🚶</div>
        <div class="kpi-content">
          <div class="kpi-label">Total Pengunjung</div>
          <div class="kpi-value" style="font-size:1.4rem;">${totalPeng.toLocaleString('id-ID')}</div>
          <div class="kpi-sub">Seluruh periode data</div>
        </div>
      </div>
      <div class="kpi-card overall-kpi-card blue animate-in">
        <div class="kpi-icon">💬</div>
        <div class="kpi-content">
          <div class="kpi-label">Total Interaksi</div>
          <div class="kpi-value" style="font-size:1.4rem;">${totalIntr.toLocaleString('id-ID')}</div>
          <div class="kpi-sub">Semua kategori</div>
        </div>
      </div>
      <div class="kpi-card overall-kpi-card cyan animate-in">
        <div class="kpi-icon">📅</div>
        <div class="kpi-content">
          <div class="kpi-label">Rata-rata Pengunjung/Bulan</div>
          <div class="kpi-value" style="font-size:1.4rem;">${avgPengPerMonth.toLocaleString('id-ID')}</div>
          <div class="kpi-sub">Berdasarkan ${activeMonths} bulan aktif</div>
        </div>
      </div>
      <div class="kpi-card overall-kpi-card amber animate-in">
        <div class="kpi-icon">📡</div>
        <div class="kpi-content">
          <div class="kpi-label">Channel Aktif</div>
          <div class="kpi-value" style="font-size:1.4rem;">${Object.keys(channelSums).length}</div>
          <div class="kpi-sub">Channel dengan data</div>
        </div>
      </div>
    `;
  }

  const CHART_DEFAULTS = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#e2e8f0', padding: 12, font: { size: 11 } } },
      tooltip: { mode: 'index', intersect: false }
    }
  };

  // ── Chart 1: Pengunjung vs Interaksi Trend ──
  const destroy1 = window.chartInstances['chartPengunjungInteraksi'];
  if (destroy1) destroy1.destroy();
  const ctx1 = document.getElementById('chartPengunjungInteraksi');
  if (ctx1) {
    window.chartInstances['chartPengunjungInteraksi'] = new Chart(ctx1, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: 'Jumlah Pengunjung',
            data: jumlahPengunjung.map(v => v || null),
            backgroundColor: 'rgba(139, 92, 246, 0.25)',
            borderColor: '#8b5cf6',
            borderWidth: 2,
            borderRadius: 4,
            type: 'bar',
            yAxisID: 'yPeng'
          },
          {
            label: 'Total Interaksi',
            data: totalInteraksi.map(v => v || null),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.15)',
            borderWidth: 2.5,
            tension: 0.4,
            fill: true,
            type: 'line',
            yAxisID: 'yIntr',
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        ...CHART_DEFAULTS,
        scales: {
          yPeng: {
            type: 'linear', position: 'left',
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#8b5cf6', callback: v => (v >= 1e6 ? (v/1e6).toFixed(1)+'M' : v >= 1e3 ? (v/1e3).toFixed(0)+'K' : v) },
            title: { display: true, text: 'Pengunjung', color: '#8b5cf6' }
          },
          yIntr: {
            type: 'linear', position: 'right',
            grid: { drawOnChartArea: false },
            ticks: { color: '#10b981', callback: v => (v >= 1e3 ? (v/1e3).toFixed(0)+'K' : v) },
            title: { display: true, text: 'Interaksi', color: '#10b981' }
          },
          x: { grid: { display: false }, ticks: { color: '#94a3b8', font: { size: 10 } } }
        }
      }
    });
  }

  // ── Chart 2: Kategori Donut ──
  const destroy2 = window.chartInstances['chartKategoriInteraksi'];
  if (destroy2) destroy2.destroy();
  const ctx2 = document.getElementById('chartKategoriInteraksi');
  const kategoriLabels = ['Pengaduan', 'Permohonan/Permintaan', 'Informasi/Pertanyaan', 'Apresiasi'];
  const kategoriData   = [kategoriSums.pengaduan, kategoriSums.permohonan, kategoriSums.informasi, kategoriSums.apresiasi];
  const KATEGORI_COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981'];
  if (ctx2) {
    window.chartInstances['chartKategoriInteraksi'] = new Chart(ctx2, {
      type: 'doughnut',
      data: {
        labels: kategoriLabels,
        datasets: [{
          data: kategoriData,
          backgroundColor: KATEGORI_COLORS.map(c => c + 'cc'),
          borderColor: KATEGORI_COLORS,
          borderWidth: 2,
          hoverOffset: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: { position: 'right', labels: { color: '#e2e8f0', padding: 10, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : 0;
                return ` ${ctx.label}: ${ctx.parsed.toLocaleString('id-ID')} (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  // ── Chart 3: Channel Volume Horizontal Bar ──
  const destroy3 = window.chartInstances['chartChannelVolume'];
  if (destroy3) destroy3.destroy();
  const ctx3 = document.getElementById('chartChannelVolume');
  const channelEntries = Object.entries(channelSums).sort((a, b) => b[1] - a[1]);
  const CHANNEL_PALETTE = [
    '#6366f1','#8b5cf6','#ec4899','#f43f5e','#f59e0b',
    '#10b981','#14b8a6','#3b82f6','#06b6d4','#84cc16'
  ];
  if (ctx3 && channelEntries.length > 0) {
    window.chartInstances['chartChannelVolume'] = new Chart(ctx3, {
      type: 'bar',
      data: {
        labels: channelEntries.map(([ch]) => ch),
        datasets: [{
          label: 'Total Interaksi',
          data: channelEntries.map(([, v]) => v),
          backgroundColor: channelEntries.map((_, i) => CHANNEL_PALETTE[i % CHANNEL_PALETTE.length] + 'bb'),
          borderColor: channelEntries.map((_, i) => CHANNEL_PALETTE[i % CHANNEL_PALETTE.length]),
          borderWidth: 1.5,
          borderRadius: 4
        }]
      },
      options: {
        ...CHART_DEFAULTS,
        indexAxis: 'y',
        plugins: {
          ...CHART_DEFAULTS.plugins,
          legend: { display: false },
          tooltip: {
            callbacks: { label: ctx => ` ${ctx.parsed.x.toLocaleString('id-ID')} interaksi` }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#94a3b8', callback: v => v >= 1e3 ? (v/1e3).toFixed(0)+'K' : v }
          },
          y: { grid: { display: false }, ticks: { color: '#e2e8f0', font: { size: 11 } } }
        }
      }
    });
  }

  // ── Chart 4: AHT per Channel ──
  const destroy4 = window.chartInstances['chartAHTChannel'];
  if (destroy4) destroy4.destroy();
  const ctx4 = document.getElementById('chartAHTChannel');
  const ahtWrapper = document.getElementById('ahtChartWrapper');
  const ahtNoData  = document.getElementById('ahtNoData');

  const ahtEntries = Object.entries(ahtAvg).map(([ch, vals]) => {
    const nonNull = vals.filter(v => v !== null);
    const avg = nonNull.length > 0 ? +(nonNull.reduce((a, b) => a + b, 0) / nonNull.length).toFixed(2) : null;
    return [ch, avg];
  }).filter(([, avg]) => avg !== null && avg > 0).sort((a, b) => b[1] - a[1]);

  if (ahtWrapper && ahtNoData) {
    if (ahtEntries.length === 0) {
      ahtWrapper.style.display = 'none';
      ahtNoData.style.display = 'block';
    } else {
      ahtWrapper.style.display = 'block';
      ahtNoData.style.display = 'none';
    }
  }

  if (ctx4 && ahtEntries.length > 0) {
    window.chartInstances['chartAHTChannel'] = new Chart(ctx4, {
      type: 'bar',
      data: {
        labels: ahtEntries.map(([ch]) => ch),
        datasets: [{
          label: 'Avg. Handling Time (menit)',
          data: ahtEntries.map(([, avg]) => avg),
          backgroundColor: '#f59e0bbb',
          borderColor: '#f59e0b',
          borderWidth: 1.5,
          borderRadius: 4
        }]
      },
      options: {
        ...CHART_DEFAULTS,
        indexAxis: 'y',
        plugins: {
          ...CHART_DEFAULTS.plugins,
          legend: { display: false },
          tooltip: {
            callbacks: { label: ctx => ` ${ctx.parsed.x.toFixed(1)} menit` }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#94a3b8', callback: v => v + ' min' }
          },
          y: { grid: { display: false }, ticks: { color: '#e2e8f0', font: { size: 11 } } }
        }
      }
    });
  }
};
