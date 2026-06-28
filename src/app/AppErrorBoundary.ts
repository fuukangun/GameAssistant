import { Component, createElement, type ErrorInfo, type ReactNode } from 'react';
import type { AppLanguage } from './config/localConfig.ts';
import { createDefaultConfig, migrateConfig } from './config/localConfig.ts';
import { LOCAL_CONFIG_STORAGE_KEY } from './config/localConfigStorage.ts';
import { t } from './i18n.ts';

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  errorMessage: string | null;
};

export function formatUnknownError(error: unknown, language: AppLanguage = 'zh-CN'): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.length > 0) {
    return error;
  }

  return t(language, 'error.unknown');
}

function getConfiguredLanguage(): AppLanguage {
  if (typeof window === 'undefined') {
    return createDefaultConfig().language;
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_CONFIG_STORAGE_KEY);
    return migrateConfig(raw ? JSON.parse(raw) : undefined).language;
  } catch {
    return createDefaultConfig().language;
  }
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    errorMessage: null,
  };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return {
      errorMessage: formatUnknownError(error, getConfiguredLanguage()),
    };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error('React render failed', error, errorInfo);
  }

  render() {
    if (this.state.errorMessage) {
      const language = getConfiguredLanguage();
      return createElement(
        'main',
        { className: 'startup-error', role: 'alert' },
        createElement('h1', null, t(language, 'error.startupTitle')),
        createElement('p', null, this.state.errorMessage),
        createElement('p', null, t(language, 'error.startupBody')),
      );
    }

    return this.props.children;
  }
}
