import type { ScaffoldConfig } from '../../types/scaffold';

export function render(_config: ScaffoldConfig): string {
  return `import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
`;
}
