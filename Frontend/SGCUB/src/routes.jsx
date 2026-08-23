import { createBrowserRouter } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'
import Principal from './pages/Principal'
import AdminPage from './pages/AdminPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Principal />,
      },
    ],

    label: 'Inicio',
    showInNavigation: false,
  },
  {
    path: '/admin',
    element: <AdminLayout />,
    children: [
      {
        index: true,
        element: <AdminPage />,
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
