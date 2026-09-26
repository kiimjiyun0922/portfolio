import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import FrontDesignSystem from './components/FrontDesignSystem'
import './front-system.css'
import './theme-system-header.css'

createRoot(document.getElementById('front-system-root')).render(
  <StrictMode>
    <FrontDesignSystem />
  </StrictMode>,
)
