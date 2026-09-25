import { Fragment } from 'react'
import PageHeader from '../shared/PageHeader'

const getInitials = (name, surname) =>
  `${name?.trim()?.[0] ?? ''}${surname?.trim()?.[0] ?? ''}`.toUpperCase() || '?'

export default function PersonHeader({ breadcrumb = [], name, surname, status, metadata = [], actions }) {
  const fullName = `${name ?? ''} ${surname ?? ''}`.trim() || 'Sin nombre'

  return (
    <>
      <PageHeader breadcrumb={breadcrumb} />

      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-l from-primary-fixed/25 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4 flex-wrap sm:flex-nowrap">
            <div className="relative shrink-0">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-container to-secondary flex items-center justify-center text-on-primary text-[28px] font-bold shadow-md select-none tracking-tight">
                {getInitials(name, surname)}
              </div>
              {status && (
                <span
                  className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-surface-container-lowest ${status.isActive ? 'bg-emerald-500' : 'bg-outline'}`}
                  title={`Estado: ${status.label}`}
                />
              )}
            </div>

            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl text-on-surface font-bold tracking-tight">{fullName}</h1>
                {status && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-semibold ${
                      status.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-surface-container-high text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{status.isActive ? 'check_circle' : 'block'}</span>
                    {status.label}
                  </span>
                )}
              </div>
              {metadata.length > 0 && (
                <div className="flex items-center gap-y-1 gap-x-4 flex-wrap text-base text-on-surface-variant">
                  {metadata.map((item, index) => (
                    <Fragment key={item.label}>
                      {index > 0 && <span className="text-outline-variant">•</span>}
                      <div className="flex items-center gap-1">
                        <span className="text-outline">{item.label}:</span>
                        <span className={item.highlighted ? 'font-mono font-semibold text-primary' : 'text-on-surface font-medium'}>
                          {item.value}
                        </span>
                      </div>
                    </Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>

          {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
        </div>
      </div>
    </>
  )
}

export function EditButton({ onClick, children = 'Editar legajo' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-2 h-10 px-4 bg-surface-container-low hover:bg-surface-container text-on-surface rounded-lg text-base font-semibold border border-outline-variant/40 shadow-sm transition-all cursor-pointer select-none"
    >
      <span className="material-symbols-outlined text-[20px] text-outline">edit</span>
      <span>{children}</span>
    </button>
  )
}

export function DeleteButton({ onClick, children = 'Eliminar' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-10 px-4 bg-error-container/40 text-error hover:bg-error hover:text-on-error transition-all rounded-lg text-base font-semibold focus:outline-none focus:ring-2 focus:ring-error shadow-sm cursor-pointer"
    >
      <span className="material-symbols-outlined text-[20px]">person_off</span>
      <span>{children}</span>
    </button>
  )
}
