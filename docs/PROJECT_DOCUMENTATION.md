# AlphaTrader — Comprehensive Technical & Product Documentation

> **AlphaTrader** is an enterprise-grade, offline-ready Progressive Web Application (PWA) designed for modern retail and proprietary firm traders. Built with **Next.js 16 (App Router)**, **React 19**, **TypeScript 5**, **MongoDB / Mongoose**, and a custom **Vanilla CSS** design system, AlphaTrader delivers institutional-grade trade journaling, mathematically rigorous financial analytics, behavioral psychology tracking, multi-account portfolio isolation, and secure chart screenshot archiving.

---

## 📑 Table of Contents

1. [Executive Overview & Vision](#1-executive-overview--vision)
2. [Technology Stack](#2-technology-stack)
3. [System Architecture & Data Flow](#3-system-architecture--data-flow)
4. [Project Directory & File Structure](#4-project-directory--file-structure)
5. [Authoritative Financial Calculation Engine](#5-authoritative-financial-calculation-engine)
6. [Data Models & Schemas](#6-data-models--schemas)
7. [User Interface & Feature Modules](#7-user-interface--feature-modules)
   - [Trading Psychology Module (`PsychologyView.tsx`)](#trading-psychology-module-srccomponentspsychologyviewtsx)
   - [Dashboard & Equity Curve (`DashboardView.tsx`)](#dashboard--equity-curve-srccomponentsdashboardviewtsx)
   - [Trades Directory & Gallery (`TradesView.tsx`)](#trades-directory--gallery-srccomponentstradesviewtsx)
   - [Trade Wizard (`TradeModal.tsx`)](#trade-wizard-srccomponentstrademodaltsx)
   - [Analytics Suite (`AnalyticsView.tsx`)](#analytics-suite-srccomponentsanalyticsviewtsx)
8. [REST API Reference](#8-rest-api-reference)
9. [Resilience, Fault Tolerance & Security](#9-resilience-fault-tolerance--security)
10. [Progressive Web App (PWA) & Offline Mode](#10-progressive-web-app-pwa--offline-mode)
11. [Design System & Styling Architecture](#11-design-system--styling-architecture)
12. [Environment Configuration & Deployment](#12-environment-configuration--deployment)
13. [Testing & Quality Assurance](#13-testing--quality-assurance)

---

## 1. Executive Overview & Vision

AlphaTrader bridges the gap between basic spreadsheet logs and institutional trading desks:
- **Zero Friction Logging**: A 4-step wizard capturing technical execution parameters, contract sizing, qualitative rationale, discipline tags, and before/after screenshots.
- **Strict Mathematical Accuracy**: Deterministic calculations across Forex, Crypto, Stocks, and Futures without arbitrary fallbacks or fabricated cross-currency conversions.
- **Behavioral Psychology Correlation**: Quantitative analysis showing the exact monetary profit or loss attributable to specific emotions and discipline states.
- **Dynamic Trading Psychology Center**: A dedicated 3-column pre-trade, post-trade, and end-of-day checklist and reflection center with dynamic analytics sparklines.
- **Prop Firm Rule Monitoring**: Real-time evaluation of maximum daily loss limits, trailing drawdowns, and profit milestone targets.
- **Multi-Account Segregation**: Independent tracking of personal broker accounts, prop firm evaluations (FTMO, Apex, TopStep), and demo accounts.
- **Zero-Downtime Resilience**: Hybrid database architecture pairing MongoDB Atlas with an automatic 1.5-second connection race that falls back seamlessly to local JSON storage if offline.

---

## 2. Technology Stack

| Layer | Technology | Details |
|---|---|---|
| **Framework** | Next.js 16.2.9 | App Router, Server Route Handlers, Turbopack, Fast Refresh |
| **UI Library** | React 19.2.4 | Modern React 19 primitives, Server & Client components |
| **Language** | TypeScript 5 | Strict typing throughout frontend, backend, and schemas |
| **Styling** | Vanilla CSS & PostCSS | Custom glassmorphic dark financial terminal aesthetic; zero Tailwind bloat |
| **Fonts** | Geist Sans & Geist Mono | High legibility typography tailored for numerical financial data |
| **Primary Database** | MongoDB Atlas / Mongoose 9.7 | Scalable NoSQL document store with strict Mongoose schema validation |
| **Fallback Database** | Node.js File System (`fs`) | Zero-dependency local JSON file persistence (`src/data/*.json`) |
| **Object Storage** | Cloudflare R2 / AWS S3 (`@aws-sdk/client-s3`) | High-speed, private chart screenshot storage with streaming proxy |
| **Authentication** | JWT & `bcryptjs` | Secure HTTP-only cookie session authentication and salt hashing |
| **OAuth** | Google Identity Services | Google Sign-In with automated development demo mock fallback |
| **Notifications** | `react-hot-toast` | Custom styled notifications for CRUD actions and warnings |
| **PWA Engine** | Web Manifest & Service Worker | Home screen installability, app shell caching, standalone viewport |

---

## 3. User Interface & Feature Modules

### Trading Psychology Module (`src/components/PsychologyView.tsx`)

The Trading Psychology Center is accessible at `/psychology` and via the sidebar navigation and dashboard readiness banner:

1. **Pre-Trade Checklist (Purple Accent)**:
   - 10 interactive mindset and environment checklist items (emotionally neutral, accept loss, not chasing, no revenge, mentally/physically ready, follow trading plan, risk acceptable, respect daily limits, patient, judge execution).
   - Real-time progress bar and score counter (`X / 10`).
   - Status badge transitions from `Not Completed` to `✓ Completed`.
   - Action: `▶ Save Today's Readiness >` with persistent local storage and database sync.

2. **Post-Trade Review (Emerald Accent)**:
   - Direct trade selector dropdown to review any closed trade from today or recent session.
   - 3 sub-tabs: `Process`, `Emotions`, and `Lesson`.
   - Process questions: Entry rules followed, Exit rules followed, Risk respected, Impulsive decisions made.
   - Emotion tags: Calm, Confident, Anxious, Frustrated, Excited.
   - Qualitative reflection notes with a 0/300 character counter.
   - Action: `💾 Save Trade Review >` with instant status confirmation.

3. **End-of-Day Review (Blue Accent)**:
   - Dynamic **Session Summary** computed live from today's trades: Total Trades, Net Result (R-multiples or $ P&L), and Win Rate (%).
   - 5 daily execution review checklist items: Respected daily risk limits, Did not overtrade, Maintained discipline, Managed emotions well, Overall execution was good.
   - Biggest lesson today textarea (0/300 counter).
   - Action: `📅 Save Daily Review >`.

4. **Your Psychology Analytics**:
   - Timeframe filter pills: `7D`, `30D`, `90D`, and `All Time`.
   - 5 KPI metric cards with custom SVG trend sparklines:
     - Pre-Trade Completion Rate (%)
     - Post-Trade Completion Rate (%)
     - Stuck to Plan Rate (%)
     - Revenge Trades Rate (%)
     - Overtrading Days (%)

---

## 4. REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/psychology?date=YYYY-MM-DD` | Fetches daily readiness record, reviews, and 90-day history |
| `POST` | `/api/psychology` | Saves pre-trade readiness, post-trade review, or end-of-day review |
| `GET` | `/api/trades` | Lists all trades for current authenticated user |
| `POST` | `/api/trades` | Validates and creates a new trade record |
| `PUT` | `/api/trades/[id]` | Updates existing trade record |
| `DELETE` | `/api/trades/[id]` | Deletes trade record |
| `GET` | `/api/accounts` | Lists user's trading portfolios |
| `POST` | `/api/upload` | Uploads chart screenshots to Cloudflare R2 / AWS S3 |
| `GET` | `/api/uploads/[...key]` | Authenticated streaming image proxy |
| `POST` | `/api/auth/signin` | Signs in user and sets secure cookie |
| `POST` | `/api/auth/signup` | Registers new user account |
