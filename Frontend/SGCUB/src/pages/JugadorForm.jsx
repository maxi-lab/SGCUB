import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/conf'
import { getJugador, patchJugador, postJugador } from '../api/jugadores'
import { putSocio } from '../api/socios'
import AddContactModal from '../components/jugadores/AddContactModal'
import { RELATIONS } from '../components/jugadores/contacts'
import { formatDni, formatNumber, getErrorMessage } from '../components/personas/format'
import PageHeader from '../components/shared/PageHeader'
import { CAMPOS_OBLIGATORIOS, FORM_INICIAL, claseInput, enfocarCampo, socioAFormulario, validar } from '../components/socios/socioForm'
import { Campo, InputConIcono, SeccionDatosPersonales, SeccionDomicilio, SeccionTitulo, SelectConFlecha } from '../components/socios/SocioFormFields'
import useCategorias from '../hooks/useCategorias'
import useEstados from '../hooks/useEstados'
import useGeneros from '../hooks/useGeneros'
import useJugadores from '../hooks/useJugadores'
import useLocalidades from '../hooks/useLocalidades'
import useSocio from '../hooks/useSocio'

const CAMPOS_CONTACTO = ['dni', 'nombre', 'apellido', 'telefono', 'relacion']

const DEPORTIVO_INICIAL = { categoria: '', categoria_secundaria: '', estado: '', obra_social: '', tallaIndumentaria: '' }

let ultimaClave = 0
const nuevaClave = () => `contacto-${++ultimaClave}`

const jugadorAFormulario = (jugador) => ({
  ...socioAFormulario(jugador.socio ?? {}),
  categoria: String(jugador.categoria?.categoria_id ?? ''),
  categoria_secundaria: String(jugador.categoria_secundaria?.categoria_id ?? ''),
  estado: String(jugador.estado?.estado_id ?? ''),
  obra_social: jugador.obra_social ?? '',
  tallaIndumentaria: jugador.tallaIndumentaria ?? '',
})

const contactoAFila = (contacto) => ({
  clave: nuevaClave(),
  contacto_emergencia_id: contacto.contacto_emergencia_id,
  dni: String(contacto.persona?.dni ?? ''),
  nombre: contacto.persona?.nombre ?? '',
  apellido: contacto.persona?.apellido ?? '',
  telefono: contacto.persona?.telefono ?? '',
  email: contacto.persona?.email ?? '',
  relacion: contacto.relacion ?? '',
  responsable_legal: Boolean(contacto.responsable_legal),
})

const filaAContacto = (fila) => ({
  ...(fila.contacto_emergencia_id ? { contacto_emergencia_id: fila.contacto_emergencia_id } : {}),
  persona: {
    dni: fila.dni.trim(),
    nombre: fila.nombre.trim(),
    apellido: fila.apellido.trim(),
    telefono: fila.telefono.trim(),
    email: fila.email.trim() || null,
  },
  relacion: fila.relacion,
  responsable_legal: fila.responsable_legal,
})

const idCampoContacto = (fila, campo) => `${fila.clave}-${campo}`

const LETRA_GENERO = { Masculino: 'M', Femenino: 'F' }

const edadCompetencia = (categoria, anioNacimiento) => categoria.anio_vigente - anioNacimiento

function categoriaPorEdad(categorias, anioNacimiento, generoLetra) {
  if (!anioNacimiento || !generoLetra) return null
  return categorias
    .filter((c) => c.genero === generoLetra && c.edad_maxima >= edadCompetencia(c, anioNacimiento))
    .sort((a, b) => a.edad_maxima - b.edad_maxima)[0] ?? null
}

function validarDeportivo(formulario, editando) {
  const errores = {}
  if (!formulario.categoria) errores.categoria = 'Seleccione una categoría.'
  if (editando && !formulario.estado) errores.estado = 'Seleccione un estado deportivo.'
  return errores
}

function validarContactos(contactos) {
  const errores = {}
  const dnis = new Set()
  contactos.forEach((fila) => {
    CAMPOS_CONTACTO.forEach((campo) => {
      if (!String(fila[campo] ?? '').trim()) errores[idCampoContacto(fila, campo)] = 'Obligatorio.'
    })
    const dni = fila.dni.trim()
    if (dni && !/^\d{7,8}$/.test(dni)) errores[idCampoContacto(fila, 'dni')] = 'DNI de 7 u 8 dígitos.'
    else if (dni && dnis.has(dni)) errores[idCampoContacto(fila, 'dni')] = 'DNI repetido.'
    dnis.add(dni)
    const email = fila.email.trim()
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errores[idCampoContacto(fila, 'email')] = 'Correo inválido.'
  })
  return errores
}

function FilaContacto({ fila, indice, errores, mostrarSinGuardar, onChange, onRemove }) {
  const bind = (campo) => ({
    id: idCampoContacto(fila, campo),
    value: fila[campo],
    onChange: (event) => onChange(campo, event.target.value),
  })
  const error = (campo) => errores[idCampoContacto(fila, campo)]

  return (
    <div className="rounded-lg border border-outline-variant/40 bg-surface-container-low/30 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">{indice + 1}</span>
          <span className="text-base font-semibold text-on-surface">
            {`${fila.nombre} ${fila.apellido}`.trim() || 'Nuevo contacto'}
          </span>
          {mostrarSinGuardar && !fila.contacto_emergencia_id && (
            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-sm font-medium">Sin guardar</span>
          )}
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-sm font-medium text-error hover:bg-error-container/40 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-base">delete</span>
          Quitar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
        <Campo id={idCampoContacto(fila, 'dni')} label="DNI" requerido error={error('dni')}>
          <input
            {...bind('dni')}
            onChange={(event) => onChange('dni', event.target.value.replace(/\D/g, '').slice(0, 8))}
            type="text"
            inputMode="numeric"
            placeholder="Ej: 28492104"
            className={claseInput(Boolean(error('dni')), 'font-mono')}
          />
        </Campo>
        <Campo id={idCampoContacto(fila, 'nombre')} label="Nombre" requerido error={error('nombre')}>
          <input {...bind('nombre')} type="text" className={claseInput(Boolean(error('nombre')))} />
        </Campo>
        <Campo id={idCampoContacto(fila, 'apellido')} label="Apellido" requerido error={error('apellido')}>
          <input {...bind('apellido')} type="text" className={claseInput(Boolean(error('apellido')))} />
        </Campo>
        <Campo id={idCampoContacto(fila, 'telefono')} label="Teléfono" requerido error={error('telefono')}>
          <InputConIcono {...bind('telefono')} type="tel" icono="call" conError={Boolean(error('telefono'))} />
        </Campo>
        <Campo id={idCampoContacto(fila, 'email')} label="Correo electrónico" opcional error={error('email')}>
          <InputConIcono {...bind('email')} type="email" icono="mail" conError={Boolean(error('email'))} />
        </Campo>
        <Campo id={idCampoContacto(fila, 'relacion')} label="Relación" requerido error={error('relacion')}>
          <SelectConFlecha {...bind('relacion')} conError={Boolean(error('relacion'))}>
            <option value="" disabled>Seleccionar...</option>
            {/* Conserva RELATIONS cargadas antes que no estén en la lista actual. */}
            {[...new Set([...RELATIONS, ...(fila.relacion ? [fila.relacion] : [])])].map((relacion) => (
              <option key={relacion} value={relacion}>{relacion}</option>
            ))}
          </SelectConFlecha>
        </Campo>
      </div>

      <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
        <input
          type="checkbox"
          className="w-4 h-4 accent-primary cursor-pointer"
          checked={fila.responsable_legal}
          onChange={(event) => onChange('responsable_legal', event.target.checked)}
        />
        <span className="text-base text-on-surface font-medium">Responsable legal</span>
      </label>
    </div>
  )
}

function JugadorForm() {
  const { id } = useParams()
  const editando = Boolean(id)
  const navigate = useNavigate()

  const { socios } = useSocio()
  const { jugadores } = useJugadores()
  const { categorias } = useCategorias()
  const { estados } = useEstados()
  const { generos } = useGeneros()
  const { localidades } = useLocalidades()

  const [jugador, setJugador] = useState(null)
  const [formularioEditado, setFormulario] = useState(editando ? null : { ...FORM_INICIAL, ...DEPORTIVO_INICIAL })
  const [contactos, setContactos] = useState([])
  const [errorCarga, setErrorCarga] = useState('')
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState('')
  const [agregandoContacto, setAgregandoContacto] = useState(false)
  const [personaEncontrada, setPersonaEncontrada] = useState(null)
  const [buscandoPersona, setBuscandoPersona] = useState(false)

  useEffect(() => {
    if (!editando) return undefined
    let activo = true
    getJugador(id)
      .then((datos) => {
        if (!activo) return
        setJugador(datos)
        setFormulario(jugadorAFormulario(datos))
        setContactos((datos.contactos_emergencia ?? []).map(contactoAFila))
      })
      .catch((requestError) => {
        if (activo) setErrorCarga(requestError.response?.data?.detail || 'No se pudo cargar el jugador.')
      })
    return () => { activo = false }
  }, [editando, id])

  const anioNacimiento = formularioEditado?.fecha_nacimiento ? Number(formularioEditado.fecha_nacimiento.slice(0, 4)) : null
  const generoLetra = LETRA_GENERO[generos.find((g) => String(g.genero_id) === formularioEditado?.genero)?.nombre]

  const localidadPorDefecto = editando
    ? ''
    : String(localidades.find((l) => l.nombre?.toLowerCase() === 'berisso')?.localidad_id ?? '')
  const categoriaSugerida = editando ? null : categoriaPorEdad(categorias, anioNacimiento, generoLetra)
  const categoriaPorDefecto = String(categoriaSugerida?.categoria_id ?? '')
  const formulario = useMemo(() => {
    if (!formularioEditado) return null
    const categoria = formularioEditado.categoria || categoriaPorDefecto
    return {
      ...formularioEditado,
      domicilio_localidad: formularioEditado.domicilio_localidad || localidadPorDefecto,
      categoria,
      categoria_secundaria: formularioEditado.categoria_secundaria === categoria ? '' : formularioEditado.categoria_secundaria,
    }
  }, [formularioEditado, localidadPorDefecto, categoriaPorDefecto])

  const socioActualId = jugador?.socio?.socio_id
  const generoOtroId = generos.find((g) => g.nombre === 'Otro')?.genero_id
  const esGeneroOtro = generoOtroId !== undefined && formulario?.genero === String(generoOtroId)

  const dniIngresado = formulario?.dni.trim() ?? ''
  const socioDelDni = useMemo(() => {
    if (!/^\d{7,8}$/.test(dniIngresado)) return null
    return socios.find((s) => String(s.dni) === dniIngresado) ?? null
  }, [socios, dniIngresado])

  const socioDuplicado = editando && socioDelDni && String(socioDelDni.socio_id) !== String(socioActualId) ? socioDelDni : null
  const socioVinculado = editando ? null : socioDelDni
  const jugadorDelSocio = socioVinculado
    ? jugadores.find((j) => String(j.socio?.socio_id) === String(socioVinculado.socio_id)) ?? null
    : null

  const categoriasDisponibles = useMemo(() => {
    if (!formulario) return []
    if (!anioNacimiento || !generoLetra) return categorias

    return categorias.filter((c) => {
      const categoriaId = String(c.categoria_id)
      if (categoriaId === formulario.categoria || categoriaId === formulario.categoria_secundaria) return true
      return c.genero === generoLetra && c.edad_maxima >= edadCompetencia(c, anioNacimiento)
    })
  }, [categorias, formulario, anioNacimiento, generoLetra])

  const categoriasSecundarias = categoriasDisponibles.filter((c) => String(c.categoria_id) !== formulario?.categoria)

  const cambiarCategoriaPrincipal = (event) => {
    const valor = event.target.value
    actualizarCampo('categoria', valor)
    if (valor === formulario.categoria_secundaria) actualizarCampo('categoria_secundaria', '')
  }

  const limpiarError = (campo) => {
    if (errores[campo]) setErrores((actuales) => ({ ...actuales, [campo]: undefined }))
  }

  const actualizarCampo = (campo, valor) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
    limpiarError(campo)
    if (campo === 'dni') setPersonaEncontrada(null)
  }

  const bindInput = (campo) => ({
    id: campo,
    name: campo,
    value: formulario[campo],
    onChange: (event) => actualizarCampo(campo, event.target.value),
  })

  const limpiarErroresSocio = () => setErrores((actuales) => ({
    ...actuales,
    ...Object.fromEntries(CAMPOS_OBLIGATORIOS.filter((campo) => campo !== 'dni').map((campo) => [campo, undefined])),
  }))

  const buscarPersonaPorDni = async () => {
    if (editando || !/^\d{7,8}$/.test(dniIngresado)) return
    if (socioVinculado) {
      if (!jugadorDelSocio) {
        setFormulario((actual) => ({ ...actual, ...socioAFormulario(socioVinculado) }))
        limpiarErroresSocio()
      }
      return
    }
    setBuscandoPersona(true)
    try {
      const response = await api.get(`padron/persona/?dni=${dniIngresado}`)
      const persona = response.data?.[0]
      if (persona) {
        setFormulario((actual) => ({
          ...actual,
          nombre: persona.nombre || actual.nombre,
          apellido: persona.apellido || actual.apellido,
          telefono: persona.telefono || actual.telefono,
          email: persona.email || actual.email,
        }))
        limpiarErroresSocio()
        setPersonaEncontrada(persona)
      }
    } catch (requestError) {
      console.error('Error al buscar persona:', requestError)
    } finally {
      setBuscandoPersona(false)
    }
  }

  const actualizarContacto = (clave, campo, valor) => {
    setContactos((actuales) => actuales.map((fila) => (fila.clave === clave ? { ...fila, [campo]: valor } : fila)))
    limpiarError(`${clave}-${campo}`)
  }

  const quitarContacto = (clave) => setContactos((actuales) => actuales.filter((fila) => fila.clave !== clave))

  const agregarContacto = async (contacto) => {
    const dni = String(contacto.persona?.dni ?? '').trim()
    if (contactos.some((fila) => fila.dni.trim() === dni)) {
      throw new Error('Esta persona ya figura entre los contactos del jugador.')
    }
    setContactos((actuales) => [...actuales, contactoAFila(contacto)])
  }

  const guardar = async (event) => {
    event.preventDefault()
    setErrorGuardado('')

    const nuevosErrores = {
      ...validar(formulario, esGeneroOtro),
      ...validarDeportivo(formulario, editando),
      ...validarContactos(contactos),
    }
    if (socioDuplicado) nuevosErrores.dni = 'Ya existe otro socio registrado con este DNI.'
    if (jugadorDelSocio) nuevosErrores.dni = 'Este socio ya está registrado como jugador.'
    setErrores(nuevosErrores)

    const ordenCampos = [
      ...CAMPOS_OBLIGATORIOS, 'genero_otro', 'categoria', 'estado',
      ...contactos.flatMap((fila) => [...CAMPOS_CONTACTO, 'email'].map((campo) => idCampoContacto(fila, campo))),
    ]
    const primerError = ordenCampos.find((campo) => nuevosErrores[campo])
    if (primerError) {
      enfocarCampo(primerError)
      return
    }

    const { categoria, categoria_secundaria, estado, obra_social, tallaIndumentaria, ...datosSocio } = formulario
    if (!datosSocio.estado_socio) delete datosSocio.estado_socio
    if (!esGeneroOtro) datosSocio.genero_otro = ''

    const datosJugador = {
      categoria,
      categoria_secundaria: categoria_secundaria || null,
      ...(editando ? { estado } : {}),
      obra_social,
      tallaIndumentaria,
      contactos_emergencia: contactos.map(filaAContacto),
    }

    setGuardando(true)
    try {
      let jugadorId
      if (editando) {
        await putSocio(socioActualId, datosSocio)
        await patchJugador(jugador.jugador_id, datosJugador)
        jugadorId = jugador.jugador_id
      } else if (socioVinculado) {
        await putSocio(socioVinculado.socio_id, datosSocio)
        jugadorId = (await postJugador({ ...datosJugador, socio: socioVinculado.socio_id })).jugador_id
      } else {
        jugadorId = (await postJugador({ ...datosJugador, nuevo_socio: datosSocio })).jugador_id
      }
      navigate(`/padron/jugadores/${jugadorId}`)
    } catch (requestError) {
      setErrorGuardado(getErrorMessage(requestError, editando ? 'No se pudo modificar el jugador.' : 'No se pudo agregar el jugador.'))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setGuardando(false)
    }
  }

  const rutaVolver = editando ? `/padron/jugadores/${id}` : '/padron/jugadores'

  if (errorCarga) {
    return (
      <div className="max-w-5xl mx-auto w-full space-y-4 pt-2">
        <Link to="/padron/jugadores" className="inline-flex items-center gap-1.5 text-xl font-medium text-on-surface-variant hover:text-primary px-3 py-1.5 rounded transition-colors bg-surface-container-lowest border border-outline-variant/30">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Volver a jugadores</span>
        </Link>
        <div className="bg-error-container text-on-error-container p-4 rounded-lg border border-error/30 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-error text-base">error</span>
          <p className="text-sm font-medium">{errorCarga}</p>
        </div>
      </div>
    )
  }

  if (!formulario) {
    return (
      <div className="max-w-5xl mx-auto w-full py-16 flex flex-col items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
        <p className="text-sm">Cargando datos del jugador...</p>
      </div>
    )
  }

  const nombreJugador = editando ? `${jugador.socio?.nombre ?? ''} ${jugador.socio?.apellido ?? ''}`.trim() : ''
  const dniConError = Boolean(errores.dni) || Boolean(socioDuplicado) || Boolean(jugadorDelSocio)
  const dniReconocido = Boolean(personaEncontrada) || Boolean(socioVinculado)
  const iconoDni = buscandoPersona ? 'progress_activity' : dniConError ? 'warning' : dniReconocido ? 'check_circle' : 'fingerprint'
  const colorIconoDni = dniConError ? 'text-error' : dniReconocido ? 'text-[#00875a]' : 'text-outline'

  return (
    <div className="mx-auto w-full space-y-6 pb-12">
      <PageHeader
        breadcrumb={[
          { label: 'Personas' },
          { label: 'Jugadores', to: '/padron/jugadores' },
          ...(nombreJugador ? [{ label: nombreJugador, to: rutaVolver }] : []),
          { label: editando ? 'Editar' : 'Nuevo jugador' },
        ]}
        title={editando ? 'Editar Jugador' : 'Alta de Nuevo Jugador'}
        actions={(
          <>
            <div className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/30 rounded flex items-center gap-2">
              <span className="text-base font-semibold text-outline uppercase tracking-wider">N° de socio:</span>
              <span className="font-mono text-base font-bold text-primary">
                {editando
                  ? formatNumber(jugador.socio?.numero_socio)
                  : socioVinculado && !jugadorDelSocio ? formatNumber(socioVinculado.numero_socio) : 'Nuevo'}
              </span>
            </div>
            {editando ? (
              <div className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/30 rounded flex items-center gap-2">
                <span className="text-base font-semibold text-outline uppercase tracking-wider">Jugador:</span>
                <span className="font-mono text-base font-bold text-on-surface">{formatNumber(jugador.jugador_id)}</span>
              </div>
            ) : (
              <div className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/30 rounded flex items-center gap-2">
                <span className="text-base font-semibold text-outline uppercase tracking-wider">Fecha de alta:</span>
                <span className="text-base font-semibold text-on-surface">{`Hoy (${new Date().toLocaleDateString('es-AR')})`}</span>
              </div>
            )}
            <Link
              to={rutaVolver}
              className="inline-flex items-center gap-1.5 text-base font-medium text-on-surface-variant hover:text-primary px-3 py-1.5 rounded transition-colors bg-surface-container-lowest border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>{editando ? 'Volver a la ficha' : 'Volver al listado'}</span>
            </Link>
          </>
        )}
      />

      {errorGuardado && (
        <div className="bg-error-container text-on-error-container p-3 rounded-lg border border-error/30 flex items-start gap-2.5 shadow-sm" role="alert">
          <div className="p-1 bg-error/10 text-error rounded shrink-0">
            <span className="material-symbols-outlined text-base">error</span>
          </div>
          <div>
            <p className="text-base font-bold">No se pudo guardar el jugador</p>
            <p className="text-base text-on-error-container/80 mt-0.5 break-words">{errorGuardado}</p>
          </div>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/20 bg-surface-container-low/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">badge</span>
            <h2 className="text-base font-semibold text-on-surface">Datos Personales, Deportivos y Contactos</h2>
          </div>
        </div>

        <form id="form-jugador" className="p-6 md:p-8" onSubmit={guardar} noValidate>
          <div className="space-y-6">
            <SeccionDatosPersonales
              bindInput={bindInput}
              errores={errores}
              generos={generos}
              esGeneroOtro={esGeneroOtro}
              campoDni={(
                <Campo
                  id="dni"
                  label="Documento Nacional de Identidad (DNI)"
                  requerido
                  hint="(sin puntos ni guiones)"
                  error={errores.dni}
                >
                  <div className="relative">
                    <input
                      {...bindInput('dni')}
                      onChange={(event) => actualizarCampo('dni', event.target.value.replace(/\D/g, '').slice(0, 8))}
                      onBlur={buscarPersonaPorDni}
                      type="text"
                      inputMode="numeric"
                      placeholder="Ej: 38492104"
                      aria-invalid={dniConError || undefined}
                      className={claseInput(dniConError, 'pr-10 font-mono font-medium')}
                    />
                    <span className={`material-symbols-outlined absolute right-3 top-3 text-base pointer-events-none ${colorIconoDni} ${buscandoPersona ? 'animate-spin' : ''}`}>
                      {iconoDni}
                    </span>
                  </div>
                  {socioDuplicado && !errores.dni && (
                    <p className="text-sm text-error font-medium">
                      El DNI {formatDni(socioDuplicado.dni)} pertenece a{' '}
                      <strong>{`${socioDuplicado.nombre ?? ''} ${socioDuplicado.apellido ?? ''}`.trim()}</strong>
                      {' '}(Socio N° {formatNumber(socioDuplicado.numero_socio)}).
                    </p>
                  )}

                  {jugadorDelSocio && (
                    <div className="bg-error-container text-on-error-container p-3 rounded-lg border border-error/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm mt-1" role="alert">
                      <div className="flex items-start sm:items-center gap-2.5">
                        <div className="p-1 bg-error/10 text-error rounded shrink-0">
                          <span className="material-symbols-outlined text-base">error</span>
                        </div>
                        <p className="text-base">
                          <strong>{`${socioVinculado.nombre ?? ''} ${socioVinculado.apellido ?? ''}`.trim()}</strong>
                          {' '}(DNI {formatDni(socioVinculado.dni)}) ya está registrado como jugador.
                        </p>
                      </div>
                      <Link
                        to={`/padron/jugadores/${jugadorDelSocio.jugador_id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-on-error-container hover:opacity-90 rounded text-base font-semibold shrink-0 transition-opacity"
                      >
                        <span>Ver ficha existente</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </div>
                  )}

                  {socioVinculado && !jugadorDelSocio && (
                    <div className="bg-surface-container-low text-on-surface p-3 rounded-lg border border-outline-variant/40 flex items-center gap-2.5 mt-1">
                      <span className="material-symbols-outlined text-base text-[#00875a]">how_to_reg</span>
                      <p className="text-base">
                        <strong>{`${socioVinculado.nombre ?? ''} ${socioVinculado.apellido ?? ''}`.trim()}</strong>
                        {' '}ya es socio (N° {formatNumber(socioVinculado.numero_socio)}). El jugador se vinculará a ese socio y se actualizarán sus datos.
                      </p>
                    </div>
                  )}

                  {personaEncontrada && !socioVinculado && (
                    <div className="bg-surface-container-low text-on-surface p-3 rounded-lg border border-outline-variant/40 flex items-center gap-2.5 mt-1">
                      <span className="material-symbols-outlined text-base text-[#00875a]">how_to_reg</span>
                      <p className="text-base">
                        <strong>{`${personaEncontrada.nombre ?? ''} ${personaEncontrada.apellido ?? ''}`.trim()}</strong>
                        {' '}ya está registrada en el padrón. Se completaron sus datos de contacto.
                      </p>
                    </div>
                  )}
                </Campo>
              )}
            />

            <SeccionDomicilio bindInput={bindInput} errores={errores} localidades={localidades} />

            {/* Datos deportivos */}
            <div className="flex flex-col gap-4 pt-4 border-t border-outline-variant/20">
              <SeccionTitulo icono="sports_soccer" titulo="Datos Deportivos" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <Campo
                  id="categoria"
                  label="Categoría"
                  requerido
                  hint={categoriasDisponibles.length < categorias.length ? '(según edad y género)' : undefined}
                  error={errores.categoria}
                >
                  <SelectConFlecha {...bindInput('categoria')} onChange={cambiarCategoriaPrincipal} conError={Boolean(errores.categoria)}>
                    <option value="" disabled>Seleccione categoría...</option>
                    {categoriasDisponibles.map((c) => (
                      <option key={c.categoria_id} value={String(c.categoria_id)}>{c.nombre}</option>
                    ))}
                  </SelectConFlecha>
                  {categoriaSugerida && formulario.categoria === categoriaPorDefecto && (
                    <p className="text-sm text-on-surface-variant">
                      Asignada según la edad: {edadCompetencia(categoriaSugerida, anioNacimiento)} años en la temporada {categoriaSugerida.anio_vigente}.
                    </p>
                  )}
                </Campo>
                <Campo id="categoria_secundaria" label="Categoría secundaria" opcional>
                  <SelectConFlecha {...bindInput('categoria_secundaria')} conError={false}>
                    <option value="">Sin categoría secundaria</option>
                    {categoriasSecundarias.map((c) => (
                      <option key={c.categoria_id} value={String(c.categoria_id)}>{c.nombre}</option>
                    ))}
                  </SelectConFlecha>
                </Campo>
                {editando ? 
                  <Campo id="estado" label="Estado deportivo" requerido error={errores.estado}>
                    <SelectConFlecha {...bindInput('estado')} conError={Boolean(errores.estado)}>
                      <option value="" disabled>Seleccione estado...</option>
                      {estados.map((e) => (
                        <option key={e.estado_id} value={String(e.estado_id)}>{e.nombre}</option>
                      ))}
                    </SelectConFlecha>
                  </Campo>
                  : null}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <Campo id="obra_social" label="Obra social" opcional>
                  <InputConIcono {...bindInput('obra_social')} type="text" placeholder="Ej: IOMA" icono="medical_services" conError={false} />
                </Campo>
                <Campo id="tallaIndumentaria" label="Talla de indumentaria" opcional>
                  <InputConIcono {...bindInput('tallaIndumentaria')} type="text" placeholder="Ej: M" icono="apparel" conError={false} />
                </Campo>
              </div>
            </div>

            {/* Contactos de emergencia */}
            <div className="flex flex-col gap-4 pt-4 border-t border-outline-variant/20">
              <SeccionTitulo
                icono="family_restroom"
                titulo="Contactos de Emergencia"
                extra={(
                  <button
                    type="button"
                    onClick={() => setAgregandoContacto(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-semibold text-primary border border-primary/40 hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">person_add</span>
                    Agregar contacto
                  </button>
                )}
              />

              {contactos.length === 0 ? (
                <div className="flex flex-col items-center text-center gap-1 py-8 border border-dashed border-outline-variant/50 rounded-lg">
                  <span className="material-symbols-outlined text-[32px] text-outline">contact_emergency</span>
                  <p className="text-base font-semibold text-on-surface">Sin contactos de emergencia</p>
                  <p className="text-sm text-on-surface-variant">Agregá al menos un familiar o responsable para este jugador.</p>
                </div>
              ) : (
                contactos.map((fila, indice) => (
                  <FilaContacto
                    key={fila.clave}
                    fila={fila}
                    indice={indice}
                    errores={errores}
                    mostrarSinGuardar={editando}
                    onChange={(campo, valor) => actualizarContacto(fila.clave, campo, valor)}
                    onRemove={() => quitarContacto(fila.clave)}
                  />
                ))
              )}
            </div>

            {/* Acciones */}
            <div className="mt-8 pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-base text-on-surface-variant flex items-center gap-1.5">
                <span className="text-error font-bold">*</span> Campos obligatorios
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <Link
                  to={rutaVolver}
                  className="px-5 py-2.5 rounded text-sm font-medium text-on-surface hover:bg-surface-container-low transition-colors border border-outline-variant/40"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={guardando}
                  className="px-6 py-2.5 rounded text-sm font-semibold bg-primary hover:bg-primary/90 text-surface-container-lowest shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className={`material-symbols-outlined text-base ${guardando ? 'animate-spin' : ''}`}>
                    {guardando ? 'progress_activity' : 'save'}
                  </span>
                  <span>{guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Guardar jugador'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>

      {agregandoContacto && (
        <AddContactModal onClose={() => setAgregandoContacto(false)} onSubmit={agregarContacto} />
      )}
    </div>
  )
}

export default JugadorForm
