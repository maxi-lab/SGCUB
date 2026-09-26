import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import DeleteSocioModal from '../components/socios/DeleteSocioModal'
import SociosTable from '../components/socios/SociosTable'
import PageHeader from '../components/shared/PageHeader'
import StatCard from '../components/shared/StatCard'
import useSocio from '../hooks/useSocio'

function Padron() {
  const {
    socios,
    isLoading,
    error,
    eliminarSocio,
  } = useSocio()
  const navigate = useNavigate()

  const [socioAEliminar, setSocioAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminacion, setErrorEliminacion] = useState('')
  const totales = useMemo(() => {
    const sociosActivos = socios.filter((socio) => {
      const estado = (socio.estado_socio_nombre ?? '').toLowerCase()
      return estado.includes('activo') && !estado.includes('inactivo')
    })
    const activos = sociosActivos.length
    const activosNoJugadores = sociosActivos.filter((socio) => !socio.es_jugador).length
    const formato = (valor) => valor.toLocaleString('es-AR')
    return {
      total: formato(socios.length),
      activos: formato(activos),
      activosNoJugadores: formato(activosNoJugadores),
      inactivos: formato(socios.length - activos),
    }
  }, [socios])

  const borrarSocio = async (socio) => {
    setErrorEliminacion('')
    setSocioAEliminar(socio)
  }

  const confirmarEliminacion = async () => {
    setEliminando(true)
    setErrorEliminacion('')

    try {
      await eliminarSocio(socioAEliminar.socio_id)
      setSocioAEliminar(null)
    } catch (requestError) {
      setErrorEliminacion(
        requestError.response?.data?.detail || 'No se pudo eliminar el socio.',
      )
    } finally {
      setEliminando(false)
    }
  }

  return (
    <>
      <div className="w-full flex flex-col gap-5">
        <PageHeader
          breadcrumb={[{ label: 'Personas' }, { label: 'Socios' }]}
          title="Socios"
          actions={(
            <button
              type="button"
              onClick={() => navigate('/padron/socios/nuevo')}
              className="inline-flex items-center gap-2 bg-primary text-on-primary hover:bg-primary/90 px-4 py-2 rounded shadow-sm font-label-lg text-base font-medium transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">person_add</span>
              <span className="text-xl"> Nuevo socio</span>
            </button>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          <StatCard label="Total Padrón" value={totales.total} icon="group" tone="neutral" />
          <StatCard label="Activos Plenos" value={totales.activos} icon="how_to_reg" tone="positive" />
          <StatCard label="Inactivos / En Pausa" value={totales.inactivos} icon="person_off" tone="muted" />
        </div>

        <section aria-label="Socios">
          <SociosTable
            data={socios}
            isLoading={isLoading}
            error={error}
            onEdit={(socio) => navigate(`/padron/socios/${socio.socio_id}/editar`)}
            onDelete={borrarSocio}
          />
        </section>
      </div>

      <DeleteSocioModal
        opened={Boolean(socioAEliminar)}
        onClose={() => {
          if (!eliminando) {
            setSocioAEliminar(null)
          }
        }}
        onConfirm={confirmarEliminacion}
        socio={socioAEliminar}
        loading={eliminando}
        error={errorEliminacion}
      />
    </>
  )
}

export default Padron
