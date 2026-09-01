import { useState, useEffect } from 'react'
import AddSocioModal from '../components/socios/AddSocioModal'
import DeleteSocioModal from '../components/socios/DeleteSocioModal'
import SociosTable from '../components/socios/SociosTable'
import useSocio from '../hooks/useSocio'
import { api } from '../api/conf'
import useGeneros from '../hooks/useGeneros'
import useLocalidades from '../hooks/useLocalidades'

function Padron() {
  const {
    socios,
    isLoading,
    error,
    crearSocio,
    modificarSocio,
    eliminarSocio,
  } = useSocio()
  
  const { generos } = useGeneros()
  const { localidades } = useLocalidades()

  const [modalAbierto, setModalAbierto] = useState(false)
  const [socioAEliminar, setSocioAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminacion, setErrorEliminacion] = useState('')
  const [socioEnEdicion, setSocioEnEdicion] = useState(null)
  const formInicial = {
    nombre: '', apellido: '', dni: '', telefono: '', email: '', estado_socio: '',
    fecha_nacimiento: '', genero: '', genero_otro: '',
    domicilio_calle: '', domicilio_numero: '', domicilio_piso: '', domicilio_departamento: '',
    domicilio_entre_calle_1: '', domicilio_entre_calle_2: '', domicilio_barrio: '', domicilio_localidad: ''
  }
  const [formulario, setFormulario] = useState(formInicial)
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState('')

  const [estadosSocio, setEstadosSocio] = useState([])

  useEffect(() => {
    api.get('padron/estado-socio/').then((res) => setEstadosSocio(res.data)).catch(console.error)
  }, [])

  const abrirModal = () => {
    setErrorGuardado('')
    setSocioEnEdicion(null)
    setFormulario({ ...formInicial })
    setModalAbierto(true)
  }

  const abrirEdicion = (socio) => {
    setErrorGuardado('')
    setSocioEnEdicion(socio)
    setFormulario({
      nombre: socio.nombre || '',
      apellido: socio.apellido || '',
      dni: socio.dni || '',
      telefono: socio.telefono || '',
      email: socio.email || '',
      estado_socio: socio.estado_socio ? String(socio.estado_socio) : '',
      fecha_nacimiento: socio.fecha_nacimiento || '',
      genero: socio.genero ? String(socio.genero) : '',
      genero_otro: socio.genero_otro || '',
      domicilio_calle: socio.domicilio_calle || '',
      domicilio_numero: socio.domicilio_numero || '',
      domicilio_piso: socio.domicilio_piso || '',
      domicilio_departamento: socio.domicilio_departamento || '',
      domicilio_entre_calle_1: socio.domicilio_entre_calle_1 || '',
      domicilio_entre_calle_2: socio.domicilio_entre_calle_2 || '',
      domicilio_barrio: socio.domicilio_barrio || '',
      domicilio_localidad: socio.domicilio_localidad ? String(socio.domicilio_localidad) : ''
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

    const payload = { ...formulario }
    if (!payload.estado_socio) {
      delete payload.estado_socio
    }

    try {
      if (socioEnEdicion) {
        await modificarSocio(socioEnEdicion.socio_id, payload)
      } else {
        await crearSocio(payload)
      }
      setFormulario({ nombre: '', apellido: '', dni: '', telefono: '', email: '', estado_socio: '' })
      setSocioEnEdicion(null)
      setModalAbierto(false)
    } catch (requestError) {
      const errorData = requestError.response?.data
      let errorMsg = socioEnEdicion ? 'No se pudo modificar el socio.' : 'No se pudo agregar el socio.'
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMsg = errorData
        } else if (errorData.detail) {
          errorMsg = errorData.detail
        } else {
          errorMsg = Object.entries(errorData)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : typeof v === 'object' ? JSON.stringify(v) : v}`)
            .join(' | ')
        }
      }
      setErrorGuardado(errorMsg)
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
        editing={!!socioEnEdicion}
        estadosSocio={estadosSocio}
        generos={generos}
        localidades={localidades}
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
