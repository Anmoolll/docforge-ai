'use client';
import React from 'react';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-root">
          <nav className="topbar">
            <div className="brand">DocForge</div>
          </nav>
          <div className="container">{children}</div>
        </div>
      </body>
    </html>
  );
}
