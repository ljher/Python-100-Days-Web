import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'

// 根据环境设置 basename
// 本地开发用 ''，GitHub Pages 用 '/Python-100-Days-Web'
const basename = import.meta.env.MODE === 'production' ? '/Python-100-Days-Web' : '';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter basename={basename}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
