import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@fontsource/hanuman/latin-400.css'
import '@fontsource/hanuman/latin-600.css'
import '@fontsource/hanuman/latin-700.css'
import '@fontsource/happy-monkey/latin-400.css'
import '@fontsource/handlee/latin-400.css'
import '@fontsource/fredoka/latin-600.css'
import '@fontsource/fredoka/latin-700.css'
import '@fontsource/nunito/latin-400.css'
import '@fontsource/nunito/latin-600.css'
import '@fontsource/nunito/latin-700.css'
import '@fontsource/figtree/latin-400.css'
import '@fontsource/figtree/latin-600.css'
import '@fontsource/figtree/latin-700.css'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
