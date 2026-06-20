import { Component, createElement, type ErrorInfo, type ReactNode } from 'react';

type AppErrorBoundaryProps = {
  children: ReactNode;
};

type AppErrorBoundaryState = {
  errorMessage: string | null;
};

export function formatUnknownError(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'string' && error.length > 0) {
    return error;
  }

  return '未知错误';
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    errorMessage: null,
  };

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return {
      errorMessage: formatUnknownError(error),
    };
  }

  componentDidCatch(error: unknown, errorInfo: ErrorInfo) {
    console.error('React render failed', error, errorInfo);
  }

  render() {
    if (this.state.errorMessage) {
      return createElement(
        'main',
        { className: 'startup-error', role: 'alert' },
        createElement('h1', null, '界面启动失败'),
        createElement('p', null, this.state.errorMessage),
        createElement('p', null, '请把这段错误信息发给开发者，应用主体没有成功渲染。'),
      );
    }

    return this.props.children;
  }
}
