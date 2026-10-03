import { Fragment } from 'react'
import PageHeader from '../shared/PageHeader'

export default function CategoriaHeader({ breadcrumb = [], title, badge, metadata = [], actions }) {
  return (
    <>
      <PageHeader breadcrumb={breadcrumb} />

      <div className="bg-surface-container-lowest rounded-xl shadow-sm p-6 mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-32 bg-gradient-to-l from-primary-fixed/25 to-transparent pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start sm:items-center gap-4 flex-wrap sm:flex-nowrap">
            <div className="w-20 h-20 shrink-0 rounded-full bg-gradient-to-br from-primary-container to-secondary flex items-center justify-center text-on-primary shadow-md select-none">
              <span className="material-symbols-outlined text-[40px]" aria-hidden="true">sports_soccer</span>
            </div>

            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl text-on-surface font-bold tracking-tight">{title}</h1>
                {badge}
              </div>
              {metadata.length > 0 && (
                <div className="flex items-center gap-y-1 gap-x-4 flex-wrap text-base text-on-surface-variant">
                  {metadata.map((item, index) => (
                    <Fragment key={item.label}>
                      {index > 0 && <span className="text-outline-variant">•</span>}
                      <div className="flex items-center gap-1">
                        <span className="text-outline">{item.label}:</span>
                        <span className="text-on-surface font-medium">{item.value}</span>
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
