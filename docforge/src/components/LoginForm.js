'use client';
import React, { useState } from 'react';
import Button from '@/components/ui/Button';
import TextField from '@/components/ui/TextField';
import { login, register, saveToken } from '../lib/api';

export default function LoginForm({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const payload = mode === 'login' ? { email, password } : { email, password, name };
      const action = mode === 'login' ? login : register;
      const res = await action(payload);
      if (res?.token) {
        saveToken(res.token);
        onLogin && onLogin();
      } else {
        setError(res?.error || 'Request failed');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card auth-card">
      <div>
        <span className="hero__eyebrow" style={{ fontSize: '0.75rem' }}>Secure access</span>
        <h3 style={{ marginTop: 12, marginBottom: 0 }}>{mode === 'login' ? 'Welcome back' : 'Create your workspace'}</h3>
        <p style={{ color: 'var(--muted)', marginTop: 8 }}>
          {mode === 'login'
            ? 'Sign in to continue crafting AI-powered documents.'
            : 'Get started in seconds—no setup needed.'}
        </p>
      </div>

      <div className="auth-switch">
        <button type="button" className={mode === 'login' ? 'is-active' : ''} onClick={() => setMode('login')}>
          Sign in
        </button>
        <button type="button" className={mode === 'register' ? 'is-active' : ''} onClick={() => setMode('register')}>
          Register
        </button>
      </div>

      <form className="form-grid" onSubmit={submit}>
        {mode === 'register' && (
          <TextField
            label="Name"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ada Lovelace"
          />
        )}
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="you@company.com"
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}
        </Button>
        {error && <div className="form-error">{error}</div>}
      </form>
    </div>
  );
}
