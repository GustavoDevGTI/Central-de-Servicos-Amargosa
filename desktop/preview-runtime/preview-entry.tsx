import React from 'react';
import { createRoot } from 'react-dom/client';
import './app/globals.css';
import Home from './app/page';
import { ServiceDetail, ServiceDirectory } from './app/internal-portal';
import './editor-bridge';

function Preview() {
  const params = new URLSearchParams(window.location.search);
  const page = params.get('editorPage') || 'home';
  if (page === 'directory') return <ServiceDirectory mode="audience" value={params.get('value') || 'cidadao'} />;
  if (page === 'service-detail') return <ServiceDetail slug={params.get('value') || 'isencao-iptu'} />;
  return <Home />;
}

createRoot(document.getElementById('root')!).render(<Preview />);
