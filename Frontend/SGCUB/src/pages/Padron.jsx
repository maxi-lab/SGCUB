import { useState } from 'react'
import AddSocioModal from '../components/socios/AddSocioModal'
import DeleteSocioModal from '../components/socios/DeleteSocioModal'
import SociosTable from '../components/socios/SociosTable'
import useSocio from '../hooks/useSocio'

function Padron() {
  const {
    socios,
    isLoading,
    error,
    crearSocio,
    modificarSocio,
    eliminarSocio,
  } = useSocio()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [socioAEliminar, setSocioAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminacion, setErrorEliminacion] = useState('')
  const [socioEnEdicion, setSocioEnEdicion] = useState(null)
  const [formulario, setFormulario] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    email: '',
    fecha_nacimiento: '2026-01-01',
  })
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState('')

  const abrirModal = () => {
    setErrorGuardado('')
    setSocioEnEdicion(null)
    setFormulario({ nombre: '', apellido: '', dni: '', telefono: '', email: '', fecha_nacimiento: '2026-01-01' })
    setModalAbierto(true)
  }

  const abrirEdicion = (socio) => {
    setErrorGuardado('')
    setSocioEnEdicion(socio)
    setFormulario({
      nombre: socio.nombre,
      apellido: socio.apellido,
      dni: socio.dni,
      telefono: socio.telefono,
      email: socio.email,
      fecha_nacimiento: socio.fecha_nacimiento,
    })
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    if (!guardando) {
      setModalAbierto(false)
    }
  }

  const actualizarCampo = (campo, valor) => {
    setFormulario((formularioActual) => ({
      ...formularioActual,
      [campo]: valor,
    }))
  }

  const guardarSocio = async (event) => {
    event.preventDefault()
    setGuardando(true)
    setErrorGuardado('')

    try {
      if (socioEnEdicion) {
        await modificarSocio(socioEnEdicion.socio_id, formulario)
      } else {
        await crearSocio(formulario)
      }
      setFormulario({ nombre: '', apellido: '', dni: '', telefono: '', email: '' })
      setSocioEnEdicion(null)
      setModalAbierto(false)
    } catch (requestError) {
      setErrorGuardado(
        requestError.response?.data?.dni?.[0] ||
          (socioEnEdicion
            ? 'No se pudo modificar el socio.'
            : 'No se pudo agregar el socio.'),
      )
    } finally {
      setGuardando(false)
    }
  }

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
      <section className="padron-table-section" aria-label="Socios">
        <SociosTable
          data={socios}
          isLoading={isLoading}
          error={error}
          onAdd={abrirModal}
          onEdit={abrirEdicion}
          onDelete={borrarSocio}
        />
      </section>

      <AddSocioModal
        opened={modalAbierto}
        onClose={cerrarModal}
        onSubmit={guardarSocio}
        formulario={formulario}
        onChange={actualizarCampo}
        loading={guardando}
        error={errorGuardado}
        editing={Boolean(socioEnEdicion)}
      />

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
