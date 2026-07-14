/**
 * CX Dashboard — Main Application Logic
 * Data loading, filtering, KPI calculation, insights, and feedback table
 */

(function () {
  'use strict';

  // ── State ──
  let allData = [];
  let filteredData = [];
  let performanceData = {}; // Stores CX Performance Excel data
  let currentPage = 1;
  const PAGE_SIZE = 20;

  // ── DOM References ──
  const $ = (id) => document.getElementById(id);

  // ── Init ──
  async function init() {
    try {
      const resp = await fetch('data/consolidated.json');
      const json = await resp.json();
      allData = json.records || [];

      // Set last updated
      $('lastUpdated').textContent = `Data: ${json.generated_at ? new Date(json.generated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}`;

      populateFilters();
      applyFilters();
      bindEvents();

      // Reveal dashboard
      setTimeout(() => {
        $('loadingOverlay').classList.add('hidden');
        $('dashboardContainer').style.opacity = '1';
        $('dashboardContainer').style.transition = 'opacity 0.5s ease';
      }, 400);

    } catch (err) {
      console.error('Failed to load data:', err);
      $('loadingOverlay').querySelector('.loading-text').textContent = 'Error loading data. Check console.';
    }

    try {
      const perfResp = await fetch('data/cx_performance.json');
      performanceData = await perfResp.json();
    } catch (err) {
      console.warn('Failed to load CX Performance data:', err);
    }
  }

  // ── Populate Filter Dropdowns ──
  function populateFilters() {
    const bus = [...new Set(allData.map(r => r.source).filter(Boolean))].sort();
    const locSelect = $('filterLocation');
    const facSelect = $('filterFacility');

    const buSelect = $('filterBU');
    bus.forEach(bu => {
      const opt = document.createElement('option');
      opt.value = bu;
      opt.textContent = bu;
      buSelect.appendChild(opt);
    });

    updateDependentFilters();
  }

  function updateDependentFilters() {
    const selectedBU = $('filterBU').value;

    // Locations
    const relevantData = selectedBU === 'all' ? allData : allData.filter(r => r.source === selectedBU);
    const locations = [...new Set(relevantData.map(r => r.location).filter(Boolean))].sort();
    const locSelect = $('filterLocation');
    const currentLoc = locSelect.value;
    locSelect.innerHTML = '<option value="all">All Locations</option>';
    locations.forEach(loc => {
      const opt = document.createElement('option');
      opt.value = loc;
      opt.textContent = loc;
      locSelect.appendChild(opt);
    });
    // Restore selection if still valid
    if (locations.includes(currentLoc)) locSelect.value = currentLoc;

    // Facility types
    const locFilteredData = currentLoc !== 'all' && locations.includes(currentLoc)
      ? relevantData.filter(r => r.location === currentLoc)
      : relevantData;
    const facilities = [...new Set(locFilteredData.map(r => r.survey_name || r.facility_type).filter(Boolean))].sort();
    const facSelect = $('filterFacility');
    const currentFac = facSelect.value;
    facSelect.innerHTML = '<option value="all">All Facilities</option>';
    facilities.forEach(fac => {
      const opt = document.createElement('option');
      opt.value = fac;
      opt.textContent = fac;
      facSelect.appendChild(opt);
    });
    if (facilities.includes(currentFac)) facSelect.value = currentFac;
  }

  function applyFilters() {
    const bu = $('filterBU').value;
    const loc = $('filterLocation').value;
    const fac = $('filterFacility').value;
    const sent = $('filterSentiment').value;
    const startDate = $('filterStartDate').value;
    const endDate = $('filterEndDate').value;

    filteredData = allData.filter(r => {
      if (bu !== 'all' && r.source !== bu) return false;
      if (loc !== 'all' && r.location !== loc) return false;
      if (fac !== 'all' && (r.survey_name !== fac && r.facility_type !== fac)) return false;
      if (sent !== 'all' && (r.sentiment || 'Unknown') !== sent) return false;
      
      // Date filtering
      if (startDate || endDate) {
        if (!r.date) return false; // If row has no date but filter is active, hide it
        const rowDate = new Date(r.date);
        if (startDate && rowDate < new Date(startDate)) return false;
        if (endDate && rowDate > new Date(endDate)) return false;
      }
      
      return true;
    });

    currentPage = 1;
    renderAll();
  }

  // ── Bind Events ──
  function bindEvents() {
    $('filterBU').addEventListener('change', () => { updateDependentFilters(); applyFilters(); });
    $('filterLocation').addEventListener('change', () => { updateDependentFilters(); applyFilters(); });
    $('filterFacility').addEventListener('change', applyFilters);
    $('filterSentiment').addEventListener('change', applyFilters);
    $('filterStartDate').addEventListener('change', applyFilters);
    $('filterEndDate').addEventListener('change', applyFilters);

    $('btnReset').addEventListener('click', () => {
      $('filterBU').value = 'all';
      updateDependentFilters();
      $('filterLocation').value = 'all';
      updateDependentFilters();
      $('filterFacility').value = 'all';
      $('filterSentiment').value = 'all';
      $('filterStartDate').value = '';
      $('filterEndDate').value = '';
      applyFilters();
    });

    $('searchFeedback').addEventListener('input', () => {
      currentPage = 1;
      renderFeedbackTable();
    });

    // View Tabs Logic
    const tabRaw = $('tabRaw');
    const tabPerf = $('tabPerformance');
    const viewRaw = $('viewRaw');
    const viewPerf = $('viewPerformance');

    if (tabRaw && tabPerf) {
      tabRaw.addEventListener('click', () => {
        tabRaw.classList.add('active');
        tabRaw.style.borderBottom = '2px solid var(--accent)';
        tabRaw.style.opacity = '1';
        
        tabPerf.classList.remove('active');
        tabPerf.style.borderBottom = 'none';
        tabPerf.style.opacity = '0.7';

        viewRaw.style.display = 'block';
        viewPerf.style.display = 'none';
        
        // Ensure filters apply to raw data view
        $('filterBar').style.display = 'flex';
      });

      tabPerf.addEventListener('click', () => {
        tabPerf.classList.add('active');
        tabPerf.style.borderBottom = '2px solid var(--accent)';
        tabPerf.style.opacity = '1';
        
        tabRaw.classList.remove('active');
        tabRaw.style.borderBottom = 'none';
        tabRaw.style.opacity = '0.7';

        viewRaw.style.display = 'none';
        viewPerf.style.display = 'block';
        
        // Ensure filters apply to performance data view
        $('filterBar').style.display = 'flex';

        // Render Performance Charts
        if (window.renderPerformanceCharts) {
          window.renderPerformanceCharts(performanceData);
        }
      });
    }
  }

  function resetFilters() {
    $('filterBU').value = 'all';
    $('filterLocation').value = 'all';
    $('filterFacility').value = 'all';
    $('filterSentiment').value = 'all';
    $('searchFeedback').value = '';
    updateDependentFilters();
    applyFilters();
  }

  // ── Render All ──
  function renderAll() {
    renderHeader();
    renderKPIs();
    renderInsights();
    renderCharts();
    renderTagsCloud();
    renderFeedbackTable();
    if (window.renderPerformanceCharts && typeof performanceData !== 'undefined') {
      window.renderPerformanceCharts(performanceData);
    }
  }

  // ── Header Stats ──
  function renderHeader() {
    $('headerTotalResponses').textContent = filteredData.length.toLocaleString();

    const scored = filteredData.filter(r => r.overall_score != null);
    const avgCSAT = scored.length > 0
      ? (scored.reduce((sum, r) => sum + r.overall_score, 0) / scored.length).toFixed(2)
      : '—';
    $('headerAvgCSAT').textContent = avgCSAT;
    $('filteredCount').textContent = `Showing ${filteredData.length.toLocaleString()} of ${allData.length.toLocaleString()} responses`;
  }

  // ── KPI Cards ──
  function renderKPIs() {
    const scored = filteredData.filter(r => r.overall_score != null);
    const avgCSAT = scored.length > 0
      ? (scored.reduce((s, r) => s + r.overall_score, 0) / scored.length).toFixed(2)
      : 0;

    const satisfied = scored.filter(r => r.overall_score >= 4).length;
    const satPct = scored.length > 0 ? ((satisfied / scored.length) * 100).toFixed(1) : 0;

    const sentiments = { Positive: 0, Neutral: 0, Negative: 0 };
    filteredData.forEach(r => {
      if (sentiments.hasOwnProperty(r.sentiment)) sentiments[r.sentiment]++;
    });
    const totalSent = sentiments.Positive + sentiments.Neutral + sentiments.Negative;
    const posPct = totalSent > 0 ? ((sentiments.Positive / totalSent) * 100).toFixed(1) : 0;

    const staffScored = filteredData.filter(r => r.staff_score != null);
    const avgStaff = staffScored.length > 0
      ? (staffScored.reduce((s, r) => s + r.staff_score, 0) / staffScored.length).toFixed(2)
      : '—';

    const facScored = filteredData.filter(r => r.facility_score != null);
    const avgFac = facScored.length > 0
      ? (facScored.reduce((s, r) => s + r.facility_score, 0) / facScored.length).toFixed(2)
      : '—';

    const cleanScored = filteredData.filter(r => r.cleanliness_score != null);
    const avgClean = cleanScored.length > 0
      ? (cleanScored.reduce((s, r) => s + r.cleanliness_score, 0) / cleanScored.length).toFixed(2)
      : '—';

    const kpis = [
      {
        icon: '📋', label: 'Total Responses', value: filteredData.length.toLocaleString(),
        color: 'blue', glow: 'glow-blue',
        trend: `${scored.length.toLocaleString()} scored`, trendClass: 'neutral',
      },
      {
        icon: '⭐', label: 'Average CSAT', value: avgCSAT,
        color: 'green', glow: 'glow-green',
        trend: `${satPct}% satisfied (4-5)`, trendClass: parseFloat(satPct) >= 70 ? 'positive' : parseFloat(satPct) >= 50 ? 'neutral' : 'negative',
      },
      {
        icon: '😊', label: 'Positive Sentiment', value: `${posPct}%`,
        color: 'cyan', glow: 'glow-cyan',
        trend: `${sentiments.Positive.toLocaleString()} of ${totalSent.toLocaleString()} responses`, trendClass: parseFloat(posPct) >= 60 ? 'positive' : 'neutral',
      },
      {
        icon: '👥', label: 'Staff Score', value: avgStaff,
        color: 'purple', glow: 'glow-purple',
        trend: `${staffScored.length.toLocaleString()} rated`, trendClass: 'neutral',
      },
      {
        icon: '🏗️', label: 'Facility Score', value: avgFac,
        color: 'amber', glow: 'glow-amber',
        trend: `${facScored.length.toLocaleString()} rated`, trendClass: 'neutral',
      },
      {
        icon: '✨', label: 'Cleanliness Score', value: avgClean,
        color: 'green', glow: 'glow-green',
        trend: `${cleanScored.length.toLocaleString()} rated`, trendClass: 'neutral',
      },
    ];

    $('kpiGrid').innerHTML = kpis.map((k, i) => `
      <div class="glass-card kpi-card ${k.glow} animate-in delay-${i + 1}">
        <div class="kpi-icon ${k.color}">${k.icon}</div>
        <div class="kpi-value">${k.value}</div>
        <div class="kpi-label">${k.label}</div>
        <div class="kpi-trend ${k.trendClass}">${k.trend}</div>
      </div>
    `).join('');

    // Update badge
    if ($('avgScoreBadge')) $('avgScoreBadge').textContent = `Avg: ${avgCSAT}`;
    if ($('sentimentBadge')) $('sentimentBadge').textContent = `${posPct}% positive`;
    
    // Update Cascade Node Values
    if ($('cascadeOverall')) {
      $('cascadeOverall').textContent = avgCSAT;
      $('cascadePPL').textContent = avgStaff;
      $('cascadePRC').textContent = avgClean;
      $('cascadePRM').textContent = avgFac;
    }
  }

  // ── Insights ──
  function renderInsights() {
    const insights = generateInsights(filteredData);
    $('insightCards').innerHTML = insights.map((ins, i) => `
      <div class="glass-card insight-item animate-in delay-${(i % 4) + 1}">
        <div class="insight-icon ${ins.color}">${ins.icon}</div>
        <div class="insight-content">
          <h4>${ins.title}</h4>
          <p>${ins.description}</p>
        </div>
      </div>
    `).join('');
  }

  function generateInsights(data) {
    const insights = [];
    if (data.length === 0) {
      insights.push({ icon: '📭', title: 'No Data', description: 'No records match the current filters.', color: 'amber' });
      return insights;
    }

    const scored = data.filter(r => r.overall_score != null);
    if (scored.length === 0) return insights;

    const avgCSAT = scored.reduce((s, r) => s + r.overall_score, 0) / scored.length;

    // Best performing BU
    const buMap = {};
    scored.forEach(r => {
      const bu = r.source;
      if (!buMap[bu]) buMap[bu] = { sum: 0, count: 0 };
      buMap[bu].sum += r.overall_score;
      buMap[bu].count++;
    });
    const buEntries = Object.entries(buMap).filter(([_, v]) => v.count >= 3);
    if (buEntries.length > 0) {
      buEntries.sort((a, b) => (b[1].sum / b[1].count) - (a[1].sum / a[1].count));
      const best = buEntries[0];
      const bestAvg = (best[1].sum / best[1].count).toFixed(2);
      insights.push({
        icon: '🏆', title: 'Top Performing Unit',
        description: `${best[0]} leads with an average CSAT of ${bestAvg} across ${best[1].count.toLocaleString()} responses.`,
        color: 'green',
      });

      if (buEntries.length > 1) {
        const worst = buEntries[buEntries.length - 1];
        const worstAvg = (worst[1].sum / worst[1].count).toFixed(2);
        if (parseFloat(worstAvg) < 4.0) {
          insights.push({
            icon: '⚠️', title: 'Needs Attention',
            description: `${worst[0]} has the lowest CSAT at ${worstAvg} (${worst[1].count.toLocaleString()} responses). Consider targeted improvements.`,
            color: 'amber',
          });
        }
      }
    }

    // Sentiment insight
    const negCount = data.filter(r => r.sentiment === 'Negative').length;
    const totalWithSent = data.filter(r => r.sentiment && r.sentiment !== 'Unknown').length;
    if (totalWithSent > 0) {
      const negPct = ((negCount / totalWithSent) * 100).toFixed(1);
      if (parseFloat(negPct) > 20) {
        insights.push({
          icon: '😟', title: 'High Negative Sentiment',
          description: `${negPct}% of feedback is negative (${negCount.toLocaleString()} responses). Review common complaints to identify root causes.`,
          color: 'red',
        });
      } else {
        insights.push({
          icon: '😊', title: 'Positive Customer Mood',
          description: `Only ${negPct}% of feedback is negative. Customers are generally satisfied with the services.`,
          color: 'green',
        });
      }
    }

    // Best facility
    const facMap = {};
    scored.forEach(r => {
      const fac = r.survey_name || r.facility_type || 'Unknown';
      if (!facMap[fac]) facMap[fac] = { sum: 0, count: 0 };
      facMap[fac].sum += r.overall_score;
      facMap[fac].count++;
    });
    const facEntries = Object.entries(facMap).filter(([_, v]) => v.count >= 5);
    if (facEntries.length > 0) {
      facEntries.sort((a, b) => (b[1].sum / b[1].count) - (a[1].sum / a[1].count));
      const bestFac = facEntries[0];
      insights.push({
        icon: '🌟', title: 'Star Facility',
        description: `"${bestFac[0]}" is the highest-rated facility with ${(bestFac[1].sum / bestFac[1].count).toFixed(2)} avg score (${bestFac[1].count} responses).`,
        color: 'cyan',
      });
    }

    // Language distribution
    const langMap = {};
    data.forEach(r => {
      const lang = r.language || 'Unknown';
      langMap[lang] = (langMap[lang] || 0) + 1;
    });
    const langEntries = Object.entries(langMap).filter(([k]) => k !== 'Unknown').sort((a, b) => b[1] - a[1]);
    if (langEntries.length > 0) {
      const topLang = langEntries[0];
      const langPct = ((topLang[1] / data.length) * 100).toFixed(0);
      insights.push({
        icon: '🌐', title: 'Primary Language',
        description: `${langPct}% of responses are in ${topLang[0]}. ${langEntries.length > 1 ? `Also received in ${langEntries.slice(1).map(e => e[0]).join(', ')}.` : ''}`,
        color: 'blue',
      });
    }

    // Score 1-2 alert
    const lowScores = scored.filter(r => r.overall_score <= 2);
    if (lowScores.length > 0) {
      const lowPct = ((lowScores.length / scored.length) * 100).toFixed(1);
      insights.push({
        icon: '🔴', title: 'Critical Feedback',
        description: `${lowScores.length.toLocaleString()} responses (${lowPct}%) gave a score of 1-2. These require immediate attention.`,
        color: 'red',
      });
    }

    return insights;
  }

  // ── Charts ──
  function renderCharts() {
    CXCharts.destroyAll();
    CXCharts.renderCSATDistribution('chartCSATDist', filteredData);
    CXCharts.renderSentiment('chartSentiment', filteredData);
    CXCharts.renderByBusinessUnit('chartByBU', filteredData);
    CXCharts.renderRadar('chartRadar', filteredData);
    CXCharts.renderTrend('chartTrend', filteredData);
    CXCharts.renderFacilityRanking('chartTopFacilities', filteredData, true, 10);
    CXCharts.renderFacilityRanking('chartBottomFacilities', filteredData, false, 10);
  }

  // ── Tags Cloud ──
  function renderTagsCloud() {
    const tagCounts = {};
    filteredData.forEach(r => {
      if (!r.tags) return;
      r.tags.split('|').forEach(tag => {
        tag = tag.trim();
        if (tag && tag.length > 2) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      });
    });

    const sorted = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 30);

    const cloud = $('tagsCloud');
    if (sorted.length === 0) {
      cloud.innerHTML = '<div class="no-data"><div class="no-data-icon">🏷️</div>No tags found for current filters</div>';
      return;
    }

    cloud.innerHTML = sorted.map(([tag, count]) =>
      `<span class="tag-pill">${tag}<span class="tag-count">${count}</span></span>`
    ).join('');
  }

  // ── Feedback Table ──
  function renderFeedbackTable() {
    const query = ($('searchFeedback').value || '').toLowerCase().trim();

    let tableData = filteredData.filter(r => r.feedback && r.feedback.trim());
    if (query) {
      tableData = tableData.filter(r =>
        (r.feedback || '').toLowerCase().includes(query) ||
        (r.location || '').toLowerCase().includes(query) ||
        (r.facility_type || '').toLowerCase().includes(query) ||
        (r.survey_name || '').toLowerCase().includes(query)
      );
    }

    // Sort by date descending
    tableData.sort((a, b) => {
      if (!a.response_date) return 1;
      if (!b.response_date) return -1;
      return b.response_date.localeCompare(a.response_date);
    });

    $('feedbackCount').textContent = `${tableData.length.toLocaleString()} feedback entries`;

    const totalPages = Math.max(1, Math.ceil(tableData.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageData = tableData.slice(start, start + PAGE_SIZE);

    const tbody = $('feedbackBody');
    if (pageData.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted);">No feedback entries match your criteria</td></tr>`;
    } else {
      tbody.innerHTML = pageData.map(r => {
        const sentClass = r.sentiment === 'Positive' ? 'badge-positive'
          : r.sentiment === 'Negative' ? 'badge-negative'
            : r.sentiment === 'Neutral' ? 'badge-neutral'
              : 'badge-unknown';
        const sentLabel = r.sentiment || 'Unknown';
        const scoreClass = r.overall_score ? `score-${r.overall_score}` : '';
        const dateStr = r.response_date
          ? new Date(r.response_date + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: '2-digit' })
          : '—';

        return `<tr>
          <td>${dateStr}</td>
          <td>${r.source || '—'}</td>
          <td>${r.location || '—'}</td>
          <td>${r.survey_name || r.facility_type || '—'}</td>
          <td><span class="score-badge ${scoreClass}">${r.overall_score || '—'}</span></td>
          <td><span class="badge ${sentClass}">${sentLabel}</span></td>
          <td title="${escapeHtml(r.feedback)}">${escapeHtml(r.feedback)}</td>
        </tr>`;
      }).join('');
    }

    // Pagination
    renderPagination(totalPages, tableData.length);
  }

  function renderPagination(totalPages, totalItems) {
    const pag = $('pagination');
    if (totalPages <= 1) {
      pag.innerHTML = `<span class="pagination-info">Showing all ${totalItems.toLocaleString()} entries</span>`;
      return;
    }

    let html = '';
    html += `<button class="pagination-btn" onclick="CXApp.goPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>← Prev</button>`;

    const maxButtons = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);
    if (endPage - startPage < maxButtons - 1) startPage = Math.max(1, endPage - maxButtons + 1);

    if (startPage > 1) {
      html += `<button class="pagination-btn" onclick="CXApp.goPage(1)">1</button>`;
      if (startPage > 2) html += `<span class="pagination-info">…</span>`;
    }

    for (let i = startPage; i <= endPage; i++) {
      html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="CXApp.goPage(${i})">${i}</button>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) html += `<span class="pagination-info">…</span>`;
      html += `<button class="pagination-btn" onclick="CXApp.goPage(${totalPages})">${totalPages}</button>`;
    }

    html += `<button class="pagination-btn" onclick="CXApp.goPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next →</button>`;
    html += `<span class="pagination-info">Page ${currentPage} of ${totalPages}</span>`;

    pag.innerHTML = html;
  }

  // ── Utilities ──
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function debounce(fn, ms) {
    let timer;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), ms);
    };
  }

  // ── Public API ──
  window.CXApp = {
    goPage(page) {
      currentPage = page;
      renderFeedbackTable();
      // Scroll to feedback section
      $('feedbackSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
  };

  // ── Boot ──
  document.addEventListener('DOMContentLoaded', init);
})();
