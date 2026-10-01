import { createBrowserRouter, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import AdminLayout from './layouts/AdminLayout'
import ProtectedRoute from './auth/ProtectedRoute'
import RequirePermission from './auth/RequirePermission'
import { PERMISSIONS } from './auth/permissions'
import Login from './pages/Login'
import Principal from './pages/Principal'
import AdminPage from './pages/AdminPage'
import Socios from './pages/Socios'
import Jugadores from './pages/Jugadores'
import JugadorDetail from './pages/JugadorDetail'
import JugadorForm from './pages/JugadorForm'
import SocioDetail from './pages/SocioDetail'
import DocenteDetail from './pages/DocenteDetail'
import DocenteForm from './pages/DocenteForm'
import SocioForm from './pages/SocioForm'
import Categorias from './pages/Categorias'
import Docentes from './pages/Docentes'
import CategoriaDetalle from './pages/CategoriaDetalle'
import EnDesarrollo from './pages/EnDesarrollo'
import Usuarios from './pages/Usuarios'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    // Todas las rutas hijas requieren una sesión iniciada
    element: <ProtectedRoute />,
    children: [
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
                path: 'socios/nuevo',
                element: <SocioForm />,
              },
              {
                path: 'socios/:id',
                element: <SocioDetail />,
              },
              {
                path: 'socios/:id/editar',
                element: <SocioForm />,
              },
              {
                path: 'jugadores',
                element: <Jugadores />,
              },
              {
                path: 'jugadores/nuevo',
                element: <JugadorForm />,
              },
              {
                path: 'jugadores/:id',
                element: <JugadorDetail />,
              },
              {
                path: 'jugadores/:id/editar',
                element: <JugadorForm />,
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
                path: 'docentes/nuevo',
                element: <DocenteForm />,
              },
              {
                path: 'docentes/:id',
                element: <DocenteDetail />,
              },
              {
                path: 'docentes/:id/editar',
                element: <DocenteForm />,
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
          // Secciones del rol Administrador
          {
            element: <RequirePermission permission={PERMISSIONS.manageUsers} />,
            children: [
              {
                path: 'usuarios',
                element: <Usuarios />,
              },
            ],
          },
          {
            element: <RequirePermission permission={PERMISSIONS.manageAutomations} />,
            children: [
              {
                path: 'automatizaciones',
                element: <EnDesarrollo title="Automatizaciones" />,
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
    ],
  },
  {
    path: '*',
    element: <h1>404 - Página no encontrada</h1>,
  }
])
