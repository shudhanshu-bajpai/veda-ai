# VedaAI

An AI-powered assessment creator for teachers. You feed in some details about an exam (class, subject, question types, marks split) and the LLM spits back a properly structured question paper that you can review on-screen or download as a PDF.

Built as a hiring assignment for VedaAI. Took about 3 days from empty folder to working app, including a couple of detours I'll get to below.


---

## What it does

You land on the dashboard, hit "Create Assignment", fill in:

- Optional reference file (PDF, text, image)
- Due date
- A breakdown of question types — MCQ, short answer, fill in the blanks, match the following, etc., with count and marks per question
- Any extra instructions ("exam duration is 3 hours", "focus on chapter 4", whatever)

You click Generate. A background worker calls Gemini, parses the JSON it returns, and stores a clean, structured question paper. The frontend gets a websocket ping the moment it's ready, so the page just updates without you refreshing.

There's also an AI Teacher's Toolkit chatbot tucked into a separate tab — same Gemini under the hood, scoped to teacher-specific prompts (lesson plans, rubrics, grading help).

---

## Stack

**Backend** is Node + Express in TypeScript. MongoDB (Atlas) for storage via Mongoose. Redis + BullMQ for the job queue. `ws` for the websocket. `pdf-lib` for the PDF.

**Frontend** is Next.js 16 (App Router) with TypeScript, Zustand for state, Tailwind for styles. There's a tiny websocket hook (`useWebSocket`) that subscribes to assignment-specific channels.

**LLM** is Gemini. Started with OpenAI but the assignment didn't require it specifically, and Gemini's free tier lets the reviewer actually run the project without me handing out my API key. I use `@google/genai` (the new SDK — the old `@google/generative-ai` is deprecated, I learned the hard way).

---

## Architecture

Here's how a single "create assignment" request flows end to end:

```
Browser (Next.js)
   │  POST /api/assignments  (multipart, optional file)
   ▼
Express route
   │  validates with zod, saves Assignment doc with status="draft"
   ▼
Queue (BullMQ on Redis)
   │  adds a job { assignmentId }
   ▼
Generation worker
   │  builds the prompt, calls Gemini, parses JSON
   │  updates the doc with status="completed" + generatedPaper
   ▼
WebSocket server
   │  pushes { type: "assignment_update", status: "completed", paper }
   ▼
Frontend
      receives, updates Zustand store, re-renders the output page
```

The PDF works similarly — there's a separate worker (`pdfWorker.ts`) that takes the structured paper and lays it out with `pdf-lib`. The PDF endpoint either returns a cached buffer from Redis or generates one on demand.

### Backend layout

```
backend/src/
  config/         env loading, single source of truth
  models/         Mongoose schemas (Assignment, Question subdoc)
  routes/         /api/assignments, /api/chat
  services/
    openai.ts     (misnomer — this is the Gemini wrapper now)
    redis.ts      connection + graceful in-memory fallback
    queue.ts      BullMQ setup + direct-execution fallback
  workers/
    generationWorker.ts   runs the LLM call
    pdfWorker.ts          builds PDF bytes
  websocket/      ws server, per-assignment broadcast
  index.ts        bootstraps everything in order
```

### Frontend layout

```
frontend/src/
  app/
    assignments/         list + detail + create
    toolkit/             chatbot
    layout.tsx           sidebar + bottom nav wrapper
  components/layout/     Sidebar, Header, BottomNav
  store/                 Zustand store (single store, kept simple)
  hooks/useWebSocket.ts  per-page WS subscription
  lib/api.ts             typed fetch wrappers
```

---

## Approach + decisions worth mentioning

**Why Zustand and not Redux.** The assignment said either is fine. Redux felt like overkill for what's basically two slices of state (the form and the assignment list). Zustand keeps the store under 200 lines and there's no boilerplate.

**Why BullMQ and not just `setImmediate` or a worker thread.** Two reasons. One, the spec asks for it. Two, the LLM call takes 5–20 seconds and you don't want it blocking the API server, especially if multiple teachers are generating at once. BullMQ gives you retries and dead-letter handling for free.

**Graceful fallbacks when Redis isn't running.** I burned an hour early on figuring out why my reviewer couldn't run the app locally without Redis installed. So now the backend detects whether Redis is reachable on boot. If yes, queues + caching work normally. If no, jobs run directly in the same process and caching uses an in-memory `Map`. Same code path either way as far as the routes are concerned. See `services/queue.ts` and `services/redis.ts`.

**Structured output, no raw LLM rendering.** The spec was emphatic about not dumping the model's response into the DOM. So the prompt enforces a strict JSON schema with sections, questions, difficulty, marks, options for MCQs, etc. The backend parses it, validates the shape, and only then stores. The frontend renders from typed objects, never from raw strings. There's a fallback "regenerate" button if Gemini ever returns junk that fails parsing (rare but it happens).

**Model fallback.** Gemini 2.5 Flash hits quota limits or 503s sometimes. The service tries 2.5-flash → 2.5-flash-lite → 2.0-flash-lite → 2.0-flash in order, with a 30s timeout per model so we don't hang indefinitely. Fine grained, probably overkill, but it's the difference between "works" and "works on demo day".

**PDF on the server, not the client.** I tried `html2canvas` + `jspdf` first. The output was ugly and slow. Switched to `pdf-lib` on the backend, laying things out manually. More work, but the result actually looks like a question paper and the file's a quarter of the size. The one catch: `pdf-lib`'s default font can't encode newlines, so there's a `sanitize()` helper that strips them out before drawing.

**Websockets keyed by assignment ID.** Each detail page opens a WS connection scoped to its own assignment ID. The server only pushes updates to relevant subscribers. Simpler than pub/sub for a single-process app.

---

## Running it locally

You need Node 18+, MongoDB (Atlas is easiest — there's a connection string field in `.env`), and optionally Redis. Without Redis, everything still works, just synchronously.

```bash
# backend
cd backend
cp .env.example .env       # fill in MONGODB_URI and GEMINI_API_KEY
npm install
npm run dev                # starts on :5000

# frontend (separate terminal)
cd frontend
cp .env.example .env.local # default points at localhost:5000
npm install
npm run dev                # starts on :3000
```

Both servers hot-reload. The frontend points at `http://localhost:5000/api` by default; override with `NEXT_PUBLIC_API_URL` in `frontend/.env.local` if you've moved the backend.

---

## Deployment

The split is **frontend on Vercel, backend on Render** (or any Node host). Vercel's serverless model doesn't play well with WebSockets and BullMQ workers, so the backend stays on a long-running container. Both have generous free tiers.

### 1. Backend → Render

The repo includes `backend/render.yaml`, so the easiest path is:

1. Push this repo to GitHub.
2. On Render, **New → Blueprint** → point at the repo. It picks up `render.yaml` and creates the web service automatically.
3. Set the env vars in the Render dashboard:

   | Key | Example | Notes |
   |-----|---------|-------|
   | `MONGODB_URI` | `mongodb+srv://...` | MongoDB Atlas free tier |
   | `GEMINI_API_KEY` | `AIzaSy...` | from [Google AI Studio](https://aistudio.google.com/app/apikey) |
   | `FRONTEND_URL` | `https://your-app.vercel.app` | once you've deployed the frontend |
   | `REDIS_URL` | _(leave blank)_ | falls back to in-memory if unset |

4. Hit Deploy. The service will be reachable at `https://vedaai-backend-xxxx.onrender.com` — copy that URL.

> Render's free tier spins down after 15 minutes of inactivity and takes ~30s to wake. For demos this is usually fine.

### 2. Frontend → Vercel

1. Push the repo to GitHub (same one is fine — Vercel will use `frontend/` as the project root).
2. On Vercel, **New Project** → import the repo → set **Root Directory** to `frontend`. Framework detects as Next.js automatically.
3. Add two env vars:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://<your-render-url>/api` |
   | `NEXT_PUBLIC_WS_URL` | `wss://<your-render-url>/ws` |

4. Deploy. You'll get a `https://your-app.vercel.app` URL.

### 3. Wire the two together

Go back to Render and set `FRONTEND_URL` to your Vercel URL so CORS lets through API requests. (The CORS allowlist also accepts any `*.vercel.app` subdomain, so preview URLs work too.)

That's it. Test the flow on the live URL — empty state → create assignment → wait ~15s for Gemini → output page → download PDF.

### Optional: managed Redis

If you want the BullMQ queue working in production (faster on bursty traffic, retries), grab a free Redis from [Upstash](https://upstash.com) and set `REDIS_URL` on Render. The app detects it on boot and switches to queue mode.

---

## What's not perfect

A few things I'd clean up given more time:

- The "openai.ts" service file is still named that despite being Gemini-only now. Renaming it is a 30-second job but I kept putting it off and now it's a running joke.
- File upload accepts PDF/image but I'm not actually feeding the file contents to the LLM yet — only the filename gets into the prompt. To do this properly you'd need to either OCR the image or extract PDF text, both of which were out of scope.
- The chatbot doesn't persist conversation history across reloads (lives in component state).
- No auth. The "John Doe" in the header is hardcoded — there's no login flow, all data is global. Adding NextAuth + a users collection would take an hour but the assignment didn't call for it.
- Tests are missing. I lean on TypeScript + zod schemas + manual QA, which is fine for a 3-day build, less fine for production.

---

## Notes for reviewers

- All design screens were pulled pixel-by-pixel from the Figma file. The output page deliberately highlights "AI Teacher's Toolkit" in the sidebar instead of "Assignments" because that's how it's shown in the design — that's intentional, not a bug.
- The orange accent (`#E8704F`) is reused across the badge, FAB, notification dot, and logo notch. Same with the dark base (`#2D2D2D`).
- If the LLM is being slow on first run, it's usually Gemini routing the request to a colder model. Refresh, or hit Regenerate.

