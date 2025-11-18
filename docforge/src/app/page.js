'use client';
import React, { useEffect, useState } from 'react';
import LoginForm from '@/components/LoginForm';
import ProjectList from '@/components/ProjectList';
import Button from '@/components/ui/Button';
import { clearToken, me } from '@/lib/api';

const features = ['Context-aware Gemini prompts', 'Doc & deck export', 'Revision history', 'Feedback loops', 'Secure auth'];

export default function HomePage() {
  const [checkingSession, setCheckingSession] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  async function fetchSession() {
    setCheckingSession(true);
    setError(null);
    try {
      const resp = await me();
      if (resp && resp.user) {
        setUser(resp.user);
      } else {
        setUser(null);
        if (resp?.error) setError(resp.error);
      }
    } catch (err) {
      setUser(null);
      setError(err.message || 'Unable to verify session');
    } finally {
      setCheckingSession(false);
    }
  }

  useEffect(() => {
    fetchSession();
  }, []);

  const handleLogin = () => {
    fetchSession();
  };

  const handleLogout = () => {
    clearToken();
    setUser(null);
  };

  return (
    <div className="page">
      <section className="hero">
        <span className="hero__eyebrow">
          ✨ AI-first workspace
        </span>
        <h1 className="hero__title">Create polished documents & decks in minutes.</h1>
        <p className="hero__subtitle">
          DocForge pairs a sleek editor with Gemini-powered generation so you can outline, iterate, and export production-ready docs or presentations without leaving your browser.
        </p>
        <div className="feature-chips">
          {features.map(feature => (
            <span className="feature-chip" key={feature}>{feature}</span>
          ))}
        </div>
      </section>

      <section className="panel">
        {checkingSession && <p>Checking session…</p>}
        {!checkingSession && !user && (
          <>
            {error && <div style={{ color: 'salmon', marginBottom: 12 }}>{error}</div>}
            <LoginForm onLogin={handleLogin} />
          </>
        )}
        {!checkingSession && user && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <p style={{ color: 'var(--muted)', margin: 0 }}>Welcome back</p>
                <h2 style={{ margin: 0 }}>Projects workspace</h2>
              </div>
              <Button variant="outline" onClick={handleLogout}>Sign out</Button>
            </div>
            <ProjectList />
          </>
        )}
      </section>
    </div>
  );
}
