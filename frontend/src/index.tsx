import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { Buffer } from 'buffer';
(window as any).Buffer = Buffer;

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

console.log('RPC endpoint:', process.env.REACT_APP_RPC_ENDPOINT);
console.log('Program ID:', process.env.REACT_APP_PROGRAM_ID);

reportWebVitals();
