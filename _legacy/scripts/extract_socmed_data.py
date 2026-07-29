#!/usr/bin/env python3
"""
Deep analysis extractor for socmed_posts and socmed_comments
Connects to MySQL and outputs comprehensive JSON for dashboard, including Business Unit filters.
"""

import pymysql
import json
import os
from datetime import datetime
from decimal import Decimal

DB_CONFIG = {
    'host': '35.219.73.251',
    'user': 'dash_admin_pri',
    'password': '#1N4xn1JplqjEo09',
    'database': 'dash_prod_pri',
    'port': 3306,
    'cursorclass': pymysql.cursors.DictCursor
}

TONE_MAP = {1: 'Netral', 2: 'Positif', 3: 'Negatif'}
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'socmed_data.json')

BU_KEYWORD_MAP = {
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
}

BU_USERNAME_MAP = {
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
}

def serial(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, datetime):
        return obj.strftime('%Y-%m-%d %H:%M:%S')
    return str(obj)

def run():
    conn = pymysql.connect(**DB_CONFIG)
    
    with conn.cursor() as cur:
        print("Fetching posts data from database...")
        cur.execute("""
            SELECT 
                keyword_name, 
                category_name as platform, 
                tone_name as sentiment, 
                DATE_FORMAT(published_date,'%Y-%m') as month,
                title, like_count, view_count, reply_count, retweet_count,
                DATE_FORMAT(published_date, '%Y-%m-%d') as pub_date
            FROM socmed_posts 
            WHERE keyword_name IS NOT NULL
        """)
        all_posts = cur.fetchall()
        
        print("Fetching comments data from database...")
        cur.execute("""
            SELECT 
                company_socmed_username, 
                tone_id, 
                response_time_in_minute, 
                is_admin, 
                DATE_FORMAT(published_at,'%Y-%m') as month, 
                HOUR(published_at) as hr
            FROM socmed_comments
        """)
        all_comments = cur.fetchall()

    conn.close()
    print("Processing data...")
    
    bu_list = list(set(BU_KEYWORD_MAP.values()))
    
    out_data = {
        "global": process_subset(all_posts, all_comments, None),
        "bu_data": {}
    }
    
    for bu in bu_list:
        out_data["bu_data"][bu] = process_subset(all_posts, all_comments, bu)

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(out_data, f, indent=2, ensure_ascii=False, default=serial)

    print(f"✅ Saved to {OUTPUT_FILE}")


def process_subset(all_posts, all_comments, target_bu):
    # Filter posts and comments
    if target_bu is None:
        posts = all_posts
        comments = all_comments
    else:
        posts = [p for p in all_posts if BU_KEYWORD_MAP.get(p['keyword_name']) == target_bu]
        comments = [c for c in all_comments if BU_USERNAME_MAP.get(c['company_socmed_username']) == target_bu]
        
    data = {}
    data['total_posts'] = len(posts)
    data['total_comments'] = len(comments)
    data['total_likes'] = sum(p['like_count'] or 0 for p in posts)
    data['total_views'] = sum(p['view_count'] or 0 for p in posts)
    data['total_replies'] = sum(p['reply_count'] or 0 for p in posts)
    
    # Platform stats
    p_stats = {}
    for p in posts:
        plat = p['platform']
        if not plat: continue
        if plat not in p_stats:
            p_stats[plat] = {'post_count':0, 'likes':0, 'views':0, 'replies':0, 'retweet':0}
        p_stats[plat]['post_count'] += 1
        p_stats[plat]['likes'] += (p['like_count'] or 0)
        p_stats[plat]['views'] += (p['view_count'] or 0)
        p_stats[plat]['replies'] += (p['reply_count'] or 0)
        p_stats[plat]['retweet'] += (p['retweet_count'] or 0)
        
    data['platform_stats'] = []
    for plat, s in p_stats.items():
        data['platform_stats'].append({
            'platform': plat,
            'post_count': s['post_count'],
            'total_likes': float(s['likes']),
            'total_views': float(s['views']),
            'total_replies': float(s['replies']),
            'total_retweet': float(s['retweet']),
            'avg_likes': round(s['likes'] / s['post_count'], 1) if s['post_count'] else 0,
            'avg_views': round(s['views'] / s['post_count'], 0) if s['post_count'] else 0,
        })
    data['platform_stats'].sort(key=lambda x: x['post_count'], reverse=True)
    
    data['platform_engagement_rate'] = {
        p['platform']: round((p['total_likes'] + p['total_replies']) / max(p['post_count'], 1), 1)
        for p in data['platform_stats']
    }
    
    # Post sentiment
    sent_dict = {}
    for p in posts:
        s = p['sentiment']
        if not s: continue
        sent_dict[s] = sent_dict.get(s, 0) + 1
    data['posts_sentiment'] = sent_dict
    
    # Comment metrics
    c_sent = {}
    rt_1h, rt_6h, rt_24h, rt_over, rt_sum, rt_count = 0, 0, 0, 0, 0, 0
    hr_dict = {str(h): 0 for h in range(24)}
    admin_count, public_count = 0, 0
    cmt_trend = {}
    
    for c in comments:
        # Sentiment
        tone = TONE_MAP.get(c['tone_id'], 'Unknown')
        c_sent[tone] = c_sent.get(tone, 0) + 1
        
        # Response time
        rt = c['response_time_in_minute']
        if rt is not None and rt > 0:
            rt_sum += rt
            rt_count += 1
            if rt <= 60: rt_1h += 1
            elif rt <= 360: rt_6h += 1
            elif rt <= 1440: rt_24h += 1
            else: rt_over += 1
            
        # Hourly
        if c['hr'] is not None:
            hr_str = str(c['hr'])
            hr_dict[hr_str] += 1
            
        # Admin vs Public
        if c['is_admin'] == 1: admin_count += 1
        else: public_count += 1
        
        # Monthly sentiment
        m = c['month']
        if m:
            if m not in cmt_trend:
                cmt_trend[m] = {'Netral': 0, 'Positif': 0, 'Negatif': 0}
            if tone in cmt_trend[m]:
                cmt_trend[m][tone] += 1

    data['comments_sentiment'] = c_sent
    data['avg_response_time_minutes'] = (rt_sum / rt_count) if rt_count else 0
    data['response_time'] = {
        'within_1h': rt_1h,
        'within_6h': rt_6h,
        'within_24h': rt_24h,
        'over_24h': rt_over,
        'avg_minutes': data['avg_response_time_minutes'],
        'total_with_rt': rt_count,
    }
    data['comments_by_hour'] = hr_dict
    data['brand_vs_public'] = {'brand_responses': admin_count, 'public_comments': public_count}
    data['monthly_comment_sentiment'] = cmt_trend

    # Monthly post trend
    months = sorted(list(set(p['month'] for p in all_posts if p['month'] and p['month'] >= '2025-01')))
    m_sent = {m: {'Positif': 0, 'Netral': 0, 'Negatif': 0} for m in months}
    m_plat = {m: {pl: 0 for pl in ['Twitter', 'Instagram', 'Youtube', 'Tiktok', 'Threads']} for m in months}
    
    for p in posts:
        m = p['month']
        if not m or m < '2025-01': continue
        if p['sentiment'] in m_sent[m]:
            m_sent[m][p['sentiment']] += 1
        if p['platform'] in m_plat[m]:
            m_plat[m][p['platform']] += 1
            
    data['monthly_sentiment_trend'] = m_sent
    data['monthly_platform_trend'] = m_plat
    
    # Keyword stats
    k_stats = {}
    for p in posts:
        kw = p['keyword_name']
        if not kw: continue
        if kw not in k_stats:
            k_stats[kw] = {'count':0, 'likes':0, 'views':0, 'replies':0, 'Positif':0, 'Netral':0, 'Negatif':0}
        k_stats[kw]['count'] += 1
        k_stats[kw]['likes'] += (p['like_count'] or 0)
        k_stats[kw]['views'] += (p['view_count'] or 0)
        k_stats[kw]['replies'] += (p['reply_count'] or 0)
        s = p['sentiment']
        if s in k_stats[kw]:
            k_stats[kw][s] += 1
            
    kw_eng = []
    for kw, s in k_stats.items():
        kw_eng.append({
            'keyword': kw,
            'post_count': s['count'],
            'total_likes': float(s['likes']),
            'total_views': float(s['views']),
            'total_comments': float(s['replies']),
            'avg_likes': round(s['likes'] / s['count'], 1) if s['count'] else 0,
            'avg_views': round(s['views'] / s['count'], 0) if s['count'] else 0,
        })
    kw_eng.sort(key=lambda x: x['total_likes'], reverse=True)
    data['keyword_engagement'] = kw_eng[:15]
    
    kw_vol = {kw: s['count'] for kw, s in k_stats.items()}
    data['top_keywords_volume'] = dict(sorted(kw_vol.items(), key=lambda x: x[1], reverse=True)[:15])
    
    data['keyword_sentiment'] = {kw: {'Positif': s['Positif'], 'Netral': s['Netral'], 'Negatif': s['Negatif']} for kw, s in k_stats.items()}
    
    nss = {}
    for kw, sent in data['keyword_sentiment'].items():
        total = sent['Positif'] + sent['Netral'] + sent['Negatif']
        nss[kw] = round((sent['Positif'] - sent['Negatif']) / max(total, 1) * 100, 1) if total else 0
    data['keyword_nss'] = nss
    
    # Viral posts
    v_posts = sorted(posts, key=lambda x: (x['like_count'] or 0) + (x['view_count'] or 0)/1000, reverse=True)[:10]
    data['top_viral_posts'] = [{
        'platform': r['platform'],
        'title': (r['title'] or '')[:80],
        'likes': r['like_count'] or 0,
        'views': r['view_count'] or 0,
        'replies': r['reply_count'] or 0,
        'sentiment': r['sentiment'],
        'date': r['pub_date'],
    } for r in v_posts]

    return data

if __name__ == '__main__':
    run()
