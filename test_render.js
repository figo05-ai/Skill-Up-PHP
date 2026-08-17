import React from 'react';
import ReactDOMServer from 'react-dom/server';
import DevTools from './resources/js/pages/DevTools.jsx';

// Mock context and hooks
jest.mock('./resources/js/context/AuthContext', () => ({
  useAuth: () => ({ user: { role: 'admin' } })
}));

jest.mock('./resources/js/api/axios', () => ({
  get: () => Promise.resolve({ data: [] }),
  post: () => Promise.resolve({ data: [] })
}));

try {
  const html = ReactDOMServer.renderToString(<DevTools />);
  console.log("RENDER SUCCESS!");
} catch (e) {
  console.error("RENDER ERROR:", e);
}
