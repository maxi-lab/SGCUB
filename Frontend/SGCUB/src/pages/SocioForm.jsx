import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/conf'
import { getSocio } from '../api/socios'
import PageHeader from '../components/shared/PageHeader'
import useSocio from '../hooks/useSocio'
import useGeneros from '../hooks/useGeneros'
import useLocalidades from '../hooks/useLocalidades'

const FORM_INICIAL = {
  nombre: '', apellido: '', dni: '', telefono: '', email: '', estado_socio: '',
  fecha_nacimiento: '', genero: '', genero_otro: '',
  domicilio_calle: '', domicilio_numero: '', domicilio_piso: '', domicilio_departamento: '',
  domicilio_entre_calle_1: '', domicilio_entre_calle_2: '', domicilio_barrio: '', domicilio_localidad: '',
}

// Orden en el que se recorren los campos para enfocar el primer error.
const CAMPOS_OBLIGATORIOS = [
  'dni', 'nombre', 'apellido', 'fecha_nacimiento', 'genero', 'telefono', 'email',
  'domicilio_calle', 'domicilio_numero', 'domicilio_localidad',
]

const INPUT_BASE = 'w-full h-11 px-3.5 bg-surface-container-low/60 rounded text-on-surface placeholder:text-outline text-base focus:outline-none focus:bg-surface-container-lowest transition-colors'
const INPUT_OK = 'border border-outline-variant/50 focus:border-primary'
const INPUT_ERROR = 'border-2 border-error focus:border-error'

const claseInput = (conError, extra = '') => `${INPUT_BASE} ${conError ? INPUT_ERROR : INPUT_OK} ${extra}`

const socioAFormulario = (socio) => ({
  nombre: socio.nombre || '',
  apellido: socio.apellido || '',
  dni: socio.dni ? String(socio.dni) : '',
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
  domicilio_localidad: socio.domicilio_localidad ? String(socio.domicilio_localidad) : '',
})

const formatearDni = (dni) => {
  const numero = Number(dni)
  return Number.isNaN(numero) ? dni : numero.toLocaleString('es-AR')
}

const formatearNumeroSocio = (numero) => `#${String(numero).padStart(4, '0')}`

const formatearFecha = (fecha) => {
  if (!fecha) return '—'
  const partes = String(fecha).split('-')
  return partes.length === 3 ? `${partes[2]}/${partes[1]}/${partes[0]}` : fecha
}

const mensajeDeError = (requestError, porDefecto) => {
  const errorData = requestError.response?.data
  if (!errorData) return porDefecto
  if (typeof errorData === 'string') return errorData
  if (errorData.detail) return errorData.detail
  return Object.entries(errorData)
    .map(([k, v]) => {
      if (Array.isArray(v)) {
        return `${k}: ${v.map((item) => (typeof item === 'object' ? JSON.stringify(item) : item)).join(', ')}`
      }
      return `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`
    })
    .join(' | ')
}

function validar(formulario, esGeneroOtro) {
  const errores = {}
  CAMPOS_OBLIGATORIOS.forEach((campo) => {
    if (!String(formulario[campo] ?? '').trim()) errores[campo] = 'Este campo es obligatorio.'
  })

  const dni = formulario.dni.trim()
  if (dni && !/^\d{7,8}$/.test(dni)) {
    errores.dni = 'Ingrese un DNI válido de 7 u 8 dígitos, sin puntos ni guiones.'
  }

  const email = formulario.email.trim()
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errores.email = 'Ingrese un correo electrónico válido.'
  }

  if (formulario.fecha_nacimiento && new Date(`${formulario.fecha_nacimiento}T00:00:00`) > new Date()) {
    errores.fecha_nacimiento = 'La fecha de nacimiento no puede ser futura.'
  }

  if (esGeneroOtro && !formulario.genero_otro.trim()) {
    errores.genero_otro = 'Especifique el género.'
  }

  return errores
}

function Campo({ id, label, requerido = false, opcional = false, hint, extra, error, children, className = '' }) {
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label
        htmlFor={id}
        className={`text-base flex items-center justify-between ${requerido ? 'font-semibold text-on-surface' : 'font-medium text-on-surface-variant'}`}
      >
        <span>
          {label}
          {requerido && <span className="text-error font-bold"> *</span>}
          {hint && <span className="text-sm font-normal text-on-surface-variant ml-1">{hint}</span>}
        </span>
        {opcional && <span className="text-sm text-outline font-normal">Opcional</span>}
        {extra}
      </label>
      {children}
      {error && <p id={`error-${id}`} className="text-sm text-error font-medium">{error}</p>}
    </div>
  )
}

function InputConIcono({ icono, conError, ...props }) {
  return (
    <div className="relative">
      <input className={claseInput(conError, 'pr-10')} aria-invalid={conError || undefined} {...props} />
      <span className={`material-symbols-outlined absolute right-3 top-3 text-base pointer-events-none ${conError ? 'text-error' : 'text-outline'}`}>
        {conError ? 'warning' : icono}
      </span>
    </div>
  )
}

function SelectConFlecha({ conError, children, ...props }) {
  return (
    <div className="relative">
      <select className={claseInput(conError, 'pr-10 appearance-none cursor-pointer')} aria-invalid={conError || undefined} {...props}>
        {children}
      </select>
      <span className="material-symbols-outlined absolute right-3 top-3 text-outline text-base pointer-events-none">expand_more</span>
    </div>
  )
}

function SeccionTitulo({ icono, titulo }) {
  return (
    <div className="flex items-center gap-2 pb-2 border-b border-outline-variant/20">
      <span className="material-symbols-outlined text-primary text-base">{icono}</span>
      <h3 className="text-base font-bold uppercase tracking-wider text-on-surface">{titulo}</h3>
    </div>
  )
}

function SocioForm() {
  const { id } = useParams()
  const editando = Boolean(id)
  const navigate = useNavigate()

  const { socios, crearSocio, modificarSocio } = useSocio()
  const { generos } = useGeneros()
  const { localidades } = useLocalidades()

  const [formularioEditado, setFormulario] = useState(FORM_INICIAL)
  const [socioOriginal, setSocioOriginal] = useState(null)
  const [cargando, setCargando] = useState(editando)
  const [errorCarga, setErrorCarga] = useState('')
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState('')
  const [estadosSocio, setEstadosSocio] = useState([])
  const [personaEncontrada, setPersonaEncontrada] = useState(null)
  const [buscandoPersona, setBuscandoPersona] = useState(false)

  useEffect(() => {
    if (!editando) return
    let activo = true
    getSocio(id)
      .then((socio) => {
        if (!activo) return
        setSocioOriginal(socio)
        setFormulario(socioAFormulario(socio))
      })
      .catch((requestError) => {
        if (activo) setErrorCarga(requestError.response?.data?.detail || 'No se pudo cargar el socio.')
      })
      .finally(() => activo && setCargando(false))
    api.get('padron/estado-socio/').then((res) => activo && setEstadosSocio(res.data)).catch(console.error)
    return () => { activo = false }
  }, [editando, id])

  // En el alta, Berisso es la localidad por defecto mientras no se elija otra.
  const localidadPorDefecto = editando
    ? ''
    : String(localidades.find((l) => l.nombre?.toLowerCase() === 'berisso')?.localidad_id ?? '')
  const formulario = useMemo(() => ({
    ...formularioEditado,
    domicilio_localidad: formularioEditado.domicilio_localidad || localidadPorDefecto,
  }), [formularioEditado, localidadPorDefecto])

  const generoOtroId = generos.find((g) => g.nombre === 'Otro')?.genero_id
  const esGeneroOtro = generoOtroId !== undefined && formulario.genero === String(generoOtroId)

  const proximoNumero = useMemo(() => {
    const numeros = socios.map((s) => parseInt(s.numero_socio, 10)).filter((n) => !Number.isNaN(n))
    return numeros.length ? formatearNumeroSocio(Math.max(...numeros) + 1) : '—'
  }, [socios])

  const socioDuplicado = useMemo(() => {
    const dni = formulario.dni.trim()
    if (!/^\d{7,8}$/.test(dni)) return null
    return socios.find((s) => String(s.dni) === dni && String(s.socio_id) !== String(id)) ?? null
  }, [socios, formulario.dni, id])

  const actualizarCampo = (campo, valor) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
    if (errores[campo]) setErrores((actuales) => ({ ...actuales, [campo]: undefined }))
    if (campo === 'dni') setPersonaEncontrada(null)
  }

  const bindInput = (campo) => ({
    id: campo,
    name: campo,
    value: formulario[campo],
    onChange: (event) => actualizarCampo(campo, event.target.value),
  })

  // Si el DNI pertenece a una persona ya cargada (ej. un jugador), completamos sus datos.
  const buscarPersonaPorDni = async () => {
    const dni = formulario.dni.trim()
    if (editando || !/^\d{7,8}$/.test(dni) || socioDuplicado) return
    setBuscandoPersona(true)
    try {
      const response = await api.get(`padron/persona/?dni=${dni}`)
      const persona = response.data?.[0]
      if (persona) {
        setFormulario((actual) => ({
          ...actual,
          nombre: persona.nombre || actual.nombre,
          apellido: persona.apellido || actual.apellido,
          telefono: persona.telefono || actual.telefono,
          email: persona.email || actual.email,
        }))
        setErrores((actuales) => ({ ...actuales, nombre: undefined, apellido: undefined, telefono: undefined, email: undefined }))
        setPersonaEncontrada(persona)
      }
    } catch (requestError) {
      console.error('Error al buscar persona:', requestError)
    } finally {
      setBuscandoPersona(false)
    }
  }

  const enfocarCampo = (campo) => {
    const elemento = document.getElementById(campo)
    if (!elemento) return
    elemento.scrollIntoView({ behavior: 'smooth', block: 'center' })
    elemento.focus({ preventScroll: true })
  }

  const guardar = async (event) => {
    event.preventDefault()
    setErrorGuardado('')

    const nuevosErrores = validar(formulario, esGeneroOtro)
    if (socioDuplicado) nuevosErrores.dni = nuevosErrores.dni ?? ''
    setErrores(nuevosErrores)

    const primerError = [...CAMPOS_OBLIGATORIOS, 'genero_otro'].find((campo) => campo in nuevosErrores)
    if (primerError) {
      enfocarCampo(primerError)
      return
    }

    const payload = { ...formulario }
    if (!payload.estado_socio) delete payload.estado_socio
    if (!esGeneroOtro) payload.genero_otro = ''

    setGuardando(true)
    try {
      const resultado = editando
        ? await modificarSocio(id, payload)
        : await crearSocio(payload)
      const socioId = resultado?.socio_id ?? id
      navigate(socioId ? `/padron/socios/${socioId}` : '/padron/socios')
    } catch (requestError) {
      setErrorGuardado(mensajeDeError(requestError, editando ? 'No se pudo modificar el socio.' : 'No se pudo agregar el socio.'))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setGuardando(false)
    }
  }

  const rutaVolver = editando ? `/padron/socios/${id}` : '/padron/socios'
  const nombreEditado = socioOriginal ? `${socioOriginal.nombre ?? ''} ${socioOriginal.apellido ?? ''}`.trim() : ''
  const dniConError = Boolean(errores.dni) || Boolean(socioDuplicado)

  if (cargando) {
    return (
      <div className="max-w-5xl mx-auto w-full py-16 flex flex-col items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined text-xl animate-spin">progress_activity</span>
        <p className="text-sm">Cargando datos del socio...</p>
      </div>
    )
  }

  if (errorCarga) {
    return (
      <div className="max-w-5xl mx-auto w-full space-y-4 pt-2">
        <Link to="/padron/socios" className="inline-flex items-center gap-1.5 text-xl font-medium text-on-surface-variant hover:text-primary px-3 py-1.5 rounded transition-colors bg-surface-container-lowest border border-outline-variant/30">
          <span className="material-symbols-outlined text-base">arrow_back</span>
          <span>Volver al padrón</span>
        </Link>
        <div className="bg-error-container text-on-error-container p-4 rounded-lg border border-error/30 flex items-center gap-2.5">
          <span className="material-symbols-outlined text-error text-base">error</span>
          <p className="text-sm font-medium">{errorCarga}</p>
        </div>
      </div>
    )
  }

  return (
    <div className= "mx-auto w-full space-y-6 pb-12">
      <PageHeader
        breadcrumb={[
          { label: 'Personas' },
          { label: 'Socios', to: '/padron/socios' },
          ...(editando && nombreEditado ? [{ label: nombreEditado, to: `/padron/socios/${id}` }] : []),
          { label: editando ? 'Editar' : 'Nuevo socio' },
        ]}
        title={editando ? 'Editar Socio' : 'Alta de Nuevo Socio'}
        actions={(
          <>
            <div className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/30 rounded flex items-center gap-2">
              <span className="text-base font-semibold text-outline uppercase tracking-wider">
                {editando ? 'N° de socio:' : 'Próximo N°:'}
              </span>
              <span className="font-mono text-base font-bold text-primary">
                {editando
                  ? (socioOriginal?.numero_socio ? formatearNumeroSocio(socioOriginal.numero_socio) : '—')
                  : proximoNumero}
              </span>
            </div>
            <div className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/30 rounded flex items-center gap-2">
              <span className="text-base font-semibold text-outline uppercase tracking-wider">Fecha de alta:</span>
              <span className="text-base font-semibold text-on-surface">
                {editando ? formatearFecha(socioOriginal?.fecha_alta) : 'Hoy (' + new Date().toLocaleDateString('es-AR') + ')'}
              </span>
            </div>
            <Link
              to={rutaVolver}
              className="inline-flex items-center gap-1.5 text-base font-medium text-on-surface-variant hover:text-primary px-3 py-1.5 rounded transition-colors bg-surface-container-lowest border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>{editando ? 'Volver a la ficha' : 'Volver al padrón'}</span>
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
            <p className="text-base font-bold">No se pudo guardar el socio</p>
            <p className="text-base text-on-error-container/80 mt-0.5 break-words">{errorGuardado}</p>
          </div>
        </div>
      )}

      {/* Tarjeta principal del formulario */}
      <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/30 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-outline-variant/20 bg-surface-container-low/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">badge</span>
            <h2 className="text-base font-semibold text-on-surface">Datos Personales y de Contacto</h2>
          </div>
        </div>

        <form id="form-socio" className="p-6 md:p-8" onSubmit={guardar} noValidate>
          <div className="space-y-6">
            {/* Datos personales */}
            <div className="flex flex-col gap-4">
              <SeccionTitulo icono="person" titulo="Datos Personales" />

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
                  <span className={`material-symbols-outlined absolute right-3 top-3 text-base pointer-events-none ${dniConError ? 'text-error' : personaEncontrada ? 'text-[#00875a]' : 'text-outline'} ${buscandoPersona ? 'animate-spin' : ''}`}>
                    {buscandoPersona ? 'progress_activity' : dniConError ? 'warning' : personaEncontrada ? 'check_circle' : 'fingerprint'}
                  </span>
                </div>

                {socioDuplicado && (
                  <div className="bg-error-container text-on-error-container p-3 rounded-lg border border-error/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm mt-1" role="alert">
                    <div className="flex items-start sm:items-center gap-2.5">
                      <div className="p-1 bg-error/10 text-error rounded shrink-0">
                        <span className="material-symbols-outlined text-base">error</span>
                      </div>
                      <div>
                        <p className="text-base font-bold text-on-error-container">
                          Ya existe un socio registrado con el DNI:{' '}
                          <span>
                            {formatearDni(socioDuplicado.dni)}
                          </span>
                        </p>
                        <p className="text-base text-on-error-container/80 mt-0.5">
                          El documento ingresado pertenece a{' '}
                          <strong>{`${socioDuplicado.nombre ?? ''} ${socioDuplicado.apellido ?? ''}`.trim()}</strong>
                          {' '}(Socio N° {socioDuplicado.numero_socio ? formatearNumeroSocio(socioDuplicado.numero_socio) : '—'}
                          {socioDuplicado.estado_socio_nombre ? ` - ${socioDuplicado.estado_socio_nombre}` : ''}).
                          {' '}No es posible duplicar legajos en el padrón.
                        </p>
                      </div>
                    </div>
                    <Link
                      to={`/padron/socios/${socioDuplicado.socio_id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-on-error-container  hover:opacity-90 rounded text-base font-semibold shrink-0 transition-opacity"
                    >
                      <span>Ver ficha existente</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </Link>
                  </div>
                )}

                {personaEncontrada && !socioDuplicado && (
                  <div className="bg-surface-container-low text-on-surface p-3 rounded-lg border border-outline-variant/40 flex items-center gap-2.5 mt-1">
                    <span className="material-symbols-outlined text-base text-[#00875a]">how_to_reg</span>
                    <p className="text-base">
                      <strong>{`${personaEncontrada.nombre ?? ''} ${personaEncontrada.apellido ?? ''}`.trim()}</strong>
                      {' '}ya está registrada en el padrón. Se completaron sus datos de contacto.
                    </p>
                  </div>
                )}
              </Campo>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <Campo id="nombre" label="Nombre" requerido error={errores.nombre}>
                  <InputConIcono {...bindInput('nombre')} type="text" placeholder="Ej: Marcos Agustín" icono="person" conError={Boolean(errores.nombre)} />
                </Campo>
                <Campo id="apellido" label="Apellido" requerido error={errores.apellido}>
                  <InputConIcono {...bindInput('apellido')} type="text" placeholder="Ej: Albarracín" icono="badge" conError={Boolean(errores.apellido)} />
                </Campo>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <Campo id="fecha_nacimiento" label="Fecha de Nacimiento" requerido error={errores.fecha_nacimiento}>
                  <input
                    {...bindInput('fecha_nacimiento')}
                    type="date"
                    max={new Date().toISOString().slice(0, 10)}
                    aria-invalid={Boolean(errores.fecha_nacimiento) || undefined}
                    className={claseInput(Boolean(errores.fecha_nacimiento))}
                  />
                </Campo>
                <Campo id="genero" label="Género" requerido error={errores.genero}>
                  <SelectConFlecha {...bindInput('genero')} conError={Boolean(errores.genero)}>
                    <option value="" disabled>Seleccione género...</option>
                    {generos.map((g) => (
                      <option key={g.genero_id} value={String(g.genero_id)}>{g.nombre}</option>
                    ))}
                  </SelectConFlecha>
                </Campo>
              </div>

              {esGeneroOtro && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <div className="hidden md:block" />
                  <Campo id="genero_otro" label="Especifique el género" requerido error={errores.genero_otro}>
                    <input {...bindInput('genero_otro')} type="text" placeholder="Ej: No binario" className={claseInput(Boolean(errores.genero_otro))} />
                  </Campo>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <Campo
                  id="telefono"
                  label="Teléfono / Móvil"
                  requerido
                  error={errores.telefono}
                  extra={(
                    <span className="text-base text-[#00875a] font-medium flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">chat</span> WhatsApp activo
                    </span>
                  )}
                >
                  <InputConIcono {...bindInput('telefono')} type="tel" placeholder="Ej: +54 221 459-2810" icono="call" conError={Boolean(errores.telefono)} />
                </Campo>
                <Campo id="email" label="Correo Electrónico" requerido error={errores.email}>
                  <InputConIcono {...bindInput('email')} type="email" placeholder="Ej: marcos.albarracin@ejemplo.com" icono="mail" conError={Boolean(errores.email)} />
                </Campo>
              </div>
            </div>

            {/* Domicilio */}
            <div className="flex flex-col gap-4 pt-4 border-t border-outline-variant/20">
              <SeccionTitulo icono="home_pin" titulo="Domicilio" />

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Campo id="domicilio_calle" label="Calle" requerido error={errores.domicilio_calle} className="sm:col-span-2 md:col-span-1">
                  <input {...bindInput('domicilio_calle')} type="text" placeholder="Ej: Calle 50" className={claseInput(Boolean(errores.domicilio_calle))} />
                </Campo>
                <Campo id="domicilio_numero" label="Número" requerido error={errores.domicilio_numero} className="sm:col-span-2 md:col-span-1">
                  <input {...bindInput('domicilio_numero')} type="text" placeholder="Ej: 1240" className={claseInput(Boolean(errores.domicilio_numero))} />
                </Campo>
                <Campo id="domicilio_piso" label="Piso" opcional>
                  <input {...bindInput('domicilio_piso')} type="text" placeholder="Ej: 3" className={claseInput(false)} />
                </Campo>
                <Campo id="domicilio_departamento" label="Departamento" opcional>
                  <input {...bindInput('domicilio_departamento')} type="text" placeholder="Ej: B" className={claseInput(false)} />
                </Campo>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <Campo id="domicilio_entre_calle_1" label="Entre calle 1" opcional>
                  <input {...bindInput('domicilio_entre_calle_1')} type="text" placeholder="Ej: Calle 19" className={claseInput(false)} />
                </Campo>
                <Campo id="domicilio_entre_calle_2" label="Entre calle 2" opcional>
                  <input {...bindInput('domicilio_entre_calle_2')} type="text" placeholder="Ej: Calle 20" className={claseInput(false)} />
                </Campo>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <Campo id="domicilio_barrio" label="Barrio" opcional>
                  <input {...bindInput('domicilio_barrio')} type="text" placeholder="Ej: Villa Zula / Barrio Universitario" className={claseInput(false)} />
                </Campo>
                <Campo id="domicilio_localidad" label="Localidad" requerido error={errores.domicilio_localidad}>
                  <SelectConFlecha {...bindInput('domicilio_localidad')} conError={Boolean(errores.domicilio_localidad)}>
                    <option value="" disabled>Seleccione localidad...</option>
                    {localidades.map((l) => (
                      <option key={l.localidad_id} value={String(l.localidad_id)}>{l.nombre}</option>
                    ))}
                  </SelectConFlecha>
                </Campo>
              </div>
            </div>

            {/* Estado institucional (solo edición) */}
            {editando && (
              <div className="flex flex-col gap-4 pt-4 border-t border-outline-variant/20">
                <SeccionTitulo icono="verified_user" titulo="Estado Institucional" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                  <Campo id="estado_socio" label="Estado" requerido>
                    <SelectConFlecha {...bindInput('estado_socio')} conError={false}>
                      <option value="" disabled>Seleccione estado...</option>
                      {estadosSocio.map((e) => (
                        <option key={e.estado_id} value={String(e.estado_id)}>{e.nombre}</option>
                      ))}
                    </SelectConFlecha>
                  </Campo>
                </div>
              </div>
            )}

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
                  <span>{guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Guardar'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default SocioForm
