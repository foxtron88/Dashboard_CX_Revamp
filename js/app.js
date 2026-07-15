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
    const viewRaw = $('viewRaw');
    const viewPerf = $('viewPerformance');

    if (tabRaw && tabPerf && viewRaw && viewPerf) {
      tabRaw.addEventListener('click', () => {
        tabRaw.classList.add('active');
        tabPerf.classList.remove('active');
        viewRaw.style.display = 'block';
        viewPerf.style.display = 'none';
        $('filterBar').style.display = 'flex';
      });

      tabPerf.addEventListener('click', () => {
        tabPerf.classList.add('active');
        tabRaw.classList.remove('active');
        viewRaw.style.display = 'none';
        viewPerf.style.display = 'block';
        $('filterBar').style.display = 'none'; // Hide main filters for perf view

        if (window.renderPerformanceCharts) {
          window.renderPerformanceCharts(performanceData);
        }
        if (window.renderInteractionDashboard) {
          window.renderInteractionDashboard(performanceData);
        }
      });
      
      const perfFilter = $('perfFilterBU');
      if (perfFilter) {
          perfFilter.addEventListener('change', () => {
             if (window.renderPerformanceCharts) {
                 window.renderPerformanceCharts(performanceData);
             }
             if (window.renderInteractionDashboard) {
                 window.renderInteractionDashboard(performanceData);
             }
          });
      }
    }
  }

  // ── Render All ──
  function renderAll() {
    renderHeader();
    renderOverallKPIs();
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
          <div class="kpi-value">${k.value}</div>
          <div class="kpi-label">${k.label}</div>
        </div>
      </div>
    `).join('');

    // Update badges
    if ($('avgScoreBadge')) $('avgScoreBadge').textContent = `Avg: ${avgCSAT}`;
    if ($('sentimentBadge')) $('sentimentBadge').textContent = `${posPct}% positive`;
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
