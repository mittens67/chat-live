import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';


// Legacy first, tokens and utilities second: Tailwind must be able to override
// Bootstrap while the two coexist through the component migration.
import './styles/globals.scss';
import './styles/tailwind.css';
import ChatProvider from './context/ChatProvider.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChatProvider>
      <App />
      <Toaster position="top-right" />
    </ChatProvider>
  </React.StrictMode>,
);
