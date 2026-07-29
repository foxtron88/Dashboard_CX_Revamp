// Shared TypeScript interfaces for the CX Dashboard

export interface CSATRecord {
  _id?: number;
  source: string;          // Business Unit (API, HIN, IAS, etc.)
  subholding: string;
  location: string;
  facility_type: string;
  facility_id: string;
  overall_score: number;
  overall_group: string;
  staff_score: number;
  facility_score: number;
  cleanliness_score: number;
  feedback: string;
  sentiment: string;
  tags: string;
  response_date: string;
  language: string;
  channel: string;
  nps_score: number | null;
  nps_group: string;
  survey_name: string;
}

export interface ConsolidatedData {
  generated_at: string;
  total_records: number;
  sources: string[];
  records: CSATRecord[];
}

export interface PerformanceMetrics {
  performance: Record<string, number[]>;
  statistik: Record<string, number[]>;
  scores: Record<string, number[]>;
  interactions: Record<string, number[]>;
  call_center: Record<string, number[]>;
}

export interface CXPerformanceData {
  [buName: string]: PerformanceMetrics | string[];
  _months: string[];
}

export interface FilterState {
  businessUnit: string;
  location: string;
  facilityType: string;
  sentiment: string;
  startDate: string;
  endDate: string;
}
