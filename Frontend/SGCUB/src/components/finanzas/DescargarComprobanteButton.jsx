import { useState } from 'react'
import { descargarComprobantePdf } from '../../api/comprobantes'
import { SecondaryButton } from '../personas/tabs/parts'

function DescargarComprobanteButton({ comprobanteId }) {
  const [descargando, setDescargando] = useState(false)
  const [error, setError] = useState('')

  const descargar = async () => {
    setDescargando(true)
    setError('')
    try {
      await descargarComprobantePdf(comprobanteId)
    } catch {
      setError('No se pudo descargar el comprobante.')
    } finally {
      setDescargando(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <SecondaryButton icon="download" onClick={descargar} disabled={!comprobanteId || descargando}>
        {descargando ? 'Descargando...' : 'Descargar PDF'}
      </SecondaryButton>
      {error && <p className="text-sm text-error" role="alert">{error}</p>}
    </div>
  )
}

export default DescargarComprobanteButton
