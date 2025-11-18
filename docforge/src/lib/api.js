// Lightweight API client for frontend pages (mirrored for docforge-ai workspace)
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api';

function getToken() {
  try {
    return localStorage.getItem('docforge_token');
  } catch (e) {
    return null;
  }
}

function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export async function register({ email, password, name }) {
  const resp = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name }),
  });
  return resp.json();
}

export async function login({ email, password }) {
  const resp = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return resp.json();
}

export async function me() {
  const resp = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
  return resp.json();
}

export async function getProjects({ page = 1, limit = 20 } = {}) {
  const resp = await fetch(`${API_BASE}/projects?page=${page}&limit=${limit}`, { headers: authHeaders() });
  return resp.json();
}

export async function getProject(projectId) {
  const resp = await fetch(`${API_BASE}/projects/${projectId}`, { headers: authHeaders() });
  return resp.json();
}

export async function createProject({ title, topic, type = 'docx', outline = [] }) {
  const resp = await fetch(`${API_BASE}/projects`, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()), body: JSON.stringify({ title, topic, type, outline }) });
  return resp.json();
}

export async function exportProject(projectId, format = 'docx') {
  const resp = await fetch(`${API_BASE}/projects/${projectId}/export`, { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()), body: JSON.stringify({ format }) });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error || `Export failed with status ${resp.status}`);
  }
  const blob = await resp.blob();
  const disposition = resp.headers.get('content-disposition') || '';
  const match = disposition.match(/filename="?(.*?)"?$/);
  const filename = match ? match[1] : `export.${format}`;
  return { blob, filename };
}

export function saveToken(token) {
  try { localStorage.setItem('docforge_token', token); } catch (e) {}
}

export function clearToken() {
  try { localStorage.removeItem('docforge_token'); } catch (e) {}
}
