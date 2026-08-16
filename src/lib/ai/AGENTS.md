# Khatulistiwa AI Gateway Agent Guidelines (`src/lib/ai/`)

## 1. Domain Responsibility
This directory manages OpenRouter API communications, model routing, prompt engineering, structured tool calling (JSON Schema), and fallback management for Khatulistiwa AI.

## 2. Model Routing Matrix

```
User Request
   │
   ├── Natural Conversation / Quick Draft ──► google/gemini-3.5-flash-lite (Default)
   ├── Mobile Camera Photo / Paper OCR ────► google/gemini-3.7-flash (Vision / Heavy)
   ├── SQL / Inventory Reconciliation ─────► deepseek/deepseek-v4-pro-0813 (Deep Logic)
   ├── Sundanese / Slang / Local Notes ────► qwen/qwen3.7-plus (Indonesian Localization)
   ├── Insole Tread & Pattern CAD ─────────► openai/gpt-5.6-luna (Creative Generative)
   └── Network / Provider Fallback ────────► google/gemma-4-26b-a4b-it (Resilience)
```

## 3. Tool Calling Definitions (Structured JSON Schemas)
All AI actions must use strict JSON Schema tool specifications:
- `generate_delivery_order_draft`:
  - `recipient_name`: string (customer / factory name)
  - `po_number`: string (purchase order / customer reference)
  - `destination_address`: string
  - `items`: array of `{ article_name, size_breakdown: { [size: number]: number }, notes }`
- `query_material_inventory`:
  - `material_category`: enum (`EVA`, `LATEX`, `PU`, `TPU`, `FABRIC`, `ALL`)
  - `low_stock_only`: boolean

## 4. Factory Terminology & Language Adaptation
- Recognize Indonesian footwear factory terminology:
  - *PO / SPK*: Surat Perintah Kerja (Work Order)
  - *SJ*: Surat Jalan (Delivery Order)
  - *Psg*: Pasang (Pairs)
  - *Bahan*: Raw materials
  - *Insole*: Sol dalam sepatu
  - *Outsole*: Sol luar
  - *Cetakan / Pisau Potong*: Cutting dies
- Prompt caching should be enabled on system instructions to minimize latency and token costs.
