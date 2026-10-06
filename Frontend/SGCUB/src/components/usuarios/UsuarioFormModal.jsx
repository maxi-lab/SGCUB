import { useState } from 'react'
import { Button, Group, Modal, Select, Stack, Text, TextInput } from '@mantine/core'
import { collectErrorMessages } from '../personas/format'

const FIELDS = ['dni', 'first_name', 'last_name', 'email', 'role']

const emptyForm = { dni: '', first_name: '', last_name: '', email: '', role: null }

const parseErrors = (requestError) => {
  const data = requestError.response?.data
  if (!data || typeof data !== 'object') {
    return { general: requestError.response ? 'No se pudo guardar el usuario.' : 'No se pudo conectar con el servidor.' }
  }
  const errors = {}
  Object.entries(data).forEach(([field, messages]) => {
    const message = collectErrorMessages(messages).join(' ')
    if (!message) return
    if (FIELDS.includes(field)) errors[field] = message
    else errors.general = message
  })
  return errors
}

function UsuarioFormModal({ opened, onClose, onSubmit, usuario, roles, isSelf }) {
  const isEditing = Boolean(usuario)
  const [form, setForm] = useState(() => (usuario
    ? { dni: usuario.dni, first_name: usuario.first_name, last_name: usuario.last_name, email: usuario.email, role: usuario.role }
    : emptyForm))
  const [errors, setErrors] = useState({})
  const [isSaving, setIsSaving] = useState(false)

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
    setErrors((current) => ({ ...current, [field]: undefined }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setErrors({})
    try {
      const { dni, ...data } = form
      await onSubmit(isEditing ? data : { dni, ...data })
      onClose()
    } catch (requestError) {
      setErrors(parseErrors(requestError))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      title={<Text fw={700} size="xl">{isEditing ? 'Editar usuario' : 'Agregar nuevo usuario'}</Text>}
    >
      <form onSubmit={handleSubmit}>
        <Stack>
          <TextInput
            label="DNI"
            placeholder="Ej: 35.123.456"
            value={form.dni}
            onChange={(event) => setField('dni', event.currentTarget.value)}
            error={errors.dni}
            disabled={isEditing}
            description={isEditing ? 'El DNI no se puede modificar.' : 'Se usa para iniciar sesión.'}
            inputMode="numeric"
            required
            data-autofocus
          />
          <Group grow align="flex-start">
            <TextInput
              label="Nombre"
              placeholder="Ej: Marcelo"
              value={form.first_name}
              onChange={(event) => setField('first_name', event.currentTarget.value)}
              error={errors.first_name}
              required
            />
            <TextInput
              label="Apellido"
              placeholder="Ej: Benítez"
              value={form.last_name}
              onChange={(event) => setField('last_name', event.currentTarget.value)}
              error={errors.last_name}
              required
            />
          </Group>
          <TextInput
            label="Correo"
            placeholder="m.benitez@ejemplo.com"
            type="email"
            value={form.email}
            onChange={(event) => setField('email', event.currentTarget.value)}
            error={errors.email}
            required
          />
          <Select
            label="Rol"
            placeholder="Seleccione un rol..."
            data={roles}
            value={form.role}
            onChange={(value) => setField('role', value)}
            error={errors.role}
            disabled={isSelf}
            description={isSelf ? 'No podés cambiar tu propio rol.' : undefined}
            required
          />
          {!isEditing && (
            <Text size="sm" color="dimmed">
              La contraseña inicial será el DNI del usuario. Comunicásela para que pueda ingresar y cambiarla.
            </Text>
          )}
          {errors.general && <Text color="red" size="sm">{errors.general}</Text>}
          <Group position="right" mt="md">
            <Button type="button" variant="default" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSaving}>
              {isEditing ? 'Guardar cambios' : 'Confirmar y habilitar'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export default UsuarioFormModal
