/**
 * CX Dashboard — Charts Module (Refactored for 4 Tabs)
 */

const CXCharts = (() => {
  const instances = {};

  // Global Chart Defaults
  Chart.defaults.color = '#94a3b8';
  Chart.defaults.borderColor = 'rgba(255,255,255,0.06)';
  Chart.defaults.font.family = "'Inter', sans-serif";
  Chart.defaults.font.size = 12;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.padding = 16;
  Chart.defaults.plugins.tooltip.backgroundColor = 'rgba(15, 23, 42, 0.95)';
  Chart.defaults.plugins.tooltip.titleColor = '#f1f5f9';
  Chart.defaults.plugins.tooltip.bodyColor = '#94a3b8';

  const COLORS = {
    primary: '#6366f1',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    secondary: '#06b6d4',
    tertiary: '#8b5cf6',
  };

  const SCORE_COLORS = {
    5: '#10b981', // Very Satisfied
    4: '#34d399', // Satisfied
    3: '#fcd34d', // Neutral
    2: '#f97316', // Dissatisfied
    1: '#ef4444', // Very Dissatisfied
  };

  const BU_COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444', '#06b6d4', '#10b981'];

  function destroyChart(id) {
    if (instances[id]) {
      instances[id].destroy();
      delete instances[id];
    }
  }

  function renderOverviewDist(id, data) {
    destroyChart(id);
    const ctx = document.getElementById(id);
    if (!ctx) return;
    const scores = {5:0,4:0,3:0,2:0,1:0};
    data.forEach(r => { if(r.overall_score >=1 && r.overall_score<=5) scores[r.overall_score]++; });
    instances[id] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Very Satisfied (5)', 'Satisfied (4)', 'Neutral (3)', 'Dissatisfied (2)', 'Very Dissatisfied (1)'],
        datasets: [{
          data: [scores[5], scores[4], scores[3], scores[2], scores[1]],
          backgroundColor: [SCORE_COLORS[5], SCORE_COLORS[4], SCORE_COLORS[3], SCORE_COLORS[2], SCORE_COLORS[1]],
          borderWidth: 0
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'right' } } }
    });
  }

  function renderOverviewSentiment(id, data) {
    destroyChart(id);
    const ctx = document.getElementById(id);
    if (!ctx) return;
    const s = {Positive:0, Neutral:0, Negative:0, Unknown:0};
    data.forEach(r => { s[r.sentiment || 'Unknown'] = (s[r.sentiment||'Unknown']||0)+1; });
    instances[id] = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Positive', 'Neutral', 'Negative'],
        datasets: [{
          data: [s.Positive, s.Neutral, s.Negative],
          backgroundColor: [COLORS.success, COLORS.warning, COLORS.danger],
          borderWidth: 0
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, cutout: '70%', plugins: { legend: { position: 'right' } } }
    });
  }

  function renderOverviewTrend(id, data) {
    destroyChart(id);
    const ctx = document.getElementById(id);
    if (!ctx) return;
    const dateMap = {};
    data.forEach(r => {
      if (!r.response_date || !r.overall_score) return;
      if (!dateMap[r.response_date]) dateMap[r.response_date] = {sum:0, count:0};
      dateMap[r.response_date].sum += r.overall_score;
      dateMap[r.response_date].count++;
    });
    const dates = Object.keys(dateMap).sort();
    const averages = dates.map(d => dateMap[d].sum / dateMap[d].count);
    const counts = dates.map(d => dateMap[d].count);
    const formattedDates = dates.map(d => new Date(d).toLocaleDateString('en-GB', {day:'2-digit', month:'short'}));

    instances[id] = new Chart(ctx, {
      type: 'line',
      data: {
        labels: formattedDates,
        datasets: [
          { label: 'Avg Score', data: averages, borderColor: COLORS.primary, backgroundColor: COLORS.primary+'33', fill: true, tension: 0.4, yAxisID: 'y' },
          { label: 'Responses', data: counts, borderColor: COLORS.secondary, borderDash: [5,5], tension: 0.4, yAxisID: 'y1' }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          y: { min: 1, max: 5 },
          y1: { position: 'right', grid: { display: false } }
        }
      }
    });
  }

  function renderKpiBU(id, data) {
    destroyChart(id);
    const ctx = document.getElementById(id);
    if (!ctx) return;
    const buMap = {};
    data.forEach(r => {
      const bu = r.source || 'Unknown';
      if (!buMap[bu]) buMap[bu] = {sum:0, count:0};
      if (r.overall_score) { buMap[bu].sum += r.overall_score; buMap[bu].count++; }
    });
    const entries = Object.entries(buMap).filter(e => e[1].count > 0).sort((a,b) => (b[1].sum/b[1].count) - (a[1].sum/a[1].count));
    
    instances[id] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: entries.map(e => e[0]),
        datasets: [{
          data: entries.map(e => e[1].sum / e[1].count),
          backgroundColor: entries.map((_, i) => BU_COLORS[i % BU_COLORS.length]),
          borderRadius: 4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } }, scales: { x: { max: 5 } } }
    });
  }

  function renderKpiRadar(id, data) {
    destroyChart(id);
    const ctx = document.getElementById(id);
    if (!ctx) return;
    const buMap = {};
    data.forEach(r => {
      const bu = r.source || 'Unknown';
      if (!buMap[bu]) buMap[bu] = {s:[], f:[], c:[]};
      if (r.staff_score) buMap[bu].s.push(r.staff_score);
      if (r.facility_score) buMap[bu].f.push(r.facility_score);
      if (r.cleanliness_score) buMap[bu].c.push(r.cleanliness_score);
    });
    const avg = arr => arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0;
    const datasets = Object.keys(buMap).filter(bu => buMap[bu].s.length).map((bu, i) => ({
      label: bu,
      data: [avg(buMap[bu].s), avg(buMap[bu].f), avg(buMap[bu].c)],
      borderColor: BU_COLORS[i % BU_COLORS.length],
      backgroundColor: BU_COLORS[i % BU_COLORS.length]+'33'
    }));

    instances[id] = new Chart(ctx, {
      type: 'radar',
      data: { labels: ['Staff', 'Facility', 'Cleanliness'], datasets },
      options: { responsive: true, maintainAspectRatio: false, scales: { r: { max: 5, min: 0 } } }
    });
  }

  function renderCSATByFacility(id, data) {
    destroyChart(id);
    const ctx = document.getElementById(id);
    if (!ctx) return;
    const facMap = {};
    data.forEach(r => {
      const fac = r.survey_name || r.facility_type || 'Unknown';
      if (!facMap[fac]) facMap[fac] = { sat:0, total:0 };
      if (r.overall_score) {
        facMap[fac].total++;
        if (r.overall_score >= 4) facMap[fac].sat++;
      }
    });
    
    // Sort by CSAT % descending
    let entries = Object.entries(facMap).filter(e => e[1].total >= 2).map(e => ({
      name: e[0],
      csat: (e[1].sat / e[1].total) * 100
    })).sort((a,b) => b.csat - a.csat).slice(0, 7);

    instances[id] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: entries.map(e => e.name.length > 20 ? e.name.slice(0,20)+'...' : e.name),
        datasets: [{
          data: entries.map(e => e.csat),
          backgroundColor: entries.map((_, i) => BU_COLORS[i % BU_COLORS.length]),
          borderRadius: 4
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false, indexAxis: 'y',
        plugins: { legend: { display: false } },
        scales: { x: { max: 100, ticks: { callback: v => v+'%' } } }
      }
    });
  }

  function renderScoreDist(id, data) {
    destroyChart(id);
    const ctx = document.getElementById(id);
    if (!ctx) return;
    const counts = {1:0, 2:0, 3:0, 4:0, 5:0};
    data.forEach(r => { if(r.overall_score) counts[r.overall_score]++; });
    
    instances[id] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['VD', 'D', 'N', 'S', 'VS'],
        datasets: [{
          data: [counts[1], counts[2], counts[3], counts[4], counts[5]],
          backgroundColor: [SCORE_COLORS[1], SCORE_COLORS[2], SCORE_COLORS[3], SCORE_COLORS[4], SCORE_COLORS[5]],
          borderRadius: 4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  }

  function renderSentDist(id, data) {
    destroyChart(id);
    const ctx = document.getElementById(id);
    if (!ctx) return;
    const counts = {Positive:0, Neutral:0, Negative:0};
    data.forEach(r => { if(counts[r.sentiment]!==undefined) counts[r.sentiment]++; });
    instances[id] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Positive', 'Neutral', 'Negative'],
        datasets: [{
          data: [counts.Positive, counts.Neutral, counts.Negative],
          backgroundColor: [COLORS.success, COLORS.warning, COLORS.danger],
          borderRadius: 4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  }

  function renderSentByBU(id, data) {
    destroyChart(id);
    const ctx = document.getElementById(id);
    if (!ctx) return;
    const buMap = {};
    data.forEach(r => {
      const bu = r.source || 'Unknown';
      if (!buMap[bu]) buMap[bu] = {Pos:0, Neu:0, Neg:0};
      if (r.sentiment === 'Positive') buMap[bu].Pos++;
      else if (r.sentiment === 'Neutral') buMap[bu].Neu++;
      else if (r.sentiment === 'Negative') buMap[bu].Neg++;
    });

    const labels = Object.keys(buMap);
    instances[id] = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          { label: 'Positive', data: labels.map(l => buMap[l].Pos), backgroundColor: COLORS.success },
          { label: 'Neutral', data: labels.map(l => buMap[l].Neu), backgroundColor: COLORS.warning },
          { label: 'Negative', data: labels.map(l => buMap[l].Neg), backgroundColor: COLORS.danger },
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: { x: { stacked: true }, y: { stacked: true } }
      }
    });
  }

  return {
    renderOverviewDist, renderOverviewSentiment, renderOverviewTrend,
    renderKpiBU, renderKpiRadar,
    renderCSATByFacility, renderScoreDist,
    renderSentDist, renderSentByBU,
    BU_COLORS, COLORS, SCORE_COLORS
  };
})();
