'use client';

import { useState, useEffect, useMemo } from 'react';
import { useFilterStore } from './filter-store';

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ViralPost {
  platform: string;
  title: string;
  likes: number;
  views: number;
  replies: number;
  sentiment: string;
  date: string;
}

export interface PlatformStat {
  platform: string;
  post_count: number;
  total_likes: number;
  total_views: number;
  total_replies: number;
  total_retweet?: number;
  avg_likes: number;
  avg_views: number;
}

export interface KeywordEngagement {
  keyword: string;
  post_count: number;
  total_likes: number;
  total_views: number;
  total_comments: number;
  avg_likes: number;
  avg_views: number;
}

export interface SocmedStats {
  total_posts: number;
  total_comments: number;
  total_likes: number;
  total_views: number;
  total_replies: number;
  platform_stats: PlatformStat[];
  platform_engagement_rate: Record<string, any>;
  posts_sentiment: Record<string, number>;
  comments_sentiment: Record<string, number>;
  avg_response_time_minutes: number;
  response_time: Record<string, any>;
  comments_by_hour: Record<string, number>;
  brand_vs_public: Record<string, number>;
  monthly_comment_sentiment: Record<string, any>;
  monthly_sentiment_trend: Record<string, any>;
  monthly_platform_trend: Record<string, any>;
  keyword_engagement: KeywordEngagement[];
  top_keywords_volume: Record<string, number>;
  keyword_sentiment: Record<string, any>;
  keyword_nss: Record<string, any>;
  top_viral_posts: ViralPost[];
}

export interface SocmedData {
  global: SocmedStats;
  bu_data: Record<string, SocmedStats>;
}

let cachedData: SocmedData | null = null;

export function useSocmedData() {
  const [data, setData] = useState<SocmedData | null>(cachedData);
  const [loading, setLoading] = useState(!cachedData);
  const [error, setError] = useState<string | null>(null);
  const { businessUnit } = useFilterStore();

  useEffect(() => {
    if (cachedData) return;

    fetch('/data/socmed_data.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load social media data');
        return res.json();
      })
      .then((json: SocmedData) => {
        cachedData = json;
        setData(json);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const currentStats = useMemo(() => {
    if (!data) return null;
    if (businessUnit === 'ALL' || !data.bu_data[businessUnit]) {
      return data.global;
    }
    return data.bu_data[businessUnit];
  }, [data, businessUnit]);

  return { data, currentStats, loading, error };
}
