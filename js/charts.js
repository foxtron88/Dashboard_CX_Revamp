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

  // ── CSAT Trend Over Time (Line) ──
  function renderTrend(canvasId, data) {
    destroyChart(canvasId);
    const ctx = document.getElementById(canvasId);
    if (!ctx) return;

    // Group by date
    const dateMap = {};
    data.forEach(r => {
      if (!r.response_date || r.overall_score == null) return;
      if (!dateMap[r.response_date]) dateMap[r.response_date] = { sum: 0, count: 0 };
      dateMap[r.response_date].sum += r.overall_score;
      dateMap[r.response_date].count++;
    });

    const sortedDates = Object.keys(dateMap).sort();
    if (sortedDates.length === 0) return;

    // Pad dates to create a proper chronological X-axis
    const startDate = new Date(sortedDates[0] + 'T00:00:00');
    const endDate = new Date(sortedDates[sortedDates.length - 1] + 'T00:00:00');
    
    const dates = [];
    const averages = [];
    const counts = [];
    const formattedDates = [];

    for (let dt = new Date(startDate); dt <= endDate; dt.setDate(dt.getDate() + 1)) {
      // Handle local timezone shift by using local parts to construct YYYY-MM-DD
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const d = String(dt.getDate()).padStart(2, '0');
      const dStr = `${y}-${m}-${d}`;
      
      dates.push(dStr);
      formattedDates.push(dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }));
      
      if (dateMap[dStr]) {
        averages.push(+(dateMap[dStr].sum / dateMap[dStr].count).toFixed(2));
        counts.push(dateMap[dStr].count);
      } else {
        averages.push(null); // Null average breaks the line or spans gap
        counts.push(0);      // 0 responses
      }
    }

    instances[canvasId] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: formattedDates,
        datasets: [
          {
            label: 'Avg CSAT Score',
            data: averages,
            borderColor: COLORS.primary,
            backgroundColor: COLORS.primary + '15',
            fill: true,
            tension: 0.4,
            spanGaps: true,
            pointRadius: dates.length > 30 ? 0 : 3,
            pointHoverRadius: 6,
            pointBackgroundColor: COLORS.primary,
            borderWidth: 2,
            yAxisID: 'y',
          },
          {
            label: 'Response Count',
            data: counts,
            borderColor: COLORS.secondary + '88',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.4,
            spanGaps: true,
            pointRadius: 0,
            pointHoverRadius: 4,
            borderWidth: 1.5,
            yAxisID: 'y1',
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              maxTicksLimit: 15,
              font: { size: 10 },
            },
          },
          y: {
            min: 1,
            max: 5,
            position: 'left',
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { stepSize: 1 },
            title: { display: true, text: 'CSAT Score', font: { size: 11 } },
          },
          y1: {
            position: 'right',
            grid: { display: false },
            title: { display: true, text: 'Responses', font: { size: 11 } },
          },
        },
        plugins: {
          legend: { position: 'top' },
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
      const key = r.survey_name || r.facility_type || 'Unknown';
      if (!facilityMap[key]) facilityMap[key] = { sum: 0, count: 0 };
      facilityMap[key].sum += r.overall_score;
      facilityMap[key].count++;
    });

    // Only include facilities with >= 2 responses
    let entries = Object.entries(facilityMap)
      .filter(([_, v]) => v.count >= 2)
      .map(([k, v]) => ({ name: k, avg: +(v.sum / v.count).toFixed(2), count: v.count }));

    if (top) {
      entries.sort((a, b) => b.avg - a.avg);
    } else {
      entries.sort((a, b) => a.avg - b.avg);
    }
    entries = entries.slice(0, limit);

    if (!top) entries.reverse(); // Show lowest at bottom for readability

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
          x: {
            min: 0,
            max: 5,
            grid: { color: 'rgba(255,255,255,0.04)' },
            ticks: { stepSize: 1 },
          },
          y: {
            grid: { display: false },
            ticks: { font: { size: 10 } },
          },
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

  return {
    renderCSATDistribution,
    renderSentiment,
    renderByBusinessUnit,
    renderRadar,
    renderTrend,
    renderFacilityRanking,
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
