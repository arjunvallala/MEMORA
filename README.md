# MEMORA

> **"Different minds. One memory."**  
> *Independent AI agents become a team when what they learn can outlive the conversation.*

---

## 💡 Product Vision

**MEMORA** is a multi-agent AI workspace where independent LLMs powered by different providers—**Groq** (Llama-3.3), **Gemini** (Google), and **GPT** (OpenAI)—collaborate indirectly through a persistent shared memory layer powered by **Hindsight**.

Conversations with each agent remain completely isolated. Agents **do not** receive raw transcript histories from each other. Instead:

```
[ Groq (Architect) ]
        ↓ (learns durable architectural decision)
  Hindsight RETAIN
        ↓
  Shared Hindsight Bank (project:payment-platform)
        ↓
  Hindsight RECALL / TEMPR Retrieval
        ↓
[ Gemini (Researcher) ]  ← (recalls PostgreSQL decision, answers, learns Redis lesson)
        ↓ (Hindsight RETAIN)
  Shared Hindsight Bank
        ↓
[ GPT (Reviewer) ]      ← (recalls Redis lesson, validates architecture)
        ↓
  Hindsight REFLECT ("Ask Team Memory")
```

---

## 🏛️ System Architecture

```
                                  MEMORA WORKSPACE
                                         │
                   ┌─────────────────────┼─────────────────────┐
                   │                     │                     │
           Agent 1 (Groq)        Agent 2 (Gemini)      Agent 3 (GPT)
           System Architect     Technical Researcher   Technical Reviewer
                   │                     │                     │
                   └─────────────────────┼─────────────────────┘
                                         │
                             Hindsight Persistent Memory
                                Shared Bank (`project:<id>`)
                                         │
                     ┌───────────────────┼───────────────────┐
                     │                   │                   │
                   RETAIN              RECALL             REFLECT
               Ingest Knowledge   TEMPR Retrieval    Agentic Reasoning
```

### Key Components

1. **Hindsight Memory Layer (`HindsightService`)**:
   - Integrates with Hindsight API endpoints (`/v1/default/banks/:bank_id/memories/...`).
   - Implements persistent SQLite database engine backing durable facts, categories, and TEMPR retrieval scores.
   - Operations:
     - `RETAIN`: Ingests durable decisions, requirements, failures, and lessons with agent attribution.
     - `RECALL`: TEMPR multi-strategy search (Temporal, Entity, Semantic, Phrase BM25).
     - `REFLECT`: Agentic synthesis across cross-agent memory records ("Ask Team Memory").
2. **Multi-LLM Provider Adapters**:
   - `GroqAdapter` (`llama-3.3-70b-versatile`)
   - `GoogleAdapter` (`gemini-1.5-pro`)
   - `OpenAIAdapter` (`gpt-4o`)
   - Smart provider fallback engine if API keys are missing.
3. **Agent Runtime (`AgentRuntime`)**:
   - Manages independent agent conversation pipelines.
   - Executes memory recall before generating answers and selective retain extraction after response evaluation.
4. **Real-time Event Stream (`EventService`)**:
   - Broadcasts live SSE events for `RETAIN`, `RECALL`, and `REFLECT` operations to the frontend.

---

## ⚙️ Environment Variables Setup

Create a `.env` file in the root directory:

```bash
# Server Port
PORT=4000

# Hindsight Configuration
HINDSIGHT_API_URL=http://localhost:4000/v1/default
HINDSIGHT_API_KEY=memora_hindsight_secret_key

# Multi-LLM Provider Keys
OPENROUTER_API_KEY=your_openrouter_api_key_here
GROQ_API_KEY=your_groq_api_key_here
GOOGLE_API_KEY=your_google_api_key_here
OPENAI_API_KEY=your_openai_api_key_here

# Default Project Bank
DEFAULT_PROJECT_ID=payment-platform
```

---

## 🚀 Quick Start Guide

### 1. Install Dependencies & Build Packages

```bash
npm run setup
```

### 2. Run Development Workspaces (Backend + Frontend)

```bash
npm run dev
```

- **Frontend Workspace**: [http://localhost:3000](http://localhost:3000)
- **Backend API & Hindsight REST Server**: [http://localhost:4000](http://localhost:4000)

### 3. Run Hindsight Verification Tests

```bash
npm test
```

---

## 🎯 HACKATHON DEMO WALKTHROUGH (60 Seconds)

To reset the workspace to clean state before presenting:

```bash
npm run demo:reset
```

### Step 1: Open Groq Panel (System Architect)
- **Input**:
  > *"We are building a payment platform. For transactional data, we decided to use PostgreSQL because strong consistency is important. Remember this architectural decision."*
- **Behind the scenes**:
  - Groq responds.
  - Hindsight `RETAIN` stores: `"PostgreSQL selected for transactional data because strong consistency is important."`
  - UI shows `GROQ` → `RETAIN` banner.

### Step 2: Open Gemini Panel (Technical Researcher)
- **Input**:
  > *"What database should we use for the transactional part of this project?"*
- **Behind the scenes**:
  - Gemini calls Hindsight `RECALL`.
  - Discovers Groq's PostgreSQL decision.
  - **Gemini Answers**: *"Based on the team's previous architectural decision (retained by Groq), PostgreSQL was selected for transactional data because strong consistency is important."*

### Step 3: Tell Gemini a Technical Lesson
- **Input**:
  > *"We also tried Redis for this endpoint and it caused timeout issues under load. Remember that we should avoid that approach here."*

### Step 4: Open GPT Panel (Technical Reviewer)
- **Input**:
  > *"What caching approach should we avoid for endpoint X?"*
- **Behind the scenes**:
  - GPT calls Hindsight `RECALL`.
  - Discovers Gemini's lesson.

### Step 5: Click "Ask Team Memory" (Hindsight REFLECT)
- Click **Ask Team Memory** button in header.
- **Query**:
  > *"What has the team learned about the architecture so far?"*
- **Result**:
  - Hindsight `REFLECT` performs agentic synthesis across stored memories from Groq, Gemini, and GPT.
