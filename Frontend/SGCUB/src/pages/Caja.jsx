import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getSocio } from '../api/socios'
import { getEstadoCuenta } from '../api/estadoCuenta'
import PagoForm from '../components/finanzas/PagoForm'
import PageHeader from '../components/shared/PageHeader'
import { ErrorFile, LoadingFile } from '../components/personas/FileStatus'

function Caja() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const socioId = searchParams.get('socio')
  const [carga, setCarga] = useState({ loading: true, socio: null, cuenta: null, error: null })

  useEffect(() => {
    let activo = true
    if (!socioId) {
      setCarga({ loading: false, socio: null, cuenta: null, error: 'Seleccioná un socio desde su estado de cuenta para registrar un pago.' })
      return () => { activo = false }
    }
    Promise.all([getSocio(socioId), getEstadoCuenta(socioId)])
      .then(([socio, cuenta]) => activo && setCarga({ loading: false, socio, cuenta, error: null }))
      .catch(() => activo && setCarga({ loading: false, socio: null, cuenta: null, error: 'No se pudo cargar la cuenta corriente del socio.' }))
    return () => { activo = false }
  }, [socioId])

  if (carga.loading) return <LoadingFile text="Cargando formulario de pago..." />
  if (carga.error || !carga.socio || !carga.cuenta) return <ErrorFile message={carga.error || 'No se encontró la cuenta corriente.'} backTo="/finanzas/estado-cuenta" backText="Volver a estado de cuenta" />

  return (
    <div className="w-full flex flex-col gap-5 pb-8">
      <PageHeader breadcrumb={[{ label: 'Finanzas' }, { label: 'Caja y cobros' }]} title="Registrar pago" />
      <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-5 shadow-sm">
        <PagoForm socio={carga.socio} cuenta={carga.cuenta} onCancel={() => navigate(`/finanzas/estado-cuenta?socio=${socioId}`)} onSuccess={() => {}} />
      </section>
    </div>
  )
}

export default Caja