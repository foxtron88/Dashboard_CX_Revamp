# Product Requirements Document (PRD): CX One Dashboard (3-Layer Secure Architecture)

## 1. Executive Summary & Vision
- **Product Name:** CX One (Customer Experience One) Dashboard
- **Target Application Reference:** Exact feature & layout replica of `https://dashboard-cx-one.vercel.app`
- **Architecture Strategy:** Strict **3-Layer Modular Architecture** (Frontend Client $\rightarrow$ API Intermediary Gateway $\rightarrow$ Core Data Engine & Storage).
- **Core Security Policy:** Zero direct client access to databases or external APIs. All data requests are authenticated, rate-limited, sanitized, and proxied through the API intermediary layer.
- **Data Integration:** Dual-source ingestion pulling from **Google Sheets** (survey forms & manual logs) and **PostgreSQL** (core operational database).
- **Performance Guarantee:** Sub-1.0 second ($<1.0\text{s}$) page load times for **1,000+ concurrent active users** via Edge CDN caching, Redis token buckets, and PgBouncer connection pooling.

---

## 2. 3-Layer Data Transmission & Security Architecture

### 2.1 Architectural Flow Diagram

```text
┌──────────────────────────────────────────────────────────────────────────┐
│                             LAYER 1: FRONTEND                            │
│  Next.js 14 Client (UI / Charts / Modular Views / State Management)      │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
                     HTTPS / TLS 1.3 │ JWT Bearer Token / Encrypted Session
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      LAYER 2: API INTERMEDIARY                           │
│  Edge API Gateway / Middleware (Auth, Rate Limiting, RBAC, Redis Cache)  │
└────────────────────────────────────┬─────────────────────────────────────┘
                                     │
          Encrypted Internal Subnet  │ PgBouncer Pool / Service Credentials
                                     ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                   LAYER 3: DATA ENGINE & STORAGE                         │
│  PostgreSQL Database + Google Sheets API + Webhook Push Sync Engine      │
└──────────────────────────────────────────────────────────────────────────┘

```

### 2.2 Security & Data Isolation Specifications

#### **Layer 1: Frontend Presentation Layer**

* **Zero Secrets Exposure:** Browser bundle contains strictly no database URLs, service account keys, or raw SQL drivers (`NEXT_PUBLIC_` prefixes forbidden for secrets).
* **Transport Security:** Communicates exclusively with Layer 2 via HTTPS (TLS 1.3).
* **Input Sanitization:** All user query inputs (filters, full-text searches) are sanitized on the client before submission.

#### **Layer 2: API Intermediary Gateway Layer**

* **Authentication & RBAC:** Validates JWT sessions and enforces Role-Based Access Control (Admin, Manager, Viewer).
* **Rate Limiting:** Enforces Redis-backed Token Bucket rate limiting (100 requests/minute per IP) to prevent DDoS and scraping.
* **Low-Latency Caching:** Pre-computed metrics are served directly from Upstash Redis ($<15\text{ms}$) to guarantee sub-second rendering under 1,000 user concurrency.
* **Data Masking:** Sensitive feedback fields (PII such as customer emails/phones) are masked or stripped by the API before sending responses to Layer 1.

#### **Layer 3: Data Engine & Push Sync Layer**

* **Database Protection:** PostgreSQL operates within a private VPC with PgBouncer connection pooling; public IP access is disabled.
* **Google Sheets Ingestion:** Service Account authentication handles scheduled syncing and webhook triggers.
* **Data Push Engine:** On database mutation or Google Sheets updates, Layer 3 automatically pushes updated data into the Layer 2 Redis Cache (Cache Invalidation & Push Sync), ensuring data is fresh without expensive live DB queries.

---

## 3. Modular Repository Directory Layout

To maintain strict separation of layers, feature isolation, and team scalability, the codebase adheres to the following structure:

```text
src/
├── app/                          # LAYER 1 & LAYER 2 Routes (Next.js App Router)
│   ├── (dashboard)/              # Frontend Page Views
│   │   ├── cx-performance/       # Menu 1: CX Performance & CSAT Analytics
│   │   ├── operations/           # Menu 2: Interaksi & Pengunjung Analytics
│   │   ├── performance-kpi/      # Menu 3: Statistic & Operational Performance
│   │   ├── social-media/         # Menu 4: Social Media Analytics
│   │   └── data-management/      # Admin: Integration Controls
│   └── api/                      # LAYER 2: API Intermediary Endpoints
│       ├── v1/
│       │   ├── cx-performance/   # Proxy endpoints for Module 1
│       │   ├── operations/       # Proxy endpoints for Module 2
│       │   ├── performance-kpi/  # Proxy endpoints for Module 3
│       │   ├── social-media/     # Proxy endpoints for Module 4
│       │   └── sync/             # Webhook receiver for Layer 3 Data Push
│       └── middleware.ts         # Global Auth, CORS & Rate Limiter
│
├── modules/                      # Modular Business Logic
│   ├── common/                   # Shared UI, Global Cascading Filters & Hooks
│   │   ├── components/           # BU, Location, Facility, Sentiment dropdowns
│   │   └── hooks/                # Global filter state management (Zustand)
│   │
│   ├── cx-performance/           # Module 1 UI Components & Client Services
│   │   ├── components/           # ExecutiveSummary, CSATRadar, Heatmap, RankingCards
│   │   ├── feedback-explorer/    # Raw Feedback Data Table component
│   │   ├── services/             # API layer fetch hooks
│   │   └── types/                # TS interfaces
│   │
│   ├── operations/               # Module 2 UI Components & Client Services
│   │   ├── components/           # InteractionCategory, CallCenterPerf, CorrelationChart
│   │   ├── services/
│   │   └── types/
│   │
│   ├── performance-kpi/          # Module 3 UI Components & Client Services
│   │   ├── components/           # CSAT18MonthTrend, CallCenterSL, ComplaintSLA
│   │   ├── services/
│   │   └── types/
│   │
│   ├── social-media/             # Module 4 UI Components & Client Services
│   │   ├── components/           # NetSentimentScore, PlatformBreakdown, ViralPostsTable
│   │   ├── services/
│   │   └── types/
│   │
│   └── data-integration/         # LAYER 3: Data Integration & Processing Core
│       ├── adapters/             # postgres.adapter.ts, google-sheets.adapter.ts
│       ├── cache/                # redis.cache-service.ts
│       ├── security/             # sanitization, encryption, token validators
│       ├── push-engine/          # db-push.service.ts, sheet-sync.job.ts
│       └── types/                # Unified Schema Definitions

```

---

## 4. Full Functional Specifications by Module

### 4.0 Global Layout & Common Module (`/src/modules/common`)

* **Global Header & Status:**
* Application title ("CX One"), system environment status, last data sync timestamp.
* Date Range Picker (Month/Quarter/18-Month view).


* **Cascading Filter System:**
* **Business Unit (BU) Select:** API, HIN, IAS, IDM - TMII, IDM - TWC, ITDC, Sarinah, InJourney.
* **Location & Facility Select:** Cascades dynamically based on selected BU.
* **Sentiment Filter:** All, Positive, Neutral, Negative.



---

### 4.1 Module 1: CX Performance & CSAT Analytics (`/src/modules/cx-performance`)

*Replicates Menu 1 of the target reference application.*

* **Executive Summary:** Overall CSAT Score Card and MoM change indicator.
* **3 Core Drivers Summary Cards:**
* 👥 **People (PPL):** Staff efficiency, friendliness, service quality.
* 🔄 **Process (PRC):** Cleanliness, flow, operational speed.
* 🏢 **Premises (PRM):** Facility quality, comfort, infrastructure.


* **CSAT Breakdown per Member & Radar Chart:**
* Individual Business Unit performance cards.
* CSAT Radar Chart comparing PPL vs PRC vs PRM driver balance.


* **Satisfaction & Sentiment Analysis:**
* CSAT Score Distribution (Bar chart).
* Sentiment Breakdown (Donut chart: Positive, Neutral, Negative).


* **Trends & Heatmap:**
* 18-Month CSAT Trend line chart per Business Unit.
* **CSAT Heatmap:** Matrix grid mapping Business Unit $\times$ Month with color-coded score intensity.


* **Facility Rankings & Topic Cloud:**
* Top 5 Highest Performing Facilities (Bar chart).
* Bottom 5 Lowest Performing Facilities (Bar chart).
* Most Mentioned Topics & Keyword Frequency cloud.


* **Feedback Explorer (Data Table Component):**
* Searchable, filterable raw feedback grid (Date, Unit, Location, Facility, Score, Sentiment Badge, Feedback Text).
* Pagination, column sorting, and CSV/XLSX export support.



---

### 4.2 Module 2: Interaksi & Pengunjung Analytics (`/src/modules/operations`)

*Replicates Menu 2 of the target reference application.*

* **Interaction Categories:** Breakdown of inquiries, complaints, feedback, and requests.
* **Channel Performance:** Call Center Performance vs Social Media Monitoring volume metrics.
* **Visitor vs Interaction Volume:** Monthly Visitor Count vs Total Interaction Volume dual-axis chart.
* **Channel Analytics & AHT:**
* Volume distribution per Channel (Call Center, WhatsApp, Email, Live Chat, Social Media).
* **Average Handling Time (AHT):** Measured in minutes per channel.


* **Correlation Analysis:**
* Scatter plot analyzing correlation between Visitor Count (X-axis), Interaction Volume (Y-axis), and CSAT Score (Bubble Color).



---

### 4.3 Module 3: Statistic & Operational Performance (`/src/modules/performance-kpi`)

*Replicates Menu 3 of the target reference application.*

* **CSAT Trends & Radar:** 18-Month CSAT Trend line & CSAT Radar breakdown across PPL, PRC, PRM.
* **Branch Service Performance:** Overall service standard achievement percentage per BU.
* **Call Center Deep Dive:**
* First Call Resolution (FCR %) & Service Level (SL %) trend charts.
* Total Call Volume per Business Unit.


* **Complaint Handling & SLA Tracking:**
* Total Complaints per BU & Average Resolution Time (in Days).
* Complaint Resolution Rate (%) trend.
* **SLA Resolution Distribution:** Monthly stacked bar chart (On-time SLA vs SLA Breached).


* **AHT & Interaction Distribution:**
* Average Handling Time per channel.
* Category interaction volume breakdown.



---

### 4.4 Module 4: Social Media Analytics (`/src/modules/social-media`)

*Replicates Menu 4 of the target reference application.*

* **Overview Stat Cards & NSS Engine:**
* Monitored totals: 150K+ Posts, 10K+ Comments, 5 Platforms.
* **Net Sentiment Score (NSS) Card:** Calculated as:

$$NSS = \left(\frac{\text{Positive} - \text{Negative}}{\text{Total}}\right) \times 100$$




* **Monthly & Platform Trends:**
* Post Volume & Sentiment trend (Jan 2025 – Jul 2026).
* Distribution per Platform (Instagram, TikTok, X, Facebook, YouTube).
* Engagement metrics: Total Likes, Views, Avg Likes/Post per platform.


* **Sentiment & Keyword Analysis:**
* Post Sentiment vs Comment Sentiment breakdown.
* Top 15 Keywords by volume, total likes, views, and average engagement.


* **Response Time & Viral Leaderboard:**
* Brand Response Time distribution (<15 min, 15-60 min, >1 hr) & Hourly comment activity.
* **Top 10 Viral Posts Table:** Rank (#), Platform Icon, Post Content snippet, Likes, Views, Replies, Sentiment Tag, Date.



---

### 4.5 Module 5: Data Integration Engine (`/src/modules/data-integration`)

*Layer 3 Data Pipeline and Sync System.*

* **Google Sheets Ingestion Adapter:**
* Connects to Google Sheets API v4 using a Service Account.
* Normalizes raw sheet entries into unified database models.


* **PostgreSQL Database Adapter:**
* Manages connection pools via PgBouncer.
* Executes pre-aggregated queries for heavy metrics.


* **Cache Invalidation & Push Engine:**
* Automates pushing newly ingested DB rows or Google Sheets entries into the Layer 2 Redis Cache.
* Guarantees sub-second API responses ($<100\text{ms}$) by eliminating live database hits during user browsing.



---

## 5. Non-Functional Requirements & Performance SLAs

1. **Page Load Speed:** $< 1.0\text{ second}$ TTFB & full rendering across all dashboard routes.
2. **Concurrency Capacity:** Supports **1,000 active concurrent users** without connection pool exhaustion or Google Sheets API rate-limit violations.
3. **Cache Performance:** Redis cache hit ratio $> 95\%$ with cache key TTL set to 60–300 seconds.
4. **Design Integrity:** 1:1 visual match with reference dashboard (`https://dashboard-cx-one.vercel.app`), fully responsive across desktop, tablet, and mobile viewports.

---

## 6. Implementation Roadmap

* **Sprint 1 (3-Layer Architecture & Core Infrastructure):**
* Folder structure scaffolding (`/src/modules/...`).
* Layer 2 API Intermediary setup with JWT auth, Redis rate limiting, and CORS restrictions.
* Layer 3 PostgreSQL (PgBouncer) & Google Sheets Service Account setup.


* **Sprint 2 (Module 1 & Module 2 Implementation):**
* `cx-performance` UI + Layer 2 API Intermediary proxy endpoints.
* `operations` UI + Layer 2 API Intermediary proxy endpoints.


* **Sprint 3 (Module 3 & Module 4 Implementation):**
* `performance-kpi` UI + Layer 2 API Intermediary proxy endpoints.
* `social-media` UI + Layer 2 API Intermediary proxy endpoints.


* **Sprint 4 (Push Engine, Stress Testing & Security Audit):**
* Implement Layer 3 Data Push Engine (DB/Sheets $\rightarrow$ Redis Cache).
* k6/Artillery stress testing for 1,000 concurrent users to verify $<1.0\text{s}$ load speeds.
* Final OWASP security audit verifying 3-layer data isolation and zero secret exposure.



```

```