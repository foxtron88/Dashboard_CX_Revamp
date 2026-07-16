#!/usr/bin/env python3
"""
Deep analysis extractor for socmed_posts and socmed_comments
Connects to MySQL and outputs comprehensive JSON for dashboard.
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


def serial(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, datetime):
        return obj.strftime('%Y-%m-%d %H:%M:%S')
    return str(obj)


def run():
    conn = pymysql.connect(**DB_CONFIG)
    data = {}

    with conn.cursor() as cur:

        # ── 1. KPI Summary ──
        cur.execute("SELECT COUNT(*) as c FROM socmed_posts")
        data['total_posts'] = cur.fetchone()['c']

        cur.execute("SELECT COUNT(*) as c FROM socmed_comments")
        data['total_comments'] = cur.fetchone()['c']

        cur.execute("SELECT SUM(like_count) as s FROM socmed_posts")
        data['total_likes'] = float(cur.fetchone()['s'] or 0)

        cur.execute("SELECT SUM(view_count) as s FROM socmed_posts")
        data['total_views'] = float(cur.fetchone()['s'] or 0)

        cur.execute("SELECT SUM(reply_count) as s FROM socmed_posts")
        data['total_replies'] = float(cur.fetchone()['s'] or 0)

        cur.execute("""SELECT AVG(response_time_in_minute) as a FROM socmed_comments
            WHERE response_time_in_minute IS NOT NULL AND response_time_in_minute > 0""")
        data['avg_response_time_minutes'] = float(cur.fetchone()['a'] or 0)

        # ── 2. Platform Distribution (Posts) ──
        cur.execute("""SELECT category_name, COUNT(*) as post_count,
            COALESCE(SUM(like_count),0) as total_likes,
            COALESCE(SUM(view_count),0) as total_views,
            COALESCE(SUM(reply_count),0) as total_replies,
            COALESCE(SUM(retweet_count),0) as total_retweet,
            COALESCE(AVG(like_count),0) as avg_likes,
            COALESCE(AVG(view_count),0) as avg_views
            FROM socmed_posts WHERE category_name IS NOT NULL
            GROUP BY category_name ORDER BY post_count DESC""")
        data['platform_stats'] = [{
            'platform': r['category_name'],
            'post_count': r['post_count'],
            'total_likes': float(r['total_likes']),
            'total_views': float(r['total_views']),
            'total_replies': float(r['total_replies']),
            'total_retweet': float(r['total_retweet']),
            'avg_likes': round(float(r['avg_likes']), 1),
            'avg_views': round(float(r['avg_views']), 0),
        } for r in cur.fetchall()]

        # ── 3. Posts Sentiment Breakdown ──
        cur.execute("""SELECT tone_name, COUNT(*) as c FROM socmed_posts
            WHERE tone_name IS NOT NULL GROUP BY tone_name""")
        data['posts_sentiment'] = {r['tone_name']: r['c'] for r in cur.fetchall()}

        # ── 4. Comments Sentiment Breakdown ──
        cur.execute("SELECT tone_id, COUNT(*) as c FROM socmed_comments GROUP BY tone_id")
        data['comments_sentiment'] = {TONE_MAP.get(r['tone_id'], 'Unknown'): r['c'] for r in cur.fetchall()}

        # ── 5. Monthly Trend (Posts) by Sentiment ──
        cur.execute("""SELECT DATE_FORMAT(published_date,'%Y-%m') as month, tone_name, COUNT(*) as c
            FROM socmed_posts WHERE published_date >= '2025-01-01' AND tone_name IS NOT NULL
            GROUP BY month, tone_name ORDER BY month""")
        rows = cur.fetchall()
        months_set = sorted(set(r['month'] for r in rows))
        sentiment_trend = {m: {'Positif': 0, 'Netral': 0, 'Negatif': 0} for m in months_set}
        for r in rows:
            if r['tone_name'] in sentiment_trend[r['month']]:
                sentiment_trend[r['month']][r['tone_name']] = r['c']
        data['monthly_sentiment_trend'] = sentiment_trend

        # ── 6. Monthly Post Volume by Platform ──
        cur.execute("""SELECT DATE_FORMAT(published_date,'%Y-%m') as month, category_name, COUNT(*) as c
            FROM socmed_posts WHERE published_date >= '2025-01-01' AND category_name IS NOT NULL
            GROUP BY month, category_name ORDER BY month""")
        rows = cur.fetchall()
        platforms = ['Twitter', 'Instagram', 'Youtube', 'Tiktok', 'Threads']
        platform_trend = {m: {p: 0 for p in platforms} for m in months_set}
        for r in rows:
            if r['month'] in platform_trend and r['category_name'] in platform_trend[r['month']]:
                platform_trend[r['month']][r['category_name']] = r['c']
        data['monthly_platform_trend'] = platform_trend

        # ── 7. Top Keywords with Engagement ──
        cur.execute("""SELECT keyword_name, COUNT(*) as post_count,
            COALESCE(SUM(like_count),0) as total_likes,
            COALESCE(SUM(view_count),0) as total_views,
            COALESCE(SUM(reply_count),0) as total_comments,
            COALESCE(AVG(like_count),0) as avg_likes,
            COALESCE(AVG(view_count),0) as avg_views
            FROM socmed_posts WHERE keyword_name IS NOT NULL
            GROUP BY keyword_name ORDER BY total_likes DESC LIMIT 15""")
        data['keyword_engagement'] = [{
            'keyword': r['keyword_name'],
            'post_count': r['post_count'],
            'total_likes': float(r['total_likes']),
            'total_views': float(r['total_views']),
            'total_comments': float(r['total_comments']),
            'avg_likes': round(float(r['avg_likes']), 1),
            'avg_views': round(float(r['avg_views']), 0),
        } for r in cur.fetchall()]

        # ── 8. Top Keywords by Post Volume ──
        cur.execute("""SELECT keyword_name, COUNT(*) as c FROM socmed_posts
            WHERE keyword_name IS NOT NULL GROUP BY keyword_name ORDER BY c DESC LIMIT 15""")
        data['top_keywords_volume'] = {r['keyword_name']: r['c'] for r in cur.fetchall()}

        # ── 9. Sentiment by Keyword (top 10) ──
        cur.execute("""SELECT keyword_name, tone_name, COUNT(*) as c FROM socmed_posts
            WHERE keyword_name IS NOT NULL AND tone_name IS NOT NULL
            AND keyword_name IN ('TMII','bandara','Sarinah','Borobudur','Mandalika','InJourney','Angkasa Pura','ITDC','KEK Sanur','bagasi bandara')
            GROUP BY keyword_name, tone_name""")
        rows = cur.fetchall()
        kw_sentiment = {}
        for r in rows:
            kw = r['keyword_name']
            if kw not in kw_sentiment:
                kw_sentiment[kw] = {'Positif': 0, 'Netral': 0, 'Negatif': 0}
            kw_sentiment[kw][r['tone_name']] = r['c']
        data['keyword_sentiment'] = kw_sentiment

        # ── 10. Top Viral Posts ──
        cur.execute("""SELECT category_name, title, like_count, view_count, reply_count, tone_name,
            DATE_FORMAT(published_date, '%Y-%m-%d') as pub_date
            FROM socmed_posts
            ORDER BY (COALESCE(like_count,0) + COALESCE(view_count,0)/1000) DESC LIMIT 10""")
        data['top_viral_posts'] = [{
            'platform': r['category_name'],
            'title': (r['title'] or '')[:80],
            'likes': r['like_count'] or 0,
            'views': r['view_count'] or 0,
            'replies': r['reply_count'] or 0,
            'sentiment': r['tone_name'],
            'date': r['pub_date'],
        } for r in cur.fetchall()]

        # ── 11. Response Time Analysis ──
        cur.execute("""SELECT
            SUM(CASE WHEN response_time_in_minute <= 60 THEN 1 ELSE 0 END) as within_1h,
            SUM(CASE WHEN response_time_in_minute > 60 AND response_time_in_minute <= 360 THEN 1 ELSE 0 END) as within_6h,
            SUM(CASE WHEN response_time_in_minute > 360 AND response_time_in_minute <= 1440 THEN 1 ELSE 0 END) as within_24h,
            SUM(CASE WHEN response_time_in_minute > 1440 THEN 1 ELSE 0 END) as over_24h,
            AVG(response_time_in_minute) as avg_rt,
            COUNT(*) as total_with_rt
            FROM socmed_comments WHERE response_time_in_minute IS NOT NULL AND response_time_in_minute > 0""")
        rt = cur.fetchone()
        data['response_time'] = {
            'within_1h': int(rt['within_1h'] or 0),
            'within_6h': int(rt['within_6h'] or 0),
            'within_24h': int(rt['within_24h'] or 0),
            'over_24h': int(rt['over_24h'] or 0),
            'avg_minutes': round(float(rt['avg_rt'] or 0), 1),
            'total_with_rt': int(rt['total_with_rt'] or 0),
        }

        # ── 12. Comment Activity by Hour ──
        cur.execute("""SELECT HOUR(published_at) as hr, COUNT(*) as c
            FROM socmed_comments GROUP BY hr ORDER BY hr""")
        hourly = {str(r['hr']): r['c'] for r in cur.fetchall()}
        data['comments_by_hour'] = {str(h): hourly.get(str(h), 0) for h in range(24)}

        # ── 13. Brand vs Public comments ──
        cur.execute("SELECT is_admin, COUNT(*) as c FROM socmed_comments GROUP BY is_admin")
        admin_data = {r['is_admin']: r['c'] for r in cur.fetchall()}
        data['brand_vs_public'] = {
            'brand_responses': admin_data.get(1, 0),
            'public_comments': admin_data.get(0, 0),
        }

        # ── 14. Engagement Rate per Platform (Likes+Replies / Posts) ──
        data['platform_engagement_rate'] = {
            p['platform']: round((p['total_likes'] + p['total_replies']) / max(p['post_count'], 1), 1)
            for p in data['platform_stats']
        }

        # ── 15. Net Sentiment Score per keyword ──
        nss = {}
        for kw, sent in data['keyword_sentiment'].items():
            total = sent['Positif'] + sent['Netral'] + sent['Negatif']
            nss[kw] = round((sent['Positif'] - sent['Negatif']) / max(total, 1) * 100, 1) if total else 0
        data['keyword_nss'] = nss

        # ── 16. Monthly comment trend (Oct-Dec 2025) ──
        cur.execute("""SELECT DATE_FORMAT(published_at,'%Y-%m') as month, tone_id, COUNT(*) as c
            FROM socmed_comments GROUP BY month, tone_id ORDER BY month""")
        rows = cur.fetchall()
        comment_months = sorted(set(r['month'] for r in rows))
        comment_trend = {m: {'Netral': 0, 'Positif': 0, 'Negatif': 0} for m in comment_months}
        for r in rows:
            tone = TONE_MAP.get(r['tone_id'], 'Unknown')
            if tone in comment_trend.get(r['month'], {}):
                comment_trend[r['month']][tone] = r['c']
        data['monthly_comment_sentiment'] = comment_trend

        print(f"✅ Extracted {data['total_posts']} posts, {data['total_comments']} comments")
        print(f"   Platforms: {[p['platform'] for p in data['platform_stats']]}")
        print(f"   Keywords: {len(data['top_keywords_volume'])} topics")

    conn.close()

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=serial)

    print(f"✅ Saved to {OUTPUT_FILE}")


if __name__ == '__main__':
    run()
