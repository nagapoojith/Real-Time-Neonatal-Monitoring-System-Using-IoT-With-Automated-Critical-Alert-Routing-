<div align="center">

<!-- Add a logo at neonateral-main/public/logo.png and uncomment the line below -->
<!-- <img src="neonateral-main/public/logo.png" alt="NeoGuard Logo" width="140" /> -->
# 🍼 NeoGuard

**IoT-Powered Neonatal Intensive Care Monitoring System**

*Combining ESP32 sensor firmware with a real-time NICU web dashboard — built to empower clinical staff and connect families.*

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![FastAPI](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?logo=supabase&logoColor=white)](https://supabase.com)
[![ESP32](https://img.shields.io/badge/Firmware-ESP32%20Arduino-E7352C?logo=espressif&logoColor=white)](https://www.espressif.com)
[![ThingSpeak](https://img.shields.io/badge/IoT-ThingSpeak-0078D4?logo=mathworks&logoColor=white)](https://thingspeak.com)
[![Vercel](https://img.shields.io/badge/Deployed-Vercel-000000?logo=vercel&logoColor=white)](https://vercel.com)
[![License](https://img.shields.io/badge/License-Academic%20%2F%20Research-blue)](./LICENSE)

[🚀 Quick Start](#-quick-start) · [🏗️ Architecture](#️-system-architecture) · [🔧 Hardware](#-hardware-firmware) · [🌐 Web App](#-web-application) · [🔌 API Reference](#-api-reference) · [🛡️ Security](#️-security-considerations)

</div>

---

## ⚠️ Clinical Disclaimer

> **NeoGuard is intended for academic and research purposes only.**
> It has **not** been approved as a medical device by any regulatory authority (FDA, CE, CDSCO, or equivalent). Do **not** use this system as a primary or sole monitoring solution in a live clinical environment. Always follow your institution's clinical protocols and use certified medical-grade equipment alongside this platform.

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#️-system-architecture)
- [Hardware Firmware](#-hardware-firmware)
  - [Bill of Materials](#bill-of-materials)
  - [Wiring & Pinout](#wiring--pinout)
  - [Sensor Algorithms](#sensor-algorithms)
  - [Alert Thresholds](#alert-thresholds)
  - [ThingSpeak Integration](#thingspeak-integration)
  - [Getting Started — Arduino](#getting-started--arduino)
- [Web Application](#-web-application)
  - [Feature Overview](#feature-overview)
  - [Tech Stack](#tech-stack)
  - [Pages & Routes](#pages--routes)
  - [Database Schema](#database-schema)
  - [Supabase Edge Functions](#supabase-edge-functions)
  - [Role-Based Access Control](#role-based-access-control)
  - [Alert Pipeline](#alert-pipeline)
  - [AI Integration](#ai-integration)
- [Quick Start](#-quick-start)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Edge Function Secrets](#edge-function-secrets)
  - [Useful Scripts](#useful-scripts)
- [User Guides](#-user-guides)
- [Development](#-development)
- [API Reference](#-api-reference)
- [Security Considerations](#️-security-considerations)
- [Troubleshooting](#-troubleshooting)
- [Roadmap](#️-roadmap)
- [Contributing](#-contributing)
- [Screenshots](#-screenshots)
- [Acknowledgments](#-acknowledgments)
- [License](#-license)

---

## 🎯 Overview

**NeoGuard** is a two-part end-to-end neonatal monitoring system designed for Neonatal Intensive Care Unit (NICU) environments.

### The Problem

- 🚫 **Delayed Detection**: Subtle vital-sign deterioration in neonates can go unnoticed during busy shifts
- 🔔 **Alert Fatigue**: Nurses manage multiple incubators simultaneously with no unified alert panel
- 👨‍👩‍👧 **Parent Anxiety**: Families have no accessible window into their newborn's care status
- 📋 **Manual Handovers**: Shift transitions rely on verbal communication, risking information loss

### Our Solution

- 📡 **ESP32 Sensor Node**: MAX30102 + DS18B20 + DHT11 stream HR, SpO₂, and temperature to the cloud every 15 seconds
- 🤖 **AI-Assisted Monitoring**: Cry pattern classification, apnea risk warnings, and neonatal risk scoring
- 🔔 **Smart Alert System**: Threshold-based alerts with automated clinical email delivery and AI-generated summaries
- 👪 **Parent Portal**: Public-facing portal with AI chatbot, hospital locator, and cry detection — no login required
- 🌗 **Role-Based NICU Dashboard**: Dedicated views for nurses, doctors, and senior doctors with appropriate data access

| Part | Location | Responsibility |
|---|---|---|
| **ESP32 Firmware** | `NEONATAL_MONITORING_SYSTEM_ONLINE/` | Reads vitals from hardware sensors; aggregates and uploads to ThingSpeak every 15 s over Wi-Fi |
| **Web Dashboard** | `neonateral-main/` | React + Supabase SPA — real-time monitoring, alerts, shift handover, AI features, and parent portal |

---

## ✨ Key Features

### 🏥 NICU Staff Dashboard

- **Patient Overview**: All registered neonates with status badges (Normal / High / Critical) and a live alert panel
- **Live Vital Charts**: Per-patient real-time charts for HR, SpO₂, temperature, movement, and sleep position with auto-refresh
- **Shift Handover**: Day / Evening / Night shift notes with author, role, category, and patient linkage
- **Feeding Tracker**: Log and review feeding volumes, types, and intervals per patient
- **Health Records & PDF Reports**: Downloadable patient summaries generated with jsPDF

### 🤖 AI & Clinical Intelligence

- **Cry Detection**: Browser mic or audio file upload — classifies cry as Normal, Discomfort, or Pain
- **Neonatal Risk Score**: Composite risk scoring surfaced in the baby detail view
- **Apnea Risk Warning**: Clinical apnea risk assessment component based on current live vitals
- **Voice Assistant**: Speech-to-text → Supabase Edge Function → LLM → text-to-speech
- **Alert Summaries**: AI-generated clinical narratives embedded in alert emails

### 🔔 Alert System

- **Active Alert Feed**: Real-time alert panel with severity classification
- **Manual Alert Creation**: Staff-initiated alerts with custom severity
- **Alert Acknowledgement**: Mark alerts as resolved with staff ID and timestamp
- **Automated Clinical Emails**: Transactional alert emails via Brevo with optional AI summary
- **Alert History**: Searchable, paginated log of all past alerts

### 🌐 Parent Portal

- **AI Chatbot**: Ask questions about neonatal care — no login required
- **Hospital Locator**: TomTom Maps-powered NICU facility finder
- **Cry Detection**: Parents can upload an audio clip for cry pattern analysis

### 🌗 NICU Environment Monitor

- **Per-Incubator Tracking**: Temperature (32–34 °C), humidity (50–60 %), and light exposure (100–300 lux)
- **Trend Indicators**: Visual trend arrows for each environmental parameter

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                        ESP32 Sensor Node                             │
│                                                                      │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐  │
│  │   MAX30102     │  │   DS18B20      │  │        DHT11           │  │
│  │  HR / SpO₂     │  │  Body Temp     │  │  Room Temp + Humidity  │  │
│  │  I²C 21/22     │  │ OneWire GPIO5  │  │    Digital GPIO 4      │  │
│  └──────┬─────────┘  └──────┬─────────┘  └───────────┬────────────┘  │
│         └───────────────────┴────────────────────────┘               │
│                           ESP32                                      │
│                     WiFi 802.11 b/g/n                                │
└──────────────────────────┬───────────────────────────────────────────┘
                           │  HTTP GET every 15 s
                           ▼
               ┌───────────────────────┐
               │   ThingSpeak Cloud    │
               │   (6-field channel)   │
               └───────────┬───────────┘
                           │  Polled by web app (React Query)
                           ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       NeoGuard Web Application                       │
│                                                                      │
│  React 18 + TypeScript + Vite         Tailwind CSS + shadcn/ui       │
│                                                                      │
│  ┌──────────────────────┐   ┌──────────────────────────────────────┐ │
│  │  TanStack Query      │   │       React Router v6                │ │
│  │  (polling + cache)   │   │  (auth-guarded client routing)       │ │
│  └──────────────────────┘   └──────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │                        Supabase                                │  │
│  │   PostgreSQL (patients, alerts, shift notes, feeding logs)     │  │
│  │   Auth (staff JWT sessions + parent access codes)              │  │
│  │   Edge Functions (Deno — AI, email, maps, parent auth)         │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  ┌────────────────┐  ┌────────────────────────┐  ┌───────────────┐   │
│  │  Brevo Email   │  │   OpenAI-Compatible    │  │  TomTom Maps  │   │
│  │  (alerts)      │  │   API (chatbot, voice, │  │  (hospital    │   │
│  │                │  │    alert summaries)    │  │   locator)    │   │
│  └────────────────┘  └────────────────────────┘  └───────────────┘   │
└──────────────────────────────────────────────────────────────────────┘
```

### Data Flow

```
ESP32 reads sensors → averages samples → HTTP uploads to ThingSpeak every ≥15 s
           │
           ▼
React Query polls ThingSpeak → merges with Supabase patient records
           │
           ▼
Vital sign crosses threshold?
           │
    Yes ───┤
           ▼
Write alert → Supabase DB
           │
    ┌──────┴───────┐
    ▼              ▼
AI Summary    send-alert-email Edge Function
(optional)         │
                   ▼
            Brevo transactional email → clinical staff inbox
                   │
                   ▼
          Staff acknowledges alert on /alerts page
                   │
                   ▼
     alerts.is_active = false + acknowledged_by recorded
```

---

## 🔧 Hardware Firmware

### Bill of Materials

| # | Component | Role | Interface | Notes |
|---|-----------|------|-----------|-------|
| 1 | **ESP32 Dev Board** (WROOM-32) | MCU + Wi-Fi | — | 3.3 V logic; USB-powered during dev |
| 2 | **MAX30102** | Heart rate & SpO₂ pulse oximetry | I²C — SDA GPIO 21, SCL GPIO 22 | 1.8 V supply; pull-ups to 3.3 V recommended |
| 3 | **DS18B20** (waterproof probe) | Neonate skin / body temperature | OneWire — GPIO 5 | 4.7 kΩ pull-up to 3.3 V required |
| 4 | **DHT11** | Incubator ambient temperature & humidity | Digital — GPIO 4 | ±2 °C / ±5 %RH accuracy |
| 5 | Breadboard / Perf board | Prototyping | — | — |
| 6 | Jumper wires | Connections | — | — |
| 7 | 4.7 kΩ resistor × 1 | DS18B20 OneWire pull-up | — | Required |
| 8 | 4.7 kΩ resistor × 2 (optional) | I²C SDA/SCL pull-ups | — | Use if MAX30102 module lacks them |
| 9 | USB power supply (5 V, 1 A) | Power | — | Stable supply critical for IR sensor |

### Wiring & Pinout

```
ESP32 GPIO       →   Peripheral
──────────────────────────────────────────────────────
GPIO 21 (SDA)    →   MAX30102 SDA
GPIO 22 (SCL)    →   MAX30102 SCL
3.3 V            →   MAX30102 VIN
GND              →   MAX30102 GND

GPIO 5           →   DS18B20 DATA (centre pin)
3.3 V            →   DS18B20 VDD  (+ 4.7 kΩ pull-up from DATA → VDD)
GND              →   DS18B20 GND

GPIO 4           →   DHT11 DATA
3.3 V            →   DHT11 VCC
GND              →   DHT11 GND
```

> ⚠️ Do **not** share the DS18B20 data line with any other GPIO signal. Parasitic-power mode is **not** recommended for medical prototyping — always use a dedicated VDD wire.

### Sensor Algorithms

#### ❤️ Heart Rate (MAX30102)

- Red and IR photodiode channels sampled at the configured sensor rate
- Peak detection uses a **Pan-Tompkins-inspired PPG algorithm**: derivative filter → squaring → integration window
- Inter-beat intervals (IBI) converted to instantaneous BPM and EMA-smoothed:

  `HR_filtered = HR_EMA_ALPHA × HR_raw + (1 − HR_EMA_ALPHA) × HR_prev`

  where `HR_EMA_ALPHA = 0.25`

- **`NEONATAL_MODE`**: Valid IBI restricted to **250–700 ms (86–240 BPM)** instead of the adult default of 300–1500 ms (40–200 BPM)

#### 🩸 SpO₂ (MAX30102)

- Ratio-of-ratios method: `R = (AC_red / DC_red) / (AC_ir / DC_ir)`
- SpO₂ derived via Maxim's empirical calibration curve over a **100-sample sliding window**
- EMA-filtered result **capped at 99 %** to prevent non-physiological readings
- Weak-signal hysteresis: if **Perfusion Index (PI)** = `(AC_ir / DC_ir) × 100` drops below the minimum threshold, readings are gated and not uploaded to ThingSpeak

#### 💡 Auto-Brightness (LED Drive Current)

Every 4 SpO₂ cycles the firmware checks the DC IR level and auto-adjusts LED current:

| IR Signal Level | Action |
|---|---|
| < 80,000 counts | Step LED current **up** |
| 80,000 – 160,000 counts | Hold current (optimal range) |
| > 160,000 counts | Step LED current **down** |

#### 🌡️ DS18B20 Body Temperature

- OneWire 12-bit resolution; conversion time ~750 ms
- Readings outside 30–42 °C are discarded as artefacts

#### 💧 DHT11 Environment

- Polled once per upload cycle; failed readings are retried once before being skipped

### Alert Thresholds

These neonatal reference ranges drive alert generation on the web dashboard. The firmware does not enforce them — thresholds are configured web-side.

| Vital Sign | Normal | Warning | Critical |
|---|---|---|---|
| Heart Rate | 100–160 BPM | 80–99 / 161–180 BPM | < 80 / > 180 BPM |
| SpO₂ | 95–99 % | 90–94 % | < 90 % |
| Body Temperature | 36.5–37.5 °C | 36.0–36.4 / 37.6–38.0 °C | < 36.0 / > 38.0 °C |
| Room Temperature | 32–34 °C | 30–31.9 / 34.1–36 °C | < 30 / > 36 °C |
| Humidity | 50–60 % | 40–49 / 61–70 % | < 40 / > 70 % |

> Based on AAP/WHO NICU guidelines for term and near-term neonates. Adjust thresholds for gestational age as required.

### ThingSpeak Integration

Data uploaded via HTTP GET to `api.thingspeak.com/update` at a minimum of **15 seconds** (free-tier rate limit). Each upload sends values **averaged** over all valid samples since the previous upload.

| ThingSpeak Field | Metric | Unit | Notes |
|---|---|---|---|
| `field1` | Heart Rate (average) | BPM | EMA-filtered, neonatal range gated |
| `field2` | SpO₂ (average) | % | 100-sample window, capped at 99 % |
| `field3` | SpO₂ (minimum) | % | Worst reading in the upload interval |
| `field4` | Body Temperature | °C | DS18B20 averaged |
| `field5` | Room Temperature | °C | DHT11 reading |
| `field6` | Humidity | % | DHT11 reading |

The web app reads ThingSpeak via `/channels/{id}/feeds/last.json` using a **Read API Key** stored as a Supabase Edge Function secret — never exposed in the client bundle.

### Getting Started — Arduino

**Requirements**

- Arduino IDE 2.x or PlatformIO
- ESP32 board package: `https://dl.espressif.com/dl/package_esp32_index.json`

| Library | Version Tested |
|---|---|
| SparkFun MAX3010x Pulse and Proximity Sensor Library | 1.1.2 |
| DallasTemperature | 3.9.x |
| OneWire | 2.3.x |
| DHT sensor library (Adafruit) | 1.4.x |

**Steps**

1. Open `NEONATAL_MONITORING_SYSTEM_ONLINE/NEONATAL_MONITORING_SYSTEM_ONLINE.ino` in Arduino IDE.
2. Update credentials at the top of the file:

```cpp
#define WIFI_SSID     "your-wifi-ssid"
#define WIFI_PASSWORD "your-wifi-password"
#define TS_WRITE_KEY  "your-thingspeak-write-api-key"
```

3. Optionally enable neonatal heart-rate filtering:

```cpp
#define NEONATAL_MODE   // Restrict valid IBI to 250–700 ms (86–240 BPM)
```

4. Select your board (`Tools → Board → ESP32 Dev Module`) and the correct COM port.
5. Set upload speed to `115200` baud, then click **Upload**.

**Expected Serial Monitor Output**

```
[SENSOR] HR: 142 BPM  SpO2: 97%  PI: 2.3%
[TEMP]   Body: 36.8°C  Room: 33.1°C  Humidity: 55%
[TS]     Upload OK → entry 12345
```

> ⚠️ **Never commit** real Wi-Fi credentials or API keys to version control. Both are listed in `.gitignore`.

---

## 🌐 Web Application

### Feature Overview

| Feature | Description | Access |
|---|---|---|
| **NICU Dashboard** | All patients with status badges + live alert panel | All staff |
| **Live Monitoring** | Per-patient real-time vital charts with auto-refresh | All staff |
| **Alert System** | Active feed, manual creation, acknowledgement, Brevo emails | All staff |
| **Alert History** | Searchable paginated log with timestamps and severity | All staff |
| **Cry Detection** | Browser mic or audio file → Normal / Discomfort / Pain | Staff + Parents |
| **NICU Environment** | Per-incubator temp, humidity, light with trend indicators | All staff |
| **Feeding Status** | Log and review feeds per patient | All staff |
| **Health Records** | Patient history + downloadable PDF reports (jsPDF) | All staff |
| **Shift Handover** | Day / Evening / Night notes with author and patient linkage | All staff |
| **Neonatal Risk Score** | Composite risk scoring in baby detail view | Doctor+ |
| **Apnea Risk Warning** | Clinical apnea risk assessment from current vitals | Doctor+ |
| **Voice Assistant** | Speech-to-text → LLM → text-to-speech via Edge Function | Public |
| **Parent Portal** | AI chatbot + hospital map + cry detection | Public (no login) |
| **Dark / Light Mode** | System-aware theme with Tailwind + next-themes | All |

### Tech Stack

**Frontend**

| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool & HMR dev server |
| Tailwind CSS | 3.x | Utility-first styling |
| shadcn/ui (Radix UI) | Latest | Accessible headless components |
| TanStack React Query | v5 | Server state, polling, caching |
| React Router DOM | v6 | Auth-guarded client routing |
| Recharts | 2.x | Composable vital sign charts |
| React Hook Form + Zod | Latest | Form state + schema validation |
| jsPDF | 2.x | Client-side PDF report generation |
| next-themes | Latest | Dark / light / system theme |
| Lucide React | Latest | Icon library |
| react-markdown | Latest | Markdown rendering for AI responses |
| Framer Motion | Latest | Page and component animations |

**Backend / Infrastructure**

| Technology | Purpose | Notes |
|---|---|---|
| Supabase | PostgreSQL database, Auth, Storage | Free tier sufficient for dev |
| Supabase Edge Functions | Serverless Deno/TypeScript functions | 7 functions deployed |
| Brevo | Transactional clinical alert emails | Free: 300 emails/day |
| TomTom Maps API | Hospital and care facility locator | Key served via Edge Function proxy |
| OpenAI-compatible API | Chatbot, voice assistant, alert summaries | Swappable for Groq / Azure / Ollama |
| ThingSpeak | IoT sensor cloud channel | 15 s min upload on free tier |
| Vercel | Frontend hosting + CDN + preview deployments | SPA routing via `vercel.json` |

### Pages & Routes

| Route | Page | Access |
|---|---|---|
| `/` | Landing / Index | Public |
| `/login` | Staff Login | Public (redirects if authed) |
| `/signup` | Staff Registration | Public (redirects if authed) |
| `/forgot-password` | Password Reset Request | Public |
| `/reset-password` | Password Reset (via email link) | Public |
| `/dashboard` | NICU Overview Dashboard | Staff only |
| `/baby/:id` | Individual Patient Detail | Staff only |
| `/register` | Register New Patient | Staff only |
| `/alerts` | Active Alerts | Staff only |
| `/history` | Alert History | Staff only |
| `/live-monitoring` | Real-Time Vital Signs | Staff only |
| `/nicu-environment` | Incubator Environment Monitor | Staff only |
| `/cry-detection` | Cry Pattern Analyser | Staff only |
| `/shift-handover` | Shift Notes & Handover | Staff only |
| `/feeding-status` | Feeding Tracker | Staff only |
| `/health-records` | Health Records & Reports | Staff only |
| `/voice-assistant` | AI Voice Assistant | Public |
| `/parent/portal` | Parent Care Portal | Public |

### Database Schema

Core Supabase (PostgreSQL) tables. Migrations live in `supabase/migrations/`.

```sql
-- Staff profiles (extends Supabase auth.users)
profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users,
  full_name     text,
  role          text CHECK (role IN ('nurse','doctor','senior_doctor')),
  department    text,
  created_at    timestamptz DEFAULT now()
)

-- Registered neonates
babies (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text,
  birth_date            date,
  gestational_age_weeks int,
  weight_grams          int,
  parent_name           text,
  parent_email          text,
  parent_phone          text,
  incubator_id          text,
  status                text DEFAULT 'active',
  created_at            timestamptz DEFAULT now()
)

-- Vital sign snapshots (pulled from ThingSpeak, stored per baby)
vital_readings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id     uuid REFERENCES babies,
  heart_rate  numeric,
  spo2        numeric,
  spo2_min    numeric,
  body_temp   numeric,
  room_temp   numeric,
  humidity    numeric,
  recorded_at timestamptz DEFAULT now()
)

-- Clinical alerts
alerts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id         uuid REFERENCES babies,
  type            text,   -- e.g. 'HIGH_HEART_RATE', 'LOW_SPO2'
  severity        text CHECK (severity IN ('normal','high','critical')),
  message         text,
  is_active       boolean DEFAULT true,
  acknowledged_by uuid REFERENCES profiles,
  acknowledged_at timestamptz,
  created_at      timestamptz DEFAULT now()
)

-- Shift handover notes
shift_notes (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id   uuid REFERENCES babies,
  author_id uuid REFERENCES profiles,
  shift     text CHECK (shift IN ('day','evening','night')),
  category  text,
  content   text,
  created_at timestamptz DEFAULT now()
)

-- Feeding logs
feeding_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id      uuid REFERENCES babies,
  feed_type    text,
  volume_ml    numeric,
  duration_min int,
  logged_by    uuid REFERENCES profiles,
  fed_at       timestamptz DEFAULT now()
)

-- Parent portal access (separate from staff auth)
parent_accounts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  baby_id     uuid REFERENCES babies,
  access_code text UNIQUE,
  created_at  timestamptz DEFAULT now()
)
```

Row-Level Security (RLS) is **enabled** on all tables. Staff access is scoped to their role; parent accounts can only read the baby record linked to their unique access code.

### Supabase Edge Functions

| Function | Description | JWT Required | External Service |
|---|---|---|---|
| `neo-voice-chat` | AI voice assistant chat completions | No | OpenAI-compatible API |
| `parent-chatbot` | Parent portal AI chatbot completions | No | OpenAI-compatible API |
| `send-alert-email` | Sends formatted clinical alert emails via Brevo | No | Brevo API |
| `generate-alert-content` | Generates AI clinical narrative for alert emails | No | OpenAI-compatible API |
| `get-tomtom-key` | Securely returns TomTom API key to client | No | — |
| `tomtom-proxy` | Proxies TomTom Maps requests server-side | No | TomTom Maps API |
| `verify-parent-login` | Validates parent access code against DB | No | Supabase DB |

**Graceful Fallbacks:**
- `AI_API_KEY` absent → `generate-alert-content` returns a rule-based clinical summary; emails still send ✅
- `TOMTOM_API_KEY` absent → hospital map shows an informational "map unavailable" message ✅

### Role-Based Access Control

| Capability | `nurse` | `doctor` | `senior_doctor` |
|---|:---:|:---:|:---:|
| View patient list & dashboard | ✅ | ✅ | ✅ |
| Live vital sign charts | ✅ | ✅ | ✅ |
| Acknowledge alerts | ✅ | ✅ | ✅ |
| Create manual alerts | ✅ | ✅ | ✅ |
| Feeding & shift notes | ✅ | ✅ | ✅ |
| Download PDF health reports | ✅ | ✅ | ✅ |
| View clinical confidence scores | ❌ | ✅ | ✅ |
| View neonatal risk score | ❌ | ✅ | ✅ |
| View apnea risk warning | ❌ | ✅ | ✅ |
| View AI alert summaries | ❌ | ✅ | ✅ |

### Alert Pipeline

```
Vital sign threshold crossed
         │
         ▼
Write alert row → Supabase alerts table
         │
         ├──▶ generate-alert-content (AI narrative — optional)
         │
         ▼
send-alert-email Edge Function → Brevo → clinical staff inbox
         │
         ▼
Staff acknowledges on /alerts page
         │
         ▼
alerts.is_active = false
alerts.acknowledged_by + acknowledged_at recorded
```

### AI Integration

NeoGuard uses an **OpenAI-compatible** endpoint, meaning the AI provider can be swapped without any code changes — just update three Edge Function secrets.

| Secret | Default | Provider Examples |
|---|---|---|
| `AI_API_URL` | `https://api.openai.com/v1/chat/completions` | Groq, Azure OpenAI, Ollama |
| `AI_CHAT_MODEL` | `gpt-4o-mini` | `llama3-70b-8192`, `mistral-7b` |
| `AI_ALERT_MODEL` | `gpt-4o-mini` | Same options as above |

```bash
# Groq (fast inference, free tier)
AI_API_URL=https://api.groq.com/openai/v1/chat/completions
AI_CHAT_MODEL=llama3-70b-8192

# Local Ollama (fully offline)
AI_API_URL=http://host.docker.internal:11434/v1/chat/completions
AI_CHAT_MODEL=llama3
```

---

## 🚀 Quick Start

### Prerequisites

| Requirement | Minimum Version |
|---|---|
| Node.js | 18.x LTS |
| npm | 9.x |
| Supabase account | Free tier |
| Arduino IDE | 2.x |
| Git | Any recent version |

> Also required for hardware: ESP32 dev board, MAX30102, DS18B20, DHT11, and a ThingSpeak account.

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd "NEONATAL MONITORING SYSTEM"

# 2. Move into the web app
cd neonateral-main

# 3. Install dependencies
npm install

# 4. Copy environment variable template
cp .env.example .env
# → Edit .env with your Supabase project values

# 5. Start the development server
npm run dev
# App available at http://localhost:5173
```

#### Access the Platform

| Service | URL | Description |
|---|---|---|
| **Web App** | http://localhost:5173 | Main NICU dashboard |
| **Parent Portal** | http://localhost:5173/parent/portal | Public parent-facing portal |
| **Voice Assistant** | http://localhost:5173/voice-assistant | AI voice chat (public) |
| **Staff Login** | http://localhost:5173/login | NICU staff authentication |

### Environment Variables

Create `neonateral-main/.env` (copy from `.env.example`):

```env
# Supabase project URL — found at Settings → API
VITE_SUPABASE_URL=https://your-project-id.supabase.co

# Supabase anon/publishable key — found at Settings → API
VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-anon-key
```

> ⚠️ These are the **only** values that belong in the frontend `.env`. All other secrets (AI keys, email keys, map keys) must live in **Supabase Edge Function secrets** — never in Vite env vars, as they are embedded in the client bundle.

### Edge Function Secrets

Set via the Supabase dashboard (**Settings → Edge Functions → Secrets**) or CLI:

```bash
supabase secrets set BREVO_API_KEY=your-brevo-api-key
supabase secrets set AI_API_KEY=your-llm-api-key
supabase secrets set AI_API_URL=https://api.openai.com/v1/chat/completions
supabase secrets set AI_CHAT_MODEL=gpt-4o-mini
supabase secrets set AI_ALERT_MODEL=gpt-4o-mini
supabase secrets set TOMTOM_API_KEY=your-tomtom-api-key
```

| Secret | Required | Fallback if Absent |
|---|---|---|
| `BREVO_API_KEY` | ✅ Yes | No email delivery |
| `AI_API_KEY` | Recommended | Rule-based alert summaries |
| `AI_API_URL` | Recommended | — |
| `AI_CHAT_MODEL` | Recommended | — |
| `AI_ALERT_MODEL` | Recommended | — |
| `TOMTOM_API_KEY` | Optional | Hospital map disabled |

### Running Edge Functions Locally

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-id

# Start local Supabase stack (requires Docker)
supabase start

# Serve Edge Functions with hot reload
supabase functions serve --env-file ./supabase/.env.local
```

### Useful Scripts

```bash
npm run dev        # Start Vite dev server with HMR at localhost:5173
npm run build      # Production build → dist/
npm run build:dev  # Dev build → dist/ (source maps, unminified)
npm run preview    # Preview production build locally
npm run lint       # Run ESLint across src/
```

---

## 👥 User Guides

### For NICU Nurses & Staff

<details>
<summary><b>📖 Click to expand Staff user guide</b></summary>

#### Login

1. Navigate to http://localhost:5173/login
2. Enter your staff email and password (created at `/signup`)
3. Click **"Sign In"**

#### Register a New Patient

1. Click **"Register Patient"** on the dashboard
2. Fill in patient details:
   - **Name**: Neonate name or identifier
   - **Birth Date & Gestational Age**: For context and risk scoring
   - **Weight**: Birth weight in grams
   - **Incubator ID**: Maps this patient to an ESP32 sensor node
   - **Parent Contact**: Name, email, and phone for portal access
3. Click **"Register"** — patient appears on the dashboard immediately

#### Monitor Live Vitals

1. Click any patient card on the `/dashboard`
2. Live vital charts auto-refresh using React Query polling
3. Status badge updates in real time: 🟢 Normal / 🟡 High / 🔴 Critical

#### Acknowledge an Alert

1. Navigate to `/alerts`
2. Click **"Acknowledge"** on any active alert
3. Alert moves to history with your ID and timestamp recorded

#### Create a Shift Handover Note

1. Navigate to `/shift-handover`
2. Select shift: Day / Evening / Night
3. Link to a patient, enter category and content
4. Click **"Submit Note"**

#### Log a Feed

1. Navigate to `/feeding-status`
2. Select patient, feed type, volume (mL), and duration
3. Click **"Log Feed"** — entry is saved with your staff ID and timestamp

</details>

### For Doctors & Senior Doctors

<details>
<summary><b>📖 Click to expand Doctor user guide</b></summary>

Doctors have all nursing capabilities plus access to clinical intelligence features.

#### View Neonatal Risk Score

1. Open any patient's detail page (`/baby/:id`)
2. The **Neonatal Risk Score** component appears in the clinical panel (doctor-only)
3. Score is calculated from current vitals, gestational age, and weight

#### View Apnea Risk Warning

1. On the same patient detail page, the **Apnea Risk Warning** component shows when current HR and SpO₂ patterns match apnea risk indicators

#### View AI Alert Summaries

1. Navigate to `/alerts` or `/history`
2. Expand any alert row to see the **AI-generated clinical narrative** (doctor-only)

#### Download a Health Report

1. Navigate to `/health-records`
2. Select a patient and click **"Generate PDF Report"**
3. jsPDF compiles a formatted clinical summary downloaded to your browser

</details>

### For Parents & Guardians

<details>
<summary><b>📖 Click to expand Parent user guide</b></summary>

#### Access the Parent Portal

1. Navigate to http://localhost:5173/parent/portal
2. No login required for general access
3. Enter your **Access Code** (provided by NICU staff at admission) to view your baby's linked information

#### Use the AI Chatbot

1. On the portal page, type your question in the chat input
2. The AI is configured to answer neonatal care questions
3. No personal medical data is sent to the AI — it answers general care queries

#### Find a NICU Hospital

1. Click **"Hospital Locator"** on the parent portal
2. TomTom Maps loads with nearby NICU-equipped hospitals marked
3. Click any marker for facility name, address, and contact details

#### Analyse a Cry

1. Click **"Cry Detection"** on the portal
2. Either record using your browser microphone or upload an audio file
3. The system classifies the cry as: **Normal**, **Discomfort**, or **Pain**
4. Use as a general reference only — always consult nursing staff for clinical concerns

</details>

---

## 🧪 Development

### Project Structure

```
NEONATAL MONITORING SYSTEM/
│
├── NEONATAL_MONITORING_SYSTEM_ONLINE/
│   └── NEONATAL_MONITORING_SYSTEM_ONLINE.ino   # ESP32 firmware
│
└── neonateral-main/                             # React web application
    │
    ├── public/                                  # Static assets (favicon, logo)
    │
    ├── src/
    │   ├── components/
    │   │   ├── charts/          # Recharts wrappers (VitalChart, TrendLine, etc.)
    │   │   ├── dashboard/       # BabyCard, AlertCard, AlertControlPanel
    │   │   ├── layout/          # DashboardLayout (sidebar, topbar, theme toggle)
    │   │   ├── nicu/            # CryDetection, IncubatorEnvironment,
    │   │   │                    #   NeonatalRiskScore, ApneaRiskWarning,
    │   │   │                    #   HistoricalReport
    │   │   ├── parent/          # ParentChatbot, HospitalMap
    │   │   └── ui/              # shadcn/ui primitives
    │   │
    │   ├── contexts/
    │   │   ├── AuthContext.tsx        # Staff session (Supabase JWT)
    │   │   ├── ParentAuthContext.tsx  # Parent access-code state
    │   │   └── DataContext.tsx        # Global babies + alerts state
    │   │
    │   ├── hooks/
    │   │   ├── use-toast.ts     # Toast notification hook
    │   │   ├── use-mobile.ts    # Responsive breakpoint detection
    │   │   └── useTheme.ts      # Dark/light mode hook
    │   │
    │   ├── integrations/
    │   │   └── supabase/        # Auto-generated Supabase client & TS types
    │   │
    │   ├── lib/
    │   │   └── utils.ts         # cn() Tailwind merge helper, misc utilities
    │   │
    │   ├── pages/               # One file per route
    │   ├── types/               # Shared TypeScript type definitions
    │   ├── App.tsx              # Route tree + auth guards
    │   └── main.tsx             # Vite entry point
    │
    ├── supabase/
    │   ├── config.toml          # Supabase project config
    │   ├── functions/           # Edge Functions (Deno/TypeScript)
    │   │   ├── neo-voice-chat/
    │   │   ├── parent-chatbot/
    │   │   ├── send-alert-email/
    │   │   ├── generate-alert-content/
    │   │   ├── get-tomtom-key/
    │   │   ├── tomtom-proxy/
    │   │   ├── verify-parent-login/
    │   │   └── _shared/         # Shared CORS headers, response helpers
    │   └── migrations/          # Ordered PostgreSQL migration files
    │
    ├── .env.example             # Environment template (commit this)
    ├── .env                     # Local secrets (DO NOT commit)
    ├── index.html
    ├── package.json
    ├── tailwind.config.ts
    ├── tsconfig.json
    ├── vite.config.ts
    └── vercel.json              # Vercel SPA routing rewrite rules
```

### Development Commands

```bash
# View real-time logs for any service
supabase functions logs <function-name>

# Regenerate Supabase TypeScript types after schema changes
supabase gen types typescript --linked > src/integrations/supabase/types.ts

# Push a new database migration
supabase db push

# Deploy a single Edge Function
supabase functions deploy <function-name>

# Deploy all Edge Functions at once
supabase functions deploy
```

---

## 🔌 API Reference

### Base URL

```
https://your-project-id.supabase.co
```

All REST queries go through the Supabase auto-generated REST API. Edge Functions are accessible at:

```
https://your-project-id.supabase.co/functions/v1/<function-name>
```

### Authentication

All staff-facing Supabase queries require the JWT access token from the active session:

```http
Authorization: Bearer <supabase_access_token>
apikey: <supabase_anon_key>
```

### Key Edge Function Endpoints

#### Voice Chat

```http
POST /functions/v1/neo-voice-chat
Content-Type: application/json

{ "message": "What is a normal heart rate for a newborn?" }
```

#### Parent Chatbot

```http
POST /functions/v1/parent-chatbot
Content-Type: application/json

{ "message": "When should I be worried about my baby's temperature?" }
```

#### Send Alert Email

```http
POST /functions/v1/send-alert-email
Content-Type: application/json

{
  "alertId": "uuid",
  "babyName": "Baby Ananya",
  "alertType": "LOW_SPO2",
  "severity": "critical",
  "value": 88,
  "recipientEmail": "nurse@hospital.com"
}
```

#### Verify Parent Login

```http
POST /functions/v1/verify-parent-login
Content-Type: application/json

{ "accessCode": "PARENT-XXXX-YYYY" }
```

#### Get TomTom Key

```http
GET /functions/v1/get-tomtom-key
```

### Interactive Documentation

All Supabase table schemas and auto-generated REST routes are visible at:
`https://app.supabase.com/project/your-project-id/api`

---

## 🛡️ Security Considerations

| Risk | Mitigation |
|---|---|
| API keys in client bundle | All sensitive keys stored as Supabase Edge Function secrets only; frontend holds only the anon key |
| Unauthorised patient data access | Supabase RLS enforced on all tables; nurses/doctors access only within their scope |
| Parent portal abuse | Per-patient access codes via `verify-parent-login`; codes can be rotated at any time |
| Wi-Fi credentials in firmware | `#define` placeholders only; `.gitignore` excludes local `.ino` overrides |
| ThingSpeak key exposure | Read API Key (not Write key) used in web app; Write key stays only in ESP32 firmware |
| Data in transit | All traffic over HTTPS (Vercel + Supabase TLS); ThingSpeak uploads over HTTPS |
| Unauthenticated Edge Functions | All 7 functions are public by design (`JWT Required: No`); add Supabase JWT verification to harden for production |

---

## 🐛 Troubleshooting

### Hardware

| Symptom | Likely Cause | Fix |
|---|---|---|
| MAX30102 returns 0 for HR / SpO₂ | Sensor not firmly on skin or I²C address mismatch | Ensure firm contact; run I²C scanner sketch to confirm address 0x57 |
| SpO₂ reads 100 % constantly | IR channel saturating; LED current too high | Check auto-brightness logic; reduce initial LED drive current |
| DS18B20 returns −127 °C | Missing 4.7 kΩ pull-up or wiring fault | Verify pull-up resistor on OneWire DATA line |
| ThingSpeak upload fails | Incorrect write key or no Wi-Fi | Check Serial Monitor for Wi-Fi join; verify key has no extra whitespace |
| DHT11 always returns `nan` | Power instability or GPIO conflict | Add 100 nF decoupling cap near VCC; confirm GPIO 4 is free |

### Web App

| Symptom | Likely Cause | Fix |
|---|---|---|
| Blank page after login | Supabase URL / anon key missing or incorrect | Check `.env` matches Supabase dashboard exactly |
| Alert emails not sending | `BREVO_API_KEY` not set | Verify via `supabase secrets list` |
| Hospital map not loading | `TOMTOM_API_KEY` missing | Set secret; portal degrades gracefully |
| AI chatbot returns errors | `AI_API_KEY` / `AI_API_URL` not configured | Set secrets; alert emails still work via fallback |
| `supabase db push` fails | Migration conflicts with remote schema | Run `supabase db diff` first to inspect changes |
| Types out of sync after schema change | Supabase TS types not regenerated | Run `supabase gen types typescript --linked > src/integrations/supabase/types.ts` |

---

## 🗺️ Roadmap

- [ ] **WebSocket real-time**: Replace ThingSpeak polling with MQTT → Supabase Realtime for sub-second latency
- [ ] **Mobile app**: React Native / Expo companion app for parents
- [ ] **Bluetooth fallback**: BLE advertisement from ESP32 when Wi-Fi is unavailable
- [ ] **Raw PPG waveform**: Stream and display live waveform in the monitoring view
- [ ] **Movement sensor**: MPU-6050 accelerometer for sleep position and apnea movement detection
- [ ] **Multi-node support**: Map each ESP32 node to a specific incubator ID and baby record
- [ ] **Offline mode**: Service Worker + IndexedDB for offline access to last-known vitals
- [ ] **Audit log**: Immutable log of all clinical actions for compliance review
- [ ] **Test suite**: Vitest + React Testing Library unit and integration tests

---

## 🤝 Contributing

Contributions are welcome for academic and research improvements!

### Reporting Issues

1. Check [existing issues](https://github.com/yourusername/neoguard/issues)
2. Open a new issue with:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behaviour
   - Serial Monitor output (for hardware issues) or console logs (for web issues)
   - Screenshots if applicable

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Keep firmware and web app changes in separate commits
4. Follow existing TypeScript + ESLint conventions: `npm run lint`
5. Open a Pull Request with a clear description of what changes and why

### Development Guidelines

- Do not include real patient data, API keys, or Wi-Fi credentials in any commit
- For significant changes (new sensor, schema changes, new AI feature), open an issue first to discuss the approach
- Keep the clinical disclaimer section intact in all forks

---

## 📷 Screenshots

> Add screenshots of the following views:
> - NICU Dashboard — overview with patient status badges
> - Live Monitoring — real-time vital sign charts
> - Alert System — active alert feed + acknowledgement UI
> - NICU Environment — per-incubator ambient monitor
> - Shift Handover — shift notes view
> - Parent Portal — AI chatbot + hospital map
> - Mobile responsive layout

---

## 🙏 Acknowledgments

- **SparkFun Electronics** — MAX3010x sensor library for Arduino
- **Maxim Integrated** — Pulse oximetry algorithm reference
- **Supabase** — Open-source backend-as-a-service platform
- **shadcn/ui** — Beautifully designed accessible component primitives
- **Recharts** — Composable chart library for React
- **Brevo (formerly Sendinblue)** — Transactional email delivery
- **TomTom** — Maps and location services API
- **OpenZeppelin** — Smart contract security standards inspiration
- **AAP / WHO NICU Guidelines** — Clinical threshold reference values

---

## 📄 License

This project is developed for **academic and research purposes**.
Contact the project maintainers before deploying in any clinical, hospital, or patient-facing setting.
Not approved as a medical device. See [Clinical Disclaimer](#️-clinical-disclaimer).

---

## 🌟 Star History

If NeoGuard has been useful for your research or project, please consider giving it a ⭐ on GitHub — it helps others discover it!

---

<div align="center">

**Built with ❤️ for safer neonatal care and stronger family connections**

[Report Bug](https://github.com/yourusername/neoguard/issues) · [Request Feature](https://github.com/yourusername/neoguard/issues) · [Clinical Disclaimer](#️-clinical-disclaimer)
</div>
