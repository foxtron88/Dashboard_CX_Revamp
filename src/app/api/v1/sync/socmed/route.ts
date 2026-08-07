import { NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import mysql from 'mysql2/promise';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const BU_KEYWORD_MAP: Record<string, string> = {
  'TMII': 'IDM - TMII',
  'bandara': 'API',
  'Sarinah': 'Sarinah',
  'Borobudur': 'IDM - TWC',
  'Mandalika': 'ITDC',
  'InJourney': 'InJourney',
  'Angkasa Pura': 'API',
  'ITDC': 'ITDC',
  'KEK Sanur': 'ITDC',
  'bagasi bandara': 'API',
  'MGPA Mandalika': 'ITDC',
  'Taman Wisata Candi': 'IDM - TWC',
  'InJourney Hospitality': 'HIN',
  'Injourney Aviation Services': 'IAS',
  'Hotel Indonesia Natour': 'HIN',
  'Aquabike dan F1 Powerboat': 'ITDC',
  'cleaning bandara': 'API',
  'Pocari Sweat Run Lombok 2025': 'ITDC',
  'Joumpa': 'IAS',
  'Jumbo di Prambanan': 'IDM - TWC'
};

const BU_USERNAME_MAP: Record<string, string> = {
  'themandalikagp': 'ITDC',
  'injourney.id': 'InJourney',
  'injourneyaviationservices': 'IAS',
  'borobudurpark': 'IDM - TWC',
  'prambananpark': 'IDM - TWC',
  'tmiiofficial': 'IDM - TMII',
  'injourneyairports': 'API',
  'sarinahindonesia': 'Sarinah',
  'soekarnohattaairport': 'API',
  'baliairport': 'API',
  'themerusanur': 'HIN',
  'balibeachsanur': 'HIN',
  'ptsarinah.id': 'Sarinah'
};

const TONE_MAP: Record<number, string> = { 1: 'Netral', 2: 'Positif', 3: 'Negatif' };

function processSubset(allPosts: any[], allComments: any[], targetBu: string | null) {
  const posts = targetBu ? allPosts.filter(p => BU_KEYWORD_MAP[p.keyword_name] === targetBu) : allPosts;
  const comments = targetBu ? allComments.filter(c => BU_USERNAME_MAP[c.company_socmed_username] === targetBu) : allComments;

  const total_posts = posts.length;
  const total_comments = comments.length;
  const total_likes = posts.reduce((sum, p) => sum + (p.like_count || 0), 0);
  const total_views = posts.reduce((sum, p) => sum + (p.view_count || 0), 0);
  const total_replies = posts.reduce((sum, p) => sum + (p.reply_count || 0), 0);

  const p_stats: Record<string, any> = {};
  for (const p of posts) {
    const plat = p.platform;
    if (!plat) continue;
    if (!p_stats[plat]) p_stats[plat] = { post_count: 0, likes: 0, views: 0, replies: 0, retweet: 0 };
    p_stats[plat].post_count++;
    p_stats[plat].likes += (p.like_count || 0);
    p_stats[plat].views += (p.view_count || 0);
    p_stats[plat].replies += (p.reply_count || 0);
    p_stats[plat].retweet += (p.retweet_count || 0);
  }

  const platform_stats = Object.entries(p_stats).map(([plat, s]) => ({
    platform: plat,
    post_count: s.post_count,
    total_likes: s.likes,
    total_views: s.views,
    total_replies: s.replies,
    total_retweet: s.retweet,
    avg_likes: s.post_count ? Number((s.likes / s.post_count).toFixed(1)) : 0,
    avg_views: s.post_count ? Number((s.views / s.post_count).toFixed(0)) : 0,
  })).sort((a, b) => b.post_count - a.post_count);

  const platform_engagement_rate: Record<string, number> = {};
  for (const p of platform_stats) {
    platform_engagement_rate[p.platform] = Number(((p.total_likes + p.total_replies) / Math.max(p.post_count, 1)).toFixed(1));
  }

  const posts_sentiment: Record<string, number> = {};
  for (const p of posts) {
    if (!p.sentiment) continue;
    posts_sentiment[p.sentiment] = (posts_sentiment[p.sentiment] || 0) + 1;
  }

  const c_sent: Record<string, number> = {};
  let rt_1h = 0, rt_6h = 0, rt_24h = 0, rt_over = 0, rt_sum = 0, rt_count = 0;
  const hr_dict: Record<string, number> = {};
  for (let i = 0; i < 24; i++) hr_dict[i.toString()] = 0;
  let admin_count = 0, public_count = 0;
  const cmt_trend: Record<string, Record<string, number>> = {};

  for (const c of comments) {
    const tone = TONE_MAP[c.tone_id] || 'Unknown';
    c_sent[tone] = (c_sent[tone] || 0) + 1;

    const rt = c.response_time_in_minute;
    if (rt !== null && rt > 0) {
      rt_sum += rt;
      rt_count++;
      if (rt <= 60) rt_1h++;
      else if (rt <= 360) rt_6h++;
      else if (rt <= 1440) rt_24h++;
      else rt_over++;
    }

    if (c.hr !== null) hr_dict[c.hr.toString()]++;

    if (c.is_admin === 1) admin_count++;
    else public_count++;

    const m = c.month;
    if (m) {
      if (!cmt_trend[m]) cmt_trend[m] = { Netral: 0, Positif: 0, Negatif: 0 };
      if (cmt_trend[m][tone] !== undefined) cmt_trend[m][tone]++;
    }
  }

  const avg_response_time_minutes = rt_count ? (rt_sum / rt_count) : 0;
  const response_time = {
    within_1h: rt_1h,
    within_6h: rt_6h,
    within_24h: rt_24h,
    over_24h: rt_over,
    avg_minutes: avg_response_time_minutes,
    total_with_rt: rt_count
  };

  const months = Array.from(new Set(allPosts.map(p => p.month).filter(m => m && m >= '2025-01'))).sort();
  const m_sent: Record<string, any> = {};
  const m_plat: Record<string, any> = {};
  for (const m of months) {
    m_sent[m] = { Positif: 0, Netral: 0, Negatif: 0 };
    m_plat[m] = { Twitter: 0, Instagram: 0, Youtube: 0, Tiktok: 0, Threads: 0 };
  }

  for (const p of posts) {
    const m = p.month;
    if (!m || m < '2025-01') continue;
    if (m_sent[m][p.sentiment] !== undefined) m_sent[m][p.sentiment]++;
    if (m_plat[m][p.platform] !== undefined) m_plat[m][p.platform]++;
  }

  const k_stats: Record<string, any> = {};
  for (const p of posts) {
    const kw = p.keyword_name;
    if (!kw) continue;
    if (!k_stats[kw]) k_stats[kw] = { count: 0, likes: 0, views: 0, replies: 0, Positif: 0, Netral: 0, Negatif: 0 };
    k_stats[kw].count++;
    k_stats[kw].likes += (p.like_count || 0);
    k_stats[kw].views += (p.view_count || 0);
    k_stats[kw].replies += (p.reply_count || 0);
    if (k_stats[kw][p.sentiment] !== undefined) k_stats[kw][p.sentiment]++;
  }

  const kw_eng = Object.entries(k_stats).map(([kw, s]) => ({
    keyword: kw,
    post_count: s.count,
    total_likes: s.likes,
    total_views: s.views,
    total_comments: s.replies,
    avg_likes: s.count ? Number((s.likes / s.count).toFixed(1)) : 0,
    avg_views: s.count ? Number((s.views / s.count).toFixed(0)) : 0,
  })).sort((a, b) => b.total_likes - a.total_likes).slice(0, 15);

  const top_keywords_volume = Object.fromEntries(
    Object.entries(k_stats).map(([kw, s]) => [kw, s.count]).sort((a, b) => (b[1] as number) - (a[1] as number)).slice(0, 15)
  );

  const keyword_sentiment: Record<string, any> = {};
  for (const [kw, s] of Object.entries(k_stats)) {
    keyword_sentiment[kw] = { Positif: s.Positif, Netral: s.Netral, Negatif: s.Negatif };
  }

  const keyword_nss: Record<string, number> = {};
  for (const [kw, sent] of Object.entries(keyword_sentiment)) {
    const total = sent.Positif + sent.Netral + sent.Negatif;
    keyword_nss[kw] = total ? Number((((sent.Positif - sent.Negatif) / Math.max(total, 1)) * 100).toFixed(1)) : 0;
  }

  const top_viral_posts = [...posts]
    .sort((a, b) => ((b.like_count || 0) + (b.view_count || 0) / 1000) - ((a.like_count || 0) + (a.view_count || 0) / 1000))
    .slice(0, 10)
    .map(r => ({
      platform: r.platform,
      title: r.title ? r.title.substring(0, 80) : '',
      likes: r.like_count || 0,
      views: r.view_count || 0,
      replies: r.reply_count || 0,
      sentiment: r.sentiment,
      date: r.pub_date,
    }));

  return {
    total_posts, total_comments, total_likes, total_views, total_replies,
    platform_stats, platform_engagement_rate, posts_sentiment, comments_sentiment: c_sent,
    avg_response_time_minutes, response_time, comments_by_hour: hr_dict,
    brand_vs_public: { brand_responses: admin_count, public_comments: public_count },
    monthly_comment_sentiment: cmt_trend,
    monthly_sentiment_trend: m_sent,
    monthly_platform_trend: m_plat,
    keyword_engagement: kw_eng,
    top_keywords_volume, keyword_sentiment, keyword_nss, top_viral_posts
  };
}

export async function POST() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: '35.219.73.251',
      user: 'dash_admin_pri',
      password: '#1N4xn1JplqjEo09',
      database: 'dash_prod_pri',
      port: 3306
    });

    const [posts] = await connection.execute(`
      SELECT 
        keyword_name, 
        category_name as platform, 
        tone_name as sentiment, 
        DATE_FORMAT(published_date,'%Y-%m') as month,
        title, like_count, view_count, reply_count, retweet_count,
        DATE_FORMAT(published_date, '%Y-%m-%d') as pub_date
      FROM socmed_posts 
      WHERE keyword_name IS NOT NULL
    `);

    const [comments] = await connection.execute(`
      SELECT 
        company_socmed_username, 
        tone_id, 
        response_time_in_minute, 
        is_admin, 
        DATE_FORMAT(published_at,'%Y-%m') as month, 
        HOUR(published_at) as hr
      FROM socmed_comments
    `);

    const bu_list = Array.from(new Set(Object.values(BU_KEYWORD_MAP)));
    const out_data: any = {
      global: processSubset(posts as any[], comments as any[], null),
      bu_data: {}
    };

    for (const bu of bu_list) {
      out_data.bu_data[bu] = processSubset(posts as any[], comments as any[], bu);
    }

    const outputFilePath = path.join(process.cwd(), 'public', 'data', 'socmed_data.json');
    await fs.writeFile(outputFilePath, JSON.stringify(out_data, null, 2), 'utf-8');

    // Write status
    const statusFilePath = path.join(process.cwd(), 'public', 'data', 'socmed_sync_status.json');
    const status = {
      last_pull: new Date().toISOString(),
      status: 'success',
      error: null
    };
    await fs.writeFile(statusFilePath, JSON.stringify(status, null, 2), 'utf-8');

    // Invalidate Vercel Edge cache so next request returns fresh socmed data
    revalidateTag('socmed-data');

    return NextResponse.json({ success: true, timestamp: status.last_pull });

  } catch (error: any) {
    console.error('Socmed sync error:', error);
    
    try {
      const statusFilePath = path.join(process.cwd(), 'public', 'data', 'socmed_sync_status.json');
      const status = {
        last_pull: new Date().toISOString(),
        status: 'failed',
        error: error.message
      };
      await fs.writeFile(statusFilePath, JSON.stringify(status, null, 2), 'utf-8');
    } catch (e) {}

    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}
