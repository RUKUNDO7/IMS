import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { ZoomProvider } from './context/ZoomContext';
import StudentRegistration from './web/StudentRegistration.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ZoomProvider>
      <div className="app-container" style={{ padding: 'var(--spacing-md)' }}>
        <StudentRegistration />
      </div>
    </ZoomProvider>
  </StrictMode>,
)
