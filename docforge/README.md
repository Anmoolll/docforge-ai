# DocForge AI – Full Stack Prototype

Minimal, end‑to‑end workspace for generating DOCX/PPTX deliverables with Gemini-powered sections.  
Frontend is built with **Next.js 13 App Router**, backend uses **Express + MongoDB**, and exports are produced via `docx`/`pptxgenjs`.

---

## Requirements

- Node.js 18+ (works on 16 but dev workflow assumes 18)
- MongoDB (local or Atlas)
- Gemini/OpenAI (optional – mocked responses are returned when API credentials are missing)

---

## Install dependencies

From the project root:

```powershell
cd "d:\VS Code\WebDev\Projects\docforge-ai\docforge"
npm install
```

Everything (frontend + backend + exporters) is declared in `package.json`, no manual subfolder installs needed.

---

## Environment variables

Create `.env` in the project root (see `.env.example`) with at minimum:

```bash
MONGO_URI=mongodb://localhost:27017/docforge
JWT_SECRET=super-secret
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent # optional
GEMINI_API_KEY=your-key # optional
NEXT_PUBLIC_API_BASE=http://localhost:4000/api
```

`GEMINI_*` values are optional; without them the backend returns mocked content for easier local dev.

---

## Running locally

### Backend
```powershell
node src/backend/server.js
```
Starts Express on port **4000** (or `PORT` from `.env`). Fails fast if `MONGO_URI` is undefined.

### Frontend
In a separate terminal:
```powershell
npm run dev
```
Launches Next.js on port **3000** (defaults). The App Router frontend calls the backend through `NEXT_PUBLIC_API_BASE`.

---

## Key features (frontend)
- Hero landing page and glassmorphic auth card (register / login, persistent JWT via `localStorage`)
- Modern dashboard with project stats, inline project creation, export shortcuts
- Project detail workspace for section generation/refinement and doc/ppt export

---

## API surface (backend)

- `POST /api/auth/register` — register
- `POST /api/auth/login` — login
- `GET /api/auth/me` — fetch current user (JWT required)
- `GET /api/projects` — list projects (JWT)
- `POST /api/projects` — create project
- `GET /api/projects/:projectId` — fetch project with sections
- `PUT /api/projects/:projectId` — update metadata
- `DELETE /api/projects/:projectId` — delete
- `POST /api/projects/:projectId/sections` — add section
- `PUT /api/projects/:projectId/sections/:sectionId` — edit section
- `DELETE /api/projects/:projectId/sections/:sectionId` — remove section
- `POST /api/projects/:projectId/sections/:sectionId/generate` — generate section content (Gemini client)
- `POST /api/projects/:projectId/sections/:sectionId/refine` — refine with instructions
- `POST /api/projects/:projectId/export` — export entire project as DOCX/PPTX (`{ format: 'docx'|'pptx' }`)

---

## Notes & next steps
- `llmClient` falls back to mocked text when `GEMINI_API_KEY`/`GEMINI_API_URL` are missing.
- Expand validation/error handling, add rate limiting, and secure shared access before production use.
- Frontend is stylized with custom CSS (no Tailwind runtime) and uses reusable `Button`/`TextField` components for consistency.
