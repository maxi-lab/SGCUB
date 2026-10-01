import { useState } from 'react'
import { Button, Group, Modal, Text } from '@mantine/core'
import { getErrorMessage } from '../personas/format'
import { formatDni } from './usuarioFormat'

// Textos y estilo de cada acción que requiere confirmación
const ACTIONS = {
  deactivate: {
    title: '¿Dar de baja a este usuario?',
    description: 'Va a perder el acceso al sistema de inmediato y no podrá ingresar hasta que sea reactivado.',
    confirmLabel: 'Confirmar baja',
    color: 'red',
  },
  activate: {
    title: '¿Reactivar a este usuario?',
    description: 'Va a poder ingresar nuevamente con su contraseña actual.',
    confirmLabel: 'Reactivar',
    color: 'teal',
  },
  resetPassword: {
    title: '¿Resetear la contraseña?',
    description: 'La contraseña va a volver a ser su DNI. Comunicásela para que pueda ingresar y cambiarla.',
    confirmLabel: 'Resetear contraseña',
    color: 'blue',
  },
}

// Se remonta con otra `key` cada vez que se abre (ver Usuarios.jsx)
function ConfirmUsuarioModal({ opened, onClose, onConfirm, action, usuario }) {
  const [error, setError] = useState('')
  const [isConfirming, setIsConfirming] = useState(false)
  const config = ACTIONS[action]

  if (!config || !usuario) return null

  const handleConfirm = async () => {
    setIsConfirming(true)
    setError('')
    try {
      await onConfirm()
      onClose()
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudo completar la acción.'))
      setIsConfirming(false)
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} centered title={<Text fw={700} size="xl">{config.title}</Text>}>
      <div className="p-3 bg-surface-container-low rounded-lg space-y-1">
        <p className="text-base font-semibold text-on-surface">{usuario.full_name}</p>
        <p className="text-sm text-on-surface-variant">DNI: <span className="font-medium text-on-surface">{formatDni(usuario.dni)}</span></p>
        <p className="text-sm text-on-surface-variant">Correo: <span className="font-medium text-on-surface">{usuario.email || '—'}</span></p>
      </div>
      <Text size="md" mt="md">{config.description}</Text>
      {error && <Text color="red" size="sm" mt="md">{error}</Text>}
      <Group position="right" mt="xl">
        <Button variant="default" onClick={onClose} disabled={isConfirming}>
          Cancelar
        </Button>
        <Button color={config.color} onClick={handleConfirm} loading={isConfirming}>
          {config.confirmLabel}
        </Button>
      </Group>
    </Modal>
  )
}

export default ConfirmUsuarioModal
