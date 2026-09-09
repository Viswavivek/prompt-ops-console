import React from 'react';
import ReactDOM from 'react-dom/client';
import { config } from '@/config';
import { App } from './App';
import './index.css';

async function bootstrap() {
  if (config.mocks.enabled) {
    const { enableMocking } = await import('./mocks/browser');
    await enableMocking();
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
}

void bootstrap();
