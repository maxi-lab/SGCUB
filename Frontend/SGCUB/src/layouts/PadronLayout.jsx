import { Outlet, useLocation } from 'react-router-dom'
import PageHeader from '../components/shared/PageHeader'

const SECCIONES = [
  { ruta: '/padron/jugadores', nombre: 'Jugadores' },
  { ruta: '/padron/categorias', nombre: 'Categorías' },
  { ruta: '/padron/docentes', nombre: 'Docentes' },
]

export default function PadronLayout() {
  const { pathname } = useLocation()
  const seccion = SECCIONES.find(({ ruta }) => pathname === ruta || pathname.startsWith(`${ruta}/`))

  return (
    <div className="w-[95%] max-w-none mx-auto flex flex-col">
      {seccion && (
        <PageHeader
          breadcrumb={[{ label: 'Personas' }, { label: seccion.nombre }]}
          title={seccion.nombre}
        />
      )}
      <Outlet />
    </div>
  )
}
