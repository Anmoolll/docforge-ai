'use client';
import React from 'react';

export default function Layout({ children }) {
  return (
    <div className="app-root">
      <nav className="topbar">
        <div className="brand">DocForge</div>
      </nav>
      <div className="container">{children}</div>
    </div>
  );
}
