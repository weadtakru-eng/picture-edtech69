import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { logOAuthOriginDiagnostic } from './utils/oauthOriginDiagnostic';

// Run origin and OAuth client ID diagnostic on startup for debugging origin_mismatch
logOAuthOriginDiagnostic();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
