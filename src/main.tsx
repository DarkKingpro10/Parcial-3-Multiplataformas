import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter, createRoutesFromElements, Route, Navigate } from 'react-router'
import './index.css'
import App from './App.tsx'
import StudentsPage from './views/StudentsPage.tsx'
import CoursesPage from './views/CoursesPage.tsx'
import ProfessorsPage from './views/ProfessorsPage.tsx'
import PrivateOutlet from './components/PrivateOutlet.tsx'
import { AuthProvider } from './context/AuthContext.tsx'
import LoginPage from './views/LoginPage.tsx'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route index element={<Navigate to="/students" replace />} />
      <Route path="login" element={<LoginPage />} />
      <Route element={<PrivateOutlet />}>
        <Route path="students" element={<StudentsPage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="professors" element={<ProfessorsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/students" replace />} />
    </Route>
  )
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </StrictMode>,
)
