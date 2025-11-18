'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { exportProject, getProject } from '@/lib/api';

export default function ProjectDetailPage({ params }) {
  const projectId = params?.id;
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadProject = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await getProject(projectId);
      if (resp?.project) {
        setProject(resp.project);
      } else {
        setProject(null);
        setError(resp?.error || 'Unable to load project');
      }
    } catch (err) {
      setProject(null);
      setError(err.message || 'Unable to load project');
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadProject();
  }, [loadProject]);

  async function exportAs(format) {
    try {
      const { blob, filename } = await exportProject(projectId, format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert('Export failed');
    }
  }

  async function handleGenerate(sectionId) {
    const customPrompt = window.prompt('Optional prompt override for generation:') || undefined;
    try {
      const token = localStorage.getItem('docforge_token');
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/api/projects/${projectId}/sections/${sectionId}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ promptOptions: { prompt: customPrompt } }),
      });
      const data = await resp.json();
      if (resp.ok) {
        await loadProject();
      } else {
        alert('Generate failed: ' + (data.error || JSON.stringify(data)));
      }
    } catch (err) {
      console.error(err);
      alert('Generate error');
    }
  }

  async function handleRefine(sectionId) {
    const instruction = window.prompt('Refine instruction (e.g. shorten, make formal):');
    if (!instruction) return;
    try {
      const token = localStorage.getItem('docforge_token');
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000'}/api/projects/${projectId}/sections/${sectionId}/refine`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ instruction }),
      });
      const data = await resp.json();
      if (resp.ok) {
        await loadProject();
      } else {
        alert('Refine failed: ' + (data.error || JSON.stringify(data)));
      }
    } catch (err) {
      console.error(err);
      alert('Refine error');
    }
  }

  return (
    <div className="page">
      <section className="panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <div>
            <button className="btn btn-ghost" onClick={() => router.back()} style={{ paddingLeft: 0 }}>← Back to projects</button>
            <h2 style={{ margin: '0.5rem 0' }}>{project?.title || 'Project'}</h2>
            <p style={{ color: 'var(--muted)', margin: 0 }}>{project?.topic}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Button onClick={() => exportAs('docx')} variant="secondary">Export DOCX</Button>
            <Button onClick={() => exportAs('pptx')} variant="outline">Export PPTX</Button>
          </div>
        </div>

        {loading && <div className="empty-state">Loading project…</div>}
        {!loading && error && <div className="form-error">{error}</div>}

        {!loading && project && (
          <div className="project-grid">
            {(project.sections || []).map((section, idx) => (
              <article key={section.id} className="project-card">
                <div className="project-card__meta">
                  <div>
                    <span className="badge">Section {typeof section.order === 'number' ? section.order + 1 : idx + 1}</span>
                    <h4 style={{ margin: '0.35rem 0' }}>{section.title}</h4>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                    {section.status ? section.status : '—'}
                  </div>
                </div>
                <p style={{ color: 'var(--muted)', marginTop: 0 }}>
                  {section.currentContent ? section.currentContent.substring(0, 400) : <em>Empty section</em>}
                </p>
                <div className="project-card__actions">
                  <Button variant="secondary" onClick={() => handleGenerate(section.id)}>Generate</Button>
                  <Button variant="outline" onClick={() => handleRefine(section.id)}>Refine</Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

