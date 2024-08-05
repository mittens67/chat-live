import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';


import './styles/globals.scss';
import ChatProvider from './context/ChatProvider.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ChatProvider>
    <App />
    </ChatProvider>
  </React.StrictMode>,
);
