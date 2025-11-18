# Backend README

Minimal Express backend for DocForge AI prototype.

Prereqs
- Node.js (16+)
- MongoDB running and accessible

Install dependencies (from workspace root or `src/backend`):

```powershell
cd "d:\VS Code\WebDev\Projects\docforge\docforge"
npm install express mongoose bcryptjs jsonwebtoken axios body-parser cors dotenv uuid
Install export libraries for DOCX/PPTX generation:

```powershell
npm install docx pptxgenjs
For inline Markdown parsing (bold/italic/links/code) used by the exporter:

```powershell
npm install markdown-it
```
```
```

Run server (ensure `.env` present, see `.env.example`):

```powershell
node src/backend/server.js
```

Endpoints
- `POST /api/auth/register` — register
- `POST /api/auth/login` — login
- `GET /api/auth/me` — get current user
- `GET/POST/PUT/DELETE /api/projects` — CRUD projects
- `POST /api/projects/:projectId/sections` — add section
- `PUT/DELETE /api/projects/:projectId/sections/:sectionId` — edit/delete section
- `POST /api/projects/:projectId/sections/:sectionId/generate` — generate section content (uses Gemini client)
- `POST /api/projects/:projectId/sections/:sectionId/refine` — refine content
- `POST /api/projects/:projectId/export` — export the project as `docx` or `pptx` (streamed binary response). Body: `{ format: 'docx'|'pptx' }`

Notes
- The `llmClient` will return a mocked response when `GEMINI_API_KEY`/`GEMINI_API_URL` are not set.
- This is scaffold code; expand error handling, validation, and tests before production use.
