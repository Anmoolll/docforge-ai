'use client';
import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { getProjects, createProject, exportProject } from '../lib/api';

export default function ProjectList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await getProjects();
      setProjects(res.projects || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addProject() {
    if (!title.trim()) return;
    setCreating(true);
    try {
      const res = await createProject({ title: title.trim(), topic: title.trim(), type: 'docx' });
      if (res.project) {
        setProjects(prev => [res.project, ...prev]);
        setTitle('');
      }
    } catch (err) {
      console.error(err);
      alert('Could not create project');
    } finally {
      setCreating(false);
    }
  }

  async function doExport(projectId, format = 'docx') {
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
      console.error('Export failed', err);
      alert('Export failed: ' + (err.message || err));
    }
  }

  const stats = useMemo(() => {
    const docxCount = projects.filter(p => p.type === 'docx').length;
    const pptxCount = projects.filter(p => p.type === 'pptx').length;
    const lastUpdated = projects[0]?.updatedAt
      ? new Date(projects[0].updatedAt).toLocaleDateString()
      : '—';
    return [
      { label: 'Total projects', value: projects.length },
      { label: 'Documents', value: docxCount },
      { label: 'Presentations', value: pptxCount },
      { label: 'Last update', value: lastUpdated },
    ];
  }, [projects]);

  return (
    <div className="dashboard">
      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, color: 'var(--muted)' }}>Plan your next doc</p>
            <h3 style={{ margin: 0 }}>Create a new project</h3>
          </div>
        </div>
        <div className="new-project-row">
          <input
            className="form-field__input"
            value={title}
            placeholder="e.g. Q1 launch narrative"
            onChange={e => setTitle(e.target.value)}
          />
          <Button onClick={addProject} disabled={creating}>
            {creating ? 'Creating…' : 'Launch project'}
          </Button>
        </div>
      </div>

      <div className="stats-grid">
        {stats.map(stat => (
          <div className="stat-card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">Loading your workspace…</div>
      ) : projects.length === 0 ? (
        <div className="empty-state">
          <p>No projects yet. Start by creating your first document.</p>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map(project => (
            <article className="project-card" key={project._id}>
              <div className="project-card__meta">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className="badge">{(project.type || 'docx').toUpperCase()}</span>
                    <Link href={`/project/${project._id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      <h4 style={{ margin: 0 }}>{project.title}</h4>
                    </Link>
                  </div>
                  <p style={{ color: 'var(--muted)', marginTop: 6, marginBottom: 0 }}>{project.topic}</p>
                </div>
                <div style={{ textAlign: 'right', color: 'var(--muted)', fontSize: '0.85rem' }}>
                  <div>Updated</div>
                  <strong>{project.updatedAt ? new Date(project.updatedAt).toLocaleDateString() : '—'}</strong>
                </div>
              </div>
              <div className="project-card__actions">
              <Button as={Link} href={`/project/${project._id}`} variant="secondary">
                  Open workspace
                </Button>
                <Button variant="ghost" onClick={() => doExport(project._id, 'docx')}>Export DOCX</Button>
                <Button variant="ghost" onClick={() => doExport(project._id, 'pptx')}>Export PPTX</Button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
