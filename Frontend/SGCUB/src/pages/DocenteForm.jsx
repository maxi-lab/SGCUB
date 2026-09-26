import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api/conf'
import { deleteDocente, postDocente } from '../api/docentes'
import { postDocenteCategoria } from '../api/docenteCategoria'
import { CARGOS } from '../components/docentes/docentesUtils'
import { formatDni, getErrorMessage } from '../components/personas/format'
import PageHeader from '../components/shared/PageHeader'
import { CAMPOS_OBLIGATORIOS, FORM_INICIAL, claseInput, enfocarCampo, socioAFormulario, validar } from '../components/socios/socioForm'
import { Campo, SeccionDatosPersonales, SeccionDomicilio, SeccionTitulo } from '../components/socios/SocioFormFields'
import useCategorias from '../hooks/useCategorias'
import useDocentes from '../hooks/useDocentes'
import useGeneros from '../hooks/useGeneros'
import useLocalidades from '../hooks/useLocalidades'

const CAMPOS_ASIGNACION = ['cargo', 'categorias']

let ultimaClave = 0
const nuevaClave = () => `asignacion-${++ultimaClave}`
const nuevaAsignacion = () => ({ clave: nuevaClave(), cargo: '', categorias: [] })

const idCampoAsignacion = (fila, campo) => `${fila.clave}-${campo}`

const formatearLegajo = (legajo) => `#${String(legajo).padStart(4, '0')}`

const personaAFormulario = (persona) => {
  const datos = socioAFormulario(persona)
  delete datos.estado_socio
  return datos
}

function validarAsignaciones(asignaciones) {
  const errores = {}
  const cargos = new Set()
  asignaciones.forEach((fila) => {
    if (!fila.cargo) errores[idCampoAsignacion(fila, 'cargo')] = 'Seleccione un cargo.'
    else if (cargos.has(fila.cargo)) errores[idCampoAsignacion(fila, 'cargo')] = 'Este cargo ya fue agregado.'
    cargos.add(fila.cargo)
    if (fila.categorias.length === 0) errores[idCampoAsignacion(fila, 'categorias')] = 'Seleccione al menos una categoría.'
  })
  return errores
}

const ALTO_OPCION = 40
const OPCIONES_VISIBLES = 6
const SEPARACION = 4
const MARGEN_VIEWPORT = 16

function useDesplegable() {
  const [abierto, setAbierto] = useState(false)
  const [posicion, setPosicion] = useState(null)
  const boton = useRef(null)
  const lista = useRef(null)

  useLayoutEffect(() => {
    if (!abierto) return undefined
    const ubicar = () => {
      const rect = boton.current.getBoundingClientRect()
      const altoDeseado = ALTO_OPCION * OPCIONES_VISIBLES + 2
      const espacioAbajo = window.innerHeight - rect.bottom - SEPARACION - MARGEN_VIEWPORT
      const espacioArriba = rect.top - SEPARACION - MARGEN_VIEWPORT
      const abrirArriba = espacioAbajo < Math.min(altoDeseado, ALTO_OPCION * 3) && espacioArriba > espacioAbajo
      const base = { left: rect.left, width: rect.width }
      setPosicion(abrirArriba
        ? { ...base, bottom: window.innerHeight - rect.top + SEPARACION, maxHeight: Math.min(altoDeseado, espacioArriba) }
        : { ...base, top: rect.bottom + SEPARACION, maxHeight: Math.min(altoDeseado, Math.max(espacioAbajo, ALTO_OPCION)) })
    }
    ubicar()
    window.addEventListener('scroll', ubicar, true)
    window.addEventListener('resize', ubicar)
    return () => {
      window.removeEventListener('scroll', ubicar, true)
      window.removeEventListener('resize', ubicar)
    }
  }, [abierto])

  useEffect(() => {
    if (!abierto) return undefined
    const cerrarAlClickearFuera = (event) => {
      if (!boton.current?.contains(event.target) && !lista.current?.contains(event.target)) setAbierto(false)
    }
    const cerrarConEscape = (event) => event.key === 'Escape' && setAbierto(false)
    document.addEventListener('mousedown', cerrarAlClickearFuera)
    document.addEventListener('keydown', cerrarConEscape)
    return () => {
      document.removeEventListener('mousedown', cerrarAlClickearFuera)
      document.removeEventListener('keydown', cerrarConEscape)
    }
  }, [abierto])

  return { abierto, setAbierto, posicion, boton, lista }
}

function BotonDesplegable({ desplegable, id, conError, children }) {
  const { abierto, setAbierto, boton } = desplegable
  return (
    <>
      <button
        ref={boton}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-invalid={conError || undefined}
        onClick={() => setAbierto((actual) => !actual)}
        className={claseInput(conError, 'pr-10 text-left cursor-pointer truncate')}
      >
        {children}
      </button>
      <span className="material-symbols-outlined absolute right-3 top-3 text-outline text-base pointer-events-none">
        {abierto ? 'expand_less' : 'expand_more'}
      </span>
    </>
  )
}

function ListaDesplegable({ desplegable, multiple, children }) {
  const { abierto, posicion, lista } = desplegable
  if (!abierto || !posicion) return null
  return createPortal(
    <ul
      ref={lista}
      role="listbox"
      aria-multiselectable={multiple || undefined}
      style={{
        position: 'fixed',
        top: posicion.top,
        bottom: posicion.bottom,
        left: posicion.left,
        width: posicion.width,
        maxHeight: posicion.maxHeight,
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        zIndex: 1000,
        margin: 0,
        padding: 0,
        listStyle: 'none',
      }}
      className="bg-surface-container-lowest border border-outline-variant/50 rounded shadow-lg"
    >
      {children}
    </ul>,
    document.body,
  )
}

const claseOpcion = (deshabilitada) => `flex items-center justify-between gap-3 px-3.5 text-base w-full text-left ${
  deshabilitada ? 'text-outline cursor-not-allowed' : 'text-on-surface hover:bg-surface-container-low cursor-pointer'
}`

function SelectSimple({ id, opciones, valor, onChange, conError, placeholder }) {
  const desplegable = useDesplegable()
  const etiqueta = opciones.find((o) => o.valor === valor)?.etiqueta

  const elegir = (nuevoValor) => {
    onChange(nuevoValor)
    desplegable.setAbierto(false)
    desplegable.boton.current?.focus()
  }

  return (
    <div className="relative">
      <BotonDesplegable desplegable={desplegable} id={id} conError={conError}>
        {etiqueta ?? <span className="text-outline">{placeholder}</span>}
      </BotonDesplegable>

      <ListaDesplegable desplegable={desplegable}>
        {opciones.map((opcion) => {
          const seleccionada = opcion.valor === valor
          return (
            <li key={opcion.valor} role="option" aria-selected={seleccionada}>
              <button
                type="button"
                style={{ height: ALTO_OPCION }}
                onClick={() => elegir(opcion.valor)}
                className={`${claseOpcion(false)} ${seleccionada ? 'font-semibold' : ''}`}
              >
                <span className="truncate">{opcion.etiqueta}</span>
                {seleccionada && <span className="material-symbols-outlined text-base text-primary shrink-0">check</span>}
              </button>
            </li>
          )
        })}
      </ListaDesplegable>
    </div>
  )
}

function SelectMultiple({ id, opciones, seleccionadas, onToggle, conError, placeholder = 'Seleccione categorías...' }) {
  const desplegable = useDesplegable()
  const etiquetas = opciones.filter((o) => seleccionadas.includes(o.valor)).map((o) => o.etiqueta)

  return (
    <div className="relative">
      <BotonDesplegable desplegable={desplegable} id={id} conError={conError}>
        {etiquetas.length > 0 ? etiquetas.join(', ') : <span className="text-outline">{placeholder}</span>}
      </BotonDesplegable>

      <ListaDesplegable desplegable={desplegable} multiple>
        {opciones.length === 0 && (
          <li className="px-3.5 flex items-center text-base text-outline" style={{ height: ALTO_OPCION }}>No hay categorías cargadas.</li>
        )}
        {opciones.map((opcion) => {
          const seleccionada = seleccionadas.includes(opcion.valor)
          const deshabilitada = Boolean(opcion.deshabilitadaPor)
          return (
            <li key={opcion.valor} role="option" aria-selected={seleccionada} aria-disabled={deshabilitada || undefined}>
              <label style={{ height: ALTO_OPCION }} className={claseOpcion(deshabilitada)}>
                <span className="flex items-center gap-2.5 truncate">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-primary cursor-pointer disabled:cursor-not-allowed shrink-0"
                    checked={seleccionada}
                    disabled={deshabilitada}
                    onChange={() => onToggle(opcion.valor)}
                  />
                  {opcion.etiqueta}
                </span>
                {deshabilitada && <span className="text-sm shrink-0">Asignada como {opcion.deshabilitadaPor}</span>}
              </label>
            </li>
          )
        })}
      </ListaDesplegable>
    </div>
  )
}

function FilaAsignacion({ fila, indice, errores, categorias, categoriasOcupadas, onChange, onRemove, puedeQuitar }) {
  const error = (campo) => errores[idCampoAsignacion(fila, campo)]

  const alternarCategoria = (categoriaId) => {
    onChange('categorias', fila.categorias.includes(categoriaId)
      ? fila.categorias.filter((id) => id !== categoriaId)
      : [...fila.categorias, categoriaId])
  }

  return (
    <div className="rounded-lg border border-outline-variant/40 bg-surface-container-low/30 p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-sm font-bold flex items-center justify-center">{indice + 1}</span>
          <span className="text-base font-semibold text-on-surface">{fila.cargo || 'Nuevo cargo'}</span>
          {fila.categorias.length > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-sm font-medium">
              {fila.categorias.length} {fila.categorias.length === 1 ? 'categoría' : 'categorías'}
            </span>
          )}
        </div>
        {puedeQuitar && (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-sm font-medium text-error hover:bg-error-container/40 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">delete</span>
            Quitar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
        <Campo id={idCampoAsignacion(fila, 'cargo')} label="Cargo" requerido error={error('cargo')}>
          <SelectSimple
            id={idCampoAsignacion(fila, 'cargo')}
            opciones={CARGOS.map((cargo) => ({ valor: cargo, etiqueta: cargo }))}
            valor={fila.cargo}
            onChange={(valor) => onChange('cargo', valor)}
            conError={Boolean(error('cargo'))}
            placeholder="Seleccione cargo..."
          />
        </Campo>

        <Campo
          id={idCampoAsignacion(fila, 'categorias')}
          label="Categorías"
          requerido
          hint="(una o varias)"
          error={error('categorias')}
          className="md:col-span-2"
        >
          <SelectMultiple
            id={idCampoAsignacion(fila, 'categorias')}
            opciones={categorias.map((c) => ({
              valor: String(c.categoria_id),
              etiqueta: c.nombre,
              deshabilitadaPor: categoriasOcupadas[String(c.categoria_id)],
            }))}
            seleccionadas={fila.categorias}
            onToggle={alternarCategoria}
            conError={Boolean(error('categorias'))}
          />
        </Campo>
      </div>
    </div>
  )
}

function DocenteForm() {
  const navigate = useNavigate()

  const { docentes } = useDocentes()
  const { categorias } = useCategorias()
  const { generos } = useGeneros()
  const { localidades } = useLocalidades()

  const [formularioEditado, setFormulario] = useState(() => personaAFormulario(FORM_INICIAL))
  const [asignaciones, setAsignaciones] = useState(() => [nuevaAsignacion()])
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState('')
  const [personaEncontrada, setPersonaEncontrada] = useState(null)
  const [buscandoPersona, setBuscandoPersona] = useState(false)

  const localidadPorDefecto = String(localidades.find((l) => l.nombre?.toLowerCase() === 'berisso')?.localidad_id ?? '')
  const formulario = useMemo(() => ({
    ...formularioEditado,
    domicilio_localidad: formularioEditado.domicilio_localidad || localidadPorDefecto,
  }), [formularioEditado, localidadPorDefecto])

  const generoOtroId = generos.find((g) => g.nombre === 'Otro')?.genero_id
  const esGeneroOtro = generoOtroId !== undefined && formulario.genero === String(generoOtroId)

  const proximoLegajo = useMemo(() => {
    const legajos = docentes.map((d) => Number(d.legajo)).filter((n) => !Number.isNaN(n))
    return legajos.length ? Math.max(...legajos) + 1 : 1
  }, [docentes])

  const dniIngresado = formulario.dni.trim()
  const docenteDelDni = useMemo(() => {
    if (!/^\d{7,8}$/.test(dniIngresado)) return null
    return docentes.find((d) => String(d.persona_detalle?.dni) === dniIngresado) ?? null
  }, [docentes, dniIngresado])

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

  const buscarPersonaPorDni = async () => {
    if (!/^\d{7,8}$/.test(dniIngresado) || docenteDelDni) return
    setBuscandoPersona(true)
    try {
      const response = await api.get(`padron/persona/?dni=${dniIngresado}`)
      const persona = response.data?.[0]
      if (persona) {
        const datosPersona = personaAFormulario(persona)
        setFormulario((actual) => ({
          ...actual,
          ...Object.fromEntries(Object.entries(datosPersona).filter(([, valor]) => valor)),
        }))
        setErrores((actuales) => ({
          ...actuales,
          ...Object.fromEntries(CAMPOS_OBLIGATORIOS.filter((campo) => campo !== 'dni').map((campo) => [campo, undefined])),
        }))
        setPersonaEncontrada(persona)
      }
    } catch (requestError) {
      console.error('Error al buscar persona:', requestError)
    } finally {
      setBuscandoPersona(false)
    }
  }

  const actualizarAsignacion = (clave, campo, valor) => {
    setAsignaciones((actuales) => actuales.map((fila) => (fila.clave === clave ? { ...fila, [campo]: valor } : fila)))
    limpiarError(`${clave}-${campo}`)
  }

  const categoriasOcupadasFuera = (clave) => Object.fromEntries(
    asignaciones
      .filter((fila) => fila.clave !== clave)
      .flatMap((fila) => fila.categorias.map((categoriaId) => [categoriaId, fila.cargo || 'otro cargo'])),
  )

  const quitarAsignacion = (clave) => setAsignaciones((actuales) => actuales.filter((fila) => fila.clave !== clave))

  const guardar = async (event) => {
    event.preventDefault()
    setErrorGuardado('')

    const nuevosErrores = {
      ...validar(formulario, esGeneroOtro),
      ...validarAsignaciones(asignaciones),
    }
    if (docenteDelDni) nuevosErrores.dni = 'Esta persona ya está registrada como docente.'
    setErrores(nuevosErrores)

    const ordenCampos = [
      ...CAMPOS_OBLIGATORIOS, 'genero_otro',
      ...asignaciones.flatMap((fila) => CAMPOS_ASIGNACION.map((campo) => idCampoAsignacion(fila, campo))),
    ]
    const primerError = ordenCampos.find((campo) => nuevosErrores[campo])
    if (primerError) {
      enfocarCampo(primerError)
      return
    }

    const datosPersona = {
      ...formulario,
      genero_otro: esGeneroOtro ? formulario.genero_otro : '',
      email: formulario.email.trim() || null,
      domicilio_localidad: formulario.domicilio_localidad || null,
    }

    setGuardando(true)
    let docente = null
    try {
      const personaExistente = personaEncontrada
        ?? (await api.get(`padron/persona/?dni=${dniIngresado}`)).data?.[0]
      const personaId = personaExistente
        ? (await api.patch(`padron/persona/${personaExistente.persona_id}/`, datosPersona)).data.persona_id
        : (await api.post('padron/persona/', datosPersona)).data.persona_id

      docente = await postDocente({ persona: personaId, legajo: proximoLegajo })
      await Promise.all(asignaciones.flatMap((fila) => fila.categorias.map((categoriaId) => postDocenteCategoria({
        docente_id: docente.docente_id,
        categoria_id: Number(categoriaId),
        cargo: fila.cargo,
      }))))
      navigate(`/padron/docentes/${docente.docente_id}`)
    } catch (requestError) {
      if (docente) await deleteDocente(docente.docente_id).catch(() => {})
      setErrorGuardado(getErrorMessage(requestError, 'No se pudo agregar el docente.'))
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } finally {
      setGuardando(false)
    }
  }

  const dniConError = Boolean(errores.dni) || Boolean(docenteDelDni)
  const iconoDni = buscandoPersona ? 'progress_activity' : dniConError ? 'warning' : personaEncontrada ? 'check_circle' : 'fingerprint'
  const colorIconoDni = dniConError ? 'text-error' : personaEncontrada ? 'text-[#00875a]' : 'text-outline'

  return (
    <div className="mx-auto w-full space-y-6 pb-12">
      <PageHeader
        breadcrumb={[
          { label: 'Personas' },
          { label: 'Docentes', to: '/padron/docentes' },
          { label: 'Nuevo docente' },
        ]}
        title="Alta de Nuevo Docente"
        actions={(
          <>
            <div className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/30 rounded flex items-center gap-2">
              <span className="text-base font-semibold text-outline uppercase tracking-wider">Próximo legajo:</span>
              <span className="font-mono text-base font-bold text-primary">{formatearLegajo(proximoLegajo)}</span>
            </div>
            <div className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/30 rounded flex items-center gap-2">
              <span className="text-base font-semibold text-outline uppercase tracking-wider">Fecha de ingreso:</span>
              <span className="text-base font-semibold text-on-surface">{`Hoy (${new Date().toLocaleDateString('es-AR')})`}</span>
            </div>
            <Link
              to="/padron/docentes"
              className="inline-flex items-center gap-1.5 text-base font-medium text-on-surface-variant hover:text-primary px-3 py-1.5 rounded transition-colors bg-surface-container-lowest border border-outline-variant/30"
            >
              <span className="material-symbols-outlined text-base">arrow_back</span>
              <span>Volver al listado</span>
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
            <p className="text-base font-bold">No se pudo guardar el docente</p>
            <p className="text-base text-on-error-container/80 mt-0.5 break-words">{errorGuardado}</p>
          </div>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-lg border border-outline-variant/30 shadow-sm">
        <div className="px-6 py-4 rounded-t-lg border-b border-outline-variant/20 bg-surface-container-low/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-base">badge</span>
            <h2 className="text-base font-semibold text-on-surface">Datos Personales y Deportivos</h2>
          </div>
        </div>

        <form id="form-docente" className="p-6 md:p-8" onSubmit={guardar} noValidate>
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

                  {docenteDelDni && (
                    <div className="bg-error-container text-on-error-container p-3 rounded-lg border border-error/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm mt-1" role="alert">
                      <div className="flex items-start sm:items-center gap-2.5">
                        <div className="p-1 bg-error/10 text-error rounded shrink-0">
                          <span className="material-symbols-outlined text-base">error</span>
                        </div>
                        <p className="text-base">
                          <strong>{`${docenteDelDni.persona_detalle?.nombre ?? ''} ${docenteDelDni.persona_detalle?.apellido ?? ''}`.trim()}</strong>
                          {' '}(DNI {formatDni(docenteDelDni.persona_detalle?.dni)}) ya está registrado como docente
                          {' '}(Legajo {formatearLegajo(docenteDelDni.legajo)}).
                        </p>
                      </div>
                      <Link
                        to={`/padron/docentes/${docenteDelDni.docente_id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-on-error-container hover:opacity-90 rounded text-base font-semibold shrink-0 transition-opacity"
                      >
                        <span>Ver ficha existente</span>
                        <span className="material-symbols-outlined text-sm">arrow_forward</span>
                      </Link>
                    </div>
                  )}

                  {personaEncontrada && !docenteDelDni && (
                    <div className="bg-surface-container-low text-on-surface p-3 rounded-lg border border-outline-variant/40 flex items-center gap-2.5 mt-1">
                      <span className="material-symbols-outlined text-base text-[#00875a]">how_to_reg</span>
                      <p className="text-base">
                        <strong>{`${personaEncontrada.nombre ?? ''} ${personaEncontrada.apellido ?? ''}`.trim()}</strong>
                        {' '}ya está registrada en el padrón. Se completaron sus datos y se actualizarán al guardar.
                      </p>
                    </div>
                  )}
                </Campo>
              )}
            />

            <SeccionDomicilio bindInput={bindInput} errores={errores} localidades={localidades} />

            {/* Datos deportivos */}
            <div className="flex flex-col gap-4 pt-4 border-t border-outline-variant/20">
              <SeccionTitulo
                icono="sports_soccer"
                titulo="Datos Deportivos"
                extra={(
                  <button
                    type="button"
                    onClick={() => setAsignaciones((actuales) => [...actuales, nuevaAsignacion()])}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-semibold text-primary border border-primary/40 hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">add</span>
                    Agregar cargo
                  </button>
                )}
              />

              {asignaciones.map((fila, indice) => (
                <FilaAsignacion
                  key={fila.clave}
                  fila={fila}
                  indice={indice}
                  errores={errores}
                  categorias={categorias}
                  categoriasOcupadas={categoriasOcupadasFuera(fila.clave)}
                  puedeQuitar={asignaciones.length > 1}
                  onChange={(campo, valor) => actualizarAsignacion(fila.clave, campo, valor)}
                  onRemove={() => quitarAsignacion(fila.clave)}
                />
              ))}
            </div>

            {/* Acciones */}
            <div className="mt-8 pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-base text-on-surface-variant flex items-center gap-1.5">
                <span className="text-error font-bold">*</span> Campos obligatorios
              </div>
              <div className="flex items-center gap-3 self-end sm:self-auto">
                <Link
                  to="/padron/docentes"
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
                  <span>{guardando ? 'Guardando...' : 'Guardar docente'}</span>
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DocenteForm
