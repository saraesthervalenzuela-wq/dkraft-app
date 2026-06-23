// IMPORTANTE: debe ir primero. Captura el flag `type=recovery` de la URL antes
// de que el cliente de supabase (cargado vía App) procese y limpie el hash.
import './lib/recoveryFlag.js'

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
