import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'
import Principal from './pages/Principal'
import AdminPage from './pages/AdminPage'
import Socios from './pages/Socios'
import Jugadores from './pages/Jugadores'
import JugadorDetalle from './pages/JugadorDetalle'
import SocioDetalle from './pages/SocioDetalle'
import Categorias from './pages/Categorias'
import PadronLayout from './layouts/PadronLayout'
import Docentes from './pages/Docentes'
import CategoriaDetalle from './pages/CategoriaDetalle'
import EnDesarrollo from './pages/EnDesarrollo'

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
            element: <Socios />,
          },
          {
            path: 'socios/:id',
            element: <SocioDetalle />,
          },
          {
            path: 'jugadores',
            element: <Jugadores />,
          },
          {
            path: 'jugadores/:id',
            element: <JugadorDetalle />,
          },
          {
            path: 'categorias',
            element: <Categorias />,
          },
          {
            path: 'docentes',
            element: <Docentes />,
          },
          {
            path: 'categorias/:id',
            element: <CategoriaDetalle />,
          },
        ],
      },
      {
        path: 'resumen-financiero',
        element: <EnDesarrollo title="Resumen financiero" />,
      },
      {
        path: 'morosidad',
        element: <EnDesarrollo title="Reporte de morosidad" />,
      },
      {
        path: 'caja',
        element: <EnDesarrollo title="Caja y cobros" />,
      },
      {
        path: 'documental',
        element: <EnDesarrollo title="Documental" />,
      },
      {
        path: 'comunicaciones',
        element: <EnDesarrollo title="Comunicaciones" />,
      },
      {
        path: 'reportes',
        element: <EnDesarrollo title="Reportes y COMET" />,
      },
      {
        path: 'administracion',
        element: <EnDesarrollo title="Administración" />,
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
