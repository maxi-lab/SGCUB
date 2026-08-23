import { createBrowserRouter } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'
import Padron from './pages/Padron'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    label: 'Inicio',
    showInNavigation: false,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <Padron />,
      },
    ],
    label: 'Admin',
    showInNavigation: true,
  },
  {
    path: '*',
    element: <h1>404 - Página no encontrada</h1>,
  }
])
