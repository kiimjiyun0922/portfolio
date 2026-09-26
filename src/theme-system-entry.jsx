import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ThemeDesignSystem from './components/ThemeDesignSystem'
import { getThemeSystem } from './theme-system-data'
import './theme-system.css'
import './theme-system-header.css'

const id = document.body.dataset.themeSystem || 'midnight'
const theme = { ...getThemeSystem(id), id }

if (theme.registryId !== 'default') document.documentElement.dataset.theme = theme.registryId

document.title = `${theme.name} Front Design System`
createRoot(document.getElementById('theme-system-root')).render(<StrictMode><ThemeDesignSystem theme={theme}/></StrictMode>)
