import { useState } from 'react'
import AddSocioModal from '../components/AddSocioModal'
import SociosTable from '../components/SociosTable'
import useSocio from '../hooks/useSocio'

function Padron() {
  const { socios, isLoading, error, crearSocio } = useSocio()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [formulario, setFormulario] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
  })
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState('')

  const abrirModal = () => {
    setErrorGuardado('')
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
      await crearSocio(formulario)
      setFormulario({ nombre: '', apellido: '', dni: '', telefono: '' })
      setModalAbierto(false)
    } catch (requestError) {
      setErrorGuardado(
        requestError.response?.data?.dni?.[0] || 'No se pudo agregar el socio.',
      )
    } finally {
      setGuardando(false)
    }
  }

  return (
    <>
      <p className="eyebrow">Club Universitario Berisso</p>
      <h1>Gestión del padrón</h1>
      <p className="intro">
        Administrá la información de socios, jugadores y docentes del club.
      </p>
      <h2>Socios</h2>
      <section className="padron-table-section" aria-label="Socios y jugadores">
        <SociosTable
          data={socios}
          isLoading={isLoading}
          error={error}
          onAdd={abrirModal}
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
      />
    </>
  )
}

export default Padron
