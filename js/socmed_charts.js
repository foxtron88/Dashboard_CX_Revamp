/**
 * Social Media Analytics — Deep Analysis Charts
 * Reads from /data/socmed_data.json and renders all SM dashboard sections
 */

(function () {
  'use strict';

  const instances = {};

  function destroyChart(id) {
    if (instances[id]) { instances[id].destroy(); delete instances[id]; }
  }

  function makeChart(id, config) {
    destroyChart(id);
    const el = document.getElementById(id);
    if (!el) return null;
    const chart = new Chart(el.getContext('2d'), config);
    instances[id] = chart;
    return chart;
  }

  const PALETTE = [
    '#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#f97316', '#ec4899', '#14b8a6', '#84cc16'
  ];

  const SENTIMENT_COLORS = {
    'Positif': '#10b981',
    'Netral': '#6366f1',
    'Negatif': '#ef4444',
  };

  const PLATFORM_COLORS = {
    'Twitter': '#1da1f2',
    'Instagram': '#e1306c',
    'Youtube': '#ff0000',
    'Tiktok': '#69c9d0',
    'Threads': '#101010',
  };

  function fmt(n) {
    if (!n && n !== 0) return '—';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
    return Math.round(n).toLocaleString('id-ID');
  }

  function gridOpts(yLabel = '') {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: { position: 'top', labels: { color: '#94a3b8', padding: 12 } },
        tooltip: {
          backgroundColor: 'rgba(15,23,42,0.95)',
          titleColor: '#f1f5f9', bodyColor: '#94a3b8',
          borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1, padding: 10,
        }
      },
      scales: {
        x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', maxRotation: 45 } },
        y: {
          grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' },
          title: { display: !!yLabel, text: yLabel, color: '#64748b' }
        }
      }
    };
  }

  function donutOpts() {
    return {
      responsive: true, maintainAspectRatio: false, cutout: '65%',
      plugins: {
        legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 12 } },
        tooltip: {
          callbacks: {
            label: ctx => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              return ` ${ctx.label}: ${ctx.parsed.toLocaleString('id-ID')} (${((ctx.parsed / total) * 100).toFixed(1)}%)`;
            }
          }
        }
      }
    };
  }

  // ── KPI Cards ──
  function renderKPIs(d) {
    const rt = d.response_time;
    const rtHr = (rt.avg_minutes / 60).toFixed(1);
    const kpis = [
      { label: 'Total Posts', value: fmt(d.total_posts), icon: '📝', color: '#6366f1' },
      { label: 'Total Comments', value: fmt(d.total_comments), icon: '💬', color: '#06b6d4' },
      { label: 'Total Likes', value: fmt(d.total_likes), icon: '👍', color: '#10b981' },
      { label: 'Total Views', value: fmt(d.total_views), icon: '👁️', color: '#f59e0b' },
      { label: 'Total Replies', value: fmt(d.total_replies), icon: '↩️', color: '#8b5cf6' },
      { label: 'Avg Response Time', value: rtHr + ' jam', icon: '⏱️', color: '#f97316' },
    ];
    const container = document.getElementById('sm-kpi-row');
    if (!container) return;
    container.innerHTML = kpis.map(k => `
      <div class="kpi-card" style="border-top: 3px solid ${k.color};">
        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
          <div class="kpi-title">${k.label}</div>
          <span style="font-size:1.4rem;">${k.icon}</span>
        </div>
        <div class="kpi-value" style="color:${k.color}; font-size:1.8rem;">${k.value}</div>
      </div>
    `).join('');
  }

  // ── Sentiment Trend (Posts) ──
  function renderSentimentTrend(d) {
    const months = Object.keys(d.monthly_sentiment_trend).sort();
    const sentiments = ['Positif', 'Netral', 'Negatif'];
    const datasets = sentiments.map(s => ({
      label: s,
      data: months.map(m => d.monthly_sentiment_trend[m][s] || 0),
      borderColor: SENTIMENT_COLORS[s],
      backgroundColor: SENTIMENT_COLORS[s] + '33',
      fill: true, tension: 0.4, spanGaps: true, pointRadius: 3,
    }));
    const opts = gridOpts('Jumlah Post');
    opts.scales.x.ticks.maxRotation = 45;
    makeChart('sm-sentiment-trend', { type: 'line', data: { labels: months, datasets }, options: opts });
  }

  // ── Platform Volume Trend ──
  function renderPlatformTrend(d) {
    const months = Object.keys(d.monthly_platform_trend).sort();
    const platforms = ['Twitter', 'Instagram', 'Youtube', 'Tiktok'];
    const datasets = platforms.map(p => ({
      label: p,
      data: months.map(m => (d.monthly_platform_trend[m] || {})[p] || 0),
      borderColor: PLATFORM_COLORS[p],
      backgroundColor: PLATFORM_COLORS[p] + '22',
      fill: false, tension: 0.4, spanGaps: true, pointRadius: 3,
    }));
    makeChart('sm-platform-trend', { type: 'line', data: { labels: months, datasets }, options: gridOpts('Jumlah Post') });
  }

  // ── Platform Donut ──
  function renderPlatformDonut(d) {
    const labels = d.platform_stats.map(p => p.platform);
    const values = d.platform_stats.map(p => p.post_count);
    const colors = labels.map(l => PLATFORM_COLORS[l] || '#6366f1');
    makeChart('sm-platform-donut', {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }] },
      options: donutOpts()
    });
  }

  // ── Engagement Rate per Platform (Avg Likes per Post) ──
  function renderEngagementRate(d) {
    const labels = d.platform_stats.map(p => p.platform).filter(p => p !== 'Threads');
    const values = d.platform_stats.filter(p => p.platform !== 'Threads').map(p => p.avg_likes);
    const colors = labels.map(l => PLATFORM_COLORS[l] || '#6366f1');
    makeChart('sm-engagement-rate', {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Avg Likes/Post', data: values, backgroundColor: colors, borderRadius: 8 }] },
      options: {
        ...gridOpts('Avg Likes'),
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y.toLocaleString('id-ID')} avg likes` } } }
      }
    });
  }

  // ── Likes per Platform ──
  function renderPlatformLikes(d) {
    const labels = d.platform_stats.map(p => p.platform).filter(p => p !== 'Threads');
    const values = d.platform_stats.filter(p => p.platform !== 'Threads').map(p => p.total_likes);
    const colors = labels.map(l => PLATFORM_COLORS[l] || '#6366f1');
    makeChart('sm-platform-likes', {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Total Likes', data: values, backgroundColor: colors, borderRadius: 8 }] },
      options: {
        ...gridOpts('Likes'),
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.parsed.y)} likes` } } }
      }
    });
  }

  // ── Views per Platform ──
  function renderPlatformViews(d) {
    const labels = d.platform_stats.map(p => p.platform).filter(p => p !== 'Threads' && p !== 'Twitter');
    const values = d.platform_stats.filter(p => p.platform !== 'Threads' && p.platform !== 'Twitter').map(p => p.total_views);
    const colors = labels.map(l => PLATFORM_COLORS[l] || '#6366f1');
    makeChart('sm-platform-views', {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Total Views', data: values, backgroundColor: colors, borderRadius: 8 }] },
      options: {
        ...gridOpts('Views'),
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.parsed.y)} views` } } }
      }
    });
  }

  // ── Post Sentiment Donut ──
  function renderPostSentimentDonut(d) {
    const s = d.posts_sentiment;
    const labels = Object.keys(s);
    const colors = labels.map(l => SENTIMENT_COLORS[l] || '#6366f1');
    makeChart('sm-post-sentiment-donut', {
      type: 'doughnut',
      data: { labels, datasets: [{ data: Object.values(s), backgroundColor: colors, borderWidth: 0 }] },
      options: donutOpts()
    });
  }

  // ── Comment Sentiment Donut ──
  function renderCommentSentimentDonut(d) {
    const s = d.comments_sentiment;
    const labels = Object.keys(s);
    const colors = labels.map(l => SENTIMENT_COLORS[l] || '#6366f1');
    makeChart('sm-comment-sentiment-donut', {
      type: 'doughnut',
      data: { labels, datasets: [{ data: Object.values(s), backgroundColor: colors, borderWidth: 0 }] },
      options: donutOpts()
    });
  }

  // ── NSS per keyword (horizontal bar) ──
  function renderNSSChart(d) {
    const sorted = Object.entries(d.keyword_nss).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(([k]) => k);
    const values = sorted.map(([, v]) => v);
    const colors = values.map(v => v >= 0 ? '#10b981' : '#ef4444');
    makeChart('sm-nss-chart', {
      type: 'bar',
      data: { labels, datasets: [{ label: 'NSS (%)', data: values, backgroundColor: colors, borderRadius: 4 }] },
      options: {
        indexAxis: 'y',
        ...gridOpts('NSS'),
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` NSS: ${ctx.parsed.x.toFixed(1)}%` } } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } }
        }
      }
    });
  }

  // ── Keyword Sentiment Stacked Bar ──
  function renderKeywordSentimentBar(d) {
    const keywords = Object.keys(d.keyword_sentiment);
    const sentiments = ['Positif', 'Netral', 'Negatif'];
    const datasets = sentiments.map(s => ({
      label: s,
      data: keywords.map(kw => d.keyword_sentiment[kw][s] || 0),
      backgroundColor: SENTIMENT_COLORS[s] + 'cc',
      borderColor: SENTIMENT_COLORS[s],
      borderWidth: 1,
      borderRadius: 4,
    }));
    makeChart('sm-keyword-sentiment-bar', {
      type: 'bar',
      data: { labels: keywords, datasets },
      options: {
        ...gridOpts('Jumlah Post'),
        scales: {
          x: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b', maxRotation: 30 } },
          y: { stacked: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } }
        }
      }
    });
  }

  // ── Keyword Volume ──
  function renderKeywordVolume(d) {
    const sorted = Object.entries(d.top_keywords_volume).sort((a, b) => b[1] - a[1]);
    const labels = sorted.map(([k]) => k);
    const values = sorted.map(([, v]) => v);
    makeChart('sm-keyword-volume', {
      type: 'bar',
      data: { labels, datasets: [{ label: 'Jumlah Post', data: values, backgroundColor: PALETTE, borderRadius: 4 }] },
      options: {
        indexAxis: 'y',
        ...gridOpts('Post'),
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.x.toLocaleString('id-ID')} posts` } } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } }
        }
      }
    });
  }

  // ── Keyword Likes ──
  function renderKeywordLikes(d) {
    const sorted = [...d.keyword_engagement].sort((a, b) => b.total_likes - a.total_likes);
    makeChart('sm-keyword-likes', {
      type: 'bar',
      data: {
        labels: sorted.map(k => k.keyword),
        datasets: [{ label: 'Total Likes', data: sorted.map(k => k.total_likes), backgroundColor: PALETTE, borderRadius: 4 }]
      },
      options: {
        indexAxis: 'y',
        ...gridOpts('Likes'),
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.parsed.x)} likes` } } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } }
        }
      }
    });
  }

  // ── Keyword Views ──
  function renderKeywordViews(d) {
    const sorted = [...d.keyword_engagement].sort((a, b) => b.total_views - a.total_views).filter(k => k.total_views > 0);
    makeChart('sm-keyword-views', {
      type: 'bar',
      data: {
        labels: sorted.map(k => k.keyword),
        datasets: [{ label: 'Total Views', data: sorted.map(k => k.total_views), backgroundColor: PALETTE, borderRadius: 4 }]
      },
      options: {
        indexAxis: 'y',
        ...gridOpts('Views'),
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${fmt(ctx.parsed.x)} views` } } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } }
        }
      }
    });
  }

  // ── Keyword Avg Likes ──
  function renderKeywordAvgLikes(d) {
    const sorted = [...d.keyword_engagement].sort((a, b) => b.avg_likes - a.avg_likes);
    makeChart('sm-keyword-avglikes', {
      type: 'bar',
      data: {
        labels: sorted.map(k => k.keyword),
        datasets: [{ label: 'Avg Likes/Post', data: sorted.map(k => k.avg_likes), backgroundColor: PALETTE, borderRadius: 4 }]
      },
      options: {
        indexAxis: 'y',
        ...gridOpts('Avg Likes'),
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#64748b' } },
          y: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8', font: { size: 10 } } }
        }
      }
    });
  }

  // ── Response Time Donut ──
  function renderResponseTimeDonut(d) {
    const rt = d.response_time;
    const labels = ['≤ 1 Jam', '1-6 Jam', '6-24 Jam', '> 24 Jam'];
    const values = [rt.within_1h, rt.within_6h, rt.within_24h, rt.over_24h];
    const colors = ['#10b981', '#06b6d4', '#f59e0b', '#ef4444'];
    makeChart('sm-response-time-donut', {
      type: 'doughnut',
      data: { labels, datasets: [{ data: values, backgroundColor: colors, borderWidth: 0 }] },
      options: {
        ...donutOpts(),
        plugins: {
          ...donutOpts().plugins,
          legend: { position: 'right', labels: { color: '#94a3b8', padding: 12 } }
        }
      }
    });
  }

  // ── Hourly Comments ──
  function renderHourlyComments(d) {
    const hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);
    const values = hours.map((_, i) => d.comments_by_hour[String(i)] || 0);
    const maxVal = Math.max(...values);
    const colors = values.map(v => {
      const intensity = v / maxVal;
      return `rgba(99, 102, 241, ${0.2 + intensity * 0.8})`;
    });
    makeChart('sm-hourly-comments', {
      type: 'bar',
      data: { labels: hours, datasets: [{ label: 'Jumlah Komentar', data: values, backgroundColor: colors, borderRadius: 4 }] },
      options: {
        ...gridOpts('Komentar'),
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => ` ${ctx.parsed.y} komentar` } } }
      }
    });
  }

  // ── Brand vs Public ──
  function renderBrandVsPublic(d) {
    const container = document.getElementById('sm-brand-vs-public');
    if (!container) return;
    const { brand_responses, public_comments } = d.brand_vs_public;
    const total = brand_responses + public_comments;
    const brandPct = ((brand_responses / total) * 100).toFixed(1);
    const publicPct = ((public_comments / total) * 100).toFixed(1);
    container.innerHTML = `
      <div style="text-align:center;">
        <div style="font-size:3rem; margin-bottom:0.5rem;">🏢</div>
        <div style="font-size:2rem; font-weight:700; color:#6366f1;">${brand_responses.toLocaleString('id-ID')}</div>
        <div style="color:#94a3b8; margin-top:0.25rem;">Brand Responses</div>
        <div style="font-size:1.1rem; color:#6366f1; margin-top:0.25rem;">${brandPct}%</div>
      </div>
      <div style="width:2px; height:80px; background:rgba(255,255,255,0.1);"></div>
      <div style="text-align:center;">
        <div style="font-size:3rem; margin-bottom:0.5rem;">👥</div>
        <div style="font-size:2rem; font-weight:700; color:#06b6d4;">${public_comments.toLocaleString('id-ID')}</div>
        <div style="color:#94a3b8; margin-top:0.25rem;">Public Comments</div>
        <div style="font-size:1.1rem; color:#06b6d4; margin-top:0.25rem;">${publicPct}%</div>
      </div>
      <div style="width:2px; height:80px; background:rgba(255,255,255,0.1);"></div>
      <div style="text-align:center;">
        <div style="font-size:3rem; margin-bottom:0.5rem;">⏱️</div>
        <div style="font-size:2rem; font-weight:700; color:#f59e0b;">${(d.response_time.avg_minutes / 60).toFixed(1)} jam</div>
        <div style="color:#94a3b8; margin-top:0.25rem;">Avg. Response Time</div>
        <div style="font-size:1.1rem; color:#f59e0b; margin-top:0.25rem;">${d.response_time.total_with_rt.toLocaleString('id-ID')} data points</div>
      </div>
    `;
  }

  // ── Viral Posts Table ──
  function renderViralTable(d) {
    const tbody = document.getElementById('sm-viral-tbody');
    if (!tbody) return;
    const sentimentBadge = (s) => {
      const map = { 'Positif': ['#10b981', '😊'], 'Negatif': ['#ef4444', '😡'], 'Netral': ['#6366f1', '😐'] };
      const [color, icon] = map[s] || ['#64748b', '❓'];
      return `<span style="background:${color}22; color:${color}; padding:0.2rem 0.6rem; border-radius:99px; font-size:0.8rem;">${icon} ${s}</span>`;
    };
    const platformIcon = (p) => ({ Twitter: '🐦', Instagram: '📸', Youtube: '▶️', Tiktok: '🎵', Threads: '🧵' }[p] || '📱');
    tbody.innerHTML = d.top_viral_posts.map((p, i) => `
      <tr style="border-bottom:1px solid rgba(255,255,255,0.05); ${i % 2 === 0 ? '' : 'background:rgba(255,255,255,0.02);'}">
        <td style="padding:0.8rem 1rem; color:#64748b; font-weight:700;">${i + 1}</td>
        <td style="padding:0.8rem 1rem; color:${PLATFORM_COLORS[p.platform] || '#fff'};">${platformIcon(p.platform)} ${p.platform}</td>
        <td style="padding:0.8rem 1rem; color:#e2e8f0; max-width:280px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${p.title}">${p.title || '—'}</td>
        <td style="padding:0.8rem 1rem; text-align:right; color:#10b981; font-weight:600;">${fmt(p.likes)}</td>
        <td style="padding:0.8rem 1rem; text-align:right; color:#06b6d4; font-weight:600;">${fmt(p.views)}</td>
        <td style="padding:0.8rem 1rem; text-align:right; color:#f59e0b;">${fmt(p.replies)}</td>
        <td style="padding:0.8rem 1rem;">${sentimentBadge(p.sentiment)}</td>
        <td style="padding:0.8rem 1rem; color:#64748b; white-space:nowrap;">${p.date || ''}</td>
      </tr>
    `).join('');
  }

  // ── Auto Insights ──
  function renderInsights(d) {
    const container = document.getElementById('sm-insights-container');
    if (!container) return;

    const typeStyles = {
      success: 'border-left: 4px solid #10b981; background: rgba(16,185,129,0.08);',
      warning: 'border-left: 4px solid #f59e0b; background: rgba(245,158,11,0.08);',
      danger:  'border-left: 4px solid #ef4444; background: rgba(239,68,68,0.08);',
      info:    'border-left: 4px solid #3b82f6; background: rgba(59,130,246,0.08);',
    };

    const insights = [];

    // TikTok dominance in engagement
    const tiktok = d.platform_stats.find(p => p.platform === 'Tiktok');
    const instagram = d.platform_stats.find(p => p.platform === 'Instagram');
    if (tiktok && instagram) {
      insights.push({
        icon: '🎵', type: 'success',
        title: 'TikTok adalah Mesin Engagement Terkuat',
        body: `Meskipun hanya memiliki <strong>${fmt(tiktok.post_count)}</strong> post (1/3 dari Instagram), TikTok menghasilkan <strong>avg. ${fmt(tiktok.avg_likes)} likes/post</strong> vs Instagram <strong>${fmt(instagram.avg_likes)} likes/post</strong> — 3x lebih efektif. Total views TikTok mencapai <strong>${fmt(tiktok.total_views)}</strong>.`
      });
    }

    // Negatif spike detection
    const months = Object.entries(d.monthly_sentiment_trend).sort((a, b) => a[0].localeCompare(b[0]));
    let maxNegMonth = '', maxNeg = 0;
    months.forEach(([m, s]) => { if (s.Negatif > maxNeg) { maxNeg = s.Negatif; maxNegMonth = m; } });
    if (maxNegMonth) {
      insights.push({
        icon: '⚠️', type: 'warning',
        title: `Puncak Sentimen Negatif: ${maxNegMonth}`,
        body: `Bulan <strong>${maxNegMonth}</strong> mencatat sentimen negatif tertinggi dengan <strong>${maxNeg.toLocaleString('id-ID')} post</strong>. Perlu investigasi event atau isu spesifik pada periode tersebut untuk memahami pemicunya.`
      });
    }

    // Top keyword by engagement per post
    const bestKeyword = [...d.keyword_engagement].sort((a, b) => b.avg_likes - a.avg_likes)[0];
    if (bestKeyword) {
      insights.push({
        icon: '🏆', type: 'success',
        title: `Keyword Paling Viral per Post: "${bestKeyword.keyword}"`,
        body: `Setiap post bertopik <strong>"${bestKeyword.keyword}"</strong> rata-rata mendapat <strong>${fmt(bestKeyword.avg_likes)} likes</strong> dan <strong>${fmt(bestKeyword.avg_views)} views</strong> — jauh melampaui rata-rata keseluruhan. Topik ini sangat resonan dengan audiens.`
      });
    }

    // Response time concern
    const rt = d.response_time;
    const within1hPct = ((rt.within_1h / rt.total_with_rt) * 100).toFixed(1);
    if (rt.avg_minutes > 240) {
      insights.push({
        icon: '🔴', type: 'danger',
        title: 'Response Time Brand Perlu Ditingkatkan',
        body: `Rata-rata waktu respons brand adalah <strong>${(rt.avg_minutes / 60).toFixed(1)} jam</strong>. Hanya <strong>${within1hPct}%</strong> komentar yang dibalas dalam 1 jam pertama. Target ideal adalah ≤ 1 jam untuk menjaga engagement dan kepuasan pelanggan.`
      });
    }

    // Sentiment positive trend
    const last3 = months.slice(-3);
    const avgPos = last3.reduce((a, [, s]) => a + s.Positif, 0) / last3.length;
    const first3 = months.slice(0, 3);
    const avgPosFirst = first3.reduce((a, [, s]) => a + s.Positif, 0) / first3.length;
    if (avgPos > avgPosFirst * 1.2) {
      insights.push({
        icon: '📈', type: 'success',
        title: 'Tren Sentimen Positif Meningkat',
        body: `Rata-rata post bersentimen positif meningkat dari <strong>${Math.round(avgPosFirst)}</strong>/bulan (awal periode) menjadi <strong>${Math.round(avgPos)}</strong>/bulan (3 bulan terakhir). Ini menunjukkan perbaikan persepsi publik terhadap brand InJourney Group.`
      });
    }

    // Twitter: high volume low engagement
    const twitter = d.platform_stats.find(p => p.platform === 'Twitter');
    if (twitter && tiktok && twitter.avg_likes < tiktok.avg_likes / 20) {
      insights.push({
        icon: '🐦', type: 'info',
        title: 'Twitter: Volume Tinggi, Engagement Rendah',
        body: `Twitter memiliki <strong>${fmt(twitter.post_count)}</strong> post (paling banyak) namun dengan rata-rata hanya <strong>${fmt(twitter.avg_likes)} likes/post</strong>. Pertimbangkan untuk mengalihkan fokus konten ke platform dengan engagement lebih tinggi seperti TikTok dan Instagram.`
      });
    }

    container.innerHTML = insights.map(ins => `
      <div style="padding:1rem 1.25rem; border-radius:12px; margin-bottom:1rem; ${typeStyles[ins.type]}">
        <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.5rem;">
          <span style="font-size:1.3rem;">${ins.icon}</span>
          <strong style="color:#f1f5f9;">${ins.title}</strong>
        </div>
        <p style="color:#94a3b8; margin:0; line-height:1.6;">${ins.body}</p>
      </div>
    `).join('');
  }

  // ── MAIN RENDER ──
  window.renderSocmedCharts = function () {
    fetch('data/socmed_data.json')
      .then(r => r.json())
      .then(d => {
        renderKPIs(d);
        renderSentimentTrend(d);
        renderPlatformTrend(d);
        renderPlatformDonut(d);
        renderEngagementRate(d);
        renderPlatformLikes(d);
        renderPlatformViews(d);
        renderPostSentimentDonut(d);
        renderCommentSentimentDonut(d);
        renderNSSChart(d);
        renderKeywordSentimentBar(d);
        renderKeywordVolume(d);
        renderKeywordLikes(d);
        renderKeywordViews(d);
        renderKeywordAvgLikes(d);
        renderResponseTimeDonut(d);
        renderHourlyComments(d);
        renderBrandVsPublic(d);
        renderViralTable(d);
        renderInsights(d);
      })
      .catch(err => console.error('Failed to load socmed_data.json:', err));
  };

})();
