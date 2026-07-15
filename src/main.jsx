import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>{/*AuthProvider = makes auth data globally available
                       useAuth() = imports/accesses that global data inside a component*/}
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)