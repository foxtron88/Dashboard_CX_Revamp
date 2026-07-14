/**
 * CX Dashboard — Main Application Logic (Refactored for 4 Tabs)
 */

(function () {
  'use strict';

  // ── State ──
  let allData = [];
  let kpiFilteredData = [];
  let currentTab = 'detailed';
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
      kpiFilteredData = [...allData];

      $('lastUpdated').textContent = `Data: ${json.generated_at ? new Date(json.generated_at).toLocaleDateString('en-GB') : 'N/A'}`;

      bindEvents();
      populateFilters();
      switchTab('detailed'); // Default tab

      setTimeout(() => {
        $('loadingOverlay').classList.add('hidden');
        $('dashboardContainer').style.opacity = '1';
        $('dashboardContainer').style.transition = 'opacity 0.5s ease';
      }, 400);

    } catch (err) {
      console.error('Failed to load data:', err);
      $('loadingOverlay').querySelector('.loading-text').textContent = 'Error loading data. Check console.';
    }
  }

  // ── Tab Management ──
  function bindEvents() {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        switchTab(e.currentTarget.dataset.tab);
      });
    });

    $('kpiFilterBU').addEventListener('change', applyKpiFilters);
    $('kpiFilterLocation').addEventListener('change', applyKpiFilters);
    $('kpiBtnReset').addEventListener('click', resetKpiFilters);
    $('searchFeedback').addEventListener('input', debounce(() => { currentPage = 1; renderSentimentTab(); }, 300));
  }

  function switchTab(tabId) {
    currentTab = tabId;
    document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
    $(`tab-${tabId}`).style.display = 'block';

    if (tabId === 'overview') renderOverviewTab();
    else if (tabId === 'kpi') renderKpiTab();
    else if (tabId === 'detailed') renderDetailedTab();
    else if (tabId === 'sentiment') renderSentimentTab();
  }

  // ── Filters for KPI Tab ──
  function populateFilters() {
    const bus = [...new Set(allData.map(r => r.source).filter(Boolean))].sort();
    const buSelect = $('kpiFilterBU');
    bus.forEach(bu => buSelect.appendChild(new Option(bu, bu)));
    updateKpiLocationFilter();
  }

  function updateKpiLocationFilter() {
    const selectedBU = $('kpiFilterBU').value;
    const relevantData = selectedBU === 'all' ? allData : allData.filter(r => r.source === selectedBU);
    const locs = [...new Set(relevantData.map(r => r.location).filter(Boolean))].sort();
    const locSelect = $('kpiFilterLocation');
    locSelect.innerHTML = '<option value="all">All Locations</option>';
    locs.forEach(loc => locSelect.appendChild(new Option(loc, loc)));
  }

  function applyKpiFilters() {
    const bu = $('kpiFilterBU').value;
    const loc = $('kpiFilterLocation').value;
    if (bu !== 'all') updateKpiLocationFilter();
    
    kpiFilteredData = allData.filter(r => {
      if (bu !== 'all' && r.source !== bu) return false;
      if (loc !== 'all' && r.location !== loc) return false;
      return true;
    });
    renderKpiTab();
  }

  function resetKpiFilters() {
    $('kpiFilterBU').value = 'all';
    $('kpiFilterLocation').value = 'all';
    updateKpiLocationFilter();
    applyKpiFilters();
  }

  // ════════════════════════════════════════════════════════
  // TAB 1: OVERVIEW
  // ════════════════════════════════════════════════════════
  function renderOverviewTab() {
    const scored = allData.filter(r => r.overall_score);
    const avg = scored.length ? (scored.reduce((s, r)=>s+r.overall_score,0)/scored.length).toFixed(2) : 0;
    const csatPct = scored.length ? ((scored.filter(r=>r.overall_score>=4).length/scored.length)*100).toFixed(1) : 0;
    
    $('overviewKPIs').innerHTML = `
      <div class="glass-card kpi-card">
        <div class="kpi-icon blue">📋</div>
        <div class="kpi-value">${allData.length.toLocaleString()}</div>
        <div class="kpi-label">Total Responses</div>
      </div>
      <div class="glass-card kpi-card">
        <div class="kpi-icon green">⭐</div>
        <div class="kpi-value">${avg}</div>
        <div class="kpi-label">Average CSAT Score</div>
      </div>
      <div class="glass-card kpi-card">
        <div class="kpi-icon purple">🎯</div>
        <div class="kpi-value">${csatPct}%</div>
        <div class="kpi-label">CSAT % (Score 4-5)</div>
      </div>
    `;
    CXCharts.renderOverviewDist('chartOverviewDist', allData);
    CXCharts.renderOverviewSentiment('chartOverviewSentiment', allData);
    CXCharts.renderOverviewTrend('chartOverviewTrend', allData);
  }

  // ════════════════════════════════════════════════════════
  // TAB 2: KPI & ANALYTICS
  // ════════════════════════════════════════════════════════
  function renderKpiTab() {
    const scored = kpiFilteredData.filter(r => r.overall_score);
    const staff = kpiFilteredData.filter(r => r.staff_score);
    const fac = kpiFilteredData.filter(r => r.facility_score);
    
    const avgScore = scored.length ? (scored.reduce((s,r)=>s+r.overall_score,0)/scored.length).toFixed(2) : '—';
    const avgStaff = staff.length ? (staff.reduce((s,r)=>s+r.staff_score,0)/staff.length).toFixed(2) : '—';
    const avgFac = fac.length ? (fac.reduce((s,r)=>s+r.facility_score,0)/fac.length).toFixed(2) : '—';

    $('kpiAnalyticsCards').innerHTML = `
      <div class="glass-card kpi-card"><div class="kpi-icon blue">⭐</div><div class="kpi-value">${avgScore}</div><div class="kpi-label">CSAT Score</div></div>
      <div class="glass-card kpi-card"><div class="kpi-icon purple">👥</div><div class="kpi-value">${avgStaff}</div><div class="kpi-label">Staff Score (PPL)</div></div>
      <div class="glass-card kpi-card"><div class="kpi-icon amber">🏗️</div><div class="kpi-value">${avgFac}</div><div class="kpi-label">Facility Score (PRM)</div></div>
    `;
    
    CXCharts.renderKpiBU('chartKpiBU', kpiFilteredData);
    CXCharts.renderKpiRadar('chartKpiRadar', kpiFilteredData);
  }

  // ════════════════════════════════════════════════════════
  // TAB 3: DETAILED CSAT (Matching Reference)
  // ════════════════════════════════════════════════════════
  function renderDetailedTab() {
    // 1. Calculate Facility Performance
    const facMap = {};
    allData.forEach(r => {
      if (!r.overall_score) return;
      const fac = r.survey_name || r.facility_type || 'Unknown';
      if (!facMap[fac]) facMap[fac] = { count:0, sum:0, sat:0, pplSum:0, pplCount:0, prmSum:0, prmCount:0, prcSum:0, prcCount:0 };
      
      facMap[fac].count++;
      facMap[fac].sum += r.overall_score;
      if (r.overall_score >= 4) facMap[fac].sat++;
      
      if (r.staff_score) { facMap[fac].pplSum += r.staff_score; facMap[fac].pplCount++; }
      if (r.facility_score) { facMap[fac].prmSum += r.facility_score; facMap[fac].prmCount++; }
      // Mocking PRC (Process) based on cleanliness/overall average to match layout requirement
      if (r.cleanliness_score || r.overall_score) { 
        facMap[fac].prcSum += (r.cleanliness_score || r.overall_score); 
        facMap[fac].prcCount++; 
      }
    });

    let facList = Object.entries(facMap).filter(e => e[1].count >= 2).map(([name, data]) => ({
      name,
      responses: data.count,
      avg: data.sum / data.count,
      csat: (data.sat / data.count) * 100,
      ppl: data.pplCount ? data.pplSum / data.pplCount : 0,
      prm: data.prmCount ? data.prmSum / data.prmCount : 0,
      prc: data.prcCount ? data.prcSum / data.prcCount : 0
    })).sort((a,b) => b.csat - a.csat);

    // 2. Render Highlight Cards (Best & Needs Attention)
    if (facList.length > 0) {
      const best = facList[0];
      const worst = facList[facList.length-1];
      
      $('highlightCards').innerHTML = `
        <div class="highlight-card best">
          <div class="highlight-card-label">🏆 BEST PERFORMING</div>
          <div class="highlight-card-name">${best.name}</div>
          <div class="highlight-card-stats">CSAT ${best.csat.toFixed(0)}% • Avg ${best.avg.toFixed(2)}/5 • ${best.responses} responses</div>
        </div>
        <div class="highlight-card attention">
          <div class="highlight-card-label">⚠️ NEEDS ATTENTION</div>
          <div class="highlight-card-name">${worst.name}</div>
          <div class="highlight-card-stats">CSAT ${worst.csat.toFixed(0)}% • Avg ${worst.avg.toFixed(2)}/5 • ${worst.responses} responses</div>
        </div>
      `;
    }

    // 3. Render Charts
    CXCharts.renderCSATByFacility('chartCSATByFacility', allData);
    CXCharts.renderScoreDist('chartScoreDist', allData);

    // 4. Render Crucial Verbatim Insights
    const verbatims = allData.filter(r => r.feedback && r.feedback.length > 10).slice(0, 6);
    $('verbatimGrid').innerHTML = verbatims.map(r => {
      const ppl = r.staff_score ? r.staff_score.toFixed(1) : (r.overall_score ? r.overall_score.toFixed(1) : '-');
      const prm = r.facility_score ? r.facility_score.toFixed(1) : (r.overall_score ? r.overall_score.toFixed(1) : '-');
      const prc = r.cleanliness_score ? r.cleanliness_score.toFixed(1) : (r.overall_score ? r.overall_score.toFixed(1) : '-');
      
      const loc = r.location || r.source || 'LOCATION';
      const fac = r.survey_name || r.facility_type || 'FACILITY';
      const date = r.response_date ? r.response_date.substring(5) : ''; // MM-DD
      
      return `
        <div class="verbatim-card">
          <div class="verbatim-header">
            <span class="verbatim-location">${loc} - ${fac}</span>
            <span class="verbatim-date">${date}</span>
          </div>
          <div class="verbatim-text">${escapeHtml(r.feedback)}</div>
          <div class="verbatim-scores">
            <div class="verbatim-score-item"><span class="verbatim-score-label ppl">PPL:</span> <span class="verbatim-score-value">${ppl}</span></div>
            <div class="verbatim-score-item"><span class="verbatim-score-label prc">PRC:</span> <span class="verbatim-score-value">${prc}</span></div>
            <div class="verbatim-score-item"><span class="verbatim-score-label prm">PRM:</span> <span class="verbatim-score-value">${prm}</span></div>
          </div>
        </div>
      `;
    }).join('');

    // 5. Render Performance Summary Table
    $('performanceBody').innerHTML = facList.map((f, i) => {
      const statusClass = f.csat >= 80 ? 'good' : f.csat >= 60 ? 'fair' : 'poor';
      const statusIcon = f.csat >= 80 ? '✅ Good' : f.csat >= 60 ? '⚠️ Fair' : '❌ Poor';
      
      const scoreClass = f.avg >= 4.5 ? 'excellent' : f.avg >= 4 ? 'good' : f.avg >= 3 ? 'fair' : 'poor';
      const csatClass = f.csat >= 80 ? 'high' : f.csat >= 50 ? 'medium' : 'low';
      
      return `
        <tr>
          <td class="rank-cell">#${i+1}</td>
          <td><div class="facility-name"><span class="facility-dot" style="background:${CXCharts.BU_COLORS[i%CXCharts.BU_COLORS.length]}"></span>${f.name}</div></td>
          <td>${f.responses}</td>
          <td><span class="score-pill ${scoreClass}">${f.avg.toFixed(2)}/5</span></td>
          <td><span class="csat-pill ${csatClass}">${f.csat.toFixed(1)}%</span></td>
          <td class="dim-score">${f.ppl.toFixed(2)}</td>
          <td class="dim-score">${f.prm.toFixed(2)}</td>
          <td class="dim-score">${f.prc.toFixed(2)}</td>
          <td><span class="status-badge ${statusClass}">${statusIcon}</span></td>
        </tr>
      `;
    }).join('');
  }

  // ════════════════════════════════════════════════════════
  // TAB 4: SOCIAL SENTIMENT
  // ════════════════════════════════════════════════════════
  function renderSentimentTab() {
    CXCharts.renderSentDist('chartSentDist', allData);
    CXCharts.renderSentByBU('chartSentByBU', allData);

    // Tags Cloud
    const tagCounts = {};
    allData.forEach(r => {
      if (!r.tags) return;
      r.tags.split('|').forEach(tag => {
        tag = tag.trim();
        if (tag.length > 2) tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    $('tagsCloud').innerHTML = Object.entries(tagCounts)
      .sort((a,b)=>b[1]-a[1]).slice(0, 30)
      .map(([tag, count]) => `<span class="tag-pill">${tag}<span class="tag-count">${count}</span></span>`)
      .join('');

    // Feedback Table
    const query = ($('searchFeedback').value || '').toLowerCase().trim();
    let tableData = allData.filter(r => r.feedback && r.feedback.trim());
    if (query) {
      tableData = tableData.filter(r => 
        (r.feedback||'').toLowerCase().includes(query) || 
        (r.location||'').toLowerCase().includes(query)
      );
    }
    tableData.sort((a,b) => (b.response_date||'').localeCompare(a.response_date||''));
    $('feedbackCount').textContent = `${tableData.length} entries`;
    
    const start = (currentPage - 1) * PAGE_SIZE;
    const pageData = tableData.slice(start, start + PAGE_SIZE);
    
    $('feedbackBody').innerHTML = pageData.map(r => {
      const sentClass = r.sentiment === 'Positive' ? 'badge-positive' : r.sentiment === 'Negative' ? 'badge-negative' : r.sentiment === 'Neutral' ? 'badge-neutral' : 'badge-unknown';
      const scoreClass = r.overall_score ? `score-${r.overall_score}` : '';
      return `
        <tr>
          <td>${r.response_date ? new Date(r.response_date).toLocaleDateString('en-GB') : '—'}</td>
          <td>${r.source || '—'}</td>
          <td>${r.location || '—'}</td>
          <td>${r.survey_name || r.facility_type || '—'}</td>
          <td><span class="score-badge ${scoreClass}">${r.overall_score || '—'}</span></td>
          <td><span class="badge ${sentClass}">${r.sentiment || 'Unknown'}</span></td>
          <td title="${escapeHtml(r.feedback)}">${escapeHtml(r.feedback)}</td>
        </tr>
      `;
    }).join('');

    renderPagination(Math.max(1, Math.ceil(tableData.length / PAGE_SIZE)));
  }

  function renderPagination(totalPages) {
    const pag = $('pagination');
    if (totalPages <= 1) { pag.innerHTML = ''; return; }
    
    let html = `<button class="pagination-btn" onclick="CXApp.goPage(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>← Prev</button>`;
    for (let i = Math.max(1, currentPage - 2); i <= Math.min(totalPages, currentPage + 2); i++) {
      html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" onclick="CXApp.goPage(${i})">${i}</button>`;
    }
    html += `<button class="pagination-btn" onclick="CXApp.goPage(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>Next →</button>`;
    pag.innerHTML = html;
  }

  // ── Utils ──
  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function debounce(fn, ms) {
    let timer;
    return function (...args) { clearTimeout(timer); timer = setTimeout(() => fn.apply(this, args), ms); };
  }

  window.CXApp = { goPage(page) { currentPage = page; renderSentimentTab(); } };

  document.addEventListener('DOMContentLoaded', init);
})();
