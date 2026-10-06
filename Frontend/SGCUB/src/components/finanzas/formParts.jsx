import { useId } from 'react'

// Building blocks shared by the finance modals (payment and benefit forms) so they look the same

export const FIELD_CLASS = 'w-full h-10 bg-surface-container-low rounded-lg border text-base text-on-surface focus:outline-none focus:border-primary'

export const SUMMARY_GROUP_CLASS = 'mb-1 text-sm font-semibold uppercase tracking-wider text-outline'

export function StepSection({ step, title, description, disabled = false, children }) {
  const titleId = useId()
  return (
    <fieldset disabled={disabled} aria-labelledby={titleId} className={`min-w-0 flex flex-col gap-3 transition-opacity ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-3">
          <span className={`w-7 h-7 rounded-full text-sm font-bold flex items-center justify-center shrink-0 ${disabled ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary text-on-primary'}`} aria-hidden="true">
            {step}
          </span>
          <h3 id={titleId} className="text-lg font-bold text-on-surface">{title}</h3>
        </div>
        <p className="text-sm text-on-surface-variant pl-10">{description}</p>
      </div>
      {children}
    </fieldset>
  )
}

export function SummaryLine({ label, value, isTotal = false }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={isTotal ? 'text-base font-bold text-on-surface' : 'text-base text-on-surface-variant'}>{label}</span>
      <span className={isTotal ? 'text-lg font-bold text-on-surface' : 'text-base font-semibold text-on-surface'}>{value}</span>
    </div>
  )
}
