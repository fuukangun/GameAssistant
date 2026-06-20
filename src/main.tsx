import React from 'react';
import ReactDOM from 'react-dom/client';
import { AppErrorBoundary } from './app/AppErrorBoundary.ts';
import { App } from './app/App.tsx';
import './styles/global.css';

const rootElement = document.getElementById('root');

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AppErrorBoundary>
        <App />
      </AppErrorBoundary>
    </React.StrictMode>,
  );
}
