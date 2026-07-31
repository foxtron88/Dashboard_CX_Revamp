// Shared TypeScript interfaces for the CX Dashboard

export interface CSATRecord {
  _id?: number;
  respondent_id: string;
  synced_at: string;
  bu: string;               // Business Unit (API, IDM, IAS, ITDC, Sarinah)
  survey_type: string;       // Baggage Claim, Toilet, etc.
  subholding: string;
  location: string;
  region: string;
  facility_type: string;
  facility_id: string;
  overall_score: number | null;
  overall_group: string;     // Satisfied / Neutral / Dissatisfied
  people_score: number | null;
  process_score: number | null;
  premises_score: number | null;
  nps_score: number | null;
  feedback: string;
  tags: string;
  sentiment: string;
  channel: string;
  language: string;
  month: string;             // derived: YYYY-MM
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
