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
  let currentSortCol = 'date';
  let currentSortDir = 'desc';
  const PAGE_SIZE = 20;

  // ── DOM References ──
  const $ = (id) => document.getElementById(id);

  // ── Init ──
  async function init() {
    try {
      const resp = await fetch('data/consolidated.json');
      const json = await resp.json();
      allData = json.records || [];
      allData.forEach((r, i) => r._id = i);

      // Set last updated
      $('lastUpdated').textContent = `Data: ${json.generated_at ? new Date(json.generated_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}`;

      try {
        const perfResp = await fetch('data/cx_performance.json?v=' + new Date().getTime());
        performanceData = await perfResp.json();
        
        if (performanceData && performanceData._months) {
          const mSelectFrom = $('perfFilterMonthFrom');
          const mSelectTo = $('perfFilterMonthTo');
          if (mSelectFrom && mSelectTo) {
            performanceData._months.forEach((m, idx) => {
              const optFrom = document.createElement('option');
              optFrom.value = idx.toString();
              optFrom.textContent = m;
              mSelectFrom.appendChild(optFrom);

              const optTo = document.createElement('option');
              optTo.value = idx.toString();
              optTo.textContent = m;
              mSelectTo.appendChild(optTo);
            });
          }
        }
      } catch (err) {
        console.warn('Failed to load CX Performance data:', err);
      }

      populateFilters();
      applyFilters();
      bindEvents();

      // Reveal dashboard
      setTimeout(() => {
        $('loadingOverlay').classList.add('hidden');
        $('dashboardContainer').style.opacity = '1';
        $('dashboardContainer').style.transition = 'opacity 0.5s ease';
        // Set default active tab
        const defaultTab = $('tabRaw');
        if (defaultTab) { defaultTab.classList.add('active'); }
      }, 400);


    } catch (err) {
      console.error('Failed to load data:', err);
      $('loadingOverlay').querySelector('.loading-text').textContent = 'Error loading data. Check console.';
    }
  }

  // ── Populate Filter Dropdowns ──
  function populateFilters() {
    const bus = [...new Set(allData.map(r => r.source).filter(Boolean))].sort();
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
      
      if (startDate || endDate) {
        if (!r.response_date) return false;
        const rowDate = new Date(r.response_date);
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

    // Table Sorting Logic
    document.querySelectorAll('.sortable').forEach(th => {
      th.addEventListener('click', () => {
        const col = th.getAttribute('data-sort');
        if (currentSortCol === col) {
          currentSortDir = currentSortDir === 'asc' ? 'desc' : 'asc';
        } else {
          currentSortCol = col;
          currentSortDir = 'desc'; // default to desc on new column
        }
        
        // Update UI
        document.querySelectorAll('.sortable').forEach(el => {
          el.classList.remove('sort-asc', 'sort-desc');
        });
        th.classList.add(`sort-${currentSortDir}`);
        
        renderFeedbackTable();
      });
    });

    // View Tabs Logic
    const tabRaw = $('tabRaw');
    const tabPerf = $('tabPerformance');
    const tabPerfAnalysis = $('tabPerfAnalysis');
    const tabSocmed = $('tabSocmed');
    const tabFibagLabag = $('tabFibagLabag');
    const viewRaw = $('viewRaw');
    const viewPerf = $('viewPerformance');
    const viewPerfAnalysis = $('viewPerfAnalysis');
    const viewSocmed = $('viewSocmed');
    const viewFibagLabag = $('viewFibagLabag');

    const allTabs = [tabRaw, tabPerf, tabPerfAnalysis, tabSocmed, tabFibagLabag].filter(Boolean);
    const allViews = [viewRaw, viewPerf, viewPerfAnalysis, viewSocmed, viewFibagLabag].filter(Boolean);

    function switchTab(activeTab, activeView) {
      allTabs.forEach(t => t && t.classList.remove('active'));
      allViews.forEach(v => v && (v.style.display = 'none'));
      if (activeTab) activeTab.classList.add('active');
      if (activeView) activeView.style.display = 'block';
    }

    if (tabRaw && tabPerf && viewRaw && viewPerf) {
      tabRaw.addEventListener('click', () => {
        switchTab(tabRaw, viewRaw);
        $('filterBar').style.display = 'flex';
      });

      tabPerf.addEventListener('click', () => {
        switchTab(tabPerf, viewPerf);
        $('filterBar').style.display = 'none';
        if (window.renderPerformanceCharts) window.renderPerformanceCharts(performanceData);
        if (window.renderInteractionDashboard) window.renderInteractionDashboard(performanceData);
      });

      if (tabPerfAnalysis && viewPerfAnalysis) {
        // Populate BU dropdown
        const paFilterBu = $('pa-filter-bu');
        if (paFilterBu && performanceData) {
          Object.keys(performanceData).filter(k => !k.startsWith('_')).forEach(bu => {
            const opt = document.createElement('option');
            opt.value = bu;
            opt.textContent = bu;
            paFilterBu.appendChild(opt);
          });
        }

        const runPerfAnalysis = () => {
          if (window.renderPerfAnalysis) window.renderPerfAnalysis(performanceData);
        };

        tabPerfAnalysis.addEventListener('click', () => {
          switchTab(tabPerfAnalysis, viewPerfAnalysis);
          $('filterBar').style.display = 'none';
          // Small delay so canvas is visible before rendering
          setTimeout(runPerfAnalysis, 80);
        });

        if (paFilterBu) paFilterBu.addEventListener('change', runPerfAnalysis);
        const paRefresh = $('pa-btn-refresh');
        if (paRefresh) paRefresh.addEventListener('click', runPerfAnalysis);
      }

      if (tabSocmed && viewSocmed) {
        tabSocmed.addEventListener('click', () => {
          switchTab(tabSocmed, viewSocmed);
          $('filterBar').style.display = 'none';
          if (window.renderSocmedCharts && !window.socmedRendered) {
             window.renderSocmedCharts();
             window.socmedRendered = true;
          }
        });
      }

      if (tabFibagLabag && viewFibagLabag) {
        tabFibagLabag.addEventListener('click', () => {
          switchTab(tabFibagLabag, viewFibagLabag);
          $('filterBar').style.display = 'none';
        });
      }

      
      const perfFilter = $('perfFilterBU');
      const perfMonthFilterFrom = $('perfFilterMonthFrom');
      const perfMonthFilterTo = $('perfFilterMonthTo');
      
      const renderPerfViews = () => {
         if (window.renderPerformanceCharts) {
             window.renderPerformanceCharts(performanceData);
         }
         if (window.renderInteractionDashboard) {
             window.renderInteractionDashboard(performanceData);
         }
      };

      if (perfFilter) {
          perfFilter.addEventListener('change', renderPerfViews);
      }
      if (perfMonthFilterFrom) {
          perfMonthFilterFrom.addEventListener('change', renderPerfViews);
      }
      if (perfMonthFilterTo) {
          perfMonthFilterTo.addEventListener('change', renderPerfViews);
      }
    }
  }

  // ── Render All ──
  function renderAll() {
    renderHeader();
    renderOverallKPIs();
    renderNPSPanel();
    renderMemberCSAT();
    renderCascade();
    renderInsights();
    renderCharts();
    renderTagsCloud();
    renderFeedbackTable();
    if (window.renderPerformanceCharts && typeof performanceData !== 'undefined') {
      window.renderPerformanceCharts(performanceData);
    }
    if (window.renderInteractionDashboard && typeof performanceData !== 'undefined') {
      window.renderInteractionDashboard(performanceData);
    }
  }

  // ── Header Stats ──
  function renderHeader() {
    $('filteredCount').textContent = `Showing ${filteredData.length.toLocaleString()} of ${allData.length.toLocaleString()} responses`;
  }

  // ── NPS Helper ──
  // Derives NPS from 5-point overall_score:
  //   Score 5   → Promoter  (equiv. 9-10 on standard 0-10 scale)
  //   Score 4   → Passive   (equiv. 7-8)
  //   Score 1-3 → Detractor (equiv. 0-6)
  // NPS = (% Promoters) − (% Detractors), range −100 to +100
  function calcNPS(records) {
    const scored = records.filter(r => r.overall_score != null);
    if (scored.length === 0) return null;
    const promoters  = scored.filter(r => r.overall_score === 5).length;
    const detractors = scored.filter(r => r.overall_score <= 3).length;
    const nps = ((promoters / scored.length) * 100) - ((detractors / scored.length) * 100);
    return { nps: Math.round(nps * 10) / 10, promoters, detractors, passives: scored.length - promoters - detractors, total: scored.length };
  }

  function npsColor(nps) {
    if (nps === null) return '#64748b';
    if (nps >= 50)  return '#10b981'; // Excellent
    if (nps >= 0)   return '#f59e0b'; // Good
    return '#ef4444';                 // Needs improvement
  }

  function npsLabel(nps) {
    if (nps === null) return '—';
    if (nps >= 70)  return 'Excellent';
    if (nps >= 50)  return 'Great';
    if (nps >= 0)   return 'Good';
    if (nps >= -20) return 'Needs Work';
    return 'Critical';
  }

  // ── Overall KPI Row ──
  function renderOverallKPIs() {
    const scored = filteredData.filter(r => r.overall_score != null);
    const avgCSAT = scored.length > 0
      ? (scored.reduce((s, r) => s + r.overall_score, 0) / scored.length).toFixed(2)
      : '—';

    const satisfied = scored.filter(r => r.overall_score >= 4).length;
    const satPct = scored.length > 0 ? ((satisfied / scored.length) * 100).toFixed(1) : 0;

    const sentiments = { Positive: 0, Neutral: 0, Negative: 0 };
    filteredData.forEach(r => {
      if (sentiments.hasOwnProperty(r.sentiment)) sentiments[r.sentiment]++;
    });
    const totalSent = sentiments.Positive + sentiments.Neutral + sentiments.Negative;
    const posPct = totalSent > 0 ? ((sentiments.Positive / totalSent) * 100).toFixed(1) : 0;

    const negCount = sentiments.Negative;
    const negPct = totalSent > 0 ? ((negCount / totalSent) * 100).toFixed(1) : 0;

    // NPS values — used only in renderNPSPanel, not shown inline in KPI row
    const npsResult = calcNPS(filteredData);
    const npsVal    = npsResult !== null ? npsResult.nps : null;
    const npsClr    = npsColor(npsVal);
    const npsLbl    = npsLabel(npsVal);

    const kpis = [
      { icon: '📋', label: 'Total Responses', value: filteredData.length.toLocaleString(), cls: 'blue' },
      { icon: '⭐', label: 'Avg CSAT', value: avgCSAT, cls: 'green' },
      { icon: '😊', label: 'Positive Sentiment', value: `${posPct}%`, cls: 'cyan' },
      { icon: '⚠️', label: 'Negative Sentiment', value: `${negPct}%`, cls: 'amber' },
    ];

    // Add Total Pengunjung from cx_performance data if available
    let totalPengunjung = 0;
    if (performanceData && Object.keys(performanceData).length > 0 && performanceData._months) {
      const bu = document.getElementById('filterBU').value;
      const filterStart = document.getElementById('filterStartDate').value;
      const filterEnd = document.getElementById('filterEndDate').value;
      
      let startD = filterStart ? new Date(filterStart) : null;
      let endD = filterEnd ? new Date(filterEnd) : null;
      if (startD) startD = new Date(startD.getFullYear(), startD.getMonth(), 1);
      if (endD) endD = new Date(endD.getFullYear(), endD.getMonth(), 31);

      const validIndices = [];
      performanceData._months.forEach((m, i) => {
        const parts = m.split(' ');
        const mDate = new Date(`${parts[0]} 1, 20${parts[1]}`);
        if (startD && mDate < startD) return;
        if (endD && mDate > endD) return;
        validIndices.push(i);
      });

      if (bu === 'all') {
        Object.keys(performanceData).forEach(key => {
          if (key !== '_months' && performanceData[key].interactions && performanceData[key].interactions.pengunjung) {
            validIndices.forEach(idx => {
              totalPengunjung += (performanceData[key].interactions.pengunjung[idx] || 0);
            });
          }
        });
      } else {
        Object.keys(performanceData).forEach(key => {
          if ((key === bu || key.startsWith(bu + ' - ')) && performanceData[key].interactions && performanceData[key].interactions.pengunjung) {
            validIndices.forEach(idx => {
              totalPengunjung += (performanceData[key].interactions.pengunjung[idx] || 0);
            });
          }
        });
      }
    }
    
    if (totalPengunjung > 0) {
      kpis.splice(1, 0, { icon: '🚶', label: 'Total Pengunjung', value: totalPengunjung.toLocaleString(), cls: 'purple' });
    }

    $('overallKpiRow').innerHTML = kpis.map(k => `
      <div class="overall-kpi-card">
        <div class="overall-kpi-icon ${k.cls}">${k.icon}</div>
        <div class="overall-kpi-text">
          <div class="kpi-value" ${k.color ? `style="color:${k.color}"` : ''}>${k.value}</div>
          <div class="kpi-label">${k.label}${k.sub ? ` <span style="font-size:0.7rem;opacity:0.7;">(${k.sub})</span>` : ''}</div>
        </div>
      </div>
    `).join('');

    // Render NPS breakdown bar
    if (npsResult) {
      const pPct = ((npsResult.promoters  / npsResult.total) * 100).toFixed(1);
      const dPct = ((npsResult.detractors / npsResult.total) * 100).toFixed(1);
      const psPct = ((npsResult.passives  / npsResult.total) * 100).toFixed(1);
      let npsBreakdown = $('npsBreakdown');
      if (npsBreakdown) {
        npsBreakdown.innerHTML = `
          <div style="display:flex;align-items:center;gap:0.75rem;flex-wrap:wrap;">
            <span style="color:#94a3b8;font-size:0.8rem;">NPS Breakdown:</span>
            <span style="color:#10b981;font-size:0.8rem;">😊 Promoters ${pPct}%</span>
            <span style="color:#f59e0b;font-size:0.8rem;">😐 Passives ${psPct}%</span>
            <span style="color:#ef4444;font-size:0.8rem;">😠 Detractors ${dPct}%</span>
            <div style="flex:1;min-width:120px;height:8px;border-radius:4px;overflow:hidden;display:flex;">
              <div style="width:${pPct}%;background:#10b981;"></div>
              <div style="width:${psPct}%;background:#f59e0b;"></div>
              <div style="width:${dPct}%;background:#ef4444;"></div>
            </div>
          </div>`;
      }
    }

    // Update badges
    if ($('avgScoreBadge')) $('avgScoreBadge').textContent = `Avg: ${avgCSAT}`;
    if ($('sentimentBadge')) $('sentimentBadge').textContent = `${posPct}% positive`;
  }

  // ── Dedicated NPS Panel ──
  function renderNPSPanel() {
    const panel = $('npsPanel');
    if (!panel) return;

    const npsResult = calcNPS(filteredData);
    if (!npsResult) {
      panel.innerHTML = '';
      return;
    }

    const { nps, promoters, passives, detractors, total } = npsResult;
    const npsStr  = (nps > 0 ? '+' : '') + nps;
    const clr     = npsColor(nps);
    const lbl     = npsLabel(nps);
    const pPct    = ((promoters  / total) * 100).toFixed(1);
    const psPct   = ((passives   / total) * 100).toFixed(1);
    const dPct    = ((detractors / total) * 100).toFixed(1);

    // --- Per BU NPS ---
    const buMap = {};
    filteredData.forEach(r => {
      const bu = r.source || 'Unknown';
      if (!buMap[bu]) buMap[bu] = [];
      buMap[bu].push(r);
    });
    const buRows = Object.entries(buMap)
      .map(([bu, records]) => ({ bu, result: calcNPS(records), count: records.length }))
      .filter(x => x.result !== null)
      .sort((a, b) => b.result.nps - a.result.nps);

    // --- Zone reference data ---
    const zones = [
      { range: '70 → 100', label: 'Excellent',   color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
      { range: '50 → 69',  label: 'Great',       color: '#06b6d4', bg: 'rgba(6,182,212,0.12)'  },
      { range: '0 → 49',   label: 'Good',        color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
      { range: '-20 → -1', label: 'Needs Work',  color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
      { range: '< -20',    label: 'Critical',    color: '#ef4444', bg: 'rgba(239,68,68,0.12)'  },
    ];

    panel.innerHTML = `
      <div style="
        background: linear-gradient(135deg, rgba(17,24,39,0.85) 0%, rgba(26,34,53,0.9) 100%);
        border: 1px solid rgba(255,255,255,0.08);
        border-radius: 16px;
        padding: 1.5rem;
        backdrop-filter: blur(12px);
      ">
        <!-- Header -->
        <div style="display:flex;align-items:center;gap:0.6rem;margin-bottom:1.25rem;">
          <span style="font-size:1.3rem;">🎯</span>
          <div>
            <div style="font-size:1rem;font-weight:700;color:#f1f5f9;">Net Promoter Score (NPS)</div>
            <div style="font-size:0.75rem;color:#64748b;">Derived from CSAT overall scores &nbsp;·&nbsp; Score 5 = Promoter &nbsp;·&nbsp; Score 4 = Passive &nbsp;·&nbsp; Score 1–3 = Detractor</div>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:auto 1fr auto;gap:1.5rem;align-items:center;flex-wrap:wrap;">

          <!-- Score Badge -->
          <div style="text-align:center;min-width:110px;">
            <div style="
              width:110px;height:110px;border-radius:50%;
              background:conic-gradient(${clr} 0deg, rgba(255,255,255,0.06) 0deg);
              display:flex;flex-direction:column;align-items:center;justify-content:center;
              border:3px solid ${clr};
              box-shadow:0 0 24px ${clr}44;
              position:relative;
            ">
              <div style="font-size:1.9rem;font-weight:800;color:${clr};line-height:1;">${npsStr}</div>
              <div style="font-size:0.65rem;color:#64748b;letter-spacing:0.08em;margin-top:2px;">NPS</div>
            </div>
            <div style="margin-top:0.5rem;padding:0.2rem 0.75rem;border-radius:20px;background:${clr}22;border:1px solid ${clr}55;display:inline-block;">
              <span style="font-size:0.75rem;font-weight:600;color:${clr};">${lbl}</span>
            </div>
          </div>

          <!-- Breakdown -->
          <div>
            <!-- Stacked bar -->
            <div style="height:14px;border-radius:7px;overflow:hidden;display:flex;margin-bottom:0.75rem;">
              <div style="width:${pPct}%;background:linear-gradient(90deg,#10b981,#059669);transition:width 0.6s ease;"
                   title="Promoters ${pPct}%"></div>
              <div style="width:${psPct}%;background:linear-gradient(90deg,#f59e0b,#d97706);transition:width 0.6s ease;"
                   title="Passives ${psPct}%"></div>
              <div style="width:${dPct}%;background:linear-gradient(90deg,#ef4444,#dc2626);transition:width 0.6s ease;"
                   title="Detractors ${dPct}%"></div>
            </div>

            <!-- Group cards -->
            <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.6rem;">
              <div style="padding:0.6rem 0.75rem;border-radius:10px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.2);text-align:center;">
                <div style="font-size:1.2rem;font-weight:700;color:#10b981;">${pPct}%</div>
                <div style="font-size:0.7rem;color:#10b981;margin:1px 0;">😊 Promoters</div>
                <div style="font-size:0.65rem;color:#64748b;">${promoters.toLocaleString()} resp.</div>
              </div>
              <div style="padding:0.6rem 0.75rem;border-radius:10px;background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.2);text-align:center;">
                <div style="font-size:1.2rem;font-weight:700;color:#f59e0b;">${psPct}%</div>
                <div style="font-size:0.7rem;color:#f59e0b;margin:1px 0;">😐 Passives</div>
                <div style="font-size:0.65rem;color:#64748b;">${passives.toLocaleString()} resp.</div>
              </div>
              <div style="padding:0.6rem 0.75rem;border-radius:10px;background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);text-align:center;">
                <div style="font-size:1.2rem;font-weight:700;color:#ef4444;">${dPct}%</div>
                <div style="font-size:0.7rem;color:#ef4444;margin:1px 0;">😠 Detractors</div>
                <div style="font-size:0.65rem;color:#64748b;">${detractors.toLocaleString()} resp.</div>
              </div>
            </div>

            <div style="margin-top:0.6rem;font-size:0.72rem;color:#475569;">
              Based on <strong style="color:#94a3b8;">${total.toLocaleString()}</strong> scored responses
              &nbsp;·&nbsp; NPS = %Promoters − %Detractors
            </div>
          </div>

          <!-- Zone reference -->
          <div style="min-width:130px;">
            <div style="font-size:0.7rem;color:#64748b;margin-bottom:0.4rem;letter-spacing:0.05em;text-transform:uppercase;">NPS Zones</div>
            ${zones.map(z => `
              <div style="
                display:flex;align-items:center;justify-content:space-between;
                padding:0.25rem 0.5rem;margin-bottom:0.2rem;border-radius:6px;
                background:${z.bg};border-left:3px solid ${z.color};
                ${npsLabel(nps) === z.label ? 'box-shadow:0 0 0 1px ' + z.color + '66;' : ''}
              ">
                <span style="font-size:0.65rem;color:${z.color};font-weight:${npsLabel(nps)===z.label?'700':'400'}">${z.label}</span>
                <span style="font-size:0.6rem;color:#475569;">${z.range}</span>
              </div>
            `).join('')}
          </div>

        </div>

        <!-- Per BU table -->
        ${buRows.length > 1 ? `
          <div style="margin-top:1.25rem;border-top:1px solid rgba(255,255,255,0.06);padding-top:1rem;">
            <div style="font-size:0.75rem;color:#64748b;margin-bottom:0.6rem;letter-spacing:0.04em;text-transform:uppercase;">NPS by Business Unit</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:0.5rem;">
              ${buRows.map(({ bu, result }) => {
                const b = result;
                const bStr  = (b.nps > 0 ? '+' : '') + b.nps;
                const bClr  = npsColor(b.nps);
                const bLbl  = npsLabel(b.nps);
                const bPPct = ((b.promoters  / b.total) * 100).toFixed(0);
                const bDPct = ((b.detractors / b.total) * 100).toFixed(0);
                return `
                  <div style="
                    padding:0.6rem 0.75rem;border-radius:10px;
                    background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);
                    border-left:3px solid ${bClr};
                  ">
                    <div style="font-size:0.72rem;color:#94a3b8;font-weight:600;margin-bottom:0.25rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${bu}</div>
                    <div style="font-size:1.15rem;font-weight:800;color:${bClr};">${bStr}</div>
                    <div style="font-size:0.62rem;color:#475569;">${bLbl} &nbsp;·&nbsp; 😊${bPPct}% 😠${bDPct}%</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }

  // ── CSAT Cascade Values ──
  function renderCascade() {
    const scored = filteredData.filter(r => r.overall_score != null);
    const avgCSAT = scored.length > 0
      ? (scored.reduce((s, r) => s + r.overall_score, 0) / scored.length).toFixed(2) : '—';

    const staffScored = filteredData.filter(r => r.staff_score != null);
    const avgStaff = staffScored.length > 0
      ? (staffScored.reduce((s, r) => s + r.staff_score, 0) / staffScored.length).toFixed(2) : '—';

    const cleanScored = filteredData.filter(r => r.cleanliness_score != null);
    const avgClean = cleanScored.length > 0
      ? (cleanScored.reduce((s, r) => s + r.cleanliness_score, 0) / cleanScored.length).toFixed(2) : '—';

    const facScored = filteredData.filter(r => r.facility_score != null);
    const avgFac = facScored.length > 0
      ? (facScored.reduce((s, r) => s + r.facility_score, 0) / facScored.length).toFixed(2) : '—';

    if ($('cascadePPL')) $('cascadePPL').textContent = avgStaff;
    if ($('cascadePRC')) $('cascadePRC').textContent = avgClean;
    if ($('cascadePRM')) $('cascadePRM').textContent = avgFac;
  }

  // ── Per-Member CSAT Scorecard ──
  function renderMemberCSAT() {
    const grid = $('memberCSATGrid');
    if (!grid) return;

    // Group data by BU
    const buMap = {};
    filteredData.forEach(r => {
      const bu = r.source || 'Unknown';
      if (!buMap[bu]) buMap[bu] = { records: [], scored: [], staff: [], facility: [], cleanliness: [] };
      buMap[bu].records.push(r);
      if (r.overall_score != null) buMap[bu].scored.push(r.overall_score);
      if (r.staff_score != null) buMap[bu].staff.push(r.staff_score);
      if (r.facility_score != null) buMap[bu].facility.push(r.facility_score);
      if (r.cleanliness_score != null) buMap[bu].cleanliness.push(r.cleanliness_score);
    });

    const avg = arr => arr.length > 0 ? (arr.reduce((a, b) => a + b, 0) / arr.length) : null;

    const bus = Object.keys(buMap).sort();

    if (bus.length === 0) {
      grid.innerHTML = '<div class="no-data"><div class="no-data-icon">🏢</div>No data for current filters</div>';
      return;
    }

    grid.innerHTML = bus.map((bu, idx) => {
      const d = buMap[bu];
      const csatAvg = avg(d.scored);
      const csatStr = csatAvg !== null ? csatAvg.toFixed(2) : '—';
      const scoreClass = csatAvg >= 4 ? 'score-high' : csatAvg >= 3 ? 'score-mid' : 'score-low';

      const satCount = d.scored.filter(s => s >= 4).length;
      const satPct = d.scored.length > 0 ? ((satCount / d.scored.length) * 100).toFixed(1) : '—';

      const staffAvg = avg(d.staff);
      const facAvg = avg(d.facility);
      const cleanAvg = avg(d.cleanliness);

      // NPS per BU
      const buNPS = calcNPS(d.records);
      const buNpsVal = buNPS !== null ? buNPS.nps : null;
      const buNpsStr = buNpsVal !== null ? (buNpsVal > 0 ? '+' + buNpsVal : String(buNpsVal)) : '—';
      const buNpsClr = npsColor(buNpsVal);
      const buNpsLbl = npsLabel(buNpsVal);

      const subBar = (label, val, cls) => {
        const pct = val !== null ? ((val / 5) * 100).toFixed(0) : 0;
        const valStr = val !== null ? val.toFixed(2) : '—';
        return `
          <div class="sub-score-row">
            <span class="sub-score-label">${label}</span>
            <div class="sub-score-bar-bg">
              <div class="sub-score-bar ${cls}" style="width: ${pct}%"></div>
            </div>
            <span class="sub-score-value">${valStr}</span>
          </div>
        `;
      };

      const lowSample = d.records.length < 30
        ? `<div class="member-low-sample">⚠️ Low sample size (${d.records.length} responses)</div>`
        : '';

      return `
        <div class="member-card animate-in delay-${(idx % 4) + 1}">
          <div class="member-card-header">
            <span class="member-card-name">${bu}</span>
            <span class="member-card-responses">${d.records.length.toLocaleString()} responses</span>
          </div>
          <div class="member-card-body">
            <div>
              <div class="member-csat-score ${scoreClass}">${csatStr}</div>
              <div class="member-satisfaction">${satPct}% satisfied</div>
              <div style="margin-top:0.5rem;padding:0.4rem 0.6rem;border-radius:8px;background:rgba(99,102,241,0.08);text-align:center;">
                <div style="font-size:1.1rem;font-weight:700;color:${buNpsClr};">${buNpsStr}</div>
                <div style="font-size:0.65rem;color:#64748b;letter-spacing:0.05em;">NPS · ${buNpsLbl}</div>
              </div>
            </div>
            <div class="member-sub-scores">
              ${subBar('People', staffAvg, 'ppl')}
              ${subBar('Process', cleanAvg, 'prc')}
              ${subBar('Premises', facAvg, 'prm')}
            </div>
          </div>
          ${lowSample}
        </div>
      `;
    }).join('');
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

    // NPS overall insight
    const npsRes = calcNPS(data);
    if (npsRes !== null) {
      const npsStr = npsRes.nps > 0 ? '+' + npsRes.nps : String(npsRes.nps);
      const pPct = ((npsRes.promoters / npsRes.total) * 100).toFixed(1);
      const dPct = ((npsRes.detractors / npsRes.total) * 100).toFixed(1);
      insights.push({
        icon: '🎯',
        title: `NPS: ${npsStr} — ${npsLabel(npsRes.nps)}`,
        description: `From ${npsRes.total.toLocaleString()} scored responses: ${pPct}% Promoters (score 5), ${dPct}% Detractors (score 1–3). NPS is derived from CSAT overall scores.`,
        color: npsRes.nps >= 50 ? 'green' : npsRes.nps >= 0 ? 'amber' : 'red',
      });
    }

    // Best & worst performing BU
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

    // Month-over-Month trend
    const monthMap = {};
    scored.forEach(r => {
      if (!r.response_date) return;
      const month = r.response_date.substring(0, 7);
      if (!monthMap[month]) monthMap[month] = { sum: 0, count: 0 };
      monthMap[month].sum += r.overall_score;
      monthMap[month].count++;
    });
    const sortedMonths = Object.keys(monthMap).sort();
    if (sortedMonths.length >= 2) {
      const lastMonth = sortedMonths[sortedMonths.length - 1];
      const prevMonth = sortedMonths[sortedMonths.length - 2];
      const lastAvg = monthMap[lastMonth].sum / monthMap[lastMonth].count;
      const prevAvg = monthMap[prevMonth].sum / monthMap[prevMonth].count;
      const diff = lastAvg - prevAvg;
      const diffStr = diff >= 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2);
      const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const [ly, lm] = lastMonth.split('-');
      const lastLabel = `${monthNames[parseInt(lm)-1]} ${ly}`;

      if (diff > 0.1) {
        insights.push({
          icon: '📈', title: 'CSAT Improving',
          description: `CSAT improved by ${diffStr} points in ${lastLabel} (${lastAvg.toFixed(2)} vs ${prevAvg.toFixed(2)}). Keep up the momentum!`,
          color: 'green',
        });
      } else if (diff < -0.1) {
        insights.push({
          icon: '📉', title: 'CSAT Declining',
          description: `CSAT dropped by ${diffStr} points in ${lastLabel} (${lastAvg.toFixed(2)} vs ${prevAvg.toFixed(2)}). Investigate root causes.`,
          color: 'red',
        });
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

      // Worst facility
      if (facEntries.length > 1) {
        const worstFac = facEntries[facEntries.length - 1];
        const worstAvg = (worstFac[1].sum / worstFac[1].count).toFixed(2);
        if (parseFloat(worstAvg) < 3.5) {
          insights.push({
            icon: '🔧', title: 'Facility Needs Improvement',
            description: `"${worstFac[0]}" scores only ${worstAvg} (${worstFac[1].count} responses). Prioritize action here.`,
            color: 'amber',
          });
        }
      }
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
    CXCharts.renderSentimentByBU('chartSentimentByBU', filteredData);
    CXCharts.renderResponseVolume('chartResponseVolume', filteredData);
    CXCharts.renderTrend('chartTrend', filteredData);
    CXCharts.renderCSATHeatmap('csatHeatmap', filteredData);
    CXCharts.renderFacilityRanking('chartTopFacilities', filteredData, true, 5);
    CXCharts.renderFacilityRanking('chartBottomFacilities', filteredData, false, 5);
  }

  // ── Tags Cloud ──
  function renderTagsCloud() {
    const wordCounts = {};
    const stopwords = new Set(['dan','di','ke','dari','yang','untuk','dengan','ini','itu','ada','saya','kami','tidak','bisa','sudah','juga','lagi','sangat','lebih','karena','kalau','apa','buat','banyak','tapi','saja','mau','harus','agak','masih','pada','dalam','saat','terus','biar','akan','belum','seperti','begitu','tolong','mohon','agar','nya','ya','yg','aja','udah']);
    
    filteredData.forEach(r => {
      if (!r.feedback) return;
      // Extract words (min 3 chars)
      const words = r.feedback.toLowerCase().match(/[a-z]+/g) || [];
      words.forEach(w => {
        if (w.length > 3 && !stopwords.has(w)) {
          wordCounts[w] = (wordCounts[w] || 0) + 1;
        }
      });
    });

    const sorted = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 40);

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

    // Dynamic Sort
    tableData.sort((a, b) => {
      let valA, valB;
      switch (currentSortCol) {
        case 'date':
          valA = a.response_date || '';
          valB = b.response_date || '';
          break;
        case 'unit':
          valA = a.source || '';
          valB = b.source || '';
          break;
        case 'location':
          valA = a.location || '';
          valB = b.location || '';
          break;
        case 'facility':
          valA = a.facility_type || '';
          valB = b.facility_type || '';
          break;
        case 'score':
          valA = a.overall_score || 0;
          valB = b.overall_score || 0;
          break;
        case 'sentiment':
          valA = a.sentiment || '';
          valB = b.sentiment || '';
          break;
        default:
          valA = ''; valB = '';
      }
      
      let cmp = 0;
      if (typeof valA === 'string' && typeof valB === 'string') {
        cmp = valA.localeCompare(valB);
      } else {
        cmp = valA > valB ? 1 : (valA < valB ? -1 : 0);
      }
      return currentSortDir === 'asc' ? cmp : -cmp;
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
          <td>
            <select class="badge ${sentClass}" style="border:none; outline:none; cursor:pointer;" onchange="window.updateSentiment(${r._id}, this.value)">
              <option value="Positive" ${sentLabel === 'Positive' ? 'selected' : ''}>Positive</option>
              <option value="Neutral" ${sentLabel === 'Neutral' ? 'selected' : ''}>Neutral</option>
              <option value="Negative" ${sentLabel === 'Negative' ? 'selected' : ''}>Negative</option>
            </select>
          </td>
          <td title="${escapeHtml(r.feedback)}">${escapeHtml(r.feedback)}</td>
        </tr>`;
      }).join('');
    }

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

  // ── Public API ──
  window.CXApp = {
    goPage(page) {
      currentPage = page;
      renderFeedbackTable();
      $('feedbackSection').scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
  };

  window.updateSentiment = function(id, newVal) {
    const record = allData.find(r => r._id === id);
    if (record) {
      record.sentiment = newVal;
      // Re-render components that depend on sentiment counts
      renderOverallKPIs();
      if (window.renderCharts) window.renderCharts();
      // Render table to update the row's class colors if we want, or just let it be.
      // We shouldn't jump pages, so we just call renderFeedbackTable which respects currentPage.
      renderFeedbackTable();
    }
  };

  // ── Boot ──
  document.addEventListener('DOMContentLoaded', init);
})();
