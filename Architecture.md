# Architecture Specification: CX One Dashboard

## 1. System Overview & Architectural Strategy

**CX One** is an enterprise Customer Experience & Operational Analytics Dashboard designed for sub-second performance, high concurrency (1,000+ active users), and strict data privacy. 

The application is built on a **3-Layer Security Architecture**. The browser client operates in a zero-trust presentation layer and never communicates directly with data storage or third-party APIs. All data flows, authentication checks, rate limits, and caching strategies are controlled by an **API Intermediary Layer**.

---

## 2. The 3-Layer Data Transmission & Security Model

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        LAYER 1: FRONTEND PRESENTATION                       │
│  Next.js 14 (App Router) + React 18 + TailwindCSS + Tremor / Recharts / SWR │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                      HTTPS / TLS 1.3  │ JWT Bearer Token / Encrypted Cookie
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LAYER 2: API INTERMEDIARY                           │
│  Next.js Edge API Middleware (Auth, Rate Limiter, Dynamic RBAC, Upstash)   │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
            Internal Encrypted Network │ PgBouncer Pool / OAuth Service Keys
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     LAYER 3: DATA ENGINE & STORAGE                          │
│  PostgreSQL (Primary DB) + Google Sheets Ingestion + Background Sync Engine │
└─────────────────────────────────────────────────────────────────────────────┘

```

### Layer 1: Frontend Presentation

* **Tech Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Tremor, Recharts, SWR / Zustand.
* **Responsibilities:** Renders UI components, charts, heatmaps, and interactive data tables. Handles user interactions and local filter state.
* **Security Controls:** Zero exposure of environment secrets (`NEXT_PUBLIC_` forbidden for database or service keys). All inputs are client-sanitized before dispatching API requests.

### Layer 2: API Intermediary Gateway

* **Tech Stack:** Next.js API Routes / Middleware, Upstash Redis, Jose JWT Validation.
* **Responsibilities:**
* **Auth & RBAC:** Enforces JWT session validation and role privileges (Admin, Manager, Viewer).
* **DDoS & Rate Limiting:** Implements Token Bucket rate-limiting via Redis (100 requests/min per IP).
* **Low-Latency Edge Caching:** Intercepts incoming queries and responds from Redis cache ($<15\text{ms}$) whenever valid pre-aggregated data exists.
* **Data Masking & PII Sanitization:** Strips or anonymizes sensitive customer information (e.g., phone numbers, email addresses) before returning payloads to Layer 1.



### Layer 3: Core Data Engine & Storage

* **Tech Stack:** PostgreSQL (VPC), PgBouncer, Google Sheets API v4, Background Worker Node.
* **Responsibilities:**
* **PostgreSQL:** Primary operational database residing in a private subnet with public access disabled. Connection limits managed via PgBouncer.
* **Google Sheets Adapter:** Scheduled and event-driven ingestion engine for survey and manual feedback logs using OAuth Service Account credentials.
* **Push & Cache Sync Engine:** Pushes updated analytical data directly into Layer 2 Redis Cache upon database mutations or Google Sheets webhook triggers, invalidating stale keys.



---

## 3. Modular System Architecture & File Structure

The project follows a strictly modular domain-driven layout:

```text
cx-one-dashboard/
├── docs/
│   ├── PRD.md                     # Product Requirements Document
│   └── ARCHITECTURE.md            # System Architecture Specification
│
├── src/
│   ├── app/                       # App Router (Layer 1 Pages & Layer 2 API)
│   │   ├── (dashboard)/           # Layer 1 Page Views
│   │   │   ├── cx-performance/    # Module 1: CSAT & Driver Metrics
│   │   │   ├── operations/        # Module 2: Visitor & Interaction Analytics
│   │   │   ├── performance-kpi/   # Module 3: SLA & Operational Performance
│   │   │   ├── social-media/      # Module 4: Sentiment & Platform Metrics
│   │   │   └── data-management/   # Layer 3 Integration Admin Controls
│   │   │
│   │   └── api/                   # Layer 2 Intermediary Proxy Endpoints
│   │       ├── v1/
│   │       │   ├── cx-performance/
│   │       │   ├── operations/
│   │       │   ├── performance-kpi/
│   │       │   ├── social-media/
│   │       │   └── sync/          # Layer 3 Push Receiver Webhook
│   │       └── middleware.ts      # Global Middleware (Auth, CORS, Rate Limit)
│   │
│   └── modules/                   # Domain Modules
│       ├── common/                # Shared Components, Layouts, & Global Filters
│       │   ├── components/        # Header, Cascading Selectors (BU, Facility)
│       │   ├── hooks/             # Global filter state store (Zustand)
│       │   └── utils/             # Sanitizers, formatters
│       │
│       ├── cx-performance/        # Module 1 UI Components & Data Hooks
│       ├── operations/            # Module 2 UI Components & Data Hooks
│       ├── performance-kpi/       # Module 3 UI Components & Data Hooks
│       ├── social-media/          # Module 4 UI Components & Data Hooks
│       │
│       └── data-integration/      # Layer 3 Core Ingestion & Push Engine
│           ├── adapters/          # postgres.adapter.ts, google-sheets.adapter.ts
│           ├── cache/             # redis.cache-service.ts
│           ├── security/          # pii-masking.ts, token-validator.ts
│           └── push-engine/       # cache-invalidation.service.ts

```

---

## 4. Sequence Diagrams

### 4.1 Data Query Flow (Layer 1 $\rightarrow$ Layer 2 $\rightarrow$ Layer 3)

```text
Browser (L1)                 API Gateway (L2)              Redis Cache (L2)         PostgreSQL / DB (L3)
     │                              │                             │                           │
     │── 1. GET /api/v1/cx-perf ───►│                             │                           │
     │   (Bearer Token + Query)     │── 2. Validate Auth & Limits │                           │
     │                              │── 3. Check Cache ──────────►│                           │
     │                              │◄─ 4. Cache Hit (Data) ──────│                           │
     │◄── 5. 200 OK (<50ms) ────────│                             │                           │
     │                              │                             │                           │
     │                              │── 6. Cache Miss ───────────────────────────────────────►│
     │                              │◄── 7. Execute Aggregated Query ─────────────────────────│
     │                              │── 8. Write to Cache ───────►│                           │
     │◄── 9. 200 OK (<500ms) ───────│                             │                           │

```

### 4.2 Layer 3 Push Sync & Cache Invalidation Flow

```text
Google Sheets / Webhook          Ingestion Worker (L3)        PgBouncer DB (L3)         Redis Cache (L2)
          │                               │                           │                             │
          │── 1. Data Mutation Event ────►│                           │                             │
          │                               │── 2. Normalize Data ─────►│                             │
          │                               │                           │                             │
          │                               │── 3. Compute Updated Aggregates                         │
          │                               │── 4. Invalidate & Push New Data ───────────────────────►│
          │                               │   (Cache updated instantly for L2)                      │

```

---

## 5. Security Protocols & Threat Mitigation

| Security Risk | Mitigation Layer | Technical Enforcement |
| --- | --- | --- |
| **Direct Database Attacks** | Layer 1 & 2 | Database is placed in a private VPC. Zero DB drivers exist in the frontend bundle. |
| **API Abuse & DDoS** | Layer 2 | Upstash Redis Token Bucket enforces max 100 requests/minute per client IP. |
| **Credential Leakage** | Layer 1 | Environment variable isolation (`NEXT_PUBLIC_` used only for UI build flags). |
| **Data Scraping / PII Leak** | Layer 2 | API Intermediary strips or masks customer names, phone numbers, and raw email addresses before returning responses. |
| **Cross-Site Scripting (XSS)** | Layer 1 & 2 | Input sanitization using DOMPurify on client side and strict Content Security Policy (CSP) headers. |

---

## 6. Performance & Scalability Design (1,000+ Concurrent Users)

1. **Sub-Second Page Load Speed ($<1.0\text{s}$):**
* Pre-aggregated metric tables stored in Redis cache.
* SWR (Stale-While-Revalidate) used on Layer 1 for instant UI rendering from browser memory.


2. **Database Connection Safety:**
* Layer 3 leverages **PgBouncer** connection pooling to prevent PostgreSQL connection starvation during high-concurrency spikes.


3. **Google Sheets API Rate Limit Safety:**
* Direct frontend polling to Google Sheets API is prohibited.
* Ingestion Engine (Layer 3) handles syncing asynchronously via cron background jobs and webhooks, preventing quota exhaustion.