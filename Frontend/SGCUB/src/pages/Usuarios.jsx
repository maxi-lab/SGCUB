import { useMemo, useState } from 'react'
import { PERMISSIONS } from '../auth/permissions'
import { useAuth } from '../auth/useAuth'
import PageHeader from '../components/shared/PageHeader'
import StatCard from '../components/shared/StatCard'
import ConfirmUsuarioModal from '../components/usuarios/ConfirmUsuarioModal'
import UsuarioFormModal from '../components/usuarios/UsuarioFormModal'
import UsuariosTable from '../components/usuarios/UsuariosTable'
import { formatDni } from '../components/usuarios/usuarioFormat'
import useUsuarios from '../hooks/useUsuarios'

const format = (value) => value.toLocaleString('es-AR')

export default function Usuarios() {
  const { user, hasPermission } = useAuth()
  const {
    usuarios,
    roles,
    isLoading,
    error,
    createUsuario,
    updateUsuario,
    deactivateUsuario,
    activateUsuario,
    resetPassword,
  } = useUsuarios()

  // Cada apertura usa una `key` nueva para que el modal arranque sin datos ni errores previos
  const [modalKey, setModalKey] = useState(0)
  const [form, setForm] = useState({ opened: false, usuario: null })
  const [confirmation, setConfirmation] = useState({ opened: false, action: null, usuario: null })
  const [notice, setNotice] = useState('')

  const totals = useMemo(() => {
    const active = usuarios.filter((usuario) => usuario.is_active)
    const assignedRoles = new Set(active.map((usuario) => usuario.role).filter(Boolean))
    return {
      active: format(active.length),
      assignedRoles: format(assignedRoles.size),
      inactive: format(usuarios.length - active.length),
    }
  }, [usuarios])

  const openForm = (usuario = null) => {
    setModalKey((key) => key + 1)
    setForm({ opened: true, usuario })
  }

  const openConfirmation = (action) => (usuario) => {
    setModalKey((key) => key + 1)
    setConfirmation({ opened: true, action, usuario })
  }

  const handleSubmitForm = async (data) => {
    if (form.usuario) {
      await updateUsuario(form.usuario.id, data)
      setNotice(`Se actualizaron los datos de ${data.first_name} ${data.last_name}.`)
      return
    }
    const created = await createUsuario(data)
    setNotice(`Se creó el usuario de ${created.full_name}. Su contraseña inicial es su DNI: ${formatDni(created.dni)}.`)
  }

  const confirmHandlers = {
    deactivate: async (usuario) => {
      await deactivateUsuario(usuario.id)
      setNotice(`${usuario.full_name} fue dado de baja.`)
    },
    activate: async (usuario) => {
      await activateUsuario(usuario.id)
      setNotice(`${usuario.full_name} fue reactivado.`)
    },
    resetPassword: async (usuario) => {
      await resetPassword(usuario.id)
      setNotice(`La contraseña de ${usuario.full_name} ahora es su DNI: ${formatDni(usuario.dni)}.`)
    },
  }

  return (
    <div className="w-full flex flex-col gap-5">
      <PageHeader
        breadcrumb={[{ label: 'Administración' }, { label: 'Usuarios' }]}
        title="Usuarios"
        actions={hasPermission(PERMISSIONS.createUsers) && (
          <button
            type="button"
            onClick={() => openForm()}
            className="inline-flex items-center gap-2 bg-primary text-on-primary hover:bg-primary/90 px-4 py-2 rounded shadow-sm font-label-lg text-base font-medium transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">person_add</span>
            <span className="text-xl"> Nuevo usuario</span>
          </button>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-10">
        <StatCard label="Usuarios activos" value={totals.active} icon="badge" tone="positive" />
        <StatCard label="Roles asignados" value={totals.assignedRoles} icon="manage_accounts" tone="neutral" />
        <StatCard label="Dados de baja" value={totals.inactive} icon="person_off" tone="muted" />
      </div>

      {notice && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-3 rounded-lg flex items-center gap-2.5" role="status">
          <span className="material-symbols-outlined text-emerald-700" aria-hidden="true">check_circle</span>
          <p className="text-base font-medium flex-1">{notice}</p>
          <button
            type="button"
            onClick={() => setNotice('')}
            className="p-1 rounded text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
            aria-label="Cerrar aviso"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
          </button>
        </div>
      )}

      <section aria-label="Usuarios">
        <UsuariosTable
          data={usuarios}
          roles={roles}
          isLoading={isLoading}
          error={error}
          currentUserId={user.id}
          canEdit={hasPermission(PERMISSIONS.editUsers)}
          onEdit={openForm}
          onResetPassword={openConfirmation('resetPassword')}
          onDeactivate={openConfirmation('deactivate')}
          onActivate={openConfirmation('activate')}
        />
      </section>

      <UsuarioFormModal
        key={`form-${modalKey}`}
        opened={form.opened}
        onClose={() => setForm((current) => ({ ...current, opened: false }))}
        onSubmit={handleSubmitForm}
        usuario={form.usuario}
        roles={roles}
        isSelf={form.usuario?.id === user.id}
      />

      <ConfirmUsuarioModal
        key={`confirm-${modalKey}`}
        opened={confirmation.opened}
        onClose={() => setConfirmation((current) => ({ ...current, opened: false }))}
        onConfirm={() => confirmHandlers[confirmation.action](confirmation.usuario)}
        action={confirmation.action}
        usuario={confirmation.usuario}
      />
    </div>
  )
}
