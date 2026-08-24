import { createBrowserRouter } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'
import Principal from './pages/Principal'
import AdminPage from './pages/AdminPage'
import Padron from './pages/Padron'
import Jugadores from './pages/Jugadores'
import PadronLayout from './layouts/PadronLayout'
import { Navigate } from 'react-router-dom'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Principal />,
      },
      {
        path: 'padron',
        element: <PadronLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="socios" replace />,
          },
          {
            path: 'socios',
            element: <Padron />,
          },
          {
            path: 'jugadores',
            element: <Jugadores />,
          },
        ],
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
